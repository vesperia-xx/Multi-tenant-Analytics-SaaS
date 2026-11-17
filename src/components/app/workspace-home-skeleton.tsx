export function WorkspaceHomeSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-hidden="true">
      <div className="flex flex-col gap-4">
        <div className="h-2 w-36 animate-pulse rounded-[1px] bg-muted" />
        <div className="h-12 w-2/3 animate-pulse rounded-[2px] bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-[1px] bg-muted/70" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="h-2 w-48 animate-pulse rounded-[1px] bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-[4px] border border-border bg-muted/40"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="h-2 w-40 animate-pulse rounded-[1px] bg-muted" />
        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-6 animate-pulse rounded-[1px] bg-muted/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSettingsSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-hidden="true">
      <div className="flex flex-col gap-4">
        <div className="h-2 w-44 animate-pulse rounded-[1px] bg-muted" />
        <div className="h-10 w-3/4 animate-pulse rounded-[2px] bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-[1px] bg-muted/70" />
      </div>

      {[0, 1, 2].map((section) => (
        <div key={section} className="flex flex-col gap-4">
          <div className="h-2 w-32 animate-pulse rounded-[1px] bg-muted" />
          <div className="h-32 animate-pulse rounded-[4px] border border-border bg-muted/40" />
        </div>
      ))}
    </div>
  );
}
