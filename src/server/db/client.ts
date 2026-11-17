import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and start the database with `docker compose up -d db`.",
  );
}

/**
 * Neon is served through its serverless driver (HTTP/WebSocket, pooler-friendly).
 * Everything else — local Docker, CI Postgres — uses the standard `pg` pool.
 */
const isNeon =
  process.env.DATABASE_DRIVER === "neon" ||
  new URL(connectionString).hostname.includes(".neon.tech");

const adapter = isNeon
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });

const globalForPrisma = globalThis as unknown as {
  __vortexPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.__vortexPrisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__vortexPrisma = prisma;
}
