import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditView } from "@/components/app/audit/audit-view";
import { RestrictedPanel } from "@/components/app/restricted-panel";
import { TableSkeleton } from "@/components/app/table/table-skeleton";
import { ROLE_LABELS, can } from "@/lib/permissions";
import { listAuditActions } from "@/server/audit/queries";
import { requireOrgContext } from "@/server/org/context";

export const metadata: Metadata = {
  title: "Audit log",
  description: "Append-only ledger of every change in this workspace.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AuditPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
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

  const actions = await listAuditActions(context.organization.id);

  return (
    <Suspense fallback={<TableSkeleton />}>
      <AuditView
        slug={context.organization.slug}
        timezone={context.organization.timezone}
        actions={actions}
      />
    </Suspense>
  );
}
