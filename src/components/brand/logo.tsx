import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
  markClassName,
}: {
  className?: string;
  showWordmark?: boolean;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.65rem] bg-[conic-gradient(from_210deg_at_50%_50%,#8b5cf6,#4f46e5,#22d3ee,#8b5cf6)] shadow-[0_0_24px_-6px_rgba(139,92,246,0.85)] ring-1 ring-white/15",
          markClassName,
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-[1.15rem] text-white">
          <path
            d="M12 4.25c4.28 0 7.75 3.47 7.75 7.75S16.28 19.75 12 19.75 4.25 16.28 4.25 12"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M12 8.15A3.85 3.85 0 1 1 8.15 12c0-1.1.9-2 2-2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="text-[0.9375rem] font-semibold tracking-tight">
          Vortex<span className="text-muted-foreground"> Metrics</span>
        </span>
      ) : null}
    </span>
  );
}
