import { expect, type Page } from "@playwright/test";

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/** The seeded account is the fastest deterministic way into the product. */
export async function signInDemo(page: Page): Promise<void> {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Open the demo" })).toBeVisible();
  await page.getByRole("button", { name: "Open the demo" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: /Signed in as/ })).toBeVisible();
}

/** A fresh owner + workspace for flows the public demo deliberately blocks. */
export function uniqueAccount(prefix = "e2e") {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  return {
    name: "E2E Owner",
    email: `${prefix}+${stamp}@vortex.test`,
    organizationName: `E2E Works ${stamp}`,
    password: `e2e-pass-${stamp}`,
  };
}

export async function registerOwner(page: Page, account: ReturnType<typeof uniqueAccount>) {
  await page.goto("/register");
  await page.getByLabel("Your name").fill(account.name);
  await page.getByLabel("Work email").fill(account.email);
  await page.getByLabel("Workspace name").fill(account.organizationName);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Create workspace" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(account.organizationName)).toBeVisible();

  const openHref = await page
    .locator("li", { hasText: account.organizationName })
    .getByRole("link", { name: "Open" })
    .getAttribute("href");

  if (!openHref) throw new Error("The new workspace did not expose an Open link.");

  return { slug: openHref.split("/").filter(Boolean).at(-1)! };
}
