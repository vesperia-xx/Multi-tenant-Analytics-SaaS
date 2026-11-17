import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-[3px] border border-input bg-card px-3 text-sm text-foreground transition-all duration-150 ease-in-out",
        "placeholder:text-muted-foreground/60",
        "hover:border-foreground/35 hover:shadow-sm",
        "focus:border-foreground focus:ring-2 focus:ring-primary/20 focus:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
