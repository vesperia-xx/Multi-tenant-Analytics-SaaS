import { describe, expect, it } from "vitest";

import { auditParamsSchema } from "./audit";

describe("auditParamsSchema", () => {
  it("defaults to the newest entries", () => {
    const parsed = auditParamsSchema.parse({});

    expect(parsed.direction).toBe("desc");
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
    expect(parsed.q).toBeUndefined();
  });

  it("keeps a valid action and drops a malformed date", () => {
    const parsed = auditParamsSchema.parse({
      action: "organization.updated",
      from: "yesterday",
      to: "2026-11-18",
      direction: "asc",
    });

    expect(parsed.action).toBe("organization.updated");
    expect(parsed.from).toBeUndefined();
    expect(parsed.to).toBe("2026-11-18");
    expect(parsed.direction).toBe("asc");
  });

  it("clamps pagination and ignores a junk direction", () => {
    const parsed = auditParamsSchema.parse({ pageSize: "500", page: "0", direction: "sideways" });

    expect(parsed.pageSize).toBe(50);
    expect(parsed.page).toBe(1);
    expect(parsed.direction).toBe("desc");
  });
});
