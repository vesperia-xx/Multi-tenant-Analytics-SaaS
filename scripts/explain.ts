import "dotenv/config";

import { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/server/db/client";
import { withTenant } from "../src/server/db/tenant";

/**
 * Prints the plans PostgreSQL actually chooses for the dashboard and table
 * query shapes against the seeded dataset.
 *
 *   npm run db:explain
 *
 * It is a report, not a benchmark gate: plan choices depend on row counts,
 * statistics and the machine. Re-run it after a schema or index change and
 * paste the numbers into docs/architecture.md.
 */

type PlanNode = {
  "Node Type": string;
  "Relation Name"?: string;
  "Index Name"?: string;
  "Actual Total Time"?: number;
  Plans?: PlanNode[];
};

type ExplainDocument = {
  Plan: PlanNode;
  "Planning Time": number;
  "Execution Time": number;
};

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function collectIndexes(node: PlanNode, found = new Set<string>()): Set<string> {
  if (node["Index Name"]) found.add(node["Index Name"]);
  for (const child of node.Plans ?? []) collectIndexes(child, found);
  return found;
}

function collectSeqScans(node: PlanNode, found: string[] = []): string[] {
  if (node["Node Type"] === "Seq Scan" && node["Relation Name"]) {
    found.push(node["Relation Name"]);
  }
  for (const child of node.Plans ?? []) collectSeqScans(child, found);
  return found;
}

async function explain(organizationId: string, label: string, query: Prisma.Sql): Promise<void> {
  const rows = await withTenant(organizationId, (db) =>
    db.$queryRaw<Array<{ "QUERY PLAN": ExplainDocument | ExplainDocument[] }>>(
      Prisma.sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`,
    ),
  );

  const raw = rows[0]?.["QUERY PLAN"];
  const document = Array.isArray(raw) ? raw[0] : raw;
  if (!document) {
    console.log(`${label}: no plan returned`);
    return;
  }

  const indexes = [...collectIndexes(document.Plan)];
  const seqScans = collectSeqScans(document.Plan);
  console.log(
    `${label}: ${document["Execution Time"].toFixed(2)} ms execution · ${document["Planning Time"].toFixed(2)} ms planning`,
  );
  console.log(`  indexes: ${indexes.length > 0 ? indexes.join(", ") : "none"}`);
  console.log(`  seq scans: ${seqScans.length > 0 ? seqScans.join(", ") : "none"}`);
}

async function main() {
  const organization = await prisma.organization.findFirst({
    where: { isDemo: true },
    orderBy: { slug: "asc" },
    select: { id: true, name: true, slug: true, timezone: true },
  });

  if (!organization) {
    throw new Error("Seed the demo tenants first with `npm run db:seed`.");
  }

  const now = new Date();
  const toDay = isoDay(now);
  const fromDay = isoDay(new Date(now.getTime() - 29 * 86_400_000));
  const previousToDay = isoDay(new Date(now.getTime() - 30 * 86_400_000));
  const previousFromDay = isoDay(new Date(now.getTime() - 59 * 86_400_000));

  console.log(`Workspace: ${organization.name} (${organization.slug})`);
  console.log(`Window: ${fromDay} → ${toDay} (${organization.timezone})`);
  console.log("");

  await explain(
    organization.id,
    "dashboard totals (current + previous)",
    Prisma.sql`
      WITH current_window AS (
        SELECT
          COALESCE(SUM(total_cents) FILTER (WHERE status = 'PAID'), 0)::bigint AS revenue_cents,
          COUNT(*) FILTER (WHERE status = 'PAID')::int AS paid_orders,
          ROUND(AVG(total_cents) FILTER (WHERE status = 'PAID'))::bigint AS average_order_cents,
          COUNT(*) FILTER (WHERE status <> 'CANCELLED')::int AS orders
        FROM orders
        WHERE organization_id = ${organization.id}
          AND placed_at >= (${fromDay}::date AT TIME ZONE ${organization.timezone})
          AND placed_at < ((${toDay}::date + 1) AT TIME ZONE ${organization.timezone})
      ),
      previous_window AS (
        SELECT
          COALESCE(SUM(total_cents) FILTER (WHERE status = 'PAID'), 0)::bigint AS revenue_cents,
          COUNT(*) FILTER (WHERE status = 'PAID')::int AS paid_orders,
          ROUND(AVG(total_cents) FILTER (WHERE status = 'PAID'))::bigint AS average_order_cents,
          COUNT(*) FILTER (WHERE status <> 'CANCELLED')::int AS orders
        FROM orders
        WHERE organization_id = ${organization.id}
          AND placed_at >= (${previousFromDay}::date AT TIME ZONE ${organization.timezone})
          AND placed_at < ((${previousToDay}::date + 1) AT TIME ZONE ${organization.timezone})
      )
      SELECT * FROM current_window, previous_window
    `,
  );

  await explain(
    organization.id,
    "revenue series (30d, day buckets)",
    Prisma.sql`
      SELECT
        date_trunc('day', o.placed_at AT TIME ZONE ${organization.timezone}) AS bucket,
        COALESCE(SUM(o.total_cents) FILTER (WHERE o.status = 'PAID'), 0)::bigint AS revenue_cents,
        COUNT(*) FILTER (WHERE o.status <> 'CANCELLED')::int AS orders
      FROM orders o
      WHERE o.organization_id = ${organization.id}
        AND o.placed_at >= (${fromDay}::date AT TIME ZONE ${organization.timezone})
        AND o.placed_at < ((${toDay}::date + 1) AT TIME ZONE ${organization.timezone})
      GROUP BY 1
      ORDER BY 1
    `,
  );

  await explain(
    organization.id,
    "orders page (status + date, 10 rows)",
    Prisma.sql`
      SELECT
        o.id, o.number, o.status::text, o.total_cents, o.placed_at,
        c.name, c.email, COUNT(*) OVER ()::int AS total_count
      FROM orders o
      JOIN customers c ON c.id = o.customer_id AND c.organization_id = o.organization_id
      WHERE o.organization_id = ${organization.id}
        AND o.status = 'PAID'
        AND o.placed_at >= (${fromDay}::date AT TIME ZONE ${organization.timezone})
        AND o.placed_at < ((${toDay}::date + 1) AT TIME ZONE ${organization.timezone})
      ORDER BY o.placed_at DESC, o.id ASC
      LIMIT 10
    `,
  );

  await explain(
    organization.id,
    "orders search (trigram, 10 rows)",
    Prisma.sql`
      SELECT o.id, o.number, c.name, COUNT(*) OVER ()::int AS total_count
      FROM orders o
      JOIN customers c ON c.id = o.customer_id AND c.organization_id = o.organization_id
      WHERE o.organization_id = ${organization.id}
        AND o.number ILIKE '%ORD-1%'
      ORDER BY o.placed_at DESC, o.id ASC
      LIMIT 10
    `,
  );

  await explain(
    organization.id,
    "customers page (spend aggregate, 10 rows)",
    Prisma.sql`
      SELECT
        c.id, c.name, c.email, c.country,
        COUNT(o.id) FILTER (WHERE o.status <> 'CANCELLED')::int AS orders_count,
        COALESCE(SUM(o.total_cents) FILTER (WHERE o.status = 'PAID'), 0)::bigint AS total_spent_cents,
        c.created_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id AND o.organization_id = c.organization_id
      WHERE c.organization_id = ${organization.id}
      GROUP BY c.id, c.name, c.email, c.country, c.created_at
      ORDER BY total_spent_cents DESC, c.id ASC
      LIMIT 10
    `,
  );

  await explain(
    organization.id,
    "audit action filter (10 rows)",
    Prisma.sql`
      SELECT a.id, a.action, a.created_at
      FROM audit_logs a
      WHERE a.organization_id = ${organization.id}
        AND a.action = 'report.exported'
      ORDER BY a.created_at DESC, a.id ASC
      LIMIT 10
    `,
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect().catch(() => undefined);
  process.exitCode = 1;
});
