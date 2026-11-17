import { describe, expect, it } from "vitest";

import { addDays, daysBetween, resolveRange, todayIn } from "./range";

const NOW = new Date("2026-11-17T12:00:00.000Z");

describe("day arithmetic", () => {
  it("crosses months and years without drifting", () => {
    expect(addDays("2026-11-17", -17)).toBe("2026-10-31");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-11-01", "2026-11-17")).toBe(17);
  });

  it("resolves today in the workspace timezone", () => {
    expect(todayIn("UTC", NOW)).toBe("2026-11-17");
    expect(todayIn("America/Los_Angeles", NOW)).toBe("2026-11-17");
    expect(todayIn("Pacific/Kiritimati", NOW)).toBe("2026-11-18");
    expect(todayIn("America/Los_Angeles", new Date("2026-11-17T02:00:00.000Z"))).toBe("2026-11-16");
  });
});

describe("resolveRange", () => {
  it("resolves the default 30-day window and its previous period", () => {
    const range = resolveRange({ range: "30d" }, "UTC", NOW);

    expect(range).toMatchObject({
      preset: "30d",
      fromDay: "2026-10-19",
      toDay: "2026-11-17",
      days: 30,
      granularity: "day",
      previousFromDay: "2026-09-19",
      previousToDay: "2026-10-18",
    });
  });

  it("uses day for a week and month for a year", () => {
    expect(resolveRange({ range: "7d" }, "UTC", NOW).granularity).toBe("day");
    const year = resolveRange({ range: "12m" }, "UTC", NOW);
    expect(year.fromDay).toBe("2025-12-01");
    expect(year.granularity).toBe("month");
  });

  it("derives weekly granularity for a quarter", () => {
    expect(resolveRange({ range: "90d" }, "UTC", NOW).granularity).toBe("week");
  });

  it("swaps a reversed custom range and keeps an explicit granularity", () => {
    const range = resolveRange(
      { range: "custom", from: "2026-03-01", to: "2026-01-01", granularity: "month" },
      "UTC",
      NOW,
    );

    expect(range.fromDay).toBe("2026-01-01");
    expect(range.toDay).toBe("2026-03-01");
    expect(range.days).toBe(60);
    expect(range.granularity).toBe("month");
  });

  it("never goes past today and caps a custom range at 400 days", () => {
    const future = resolveRange(
      { range: "custom", from: "2026-11-01", to: "2099-01-01" },
      "UTC",
      NOW,
    );
    expect(future.toDay).toBe("2026-11-17");

    const huge = resolveRange(
      { range: "custom", from: "2020-01-01", to: "2026-11-17" },
      "UTC",
      NOW,
    );
    expect(huge.days).toBe(400);
    expect(huge.fromDay).toBe(addDays("2026-11-17", -399));
  });
});
