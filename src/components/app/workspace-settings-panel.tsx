import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, can, canManageMember } from "@/lib/permissions";
import { prisma } from "@/server/db/client";
import { requireOrgContext } from "@/server/org/context";
import { isReadOnlyAccount, isReadOnlyOrg } from "@/server/org/demo";

import { InvitationRow } from "./invitation-row";
import { InviteMemberForm } from "./invite-member-form";
import { MemberRow } from "./member-row";
import { WorkspaceProfileForm } from "./workspace-profile-form";

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
        {aside ? <span className="text-[0.5rem] tracking-[0.14em]">{aside}</span> : null}
      </h2>
    </div>
  );
}

function ReadOnlyProfile({
  name,
  currency,
  timezone,
}: {
  name: string;
  currency: string;
  timezone: string;
}) {
  const fields = [
    { label: "Workspace name", value: name },
    { label: "Currency", value: currency },
    { label: "Time zone", value: timezone },
  ];

  return (
    <div className="border border-border bg-card">
      <dl className="grid gap-px bg-border sm:grid-cols-3">
        {fields.map((field) => (
          <div key={field.label} className="bg-card px-4 py-3">
            <dt className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
              {field.label}
            </dt>
            <dd className="mt-1 break-words text-sm">{field.value}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-border px-4 py-2.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-muted-foreground">
        Read-only demo · editing is disabled
      </p>
    </div>
  );
}

export async function WorkspaceSettingsPanel({ orgSlug }: { orgSlug: string }) {
  const context = await requireOrgContext(orgSlug);
  const { organization, membership } = context;
  const readOnly = isReadOnlyOrg(organization) || isReadOnlyAccount(context.viewer.user);

  const canUpdate = can(membership.role, "org:update");
  const canInvite = can(membership.role, "member:invite");
  const canManage = can(membership.role, "member:manage");

  const [members, invitations] = await Promise.all([
    canManage
      ? prisma.membership.findMany({
          where: { organizationId: organization.id },
          orderBy: [{ role: "desc" }, { createdAt: "asc" }],
          select: {
            id: true,
            role: true,
            userId: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        })
      : Promise.resolve([]),
    canInvite
      ? prisma.invitation.findMany({
          where: {
            organizationId: organization.id,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, email: true, role: true, expiresAt: true },
        })
      : Promise.resolve([]),
  ]);

  if (!canUpdate && !canInvite) {
    return (
      <div className="border-l-2 border-primary bg-primary/5 px-5 py-4">
        <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
          Restricted
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed">
          Only Owners and Admins can open workspace settings. Your role here is{" "}
          <span className="font-medium">{ROLE_LABELS[membership.role]}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block size-1.5 bg-primary" />
          Workspace / Members & settings
        </p>
        <h1 className="mt-4 font-serif text-[2.2rem] leading-[1.05] tracking-tight sm:text-[2.6rem]">
          Who gets in, and what they can do.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Roles are checked on the server for every action. The interface only hides what the
          server would refuse anyway.
        </p>
      </header>

      {canUpdate ? (
        <section aria-labelledby="profile-heading">
          <SectionHeading
            id="profile-heading"
            index="01"
            title="Workspace profile"
            aside={`${membership.role === "OWNER" ? "owner access" : "admin access"}`}
          />
          {readOnly ? (
            <ReadOnlyProfile
              name={organization.name}
              currency={organization.currency}
              timezone={organization.timezone}
            />
          ) : (
            <WorkspaceProfileForm
              slug={organization.slug}
              name={organization.name}
              currency={organization.currency}
              timezone={organization.timezone}
            />
          )}
        </section>
      ) : null}

      {canManage ? (
        <section aria-labelledby="members-heading">
          <SectionHeading
            id="members-heading"
            index="02"
            title="Members"
            aside={`${members.length} ${members.length === 1 ? "person" : "people"} · owners are protected`}
          />

          <ul className="border-t border-border">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                slug={organization.slug}
                memberId={member.id}
                name={member.user.name}
                email={member.user.email}
                role={member.role}
                joinedAt={format(member.createdAt, "d MMM yyyy")}
                actorRole={membership.role}
                isSelf={member.userId === context.viewer.user.id}
                canManage={canManageMember(membership.role, member.role)}
                readOnly={readOnly}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {canInvite ? (
        <section aria-labelledby="invitations-heading">
          <SectionHeading
            id="invitations-heading"
            index="03"
            title="Invitations"
            aside={`${invitations.length} pending`}
          />

          <div className="border border-border bg-card p-5">
            {readOnly ? (
              <div>
                <p className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Invitations are disabled
                </p>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  Demo mode is read-only. Create your own account to invite people and manage
                  roles.
                </p>
              </div>
            ) : (
              <InviteMemberForm slug={organization.slug} actorRole={membership.role} />
            )}
          </div>

          {invitations.length > 0 ? (
            <ul className="mt-6 border-t border-border">
              {invitations.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  slug={organization.slug}
                  invitationId={invitation.id}
                  email={invitation.email}
                  roleLabel={ROLE_LABELS[invitation.role]}
                  expiresAt={format(invitation.expiresAt, "d MMM yyyy")}
                  readOnly={readOnly}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-6 flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground">
              <Badge variant="outline">0 pending</Badge>
              No links waiting to be accepted.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
