import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AcceptInvitationForm } from "@/components/auth/accept-invitation-form";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthFormSkeleton, AuthHeading } from "@/components/auth/auth-heading";
import { ROLE_LABELS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { getViewer } from "@/server/auth/session";
import { hashToken } from "@/server/auth/tokens";

export const metadata: Metadata = {
  title: "Accept invitation",
  description: "Join a Vortex Metrics workspace.",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

export default async function InvitePage({ params }: { params: Params }) {
  return (
    <>
      <AuthHeading
        eyebrow="Invitation"
        title="Join the workspace"
        description="The invitation is tied to one email address and expires after seven days."
      />

      <Suspense fallback={<AuthFormSkeleton fields={1} />}>
        <InvitePanel params={params} />
      </Suspense>

      <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
        Wrong account?{" "}
        <Link href="/app" className="link-underline text-foreground">
          Switch account
        </Link>
      </p>
    </>
  );
}

async function InvitePanel({ params }: { params: Params }) {
  const { token } = await params;

  const viewer = await getViewer();
  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      organization: { select: { name: true, slug: true } },
      invitedBy: { select: { name: true } },
    },
  });

  if (!invitation) {
    return (
      <AuthMessage tone="error">
        This invitation link is invalid. Ask the workspace owner for a new one.
      </AuthMessage>
    );
  }

  if (invitation.acceptedAt) {
    return (
      <div className="flex flex-col gap-4">
        <AuthMessage tone="notice">
          This invitation was already accepted. Open the workspace from your account.
        </AuthMessage>
        <Link href="/app" className="link-underline text-sm text-primary">
          Go to your workspaces
        </Link>
      </div>
    );
  }

  if (invitation.revokedAt) {
    return (
      <AuthMessage tone="error">
        This invitation was revoked by the workspace. Ask an Owner or Admin for a new one.
      </AuthMessage>
    );
  }

  if (invitation.expiresAt <= new Date()) {
    return (
      <AuthMessage tone="error">
        This invitation has expired. Ask an Owner or Admin to send a new one.
      </AuthMessage>
    );
  }

  if (invitation.email.toLowerCase() !== viewer.user.email.toLowerCase()) {
    return (
      <div className="flex flex-col gap-4">
        <AuthMessage tone="error">
          This invitation was sent to {invitation.email}. You are signed in as{" "}
          {viewer.user.email}, so it cannot be accepted from this session.
        </AuthMessage>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Sign in with the invited address to accept, or ask the workspace to invite the address
          you are using.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {invitation.invitedBy.name} invited {invitation.email} to{" "}
        <span className="text-foreground">{invitation.organization.name}</span>. Joining adds the
        workspace to your account — it does not move your other memberships.
      </p>

      <AcceptInvitationForm
        token={token}
        organizationName={invitation.organization.name}
        roleLabel={ROLE_LABELS[invitation.role]}
      />
    </div>
  );
}
