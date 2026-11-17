"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { marketingNav } from "@/lib/site";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open ? (
        <div
          id="mobile-navigation"
          className="absolute inset-x-0 top-full border-b border-border bg-background/95 p-5 shadow-xl backdrop-blur-xl"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {marketingNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#platform"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              Explore the platform
            </a>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
