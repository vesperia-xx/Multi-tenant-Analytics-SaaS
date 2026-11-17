"use client";

import { useActionState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialAuthState } from "@/lib/auth-form-state";
import { registerAction } from "@/server/auth/actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialAuthState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.message ? (
        <AuthMessage tone={state.status === "error" ? "error" : "notice"}>
          {state.message}
        </AuthMessage>
      ) : null}

      <Field label="Your name" htmlFor="name" error={fieldErrors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          required
          autoFocus
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
      </Field>

      <Field label="Work email" htmlFor="email" error={fieldErrors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          required
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
      </Field>

      <Field
        label="Workspace name"
        htmlFor="organizationName"
        error={fieldErrors.organizationName}
        hint="You become its Owner. Invite the rest of the team afterwards."
      >
        <Input
          id="organizationName"
          name="organizationName"
          autoComplete="organization"
          placeholder="Acme Inc."
          required
          aria-invalid={Boolean(fieldErrors.organizationName)}
          aria-describedby={
            fieldErrors.organizationName ? "organizationName-error" : "organizationName-hint"
          }
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={fieldErrors.password}
        hint="At least 10 characters, with a letter and a number."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
        />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Creating workspace…" : "Create workspace"}
      </Button>

      <p className="font-mono text-[0.5625rem] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
        Open registration · no card required
      </p>
    </form>
  );
}
