import type { Metadata } from "next";

import { WorkspaceSettingsPanel } from "@/components/app/workspace-settings-panel";

export const metadata: Metadata = {
  title: "Workspace settings",
  description: "Members, roles and invitations for this workspace.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return <WorkspaceSettingsPanel orgSlug={orgSlug} />;
}
