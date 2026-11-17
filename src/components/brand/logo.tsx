import { cn } from "@/lib/utils";

/**
 * Typographic mark: an ink block with a serif V, followed by the wordmark.
 * Deliberately flat — no gradients, glows or rounded app-icon shapes.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-[2px] bg-foreground font-serif text-[1.15rem] leading-none text-background"
      >
        V
      </span>
      {showWordmark ? (
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-serif text-[1.125rem] leading-none tracking-tight">Vortex</span>
          <span className="font-sans text-[0.8125rem] leading-none text-muted-foreground">
            Metrics
          </span>
        </span>
      ) : null}
    </span>
  );
}
