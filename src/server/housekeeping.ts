import "server-only";

import { prisma } from "@/server/db/client";

const DAY_MS = 86_400_000;

/**
 * Daily housekeeping for the non-tenant operational tables. The append-only
 * audit ledger is deliberately absent: its trigger rejects deletes even here.
 */
export async function runHousekeeping(now = new Date()) {
  const revokedCutoff = new Date(now.getTime() - 30 * DAY_MS);
  const counterCutoff = new Date(now.getTime() - 2 * DAY_MS);

  const [sessions, resets, counters, invitations] = await prisma.$transaction([
    prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: revokedCutoff } }],
      },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: revokedCutoff } }, { usedAt: { lt: revokedCutoff } }],
      },
    }),
    prisma.rateLimitCounter.deleteMany({
      where: { windowStart: { lt: counterCutoff } },
    }),
    prisma.invitation.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: revokedCutoff } }, { revokedAt: { lt: revokedCutoff } }],
      },
    }),
  ]);

  return {
    sessions: sessions.count,
    resetTokens: resets.count,
    rateLimits: counters.count,
    invitations: invitations.count,
  };
}
