import { describe, expect, it } from "vitest";

import { hashPassword, passwordHashInternals, verifyPassword } from "./password";

describe("password hashing", () => {
  it("stores a self-describing scrypt hash", async () => {
    const hash = await hashPassword("correct horse battery 9");
    const parts = hash.split("$");

    expect(parts[0]).toBe("scrypt");
    expect(parts[1]).toBe("1");
    expect(parts[2]).toBe("16384");
    expect(parts).toHaveLength(7);
    expect(hash).not.toContain("correct horse");
  });

  it("verifies the right password and rejects any other", async () => {
    const hash = await hashPassword("s3cret-passphrase");

    await expect(verifyPassword("s3cret-passphrase", hash)).resolves.toBe(true);
    await expect(verifyPassword("s3cret-passphras", hash)).resolves.toBe(false);
    await expect(verifyPassword("", hash)).resolves.toBe(false);
  });

  it("uses a new salt for every hash", async () => {
    const [first, second] = await Promise.all([
      hashPassword("same-password-1"),
      hashPassword("same-password-1"),
    ]);

    expect(first).not.toBe(second);
    await expect(verifyPassword("same-password-1", first)).resolves.toBe(true);
    await expect(verifyPassword("same-password-1", second)).resolves.toBe(true);
  });

  it("handles unicode and long passphrases", async () => {
    const password = `contraseña-${"x".repeat(100)}-9`;
    const hash = await hashPassword(password);

    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("returns false instead of throwing on missing or malformed hashes", async () => {
    await expect(verifyPassword("anything", null)).resolves.toBe(false);
    await expect(verifyPassword("anything", undefined)).resolves.toBe(false);
    await expect(verifyPassword("anything", "")).resolves.toBe(false);
    await expect(verifyPassword("anything", "plaintext")).resolves.toBe(false);
    await expect(verifyPassword("anything", "scrypt$2$16384$8$1$aaaa$bbbb")).resolves.toBe(false);
    await expect(
      verifyPassword("anything", "scrypt$1$999999999$8$1$aaaaaaaaaaaaaaaaaaaaaa$bbbb"),
    ).resolves.toBe(false);
  });

  it("keeps the parser bounds tight", () => {
    const { parseHash } = passwordHashInternals;

    expect(
      parseHash(`scrypt$1$16384$8$1$${"A".repeat(22)}$${"A".repeat(86)}`),
    ).not.toBeNull();
    expect(parseHash(`scrypt$1$1024$8$1$${"A".repeat(22)}$${"A".repeat(86)}`)).toBeNull();
    expect(parseHash(`scrypt$1$16384$999$1$${"A".repeat(22)}$${"A".repeat(86)}`)).toBeNull();
  });
});
