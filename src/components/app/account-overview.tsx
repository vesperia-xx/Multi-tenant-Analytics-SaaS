import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Role } from "@/generated/prisma/enums";
import { describeUserAgent } from "@/lib/user-agent";
import { revokeOtherSessionsAction, revokeSessionAction } from "@/server/auth/actions";
import { requireViewer } from "@/server/auth/session";
import { prisma } from "@/server/db/client";

import { CreateWorkspaceForm } from "./create-workspace-form";

const roleLabels: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  VIEWER: "Viewer",
};

const roleVariants: Record<Role, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MANAGER: "outline",
  VIEWER: "outline",
};

function formatIp(ip: string | null): string {
  if (!ip) return "IP not recorded";
  if (ip === "::1" || ip === "127.0.0.1") return "Local";
  return ip;
}

function SectionHeading({
  id,
  index,
  title,
  aside,
}: {
  id: string;
  index: string;
  title: string;
  aside?: string;
}) {
  return (
    <div className="mb-4 border-b border-border pb-2">
      <h2
        id={id}
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-muted-foreground"
      >
        <span>
          {index} / {title}
        </span>
        {aside ? (
          <span className="text-[0.5rem] tracking-[0.14em]">{aside}</span>
        ) : null}
      </h2>
    </div>
  );
}

export async function AccountOverview() {
  const viewer = await requireViewer("/app");

  const [memberships, sessions] = await Promise.all([
    prisma.membership.findMany({
      where: { userId: viewer.user.id },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        organization: { select: { id: true, name: true, slug: true, isDemo: true } },
      },
    }),
    prisma.session.findMany({
      where: {
        userId: viewer.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    }),
  ]);

  const firstName = viewer.user.name.split(" ")[0] ?? viewer.user.name;
  const otherDevices = sessions.filter((session) => session.id !== viewer.sessionId).length;
  const activeMembership = memberships.find(
    (membership) => membership.organization.id === viewer.activeOrganizationId,
  );

  return (
    <div className="flex flex-col gap-12">
      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Account / Session
        </p>
        <h1 className="mt-4 max-w-2xl font-serif text-[2.4rem] leading-[1.04] tracking-tight sm:text-[3rem]">
          Signed in as <em className="italic text-primary">{firstName}.</em>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {viewer.user.email} · member since {format(viewer.user.createdAt, "MMMM yyyy")}
        </p>

        {activeMembership ? (
          <Link
            href={`/app/${activeMembership.organization.slug}`}
            className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-6`}
          >
            Continue in {activeMembership.organization.name}
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </header>

      <section aria-labelledby="workspaces-heading">
        <SectionHeading
          id="workspaces-heading"
          index="01"
          title="Workspaces"
          aside={`${memberships.length} membership${memberships.length === 1 ? "" : "s"}`}
        />

        {memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">You do not belong to any workspace yet.</p>
        ) : (
          <ul className="border-t border-border">
            {memberships.map((membership) => (
              <li
                key={membership.organization.id}
                className="grid gap-2 border-b border-border py-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.9375rem] font-medium">
                    {membership.organization.name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[0.625rem] text-muted-foreground">
                    /app/{membership.organization.slug}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {membership.organization.isDemo ? (
                    <Badge variant="outline">Demo</Badge>
                  ) : null}
                  <Badge variant={roleVariants[membership.role]}>
                    {roleLabels[membership.role]}
                  </Badge>
                  <Link
                    href={`/app/${membership.organization.slug}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Open
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <details className="group mt-6 border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent/50 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Plus className="size-4 text-primary" aria-hidden="true" />
              Create a workspace
            </span>
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
              You become its Owner
            </span>
          </summary>
          <div className="border-t border-border p-4">
            <CreateWorkspaceForm />
          </div>
        </details>
      </section>

      <section aria-labelledby="sessions-heading">
        <SectionHeading
          id="sessions-heading"
          index="02"
          title="Active sessions"
          aside={`${sessions.length} live · cookie only`}
        />

        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        ) : (
          <ul className="border-t border-border">
            {sessions.map((session) => {
              const isCurrent = session.id === viewer.sessionId;

              return (
                <li
                  key={session.id}
                  className="grid gap-3 border-b border-border py-4 sm:grid-cols-[1fr_auto] sm:items-start"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] font-medium">
                      {describeUserAgent(session.userAgent)}
                      {isCurrent ? <Badge variant="secondary">This device</Badge> : null}
                    </p>
                    <p className="mt-1 font-mono text-[0.625rem] leading-relaxed text-muted-foreground">
                      {formatIp(session.ip)} · seen{" "}
                      {formatDistanceToNow(session.lastUsedAt, { addSuffix: true })}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.625rem] leading-relaxed text-muted-foreground">
                      started {format(session.createdAt, "d MMM yyyy, HH:mm")} · expires{" "}
                      {format(session.expiresAt, "d MMM yyyy")}
                    </p>
                  </div>

                  {isCurrent ? null : (
                    <form action={revokeSessionAction}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Revoke
                      </Button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="security-heading">
        <SectionHeading id="security-heading" index="03" title="Security" />

        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm font-medium">Sessions are opaque and revocable</p>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
              The cookie holds a random token; the database only keeps its SHA-256 digest. A
              password reset signs out every device, including this one.
            </p>
            <Link
              href="/forgot-password"
              className="link-underline mt-3 inline-block text-sm text-primary"
            >
              Send a password reset link
            </Link>
          </div>

          {otherDevices > 0 ? (
            <form action={revokeOtherSessionsAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out {otherDevices} other device{otherDevices === 1 ? "" : "s"}
              </Button>
            </form>
          ) : (
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
              Only this device is signed in
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
