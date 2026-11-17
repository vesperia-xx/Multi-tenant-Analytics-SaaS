import {
  ArrowRight,
  BarChart3,
  Check,
  Database,
  FileDown,
  Gauge,
  GitBranch,
  History,
  Layers,
  Lock,
  Monitor,
  Server,
  ShieldCheck,
} from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: ShieldCheck,
    title: "Tenant isolation by construction",
    description:
      "Every query is scoped by the organization resolved from a verified membership. The client never chooses the tenant.",
    tag: "Multi-tenancy",
  },
  {
    icon: Layers,
    title: "Roles that map to real permissions",
    description:
      "Owner, Admin, Manager and Viewer share one permission matrix enforced on the server and reflected in the UI.",
    tag: "RBAC",
  },
  {
    icon: BarChart3,
    title: "Metrics aggregated in PostgreSQL",
    description:
      "Revenue, orders, customers, AOV, conversion and growth come from SQL over real rows — not from mocks or client-side math.",
    tag: "Analytics",
  },
  {
    icon: FileDown,
    title: "Reports built to leave the app",
    description:
      "Filtered sales reports as streaming CSV and vector PDF, with the same definitions the dashboard uses.",
    tag: "Exports",
  },
  {
    icon: History,
    title: "Every important change is auditable",
    description:
      "Actor, action, resource, timestamp and a field-level before/after diff. Price changes read like a ledger.",
    tag: "Audit",
  },
  {
    icon: Gauge,
    title: "Performance measured, not assumed",
    description:
      "Composite indexes, trigram search, keyset-friendly pagination and query plans documented against a seeded dataset.",
    tag: "Performance",
  },
] as const;

const securityLayers = [
  {
    icon: Lock,
    title: "Session guard",
    description:
      "Opaque, hashed session tokens in PostgreSQL. Revocable, expiring and never trusted from the client alone.",
  },
  {
    icon: ShieldCheck,
    title: "Membership + RBAC",
    description:
      "The organization comes from a verified membership row; permissions are checked again on every mutation.",
  },
  {
    icon: Layers,
    title: "Scoped repositories",
    description:
      "Data access functions require an organizationId. Cross-tenant lookups return 404, never another tenant's row.",
  },
  {
    icon: Database,
    title: "Row-Level Security",
    description:
      "PostgreSQL policies with FORCE RLS. If a query forgets the tenant context, it fails closed and returns nothing.",
  },
] as const;

const architecture = [
  {
    icon: Monitor,
    title: "UI",
    description: "React Server Components + client islands. No business rules in components.",
  },
  {
    icon: Server,
    title: "API",
    description: "Server Actions for writes, Route Handlers for reads and exports.",
  },
  {
    icon: ShieldCheck,
    title: "Authorization",
    description: "Zod validation, membership lookup, permission matrix, rate limits.",
  },
  {
    icon: Layers,
    title: "Data access",
    description: "Repositories take orgId first. Analytics uses parameterized SQL.",
  },
  {
    icon: Database,
    title: "PostgreSQL",
    description: "Tenant indexes, pg_trgm search, transactions and RLS policies.",
  },
] as const;

const stack = [
  {
    title: "Application",
    items: ["Next.js 16", "React 19", "TypeScript strict", "Tailwind CSS 4"],
  },
  {
    title: "Data",
    items: ["PostgreSQL 16", "Prisma 7", "pg_trgm", "Row-Level Security"],
  },
  {
    title: "Product",
    items: ["TanStack Query", "TanStack Table", "Recharts", "Zod"],
  },
  {
    title: "Delivery",
    items: ["Vercel + Neon", "Docker Compose", "GitHub Actions", "Vitest"],
  },
] as const;

const reportRows = [
  { label: "Net revenue", value: "$128,430.00" },
  { label: "Paid orders", value: "1,842" },
  { label: "Unique customers", value: "326" },
  { label: "Top product", value: "Aurora Desk Lamp" },
];

const auditRows = [
  {
    actor: "Ricardo M.",
    action: "Changed product price",
    resource: "Aurora Desk Lamp",
    before: "$49.00",
    after: "$59.00",
    time: "2 minutes ago",
  },
  {
    actor: "Sara K.",
    action: "Invited member",
    resource: "manager@acme.test",
    before: "—",
    after: "Manager",
    time: "1 hour ago",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-radial-fade absolute inset-0 opacity-80" />
            <div className="bg-grid mask-fade-b absolute inset-0 opacity-40" />
          </div>

          <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-16 sm:px-8 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="mx-auto border-border/80 bg-background/60">
                <span className="size-1.5 rounded-full bg-success" />
                Multi-tenant analytics, built for strict isolation
              </Badge>

              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Analytics that never{" "}
                <span className="text-gradient">cross the tenant boundary.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Vortex Metrics gives every organization its own workspace, its own data and its
                own permissions. Real PostgreSQL metrics, role-based access, exports and an audit
                trail — without a single shared query.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#platform"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-[0.9375rem] font-medium text-primary-foreground shadow-sm shadow-primary/25 transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  Explore the platform
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="#security"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-6 text-[0.9375rem] font-medium transition-colors hover:bg-accent sm:w-auto"
                >
                  See how isolation works
                </a>
              </div>

              <p className="mt-5 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground">
                Next.js 16 · PostgreSQL 16 · Prisma 7 · Vercel-ready
              </p>
            </div>

            <DashboardPreview />
          </div>

          <div className="border-t border-border/60">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row sm:px-8">
              <p className="text-xs text-muted-foreground">
                One codebase, two seeded tenants, zero shared records.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[0.6875rem] text-muted-foreground/80">
                <span>Next.js</span>
                <span>PostgreSQL</span>
                <span>Prisma</span>
                <span>TanStack Query</span>
                <span>Recharts</span>
                <span>Zod</span>
              </div>
            </div>
          </div>
        </section>

        {/* Product features */}
        <section id="product" className="border-b border-border/60 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-primary">
                The product
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                A dashboard is easy. A tenant-safe platform is not.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                The interesting part is everything behind the charts: how a request becomes a
                scoped query, who is allowed to change what, and how the system proves it later.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden bg-card/60 transition-colors hover:border-primary/35 hover:bg-card/80"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                  />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                        <feature.icon className="size-5" />
                      </span>
                      <span className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-muted-foreground">
                        {feature.tag}
                      </span>
                    </div>
                    <CardTitle className="mt-4 text-[0.9375rem]">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Platform detail */}
        <section id="platform" className="border-b border-border/60 py-20 sm:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-primary">
                Inside the product
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Answers your finance team can audit.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                The dashboard, the analytics page and every export share the same metric
                definitions. When revenue moves, you can explain exactly why.
              </p>

              <ul className="mt-8 flex flex-col gap-4">
                {[
                  "Date ranges, product and category filters — with automatic period comparison.",
                  "Top products, category share, customer growth and conversion from real traffic.",
                  "Server-side search, sorting and pagination on orders, customers and products.",
                  "Exports that reuse the same SQL, so CSV and PDF never disagree with the chart.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4">
              <Card className="shadow-glow bg-card/80">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Sales report</CardTitle>
                    <Badge variant="success" className="text-[0.5625rem]">
                      Ready
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Acme Inc · May 1 – May 31, 2026
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <dl className="divide-y divide-border/70 rounded-lg border border-border/70 bg-background/40">
                    {reportRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-4 px-3 py-2.5"
                      >
                        <dt className="text-xs text-muted-foreground">{row.label}</dt>
                        <dd className="truncate font-mono text-xs font-medium">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background/60 px-3 text-xs font-medium">
                      <FileDown className="size-3.5 text-primary" /> Export CSV
                    </span>
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background/60 px-3 text-xs font-medium">
                      <FileDown className="size-3.5 text-primary" /> Export PDF
                    </span>
                    <span className="ml-auto inline-flex h-8 items-center rounded-md bg-primary/10 px-3 text-[0.6875rem] font-medium text-primary">
                      1,842 rows
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Audit log</CardTitle>
                    <span className="font-mono text-[0.5625rem] uppercase tracking-wider text-muted-foreground">
                      Immutable
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="flex flex-col gap-3">
                    {auditRows.map((row) => (
                      <li
                        key={`${row.actor}-${row.resource}`}
                        className="rounded-lg border border-border/70 bg-background/40 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-xs font-medium">{row.action}</p>
                          <span className="shrink-0 text-[0.5625rem] text-muted-foreground">
                            {row.time}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
                          {row.actor} · {row.resource}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 font-mono text-[0.625rem]">
                          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive line-through">
                            {row.before}
                          </span>
                          <ArrowRight className="size-2.5 text-muted-foreground" />
                          <span className="rounded bg-success/10 px-1.5 py-0.5 text-success">
                            {row.after}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="relative overflow-hidden border-b border-border/60 py-20 sm:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 -z-10 size-[32rem] rounded-full bg-primary/8 blur-3xl"
          />
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-primary">
                Security model
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Isolation is enforced, not assumed.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Multi-tenancy fails when one query forgets a <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8125rem]">WHERE</code>{" "}
                clause. Vortex uses independent layers so a single mistake does not become a data
                breach.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {securityLayers.map((layer) => (
                  <div
                    key={layer.title}
                    className="rounded-xl border border-border/70 bg-card/50 p-4"
                  >
                    <layer.icon className="size-5 text-primary" />
                    <h3 className="mt-3 text-sm font-semibold">{layer.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {layer.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden bg-[#0b0910] text-zinc-300 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="ml-2 font-mono text-[0.625rem] text-zinc-500">
                  tenant-guard.ts + rls.sql
                </span>
              </div>
              <div className="space-y-6 p-5 font-mono text-[0.6875rem] leading-relaxed sm:text-xs">
                <div>
                  <p className="mb-3 flex items-center gap-2 text-[0.5625rem] uppercase tracking-[0.16em] text-zinc-500">
                    <ShieldCheck className="size-3 text-violet-400" /> Application guard
                  </p>
                  <pre className="overflow-x-auto">
                    <code>
                      <span className="text-fuchsia-400">const</span>{" "}
                      <span className="text-zinc-200">ctx</span> ={" "}
                      <span className="text-fuchsia-400">await</span>{" "}
                      <span className="text-sky-400">requirePermission</span>
                      <span className="text-zinc-400">(</span>
                      <span className="text-emerald-300">orgSlug</span>
                      <span className="text-zinc-400">,</span>{" "}
                      <span className="text-amber-300">&quot;analytics:read&quot;</span>
                      <span className="text-zinc-400">);</span>
                      {"\n\n"}
                      <span className="text-zinc-500">
                        {"// orgId comes from the verified membership,"}
                      </span>
                      {"\n"}
                      <span className="text-zinc-500">{"// never from the request body."}</span>
                      {"\n"}
                      <span className="text-fuchsia-400">const</span>{" "}
                      <span className="text-zinc-200">revenue</span> ={" "}
                      <span className="text-fuchsia-400">await</span>{" "}
                      <span className="text-sky-400">analytics</span>
                      <span className="text-zinc-400">.</span>
                      <span className="text-sky-400">revenue</span>
                      <span className="text-zinc-400">(</span>
                      <span className="text-zinc-200">ctx.org.id</span>
                      <span className="text-zinc-400">,</span>{" "}
                      <span className="text-zinc-200">range</span>
                      <span className="text-zinc-400">);</span>
                    </code>
                  </pre>
                </div>

                <div className="h-px bg-white/10" />

                <div>
                  <p className="mb-3 flex items-center gap-2 text-[0.5625rem] uppercase tracking-[0.16em] text-zinc-500">
                    <Database className="size-3 text-violet-400" /> PostgreSQL RLS
                  </p>
                  <pre className="overflow-x-auto">
                    <code>
                      <span className="text-fuchsia-400">ALTER TABLE</span>{" "}
                      <span className="text-zinc-200">orders</span>{" "}
                      <span className="text-fuchsia-400">ENABLE ROW LEVEL SECURITY</span>
                      <span className="text-zinc-400">;</span>
                      {"\n"}
                      <span className="text-fuchsia-400">ALTER TABLE</span>{" "}
                      <span className="text-zinc-200">orders</span>{" "}
                      <span className="text-fuchsia-400">FORCE ROW LEVEL SECURITY</span>
                      <span className="text-zinc-400">;</span>
                      {"\n\n"}
                      <span className="text-fuchsia-400">CREATE POLICY</span>{" "}
                      <span className="text-zinc-200">tenant_isolation</span>{" "}
                      <span className="text-fuchsia-400">ON</span>{" "}
                      <span className="text-zinc-200">orders</span>
                      {"\n"}
                      <span className="text-fuchsia-400">USING</span>
                      <span className="text-zinc-400"> (</span>
                      {"\n  "}
                      <span className="text-zinc-200">organization_id</span>{" "}
                      <span className="text-zinc-400">=</span>{" "}
                      <span className="text-sky-400">current_setting</span>
                      <span className="text-zinc-400">(</span>
                      <span className="text-amber-300">&apos;app.current_org_id&apos;</span>
                      <span className="text-zinc-400">)::</span>
                      <span className="text-sky-400">uuid</span>
                      {"\n"}
                      <span className="text-zinc-400">);</span>
                    </code>
                  </pre>
                </div>
              </div>
              <div className="border-t border-white/10 px-5 py-3 text-[0.625rem] text-zinc-500">
                Cross-tenant reads return 404 — not 403 — so the API never leaks that a record
                exists in another tenant.
              </div>
            </Card>
          </div>
        </section>

        {/* Architecture */}
        <section id="architecture" className="border-b border-border/60 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-primary">
                Architecture
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                A request has one path — and it is verified twice.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                UI, authorization, data access and SQL stay separable. The same sequence powers
                dashboards, tables and exports.
              </p>
            </div>

            <ol className="mt-12 grid gap-3 lg:grid-cols-5">
              {architecture.map((layer, index) => (
                <li key={layer.title} className="relative">
                  <div className="h-full rounded-xl border border-border/70 bg-card/50 p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <layer.icon className="size-4" />
                      </span>
                      <span className="font-mono text-[0.625rem] text-muted-foreground">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold">{layer.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {layer.description}
                    </p>
                  </div>
                  {index < architecture.length - 1 ? (
                    <ArrowRight className="absolute -right-3 top-1/2 hidden size-4 -translate-y-1/2 text-border lg:block" />
                  ) : null}
                </li>
              ))}
            </ol>

            <div className="mt-8 grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-5 sm:grid-cols-3">
              {[
                {
                  icon: GitBranch,
                  title: "URL-scoped tenant",
                  copy: "/app/[orgSlug] resolves to a verified membership on every request.",
                },
                {
                  icon: Lock,
                  title: "Server-owned context",
                  copy: "orgId and role come from the guard. The client cannot submit them.",
                },
                {
                  icon: Gauge,
                  title: "Measured performance",
                  copy: "Indexes and query plans are documented against a real seeded dataset.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <h3 className="text-xs font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stack */}
        <section id="stack" className="border-b border-border/60 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div className="max-w-xl">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-primary">
                  Stack
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Boring choices, deliberately.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Tools that make the isolation model easy to reason about, test and deploy.
                </p>
              </div>
              <Badge variant="outline" className="w-fit bg-background/60">
                <Check className="size-3 text-success" /> Deployable on Vercel
              </Badge>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stack.map((group) => (
                <Card key={group.title} className="bg-card/50 p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {group.title}
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-md border border-border/70 bg-background/50 px-2.5 py-1 font-mono text-[0.6875rem] text-muted-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Demo CTA */}
        <section id="demo" className="py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card/60 px-6 py-12 sm:px-12 sm:py-16">
              <div
                aria-hidden="true"
                className="bg-radial-fade pointer-events-none absolute inset-0 -z-10 opacity-60"
              />
              <div className="mx-auto max-w-2xl text-center">
                <Badge variant="outline" className="mx-auto bg-background/60">
                  <span className="size-1.5 rounded-full bg-warning" />
                  Milestone 1 · Foundation
                </Badge>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                  A demo you can audit, not just scroll.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  The live workspace is seeded with Acme Inc and Nordwind Studio: two tenants,
                  distinct data and a single account that belongs to both. Switch organizations,
                  then try to reach the other one.
                </p>

                <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                  {[
                    "Acme + Nordwind tenants",
                    "Owner / Admin / Manager / Viewer",
                    "CSV + PDF exports",
                    "Audit diffs",
                  ].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[0.6875rem] text-muted-foreground"
                    >
                      <Check className="size-3 text-success" />
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href="#security"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                  >
                    Read the security model
                    <ArrowRight className="size-4" />
                  </a>
                  <a
                    href="#architecture"
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-background/60 px-5 text-sm font-medium transition-colors hover:bg-accent sm:w-auto"
                  >
                    See the architecture
                  </a>
                </div>

                <p className="mt-5 text-xs text-muted-foreground">
                  Live demo and credentials ship with the authentication milestone.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
