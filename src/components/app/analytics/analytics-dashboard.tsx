import {
  formatBucketLabel,
  formatCurrency,
  formatNumber,
  formatRangeLabel,
} from "@/lib/format";
import { Download } from "lucide-react";
import { parseAnalyticsQuery } from "@/lib/validation/analytics";
import { getDashboardData } from "@/server/analytics/queries";
import { resolveRange, todayIn } from "@/server/analytics/range";
import { requireOrgContext } from "@/server/org/context";

import { AnalyticsToolbar } from "./analytics-toolbar";
import { KpiCard } from "./kpi-card";
import { RevenueChart } from "./revenue-chart";
import { StatusBreakdown } from "./status-breakdown";
import { TopProducts } from "./top-products";
import { TrafficChart } from "./traffic-chart";

function SectionHeading({
  id,
  index,
  title,
  aside,
}: {
  id: string;
  index: string;
  title: string;
  aside?: string;
}) {
  return (
    <div className="mb-4 border-b border-border pb-2">
      <h2
        id={id}
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground"
      >
        <span>
          {index} / {title}
        </span>
        {aside ? <span className="text-[0.5rem] tracking-[0.14em]">{aside}</span> : null}
      </h2>
    </div>
  );
}

function Panel({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-border bg-card p-4 sm:p-5 ${className ?? ""}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[0.8125rem] font-medium">{title}</h3>
        {aside ? (
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
            {aside}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export async function AnalyticsDashboard({
  orgSlug,
  searchParams,
}: {
  orgSlug: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireOrgContext(orgSlug);
  const query = parseAnalyticsQuery(await searchParams);
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
  const basePath = `/app/${orgSlug}`;
  const rangeLabel = formatRangeLabel(range.fromDay, range.toDay);
  const hint = `vs prev. ${range.days}d`;

  const reportParams = new URLSearchParams();
  reportParams.set("range", query.range);
  if (query.range === "custom" && query.from && query.to) {
    reportParams.set("from", query.from);
    reportParams.set("to", query.to);
  }
  if (query.granularity) reportParams.set("granularity", query.granularity);
  const reportHref = `/api/org/${orgSlug}/exports/report?${reportParams.toString()}`;

  const revenueData = data.revenueSeries.map((point) => ({
    label: formatBucketLabel(point.bucket, range.granularity),
    revenue: point.revenueCents,
  }));

  const trafficData = data.trafficSeries.map((point) => ({
    label: formatBucketLabel(point.bucket, range.granularity),
    visitors: point.visitors,
    sessions: point.sessions,
  }));

  const hasOrders = data.orders.value > 0;
  const hasTraffic = data.trafficSeries.length > 0;
  const ordersInRange = data.statusBreakdown.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Workspace / Analytics
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-[2.4rem] leading-[1.03] tracking-tight sm:text-[3rem]">
              The numbers, as booked.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Paid revenue only. Every figure is one SQL aggregate over this workspace&apos;s
              PostgreSQL rows, scoped by <span className="font-mono text-[0.75rem]">organization_id</span>.
            </p>
          </div>

          <div className="text-right">
            <p className="tnum font-mono text-[0.625rem] uppercase tracking-[0.14em] text-foreground">
              {rangeLabel}
            </p>
            <p className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
              compared with {range.days} days before
            </p>
            <a
              href={reportHref}
              className="mt-3 inline-flex items-center gap-2 rounded-[3px] border border-foreground/25 px-3 py-2 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground/55 hover:bg-accent"
            >
              <Download className="size-3.5" aria-hidden="true" />
              PDF report
            </a>
          </div>
        </div>
      </header>

      <AnalyticsToolbar
        basePath={basePath}
        query={query}
        range={range}
        maxDay={todayIn(context.organization.timezone)}
        timezone={context.organization.timezone}
      />

      <section aria-labelledby="kpi-heading">
        <SectionHeading id="kpi-heading" index="01" title="Key figures" aside="paid orders only" />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Revenue"
            value={formatCurrency(data.revenue.value, currency)}
            delta={data.revenue.changePercent}
            hint={hint}
          />
          <KpiCard
            label="Orders"
            value={formatNumber(data.orders.value)}
            delta={data.orders.changePercent}
            hint={hint}
          />
          <KpiCard
            label="Average order"
            value={formatCurrency(data.averageOrder.value, currency)}
            delta={data.averageOrder.changePercent}
            hint={hint}
          />
          <KpiCard
            label="New customers"
            value={formatNumber(data.newCustomers.value)}
            delta={data.newCustomers.changePercent}
            hint={hint}
          />
        </div>
      </section>

      <section aria-labelledby="revenue-heading">
        <SectionHeading
          id="revenue-heading"
          index="02"
          title="Revenue and orders"
          aside={range.granularity}
        />

        {hasOrders ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              title="Revenue"
              aside={`${formatCurrency(data.revenue.value, currency)} total`}
              className="lg:col-span-2"
            >
              <RevenueChart data={revenueData} currency={currency} />
            </Panel>

            <Panel title="Orders by status" aside={`${ordersInRange} in range`}>
              <StatusBreakdown slices={data.statusBreakdown} />
              <p className="mt-5 border-t border-border pt-3 font-mono text-[0.5rem] uppercase leading-relaxed tracking-[0.12em] text-muted-foreground">
                Revenue counts PAID only. Cancelled orders are excluded from order totals.
              </p>
            </Panel>
          </div>
        ) : (
          <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
              No orders in this period
            </p>
            <p className="mt-3 font-serif text-[1.6rem] leading-tight">The range is quiet.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Nothing was booked between {rangeLabel}. Widen the period or pick another range —
              the figures update from PostgreSQL, not from a fixture.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="traffic-heading">
        <SectionHeading
          id="traffic-heading"
          index="03"
          title="Acquisition and catalogue"
          aside={hasTraffic ? "traffic_daily" : "no traffic rows"}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            title="Traffic and conversion"
            aside={
              data.traffic.conversionPercent === null
                ? "no sessions"
                : `${data.traffic.conversionPercent.toFixed(1)}% paid conversion`
            }
            className="lg:col-span-2"
          >
            {hasTraffic ? (
              <>
                <dl className="mb-4 grid grid-cols-3 gap-3 border-b border-border pb-4">
                  <div>
                    <dt className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                      Visitors
                    </dt>
                    <dd className="tnum mt-1 font-serif text-lg">
                      {formatNumber(data.traffic.visitors)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                      Sessions
                    </dt>
                    <dd className="tnum mt-1 font-serif text-lg">
                      {formatNumber(data.traffic.sessions)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                      Paid orders
                    </dt>
                    <dd className="tnum mt-1 font-serif text-lg">{formatNumber(data.paidOrders)}</dd>
                  </div>
                </dl>
                <div className="mb-1 flex flex-wrap items-center gap-4 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-px w-4 bg-chart-1" aria-hidden="true" />
                    Visitors
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-0 w-4 border-t border-dashed border-chart-4" aria-hidden="true" />
                    Sessions
                  </span>
                </div>
                <TrafficChart data={trafficData} />
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No traffic recorded for this period.
              </p>
            )}
          </Panel>

          <Panel title="Top products" aside="by revenue">
            <TopProducts products={data.topProducts} currency={currency} />
          </Panel>
        </div>
      </section>
    </div>
  );
}
