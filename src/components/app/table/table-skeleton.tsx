export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div className="flex flex-col gap-4">
        <div className="h-2 w-36 animate-pulse rounded-[1px] bg-muted" />
        <div className="h-12 w-2/3 animate-pulse rounded-[2px] bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-[1px] bg-muted/70" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="h-11 w-52 animate-pulse rounded-[3px] bg-muted" />
        <div className="h-11 w-36 animate-pulse rounded-[3px] bg-muted/60" />
        <div className="h-11 w-36 animate-pulse rounded-[3px] bg-muted/60" />
      </div>

      <div className="overflow-hidden border border-border">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-4 border-b border-border/60 bg-card p-4 last:border-b-0">
            <div className="h-4 w-20 animate-pulse rounded-[1px] bg-muted/70" />
            <div className="h-4 w-40 animate-pulse rounded-[1px] bg-muted/40" />
            <div className="ml-auto h-4 w-24 animate-pulse rounded-[1px] bg-muted/70" />
            <div className="h-4 w-16 animate-pulse rounded-[1px] bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
