import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { formatPercent } from "@/lib/format";

export function KpiCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta: number | null;
  hint: string;
}) {
  const direction = delta === null || Math.abs(delta) < 0.05 ? "flat" : delta > 0 ? "up" : "down";

  const badgeClass =
    direction === "up"
      ? "text-success"
      : direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="flex flex-col justify-between gap-4 border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>

      <p className="tnum font-serif text-[2.15rem] leading-none tracking-tight">{value}</p>

      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 font-mono text-[0.625rem] ${badgeClass}`}
          aria-label={
            delta === null
              ? "No previous baseline"
              : `${formatPercent(delta)} versus the previous period`
          }
        >
          {direction === "up" ? (
            <TrendingUp className="size-3" aria-hidden="true" />
          ) : direction === "down" ? (
            <TrendingDown className="size-3" aria-hidden="true" />
          ) : (
            <Minus className="size-3" aria-hidden="true" />
          )}
          {delta === null ? "No baseline" : formatPercent(delta)}
        </span>
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
          {hint}
        </span>
      </div>
    </div>
  );
}
