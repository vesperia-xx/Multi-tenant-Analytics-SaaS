import { Check } from "lucide-react";

/**
 * Right-hand panel of the auth screens. It repeats the printed-report language
 * of the marketing page: numbered notes, hairlines and a specimen ledger.
 */
export function AuthAside() {
  const notes = [
    {
      title: "Scoped by membership",
      body: "The workspace comes from the URL and is resolved against your memberships. A tenant you do not belong to returns 404.",
    },
    {
      title: "Permission checked on the server",
      body: "Owner, Admin, Manager and Viewer share one matrix. The UI hides what you cannot do; the server refuses it anyway.",
    },
    {
      title: "Every change leaves a trace",
      body: "Actor, action, resource and a before/after diff — stored in an append-only ledger per workspace.",
    },
  ];

  return (
    <aside className="hidden flex-col justify-between border-l border-border bg-foreground p-10 text-background transition-all duration-300 ease-in-out lg:flex xl:p-14 hover:bg-foreground/95 hover:border-foreground/40">
      <div>
        <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.22em] text-background/55">
          <span className="inline-block size-1.5 bg-background/70" />
          Access / Field notes
        </p>

        <h2 className="mt-7 max-w-sm font-serif text-[2.35rem] leading-[1.05] tracking-tight">
          One account. Every workspace you{" "}
          <em className="italic text-background/70">belong to.</em>
        </h2>

        <ol className="mt-10 border-t border-background/15">
          {notes.map((note, index) => (
            <li key={note.title} className="border-b border-background/15 py-5">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[0.5625rem] tracking-[0.12em] text-background/45">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-medium">{note.title}</h3>
              </div>
              <p className="mt-2 pl-7 text-[0.8125rem] leading-relaxed text-background/60">
                {note.body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 border border-background/20">
        <div className="flex items-center justify-between border-b border-background/20 px-4 py-2.5">
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-background/50">
            Session specimen
          </span>
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-background/40">
            30 days
          </span>
        </div>
        <dl className="divide-y divide-background/10 font-mono text-[0.6875rem]">
          {[
            ["cookie", "httpOnly · sameSite=lax"],
            ["storage", "sha-256(token) only"],
            ["revocation", "per session, instant"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt className="text-background/45">{label}</dt>
              <dd className="flex items-center gap-1.5 text-background/80">
                <Check className="size-3 text-background/50" aria-hidden="true" />
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
