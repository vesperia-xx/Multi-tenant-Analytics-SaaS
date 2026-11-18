import { NextResponse, type NextRequest } from "next/server";

import { toCsv } from "@/lib/csv";
import { formatAmount } from "@/lib/format";
import { searchParamsRecord } from "@/lib/request-params";
import { customersParamsSchema } from "@/lib/validation/table";
import {
  attachmentHeaders,
  auditExport,
  definedFilters,
  exportFilename,
  guardExport,
} from "@/server/exports/http";
import { exportCustomers } from "@/server/customers/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const guard = await guardExport(orgSlug);
  if (!guard.ok) return guard.response;

  const { context } = guard;
  const parsed = customersParamsSchema.safeParse(searchParamsRecord(request));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const rows = await exportCustomers(context.organization.id, parsed.data);

  const csv = toCsv(
    ["Customer", "Email", "Country", "Orders", "Total spent", "Customer since"],
    rows.map((row) => [
      row.name,
      row.email,
      row.country ?? "",
      row.ordersCount,
      formatAmount(row.totalSpentCents),
      row.createdAt,
    ]),
  );

  await auditExport(context, {
    format: "csv",
    resource: "customers",
    rows: rows.length,
    filters: definedFilters(parsed.data),
  });

  return new NextResponse(csv, {
    headers: attachmentHeaders(
      exportFilename("customers", context.organization.slug, "csv"),
      "text/csv; charset=utf-8",
    ),
  });
}
