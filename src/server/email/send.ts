import "server-only";

import { serverEnv } from "@/lib/env";

type PasswordResetEmail = {
  to: string;
  name: string;
  url: string;
  expiresInMinutes: number;
};

/**
 * Sends the reset link through Resend when credentials exist. Without them the
 * flow still works locally: the link is printed to the server log and, in demo
 * mode, handed back to the UI for seeded demo accounts.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  url,
  expiresInMinutes,
}: PasswordResetEmail): Promise<{ delivered: boolean }> {
  const env = serverEnv();

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[auth] password reset link for ${to}: ${url}`);
    } else {
      console.warn("[auth] password reset requested but no email provider is configured");
    }

    return { delivered: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to,
      subject: "Reset your Vortex Metrics password",
      text: [
        `Hi ${name},`,
        "",
        `Use this link to choose a new password. It expires in ${expiresInMinutes} minutes and can only be used once:`,
        url,
        "",
        "If you did not request it, ignore this email — your password stays the same.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    console.error(`[auth] Resend rejected the reset email (${response.status})`);
    return { delivered: false };
  }

  return { delivered: true };
}

type InvitationEmail = {
  to: string;
  inviterName: string;
  organizationName: string;
  roleLabel: string;
  url: string;
  expiresInDays: number;
};

/**
 * Invitations follow the same optional-provider rule as resets. The link is
 * returned to the inviter — not to the invitee — because the inviter is the
 * person who already holds the permission to create it.
 */
export async function sendInvitationEmail({
  to,
  inviterName,
  organizationName,
  roleLabel,
  url,
  expiresInDays,
}: InvitationEmail): Promise<{ delivered: boolean }> {
  const env = serverEnv();

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[org] invitation link for ${to}: ${url}`);
    } else {
      console.warn("[org] invitation created but no email provider is configured");
    }

    return { delivered: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to,
      subject: `Join ${organizationName} on Vortex Metrics`,
      text: [
        `Hi,`,
        "",
        `${inviterName} invited you to ${organizationName} as ${roleLabel}.`,
        `Open this link to accept. It expires in ${expiresInDays} days:`,
        url,
        "",
        "If you were not expecting this invitation, ignore this email.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    console.error(`[org] Resend rejected the invitation email (${response.status})`);
    return { delivered: false };
  }

  return { delivered: true };
}
