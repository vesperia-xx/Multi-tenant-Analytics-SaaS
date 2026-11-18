"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialOrgState } from "@/lib/org-form-state";
import { revokeInvitationAction } from "@/server/org/actions";

export function InvitationRow({
  slug,
  invitationId,
  email,
  roleLabel,
  expiresAt,
  readOnly = false,
}: {
  slug: string;
  invitationId: string;
  email: string;
  roleLabel: string;
  expiresAt: string;
  readOnly?: boolean;
}) {
  const [state, action, pending] = useActionState(revokeInvitationAction, initialOrgState);

  return (
    <li className="grid gap-3 border-b border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="break-all text-[0.9375rem] font-medium">{email}</p>
        <p className="mt-0.5 font-mono text-[0.625rem] leading-relaxed text-muted-foreground">
          {roleLabel} · expires {expiresAt}
        </p>
        {state.message ? (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={
              state.status === "error" ? "mt-1 text-xs text-destructive" : "mt-1 text-xs text-muted-foreground"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>

      {readOnly ? (
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
          Seeded
        </span>
      ) : (
        <form action={action}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="invitationId" value={invitationId} />
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? "Revoking…" : "Revoke"}
          </Button>
        </form>
      )}
    </li>
  );
}
