import { describe, expect, it } from "vitest";

import { isCronAuthorized } from "./cron";

describe("isCronAuthorized", () => {
  it("accepts the exact bearer token", () => {
    expect(isCronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("rejects a wrong or differently sized token", () => {
    expect(isCronAuthorized("Bearer wrong", "s3cret")).toBe(false);
    expect(isCronAuthorized("Bearer s3cret-extra", "s3cret")).toBe(false);
  });

  it("fails closed without a header or a configured secret", () => {
    expect(isCronAuthorized(null, "s3cret")).toBe(false);
    expect(isCronAuthorized("Bearer s3cret", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer s3cret", "")).toBe(false);
  });
});
