import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
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
  total_count: number;
};

export async function listProducts(
  organizationId: string,
  params: ProductsParams,
): Promise<ListResult<ProductListRow>> {
  const { q, status, categoryId, sort, direction, page, pageSize } = params;
  const offset = (page - 1) * pageSize;
  const needle = q?.trim() || null;
  const orderBy = Prisma.raw(
    `${sortColumns[sort]} ${direction === "asc" ? "ASC" : "DESC"} NULLS LAST, p.id ASC`,
  );

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      p.id,
      p.sku,
      p.name,
      p.price_cents,
      p.cost_cents,
      p.status::text AS status,
      cat.name AS category_name,
      p.created_at,
      COUNT(*) OVER ()::int AS total_count
    FROM products p
    LEFT JOIN categories cat ON cat.id = p.category_id AND cat.organization_id = p.organization_id
    WHERE p.organization_id = ${organizationId}
      AND (
        ${needle}::text IS NULL
        OR p.name ILIKE '%' || ${needle} || '%'
        OR p.sku ILIKE '%' || ${needle} || '%'
      )
      AND (${status ?? null}::text IS NULL OR p.status::text = ${status ?? null})
      AND (${categoryId ?? null}::text IS NULL OR p.category_id = ${categoryId ?? null})
    ORDER BY ${orderBy}
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      priceCents: row.price_cents,
      costCents: row.cost_cents,
      status: row.status,
      categoryName: row.category_name,
      createdAt: row.created_at.toISOString(),
    })),
    total: rows[0]?.total_count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function listCategories(
  organizationId: string,
): Promise<Array<{ id: string; name: string }>> {
  return prisma.category.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
