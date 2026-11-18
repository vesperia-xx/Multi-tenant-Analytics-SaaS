import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { ListResult } from "@/lib/validation/table";
import type { AuditParams } from "@/lib/validation/audit";
import { prisma } from "@/server/db/client";

export type AuditListRow = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  ip: string | null;
  createdAt: string;
  hasDiff: boolean;
};

export type AuditDetail = AuditListRow & {
  userAgent: string | null;
  before: unknown;
  after: unknown;
};

function auditWhere(
  organizationId: string,
  timezone: string,
  params: AuditParams,
): Prisma.Sql {
  const needle = params.q?.trim() || null;

  return Prisma.sql`
    a.organization_id = ${organizationId}
    AND (
      ${needle}::text IS NULL
      OR a.action ILIKE '%' || ${needle} || '%'
      OR a.resource_type ILIKE '%' || ${needle} || '%'
      OR u.name ILIKE '%' || ${needle} || '%'
      OR u.email ILIKE '%' || ${needle} || '%'
    )
    AND (${params.action ?? null}::text IS NULL OR a.action = ${params.action ?? null})
    AND (${params.from ?? null}::date IS NULL OR a.created_at >= (${params.from ?? null}::date AT TIME ZONE ${timezone}))
    AND (${params.to ?? null}::date IS NULL OR a.created_at < ((${params.to ?? null}::date + 1) AT TIME ZONE ${timezone}))
  `;
}

type RawRow = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  ip: string | null;
  created_at: Date;
  has_diff: boolean;
};

function toRow(row: RawRow): AuditListRow {
  return {
    id: row.id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    ip: row.ip,
    createdAt: row.created_at.toISOString(),
    hasDiff: row.has_diff,
  };
}

const auditSelect = Prisma.sql`
  a.id,
  a.action,
  a.resource_type,
  a.resource_id,
  a.ip,
  a.created_at,
  u.name AS actor_name,
  u.email AS actor_email,
  (a.before IS NOT NULL OR a.after IS NOT NULL) AS has_diff
`;

export async function listAuditLogs(
  organizationId: string,
  timezone: string,
  params: AuditParams,
): Promise<ListResult<AuditListRow>> {
  const order = params.direction === "asc" ? "ASC" : "DESC";
  const offset = (params.page - 1) * params.pageSize;

  const rows = await prisma.$queryRaw<Array<RawRow & { total_count: number }>>`
    SELECT ${auditSelect}, COUNT(*) OVER ()::int AS total_count
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.actor_id
    WHERE ${auditWhere(organizationId, timezone, params)}
    ORDER BY a.created_at ${Prisma.raw(order)}, a.id ASC
    LIMIT ${params.pageSize} OFFSET ${offset}
  `;

  return {
    rows: rows.map(toRow),
    total: rows[0]?.total_count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function getAuditLog(
  organizationId: string,
  id: string,
): Promise<AuditDetail | null> {
  const [row] = await prisma.$queryRaw<
    Array<RawRow & { user_agent: string | null; before: Prisma.JsonValue | null; after: Prisma.JsonValue | null }>
  >`
    SELECT ${auditSelect}, a.user_agent, a.before, a.after
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.actor_id
    WHERE a.organization_id = ${organizationId} AND a.id = ${id}
    LIMIT 1
  `;

  if (!row) return null;

  return {
    ...toRow(row),
    userAgent: row.user_agent,
    before: row.before,
    after: row.after,
  };
}

export async function listAuditActions(organizationId: string): Promise<string[]> {
  const rows = await prisma.auditLog.findMany({
    where: { organizationId },
    select: { action: true },
    distinct: ["action"],
    orderBy: { action: "asc" },
  });

  return rows.map((row) => row.action);
}
