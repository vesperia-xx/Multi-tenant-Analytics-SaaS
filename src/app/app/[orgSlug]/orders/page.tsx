import type { Metadata } from "next";
import { Suspense } from "react";

import { OrdersView } from "@/components/app/orders/orders-view";
import { TableSkeleton } from "@/components/app/table/table-skeleton";
import { requireOrgContext } from "@/server/org/context";

export const metadata: Metadata = {
  title: "Orders",
  description: "Search, filter and page through this workspace's orders.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const context = await requireOrgContext(orgSlug);

  return (
    <Suspense fallback={<TableSkeleton />}>
      <OrdersView slug={context.organization.slug} currency={context.organization.currency} />
    </Suspense>
  );
}
