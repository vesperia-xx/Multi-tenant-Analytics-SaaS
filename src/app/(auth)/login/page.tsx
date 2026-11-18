import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthFormSkeleton, AuthHeading } from "@/components/auth/auth-heading";
import { DemoAccess } from "@/components/auth/demo-access";
import { LoginForm } from "@/components/auth/login-form";
import { serverEnv } from "@/lib/env";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Vortex Metrics and open the workspaces you belong to.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <AuthHeading
        eyebrow="Access / 01"
        title="Sign in"
        description="Your memberships decide which workspaces open. Nothing else does."
      />

      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginPanel searchParams={searchParams} />
      </Suspense>

      <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
        New to Vortex?{" "}
        <Link href="/register" className="link-underline text-foreground">
          Create a workspace
        </Link>
      </p>
    </>
  );
}

async function LoginPanel({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = firstParam(params.next) ?? "/app";
  const env = serverEnv();

  const notice =
    firstParam(params.reset) === "1"
      ? "Your password was updated. Sign in with the new one."
      : firstParam(params["signed-out"]) === "1"
        ? "You are signed out. This device no longer holds a session."
        : firstParam(params.demo) === "unavailable"
          ? "The demo is not provisioned on this deployment. Sign in or create your own workspace."
          : firstParam(params.demo) === "limited"
            ? "Too many demo sign-ins from this address. Try again in a few minutes."
            : undefined;

  return (
    <>
      {env.DEMO_MODE ? <DemoAccess readOnly={env.DEMO_READ_ONLY} /> : null}
      <LoginForm next={next} notice={notice} />
    </>
  );
}
