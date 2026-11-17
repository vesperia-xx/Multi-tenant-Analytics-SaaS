import type { Metadata } from "next";

import { AnalyticsDashboard } from "@/components/app/analytics/analytics-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Revenue, orders and acquisition for this workspace.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orgSlug } = await params;

  return <AnalyticsDashboard orgSlug={orgSlug} searchParams={searchParams} />;
}
