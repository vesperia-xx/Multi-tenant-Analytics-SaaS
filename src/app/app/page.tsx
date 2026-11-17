import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountOverview } from "@/components/app/account-overview";
import { AccountSkeleton } from "@/components/app/account-skeleton";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Vortex Metrics workspaces and active sessions.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
      <Suspense fallback={<AccountSkeleton />}>
        <AccountOverview />
      </Suspense>
    </div>
  );
}
