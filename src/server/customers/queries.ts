import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import type { CustomersParams, ListResult } from "@/lib/validation/table";

export type CustomerListRow = {
  id: string;
  name: string;
  email: string;
  country: string | null;
  ordersCount: number;
  totalSpentCents: number;
  createdAt: string;
};

const sortColumns: Record<CustomersParams["sort"], string> = {
  createdAt: "c.created_at",
  name: "c.name",
  ordersCount: "orders_count",
  totalSpent: "total_spent_cents",
};

type RawRow = {
  id: string;
  name: string;
  email: string;
  country: string | null;
  orders_count: number;
  total_spent_cents: bigint | number | string;
  created_at: Date;
};

function toNumber(value: bigint | number | string): number {
  return typeof value === "string" ? Number(value) : Number(value);
}

function customersWhere(organizationId: string, params: CustomersParams): Prisma.Sql {
  const needle = params.q?.trim() || null;

  return Prisma.sql`
    c.organization_id = ${organizationId}
    AND (
      ${needle}::text IS NULL
      OR c.name ILIKE '%' || ${needle} || '%'
      OR c.email ILIKE '%' || ${needle} || '%'
    )
    AND (${params.country ?? null}::text IS NULL OR c.country = ${params.country ?? null})
  `;
}

function customersOrderBy(params: CustomersParams): Prisma.Sql {
  return Prisma.raw(
    `${sortColumns[params.sort]} ${params.direction === "asc" ? "ASC" : "DESC"}, c.id ASC`,
  );
}

function toRow(row: RawRow): CustomerListRow {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    country: row.country,
    ordersCount: row.orders_count,
    totalSpentCents: toNumber(row.total_spent_cents),
    createdAt: row.created_at.toISOString(),
  };
}

const customerSelect = Prisma.sql`
  c.id,
  c.name,
  c.email,
  c.country,
  COUNT(o.id) FILTER (WHERE o.status <> 'CANCELLED')::int AS orders_count,
  COALESCE(SUM(o.total_cents) FILTER (WHERE o.status = 'PAID'), 0)::bigint AS total_spent_cents,
  c.created_at
`;

const customerFrom = Prisma.sql`
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id AND o.organization_id = c.organization_id
`;

const customerGroupBy = Prisma.sql`GROUP BY c.id, c.name, c.email, c.country, c.created_at`;

export async function listCustomers(
  organizationId: string,
  params: CustomersParams,
): Promise<ListResult<CustomerListRow>> {
  const offset = (params.page - 1) * params.pageSize;

  const rows = await prisma.$queryRaw<Array<RawRow & { total_count: number }>>`
    SELECT ${customerSelect}, COUNT(*) OVER ()::int AS total_count
    ${customerFrom}
    WHERE ${customersWhere(organizationId, params)}
    ${customerGroupBy}
    ORDER BY ${customersOrderBy(params)}
    LIMIT ${params.pageSize} OFFSET ${offset}
  `;

  return {
    rows: rows.map(toRow),
    total: rows[0]?.total_count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function exportCustomers(
  organizationId: string,
  params: CustomersParams,
  limit = 10_000,
): Promise<CustomerListRow[]> {
  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT ${customerSelect}
    ${customerFrom}
    WHERE ${customersWhere(organizationId, params)}
    ${customerGroupBy}
    ORDER BY ${customersOrderBy(params)}
    LIMIT ${limit}
  `;

  return rows.map(toRow);
}

/** Distinct countries for the filter dropdown, from the data itself. */
export async function listCountries(organizationId: string): Promise<string[]> {
  const rows = await prisma.customer.findMany({
    where: { organizationId, NOT: { country: null } },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });

  return rows.map((row) => row.country as string);
}
