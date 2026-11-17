"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialAuthState } from "@/lib/auth-form-state";
import { resetPasswordAction } from "@/server/auth/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialAuthState);
  const fieldErrors = state.fieldErrors ?? {};

  if (!token) {
    return (
      <div className="flex flex-col gap-5">
        <AuthMessage tone="error">
          This link is missing its token. Open the link from your email again, or request a new
          one.
        </AuthMessage>
        <Link href="/forgot-password" className="link-underline text-sm text-primary">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      {state.message ? (
        <AuthMessage tone={state.status === "error" ? "error" : "notice"}>
          {state.message}
        </AuthMessage>
      ) : null}

      <Field
        label="New password"
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
          autoFocus
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
        />
      </Field>

      <Field label="Confirm password" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
        />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Updating…" : "Update password"}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Saving a new password signs out every other device.
      </p>
    </form>
  );
}
