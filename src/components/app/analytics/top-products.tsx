import { formatCurrency, formatNumber } from "@/lib/format";
import type { TopProduct } from "@/server/analytics/queries";

export function TopProducts({
  products,
  currency,
}: {
  products: TopProduct[];
  currency: string;
}) {
  if (products.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        No product revenue in this period.
      </p>
    );
  }

  const max = Math.max(1, ...products.map((product) => product.revenueCents));

  return (
    <ol className="flex flex-col">
      {products.map((product, index) => (
        <li key={product.id} className="border-b border-border/70 py-3 first:border-t first:pt-0 last:border-b-0">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-2.5">
              <span className="font-mono text-[0.5rem] tracking-[0.1em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.8125rem] font-medium">{product.name}</p>
                <p className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-muted-foreground">
                  {product.sku}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="tnum font-mono text-[0.6875rem]">
                {formatCurrency(product.revenueCents, currency)}
              </p>
              <p className="tnum font-mono text-[0.5rem] uppercase tracking-[0.1em] text-muted-foreground">
                {formatNumber(product.units)} units
              </p>
            </div>
          </div>
          <div className="mt-2 h-px w-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${(product.revenueCents / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
