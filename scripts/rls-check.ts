import "dotenv/config";

import { Client } from "pg";

import { prisma } from "../src/server/db/client";
import { withTenant } from "../src/server/db/tenant";

/**
 * Proves that the RLS policies work for a role that is neither the table owner
 * nor a superuser. The app itself connects as the owner (and local development
 * as `postgres`), where PostgreSQL would otherwise bypass row security; this
 * check exercises the same policies through `vortex_rls_check`.
 *
 *   npm run db:rls
 *
 * It creates and drops a temporary NOLOGIN role, so it needs CREATEROLE (a
 * local `postgres` connection has it). Use it in CI after `prisma migrate
 * deploy` and `db:seed`.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

type Counts = { orders: number; audit: number };

async function countsWithTenant(client: Client, organizationId: string): Promise<Counts> {
  await client.query("SELECT set_config('app.current_organization_id', $1, false)", [
    organizationId,
  ]);
  const result = await client.query<Counts>(
    `SELECT
       (SELECT COUNT(*)::int FROM orders) AS orders,
       (SELECT COUNT(*)::int FROM audit_logs) AS audit`,
  );
  return result.rows[0]!;
}

async function main() {
  const organizations = await prisma.organization.findMany({
    where: { isDemo: true },
    orderBy: { slug: "asc" },
    select: { id: true, slug: true },
  });

  if (organizations.length < 2) {
    throw new Error("Seed the demo tenants first with `npm run db:seed`.");
  }

  const [first, second] = organizations as [(typeof organizations)[number], (typeof organizations)[number]];

  const expectedRows = await Promise.all(
    organizations.map(async (organization) => {
      const [counts] = await withTenant(organization.id, (db) =>
        db.$queryRaw<Array<{ orders: number; audit: number }>>`
          SELECT
            (SELECT COUNT(*)::int FROM orders WHERE organization_id = ${organization.id}) AS orders,
            (SELECT COUNT(*)::int FROM audit_logs WHERE organization_id = ${organization.id}) AS audit
        `,
      );
      return { organization_id: organization.id, ...counts! };
    }),
  );
  const expected = new Map(expectedRows.map((row) => [row.organization_id, row]));

  const client = new Client({ connectionString });
  await client.connect();

  const results: Array<{ name: string; ok: boolean; detail: string }> = [];
  function check(name: string, ok: boolean, detail: string) {
    results.push({ name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
  }

  try {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vortex_rls_check') THEN
          CREATE ROLE vortex_rls_check NOLOGIN;
        END IF;
      END
      $$;
    `);
    await client.query("GRANT USAGE ON SCHEMA public TO vortex_rls_check");
    await client.query(
      "GRANT SELECT ON orders, order_items, customers, products, categories, traffic_daily, audit_logs TO vortex_rls_check",
    );
    await client.query("SET ROLE vortex_rls_check");

    const firstExpected = expected.get(first.id);
    const secondExpected = expected.get(second.id);
    if (!firstExpected || !secondExpected) {
      throw new Error("The demo organizations have no seeded orders.");
    }

    const firstCounts = await countsWithTenant(client, first.id);
    check(
      `tenant A only sees its own rows (${first.slug})`,
      firstCounts.orders === firstExpected.orders && firstCounts.audit === firstExpected.audit,
      `${firstCounts.orders} orders / ${firstCounts.audit} audit rows`,
    );

    const secondCounts = await countsWithTenant(client, second.id);
    check(
      `tenant B only sees its own rows (${second.slug})`,
      secondCounts.orders === secondExpected.orders && secondCounts.audit === secondExpected.audit,
      `${secondCounts.orders} orders / ${secondCounts.audit} audit rows`,
    );

    await client.query("SELECT set_config('app.current_organization_id', $1, false)", [first.id]);
    const crossTenant = await client.query<{ orders: number }>(
      "SELECT COUNT(*)::int AS orders FROM orders WHERE organization_id = $1",
      [second.id],
    );
    check(
      "an explicit cross-tenant predicate returns zero rows",
      crossTenant.rows[0]?.orders === 0,
      `${crossTenant.rows[0]?.orders ?? "?"} rows`,
    );

    await client.query("SELECT set_config('app.current_organization_id', '', false)");
    const noTenant = await client.query<{ orders: number }>("SELECT COUNT(*)::int AS orders FROM orders");
    check(
      "no tenant setting fails closed",
      noTenant.rows[0]?.orders === 0,
      `${noTenant.rows[0]?.orders ?? "?"} rows`,
    );

    await client.query("RESET ROLE");

    await client.query("BEGIN");
    try {
      await client.query("DELETE FROM audit_logs WHERE id = (SELECT id FROM audit_logs LIMIT 1)");
      await client.query("ROLLBACK");
      check("audit_logs rejects DELETE", false, "the delete unexpectedly succeeded");
    } catch (error) {
      await client.query("ROLLBACK");
      const message = error instanceof Error ? error.message : String(error);
      check("audit_logs rejects DELETE", message.includes("append-only"), message.split("\n")[0]!);
    }
  } finally {
    await client.query("RESET ROLE").catch(() => undefined);
    await client
      .query("REVOKE ALL ON orders, order_items, customers, products, categories, traffic_daily, audit_logs FROM vortex_rls_check")
      .catch(() => undefined);
    await client.query("REVOKE ALL ON SCHEMA public FROM vortex_rls_check").catch(() => undefined);
    await client.query("DROP ROLE IF EXISTS vortex_rls_check").catch(() => undefined);
    await client.end();
    await prisma.$disconnect();
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
