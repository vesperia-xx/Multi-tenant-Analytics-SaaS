import type { ReactNode } from "react";

import { AuthAside } from "@/components/auth/auth-aside";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="flex min-h-svh flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Vortex Metrics home" className="rounded-[2px]">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-start justify-center py-8 lg:items-center lg:py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="flex items-center justify-between gap-4 border-t border-border pt-4 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
          <p>© 2026 Vortex Metrics</p>
          <Link href="/" className="link-underline">
            Back to site
          </Link>
        </footer>
      </div>

      <AuthAside />
    </div>
  );
}
