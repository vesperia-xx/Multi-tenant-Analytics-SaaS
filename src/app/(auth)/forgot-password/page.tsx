import type { Metadata } from "next";
import Link from "next/link";

import { AuthHeading } from "@/components/auth/auth-heading";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a one-time password reset link for your Vortex Metrics account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Access / 03"
        title="Reset your password"
        description="Enter the email you signed up with. We answer the same way whether or not that account exists."
      />

      <ForgotPasswordForm />

      <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="link-underline text-foreground">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
