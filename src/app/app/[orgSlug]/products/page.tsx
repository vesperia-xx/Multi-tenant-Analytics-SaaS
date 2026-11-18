import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductsView } from "@/components/app/products/products-view";
import { TableSkeleton } from "@/components/app/table/table-skeleton";
import { listCategories } from "@/server/products/queries";
import { requireOrgContext } from "@/server/org/context";

export const metadata: Metadata = {
  title: "Products",
  description: "Search, filter and page through this workspace's product range.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const context = await requireOrgContext(orgSlug);
  const categories = await listCategories(context.organization.id);

  return (
    <Suspense fallback={<TableSkeleton />}>
      <ProductsView
        slug={context.organization.slug}
        currency={context.organization.currency}
        categories={categories}
      />
    </Suspense>
  );
}
