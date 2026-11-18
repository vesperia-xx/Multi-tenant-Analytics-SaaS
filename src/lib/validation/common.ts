import { z } from "zod";

/** Shared by the auth and organization forms. */
export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(160, "Email is too long.")
  .pipe(z.email({ error: "Enter a valid email address." }));

/** Calendar days in the shared `YYYY-MM-DD` format. */
export const dayField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

/** Search box: short by design, so a pasted dump cannot blow up the query. */
export const searchField = z.string().trim().max(80, "Keep it under 80 characters.").optional().catch(undefined);

/** Clamps 1..100 000; anything weird comes back as page 1. */
export const pageField = z.coerce
  .number()
  .int()
  .transform((value) =>
    Number.isFinite(value) ? Math.min(100_000, Math.max(1, Math.trunc(value))) : 1,
  )
  .catch(1);

/** Clamps 5..50; anything weird comes back as 10 per page. */
export const pageSizeField = z.coerce
  .number()
  .int()
  .transform((value) =>
    Number.isFinite(value) ? Math.min(50, Math.max(5, Math.trunc(value))) : 10,
  )
  .catch(10);

export const directionField = z.enum(["asc", "desc"]).catch("desc");

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
