"use client";

import { useActionState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialOrgState } from "@/lib/org-form-state";
import { createWorkspaceAction } from "@/server/org/actions";

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspaceAction, initialOrgState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.message ? (
        <AuthMessage tone={state.status === "error" ? "error" : "notice"}>
          {state.message}
        </AuthMessage>
      ) : null}

      <Field label="Workspace name" htmlFor="new-workspace-name" error={fieldErrors.name}>
        <Input
          id="new-workspace-name"
          name="name"
          placeholder="Nordwind Studio"
          required
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "new-workspace-name-error" : undefined}
        />
      </Field>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create workspace"}
        </Button>
      </div>
    </form>
  );
}
