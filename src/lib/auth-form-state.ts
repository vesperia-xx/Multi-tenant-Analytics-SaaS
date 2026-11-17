/**
 * Shape returned by the auth Server Actions and consumed by `useActionState`.
 * Lives outside the `"use server"` module because such modules may only export
 * async functions.
 */
export type AuthFormState = {
  status: "idle" | "error" | "notice";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Demo-only: a reset link surfaced in the UI when no mail provider is set. */
  resetUrl?: string;
};

export const initialAuthState: AuthFormState = { status: "idle" };
