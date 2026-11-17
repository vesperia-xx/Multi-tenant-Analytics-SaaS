import { describe, expect, it } from "vitest";

import {
  formatBucketLabel,
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  formatRangeLabel,
} from "./format";

describe("formatCurrency", () => {
  it("formats cents as whole units of the workspace currency", () => {
    expect(formatCurrency(123_400, "USD")).toBe("$1,234");
    expect(formatCurrency(123_400, "EUR")).toBe("€1,234");
  });

  it("falls back instead of throwing on an unknown currency", () => {
    expect(formatCurrency(10_000, "ZZZ")).toContain("100");
  });

  it("compacts axis values", () => {
    expect(formatCompactCurrency(1_240_000, "USD")).toMatch(/12\.4K/i);
  });
});

describe("formatBucketLabel", () => {
  it("renders days, weeks and months without a UTC shift", () => {
    expect(formatBucketLabel("2026-11-01", "day")).toBe("1 Nov");
    expect(formatBucketLabel("2026-11-01", "week")).toBe("1 Nov");
    expect(formatBucketLabel("2026-11-01", "month")).toBe("Nov 2026");
  });
});

describe("formatRangeLabel", () => {
  it("collapses a single month and keeps both months otherwise", () => {
    expect(formatRangeLabel("2026-11-01", "2026-11-17")).toBe("1–17 Nov 2026");
    expect(formatRangeLabel("2026-10-19", "2026-11-17")).toBe("19 Oct – 17 Nov 2026");
    expect(formatRangeLabel("2025-12-01", "2026-11-17")).toBe("1 Dec 2025 – 17 Nov 2026");
  });
});

describe("formatPercent", () => {
  it("always signs the delta", () => {
    expect(formatPercent(12.34)).toBe("+12.3%");
    expect(formatPercent(-4)).toBe("-4.0%");
  });
});
