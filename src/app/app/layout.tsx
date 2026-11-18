import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/auth/actions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-50 border-b border-border bg-background">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <Link href="/app" aria-label="Vortex Metrics account" className="rounded-[2px]">
              <Logo />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/app"
                className="link-underline hidden font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Account
              </Link>
              <ThemeToggle />
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </QueryProvider>
  );
}
