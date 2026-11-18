import { NextResponse, type NextRequest } from "next/server";

import { listCustomers } from "@/server/customers/queries";
import { can } from "@/lib/permissions";
import { customersParamsSchema } from "@/lib/validation/table";
import { getApiOrgContext } from "@/server/org/context";

function toSearchParams(request: NextRequest): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    const existing = record[key];
    if (existing === undefined) {
      record[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      record[key] = [existing, value];
    }
  });
  return record;
}

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

  if (!can(api.context.membership.role, "data:read")) {
    return NextResponse.json({ error: "Your role cannot read customers." }, { status: 403 });
  }

  const parsed = customersParamsSchema.safeParse(toSearchParams(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const result = await listCustomers(api.context.organization.id, parsed.data);

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
