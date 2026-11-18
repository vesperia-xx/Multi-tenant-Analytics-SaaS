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
  total_count: number;
};

function toNumber(value: bigint | number | string): number {
  return typeof value === "string" ? Number(value) : Number(value);
}

export async function listCustomers(
  organizationId: string,
  params: CustomersParams,
): Promise<ListResult<CustomerListRow>> {
  const { q, country, sort, direction, page, pageSize } = params;
  const offset = (page - 1) * pageSize;
  const needle = q?.trim() || null;
  const orderBy = Prisma.raw(
    `${sortColumns[sort]} ${direction === "asc" ? "ASC" : "DESC"}, c.id ASC`,
  );

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      c.id,
      c.name,
      c.email,
      c.country,
      COUNT(o.id) FILTER (WHERE o.status <> 'CANCELLED')::int AS orders_count,
      COALESCE(SUM(o.total_cents) FILTER (WHERE o.status = 'PAID'), 0)::bigint AS total_spent_cents,
      c.created_at,
      COUNT(*) OVER ()::int AS total_count
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id AND o.organization_id = c.organization_id
    WHERE c.organization_id = ${organizationId}
      AND (
        ${needle}::text IS NULL
        OR c.name ILIKE '%' || ${needle} || '%'
        OR c.email ILIKE '%' || ${needle} || '%'
      )
      AND (${country ?? null}::text IS NULL OR c.country = ${country ?? null})
    GROUP BY c.id, c.name, c.email, c.country, c.created_at
    ORDER BY ${orderBy}
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      country: row.country,
      ordersCount: row.orders_count,
      totalSpentCents: toNumber(row.total_spent_cents),
      createdAt: row.created_at.toISOString(),
    })),
    total: rows[0]?.total_count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  };
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
