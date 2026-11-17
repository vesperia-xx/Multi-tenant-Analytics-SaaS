import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { marketingNav } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="rounded-[2px]" aria-label="Vortex Metrics home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {marketingNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden sm:block">
            <a href="#demo" className={buttonVariants({ size: "sm" })}>
              Open the demo
            </a>
          </span>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
