"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function WorkspaceNav({
  slug,
  items,
}: {
  slug: string;
  items: Array<{ label: string; href: string; index: string }>;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace sections" className="flex flex-col">
      {items.map((item) => {
        const isActive =
          item.href === `/app/${slug}`
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-baseline gap-3 border-b border-border/70 py-2.5 text-[0.8125rem] transition-colors first:border-t",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="font-mono text-[0.5rem] tracking-[0.12em] text-muted-foreground/70">
              {item.index}
            </span>
            <span className="flex-1">{item.label}</span>
            <span
              aria-hidden="true"
              className={cn(
                "h-px w-4 translate-y-[-2px] transition-all",
                isActive ? "bg-primary" : "bg-transparent group-hover:bg-border",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
