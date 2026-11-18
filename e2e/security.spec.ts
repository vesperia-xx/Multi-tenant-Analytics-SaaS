import { expect, request, test } from "@playwright/test";

import { BASE_URL } from "./helpers";

test.describe("security", () => {
  test("responses carry the hardening headers", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();

    if (process.env.CI) {
      expect(headers["strict-transport-security"]).toContain("max-age=63072000");
      expect(headers["content-security-policy"]).not.toContain("'unsafe-eval'");
    }
  });

  test("anonymous API reads are rejected before the tenant lookup", async () => {
    const anonymous = await request.newContext({ baseURL: BASE_URL });
    try {
      const orders = await anonymous.get("/api/org/acme-inc/orders");
      expect(orders.status()).toBe(401);

      const audit = await anonymous.get("/api/org/acme-inc/audit");
      expect(audit.status()).toBe(401);
    } finally {
      await anonymous.dispose();
    }
  });
});
