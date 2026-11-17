import { Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";

import { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/permissions";
import { switchWorkspaceAction } from "@/server/org/actions";

type WorkspaceOption = {
  name: string;
  slug: string;
  role: Role;
};

/**
 * Progressive-enhancement switcher: a `<details>` popover containing one form.
 * Each workspace is a submit button, so it works before hydration and the
 * server (not the client) decides whether the membership is real.
 */
export function WorkspaceSwitcher({
  workspaces,
  active,
}: {
  workspaces: WorkspaceOption[];
  active: WorkspaceOption;
}) {
  return (
    <details className="group relative" data-slot="workspace-switcher">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[3px] border border-border bg-card px-3 py-2 text-left transition-colors hover:border-foreground/35 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-[2px] bg-foreground font-serif text-[0.8125rem] leading-none text-background"
        >
          {active.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.8125rem] font-medium leading-tight">
            {active.name}
          </span>
          <span className="block font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
            {ROLE_LABELS[active.role]}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-72 border border-border bg-popover shadow-lg">
        <p className="border-b border-border px-3 py-2 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
          Switch workspace
        </p>

        <form action={switchWorkspaceAction}>
          <ul className="max-h-72 overflow-y-auto">
            {workspaces.map((workspace) => {
              const isActive = workspace.slug === active.slug;

              return (
                <li key={workspace.slug} className="border-b border-border/60 last:border-b-0">
                  <button
                    type="submit"
                    name="slug"
                    value={workspace.slug}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.8125rem] font-medium">
                        {workspace.name}
                      </span>
                      <span className="block font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">
                        {ROLE_LABELS[workspace.role]}
                      </span>
                    </span>
                    {isActive ? <Check className="size-3.5 text-primary" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </form>

        <Link
          href="/app"
          className="block border-t border-border px-3 py-2.5 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Account & all workspaces
        </Link>
      </div>
    </details>
  );
}
