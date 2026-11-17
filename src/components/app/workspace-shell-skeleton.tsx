export function WorkspaceShellSkeleton() {
  return (
    <div className="flex flex-1 flex-col" aria-hidden="true">
      <div className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="h-10 w-56 animate-pulse rounded-[3px] bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-[2px] bg-muted" />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 lg:py-10">
        <div className="flex flex-col gap-6">
          <div className="h-2 w-20 animate-pulse rounded-[1px] bg-muted" />
          <div className="h-7 w-40 animate-pulse rounded-[2px] bg-muted" />
          <div className="h-3 w-28 animate-pulse rounded-[1px] bg-muted/70" />
          <div className="mt-4 flex flex-col gap-3">
            {[0, 1].map((item) => (
              <div key={item} className="h-8 animate-pulse rounded-[1px] bg-muted/60" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="h-3 w-24 animate-pulse rounded-[1px] bg-muted" />
          <div className="h-12 w-2/3 animate-pulse rounded-[2px] bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded-[1px] bg-muted/70" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-[4px] border border-border bg-muted/40"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
