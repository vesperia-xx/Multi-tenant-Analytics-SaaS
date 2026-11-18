export function RestrictedPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="border-l-2 border-primary bg-primary/5 px-5 py-4">
      <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-muted-foreground">
        Restricted
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed">
        <span className="font-medium">{title}.</span> {message}
      </p>
    </div>
  );
}
