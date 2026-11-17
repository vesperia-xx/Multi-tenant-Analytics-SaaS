"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { marketingNav } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-[3px] text-foreground transition-colors hover:bg-accent focus-visible:outline-none"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open ? (
        <div
          id="mobile-navigation"
          className="absolute inset-x-0 top-full border-b border-border bg-background px-5 pb-6 pt-1 shadow-none sm:px-8"
        >
          <nav className="flex flex-col" aria-label="Mobile">
            {marketingNav.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-3 border-b border-border py-3.5 text-sm font-medium"
              >
                <span className="font-mono text-[0.5625rem] tracking-[0.12em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={buttonVariants({ variant: "outline", className: "mt-5" })}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className={buttonVariants({ className: "mt-2" })}
            >
              Create a workspace
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
