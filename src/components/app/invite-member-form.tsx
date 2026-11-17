"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialOrgState } from "@/lib/org-form-state";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, assignableRoles } from "@/lib/permissions";
import { inviteMemberAction } from "@/server/org/actions";

type Role = keyof typeof ROLE_LABELS;

function toRelativePath(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return undefined;
  }
}

export function InviteMemberForm({ slug, actorRole }: { slug: string; actorRole: Role }) {
  const [state, formAction, pending] = useActionState(inviteMemberAction, initialOrgState);
  const fieldErrors = state.fieldErrors ?? {};
  const options = assignableRoles(actorRole);
  const invitePath = toRelativePath(state.inviteUrl);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="slug" value={slug} />

      {state.message ? (
        <AuthMessage tone={state.status === "error" ? "error" : "notice"}>
          {state.message}
        </AuthMessage>
      ) : null}

      {invitePath ? (
        <div className="border border-border bg-secondary/60 p-3">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
            No mail provider configured · share this link
          </p>
          <Link href={invitePath} className="link-underline mt-2 inline-block break-all text-sm text-primary">
            Open the invitation link
          </Link>
          <p className="mt-2 font-mono text-[0.5625rem] leading-relaxed text-muted-foreground">
            The invitee must sign in with the invited address to accept. The link expires in 7
            days.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start">
        <Field label="Email" htmlFor="invite-email" error={fieldErrors.email}>
          <Input
            id="invite-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="teammate@company.com"
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "invite-email-error" : undefined}
          />
        </Field>

        <Field label="Role" htmlFor="invite-role" error={fieldErrors.role}>
          <select
            id="invite-role"
            name="role"
            defaultValue={options[options.length - 1] ?? "VIEWER"}
            className="h-11 w-full rounded-[3px] border border-input bg-card px-3 text-sm text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <dl className="grid gap-1.5 border-t border-border pt-3">
        {options.map((option) => (
          <div key={option} className="flex gap-2 text-xs leading-relaxed">
            <dt className="w-20 shrink-0 font-mono uppercase tracking-[0.1em] text-muted-foreground">
              {ROLE_LABELS[option]}
            </dt>
            <dd className="text-muted-foreground">{ROLE_DESCRIPTIONS[option]}</dd>
          </div>
        ))}
      </dl>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting…" : "Send invitation"}
        </Button>
      </div>
    </form>
  );
}
