import { randomBytes } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";

/**
 * Slugs appear in `/app/[orgSlug]`, so they must be URL-safe, stable and
 * readable. Reserved words are skipped to keep application routes free.
 */
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "billing",
  "dashboard",
  "demo",
  "docs",
  "help",
  "login",
  "logout",
  "new",
  "org",
  "register",
  "reset-password",
  "settings",
  "signup",
  "support",
  "system",
  "team",
]);

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

/**
 * Finds the first free slug for a workspace name. Runs inside the registration
 * transaction, so the `UNIQUE` constraint stays the final source of truth.
 */
export async function resolveUniqueSlug(
  client: Pick<Prisma.TransactionClient, "organization">,
  name: string,
): Promise<string> {
  const base = slugify(name) || "workspace";

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    if (RESERVED_SLUGS.has(candidate)) continue;

    const existing = await client.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;
  }

  return `${base}-${randomBytes(3).toString("hex")}`;
}
