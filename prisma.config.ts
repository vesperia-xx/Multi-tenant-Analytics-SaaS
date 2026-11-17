import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * The Prisma CLI always talks to the direct (non-pooled) database.
 * On Neon, `DIRECT_URL` is the host without the `-pooler` suffix so
 * migrations can use session-level features. Locally both URLs are equal.
 */
const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!directUrl) {
  throw new Error(
    "DIRECT_URL (or DATABASE_URL) must be set before running Prisma CLI commands. See .env.example.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
  },
});
