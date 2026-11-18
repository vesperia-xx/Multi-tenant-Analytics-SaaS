import { describe, expect, it } from "vitest";

import {
  customersParamsSchema,
  ordersParamsSchema,
  productsParamsSchema,
} from "./table";

describe("ordersParamsSchema", () => {
  it("falls back per field instead of failing the table", () => {
    const parsed = ordersParamsSchema.parse({ sort: "totalCents; DROP TABLE orders", page: "2" });

    expect(parsed.sort).toBe("placedAt");
    expect(parsed.page).toBe(2);
  });

  it("clamps page size and keeps unknown sort columns out", () => {
    const parsed = ordersParamsSchema.parse({ pageSize: "999", sort: "whatever" });

    expect(parsed.pageSize).toBe(50);
    expect(parsed.sort).toBe("placedAt");
  });

  it("accepts a real status and ignores a forged one", () => {
    expect(ordersParamsSchema.parse({ status: "PAID" }).status).toBe("PAID");
    expect(ordersParamsSchema.parse({ status: "FREE" }).status).toBeUndefined();
  });

  it("drops malformed dates and defaults the rest", () => {
    const parsed = ordersParamsSchema.parse({ from: "yesterday", to: "2026-11-17", q: 42 });

    expect(parsed.from).toBeUndefined();
    expect(parsed.to).toBe("2026-11-17");
    expect(parsed.q).toBeUndefined();
    expect(parsed.direction).toBe("desc");
  });
});

describe("customersParamsSchema", () => {
  it("defaults to recent customers and drops bad sorts", () => {
    const parsed = customersParamsSchema.parse({ sort: "totalSpent" });
    expect(parsed.sort).toBe("totalSpent");

    expect(customersParamsSchema.parse({}).sort).toBe("createdAt");
    expect(customersParamsSchema.parse({ sort: "password" }).sort).toBe("createdAt");
  });

  it("accepts a country filter but rejects a wildcard", () => {
    expect(customersParamsSchema.parse({ country: "ES" }).country).toBe("ES");
    expect(customersParamsSchema.parse({ country: "E S" }).country).toBeUndefined();
  });
});

describe("productsParamsSchema", () => {
  it("keeps a valid category and sorts by price", () => {
    const parsed = productsParamsSchema.parse({ categoryId: "cat_1", sort: "priceCents", direction: "asc" });

    expect(parsed.categoryId).toBe("cat_1");
    expect(parsed.sort).toBe("priceCents");
    expect(parsed.direction).toBe("asc");
  });

  it("rejects a bogus status", () => {
    expect(productsParamsSchema.parse({ status: "MAGIC" }).status).toBeUndefined();
  });
});
