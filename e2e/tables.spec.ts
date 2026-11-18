import { expect, test } from "@playwright/test";

import { signInDemo } from "./helpers";

test.describe("tables", () => {
  test("orders filter, sort, paginate and open a detail", async ({ page }) => {
    await signInDemo(page);
    await page.goto("/app/acme-inc/orders");

    await expect(page.getByRole("heading", { name: "Every order, one ledger line." })).toBeVisible();
    await expect(page.getByText(/1–10 of \d+/)).toBeVisible();

    const paidResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/org/acme-inc/orders") &&
        response.url().includes("status=PAID"),
    );
    await page.getByLabel("Status").selectOption("PAID");
    await paidResponse;

    await expect(page).toHaveURL(/status=PAID/);
    await expect(page.locator("tbody tr").first()).toContainText("Paid");

    const paidApi = await page.request.get("/api/org/acme-inc/orders?status=PAID&pageSize=10");
    expect(paidApi.status()).toBe(200);
    const paidBody = (await paidApi.json()) as { total: number };
    expect(paidBody.total).toBeGreaterThan(0);
    expect(paidBody.total).toBeLessThan(781);

    await page.getByRole("button", { name: "Total" }).click();
    await expect(page).toHaveURL(/sort=totalCents/);

    await page.goto("/app/acme-inc/orders");
    await expect(page.getByText(/1–10 of \d+/)).toBeVisible();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/11–20 of \d+/)).toBeVisible();

    await page.goto("/app/acme-inc/orders");
    await expect(page.getByText(/1–10 of \d+/)).toBeVisible();
    const searchResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/org/acme-inc/orders") && response.url().includes("q=Ada"),
    );
    await page.getByRole("searchbox", { name: "Order number or customer…" }).fill("Ada");
    await searchResponse;
    await expect(page).toHaveURL(/q=Ada/);
    await expect(page.locator("tbody")).toContainText("Ada");

    const searchApi = await page.request.get("/api/org/acme-inc/orders?q=Ada&pageSize=10");
    expect(searchApi.status()).toBe(200);
    expect(((await searchApi.json()) as { total: number }).total).toBeGreaterThan(0);

    await page.goto("/app/acme-inc/orders");
    await expect(page.getByText(/1–10 of \d+/)).toBeVisible();
    await page.locator("tbody tr").first().getByRole("link").click();
    await expect(page).toHaveURL(/\/app\/acme-inc\/orders\/[^/]+$/);
    await expect(page.getByText("Line items")).toBeVisible();
    await expect(page.getByText("Totals")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customer" })).toBeVisible();
  });

  test("customers and products list their seeded rows", async ({ page }) => {
    await signInDemo(page);
    await page.goto("/app/acme-inc");
    await expect(page.getByRole("heading", { name: "The numbers, as booked." })).toBeVisible();

    await page.getByRole("link", { name: "Customers" }).click();
    await expect(page.getByRole("heading", { name: "Who is actually buying." })).toBeVisible();
    await expect(page.getByText(/1–10 of \d+/)).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();

    await page.getByRole("link", { name: "Products" }).click();
    await expect(page.getByRole("heading", { name: "The catalogue, kept tidy." })).toBeVisible();
    await expect(page.getByText(/1–10 of 10/)).toBeVisible();
    await expect(page.getByRole("table").getByText("AUD-001")).toBeVisible();
  });
});
