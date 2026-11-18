import { expect, test } from "@playwright/test";

import { registerOwner, uniqueAccount } from "./helpers";

test.describe("authenticated workspace", () => {
  test("register, edit settings, invite and inspect the audit diff", async ({ page }) => {
    const account = uniqueAccount();
    const { slug } = await registerOwner(page, account);
    const inviteEmail = `invite+${Date.now()}@vortex.test`;

    await page
      .locator("li", { hasText: account.organizationName })
      .getByRole("link", { name: "Open" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/app/${slug}$`));

    await page.getByRole("link", { name: "Members & settings" }).click();
    await expect(page.getByText(account.organizationName).first()).toBeVisible();

    await page.locator("#workspace-name").fill(`${account.organizationName} Renamed`);
    await page.locator("#workspace-timezone").fill("Europe/Madrid");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Workspace updated.")).toBeVisible();

    await page.locator("#invite-email").fill(inviteEmail);
    await page.locator("#invite-role").selectOption("VIEWER");
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect(page.getByText("No mail provider configured · share this link")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open the invitation link" })).toBeVisible();

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
    await page.getByRole("table").getByRole("link", { name: "Inspect" }).first().click();

    await expect(
      page.getByRole("heading", { name: "Workspace settings changed" }),
    ).toBeVisible();
    await expect(page.getByText("Field changes")).toBeVisible();
    await expect(page.getByText("Europe/Madrid").first()).toBeVisible();
    await expect(page.getByText("Raw payload")).toBeVisible();

    const foreignTenant = await page.request.get("/api/org/acme-inc/orders");
    expect(foreignTenant.status()).toBe(404);
  });
});
