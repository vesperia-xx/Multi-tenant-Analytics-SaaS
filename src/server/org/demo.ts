import "server-only";

import type { OrgFormState } from "@/lib/org-form-state";
import { DEMO_ACCOUNT_MESSAGE, DEMO_READ_ONLY_MESSAGE, isDemoReadOnly } from "@/lib/demo";
import { serverEnv } from "@/lib/env";
import type { OrgContext } from "@/server/org/context";

export function isReadOnlyOrg(organization: { isDemo: boolean }): boolean {
  return isDemoReadOnly(organization.isDemo, serverEnv().DEMO_READ_ONLY);
}

export function isReadOnlyAccount(user: { isDemo: boolean }): boolean {
  return isDemoReadOnly(user.isDemo, serverEnv().DEMO_READ_ONLY);
}

/**
 * Server Actions call this after resolving the tenant. A demo organisation is
 * locked, and so is the shared demo account even when it opens a regular
 * workspace created before demo mode existed.
 */
export function demoWriteBlocked(context: OrgContext): OrgFormState | null {
  if (isReadOnlyAccount(context.viewer.user)) {
    return { status: "error", message: DEMO_ACCOUNT_MESSAGE };
  }

  if (isReadOnlyOrg(context.organization)) {
    return { status: "error", message: DEMO_READ_ONLY_MESSAGE };
  }

  return null;
}
