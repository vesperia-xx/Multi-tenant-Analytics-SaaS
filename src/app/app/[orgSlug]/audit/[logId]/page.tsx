import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RestrictedPanel } from "@/components/app/restricted-panel";
import { Badge } from "@/components/ui/badge";
import { auditActionLabel, auditActionTone } from "@/lib/audit-actions";
import { diffObjects, formatDiffValue, type DiffKind } from "@/lib/diff";
import { formatIp, formatTimestamp } from "@/lib/format";
import { ROLE_LABELS, can } from "@/lib/permissions";
import { getAuditLog } from "@/server/audit/queries";
import { requireOrgContext } from "@/server/org/context";

export const metadata: Metadata = {
  title: "Audit entry",
  description: "One append-only audit entry with its before/after snapshot.",
  robots: { index: false, follow: false },
};

export const instant = false;

const kindVariant: Record<DiffKind, "warning" | "success" | "destructive"> = {
  changed: "warning",
  added: "success",
  removed: "destructive",
};

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border/70 py-2 last:border-b-0">
      <dt className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-all text-[0.8125rem]">{value}</dd>
    </div>
  );
}

export default async function AuditEntryPage({
  params,
}: {
  params: Promise<{ orgSlug: string; logId: string }>;
}) {
  const { orgSlug, logId } = await params;
  const context = await requireOrgContext(orgSlug);

  if (!can(context.membership.role, "audit:read")) {
    return (
      <RestrictedPanel
        title="Audit ledger"
        message={`Only Owners and Admins can read the audit ledger. Your role here is ${
          ROLE_LABELS[context.membership.role]
        }.`}
      />
    );
  }

  const entry = await getAuditLog(context.organization.id, logId);
  if (!entry) notFound();

  const rows = diffObjects(entry.before, entry.after);
  const rawBefore = entry.before === null ? null : JSON.stringify(entry.before, null, 2);
  const rawAfter = entry.after === null ? null : JSON.stringify(entry.after, null, 2);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/app/${context.organization.slug}/audit`}
          className="inline-flex items-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden="true" />
          Audit log
        </Link>
      </div>

      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Workspace / Audit entry
        </p>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2.1rem] leading-[1.05] tracking-tight">
              {auditActionLabel(entry.action)}
            </h1>
            <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground">
              {entry.action}
            </p>
          </div>
          <Badge variant={auditActionTone(entry.action)}>{entry.action.split(".")[0]}</Badge>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {formatTimestamp(entry.createdAt, context.organization.timezone, true)} ·{" "}
          {entry.actorName ?? "System"}
          {entry.actorEmail ? ` (${entry.actorEmail})` : ""} · {entry.resourceType}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="border border-border bg-card">
          <div className="border-b border-border px-4 py-2.5">
            <h2 className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
              01 / Field changes
            </h2>
          </div>

          {rows.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">
              No field differences were recorded for this entry.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-mono text-[0.5rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Field
                    </th>
                    <th className="px-4 py-2 text-left font-mono text-[0.5rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Before
                    </th>
                    <th className="px-4 py-2 text-left font-mono text-[0.5rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      After
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.field} className="border-b border-border/60 last:border-b-0">
                      <td className="align-top px-4 py-3">
                        <p className="font-mono text-[0.6875rem]">{row.field}</p>
                        <Badge variant={kindVariant[row.kind]} className="mt-1">
                          {row.kind}
                        </Badge>
                      </td>
                      <td className="align-top px-4 py-3 text-[0.8125rem] text-muted-foreground">
                        <span className="break-words font-mono text-[0.75rem]">
                          {formatDiffValue(row.before)}
                        </span>
                      </td>
                      <td className="align-top px-4 py-3">
                        <span className="break-words font-mono text-[0.75rem]">
                          {formatDiffValue(row.after)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section className="border border-border bg-card p-5">
            <h2 className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground">
              02 / Context
            </h2>
            <dl className="mt-2">
              <ContextRow label="Actor" value={entry.actorName ?? "System"} />
              <ContextRow label="Email" value={entry.actorEmail ?? "—"} />
              <ContextRow label="Resource" value={`${entry.resourceType}${entry.resourceId ? ` · ${entry.resourceId}` : ""}`} />
              <ContextRow label="Source IP" value={formatIp(entry.ip)} />
              <ContextRow label="Device" value={entry.userAgent ?? "Not recorded"} />
              <ContextRow label="Recorded at" value={formatTimestamp(entry.createdAt, context.organization.timezone, true)} />
              <ContextRow label="Entry id" value={entry.id} />
            </dl>
          </section>

          {rawBefore || rawAfter ? (
            <details className="border border-border bg-card p-5">
              <summary className="cursor-pointer list-none font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground [&::-webkit-details-marker]:hidden">
                03 / Raw payload
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                    Before
                  </p>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all bg-secondary/50 p-2 font-mono text-[0.625rem] leading-relaxed">
                    {rawBefore ?? "null"}
                  </pre>
                </div>
                <div>
                  <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                    After
                  </p>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all bg-secondary/50 p-2 font-mono text-[0.625rem] leading-relaxed">
                    {rawAfter ?? "null"}
                  </pre>
                </div>
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
