import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { withTenant } from "@/server/db/tenant";
import type { ListResult, OrdersParams } from "@/lib/validation/table";

export type OrderListRow = {
  id: string;
  number: string;
  status: "PENDING" | "PAID" | "REFUNDED" | "CANCELLED";
  totalCents: number;
  placedAt: string;
  customerName: string;
  customerEmail: string;
};

export type OrderExportRow = OrderListRow & {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
};

export type OrderDetail = {
  id: string;
  number: string;
  status: OrderListRow["status"];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  placedAt: string;
  customer: { id: string; name: string; email: string };
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

const sortColumns: Record<OrdersParams["sort"], string> = {
  placedAt: "o.placed_at",
  totalCents: "o.total_cents",
  number: "o.number",
  customerName: "c.name",
};

/** Shared by the table and the CSV export, so both see identical filters. */
function ordersWhere(
  organizationId: string,
  timezone: string,
  params: OrdersParams,
): Prisma.Sql {
  const needle = params.q?.trim() || null;

  return Prisma.sql`
    o.organization_id = ${organizationId}
    AND (
      ${needle}::text IS NULL
      OR o.number ILIKE '%' || ${needle} || '%'
      OR c.name ILIKE '%' || ${needle} || '%'
      OR c.email ILIKE '%' || ${needle} || '%'
    )
    AND (${params.status ?? null}::text IS NULL OR o.status::text = ${params.status ?? null})
    AND (${params.from ?? null}::date IS NULL OR o.placed_at >= (${params.from ?? null}::date AT TIME ZONE ${timezone}))
    AND (${params.to ?? null}::date IS NULL OR o.placed_at < ((${params.to ?? null}::date + 1) AT TIME ZONE ${timezone}))
  `;
}

function ordersOrderBy(params: OrdersParams): Prisma.Sql {
  return Prisma.raw(
    `${sortColumns[params.sort]} ${params.direction === "asc" ? "ASC" : "DESC"}, o.id ASC`,
  );
}

type RawRow = {
  id: string;
  number: string;
  status: OrderListRow["status"];
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  placed_at: Date;
  customer_name: string;
  customer_email: string;
};

function toRow(row: RawRow): OrderListRow {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    totalCents: row.total_cents,
    placedAt: row.placed_at.toISOString(),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
  };
}

const orderSelect = Prisma.sql`
  o.id,
  o.number,
  o.status::text AS status,
  o.subtotal_cents,
  o.discount_cents,
  o.tax_cents,
  o.total_cents,
  o.placed_at,
  c.name AS customer_name,
  c.email AS customer_email
`;

export async function listOrders(
  organizationId: string,
  timezone: string,
  params: OrdersParams,
): Promise<ListResult<OrderListRow>> {
  const offset = (params.page - 1) * params.pageSize;

  return withTenant(organizationId, async (db) => {
    const rows = await db.$queryRaw<Array<RawRow & { total_count: number }>>`
      SELECT ${orderSelect}, COUNT(*) OVER ()::int AS total_count
      FROM orders o
      JOIN customers c ON c.id = o.customer_id AND c.organization_id = o.organization_id
      WHERE ${ordersWhere(organizationId, timezone, params)}
      ORDER BY ${ordersOrderBy(params)}
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

/** Export ignores pagination and stops at a hard row cap. */
export async function exportOrders(
  organizationId: string,
  timezone: string,
  params: OrdersParams,
  limit = 10_000,
): Promise<OrderExportRow[]> {
  return withTenant(organizationId, async (db) => {
    const rows = await db.$queryRaw<RawRow[]>`
      SELECT ${orderSelect}
      FROM orders o
      JOIN customers c ON c.id = o.customer_id AND c.organization_id = o.organization_id
      WHERE ${ordersWhere(organizationId, timezone, params)}
      ORDER BY ${ordersOrderBy(params)}
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      ...toRow(row),
      subtotalCents: row.subtotal_cents,
      discountCents: row.discount_cents,
      taxCents: row.tax_cents,
    }));
  });
}

export async function getOrderDetail(
  organizationId: string,
  orderId: string,
): Promise<OrderDetail | null> {
  return withTenant(organizationId, async (db) => {
    const [order] = await db.$queryRaw<
      Array<{
        id: string;
        number: string;
        status: OrderListRow["status"];
        subtotal_cents: number;
        discount_cents: number;
        tax_cents: number;
        total_cents: number;
        placed_at: Date;
        customer_id: string;
        customer_name: string;
        customer_email: string;
      }>
    >`
      SELECT
        o.id,
        o.number,
        o.status::text AS status,
        o.subtotal_cents,
        o.discount_cents,
        o.tax_cents,
        o.total_cents,
        o.placed_at,
        c.id AS customer_id,
        c.name AS customer_name,
        c.email AS customer_email
      FROM orders o
      JOIN customers c ON c.id = o.customer_id AND c.organization_id = o.organization_id
      WHERE o.organization_id = ${organizationId} AND o.id = ${orderId}
      LIMIT 1
    `;

    if (!order) return null;

    const items = await db.$queryRaw<
      Array<{
        id: string;
        product_name: string;
        sku: string;
        quantity: number;
        unit_price_cents: number;
        line_total_cents: number;
      }>
    >`
      SELECT
        oi.id,
        COALESCE(p.name, 'Archived product') AS product_name,
        COALESCE(p.sku, '—') AS sku,
        oi.quantity,
        oi.unit_price_cents,
        oi.line_total_cents
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id AND p.organization_id = oi.organization_id
      WHERE oi.organization_id = ${organizationId} AND oi.order_id = ${orderId}
      ORDER BY oi.line_total_cents DESC
    `;

    return {
      id: order.id,
      number: order.number,
      status: order.status,
      subtotalCents: order.subtotal_cents,
      discountCents: order.discount_cents,
      taxCents: order.tax_cents,
      totalCents: order.total_cents,
      placedAt: order.placed_at.toISOString(),
      customer: { id: order.customer_id, name: order.customer_name, email: order.customer_email },
      items: items.map((item) => ({
        id: item.id,
        productName: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        lineTotalCents: item.line_total_cents,
      })),
    };
  });
}
