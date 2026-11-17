import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Editorial tag: square corners, hairline border, monospace label.
 * Reads like a classification stamp rather than a modern pill.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-[2px] border px-2 py-1 font-mono text-[0.625rem] font-medium uppercase leading-none tracking-[0.12em] transition-all duration-150 ease-in-out [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:-translate-y-0.5",
        secondary: "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
        success: "border-success/30 bg-success/10 text-success hover:bg-success/20 hover:-translate-y-0.5",
        warning: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 hover:-translate-y-0.5",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:-translate-y-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
