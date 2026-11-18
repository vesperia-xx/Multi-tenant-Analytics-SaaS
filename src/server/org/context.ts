import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { Role } from "@/generated/prisma/enums";
import type { Permission } from "@/lib/permissions";
import { can } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { getViewer, requireViewer, type Viewer } from "@/server/auth/session";

export type OrgContext = {
  viewer: Viewer;
  organization: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    timezone: string;
    isDemo: boolean;
    createdAt: Date;
  };
  membership: {
    id: string;
    role: Role;
    createdAt: Date;
  };
};

/**
 * The tenant is derived from the URL slug and resolved against the viewer's
 * memberships. The client never supplies an organisation id, so a forged id has
 * nothing to forge against.
 */
const loadMembership = cache(
  async (userId: string, orgSlug: string) =>
    prisma.membership.findFirst({
      where: { userId, organization: { slug: orgSlug } },
      select: {
        id: true,
        role: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            timezone: true,
            isDemo: true,
            createdAt: true,
          },
        },
      },
    }),
);

/**
 * Page-level resolver: a workspace the viewer does not belong to is indistin-
 * guishable from one that does not exist, so both return 404.
 */
export async function requireOrgContext(orgSlug: string): Promise<OrgContext> {
  const viewer = await requireViewer(`/app/${orgSlug}`);
  const membership = await loadMembership(viewer.user.id, orgSlug);

  if (!membership) notFound();

  return {
    viewer,
    organization: membership.organization,
    membership: {
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt,
    },
  };
}

/**
 * Action-level resolver: Server Actions never redirect to a 404 page mid-flight,
 * so they get `null` and answer with a generic error instead.
 */
export async function resolveOrgContext(orgSlug: string): Promise<OrgContext | null> {
  const viewer = await requireViewer(`/app/${orgSlug}`);
  const membership = await loadMembership(viewer.user.id, orgSlug);

  if (!membership) return null;

  return {
    viewer,
    organization: membership.organization,
    membership: {
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt,
    },
  };
}

export function hasPermission(context: OrgContext, permission: Permission): boolean {
  return can(context.membership.role, permission);
}

/**
 * Route Handlers get `null` semantics instead of redirects: the caller decides
 * the status code — anonymous callers get 401, a foreign tenant gets 404.
 */
export type ApiOrgContext =
  | { ok: true; context: OrgContext }
  | { ok: false; reason: "unauthorized" | "not-found" };

export async function getApiOrgContext(orgSlug: string): Promise<ApiOrgContext> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, reason: "unauthorized" };

  const membership = await loadMembership(viewer.user.id, orgSlug);
  if (!membership) return { ok: false, reason: "not-found" };

  return {
    ok: true,
    context: {
      viewer,
      organization: membership.organization,
      membership: {
        id: membership.id,
        role: membership.role,
        createdAt: membership.createdAt,
      },
    },
  };
}
