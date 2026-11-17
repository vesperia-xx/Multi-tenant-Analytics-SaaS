export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-hidden="true">
      <div className="flex flex-col gap-4">
        <div className="h-2 w-36 animate-pulse rounded-[1px] bg-muted" />
        <div className="h-12 w-2/3 animate-pulse rounded-[2px] bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-[1px] bg-muted/70" />
      </div>

      <div className="h-16 animate-pulse rounded-[2px] border border-border bg-muted/30" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div
            key={card}
            className="h-32 animate-pulse rounded-[4px] border border-border bg-muted/40"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-[4px] border border-border bg-muted/30 lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-[4px] border border-border bg-muted/30" />
      </div>
    </div>
  );
}
