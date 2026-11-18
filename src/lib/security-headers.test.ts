import { describe, expect, it } from "vitest";

import { buildSecurityHeaders } from "./security-headers";

function header(headers: ReturnType<typeof buildSecurityHeaders>, key: string): string | undefined {
  return headers.find((candidate) => candidate.key === key)?.value;
}

describe("buildSecurityHeaders", () => {
  it("sets the baseline headers in development", () => {
    const headers = buildSecurityHeaders(false);

    expect(header(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(header(headers, "X-Frame-Options")).toBe("DENY");
    expect(header(headers, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header(headers, "Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(header(headers, "Content-Security-Policy")).toContain("'unsafe-eval'");
    expect(header(headers, "Strict-Transport-Security")).toBeUndefined();
  });

  it("drops unsafe-eval and adds HSTS in production", () => {
    const headers = buildSecurityHeaders(true);
    const csp = header(headers, "Content-Security-Policy") ?? "";

    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(header(headers, "Strict-Transport-Security")).toContain("max-age=63072000");
  });

  it("never widens the source list beyond self and inline assets", () => {
    const csp = header(buildSecurityHeaders(true), "Content-Security-Policy") ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("*");
  });
});
