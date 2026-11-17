export function AccountSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-hidden="true">
      <div className="flex flex-col gap-4">
        <div className="h-2 w-32 animate-pulse rounded-[1px] bg-muted" />
        <div className="h-10 w-2/3 animate-pulse rounded-[2px] bg-muted" />
        <div className="h-3 w-56 animate-pulse rounded-[1px] bg-muted/70" />
      </div>

      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-4">
          <div className="h-2 w-24 animate-pulse rounded-[1px] bg-muted" />
          <div className="h-24 animate-pulse rounded-[4px] border border-border bg-muted/40" />
        </div>
      ))}
    </div>
  );
}
