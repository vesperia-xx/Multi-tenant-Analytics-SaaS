import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/auth-constants";
import { prisma } from "@/server/db/client";

import { generateToken, hashToken } from "./tokens";

/** Touch `last_used_at` at most once an hour to avoid a write per request. */
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

export type Viewer = {
  sessionId: string;
  activeOrganizationId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    isDemo: boolean;
    createdAt: Date;
  };
};

export type RequestMetadata = {
  ip: string | null;
  userAgent: string | null;
};

function firstHeaderValue(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first ? first.slice(0, maxLength) : null;
}

export async function requestMetadata(): Promise<RequestMetadata> {
  const headerStore = await headers();

  return {
    ip:
      firstHeaderValue(headerStore.get("x-forwarded-for"), 45) ??
      firstHeaderValue(headerStore.get("x-real-ip"), 45),
    userAgent: firstHeaderValue(headerStore.get("user-agent"), 255),
  };
}

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    priority: "high" as const,
  };
}

/**
 * Reads the opaque session cookie, hashes it and loads the session row.
 *
 * Memoized per request with React's `cache`, so a page, its layout and any
 * server action in the same request share one query. Must run inside a
 * `<Suspense>` boundary: it reads request data.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      activeOrganizationId: true,
      expiresAt: true,
      revokedAt: true,
      lastUsedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isDemo: true,
          createdAt: true,
        },
      },
    },
  });

  const now = new Date();
  if (!session || session.revokedAt || session.expiresAt <= now) return null;

  if (now.getTime() - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: now },
      select: { id: true },
    });
  }

  return {
    sessionId: session.id,
    activeOrganizationId: session.activeOrganizationId,
    user: session.user,
  };
});

/**
 * Data Access Layer entry point for protected screens: either a viewer or a
 * redirect to the login screen that returns here afterwards.
 */
export async function requireViewer(nextPath = "/app"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return viewer;
}

export async function createSession(userId: string): Promise<void> {
  const { ip, userAgent } = await requestMetadata();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.$transaction([
    // Housekeeping: expired sessions of this user are useless and cheap to drop.
    prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } }),
    prisma.session.create({
      data: { userId, tokenHash: hashToken(token), expiresAt, ip, userAgent },
      select: { id: true },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Remembers the workspace a session last opened. Only a hint for `/app`
 * ("continue where you left off"): every request still re-resolves the
 * membership from the URL, so a stale or forged value grants nothing.
 */
export async function setActiveOrganization(
  sessionId: string,
  organizationId: string | null,
): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { activeOrganizationId: organizationId },
    select: { id: true },
  });
}

export async function revokeOtherSessions(userId: string, keepSessionId?: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(keepSessionId ? { id: { not: keepSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });

  return result.count;
}
