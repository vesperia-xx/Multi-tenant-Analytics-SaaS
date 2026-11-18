import { describe, expect, it } from "vitest";

import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_WORKSPACES, isDemoReadOnly } from "./demo";

describe("isDemoReadOnly", () => {
  it("locks demo organisations when the flag is on", () => {
    expect(isDemoReadOnly(true, true)).toBe(true);
  });

  it("leaves demo organisations writable when the flag is off", () => {
    expect(isDemoReadOnly(true, false)).toBe(false);
  });

  it("never locks a regular organisation", () => {
    expect(isDemoReadOnly(false, true)).toBe(false);
    expect(isDemoReadOnly(false, false)).toBe(false);
  });
});

describe("demo constants", () => {
  it("advertises the seeded account and both workspaces", () => {
    expect(DEMO_EMAIL).toBe("demo@vortex.test");
    expect(DEMO_PASSWORD).toBeTruthy();
    expect(DEMO_WORKSPACES.map((workspace) => workspace.slug)).toEqual([
      "acme-inc",
      "nordwind-studio",
    ]);
  });
});
