import "server-only";

import { prisma } from "@/server/db/client";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Fixed-window limiter backed by Postgres, so the limit is shared across every
 * serverless instance. Windows are aligned to the epoch, which makes the
 * "retry after" value exact instead of an estimate.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const counter = await prisma.rateLimitCounter.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  const resetAt = windowStart.getTime() + windowMs;

  return {
    allowed: counter.count <= limit,
    remaining: Math.max(0, limit - counter.count),
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
  };
}
