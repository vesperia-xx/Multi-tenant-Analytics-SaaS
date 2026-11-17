/**
 * Shape returned by the organisation Server Actions and consumed by
 * `useActionState`. Lives outside the `"use server"` module because such
 * modules may only export async functions.
 */
export type OrgFormState = {
  status: "idle" | "error" | "notice";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Dev / demo: the invite link surfaced to the inviter when mail is not configured. */
  inviteUrl?: string;
};

export const initialOrgState: OrgFormState = { status: "idle" };
