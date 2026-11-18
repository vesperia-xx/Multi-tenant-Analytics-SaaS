import { NextResponse, type NextRequest } from "next/server";

import { isCronAuthorized } from "@/lib/cron";
import { serverEnv } from "@/lib/env";
import { runHousekeeping } from "@/server/housekeeping";

/**
 * Vercel Cron target. It is intentionally tolerant of a missing secret at
 * build time (503 at request time) so preview deployments stay bootable.
 */
export async function GET(request: NextRequest) {
  const secret = serverEnv().CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Cron is not configured." }, { status: 503 });
  }

  if (!isCronAuthorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runHousekeeping();

  return NextResponse.json(
    { ok: true, ...result },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
