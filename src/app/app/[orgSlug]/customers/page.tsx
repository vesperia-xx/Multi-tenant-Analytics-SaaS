import type { Metadata } from "next";
import { Suspense } from "react";

import { CustomersView } from "@/components/app/customers/customers-view";
import { TableSkeleton } from "@/components/app/table/table-skeleton";
import { listCountries } from "@/server/customers/queries";
import { requireOrgContext } from "@/server/org/context";

export const metadata: Metadata = {
  title: "Customers",
  description: "Search, filter and page through this workspace's customers.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const context = await requireOrgContext(orgSlug);
  const countries = await listCountries(context.organization.id);

  return (
    <Suspense fallback={<TableSkeleton />}>
      <CustomersView
        slug={context.organization.slug}
        currency={context.organization.currency}
        countries={countries}
      />
    </Suspense>
  );
}
