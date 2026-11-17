import type { AnalyticsQuery, Granularity, RangePreset } from "@/lib/validation/analytics";

export type ResolvedRange = {
  preset: RangePreset;
  fromDay: string;
  toDay: string;
  granularity: Granularity;
  /** Inclusive length in days. */
  days: number;
  previousFromDay: string;
  previousToDay: string;
};

const MAX_CUSTOM_DAYS = 400;

/** `YYYY-MM-DD` math on UTC midnights avoids DST drift entirely. */
function toUtcDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, delta: number): string {
  const date = toUtcDate(day);
  date.setUTCDate(date.getUTCDate() + delta);
  return toDay(date);
}

export function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((toUtcDate(toDay).getTime() - toUtcDate(fromDay).getTime()) / 86_400_000) + 1;
}

/** Today in the workspace's zone, not the server's. */
export function todayIn(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function firstOfMonth(day: string, monthsBack: number): string {
  const date = toUtcDate(day);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - monthsBack);
  return toDay(date);
}

function defaultGranularity(preset: RangePreset, days: number): Granularity {
  if (preset === "12m") return "month";
  if (preset === "7d" || preset === "30d") return "day";
  if (preset === "90d") return "week";
  return days <= 31 ? "day" : days <= 120 ? "week" : "month";
}

/**
 * Turns the URL filters into concrete, timezone-aware day boundaries.
 * The custom range is clamped to `MAX_CUSTOM_DAYS` and never reaches the future.
 */
export function resolveRange(
  query: AnalyticsQuery,
  timezone: string,
  now = new Date(),
): ResolvedRange {
  const today = todayIn(timezone, now);

  let fromDay: string;
  let toDay = today;
  let preset = query.range;

  switch (query.range) {
    case "7d":
      fromDay = addDays(today, -6);
      break;
    case "90d":
      fromDay = addDays(today, -89);
      break;
    case "12m":
      fromDay = firstOfMonth(today, 11);
      break;
    case "custom": {
      const rawFrom = query.from ?? addDays(today, -29);
      const rawTo = query.to ?? today;
      const from = rawFrom <= rawTo ? rawFrom : rawTo;
      const to = rawFrom <= rawTo ? rawTo : rawFrom;

      toDay = to > today ? today : to;
      fromDay = daysBetween(from, toDay) > MAX_CUSTOM_DAYS ? addDays(toDay, -(MAX_CUSTOM_DAYS - 1)) : from;
      if (fromDay > toDay) fromDay = toDay;
      break;
    }
    case "30d":
    default:
      preset = "30d";
      fromDay = addDays(today, -29);
      break;
  }

  const days = daysBetween(fromDay, toDay);
  const previousToDay = addDays(fromDay, -1);
  const previousFromDay = addDays(previousToDay, -(days - 1));

  return {
    preset,
    fromDay,
    toDay,
    granularity: query.granularity ?? defaultGranularity(preset, days),
    days,
    previousFromDay,
    previousToDay,
  };
}
