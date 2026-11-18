"use client";

import {
  flexRender,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { tableFeaturesRoot as features, type VortexColumnMeta } from "./table-features";

export type TableProps<Row extends Record<string, unknown>> = {
  // TanStack's ColumnDef is invariant in TValue, and each column infers its own
  // value type from the accessor, so the column list is a heterogeneous union.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ReadonlyArray<ColumnDef<typeof features, Row, any>>;
  rows: Row[];
  total: number;
  isFetching: boolean;
  sortId: string;
  sortDesc: boolean;
  page: number;
  pageSize: number;
  onSort: (id: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  emptyTitle: string;
  emptyHint?: ReactNode;
  rowKey: (row: Row) => string;
};

function pageWindow(current: number, pageCount: number): number[] {
  const start = Math.max(1, Math.min(current - 2, pageCount - 4));
  const length = Math.min(5, pageCount);
  return Array.from({ length }, (_, index) => start + index);
}

/**
 * Server-side pagination and sorting; TanStack Table only models columns and
 * rows. Everything else is URL state, refetched by TanStack Query.
 */
export function DataTable<Row extends Record<string, unknown>>({
  columns,
  rows,
  total,
  isFetching,
  sortId,
  sortDesc,
  page,
  pageSize,
  onSort,
  onPageChange,
  onPageSizeChange,
  emptyTitle,
  emptyHint,
  rowKey,
}: TableProps<Row>) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  const table = useTable({ features, columns, data: rows });

  return (
    <div className="overflow-hidden border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {table.getFlatHeaders().map((header) => {
                const meta = header.column.columnDef.meta as VortexColumnMeta | undefined;
                const sortable = meta?.sortable !== false;
                const columnId = header.column.id;
                const isCurrentSort = columnId === sortId;
                const align = meta?.align ?? "left";

                return (
                  <th
                    key={header.id}
                    aria-sort={
                      sortable
                        ? isCurrentSort
                          ? sortDesc
                            ? "descending"
                            : "ascending"
                          : "none"
                        : undefined
                    }
                    className={cn(
                      "h-10 px-4 text-left font-mono text-[0.5rem] font-medium uppercase tracking-[0.16em] text-muted-foreground",
                      align === "right" && "text-right",
                      meta?.className,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(columnId)}
                        className={cn(
                          "group inline-flex items-center gap-1.5 uppercase transition-colors hover:text-foreground",
                          align === "right" && "flex-row-reverse",
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isCurrentSort ? (
                          sortDesc ? (
                            <ArrowDown className="size-3 text-primary" aria-hidden="true" />
                          ) : (
                            <ArrowUp className="size-3 text-primary" aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown
                            className="size-3 opacity-0 transition-opacity group-hover:opacity-60"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className={cn("transition-opacity", isFetching && "opacity-50")}>
            {rows.length === 0 ? (
              isFetching ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10">
                    <div className="flex flex-col gap-3">
                      {[0, 1, 2, 3, 4].map((row) => (
                        <div
                          key={row}
                          className="h-5 animate-pulse rounded-[2px] bg-muted"
                          style={{ width: `${88 - row * 12}%` }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {emptyTitle}
                    </p>
                    {emptyHint ? (
                      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {emptyHint}
                      </div>
                    ) : null}
                  </td>
                </tr>
              )
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={rowKey(row.original)}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-accent/40"
                >
                  {row.getAllCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as VortexColumnMeta | undefined;

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-4 py-3 align-middle text-[0.8125rem]",
                          meta?.align === "right" && "text-right",
                          meta?.className,
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className="tnum font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground"
        >
          {isFetching && total === 0 ? "Loading…" : total === 0 ? "0 rows" : `${start}–${end} of ${total}`}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="table-page-size">
            Rows per page
          </label>
          <select
            id="table-page-size"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-[3px] border border-input bg-card px-2 font-mono text-[0.625rem] text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className="inline-flex size-8 items-center justify-center rounded-[3px] border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            {pageWindow(safePage, pageCount).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                aria-current={pageNumber === safePage ? "page" : undefined}
                className={cn(
                  "tnum inline-flex h-8 min-w-8 items-center justify-center rounded-[3px] border px-2 font-mono text-[0.625rem] transition-colors",
                  pageNumber === safePage
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {pageNumber}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= pageCount}
            aria-label="Next page"
            className="inline-flex size-8 items-center justify-center rounded-[3px] border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
