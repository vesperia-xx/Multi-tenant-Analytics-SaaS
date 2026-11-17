"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Role } from "@/generated/prisma/enums";
import { serverEnv } from "@/lib/env";
import { INVITATION_TTL_DAYS, INVITATION_TTL_MS, WORKSPACES_PER_USER_LIMIT } from "@/lib/org-constants";
import type { OrgFormState } from "@/lib/org-form-state";
import { assignableRoles, can, canManageMember, ROLE_LABELS } from "@/lib/permissions";
import {
  acceptInvitationSchema,
  changeMemberRoleSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  removeMemberSchema,
  revokeInvitationSchema,
  updateWorkspaceSchema,
} from "@/lib/validation/org";
import { collectFieldErrors } from "@/lib/validation/common";
import { prisma } from "@/server/db/client";
import { sendInvitationEmail } from "@/server/email/send";
import { getViewer, requestMetadata, requireViewer, setActiveOrganization } from "@/server/auth/session";
import { generateToken, hashToken } from "@/server/auth/tokens";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import { recordAudit } from "@/server/auth/audit";
import { resolveUniqueSlug } from "@/server/org/slug";
import { resolveOrgContext } from "@/server/org/context";

function fail(message: string): OrgFormState {
  return { status: "error", message };
}

function retryMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function settingsPath(slug: string): string {
  return `/app/${slug}/settings`;
}

/**
 * Creating a workspace is open to any signed-in user: they become its Owner,
 * with the same two audit entries registration writes.
 */
export async function createWorkspaceAction(
  _previous: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const parsed = createWorkspaceSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: collectFieldErrors(parsed.error) };
  }

  const viewer = await requireViewer("/app");
  const { ip, userAgent } = await requestMetadata();

  const owned = await prisma.membership.count({ where: { userId: viewer.user.id } });
  if (owned >= WORKSPACES_PER_USER_LIMIT) {
    return fail(`You already belong to ${WORKSPACES_PER_USER_LIMIT} workspaces.`);
  }

  const limit = await consumeRateLimit(`org:create:${viewer.user.id}`, 5, 60 * 60);
  if (!limit.allowed) return fail(retryMessage(limit.retryAfterSeconds));

  let created: { id: string; slug: string };

  try {
    created = await prisma.$transaction(async (tx) => {
      const workspaceSlug = await resolveUniqueSlug(tx, parsed.data.name);

      const organization = await tx.organization.create({
        data: { name: parsed.data.name, slug: workspaceSlug },
        select: { id: true, name: true, slug: true },
      });

      await tx.membership.create({
        data: {
          userId: viewer.user.id,
          organizationId: organization.id,
          role: Role.OWNER,
        },
        select: { id: true },
      });

      await tx.auditLog.createMany({
        data: [
          {
            organizationId: organization.id,
            actorId: viewer.user.id,
            action: "organization.created",
            resourceType: "organization",
            resourceId: organization.id,
            after: { name: organization.name, slug: organization.slug },
            ip,
            userAgent,
          },
          {
            organizationId: organization.id,
            actorId: viewer.user.id,
            action: "member.joined",
            resourceType: "membership",
            resourceId: viewer.user.id,
            after: { email: viewer.user.email, role: Role.OWNER },
            ip,
            userAgent,
          },
        ],
      });

      return { id: organization.id, slug: organization.slug };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "error", fieldErrors: { name: "That workspace name is taken." } };
    }
    throw error;
  }

  await setActiveOrganization(viewer.sessionId, created.id);
  redirect(`/app/${created.slug}`);
}

/**
 * Switching is a write, not a claim: the membership is re-checked and the
 * session hint is updated. Unknown slugs fall back to the account page.
 */
export async function switchWorkspaceAction(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=%2Fapp");

  const slug = formData.get("slug");
  if (typeof slug !== "string" || !slug) redirect("/app");

  const membership = await prisma.membership.findFirst({
    where: { userId: viewer.user.id, organization: { slug } },
    select: { organizationId: true },
  });

  if (!membership) redirect("/app");

  await setActiveOrganization(viewer.sessionId, membership.organizationId);
  redirect(`/app/${slug}`);
}

export async function updateWorkspaceAction(
  _previous: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const parsed = updateWorkspaceSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: collectFieldErrors(parsed.error) };
  }

  const slug = String(formData.get("slug") ?? "");
  const context = await resolveOrgContext(slug);
  if (!context) return fail("Workspace not found.");
  if (!can(context.membership.role, "org:update")) {
    return fail("You do not have permission to change this workspace.");
  }

  const before = {
    name: context.organization.name,
    currency: context.organization.currency,
    timezone: context.organization.timezone,
  };

  if (
    before.name === parsed.data.name &&
    before.currency === parsed.data.currency &&
    before.timezone === parsed.data.timezone
  ) {
    return { status: "notice", message: "Nothing to save." };
  }

  await prisma.organization.update({
    where: { id: context.organization.id },
    data: {
      name: parsed.data.name,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
    },
    select: { id: true },
  });

  const { ip, userAgent } = await requestMetadata();
  await recordAudit({
    organizationId: context.organization.id,
    actorId: context.viewer.user.id,
    action: "organization.updated",
    resourceType: "organization",
    resourceId: context.organization.id,
    before,
    after: parsed.data,
    ip,
    userAgent,
  });

  revalidatePath(`/app/${slug}`);
  revalidatePath(settingsPath(slug));

  return { status: "notice", message: "Workspace updated." };
}

export async function inviteMemberAction(
  _previous: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const parsed = inviteMemberSchema.safeParse({
    slug: formData.get("slug"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { slug, email, role } = parsed.data;
  const context = await resolveOrgContext(slug);
  if (!context) return fail("Workspace not found.");

  if (!can(context.membership.role, "member:invite")) {
    return fail("You do not have permission to invite members.");
  }

  if (!assignableRoles(context.membership.role).includes(role)) {
    return fail("You cannot assign that role.");
  }

  const limit = await consumeRateLimit(`org:invite:${context.organization.id}`, 20, 60 * 60);
  if (!limit.allowed) return fail(retryMessage(limit.retryAfterSeconds));

  const alreadyMember = await prisma.membership.findFirst({
    where: { organizationId: context.organization.id, user: { email } },
    select: { id: true },
  });

  if (alreadyMember) {
    return { status: "error", fieldErrors: { email: "That person is already a member." } };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  await prisma.$transaction([
    // Re-inviting replaces the previous pending link instead of stacking them.
    prisma.invitation.updateMany({
      where: {
        organizationId: context.organization.id,
        email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    }),
    prisma.invitation.create({
      data: {
        organizationId: context.organization.id,
        email,
        role,
        tokenHash: hashToken(token),
        invitedById: context.viewer.user.id,
        expiresAt,
      },
      select: { id: true },
    }),
  ]);

  const { ip, userAgent } = await requestMetadata();
  await recordAudit({
    organizationId: context.organization.id,
    actorId: context.viewer.user.id,
    action: "invitation.created",
    resourceType: "invitation",
    resourceId: null,
    after: { email, role },
    ip,
    userAgent,
  });

  const url = new URL(`/invite/${token}`, serverEnv().NEXT_PUBLIC_APP_URL);
  const { delivered } = await sendInvitationEmail({
    to: email,
    inviterName: context.viewer.user.name,
    organizationName: context.organization.name,
    roleLabel: ROLE_LABELS[role],
    url: url.toString(),
    expiresInDays: INVITATION_TTL_DAYS,
  });

  revalidatePath(settingsPath(slug));

  // The link is shown to the inviter, who already holds `member:invite`.
  // It is never exposed to the invitee through this screen.
  const canSurfaceLink = !delivered && (process.env.NODE_ENV !== "production" || serverEnv().DEMO_MODE);

  return {
    status: "notice",
    message: delivered
      ? `Invitation sent to ${email}.`
      : `Invitation created for ${email}. No mail provider is configured.`,
    inviteUrl: canSurfaceLink ? url.toString() : undefined,
  };
}

export async function revokeInvitationAction(
  _previous: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const parsed = revokeInvitationSchema.safeParse({
    slug: formData.get("slug"),
    invitationId: formData.get("invitationId"),
  });

  if (!parsed.success) return fail("Invitation not found.");

  const context = await resolveOrgContext(parsed.data.slug);
  if (!context) return fail("Workspace not found.");
  if (!can(context.membership.role, "member:invite")) {
    return fail("You do not have permission to manage invitations.");
  }

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: parsed.data.invitationId,
      organizationId: context.organization.id,
      acceptedAt: null,
      revokedAt: null,
    },
    select: { id: true, email: true, role: true },
  });

  if (!invitation) return fail("That invitation is already closed.");

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { revokedAt: new Date() },
    select: { id: true },
  });

  const { ip, userAgent } = await requestMetadata();
  await recordAudit({
    organizationId: context.organization.id,
    actorId: context.viewer.user.id,
    action: "invitation.revoked",
    resourceType: "invitation",
    resourceId: invitation.id,
    before: { email: invitation.email, role: invitation.role },
    ip,
    userAgent,
  });

  revalidatePath(settingsPath(parsed.data.slug));
  return { status: "notice", message: "Invitation revoked." };
}

export async function changeMemberRoleAction(
  _previous: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const parsed = changeMemberRoleSchema.safeParse({
    slug: formData.get("slug"),
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });

  if (!parsed.success) return fail("Member not found.");

  const context = await resolveOrgContext(parsed.data.slug);
  if (!context) return fail("Workspace not found.");
  if (!can(context.membership.role, "member:manage")) {
    return fail("You do not have permission to change roles.");
  }

  const member = await prisma.membership.findFirst({
    where: { id: parsed.data.memberId, organizationId: context.organization.id },
    select: { id: true, role: true, userId: true, user: { select: { email: true } } },
  });

  if (!member) return fail("Member not found.");
  if (member.userId === context.viewer.user.id) {
    return fail("You cannot change your own role.");
  }
  if (!canManageMember(context.membership.role, member.role)) {
    return fail("You cannot change that member's role.");
  }
  if (!assignableRoles(context.membership.role).includes(parsed.data.role)) {
    return fail("You cannot assign that role.");
  }

  if (member.role === parsed.data.role) {
    return { status: "notice", message: "Role unchanged." };
  }

  await prisma.membership.update({
    where: { id: member.id },
    data: { role: parsed.data.role },
    select: { id: true },
  });

  const { ip, userAgent } = await requestMetadata();
  await recordAudit({
    organizationId: context.organization.id,
    actorId: context.viewer.user.id,
    action: "member.role_changed",
    resourceType: "membership",
    resourceId: member.id,
    before: { email: member.user.email, role: member.role },
    after: { email: member.user.email, role: parsed.data.role },
    ip,
    userAgent,
  });

  revalidatePath(settingsPath(parsed.data.slug));
  return { status: "notice", message: "Role updated." };
}

export async function removeMemberAction(
  _previous: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const parsed = removeMemberSchema.safeParse({
    slug: formData.get("slug"),
    memberId: formData.get("memberId"),
  });

  if (!parsed.success) return fail("Member not found.");

  const context = await resolveOrgContext(parsed.data.slug);
  if (!context) return fail("Workspace not found.");
  if (!can(context.membership.role, "member:manage")) {
    return fail("You do not have permission to remove members.");
  }

  const member = await prisma.membership.findFirst({
    where: { id: parsed.data.memberId, organizationId: context.organization.id },
    select: { id: true, role: true, userId: true, user: { select: { email: true } } },
  });

  if (!member) return fail("Member not found.");
  if (member.userId === context.viewer.user.id) {
    return fail("You cannot remove yourself.");
  }
  if (!canManageMember(context.membership.role, member.role)) {
    return fail("You cannot remove that member.");
  }

  await prisma.membership.delete({ where: { id: member.id }, select: { id: true } });

  const { ip, userAgent } = await requestMetadata();
  await recordAudit({
    organizationId: context.organization.id,
    actorId: context.viewer.user.id,
    action: "member.removed",
    resourceType: "membership",
    resourceId: member.id,
    before: { email: member.user.email, role: member.role },
    ip,
    userAgent,
  });

  revalidatePath(settingsPath(parsed.data.slug));
  return { status: "notice", message: "Member removed." };
}

/**
 * Accepting requires the signed-in account to match the invited address, so a
 * leaked link cannot be redeemed by a different user.
 */
export async function acceptInvitationAction(
  _previous: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const parsed = acceptInvitationSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) {
    return fail("This invitation link is invalid or incomplete.");
  }

  const viewer = await getViewer();
  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${parsed.data.token}`)}`);
  }

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!invitation) return fail("This invitation link is invalid or has expired.");
  if (invitation.acceptedAt) return fail("This invitation was already accepted.");
  if (invitation.revokedAt) return fail("This invitation was revoked by the workspace.");
  if (invitation.expiresAt <= new Date()) return fail("This invitation has expired. Ask for a new one.");

  if (invitation.email.toLowerCase() !== viewer.user.email.toLowerCase()) {
    return fail(
      `This invitation was sent to ${invitation.email}. Sign in with that address to accept it.`,
    );
  }

  const { ip, userAgent } = await requestMetadata();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: viewer.user.id,
          organizationId: invitation.organization.id,
        },
      },
      select: { id: true, role: true },
    });

    if (existing) {
      await tx.membership.update({
        where: { id: existing.id },
        data: { role: invitation.role },
        select: { id: true },
      });
    } else {
      await tx.membership.create({
        data: {
          userId: viewer.user.id,
          organizationId: invitation.organization.id,
          role: invitation.role,
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          organizationId: invitation.organization.id,
          actorId: viewer.user.id,
          action: "member.joined",
          resourceType: "membership",
          resourceId: viewer.user.id,
          after: { email: viewer.user.email, role: invitation.role },
          ip,
          userAgent,
        },
      });
    }

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
      select: { id: true },
    });

    // Any other pending link for the same address is now redundant.
    await tx.invitation.updateMany({
      where: {
        organizationId: invitation.organization.id,
        email: invitation.email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  });

  await setActiveOrganization(viewer.sessionId, invitation.organization.id);
  redirect(`/app/${invitation.organization.slug}`);
}
