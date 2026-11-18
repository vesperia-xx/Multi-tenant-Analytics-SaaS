import { expect, test } from "@playwright/test";

import { signInDemo } from "./helpers";

test.describe("exports", () => {
  test("CSV and PDF downloads carry the right headers", async ({ page }) => {
    await signInDemo(page);

    for (const [path, contentType] of [
      ["/api/org/acme-inc/exports/orders?status=PAID", "text/csv"],
      ["/api/org/acme-inc/exports/customers", "text/csv"],
      ["/api/org/acme-inc/exports/products", "text/csv"],
    ] as const) {
      const response = await page.request.get(path);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain(contentType);
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect((await response.body()).length).toBeGreaterThan(100);
    }

    const report = await page.request.get("/api/org/acme-inc/exports/report?range=30d");
    expect(report.status()).toBe(200);
    expect(report.headers()["content-type"]).toContain("application/pdf");
    const pdf = await report.body();
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("the orders screen downloads a named CSV", async ({ page }) => {
    await signInDemo(page);
    await page.goto("/app/acme-inc/orders");
    await expect(page.getByRole("heading", { name: "Every order, one ledger line." })).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Export CSV" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(
      /^vortex-orders-acme-inc-\d{4}-\d{2}-\d{2}\.csv$/,
    );
  });
});
