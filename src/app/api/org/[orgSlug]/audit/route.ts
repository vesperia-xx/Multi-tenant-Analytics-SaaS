import { NextResponse, type NextRequest } from "next/server";

import { can } from "@/lib/permissions";
import { searchParamsRecord } from "@/lib/request-params";
import { auditParamsSchema } from "@/lib/validation/audit";
import { listAuditLogs } from "@/server/audit/queries";
import { getApiOrgContext } from "@/server/org/context";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const api = await getApiOrgContext(orgSlug);

  if (!api.ok) {
    return NextResponse.json(
      { error: api.reason === "unauthorized" ? "Sign in required." : "Not found." },
      { status: api.reason === "unauthorized" ? 401 : 404 },
    );
  }

  if (!can(api.context.membership.role, "audit:read")) {
    return NextResponse.json(
      { error: "Your role cannot read the audit ledger." },
      { status: 403 },
    );
  }

  const parsed = auditParamsSchema.safeParse(searchParamsRecord(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const result = await listAuditLogs(
    api.context.organization.id,
    api.context.organization.timezone,
    parsed.data,
  );

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
