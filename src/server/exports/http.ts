import "server-only";

import { NextResponse } from "next/server";

import { can } from "@/lib/permissions";
import { recordAudit } from "@/server/auth/audit";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import { requestMetadata } from "@/server/auth/session";
import { getApiOrgContext, type OrgContext } from "@/server/org/context";

/** Exports are reads, but they are not free: cap them per user and workspace. */
const EXPORT_LIMIT = 20;
const EXPORT_WINDOW_SECONDS = 60 * 60;

export type ExportGuard =
  | { ok: true; context: OrgContext }
  | { ok: false; response: NextResponse };

export async function guardExport(orgSlug: string): Promise<ExportGuard> {
  const api = await getApiOrgContext(orgSlug);

  if (!api.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: api.reason === "unauthorized" ? "Sign in required." : "Not found." },
        { status: api.reason === "unauthorized" ? 401 : 404 },
      ),
    };
  }

  if (!can(api.context.membership.role, "export")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Your role cannot export." }, { status: 403 }),
    };
  }

  const limit = await consumeRateLimit(
    `org:export:${api.context.organization.id}:${api.context.viewer.user.id}`,
    EXPORT_LIMIT,
    EXPORT_WINDOW_SECONDS,
  );

  if (!limit.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Export limit reached. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      ),
    };
  }

  return { ok: true, context: api.context };
}

export function attachmentHeaders(filename: string, contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  };
}

export function exportFilename(resource: string, slug: string, extension: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `vortex-${resource}-${slug}-${day}.${extension}`;
}

export async function auditExport(
  context: OrgContext,
  entry: {
    format: "csv" | "pdf";
    resource: string;
    rows?: number;
    filters?: Record<string, unknown>;
  },
): Promise<void> {
  const { ip, userAgent } = await requestMetadata();

  await recordAudit({
    organizationId: context.organization.id,
    actorId: context.viewer.user.id,
    action: "report.exported",
    resourceType: "report",
    resourceId: null,
    after: entry,
    ip,
    userAgent,
  });
}

/** Drops undefined params so the audit entry stays small and readable. */
export function definedFilters(
  input: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
