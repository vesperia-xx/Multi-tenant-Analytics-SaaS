"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { createColumnHelper } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/app/table/data-table";
import { FilterSelect, SearchBox } from "@/components/app/table/table-filters";
import { fetchTableData } from "@/lib/fetch-table";
import { tableFeaturesRoot } from "@/components/app/table/table-features";
import { multiValueParams } from "@/lib/multi-value-params";
import { formatCurrency } from "@/lib/format";
import { PRODUCT_STATUSES, productsParamsSchema } from "@/lib/validation/table";
import type { ProductListRow } from "@/server/products/queries";

const columnHelper = createColumnHelper<typeof tableFeaturesRoot, ProductListRow>();

const DEFAULT_DIRECTION = {
  createdAt: "desc",
  name: "asc",
  sku: "asc",
  priceCents: "desc",
} as const;

export function ProductsView({
  slug,
  currency,
  categories,
}: {
  slug: string;
  currency: string;
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(
    () => productsParamsSchema.parse(multiValueParams(searchParams)),
    [searchParams],
  );
  const queryString = searchParams.toString();

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["products", slug, queryString],
    queryFn: () => fetchTableData<ProductListRow>(`/api/org/${slug}/products?${queryString}`),
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
      columnHelper.accessor("sku", {
        header: "SKU",
        id: "sku",
        cell: (info) => (
          <span className="font-mono text-[0.75rem] text-primary">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("name", {
        header: "Product",
        id: "name",
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium">{info.getValue()}</p>
            <p className="truncate font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-muted-foreground">
              {info.row.original.categoryName ?? "No category"}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("priceCents", {
        header: "Price",
        id: "priceCents",
        meta: { align: "right" },
        cell: (info) => (
          <span className="tnum font-mono text-[0.75rem]">{formatCurrency(info.getValue(), currency)}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        id: "status",
        meta: { sortable: false },
        cell: (info) => <Badge variant={info.getValue() === "ACTIVE" ? "success" : "outline"}>{info.getValue() === "ACTIVE" ? "Active" : "Archived"}</Badge>,
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        id: "createdAt",
        meta: { align: "right" },
        cell: (info) => (
          <span className="tnum text-muted-foreground">{format(new Date(info.getValue()), "d MMM yyyy")}</span>
        ),
      }),
    ],
    [currency],
  );

  const hasActiveFilters = parsed.q || parsed.status || parsed.categoryId;

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-8">
      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Workspace / Products
        </p>
        <h1 className="mt-4 font-serif text-[2.4rem] leading-[1.03] tracking-tight sm:text-[3rem]">
          The catalogue, kept tidy.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Search by name or SKU, narrow by status and category, and page through the range.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBox
          className="max-w-xs"
          initialValue={parsed.q ?? ""}
          placeholder="Product name or SKU…"
          onSearch={(value) => apply({ q: value || undefined, page: undefined })}
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Status"
            value={parsed.status ?? ""}
            onChange={(value) => apply({ status: value, page: undefined })}
          >
            <option value="">All statuses</option>
            {PRODUCT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "ACTIVE" ? "Active" : "Archived"}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Category"
            value={parsed.categoryId ?? ""}
            onChange={(value) => apply({ categoryId: value, page: undefined })}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
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
          <p className="text-sm text-destructive">Couldn&apos;t load products.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-destructive underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <DataTable<ProductListRow>
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
          emptyTitle={hasActiveFilters ? "No products match those filters" : "No products yet"}
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
              "Your range will appear here once the catalogue exists. Seed it locally with npm run db:seed."
            )
          }
          rowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
