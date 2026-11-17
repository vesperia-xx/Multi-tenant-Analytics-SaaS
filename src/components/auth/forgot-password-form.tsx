"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialAuthState } from "@/lib/auth-form-state";
import { requestPasswordResetAction } from "@/server/auth/actions";

function toRelativePath(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return undefined;
  }
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthState,
  );
  const fieldErrors = state.fieldErrors ?? {};
  const resetPath = toRelativePath(state.resetUrl);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.message ? (
        <AuthMessage tone={state.status === "error" ? "error" : "notice"}>
          {state.message}
        </AuthMessage>
      ) : null}

      {resetPath ? (
        <div className="border border-border bg-secondary/60 p-3">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
            Demo delivery · no email provider configured
          </p>
          <Link
            href={resetPath}
            className="link-underline mt-2 inline-block break-all text-sm text-primary"
          >
            Open the one-time reset link
          </Link>
        </div>
      ) : null}

      <Field label="Email" htmlFor="email" error={fieldErrors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          required
          autoFocus
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        The link works once and expires after 60 minutes. Requesting a new one cancels the
        previous link.
      </p>
    </form>
  );
}
