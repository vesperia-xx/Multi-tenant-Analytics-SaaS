import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Inline feedback block shared by every auth form. */
function AuthMessage({
  tone,
  children,
  className,
}: {
  tone: "error" | "notice";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border-l-2 px-3 py-2.5 text-sm leading-relaxed",
        tone === "error"
          ? "border-destructive bg-destructive/5 text-destructive"
          : "border-primary bg-primary/5 text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { AuthMessage };
