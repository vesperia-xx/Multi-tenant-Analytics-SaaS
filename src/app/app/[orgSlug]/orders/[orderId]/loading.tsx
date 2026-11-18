export default function OrderDetailLoading() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div className="h-3 w-24 animate-pulse rounded-[1px] bg-muted" />
      <div className="flex flex-col gap-4">
        <div className="h-2 w-28 animate-pulse rounded-[1px] bg-muted" />
        <div className="h-10 w-64 animate-pulse rounded-[2px] bg-muted" />
        <div className="h-3 w-48 animate-pulse rounded-[1px] bg-muted/70" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="h-64 animate-pulse rounded-[4px] border border-border bg-muted/40" />
        <div className="flex flex-col gap-6">
          <div className="h-48 animate-pulse rounded-[4px] border border-border bg-muted/40" />
          <div className="h-36 animate-pulse rounded-[4px] border border-border bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
