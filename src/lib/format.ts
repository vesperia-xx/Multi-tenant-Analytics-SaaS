/** Formatting shared by the dashboard and, later, the tables and exports. */

export function formatCurrency(
  cents: number,
  currency: string,
  options: { maximumFractionDigits?: number } = {},
): string {
  const fractionDigits = options.maximumFractionDigits ?? 0;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(fractionDigits)} ${currency}`;
  }
}

/** Axis labels: `$12.4k`, `€1.2M`. */
export function formatCompactCurrency(cents: number, currency: string): string {
  const value = cents / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${Math.round(value)} ${currency}`;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

/** `2026-11-17` → `17 Nov`, without going through UTC. */
export function formatBucketLabel(bucket: string, granularity: "day" | "week" | "month"): string {
  const [year, month, day] = bucket.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (granularity === "month") {
    return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

/** `2026-11-01` + `2026-11-17` → `1–17 Nov 2026`. */
export function formatRangeLabel(fromDay: string, toDay: string): string {
  const [fy, fm, fd] = fromDay.split("-").map(Number);
  const [ty, tm, td] = toDay.split("-").map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);

  const monthShort = new Intl.DateTimeFormat("en-GB", { month: "short" });
  const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

  if (fy === ty && fm === tm) {
    return `${fd}–${td} ${monthShort.format(to)} ${ty}`;
  }

  if (fy !== ty) {
    return `${dayMonth.format(from)} ${fy} – ${dayMonth.format(to)} ${ty}`;
  }

  return `${dayMonth.format(from)} – ${dayMonth.format(to)} ${ty}`;
}
