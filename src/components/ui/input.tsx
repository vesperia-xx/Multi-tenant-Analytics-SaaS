import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-[3px] border border-input bg-card px-3 text-sm text-foreground transition-colors",
        "placeholder:text-muted-foreground/60",
        "hover:border-foreground/35",
        "focus:border-foreground",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
