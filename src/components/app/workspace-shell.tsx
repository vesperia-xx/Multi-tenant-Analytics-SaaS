import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, can } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requireOrgContext } from "@/server/org/context";

import { WorkspaceNav } from "./workspace-nav";
import { WorkspaceSwitcher } from "./workspace-switcher";

/**
 * Resolves the tenant once for the whole segment. Everything below receives the
 * verified context; nothing re-derives an organisation id from the client.
 */
export async function WorkspaceShell({
  orgSlug,
  children,
}: {
  orgSlug: string;
  children: React.ReactNode;
}) {
  const context = await requireOrgContext(orgSlug);

  const memberships = await prisma.membership.findMany({
    where: { userId: context.viewer.user.id },
    orderBy: { createdAt: "asc" },
    select: { role: true, organization: { select: { name: true, slug: true } } },
  });

  const workspaces = memberships.map((membership) => ({
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
  }));

  const active = workspaces.find((workspace) => workspace.slug === context.organization.slug) ?? {
    name: context.organization.name,
    slug: context.organization.slug,
    role: context.membership.role,
  };

  const canManage = can(context.membership.role, "member:invite");

  const navItems = [
    { index: "01", label: "Dashboard", href: `/app/${context.organization.slug}` },
    { index: "02", label: "Orders", href: `/app/${context.organization.slug}/orders` },
    { index: "03", label: "Customers", href: `/app/${context.organization.slug}/customers` },
    { index: "04", label: "Products", href: `/app/${context.organization.slug}/products` },
    ...(canManage
      ? [
          {
            index: "05",
            label: "Members & settings",
            href: `/app/${context.organization.slug}/settings`,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <WorkspaceSwitcher workspaces={workspaces} active={active} />

          <div className="flex items-center gap-3">
            <Badge
              variant={context.membership.role === "OWNER" ? "default" : "outline"}
              className="hidden sm:inline-flex"
            >
              {ROLE_LABELS[context.membership.role]}
            </Badge>
            <Link
              href="/app"
              className="link-underline hidden font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground sm:block"
            >
              Account
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 lg:py-10">
        <aside className="flex flex-col gap-5 lg:gap-8">
          <div>
            <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-muted-foreground">
              Workspace
            </p>
            <p className="mt-2 font-serif text-[1.35rem] leading-tight tracking-tight">
              {context.organization.name}
            </p>
            <p className="mt-1 break-all font-mono text-[0.5625rem] leading-relaxed text-muted-foreground">
              /app/{context.organization.slug}
            </p>
            {context.organization.isDemo ? (
              <Badge variant="outline" className="mt-3">
                Demo · read-only
              </Badge>
            ) : null}
          </div>

          <WorkspaceNav slug={context.organization.slug} items={navItems} />

          <div className="hidden border-t border-border pt-4 lg:block">
            <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
              Your role
            </p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {ROLE_DESCRIPTIONS[context.membership.role]}
            </p>
          </div>

          <Link
            href={`/app/${context.organization.slug}/settings`}
            className="group hidden items-center justify-between gap-2 border-t border-border pt-3 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground lg:flex"
          >
            Workspace settings
            <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
