import type { StatusSlice } from "@/server/analytics/queries";

const config: Record<
  StatusSlice["status"],
  { label: string; bar: string; dot: string }
> = {
  PAID: { label: "Paid", bar: "bg-success", dot: "bg-success" },
  PENDING: { label: "Pending", bar: "bg-warning", dot: "bg-warning" },
  REFUNDED: { label: "Refunded", bar: "bg-chart-4", dot: "bg-chart-4" },
  CANCELLED: { label: "Cancelled", bar: "bg-muted-foreground/40", dot: "bg-muted-foreground/40" },
};

export function StatusBreakdown({ slices }: { slices: StatusSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);
  const max = Math.max(1, ...slices.map((slice) => slice.count));

  return (
    <ul className="flex flex-col gap-3.5">
      {slices.map((slice) => {
        const meta = config[slice.status];
        const percent = total === 0 ? 0 : (slice.count / total) * 100;

        return (
          <li key={slice.status}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2 text-[0.8125rem]">
                <span className={`size-1.5 ${meta.dot}`} aria-hidden="true" />
                {meta.label}
              </span>
              <span className="tnum font-mono text-[0.625rem] text-muted-foreground">
                {slice.count} · {percent.toFixed(0)}%
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full bg-muted">
              <div
                className={`h-full ${meta.bar}`}
                style={{ width: `${(slice.count / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
