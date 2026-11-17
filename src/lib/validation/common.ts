import { z } from "zod";

/** Shared by the auth and organization forms. */
export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(160, "Email is too long.")
  .pipe(z.email({ error: "Enter a valid email address." }));

/**
 * Collapses a Zod error into one message per field, which is what the forms
 * render. Zod's own flattening nests objects, so a flat map is simpler here.
 */
export function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const [first] = issue.path;
    if (typeof first === "string" && !fieldErrors[first]) {
      fieldErrors[first] = issue.message;
    }
  }

  return fieldErrors;
}
