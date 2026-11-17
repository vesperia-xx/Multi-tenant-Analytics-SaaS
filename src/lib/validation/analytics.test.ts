import { describe, expect, it } from "vitest";

import { parseAnalyticsQuery } from "./analytics";

describe("parseAnalyticsQuery", () => {
  it("applies the default preset for empty input", () => {
    expect(parseAnalyticsQuery({})).toEqual({ range: "30d", granularity: undefined });
  });

  it("keeps a valid preset and granularity", () => {
    expect(parseAnalyticsQuery({ range: "90d", granularity: "month" })).toEqual({
      range: "90d",
      granularity: "month",
    });
  });

  it("falls back per field instead of failing the dashboard", () => {
    expect(parseAnalyticsQuery({ range: "fortnight", granularity: "hour" })).toEqual({
      range: "30d",
      granularity: undefined,
    });
  });

  it("requires both ends for a custom range", () => {
    expect(parseAnalyticsQuery({ range: "custom", from: "2026-01-01" })).toEqual({
      range: "30d",
      granularity: undefined,
    });

    expect(
      parseAnalyticsQuery({ range: "custom", from: "2026-01-01", to: "2026-02-01" }),
    ).toEqual({ range: "custom", from: "2026-01-01", to: "2026-02-01", granularity: undefined });
  });

  it("takes the first value when a key is repeated", () => {
    expect(parseAnalyticsQuery({ range: ["7d", "90d"], granularity: ["week"] })).toEqual({
      range: "7d",
      granularity: "week",
    });
  });

  it("rejects malformed dates and keeps the valid side", () => {
    expect(parseAnalyticsQuery({ range: "custom", from: "01/02/2026", to: "2026-02-01" })).toEqual({
      range: "30d",
      granularity: undefined,
    });
  });
});
