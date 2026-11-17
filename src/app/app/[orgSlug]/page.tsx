import type { Metadata } from "next";

import { WorkspaceHome } from "@/components/app/workspace-home";

export const metadata: Metadata = {
  title: "Workspace overview",
  description: "Members, roles and audit activity for this workspace.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return <WorkspaceHome orgSlug={orgSlug} />;
}
