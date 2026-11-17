import type { ReactNode } from "react";

/** Page heading shared by the four auth screens. */
export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="mb-8">
      <p className="flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="inline-block size-1.5 bg-primary" />
        {eyebrow}
      </p>
      <h1 className="mt-4 font-serif text-[2.1rem] leading-[1.05] tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div className="h-2 w-20 animate-pulse rounded-[1px] bg-muted" />
          <div className="h-11 animate-pulse rounded-[3px] bg-muted/70" />
        </div>
      ))}
      <div className="h-10 animate-pulse rounded-[3px] bg-muted" />
    </div>
  );
}
