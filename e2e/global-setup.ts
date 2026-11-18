import "dotenv/config";

import { prisma } from "../src/server/db/client";

/**
 * E2E tests need the seeded demo tenants and a clean rate-limit window.
 * Failing here is clearer than watching every login test time out.
 */
export default async function globalSetup() {
  const demo = await prisma.organization.findUnique({
    where: { slug: "acme-inc" },
    select: { id: true },
  });

  if (!demo) {
    throw new Error("Missing demo data. Run `npm run db:seed` before `npm run test:e2e`.");
  }

  await prisma.rateLimitCounter.deleteMany();
  await prisma.$disconnect();
}
