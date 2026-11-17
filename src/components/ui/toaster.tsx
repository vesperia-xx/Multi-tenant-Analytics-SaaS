"use client";

import { useTheme } from "next-themes";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme === "light" ? "light" : "dark"}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: "3px",
          fontFamily: "var(--font-instrument-sans), ui-sans-serif, system-ui, sans-serif",
          transition: "all 150ms ease-in-out",
        },
      }}
      className="font-sans"
    />
  );
}
