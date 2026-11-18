import { NextResponse, type NextRequest } from "next/server";

import {
  formatBucketLabel,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRangeLabel,
} from "@/lib/format";
import { searchParamsRecord } from "@/lib/request-params";
import { parseAnalyticsQuery } from "@/lib/validation/analytics";
import { getDashboardData } from "@/server/analytics/queries";
import { resolveRange } from "@/server/analytics/range";
import {
  renderAnalyticsReport,
  type AnalyticsReportData,
} from "@/server/exports/analytics-report";
import {
  attachmentHeaders,
  auditExport,
  exportFilename,
  guardExport,
} from "@/server/exports/http";

const STATUS_LABELS = {
  PAID: "Paid",
  PENDING: "Pending",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
} as const;

function deltaLabel(percent: number | null, days: number): string {
  if (percent === null) return "No baseline";
  return `${formatPercent(percent)} vs previous ${days}d`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const guard = await guardExport(orgSlug);
  if (!guard.ok) return guard.response;

  const { context } = guard;
  const query = parseAnalyticsQuery(searchParamsRecord(request));
  const range = resolveRange(query, context.organization.timezone);

  const data = await getDashboardData({
    organizationId: context.organization.id,
    timezone: context.organization.timezone,
    fromDay: range.fromDay,
    toDay: range.toDay,
    previousFromDay: range.previousFromDay,
    previousToDay: range.previousToDay,
    granularity: range.granularity,
  });

  const currency = context.organization.currency;
  const totalOrders = data.statusBreakdown.reduce((sum, slice) => sum + slice.count, 0);
  const generatedAt = new Intl.DateTimeFormat("en-GB", {
    timeZone: context.organization.timezone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const report: AnalyticsReportData = {
    organizationName: context.organization.name,
    organizationSlug: context.organization.slug,
    currency,
    timezone: context.organization.timezone,
    rangeLabel: formatRangeLabel(range.fromDay, range.toDay),
    granularity: range.granularity,
    generatedAt,
    kpis: [
      {
        label: "Revenue",
        value: formatCurrency(data.revenue.value, currency),
        delta: deltaLabel(data.revenue.changePercent, range.days),
      },
      {
        label: "Orders",
        value: formatNumber(data.orders.value),
        delta: deltaLabel(data.orders.changePercent, range.days),
      },
      {
        label: "Average order",
        value: formatCurrency(data.averageOrder.value, currency),
        delta: deltaLabel(data.averageOrder.changePercent, range.days),
      },
      {
        label: "New customers",
        value: formatNumber(data.newCustomers.value),
        delta: deltaLabel(data.newCustomers.changePercent, range.days),
      },
    ],
    revenueRows: data.revenueSeries.map((point) => ({
      bucket: formatBucketLabel(point.bucket, range.granularity),
      revenue: formatCurrency(point.revenueCents, currency),
      orders: point.orders,
    })),
    topProducts: data.topProducts.map((product) => ({
      name: product.name,
      sku: product.sku,
      revenue: formatCurrency(product.revenueCents, currency),
      units: product.units,
    })),
    statusRows: data.statusBreakdown.map((slice) => ({
      label: STATUS_LABELS[slice.status],
      count: slice.count,
      share: totalOrders === 0 ? "0%" : `${Math.round((slice.count / totalOrders) * 100)}%`,
      total: formatCurrency(slice.totalCents, currency),
    })),
    summary: [
      { label: "Paid orders", value: formatNumber(data.paidOrders) },
      { label: "Visitors", value: formatNumber(data.traffic.visitors) },
      { label: "Sessions", value: formatNumber(data.traffic.sessions) },
      {
        label: "Paid conversion",
        value:
          data.traffic.conversionPercent === null
            ? "—"
            : `${data.traffic.conversionPercent.toFixed(1)}%`,
      },
    ],
  };

  const pdf = await renderAnalyticsReport(report);

  await auditExport(context, {
    format: "pdf",
    resource: "analytics",
    filters: {
      range: range.preset,
      from: range.fromDay,
      to: range.toDay,
      granularity: range.granularity,
    },
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: attachmentHeaders(
      exportFilename("report", context.organization.slug, "pdf"),
      "application/pdf",
    ),
  });
}
