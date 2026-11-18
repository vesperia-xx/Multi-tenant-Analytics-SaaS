"use client";

import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initialOrgState } from "@/lib/org-form-state";
import { ROLE_LABELS, assignableRoles } from "@/lib/permissions";
import { changeMemberRoleAction, removeMemberAction } from "@/server/org/actions";

type Role = keyof typeof ROLE_LABELS;

export function MemberRow({
  slug,
  memberId,
  name,
  email,
  role,
  joinedAt,
  actorRole,
  isSelf,
  canManage,
  readOnly = false,
}: {
  slug: string;
  memberId: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  actorRole: Role;
  isSelf: boolean;
  canManage: boolean;
  readOnly?: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(
    changeMemberRoleAction,
    initialOrgState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeMemberAction,
    initialOrgState,
  );

  const options = assignableRoles(actorRole);
  const editable = !readOnly && canManage && !isSelf && role !== "OWNER";

  return (
    <li className="grid gap-3 border-b border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] font-medium">
          <span className="truncate">{name}</span>
          {isSelf ? <Badge variant="secondary">You</Badge> : null}
          {role === "OWNER" ? <Badge>Owner</Badge> : null}
        </p>
        <p className="mt-0.5 break-all font-mono text-[0.625rem] leading-relaxed text-muted-foreground">
          {email} · joined {joinedAt}
        </p>
        {roleState.message || removeState.message ? (
          <p
            role={roleState.status === "error" || removeState.status === "error" ? "alert" : "status"}
            className={
              roleState.status === "error" || removeState.status === "error"
                ? "mt-1 text-xs text-destructive"
                : "mt-1 text-xs text-muted-foreground"
            }
          >
            {roleState.message ?? removeState.message}
          </p>
        ) : null}
      </div>

      {editable ? (
        <div className="flex flex-wrap items-center gap-2">
          <form action={roleAction} className="flex items-center gap-2">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="memberId" value={memberId} />
            <label className="sr-only" htmlFor={`role-${memberId}`}>
              Role for {name}
            </label>
            <select
              id={`role-${memberId}`}
              name="role"
              defaultValue={role}
              className="h-8 rounded-[3px] border border-input bg-card px-2 text-xs text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm" disabled={rolePending}>
              {rolePending ? "Saving…" : "Save"}
            </Button>
          </form>

          <form action={removeAction}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="memberId" value={memberId} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              disabled={removePending}
            >
              {removePending ? "Removing…" : "Remove"}
            </Button>
          </form>
        </div>
      ) : (
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
          {readOnly
            ? `${ROLE_LABELS[role]}${role === "OWNER" ? " · protected" : ""}`
            : role === "OWNER"
              ? "Protected"
              : isSelf
                ? "This device"
                : ROLE_LABELS[role]}
        </span>
      )}
    </li>
  );
}
