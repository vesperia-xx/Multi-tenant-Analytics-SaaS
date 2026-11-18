import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
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

type RawRow = {
  id: string;
  number: string;
  status: OrderListRow["status"];
  total_cents: number;
  placed_at: Date;
  customer_name: string;
  customer_email: string;
  total_count: number;
};

function toListResult(rows: RawRow[], params: OrdersParams): ListResult<OrderListRow> {
  return {
    rows: rows.map((row) => ({
      id: row.id,
      number: row.number,
      status: row.status,
      totalCents: row.total_cents,
      placedAt: row.placed_at.toISOString(),
      customerName: row.customer_name,
      customerEmail: row.customer_email,
    })),
    total: rows[0]?.total_count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
  };
}

/**
 * Orders are searched by number and by the joined customer, which is why the
 * count is a window function: one pass, no second query for the total.
 */
export async function listOrders(
  organizationId: string,
  timezone: string,
  params: OrdersParams,
): Promise<ListResult<OrderListRow>> {
  const { q, status, from, to, sort, direction, page, pageSize } = params;
  const offset = (page - 1) * pageSize;
  const needle = q?.trim() || null;
  const orderBy = Prisma.raw(
    `${sortColumns[sort]} ${direction === "asc" ? "ASC" : "DESC"}, o.id ASC`,
  );

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      o.id,
      o.number,
      o.status::text AS status,
      o.total_cents,
      o.placed_at,
      c.name AS customer_name,
      c.email AS customer_email,
      COUNT(*) OVER ()::int AS total_count
    FROM orders o
    JOIN customers c ON c.id = o.customer_id AND c.organization_id = o.organization_id
    WHERE o.organization_id = ${organizationId}
      AND (
        ${needle}::text IS NULL
        OR o.number ILIKE '%' || ${needle} || '%'
        OR c.name ILIKE '%' || ${needle} || '%'
        OR c.email ILIKE '%' || ${needle} || '%'
      )
      AND (${status ?? null}::text IS NULL OR o.status::text = ${status ?? null})
      AND (${from ?? null}::date IS NULL OR o.placed_at >= (${from ?? null}::date AT TIME ZONE ${timezone}))
      AND (${to ?? null}::date IS NULL OR o.placed_at < ((${to ?? null}::date + 1) AT TIME ZONE ${timezone}))
    ORDER BY ${orderBy}
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  return toListResult(rows, params);
}

export async function getOrderDetail(
  organizationId: string,
  orderId: string,
): Promise<OrderDetail | null> {
  const [order] = await prisma.$queryRaw<
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

  const items = await prisma.$queryRaw<
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
}
