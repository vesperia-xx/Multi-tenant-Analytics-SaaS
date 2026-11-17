import { z } from "zod";

const booleanFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const serverSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL must be a PostgreSQL connection string",
    ),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  DEMO_MODE: booleanFromEnv,
  DEMO_READ_ONLY: booleanFromEnv,
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

/**
 * Lazily validates server environment variables.
 *
 * Kept lazy so static pages can be prerendered without requiring database
 * credentials at build time. Server-side data code calls this at request time.
 */
export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverSchema.safeParse(process.env);

    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid server environment: ${details}`);
    }

    cached = parsed.data;
  }

  return cached;
}
