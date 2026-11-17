import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  GRANULARITIES,
  RANGE_PRESETS,
  type AnalyticsQuery,
} from "@/lib/validation/analytics";
import type { ResolvedRange } from "@/server/analytics/range";

const presetLabels: Record<(typeof RANGE_PRESETS)[number], string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
  custom: "Custom",
};

const granularityLabels: Record<(typeof GRANULARITIES)[number], string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

function tabClass(active: boolean): string {
  return cn(
    "inline-flex h-8 items-center rounded-[2px] px-2.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] transition-colors",
    active
      ? "bg-foreground text-background"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  );
}

/**
 * Filters are URLs, not state: links for presets, granularity and a native GET
 * form for a custom range. No client JavaScript is required to change the view.
 */
export function AnalyticsToolbar({
  basePath,
  query,
  range,
  maxDay,
  timezone,
}: {
  basePath: string;
  query: AnalyticsQuery;
  range: ResolvedRange;
  maxDay: string;
  timezone: string;
}) {
  function href(overrides: Partial<AnalyticsQuery>): string {
    const merged = { ...query, ...overrides };
    const params = new URLSearchParams();
    params.set("range", merged.range);

    if (merged.range === "custom" && merged.from && merged.to) {
      params.set("from", merged.from);
      params.set("to", merged.to);
    }

    if (merged.granularity) params.set("granularity", merged.granularity);

    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-3 border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
          Period
        </span>

        {RANGE_PRESETS.filter((preset) => preset !== "custom").map((preset) => (
          <Link
            key={preset}
            href={href({ range: preset, from: undefined, to: undefined })}
            className={tabClass(query.range === preset)}
            aria-current={query.range === preset ? "true" : undefined}
          >
            {presetLabels[preset]}
          </Link>
        ))}

        <form method="get" action={basePath} className="flex flex-wrap items-center gap-1.5">
          <input type="hidden" name="range" value="custom" />
          {query.granularity ? (
            <input type="hidden" name="granularity" value={query.granularity} />
          ) : null}
          <label className="sr-only" htmlFor="analytics-from">
            From date
          </label>
          <input
            id="analytics-from"
            type="date"
            name="from"
            defaultValue={range.fromDay}
            max={maxDay}
            className="h-8 rounded-[2px] border border-input bg-card px-2 font-mono text-[0.625rem] text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
          />
          <span className="font-mono text-[0.625rem] text-muted-foreground">–</span>
          <label className="sr-only" htmlFor="analytics-to">
            To date
          </label>
          <input
            id="analytics-to"
            type="date"
            name="to"
            defaultValue={range.toDay}
            max={maxDay}
            className="h-8 rounded-[2px] border border-input bg-card px-2 font-mono text-[0.625rem] text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
          />
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-[2px] border border-foreground/25 px-2.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground/55 hover:bg-accent"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
          Group by
        </span>
        {GRANULARITIES.map((granularity) => (
          <Link
            key={granularity}
            href={href({ granularity })}
            className={tabClass(range.granularity === granularity)}
            aria-current={range.granularity === granularity ? "true" : undefined}
          >
            {granularityLabels[granularity]}
          </Link>
        ))}
        <span className="ml-1 hidden font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
          {timezone}
        </span>
      </div>
    </div>
  );
}
