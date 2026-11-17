import { describe, expect, it } from "vitest";

import { Role } from "@/generated/prisma/enums";

import { assignableRoles, can, canManageMember } from "./permissions";

describe("permission matrix", () => {
  it("lets every role read data and export", () => {
    for (const role of Object.values(Role)) {
      expect(can(role, "data:read")).toBe(true);
      expect(can(role, "export")).toBe(true);
    }
  });

  it("keeps product writes above Manager and settings above Manager", () => {
    expect(can("OWNER", "product:write")).toBe(true);
    expect(can("ADMIN", "product:write")).toBe(true);
    expect(can("MANAGER", "product:write")).toBe(false);
    expect(can("VIEWER", "product:write")).toBe(false);

    expect(can("OWNER", "org:update")).toBe(true);
    expect(can("ADMIN", "org:update")).toBe(true);
    expect(can("MANAGER", "org:update")).toBe(false);
  });

  it("reserves deletion and audit for the right roles", () => {
    expect(can("OWNER", "org:delete")).toBe(true);
    expect(can("ADMIN", "org:delete")).toBe(false);
    expect(can("MANAGER", "audit:read")).toBe(false);
    expect(can("VIEWER", "audit:read")).toBe(false);
  });
});

describe("assignableRoles", () => {
  it("lets an Owner mint Admins but not another Owner", () => {
    expect(assignableRoles("OWNER")).toEqual(["ADMIN", "MANAGER", "VIEWER"]);
  });

  it("stops an Admin from creating peers", () => {
    expect(assignableRoles("ADMIN")).toEqual(["MANAGER", "VIEWER"]);
  });

  it("gives Managers and Viewers nothing", () => {
    expect(assignableRoles("MANAGER")).toEqual([]);
    expect(assignableRoles("VIEWER")).toEqual([]);
  });
});

describe("canManageMember", () => {
  it("never allows touching an Owner", () => {
    expect(canManageMember("OWNER", "OWNER")).toBe(false);
    expect(canManageMember("ADMIN", "OWNER")).toBe(false);
  });

  it("requires a strictly higher rank", () => {
    expect(canManageMember("OWNER", "ADMIN")).toBe(true);
    expect(canManageMember("ADMIN", "MANAGER")).toBe(true);
    expect(canManageMember("ADMIN", "ADMIN")).toBe(false);
    expect(canManageMember("MANAGER", "VIEWER")).toBe(false);
  });
});
