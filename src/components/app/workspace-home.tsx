import { format } from "date-fns";
import { ArrowRight, Check, Minus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, can, type Permission } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requireOrgContext } from "@/server/org/context";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="tnum mt-2 font-serif text-[2rem] leading-none tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

const capabilityList: Array<{ permission: Permission; label: string }> = [
  { permission: "data:read", label: "Read dashboards, orders and customers" },
  { permission: "data:write", label: "Create and edit orders and customers" },
  { permission: "product:write", label: "Create and edit products" },
  { permission: "export", label: "Export CSV and PDF reports" },
  { permission: "member:invite", label: "Invite members and manage access" },
  { permission: "audit:read", label: "Read the audit ledger" },
  { permission: "org:update", label: "Change workspace settings" },
  { permission: "org:delete", label: "Delete or transfer the workspace" },
];

export async function WorkspaceHome({ orgSlug }: { orgSlug: string }) {
  const context = await requireOrgContext(orgSlug);
  const { organization, membership } = context;

  const canManage = can(membership.role, "member:invite");
  const canAudit = can(membership.role, "audit:read");

  const [memberCount, pendingInvitations, auditCount] = await Promise.all([
    prisma.membership.count({ where: { organizationId: organization.id } }),
    canManage
      ? prisma.invitation.count({
          where: {
            organizationId: organization.id,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        })
      : Promise.resolve(0),
    canAudit ? prisma.auditLog.count({ where: { organizationId: organization.id } }) : Promise.resolve(0),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Workspace / Overview
        </p>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-[2.4rem] leading-[1.03] tracking-tight sm:text-[3rem]">
              {organization.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Created {format(organization.createdAt, "d MMMM yyyy")} · you are{" "}
              <span className="text-foreground">{ROLE_LABELS[membership.role]}</span> here since{" "}
              {format(membership.createdAt, "MMMM yyyy")}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{organization.currency}</Badge>
            <Badge variant="outline">{organization.timezone}</Badge>
            {organization.isDemo ? <Badge>Demo</Badge> : null}
          </div>
        </div>
      </header>

      <section aria-labelledby="numbers-heading">
        <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
          <h2
            id="numbers-heading"
            className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground"
          >
            01 / The workspace in numbers
          </h2>
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
            live from postgres
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Members"
            value={String(memberCount)}
            hint={memberCount === 1 ? "Just you, for now." : "Owners, admins, managers and viewers."}
          />
          <Stat
            label="Pending invitations"
            value={canManage ? String(pendingInvitations) : "—"}
            hint={
              canManage
                ? "Links that have not been accepted yet."
                : "Only Owners and Admins can see invitations."
            }
          />
          <Stat
            label="Audit entries"
            value={canAudit ? String(auditCount) : "—"}
            hint={
              canAudit
                ? "Append-only record of every change."
                : "Only Owners and Admins can read the ledger."
            }
          />
        </div>
      </section>

      <section aria-labelledby="access-heading">
        <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
          <h2
            id="access-heading"
            className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground"
          >
            02 / What your role allows
          </h2>
          <Link
            href={`/app/${organization.slug}/settings`}
            className="link-underline font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            Manage workspace
          </Link>
        </div>

        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {capabilityList.map((capability) => {
            const allowed = can(membership.role, capability.permission);

            return (
              <li
                key={capability.permission}
                className="flex items-center gap-3 border-b border-border/60 py-2 text-sm"
              >
                {allowed ? (
                  <Check className="size-3.5 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <Minus className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                )}
                <span className={allowed ? "text-foreground" : "text-muted-foreground"}>
                  {capability.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border border-border bg-card p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
        <div>
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
            Next milestone
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed">
            The workspace shell, roles and invitations are in place. Dashboards, tables and
            reports query this same tenant next — no mock data, ever.
          </p>
        </div>
        {canManage ? (
          <Link
            href={`/app/${organization.slug}/settings`}
            className="mt-4 inline-flex shrink-0 items-center gap-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-primary hover:underline sm:mt-0"
          >
            Invite the team
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </section>
    </div>
  );
}
