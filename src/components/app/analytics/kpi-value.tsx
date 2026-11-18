"use client";

import { useEffect, useState } from "react";

import { formatCurrency, formatNumber } from "@/lib/format";

const DURATION_MS = 1100;

/** e^4t curve with a soft landing — feels like a ledger settling. */
function easeOutQuart(progress: number): number {
  return 1 - Math.pow(1 - progress, 4);
}

/**
 * Animates a KPI from zero to its SQL-aggregated value on mount. Only the
 * display value moves; the number itself never leaves the server.
 */
export function KpiValue({
  value,
  kind,
  currency,
}: {
  value: number;
  kind: "currency" | "number";
  currency?: string;
}) {
  const format = (n: number): string =>
    kind === "currency" ? formatCurrency(n, currency ?? "USD") : formatNumber(n);

  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const id = requestAnimationFrame(() => setDisplay(format(value)));
      return () => cancelAnimationFrame(id);
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      setDisplay(format(Math.round(value * easeOutQuart(progress))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- format is stable for a given kind/currency
  }, [value, kind, currency]);

  return <>{display}</>;
}
