"use client";

import { useActionState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialOrgState } from "@/lib/org-form-state";
import { updateWorkspaceAction } from "@/server/org/actions";

export function WorkspaceProfileForm({
  slug,
  name,
  currency,
  timezone,
}: {
  slug: string;
  name: string;
  currency: string;
  timezone: string;
}) {
  const [state, formAction, pending] = useActionState(updateWorkspaceAction, initialOrgState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="slug" value={slug} />

      {state.message ? (
        <AuthMessage tone={state.status === "error" ? "error" : "notice"}>
          {state.message}
        </AuthMessage>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Workspace name" htmlFor="workspace-name" error={fieldErrors.name}>
          <Input
            id="workspace-name"
            name="name"
            defaultValue={name}
            required
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "workspace-name-error" : undefined}
          />
        </Field>

        <Field
          label="Currency"
          htmlFor="workspace-currency"
          error={fieldErrors.currency}
          hint="Three-letter ISO code. Amounts are stored in minor units."
        >
          <Input
            id="workspace-currency"
            name="currency"
            defaultValue={currency}
            maxLength={3}
            required
            className="font-mono uppercase"
            aria-invalid={Boolean(fieldErrors.currency)}
            aria-describedby={fieldErrors.currency ? "workspace-currency-error" : "workspace-currency-hint"}
          />
        </Field>
      </div>

      <Field
        label="Time zone"
        htmlFor="workspace-timezone"
        error={fieldErrors.timezone}
        hint="IANA name, e.g. Europe/Madrid. Every aggregate is grouped in this zone."
      >
        <Input
          id="workspace-timezone"
          name="timezone"
          defaultValue={timezone}
          required
          className="font-mono"
          aria-invalid={Boolean(fieldErrors.timezone)}
          aria-describedby={fieldErrors.timezone ? "workspace-timezone-error" : "workspace-timezone-hint"}
        />
      </Field>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
