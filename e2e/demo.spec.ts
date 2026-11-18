import { expect, test } from "@playwright/test";

import { signInDemo } from "./helpers";

test.describe("public demo", () => {
  test("one click opens both tenants and the read-only settings", async ({ page }) => {
    await signInDemo(page);

    await expect(page.getByText("Acme Inc", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Nordwind Studio", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Read-only demo").first()).toBeVisible();

    await page
      .locator("li", { hasText: "Acme Inc" })
      .getByRole("link", { name: "Open" })
      .click();

    await expect(page).toHaveURL(/\/app\/acme-inc$/);
    await expect(page.getByRole("heading", { name: "The numbers, as booked." })).toBeVisible();
    await expect(page.getByText("Read-only demo").first()).toBeVisible();
    await expect(page.getByText("Acme Inc", { exact: true }).first()).toBeVisible();

    await page.getByRole("link", { name: "Members & settings" }).click();
    await expect(
      page.getByRole("heading", { name: "Who gets in, and what they can do." }),
    ).toBeVisible();
    await expect(page.getByText("America/New_York").first()).toBeVisible();
    await expect(page.getByText("Maya Chen")).toBeVisible();
    await expect(page.getByText("Invitations are disabled")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Send invitation" })).toHaveCount(0);

    await page.getByRole("link", { name: "Audit log" }).click();
    await expect(
      page.getByRole("heading", { name: "Everything that changed, with its receipt." }),
    ).toBeVisible();

    const filteredAudit = page.waitForResponse(
      (response) =>
        response.url().includes("/api/org/") &&
        response.url().includes(`/audit`) &&
        response.url().includes("action=organization.updated"),
    );
    await page
      .locator('select:has(option[value="organization.updated"])')
      .selectOption("organization.updated");
    await filteredAudit;

    await expect(page).toHaveURL(/action=organization.updated/);
    await expect(page.getByText("1–1 of 1")).toBeVisible();
    await expect(page.getByRole("table").getByText("Workspace settings changed")).toBeVisible();
    await expect(page.getByText(/of \d+/).first()).toBeVisible();
  });

  test("the switcher moves to Nordwind with the Admin role", async ({ page }) => {
    await signInDemo(page);

    await page
      .locator("li", { hasText: "Acme Inc" })
      .getByRole("link", { name: "Open" })
      .click();
    await expect(page).toHaveURL(/\/app\/acme-inc$/);

    await page.locator('[data-slot="workspace-switcher"] summary').click();
    await page.getByRole("button", { name: /Nordwind Studio/ }).click();

    await expect(page).toHaveURL(/\/app\/nordwind-studio$/);
    await expect(page.getByText("Nordwind Studio", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Admin", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Read-only demo").first()).toBeVisible();

    await page.getByRole("link", { name: "Members & settings" }).click();
    await expect(page.getByText("EUR", { exact: true })).toBeVisible();
    await expect(page.getByText("Europe/Oslo").first()).toBeVisible();
    await expect(page.getByText("Ingrid Solberg")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  });
});
