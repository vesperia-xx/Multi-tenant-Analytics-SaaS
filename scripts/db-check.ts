import "dotenv/config";

import { prisma } from "../src/server/db/client";

async function main() {
  const [version] = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;

  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name::text AS table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  const trigramIndexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname::text AS indexname
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname LIKE '%trgm%'
    ORDER BY indexname
  `;

  const rlsTables = await prisma.$queryRaw<
    Array<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }>
  >`
    SELECT relname::text AS relname, relrowsecurity, relforcerowsecurity
    FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
      AND relkind = 'r'
      AND relrowsecurity
    ORDER BY relname
  `;

  const policies = await prisma.$queryRaw<Array<{ tablename: string; policyname: string }>>`
    SELECT tablename::text AS tablename, policyname::text AS policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;

  console.log(`Connected to: ${version?.version.split(",")[0] ?? "unknown"}`);
  console.log(`Tables (${tables.length}): ${tables.map((row) => row.table_name).join(", ")}`);
  console.log(`Trigram indexes (${trigramIndexes.length}): ${trigramIndexes.map((row) => row.indexname).join(", ")}`);
  console.log(
    `RLS (${rlsTables.length}, forced: ${rlsTables.filter((row) => row.relforcerowsecurity).length}): ${rlsTables
      .map((row) => row.relname)
      .join(", ")}`,
  );
  console.log(`Policies (${policies.length}): ${policies.map((row) => `${row.tablename}.${row.policyname}`).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
