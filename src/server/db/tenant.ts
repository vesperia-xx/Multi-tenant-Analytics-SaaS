import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "./client";

/**
 * RLS is the second fence: every tenant query runs inside a transaction that
 * sets `app.current_organization_id`, and the policies on the data tables read
 * that setting. A query that forgets its `organization_id` predicate therefore
 * sees zero rows instead of another tenant's rows.
 *
 * `set_config(..., true)` is transaction-local, so a pooled connection cannot
 * leak one tenant's context into the next request.
 */
export const TENANT_SETTING = "app.current_organization_id";
export const AUDIT_MAINTENANCE_SETTING = "app.allow_audit_maintenance";

export type TenantDb = Prisma.TransactionClient;

export async function setTenantContext(db: TenantDb, organizationId: string): Promise<void> {
  if (!organizationId) throw new Error("A tenant id is required to set the RLS context.");
  await db.$executeRaw`SELECT set_config(${TENANT_SETTING}, ${organizationId}, true)`;
}

export async function withTenant<T>(
  organizationId: string,
  run: (db: TenantDb) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await setTenantContext(tx, organizationId);
      return run(tx);
    },
    { maxWait: 5_000, timeout: 30_000 },
  );
}

/**
 * Only the seed and the demo reset use this. The trigger on `audit_logs` stays
 * append-only for every other code path, including a direct SQL client.
 */
export async function allowAuditMaintenance(db: TenantDb): Promise<void> {
  await db.$executeRaw`SELECT set_config(${AUDIT_MAINTENANCE_SETTING}, 'on', true)`;
}
