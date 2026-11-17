import { describe, expect, it } from "vitest";

import { collectFieldErrors, loginSchema, registerSchema, resetPasswordSchema } from "./auth";

describe("registerSchema", () => {
  it("normalises the email and trims names", () => {
    const parsed = registerSchema.parse({
      name: "  Ada Lovelace  ",
      email: "  ADA@Example.COM ",
      organizationName: "  Acme Inc.  ",
      password: "analytics2026",
    });

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.name).toBe("Ada Lovelace");
    expect(parsed.organizationName).toBe("Acme Inc.");
  });

  it("requires a long password with a letter and a number", () => {
    const short = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      organizationName: "Acme",
      password: "short1",
    });
    const lettersOnly = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      organizationName: "Acme",
      password: "onlylettershere",
    });
    const digitsOnly = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      organizationName: "Acme",
      password: "1234567890123",
    });

    expect(short.success).toBe(false);
    expect(lettersOnly.success).toBe(false);
    expect(digitsOnly.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const parsed = registerSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      organizationName: "Acme",
      password: "analytics2026",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("lowercases the email but keeps the password as typed", () => {
    const parsed = loginSchema.parse({
      email: " Owner@Acme.Test ",
      password: "Case-Sensitive-1",
    });

    expect(parsed.email).toBe("owner@acme.test");
    expect(parsed.password).toBe("Case-Sensitive-1");
  });
});

describe("resetPasswordSchema", () => {
  it("reports a mismatch on the confirmation field", () => {
    const parsed = resetPasswordSchema.safeParse({
      token: "a".repeat(24),
      password: "analytics2026",
      confirmPassword: "analytics2027",
    });

    expect(parsed.success).toBe(false);
    expect(collectFieldErrors(parsed.error!).confirmPassword).toBe("Passwords do not match.");
  });
});

describe("collectFieldErrors", () => {
  it("keeps the first message per field", () => {
    const parsed = registerSchema.safeParse({
      name: "A",
      email: "nope",
      organizationName: "",
      password: "short",
    });

    expect(parsed.success).toBe(false);
    const errors = collectFieldErrors(parsed.error!);

    expect(Object.keys(errors).sort()).toEqual(["email", "name", "organizationName", "password"]);
    expect(errors.name).toBe("Enter your name.");
  });
});
