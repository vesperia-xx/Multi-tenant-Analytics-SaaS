"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { createColumnHelper } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { DataTable } from "@/components/app/table/data-table";
import { FilterSelect, SearchBox } from "@/components/app/table/table-filters";
import { fetchTableData } from "@/lib/fetch-table";
import { tableFeaturesRoot } from "@/components/app/table/table-features";
import { multiValueParams } from "@/lib/multi-value-params";
import { formatCurrency } from "@/lib/format";
import { customersParamsSchema } from "@/lib/validation/table";
import type { CustomerListRow } from "@/server/customers/queries";

const columnHelper = createColumnHelper<typeof tableFeaturesRoot, CustomerListRow>();

const DEFAULT_DIRECTION = {
  createdAt: "desc",
  name: "asc",
  ordersCount: "desc",
  totalSpent: "desc",
} as const;

export function CustomersView({
  slug,
  currency,
  countries,
}: {
  slug: string;
  currency: string;
  countries: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(
    () => customersParamsSchema.parse(multiValueParams(searchParams)),
    [searchParams],
  );
  const queryString = searchParams.toString();

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["customers", slug, queryString],
    queryFn: () => fetchTableData<CustomerListRow>(`/api/org/${slug}/customers?${queryString}`),
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
      columnHelper.accessor("name", {
        header: "Customer",
        id: "name",
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium">{info.getValue()}</p>
            <p className="truncate font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-muted-foreground">
              {info.row.original.email}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("country", {
        header: "Country",
        id: "country",
        meta: { sortable: false },
        cell: (info) => (
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
            {info.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("ordersCount", {
        header: "Orders",
        id: "ordersCount",
        meta: { align: "right" },
        cell: (info) => <span className="tnum">{info.getValue()}</span>,
      }),
      columnHelper.accessor("totalSpentCents", {
        header: "Spent",
        id: "totalSpent",
        meta: { align: "right" },
        cell: (info) => (
          <span className="tnum font-mono text-[0.75rem]">{formatCurrency(info.getValue(), currency)}</span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Since",
        id: "createdAt",
        meta: { align: "right" },
        cell: (info) => (
          <span className="tnum text-muted-foreground">{format(new Date(info.getValue()), "d MMM yyyy")}</span>
        ),
      }),
    ],
    [currency],
  );

  const hasActiveFilters = parsed.q || parsed.country;

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-8">
      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Workspace / Customers
        </p>
        <h1 className="mt-4 font-serif text-[2.4rem] leading-[1.03] tracking-tight sm:text-[3rem]">
          Who is actually buying.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Search by name or email, rank by volume or spend, and page through the book.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBox
          className="max-w-xs"
          initialValue={parsed.q ?? ""}
          placeholder="Customer name or email…"
          onSearch={(value) => apply({ q: value || undefined, page: undefined })}
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Country"
            value={parsed.country ?? ""}
            onChange={(value) => apply({ country: value, page: undefined })}
          >
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </FilterSelect>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => router.replace(pathname, { scroll: false })}
              className="h-11 rounded-[3px] border border-foreground/25 px-3 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground/55 hover:bg-accent"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {isError ? (
        <div role="alert" className="border-l-2 border-destructive bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">Couldn&apos;t load customers.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-destructive underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <DataTable<CustomerListRow>
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
          emptyTitle={hasActiveFilters ? "No customers match those filters" : "No customers yet"}
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
              "Customers appear here as orders flow in. Import them with the seed for local development."
            )
          }
          rowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
