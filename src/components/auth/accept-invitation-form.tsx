"use client";

import { useActionState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { initialOrgState } from "@/lib/org-form-state";
import { acceptInvitationAction } from "@/server/org/actions";

export function AcceptInvitationForm({
  token,
  organizationName,
  roleLabel,
}: {
  token: string;
  organizationName: string;
  roleLabel: string;
}) {
  const [state, formAction, pending] = useActionState(acceptInvitationAction, initialOrgState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      {state.message ? (
        <AuthMessage tone={state.status === "error" ? "error" : "notice"}>
          {state.message}
        </AuthMessage>
      ) : null}

      <dl className="border-t border-border">
        <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5">
          <dt className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
            Workspace
          </dt>
          <dd className="text-sm font-medium">{organizationName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5">
          <dt className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
            Role
          </dt>
          <dd className="text-sm font-medium">{roleLabel}</dd>
        </div>
      </dl>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Joining…" : `Join ${organizationName}`}
      </Button>
    </form>
  );
}
