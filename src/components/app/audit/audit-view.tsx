"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { DataTable } from "@/components/app/table/data-table";
import { FilterSelect, SearchBox } from "@/components/app/table/table-filters";
import { tableFeaturesRoot } from "@/components/app/table/table-features";
import { Badge } from "@/components/ui/badge";
import { auditActionLabel, auditActionTone } from "@/lib/audit-actions";
import { fetchTableData } from "@/lib/fetch-table";
import { formatIp, formatTimestamp } from "@/lib/format";
import { multiValueParams } from "@/lib/multi-value-params";
import { auditParamsSchema } from "@/lib/validation/audit";
import type { AuditListRow } from "@/server/audit/queries";

const columnHelper = createColumnHelper<typeof tableFeaturesRoot, AuditListRow>();

export function AuditView({
  slug,
  timezone,
  actions,
}: {
  slug: string;
  timezone: string;
  actions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(
    () => auditParamsSchema.parse(multiValueParams(searchParams)),
    [searchParams],
  );
  const queryString = searchParams.toString();

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["audit", slug, queryString],
    queryFn: () => fetchTableData<AuditListRow>(`/api/org/${slug}/audit?${queryString}`),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
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

  const columns = useMemo(
    () => [
      columnHelper.accessor("createdAt", {
        header: "When",
        id: "createdAt",
        cell: (info) => (
          <span className="tnum whitespace-nowrap text-muted-foreground">
            {formatTimestamp(info.getValue(), timezone)}
          </span>
        ),
      }),
      columnHelper.accessor("action", {
        header: "Action",
        id: "action",
        meta: { sortable: false },
        cell: (info) => (
          <div className="min-w-0">
            <Badge variant={auditActionTone(info.getValue())}>{auditActionLabel(info.getValue())}</Badge>
            <p className="mt-1 font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-muted-foreground">
              {info.getValue()}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("actorName", {
        header: "Actor",
        id: "actor",
        meta: { sortable: false },
        cell: (info) => {
          const row = info.row.original;

          if (!row.actorName && !row.actorEmail) {
            return <span className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-muted-foreground">System</span>;
          }

          return (
            <div className="min-w-0">
              <p className="truncate text-[0.8125rem]">{row.actorName ?? "Member"}</p>
              <p className="truncate font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-muted-foreground">
                {row.actorEmail}
              </p>
            </div>
          );
        },
      }),
      columnHelper.accessor("resourceType", {
        header: "Resource",
        id: "resource",
        meta: { sortable: false },
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="min-w-0">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.1em]">{info.getValue()}</p>
              <p className="truncate font-mono text-[0.5rem] text-muted-foreground">
                {row.resourceId ? row.resourceId.slice(0, 10) : "—"}
              </p>
            </div>
          );
        },
      }),
      columnHelper.accessor("ip", {
        header: "Source",
        id: "ip",
        meta: { sortable: false },
        cell: (info) => (
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-muted-foreground">
            {formatIp(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "open",
        header: "",
        meta: { sortable: false, align: "right" },
        cell: (info) => (
          <Link
            href={`/app/${slug}/audit/${info.row.original.id}`}
            className="link-underline font-mono text-[0.5rem] uppercase tracking-[0.14em] text-primary"
          >
            Inspect
          </Link>
        ),
      }),
    ],
    [slug, timezone],
  );

  const hasActiveFilters = parsed.q || parsed.action || parsed.from || parsed.to;

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-8">
      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Workspace / Audit
        </p>
        <h1 className="mt-4 font-serif text-[2.4rem] leading-[1.03] tracking-tight sm:text-[3rem]">
          Everything that changed, with its receipt.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          An append-only ledger: actor, action, resource and a field-level before/after snapshot.
          Owners and Admins can read it; nobody can edit it.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBox
          className="max-w-xs"
          initialValue={parsed.q ?? ""}
          placeholder="Action, actor or resource…"
          onSearch={(value) => apply({ q: value || undefined, page: undefined })}
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Action"
            value={parsed.action ?? ""}
            onChange={(value) => apply({ action: value, page: undefined })}
          >
            <option value="">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {auditActionLabel(action)}
              </option>
            ))}
          </FilterSelect>

          <label className="flex items-center gap-2">
            <span className="sr-only">From date</span>
            <input
              type="date"
              value={parsed.from ?? ""}
              max={parsed.to}
              onChange={(event) => apply({ from: event.target.value || undefined, page: undefined })}
              aria-label="From date"
              className="h-11 rounded-[3px] border border-input bg-card px-3 font-mono text-[0.625rem] text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
            />
          </label>
          <span className="font-mono text-xs text-muted-foreground">–</span>
          <label className="flex items-center gap-2">
            <span className="sr-only">To date</span>
            <input
              type="date"
              value={parsed.to ?? ""}
              onChange={(event) => apply({ to: event.target.value || undefined, page: undefined })}
              aria-label="To date"
              className="h-11 rounded-[3px] border border-input bg-card px-3 font-mono text-[0.625rem] text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
            />
          </label>

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
          <p className="text-sm text-destructive">Couldn&apos;t load the audit ledger.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-destructive underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <DataTable<AuditListRow>
          columns={columns}
          rows={data?.rows ?? []}
          total={data?.total ?? 0}
          isFetching={isFetching}
          sortId="createdAt"
          sortDesc={parsed.direction === "desc"}
          page={parsed.page}
          pageSize={parsed.pageSize}
          onSort={() => apply({ direction: parsed.direction === "desc" ? "asc" : "desc", page: undefined })}
          onPageChange={(page) => apply({ page: page === 1 ? undefined : String(page) })}
          onPageSizeChange={(pageSize) => apply({ pageSize: String(pageSize), page: undefined })}
          emptyTitle={hasActiveFilters ? "No entries match those filters" : "No audit entries yet"}
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
              "Invitations, role changes, settings edits and exports will land here."
            )
          }
          rowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
