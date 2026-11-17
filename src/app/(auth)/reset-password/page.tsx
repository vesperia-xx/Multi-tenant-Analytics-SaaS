import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthFormSkeleton, AuthHeading } from "@/components/auth/auth-heading";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Vortex Metrics account.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <AuthHeading
        eyebrow="Access / 04"
        title="Choose a new password"
        description="The link works once. Completing this form signs you out everywhere else."
      />

      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <ResetPasswordPanel searchParams={searchParams} />
      </Suspense>

      <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
        Link expired?{" "}
        <Link href="/forgot-password" className="link-underline text-foreground">
          Request a new one
        </Link>
      </p>
    </>
  );
}

async function ResetPasswordPanel({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <ResetPasswordForm token={firstParam(params.token) ?? ""} />;
}
