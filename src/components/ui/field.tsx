import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Form row with an editorial label: monospace, uppercase, small.
 * The error message is tied to the control through `id`, so forms only need to
 * set `aria-describedby` and `aria-invalid`.
 */
function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-foreground"
      >
        {label}
      </label>
      <div className="transition-transform duration-150 ease-in-out group-hover:scale-[1.01]">
        {children}
      </div>
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs leading-relaxed text-destructive transition-opacity duration-150">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs leading-relaxed text-muted-foreground transition-colors">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { Field };
