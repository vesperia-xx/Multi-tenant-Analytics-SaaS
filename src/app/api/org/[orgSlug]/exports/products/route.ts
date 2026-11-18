import { NextResponse, type NextRequest } from "next/server";

import { toCsv } from "@/lib/csv";
import { formatAmount } from "@/lib/format";
import { searchParamsRecord } from "@/lib/request-params";
import { productsParamsSchema } from "@/lib/validation/table";
import {
  attachmentHeaders,
  auditExport,
  definedFilters,
  exportFilename,
  guardExport,
} from "@/server/exports/http";
import { exportProducts } from "@/server/products/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const guard = await guardExport(orgSlug);
  if (!guard.ok) return guard.response;

  const { context } = guard;
  const parsed = productsParamsSchema.safeParse(searchParamsRecord(request));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const rows = await exportProducts(context.organization.id, parsed.data);

  const csv = toCsv(
    ["SKU", "Product", "Category", "Status", "Price", "Cost", "Created"],
    rows.map((row) => [
      row.sku,
      row.name,
      row.categoryName ?? "",
      row.status,
      formatAmount(row.priceCents),
      row.costCents === null ? "" : formatAmount(row.costCents),
      row.createdAt,
    ]),
  );

  await auditExport(context, {
    format: "csv",
    resource: "products",
    rows: rows.length,
    filters: definedFilters(parsed.data),
  });

  return new NextResponse(csv, {
    headers: attachmentHeaders(
      exportFilename("products", context.organization.slug, "csv"),
      "text/csv; charset=utf-8",
    ),
  });
}
