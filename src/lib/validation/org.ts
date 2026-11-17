import { z } from "zod";

import { Role } from "@/generated/prisma/enums";

import { emailField } from "./common";

/** Slugs are immutable in Phase 3: changing one would break every shared link. */
export const orgSlugField = z
  .string()
  .trim()
  .min(1, "Workspace is missing.")
  .max(48)
  .regex(/^[a-z0-9-]+$/, "Invalid workspace.");

const workspaceName = z
  .string()
  .trim()
  .min(2, "Enter a workspace name.")
  .max(60, "Workspace name is too long.");

const roleField = z.enum([Role.OWNER, Role.ADMIN, Role.MANAGER, Role.VIEWER], {
  error: "Choose a valid role.",
});

const currencyField = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a three-letter currency code, e.g. USD.");

const timezoneField = z
  .string()
  .trim()
  .min(1, "Choose a time zone.")
  .max(64, "Time zone is too long.")
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Unknown time zone.");

export const createWorkspaceSchema = z.object({ name: workspaceName });

export const updateWorkspaceSchema = z.object({
  name: workspaceName,
  currency: currencyField,
  timezone: timezoneField,
});

export const inviteMemberSchema = z.object({
  slug: orgSlugField,
  email: emailField,
  role: roleField,
});

export const changeMemberRoleSchema = z.object({
  slug: orgSlugField,
  memberId: z.string().min(1, "Member is missing."),
  role: roleField,
});

export const removeMemberSchema = z.object({
  slug: orgSlugField,
  memberId: z.string().min(1, "Member is missing."),
});

export const revokeInvitationSchema = z.object({
  slug: orgSlugField,
  invitationId: z.string().min(1, "Invitation is missing."),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(20, "This invitation link is invalid."),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
