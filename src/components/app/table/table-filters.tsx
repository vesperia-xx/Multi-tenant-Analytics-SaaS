"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function SearchBox({
  initialValue,
  placeholder,
  onSearch,
  className,
}: {
  initialValue: string;
  placeholder: string;
  onSearch: (value: string) => void;
  className?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [lastInitialValue, setLastInitialValue] = useState(initialValue);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive from URL-synced props during render, not in an effect.
  if (lastInitialValue !== initialValue) {
    setLastInitialValue(initialValue);
    setValue(initialValue);
  }

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  function handleChange(next: string) {
    setValue(next);
    if (timeout.current) clearTimeout(timeout.current);

    timeout.current = setTimeout(() => onSearch(next), 250);
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-[3px] border border-input bg-card pl-9 pr-9 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 hover:border-foreground/35 focus:border-foreground"
      />
      {value ? (
        <button
          type="button"
          onClick={() => handleChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[2px] p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string | undefined) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex items-center gap-2", className)}>
      <span className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="h-11 rounded-[3px] border border-input bg-card px-3 text-sm text-foreground transition-colors hover:border-foreground/35 focus:border-foreground"
      >
        {children}
      </select>
    </label>
  );
}
