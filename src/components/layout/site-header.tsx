import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { marketingNav } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-border/60">
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#" className="rounded-md" aria-label="Vortex Metrics home">
          <Logo />
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {marketingNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <a
            href="#platform"
            className="hidden h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 sm:inline-flex"
          >
            Explore the platform
          </a>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
