"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Role } from "@/generated/prisma/enums";
import { RESET_TOKEN_TTL_MS } from "@/lib/auth-constants";
import type { AuthFormState } from "@/lib/auth-form-state";
import { DEMO_EMAIL } from "@/lib/demo";
import { serverEnv } from "@/lib/env";
import {
  collectFieldErrors,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { prisma } from "@/server/db/client";
import { setTenantContext } from "@/server/db/tenant";
import { sendPasswordResetEmail } from "@/server/email/send";
import { isReadOnlyAccount } from "@/server/org/demo";
import { resolveUniqueSlug } from "@/server/org/slug";

import { hashPassword, verifyPassword } from "./password";
import { consumeRateLimit } from "./rate-limit";
import {
  createSession,
  destroyCurrentSession,
  getViewer,
  requestMetadata,
  revokeOtherSessions,
} from "./session";
import { generateToken, hashToken } from "./tokens";

/** Only same-origin absolute paths are accepted, so `next` cannot become an open redirect. */
function safeNextPath(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/app";
  return path;
}

function retryMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { email, password } = parsed.data;
  const { ip } = await requestMetadata();

  const ipLimit = await consumeRateLimit(`auth:login:ip:${ip ?? "unknown"}`, 20, 15 * 60);
  if (!ipLimit.allowed) {
    return { status: "error", message: retryMessage(ipLimit.retryAfterSeconds) };
  }

  const accountLimit = await consumeRateLimit(`auth:login:account:${hashToken(email)}`, 5, 15 * 60);
  if (!accountLimit.allowed) {
    return { status: "error", message: retryMessage(accountLimit.retryAfterSeconds) };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  const passwordMatches = await verifyPassword(password, user?.passwordHash);

  if (!user || !passwordMatches) {
    return { status: "error", message: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect(safeNextPath(formData.get("next")));
}

/**
 * One-click access for the public demo. It is only registered when
 * `DEMO_MODE` is on, still passes through the IP rate limiter, and only ever
 * signs in the seeded `is_demo` account.
 */
export async function demoLoginAction(): Promise<void> {
  if (!serverEnv().DEMO_MODE) redirect("/login?demo=unavailable");

  const { ip } = await requestMetadata();
  const limit = await consumeRateLimit(`auth:demo:ip:${ip ?? "unknown"}`, 30, 60 * 60);
  if (!limit.allowed) redirect("/login?demo=limited");

  const user = await prisma.user.findFirst({
    where: { email: DEMO_EMAIL, isDemo: true },
    select: { id: true },
  });

  if (!user) redirect("/login?demo=unavailable");

  await createSession(user.id);
  redirect("/app");
}

export async function registerAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    organizationName: formData.get("organizationName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { name, email, organizationName, password } = parsed.data;
  const { ip, userAgent } = await requestMetadata();

  const ipLimit = await consumeRateLimit(`auth:register:ip:${ip ?? "unknown"}`, 5, 60 * 60);
  if (!ipLimit.allowed) {
    return { status: "error", message: retryMessage(ipLimit.retryAfterSeconds) };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      status: "error",
      fieldErrors: { email: "An account with this email already exists." },
    };
  }

  const passwordHash = await hashPassword(password);

  let userId: string;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash },
        select: { id: true },
      });

      const slug = await resolveUniqueSlug(tx, organizationName);
      const organization = await tx.organization.create({
        data: { name: organizationName, slug },
        select: { id: true, name: true, slug: true },
      });

      await setTenantContext(tx, organization.id);

      await tx.membership.create({
        data: { userId: user.id, organizationId: organization.id, role: Role.OWNER },
        select: { id: true },
      });

      await tx.auditLog.createMany({
        data: [
          {
            organizationId: organization.id,
            actorId: user.id,
            action: "organization.created",
            resourceType: "organization",
            resourceId: organization.id,
            after: { name: organization.name, slug: organization.slug },
            ip,
            userAgent,
          },
          {
            organizationId: organization.id,
            actorId: user.id,
            action: "member.joined",
            resourceType: "membership",
            resourceId: user.id,
            after: { email, role: Role.OWNER },
            ip,
            userAgent,
          },
        ],
      });

      return user;
    });

    userId = created.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        fieldErrors: { email: "An account with this email already exists." },
      };
    }

    throw error;
  }

  await createSession(userId);
  redirect("/app");
}

export async function requestPasswordResetAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { status: "error", fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { email } = parsed.data;
  const env = serverEnv();
  const { ip } = await requestMetadata();

  const ipLimit = await consumeRateLimit(`auth:forgot:ip:${ip ?? "unknown"}`, 10, 60 * 60);
  if (!ipLimit.allowed) {
    return { status: "error", message: retryMessage(ipLimit.retryAfterSeconds) };
  }

  const genericResponse: AuthFormState = {
    status: "notice",
    message:
      "If an account exists for that email, a reset link is on its way. It expires in 60 minutes.",
  };

  const accountLimit = await consumeRateLimit(`auth:forgot:account:${hashToken(email)}`, 3, 60 * 60);
  if (!accountLimit.allowed) return genericResponse;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isDemo: true },
  });

  if (!user) return genericResponse;

  // A shared demo account must not be taken over by a visitor: skip the token
  // entirely and keep the response indistinguishable from the generic one.
  if (user.isDemo && env.DEMO_READ_ONLY) return genericResponse;

  const token = generateToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.$transaction([
    // A new link invalidates the previous ones.
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
      select: { id: true },
    }),
  ]);

  const resetUrl = new URL("/reset-password", env.NEXT_PUBLIC_APP_URL);
  resetUrl.searchParams.set("token", token);

  const { delivered } = await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    url: resetUrl.toString(),
    expiresInMinutes: 60,
  });

  // Without a mail provider the link is only surfaced for seeded demo accounts
  // (plus local development), never for a real visitor's account.
  const canSurfaceLink =
    !delivered && (process.env.NODE_ENV !== "production" || (env.DEMO_MODE && user.isDemo));

  return canSurfaceLink ? { ...genericResponse, resetUrl: resetUrl.toString() } : genericResponse;
}

export async function resetPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: collectFieldErrors(parsed.error) };
  }

  const { token, password } = parsed.data;
  const { ip } = await requestMetadata();

  const ipLimit = await consumeRateLimit(`auth:reset:ip:${ip ?? "unknown"}`, 10, 60 * 60);
  if (!ipLimit.allowed) {
    return { status: "error", message: retryMessage(ipLimit.retryAfterSeconds) };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: { select: { isDemo: true } },
    },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return {
      status: "error",
      message: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  if (record.user.isDemo && serverEnv().DEMO_READ_ONLY) {
    return {
      status: "error",
      message: "The shared demo password is fixed. Create your own account to change a password.",
    };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
      select: { id: true },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
      select: { id: true },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    // A password change signs out every other device.
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await destroyCurrentSession();
  redirect("/login?reset=1");
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/");
}

export async function revokeOtherSessionsAction(): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (isReadOnlyAccount(viewer.user)) redirect("/app");

  await revokeOtherSessions(viewer.user.id, viewer.sessionId);
  revalidatePath("/app");
}

export async function revokeSessionAction(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (isReadOnlyAccount(viewer.user)) redirect("/app");

  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string" || !sessionId) return;

  const target = await prisma.session.findFirst({
    where: { id: sessionId, userId: viewer.user.id, revokedAt: null },
    select: { id: true },
  });

  if (!target) return;

  await prisma.session.update({
    where: { id: target.id },
    data: { revokedAt: new Date() },
    select: { id: true },
  });

  if (target.id === viewer.sessionId) {
    await destroyCurrentSession();
    redirect("/login?signed-out=1");
  }

  revalidatePath("/app");
}
