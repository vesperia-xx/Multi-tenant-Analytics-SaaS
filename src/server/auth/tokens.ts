import { createHash, randomBytes } from "node:crypto";

/**
 * Opaque bearer tokens: the raw value only ever exists in the cookie (or reset
 * link) and in memory. The database stores a SHA-256 digest, so a leaked dump
 * cannot be replayed as a session.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
