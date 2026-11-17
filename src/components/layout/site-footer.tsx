import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "#product" },
      { label: "Dashboard preview", href: "#platform" },
      { label: "Reports & exports", href: "#product" },
      { label: "Audit trail", href: "#product" },
    ],
  },
  {
    title: "Engineering",
    links: [
      { label: "Security model", href: "#security" },
      { label: "Architecture", href: "#architecture" },
      { label: "Stack", href: "#stack" },
      { label: "Roadmap", href: "#demo" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Multi-tenant analytics with isolation enforced at the application layer and in
              PostgreSQL itself.
            </p>
            <Badge variant="outline" className="font-mono text-[0.625rem] uppercase">
              Phase 1 · Foundation
            </Badge>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Built with
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Next.js 16 · React 19 · PostgreSQL 16 · Prisma 7 · Tailwind CSS 4
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              TypeScript strict · Zod · TanStack Query · Recharts
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 Vortex Metrics. A full-stack portfolio project.</p>
          <p className="font-mono">Built for tenant isolation, measured on real queries.</p>
        </div>
      </div>
    </footer>
  );
}
