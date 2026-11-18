import type { Prisma } from "@/generated/prisma/client";
import { withTenant } from "@/server/db/tenant";

type AuditEntry = {
  organizationId: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Append-only audit trail. Phase 7 adds the read side and diffs; Phase 2 writes
 * the entries that already matter for authentication and onboarding.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  await withTenant(entry.organizationId, (db) =>
    db.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorId: entry.actorId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        before: entry.before === undefined ? undefined : (entry.before as Prisma.InputJsonValue),
        after: entry.after === undefined ? undefined : (entry.after as Prisma.InputJsonValue),
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
      },
      select: { id: true },
    }),
  );
}
