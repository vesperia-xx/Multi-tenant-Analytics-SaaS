import { describe, expect, it } from "vitest";

import { collectFieldErrors } from "./common";
import {
  acceptInvitationSchema,
  changeMemberRoleSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  orgSlugField,
  updateWorkspaceSchema,
} from "./org";

describe("createWorkspaceSchema", () => {
  it("trims the name and enforces a minimum length", () => {
    expect(createWorkspaceSchema.parse({ name: "  Nordwind Studio  " }).name).toBe(
      "Nordwind Studio",
    );
    expect(createWorkspaceSchema.safeParse({ name: "A" }).success).toBe(false);
  });
});

describe("updateWorkspaceSchema", () => {
  it("upper-cases the currency and accepts a real IANA zone", () => {
    const parsed = updateWorkspaceSchema.parse({
      name: "Acme Inc.",
      currency: "usd",
      timezone: "Europe/Madrid",
    });

    expect(parsed.currency).toBe("USD");
  });

  it("rejects an unknown time zone and a non-ISO currency", () => {
    const badZone = updateWorkspaceSchema.safeParse({
      name: "Acme Inc.",
      currency: "USD",
      timezone: "Mars/Olympus",
    });
    const badCurrency = updateWorkspaceSchema.safeParse({
      name: "Acme Inc.",
      currency: "dollars",
      timezone: "UTC",
    });

    expect(badZone.success).toBe(false);
    expect(badCurrency.success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("normalises the email and keeps a valid role", () => {
    const parsed = inviteMemberSchema.parse({
      slug: "acme-inc",
      email: "  ADA@Example.COM ",
      role: "ADMIN",
    });

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.role).toBe("ADMIN");
  });

  it("reports field errors for a bad email and role", () => {
    const parsed = inviteMemberSchema.safeParse({
      slug: "acme-inc",
      email: "not-an-email",
      role: "SUPERUSER",
    });

    expect(parsed.success).toBe(false);
    const errors = collectFieldErrors(parsed.error!);
    expect(Object.keys(errors).sort()).toEqual(["email", "role"]);
  });
});

describe("changeMemberRoleSchema", () => {
  it("requires a member id and a known role", () => {
    expect(
      changeMemberRoleSchema.safeParse({ slug: "acme", memberId: "", role: "ADMIN" }).success,
    ).toBe(false);
    expect(
      changeMemberRoleSchema.safeParse({ slug: "acme", memberId: "m1", role: "VIEWER" }).success,
    ).toBe(true);
  });
});

describe("orgSlugField", () => {
  it("only accepts lowercase url-safe slugs", () => {
    expect(orgSlugField.safeParse("acme-inc").success).toBe(true);
    expect(orgSlugField.safeParse("Acme Inc").success).toBe(false);
    expect(orgSlugField.safeParse("../api").success).toBe(false);
  });
});

describe("acceptInvitationSchema", () => {
  it("rejects a truncated token", () => {
    expect(acceptInvitationSchema.safeParse({ token: "short" }).success).toBe(false);
    expect(acceptInvitationSchema.safeParse({ token: "a".repeat(43) }).success).toBe(true);
  });
});
