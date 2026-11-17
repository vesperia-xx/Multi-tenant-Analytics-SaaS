import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { Granularity } from "@/lib/validation/analytics";
import { prisma } from "@/server/db/client";

type Numeric = number | bigint | string | null;

function toNumber(value: Numeric): number {
  if (value === null) return 0;
  return typeof value === "string" ? Number(value) : Number(value);
}

export type KpiValue = {
  value: number;
  previous: number;
  changePercent: number | null;
};

export type RevenuePoint = {
  /** `YYYY-MM-DD` bucket start, already in the workspace timezone. */
  bucket: string;
  revenueCents: number;
  orders: number;
};

export type StatusSlice = {
  status: "PENDING" | "PAID" | "REFUNDED" | "CANCELLED";
  count: number;
  totalCents: number;
};

export type TopProduct = {
  id: string;
  name: string;
  sku: string;
  revenueCents: number;
  units: number;
};

export type TrafficPoint = {
  bucket: string;
  visitors: number;
  sessions: number;
};

export type TrafficSummary = {
  visitors: number;
  sessions: number;
  conversionPercent: number | null;
};

export type DashboardData = {
  revenue: KpiValue;
  orders: KpiValue;
  averageOrder: KpiValue;
  newCustomers: KpiValue;
  revenueSeries: RevenuePoint[];
  statusBreakdown: StatusSlice[];
  topProducts: TopProduct[];
  trafficSeries: TrafficPoint[];
  traffic: TrafficSummary;
  paidOrders: number;
};

type TotalsRow = {
  revenue_cents: Numeric;
  paid_orders: Numeric;
  average_order_cents: Numeric;
  new_customers: Numeric;
  orders: Numeric;
};

/**
 * Window boundaries are resolved by Postgres with the workspace's IANA zone:
 * `placed_at` is a timestamptz, and `date AT TIME ZONE zone` is local midnight.
 */
async function totalsFor(
  organizationId: string,
  timezone: string,
  fromDay: string,
  toDay: string,
): Promise<TotalsRow> {
  const [row] = await prisma.$queryRaw<TotalsRow[]>`
    SELECT
      COALESCE(SUM(total_cents) FILTER (WHERE status = 'PAID'), 0)::bigint AS revenue_cents,
      COUNT(*) FILTER (WHERE status = 'PAID')::int AS paid_orders,
      ROUND(AVG(total_cents) FILTER (WHERE status = 'PAID'))::bigint AS average_order_cents,
      COUNT(*) FILTER (WHERE status <> 'CANCELLED')::int AS orders,
      (
        SELECT COUNT(*)::int
        FROM customers c
        WHERE c.organization_id = ${organizationId}
          AND c.created_at >= (${fromDay}::date AT TIME ZONE ${timezone})
          AND c.created_at < ((${toDay}::date + 1) AT TIME ZONE ${timezone})
      ) AS new_customers
    FROM orders o
    WHERE o.organization_id = ${organizationId}
      AND o.placed_at >= (${fromDay}::date AT TIME ZONE ${timezone})
      AND o.placed_at < ((${toDay}::date + 1) AT TIME ZONE ${timezone})
  `;

  return row;
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function kpi(current: number, previous: number): KpiValue {
  return { value: current, previous, changePercent: changePercent(current, previous) };
}

async function revenueSeries(
  organizationId: string,
  timezone: string,
  fromDay: string,
  toDay: string,
  granularity: Granularity,
): Promise<RevenuePoint[]> {
  const unit = Prisma.raw(`'${granularity}'`);
  const step = Prisma.raw(`interval '1 ${granularity}'`);

  const rows = await prisma.$queryRaw<
    Array<{ bucket: string; revenue_cents: Numeric; orders: Numeric }>
  >`
    WITH buckets AS (
      SELECT
        date_trunc(${unit}, o.placed_at AT TIME ZONE ${timezone}) AS bucket,
        COALESCE(SUM(o.total_cents) FILTER (WHERE o.status = 'PAID'), 0)::bigint AS revenue_cents,
        COUNT(*) FILTER (WHERE o.status <> 'CANCELLED')::int AS orders
      FROM orders o
      WHERE o.organization_id = ${organizationId}
        AND o.placed_at >= (${fromDay}::date AT TIME ZONE ${timezone})
        AND o.placed_at < ((${toDay}::date + 1) AT TIME ZONE ${timezone})
      GROUP BY 1
    ),
    spine AS (
      SELECT generate_series(
        date_trunc(${unit}, ${fromDay}::date::timestamp),
        date_trunc(${unit}, ${toDay}::date::timestamp),
        ${step}
      ) AS bucket
    )
    SELECT
      to_char(spine.bucket, 'YYYY-MM-DD') AS bucket,
      COALESCE(buckets.revenue_cents, 0)::bigint AS revenue_cents,
      COALESCE(buckets.orders, 0)::int AS orders
    FROM spine
    LEFT JOIN buckets ON buckets.bucket = spine.bucket
    ORDER BY spine.bucket
  `;

  return rows.map((row) => ({
    bucket: row.bucket,
    revenueCents: toNumber(row.revenue_cents),
    orders: toNumber(row.orders),
  }));
}

async function statusBreakdown(
  organizationId: string,
  timezone: string,
  fromDay: string,
  toDay: string,
): Promise<StatusSlice[]> {
  const rows = await prisma.$queryRaw<
    Array<{ status: StatusSlice["status"]; count: Numeric; total_cents: Numeric }>
  >`
    SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total_cents), 0)::bigint AS total_cents
    FROM orders
    WHERE organization_id = ${organizationId}
      AND placed_at >= (${fromDay}::date AT TIME ZONE ${timezone})
      AND placed_at < ((${toDay}::date + 1) AT TIME ZONE ${timezone})
    GROUP BY status
  `;

  const order: StatusSlice["status"][] = ["PAID", "PENDING", "REFUNDED", "CANCELLED"];
  const byStatus = new Map(rows.map((row) => [row.status, row]));

  return order.map((status) => ({
    status,
    count: toNumber(byStatus.get(status)?.count ?? 0),
    totalCents: toNumber(byStatus.get(status)?.total_cents ?? 0),
  }));
}

async function topProducts(
  organizationId: string,
  timezone: string,
  fromDay: string,
  toDay: string,
  limit = 5,
): Promise<TopProduct[]> {
  const rows = await prisma.$queryRaw<
    Array<{ id: string; name: string; sku: string; revenue_cents: Numeric; units: Numeric }>
  >`
    SELECT
      p.id,
      p.name,
      p.sku,
      COALESCE(SUM(oi.line_total_cents), 0)::bigint AS revenue_cents,
      COALESCE(SUM(oi.quantity), 0)::int AS units
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id AND o.organization_id = oi.organization_id
    JOIN products p ON p.id = oi.product_id AND p.organization_id = oi.organization_id
    WHERE oi.organization_id = ${organizationId}
      AND o.placed_at >= (${fromDay}::date AT TIME ZONE ${timezone})
      AND o.placed_at < ((${toDay}::date + 1) AT TIME ZONE ${timezone})
      AND o.status <> 'CANCELLED'
    GROUP BY p.id, p.name, p.sku
    ORDER BY revenue_cents DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    revenueCents: toNumber(row.revenue_cents),
    units: toNumber(row.units),
  }));
}

async function trafficSeries(
  organizationId: string,
  fromDay: string,
  toDay: string,
  granularity: Granularity,
): Promise<TrafficPoint[]> {
  const unit = Prisma.raw(`'${granularity}'`);

  return prisma.$queryRaw<TrafficPoint[]>`
    SELECT
      to_char(date_trunc(${unit}, date), 'YYYY-MM-DD') AS bucket,
      COALESCE(SUM(visitors), 0)::int AS visitors,
      COALESCE(SUM(sessions), 0)::int AS sessions
    FROM traffic_daily
    WHERE organization_id = ${organizationId}
      AND date >= ${fromDay}::date
      AND date <= ${toDay}::date
    GROUP BY 1
    ORDER BY 1
  `;
}

export async function getDashboardData({
  organizationId,
  timezone,
  fromDay,
  toDay,
  previousFromDay,
  previousToDay,
  granularity,
}: {
  organizationId: string;
  timezone: string;
  fromDay: string;
  toDay: string;
  previousFromDay: string;
  previousToDay: string;
  granularity: Granularity;
}): Promise<DashboardData> {
  const [
    current,
    previous,
    revenuePoints,
    statuses,
    products,
    traffic,
  ] = await Promise.all([
    totalsFor(organizationId, timezone, fromDay, toDay),
    totalsFor(organizationId, timezone, previousFromDay, previousToDay),
    revenueSeries(organizationId, timezone, fromDay, toDay, granularity),
    statusBreakdown(organizationId, timezone, fromDay, toDay),
    topProducts(organizationId, timezone, fromDay, toDay),
    trafficSeries(organizationId, fromDay, toDay, granularity),
  ]);

  const visitors = traffic.reduce((sum, point) => sum + point.visitors, 0);
  const sessions = traffic.reduce((sum, point) => sum + point.sessions, 0);
  const paidOrders = toNumber(current.paid_orders);

  return {
    revenue: kpi(toNumber(current.revenue_cents), toNumber(previous.revenue_cents)),
    orders: kpi(toNumber(current.orders), toNumber(previous.orders)),
    averageOrder: kpi(
      toNumber(current.average_order_cents),
      toNumber(previous.average_order_cents),
    ),
    newCustomers: kpi(
      toNumber(current.new_customers),
      toNumber(previous.new_customers),
    ),
    revenueSeries: revenuePoints,
    statusBreakdown: statuses,
    topProducts: products,
    trafficSeries: traffic,
    traffic: {
      visitors,
      sessions,
      conversionPercent: sessions === 0 ? null : (paidOrders / sessions) * 100,
    },
    paidOrders,
  };
}
