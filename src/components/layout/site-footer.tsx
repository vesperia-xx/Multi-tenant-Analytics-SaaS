import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "#product" },
      { label: "Architecture", href: "#architecture" },
      { label: "Roles & audit", href: "#access" },
      { label: "Stack", href: "#stack" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create a workspace", href: "/register" },
      { label: "Security model", href: "#architecture" },
      { label: "Roles & audit", href: "#access" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Multi-tenant analytics with isolation enforced at the application layer and in
              PostgreSQL itself.
            </p>
            <Badge variant="outline">Phase 2 · Authentication</Badge>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h3 className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="link-underline text-sm text-foreground/80">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-border pt-5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 Vortex Metrics · Portfolio project</p>
          <p>Set in Instrument Serif &amp; Instrument Sans</p>
        </div>
      </div>
    </footer>
  );
}
