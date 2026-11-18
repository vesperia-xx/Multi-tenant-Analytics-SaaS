import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ReportSpecimen } from "@/components/marketing/report-specimen";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heroMeta = [
  { label: "Engine", value: "PostgreSQL 16" },
  { label: "Isolation", value: "RLS with FORCE" },
  { label: "Sessions", value: "Opaque, DB-backed" },
];

const indexFacts = [
  { value: "14", label: "tenant-aware tables" },
  { value: "4", label: "permission roles" },
  { value: "5", label: "trigram indexes" },
  { value: "1", label: "verified org context" },
];

const features = [
  {
    title: "Tenant isolation by construction",
    tag: "Multi-tenancy",
    description:
      "Every query is scoped by the organization resolved from a verified membership. The client never chooses the tenant, and a cross-tenant lookup returns 404.",
  },
  {
    title: "Roles that map to real permissions",
    tag: "RBAC",
    description:
      "Owner, Admin, Manager and Viewer share one permission matrix enforced on the server and reflected in the UI. An Admin can never modify the Owner.",
  },
  {
    title: "Metrics aggregated in PostgreSQL",
    tag: "Analytics",
    description:
      "Revenue, orders, customers, AOV, conversion and growth come from SQL over real rows — not from mocks or client-side arithmetic.",
  },
  {
    title: "Reports built to leave the app",
    tag: "Exports",
    description:
      "Filtered sales reports as streaming CSV and vector PDF, generated from the same SQL definitions the dashboard and charts use.",
  },
  {
    title: "Every important change is auditable",
    tag: "Audit",
    description:
      "Actor, action, resource, timestamp and a field-level before/after diff. Price changes read like a ledger, not a log line.",
  },
  {
    title: "Performance measured, not assumed",
    tag: "Performance",
    description:
      "Composite tenant indexes, trigram search, bounded pagination and query plans documented against a seeded dataset.",
  },
];

const steps = [
  {
    title: "Interface",
    description: "React Server Components, small client islands, no business rules in the browser.",
  },
  {
    title: "Edge",
    description: "Server Actions for writes, Route Handlers for reads, streaming exports.",
  },
  {
    title: "Authorization",
    description: "Zod validation, membership lookup, one permission matrix, rate limits.",
  },
  {
    title: "Data access",
    description: "Repositories take orgId first. Analytics uses parameterized SQL.",
  },
  {
    title: "PostgreSQL",
    description: "Composite tenant indexes, pg_trgm search, transactions and RLS with FORCE.",
  },
];

const permissions = [
  { label: "View dashboards and analytics", values: ["full", "full", "full", "full"] },
  { label: "Export CSV and PDF", values: ["full", "full", "full", "full"] },
  { label: "Manage orders and customers", values: ["full", "full", "full", "none"] },
  { label: "Create and edit products", values: ["full", "full", "read", "none"] },
  { label: "Manage members and invitations", values: ["full", "full", "none", "none"] },
  { label: "View the audit log", values: ["full", "full", "none", "none"] },
  { label: "Delete or transfer the organization", values: ["full", "none", "none", "none"] },
  { label: "Modify the Owner", values: ["none", "none", "none", "none"] },
] as const;

const auditRows = [
  {
    time: "14:32",
    action: "Changed product price",
    detail: "Ricardo M. · Aurora Desk Lamp",
    before: "$49.00",
    after: "$59.00",
  },
  {
    time: "13:07",
    action: "Invited member",
    detail: "Sara K. · manager@acme.test",
    before: "—",
    after: "Manager",
  },
  {
    time: "11:54",
    action: "Refunded order",
    detail: "Sara K. · #ORD-10428",
    before: "Paid",
    after: "Refunded",
  },
];

function SectionIntro({
  index,
  label,
  title,
  children,
}: {
  index: string;
  label: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="inline-block size-1.5 bg-primary" />
        {index} / {label}
      </p>
      <h2 className="mt-5 max-w-md font-serif text-[1.9rem] leading-[1.08] tracking-tight sm:text-[2.5rem]">
        {title}
      </h2>
      <div className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid items-start gap-12 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-20">
              <div>
                <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.22em] text-muted-foreground">
                  <span className="inline-block size-1.5 bg-primary" />
                  Multi-tenant analytics · SQL-native
                </p>

                <h1 className="mt-6 text-balance font-serif text-[2.9rem] leading-[1.01] tracking-[-0.015em] sm:text-[3.75rem] lg:text-[4.2rem]">
                  Analytics that never cross the{" "}
                  <em className="italic text-primary">tenant boundary.</em>
                </h1>

                <p className="mt-6 max-w-xl text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
                  Vortex Metrics gives every organization its own workspace, its own data and its
                  own permissions. Real PostgreSQL metrics, role-based access, exports and an audit
                  trail — without a single shared query.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/login" className={buttonVariants({ size: "lg" })}>
                    Open the live demo
                    <ArrowRight className="size-4" />
                  </Link>
                  <a
                    href="#architecture"
                    className={buttonVariants({ variant: "outline", size: "lg" })}
                  >
                    See how isolation works
                  </a>
                </div>

                <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-4">
                  {heroMeta.map((item) => (
                    <div key={item.label}>
                      <dt className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-[0.8125rem] font-medium">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <ReportSpecimen />
            </div>
          </div>
        </section>

        {/* Index strip */}
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 py-8 sm:grid-cols-4">
              {indexFacts.map((fact) => (
                <div key={fact.label} className="border-t border-foreground/20 pt-3">
                  <dd className="tnum font-serif text-[1.9rem] leading-none">{fact.value}</dd>
                  <dt className="mt-2 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
                    {fact.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 01 — Product */}
        <section id="product" className="border-b border-border py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:gap-16">
              <SectionIntro index="01" label="The product" title={<>A dashboard is easy. A tenant-safe platform is not.</>}>
                Everything behind the charts: how a request becomes a scoped query, who changes
                what, and how the system proves it later.
              </SectionIntro>

              <ol className="border-t border-border">
                {features.map((feature, index) => (
                  <li
                    key={feature.title}
                    className="grid grid-cols-[1.75rem_1fr] gap-3 border-b border-border py-6 sm:gap-6"
                  >
                    <span className="tnum pt-0.5 font-mono text-[0.625rem] tracking-[0.08em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="text-[0.9375rem] font-semibold tracking-tight">
                          {feature.title}
                        </h3>
                        <span className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
                          {feature.tag}
                        </span>
                      </div>
                      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 02 — Architecture */}
        <section id="architecture" className="border-b border-border py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:gap-16">
              <SectionIntro
                index="02"
                label="Architecture"
                title={
                  <>
                    A request has one path — and it is verified{" "}
                    <em className="italic text-primary">twice.</em>
                  </>
                }
              >
                UI, authorization, data access and SQL stay separable — the same sequence powers
                dashboards, tables and exports.
              </SectionIntro>

              <div className="min-w-0">
                <ol className="border-t border-border">
                  {steps.map((step, index) => (
                    <li
                      key={step.title}
                      className="grid grid-cols-[1.75rem_1fr] items-baseline gap-3 border-b border-border py-4 sm:gap-6"
                    >
                      <span className="tnum font-mono text-[0.625rem] tracking-[0.08em] text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{step.title}.</span>{" "}
                        {step.description}
                      </p>
                    </li>
                  ))}
                </ol>

                <p className="mt-8 border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  Cross-tenant reads return <span className="font-medium text-foreground">404, not 403</span> — the API
                  never confirms a record exists in another tenant.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 03 — Access */}
        <section id="access" className="border-b border-border py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.34fr_0.66fr] lg:gap-16">
              <SectionIntro index="03" label="Access" title={<>Roles that map to real permissions.</>}>
                One matrix, enforced on the server and reflected in the UI. Memberships are per
                organization, so the same person can own one workspace and only read another.
              </SectionIntro>

              <div className="min-w-0">
                <div className="overflow-x-auto border border-border">
                  <table className="w-full min-w-[34rem] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-secondary/60">
                        <th className="px-4 py-3 font-mono text-[0.5rem] font-normal uppercase tracking-[0.16em] text-muted-foreground">
                          Permission
                        </th>
                        {["Owner", "Admin", "Manager", "Viewer"].map((role) => (
                          <th
                            key={role}
                            className="px-3 py-3 text-center font-mono text-[0.5rem] font-normal uppercase tracking-[0.16em] text-muted-foreground"
                          >
                            {role}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {permissions.map((row) => (
                        <tr key={row.label}>
                          <td className="px-4 py-3 text-[0.8125rem]">{row.label}</td>
                          {row.values.map((value, index) => (
                            <td key={index} className="px-3 py-3 text-center">
                              {value === "full" ? (
                                <Check
                                  className="mx-auto size-3.5 text-primary"
                                  aria-label="Allowed"
                                />
                              ) : value === "read" ? (
                                <span className="font-mono text-[0.5rem] uppercase tracking-[0.1em] text-muted-foreground">
                                  read
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60" aria-label="Not allowed">
                                  —
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Check className="size-3 text-primary" aria-hidden="true" /> allowed
                  </span>
                  <span>read = list only</span>
                  <span>— = denied</span>
                </p>

                <div className="mt-12">
                  <div className="flex items-baseline justify-between border-b border-border pb-2">
                    <h3 className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
                      Audit trail
                    </h3>
                    <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                      append-only · before / after
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {auditRows.map((row) => (
                      <li
                        key={`${row.time}-${row.action}`}
                        className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline"
                      >
                        <span className="tnum font-mono text-[0.625rem] text-muted-foreground">
                          {row.time}
                        </span>
                        <div>
                          <p className="text-[0.8125rem] font-medium">{row.action}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>
                        </div>
                        <div className="tnum flex items-center gap-2 font-mono text-[0.6875rem]">
                          <span className="text-muted-foreground line-through decoration-destructive/60">
                            {row.before}
                          </span>
                          <span className="text-muted-foreground/60">→</span>
                          <span className="font-medium">{row.after}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Start CTA */}
        <section id="start" className="bg-foreground py-16 text-background sm:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.22em] text-background/55">
                Milestone 02 / Access
              </p>
              <h2 className="mt-4 max-w-2xl font-serif text-[2.4rem] leading-[1.05] tracking-tight sm:text-[3.5rem]">
                An account you can audit, not just a login box.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-background/70">
                Create a workspace and you become its Owner. Sessions are opaque and revocable,
                reset links work once, and every workspace you belong to is listed with the role
                you hold in it.
              </p>

              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-background/60">
                {[
                  "Opaque sessions",
                  "One-time reset links",
                  "Owner / Admin / Manager / Viewer",
                  "Audit entries from day one",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="inline-block size-1 bg-background/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-start gap-3">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "bg-background text-foreground hover:bg-background/85",
                )}
              >
                Open the live demo
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-background/60 underline-offset-4 hover:text-background hover:underline"
              >
                Create a workspace
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
