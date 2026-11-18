import { ArrowRight, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_WORKSPACES } from "@/lib/demo";
import { demoLoginAction } from "@/server/auth/actions";

/**
 * The demo card is server-rendered: the button posts a Server Action, so it
 * works before hydration and the credentials are never trusted by the client.
 */
export function DemoAccess({ readOnly }: { readOnly: boolean }) {
  return (
    <section className="mb-8 border border-border bg-card p-5">
      <p className="flex items-center gap-2 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
        <KeyRound className="size-3 text-primary" aria-hidden="true" />
        Demo access
      </p>

      <h2 className="mt-2 font-serif text-xl leading-tight tracking-tight">
        Two seeded workspaces, {readOnly ? "locked to read-only" : "ready to explore"}.
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {DEMO_WORKSPACES.map((workspace) => `${workspace.name} (${workspace.role})`).join(" · ")}.
        Real SQL over six months of orders, customers, products and traffic.
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3">
        <div className="min-w-0">
          <dt className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
            Email
          </dt>
          <dd className="mt-1 break-all font-mono text-[0.6875rem]">{DEMO_EMAIL}</dd>
        </div>
        <div className="min-w-0">
          <dt className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
            Password
          </dt>
          <dd className="mt-1 break-all font-mono text-[0.6875rem]">{DEMO_PASSWORD}</dd>
        </div>
      </dl>

      <form action={demoLoginAction} className="mt-4">
        <Button type="submit" variant="secondary" className="w-full">
          Open the demo
          <ArrowRight className="size-3.5" />
        </Button>
      </form>
    </section>
  );
}
