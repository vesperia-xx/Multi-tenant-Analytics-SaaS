import { NextResponse, type NextRequest } from "next/server";

import { toCsv } from "@/lib/csv";
import { formatAmount } from "@/lib/format";
import { searchParamsRecord } from "@/lib/request-params";
import { ordersParamsSchema } from "@/lib/validation/table";
import {
  attachmentHeaders,
  auditExport,
  definedFilters,
  exportFilename,
  guardExport,
} from "@/server/exports/http";
import { exportOrders } from "@/server/orders/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const guard = await guardExport(orgSlug);
  if (!guard.ok) return guard.response;

  const { context } = guard;
  const parsed = ordersParamsSchema.safeParse(searchParamsRecord(request));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const rows = await exportOrders(
    context.organization.id,
    context.organization.timezone,
    parsed.data,
  );

  const csv = toCsv(
    ["Order", "Placed at", "Customer", "Email", "Status", "Subtotal", "Discount", "Tax", "Total"],
    rows.map((row) => [
      row.number,
      row.placedAt,
      row.customerName,
      row.customerEmail,
      row.status,
      formatAmount(row.subtotalCents),
      formatAmount(row.discountCents),
      formatAmount(row.taxCents),
      formatAmount(row.totalCents),
    ]),
  );

  await auditExport(context, {
    format: "csv",
    resource: "orders",
    rows: rows.length,
    filters: definedFilters(parsed.data),
  });

  return new NextResponse(csv, {
    headers: attachmentHeaders(
      exportFilename("orders", context.organization.slug, "csv"),
      "text/csv; charset=utf-8",
    ),
  });
}
