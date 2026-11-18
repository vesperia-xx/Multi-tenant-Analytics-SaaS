import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { withTenant } from "@/server/db/tenant";
import type { ListResult, ProductsParams } from "@/lib/validation/table";

export type ProductListRow = {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  costCents: number | null;
  status: "ACTIVE" | "ARCHIVED";
  categoryName: string | null;
  createdAt: string;
};

const sortColumns: Record<ProductsParams["sort"], string> = {
  name: "p.name",
  sku: "p.sku",
  priceCents: "p.price_cents",
  createdAt: "p.created_at",
};

type RawRow = {
  id: string;
  sku: string;
  name: string;
  price_cents: number;
  cost_cents: number | null;
  status: ProductListRow["status"];
  category_name: string | null;
  created_at: Date;
};

function productsWhere(organizationId: string, params: ProductsParams): Prisma.Sql {
  const needle = params.q?.trim() || null;

  return Prisma.sql`
    p.organization_id = ${organizationId}
    AND (
      ${needle}::text IS NULL
      OR p.name ILIKE '%' || ${needle} || '%'
      OR p.sku ILIKE '%' || ${needle} || '%'
    )
    AND (${params.status ?? null}::text IS NULL OR p.status::text = ${params.status ?? null})
    AND (${params.categoryId ?? null}::text IS NULL OR p.category_id = ${params.categoryId ?? null})
  `;
}

function productsOrderBy(params: ProductsParams): Prisma.Sql {
  return Prisma.raw(
    `${sortColumns[params.sort]} ${params.direction === "asc" ? "ASC" : "DESC"} NULLS LAST, p.id ASC`,
  );
}

function toRow(row: RawRow): ProductListRow {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    priceCents: row.price_cents,
    costCents: row.cost_cents,
    status: row.status,
    categoryName: row.category_name,
    createdAt: row.created_at.toISOString(),
  };
}

const productSelect = Prisma.sql`
  p.id,
  p.sku,
  p.name,
  p.price_cents,
  p.cost_cents,
  p.status::text AS status,
  cat.name AS category_name,
  p.created_at
`;

const productFrom = Prisma.sql`
  FROM products p
  LEFT JOIN categories cat ON cat.id = p.category_id AND cat.organization_id = p.organization_id
`;

export async function listProducts(
  organizationId: string,
  params: ProductsParams,
): Promise<ListResult<ProductListRow>> {
  const offset = (params.page - 1) * params.pageSize;

  return withTenant(organizationId, async (db) => {
    const rows = await db.$queryRaw<Array<RawRow & { total_count: number }>>`
      SELECT ${productSelect}, COUNT(*) OVER ()::int AS total_count
      ${productFrom}
      WHERE ${productsWhere(organizationId, params)}
      ORDER BY ${productsOrderBy(params)}
      LIMIT ${params.pageSize} OFFSET ${offset}
    `;

    return {
      rows: rows.map(toRow),
      total: rows[0]?.total_count ?? 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  });
}

export async function exportProducts(
  organizationId: string,
  params: ProductsParams,
  limit = 10_000,
): Promise<ProductListRow[]> {
  return withTenant(organizationId, async (db) => {
    const rows = await db.$queryRaw<RawRow[]>`
      SELECT ${productSelect}
      ${productFrom}
      WHERE ${productsWhere(organizationId, params)}
      ORDER BY ${productsOrderBy(params)}
      LIMIT ${limit}
    `;

    return rows.map(toRow);
  });
}

export async function listCategories(
  organizationId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant(organizationId, (db) =>
    db.category.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  );
}
