import { describe, expect, it } from "vitest";

import { diffObjects, formatDiffValue } from "./diff";

describe("diffObjects", () => {
  it("marks changed fields and leaves unchanged ones out", () => {
    const rows = diffObjects(
      { name: "Acme", currency: "USD", timezone: "UTC" },
      { name: "Acme Inc.", currency: "USD", timezone: "Europe/Madrid" },
    );

    expect(rows).toEqual([
      { field: "name", before: "Acme", after: "Acme Inc.", kind: "changed" },
      { field: "timezone", before: "UTC", after: "Europe/Madrid", kind: "changed" },
    ]);
  });

  it("marks additions and removals", () => {
    const rows = diffObjects({ email: "a@b.co", role: "VIEWER" }, { email: "a@b.co", role: "ADMIN", name: "Ada" });

    expect(rows).toEqual([
      { field: "role", before: "VIEWER", after: "ADMIN", kind: "changed" },
      { field: "name", before: undefined, after: "Ada", kind: "added" },
    ]);

    expect(diffObjects({ email: "a@b.co" }, null)).toEqual([
      { field: "email", before: "a@b.co", after: undefined, kind: "removed" },
    ]);
  });

  it("handles an empty previous state as a list of additions", () => {
    expect(diffObjects(null, { name: "Acme", slug: "acme" })).toEqual([
      { field: "name", before: undefined, after: "Acme", kind: "added" },
      { field: "slug", before: undefined, after: "acme", kind: "added" },
    ]);
  });

  it("compares nested objects by value, not identity", () => {
    expect(diffObjects({ meta: { a: 1 } }, { meta: { a: 1 } })).toEqual([]);
    expect(diffObjects({ meta: { a: 1 } }, { meta: { a: 2 } })).toHaveLength(1);
  });

  it("wraps arrays and primitives under a value field", () => {
    expect(diffObjects(["a"], ["a", "b"])).toEqual([
      { field: "value", before: ["a"], after: ["a", "b"], kind: "changed" },
    ]);
  });
});

describe("formatDiffValue", () => {
  it("renders absent, null, scalar and object values", () => {
    expect(formatDiffValue(undefined)).toBe("—");
    expect(formatDiffValue(null)).toBe("null");
    expect(formatDiffValue("Acme")).toBe("Acme");
    expect(formatDiffValue(42)).toBe("42");
    expect(formatDiffValue(false)).toBe("false");
    expect(formatDiffValue({ a: 1 })).toBe('{"a":1}');
  });
});
