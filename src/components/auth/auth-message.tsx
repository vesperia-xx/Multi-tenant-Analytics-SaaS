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
        "border-l-2 px-3 py-2.5 text-sm leading-relaxed rounded-r-[2px] transition-all duration-150 ease-in-out",
        tone === "error"
          ? "border-destructive bg-destructive/5 text-destructive hover:bg-destructive/10"
          : "border-primary bg-primary/5 text-foreground hover:bg-primary/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { AuthMessage };
