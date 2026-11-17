import type { Metadata } from "next";
import Link from "next/link";

import { AuthHeading } from "@/components/auth/auth-heading";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create a workspace",
  description: "Create a Vortex Metrics workspace and become its Owner.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Access / 02"
        title="Create a workspace"
        description="One workspace to start. You own it, and you can invite the team once you are in."
      />

      <RegisterForm />

      <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="link-underline text-foreground">
          Sign in
        </Link>
      </p>
    </>
  );
}
