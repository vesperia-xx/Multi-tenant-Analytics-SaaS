import { z } from "zod";

export const RANGE_PRESETS = ["7d", "30d", "90d", "12m", "custom"] as const;
export const GRANULARITIES = ["day", "week", "month"] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number];
export type Granularity = (typeof GRANULARITIES)[number];

export type AnalyticsQuery = {
  range: RangePreset;
  from?: string;
  to?: string;
  granularity?: Granularity;
};

const dayField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

const schema = z.object({
  range: z.enum(RANGE_PRESETS).catch("30d"),
  from: dayField.optional().catch(undefined),
  to: dayField.optional().catch(undefined),
  granularity: z.enum(GRANULARITIES).optional().catch(undefined),
});

/**
 * URL filters are untrusted: every field falls back on its own instead of
 * failing the whole dashboard. A custom range without both ends is treated as
 * the default preset.
 */
export function parseAnalyticsQuery(
  input: Record<string, string | string[] | undefined>,
): AnalyticsQuery {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const parsed = schema.parse({
    range: first(input.range),
    from: first(input.from),
    to: first(input.to),
    granularity: first(input.granularity),
  });

  if (parsed.range === "custom" && (!parsed.from || !parsed.to)) {
    return { range: "30d", granularity: parsed.granularity };
  }

  if (parsed.range !== "custom") {
    return { range: parsed.range, granularity: parsed.granularity };
  }

  return {
    range: parsed.range,
    from: parsed.from,
    to: parsed.to,
    granularity: parsed.granularity,
  };
}
