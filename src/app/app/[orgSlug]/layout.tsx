import type { Metadata } from "next";

import { WorkspaceShell } from "@/components/app/workspace-shell";

export const metadata: Metadata = {
  title: "Workspace",
  description: "A tenant-scoped Vortex Metrics workspace.",
  robots: { index: false, follow: false },
};

/**
 * The workspace guard runs before the response starts streaming so the HTTP
 * status is truthful: a tenant the viewer does not belong to returns a real
 * 404, not a 200 with a not-found screen inside the stream.
 *
 * The trade-off is a blocking navigation into the segment; `loading.tsx` gives
 * the click an immediate fallback while the membership check resolves.
 */
export const instant = false;

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return <WorkspaceShell orgSlug={orgSlug}>{children}</WorkspaceShell>;
}
