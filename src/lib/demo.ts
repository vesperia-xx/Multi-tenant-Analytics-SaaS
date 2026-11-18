/**
 * Shared demo-mode constants and guards.
 *
 * Kept free of `server-only` so the seed script, the login screen and the
 * Server Actions can all import the same values. The environment flag is
 * passed in explicitly, which keeps the predicate pure and testable.
 */

export const DEMO_EMAIL = "demo@vortex.test";
export const DEMO_PASSWORD = "vortex-demo-1";

/** Advertised on the login screen and in the README. */
export const DEMO_WORKSPACES = [
  { slug: "acme-inc", name: "Acme Inc", role: "Owner" },
  { slug: "nordwind-studio", name: "Nordwind Studio", role: "Admin" },
] as const;

export const DEMO_READ_ONLY_MESSAGE =
  "This is a read-only demo. Browse dashboards, tables, audit entries and exports freely, but settings, invitations and member changes are disabled.";

export const DEMO_ACCOUNT_MESSAGE =
  "The shared demo account is read-only. Create your own account to change workspace settings or invite people.";

/**
 * Read-only applies to both seeded demo organisations and the shared demo
 * account: the account may own a non-demo workspace locally, and that workspace
 * must not become a back door into demo mode.
 */
export function isDemoReadOnly(isDemo: boolean, readOnly: boolean): boolean {
  return isDemo && readOnly;
}
