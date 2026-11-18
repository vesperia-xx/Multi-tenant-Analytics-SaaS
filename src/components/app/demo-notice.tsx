import { LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One strip for every read-only demo surface. It explains the constraint before
 * the visitor discovers it by looking for a disabled button.
 */
export function DemoNotice({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      className={cn(
        "border-l-2 border-primary bg-primary/5 px-4 py-3",
        compact && "py-2.5",
        className,
      )}
    >
      <p className="flex items-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-primary">
        <LockKeyhole className="size-3" aria-hidden="true" />
        Read-only demo
      </p>
      <p
        className={cn(
          "mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground",
          compact && "text-xs",
        )}
      >
        Seeded data, shared across visitors. Dashboards, tables, audit entries and exports stay
        live; settings, invitations and member changes are disabled.
      </p>
    </div>
  );
}
