"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { createColumnHelper } from "@tanstack/react-table";
import { Download } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { DataTable } from "@/components/app/table/data-table";
import { FilterSelect, SearchBox } from "@/components/app/table/table-filters";
import { OrderStatusBadge } from "@/components/app/table/order-status-badge";
import { fetchTableData } from "@/lib/fetch-table";
import { tableFeaturesRoot } from "@/components/app/table/table-features";
import { multiValueParams } from "@/lib/multi-value-params";
import { formatCurrency } from "@/lib/format";
import { ORDER_STATUSES, ordersParamsSchema } from "@/lib/validation/table";
import type { OrderListRow } from "@/server/orders/queries";

const columnHelper = createColumnHelper<typeof tableFeaturesRoot, OrderListRow>();

const DEFAULT_DIRECTION = {
  placedAt: "desc",
  totalCents: "desc",
  number: "asc",
  customerName: "asc",
} as const;

export function OrdersView({
  slug,
  currency,
}: {
  slug: string;
  currency: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(
    () => ordersParamsSchema.parse(multiValueParams(searchParams)),
    [searchParams],
  );
  const queryString = searchParams.toString();

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["orders", slug, queryString],
    queryFn: () => fetchTableData<OrderListRow>(`/api/org/${slug}/orders?${queryString}`),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [parsed.page]);

  function apply(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleSort(id: string) {
    const sortId = id as keyof typeof DEFAULT_DIRECTION;

    if (parsed.sort === sortId) {
      apply({
        sort: sortId,
        direction: parsed.direction === "asc" ? "desc" : "asc",
        page: undefined,
      });
      return;
    }

    apply({ sort: sortId, direction: DEFAULT_DIRECTION[sortId], page: undefined });
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("number", {
        header: "Order",
        id: "number",
        cell: (info) => (
          <Link
            href={`/app/${slug}/orders/${info.row.original.id}`}
            className="font-mono text-[0.75rem] text-primary transition-colors hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("placedAt", {
        header: "Placed",
        id: "placedAt",
        meta: { align: "right" },
        cell: (info) => (
          <span className="tnum whitespace-nowrap text-muted-foreground">
            {format(new Date(info.getValue()), "d MMM yyyy, HH:mm")}
          </span>
        ),
      }),
      columnHelper.accessor("customerName", {
        header: "Customer",
        id: "customerName",
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium">{info.getValue()}</p>
            <p className="truncate font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-muted-foreground">
              {info.row.original.customerEmail}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        id: "status",
        cell: (info) => <OrderStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("totalCents", {
        header: "Total",
        id: "totalCents",
        meta: { align: "right" },
        cell: (info) => (
          <span className="tnum font-mono text-[0.75rem]">{formatCurrency(info.getValue(), currency)}</span>
        ),
      }),
    ],
    [slug, currency],
  );

  const hasActiveFilters =
    parsed.q || parsed.status || parsed.from || parsed.to || parsed.sort !== "placedAt" || parsed.direction !== "desc";

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-8">
      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Workspace / Orders
        </p>
        <h1 className="mt-4 font-serif text-[2.4rem] leading-[1.03] tracking-tight sm:text-[3rem]">
          Every order, one ledger line.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Search by order number or customer, filter by status and date, sort any column, and
          page through the real thing.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBox
          className="max-w-xs"
          initialValue={parsed.q ?? ""}
          placeholder="Order number or customer…"
          onSearch={(value) => apply({ q: value || undefined, page: undefined })}
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Status"
            value={parsed.status ?? ""}
            onChange={(value) => apply({ status: value, page: undefined })}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </FilterSelect>

          <label className="flex items-center gap-2">
            <span className="sr-only">Placed from</span>
            <input
              type="date"
              value={parsed.from ?? ""}
              max={parsed.to}
              onChange={(event) => apply({ from: event.target.value || undefined, page: undefined })}
              aria-label="Placed from"
              className="h-11 rounded-[3px] border border-input bg-card px-3 font-mono text-[0.625rem] text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
            />
          </label>
          <span className="font-mono text-xs text-muted-foreground">–</span>
          <label className="flex items-center gap-2">
            <span className="sr-only">Placed to</span>
            <input
              type="date"
              value={parsed.to ?? ""}
              onChange={(event) => apply({ to: event.target.value || undefined, page: undefined })}
              aria-label="Placed to"
              className="h-11 rounded-[3px] border border-input bg-card px-3 font-mono text-[0.625rem] text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
            />
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() =>
                router.replace(pathname, { scroll: false })
              }
              className="h-11 rounded-[3px] border border-foreground/25 px-3 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground/55 hover:bg-accent"
            >
              Clear
            </button>
          ) : null}

          <a
            href={`/api/org/${slug}/exports/orders${queryString ? `?${queryString}` : ""}`}
            className="inline-flex h-11 items-center gap-2 rounded-[3px] border border-foreground/25 px-3 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground/55 hover:bg-accent"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export CSV
          </a>
        </div>
      </div>

      {isError ? (
        <div role="alert" className="border-l-2 border-destructive bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">Couldn&apos;t load orders.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-destructive underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <DataTable<OrderListRow>
          columns={columns}
          rows={data?.rows ?? []}
          total={data?.total ?? 0}
          isFetching={isFetching}
          sortId={parsed.sort}
          sortDesc={parsed.direction === "desc"}
          page={parsed.page}
          pageSize={parsed.pageSize}
          onSort={handleSort}
          onPageChange={(page) => apply({ page: page === 1 ? undefined : String(page) })}
          onPageSizeChange={(pageSize) => apply({ pageSize: String(pageSize), page: undefined })}
          emptyTitle={hasActiveFilters ? "No orders match those filters" : "No orders yet"}
          emptyHint={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={() => router.replace(pathname, { scroll: false })}
                className="link-underline text-primary"
              >
                Clear the filters and start over
              </button>
            ) : (
              "When orders start arriving they will show up here — storefront integration arrives in a later phase."
            )
          }
          rowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
