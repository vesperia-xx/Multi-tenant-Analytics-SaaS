import "dotenv/config";

import { randomUUID } from "node:crypto";

import { prisma } from "../src/server/db/client";

/**
 * Local development seed for one workspace.
 *
 *   npm run db:seed -- --org acme-inc
 *   npm run db:seed -- --email owner@example.com
 *
 * The dashboard always queries PostgreSQL; this script only provisions rows.
 * Phase 8 will add the dedicated Acme/Nordwind demo tenants and read-only mode.
 */

const CATEGORIES = ["Outerwear", "Footwear", "Accessories", "Home"] as const;

const PRODUCTS: Array<{ sku: string; name: string; priceCents: number; costCents: number; category: number }> = [
  { sku: "JKT-001", name: "Harbour Field Jacket", priceCents: 18_900, costCents: 9_400, category: 0 },
  { sku: "JKT-002", name: "Nordwind Parka", priceCents: 24_500, costCents: 12_800, category: 0 },
  { sku: "SHO-010", name: "Meridian Trail Sneaker", priceCents: 12_400, costCents: 6_100, category: 1 },
  { sku: "SHO-011", name: "Atlas Leather Boot", priceCents: 21_000, costCents: 10_700, category: 1 },
  { sku: "ACC-100", name: "Ink Canvas Tote", priceCents: 4_800, costCents: 1_900, category: 2 },
  { sku: "ACC-101", name: "Brass Card Holder", priceCents: 3_200, costCents: 1_100, category: 2 },
  { sku: "ACC-102", name: "Ribbed Wool Scarf", priceCents: 5_600, costCents: 2_200, category: 2 },
  { sku: "HOM-200", name: "Stoneware Pour-Over Set", priceCents: 7_900, costCents: 3_300, category: 3 },
  { sku: "HOM-201", name: "Linen Table Runner", priceCents: 4_200, costCents: 1_600, category: 3 },
  { sku: "HOM-202", name: "Cast Iron Skillet", priceCents: 8_800, costCents: 4_100, category: 3 },
];

const FIRST_NAMES = [
  "Ada", "Bruno", "Camille", "Daniel", "Elena", "Farah", "Gabriel", "Hana", "Iván", "Julia",
  "Kenji", "Lucía", "Mateo", "Nadia", "Oliver", "Priya", "Quentin", "Rosa", "Samir", "Teresa",
];

const LAST_NAMES = [
  "Lovelace", "Marchetti", "Duarte", "Okafor", "Petrova", "Haddad", "Ríos", "Sato", "Serrano",
  "Novak", "Watanabe", "Ferrer", "Silva", "Rahman", "Grant", "Nair", "Moreau", "Delgado", "Khan",
  "Lima",
];

const COUNTRIES = ["ES", "US", "DE", "FR", "GB", "PT", "MX", "AR", "IT", "NL"];

function mulberry32(seed: number) {
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const random = mulberry32(20261117);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

function between(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const slug = argument("--org");
  const email = argument("--email");

  const organization = slug
    ? await prisma.organization.findUnique({ where: { slug } })
    : email
      ? await prisma.organization.findFirst({
          where: { memberships: { some: { user: { email } } } },
          orderBy: { createdAt: "asc" },
        })
      : await prisma.organization.findFirst({ where: { isDemo: false }, orderBy: { createdAt: "asc" } });

  if (!organization) {
    console.error("No workspace found. Register an account first, or pass --org <slug>.");
    process.exitCode = 1;
    return;
  }

  const organizationId = organization.id;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const DAYS = 180;

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { organizationId } }),
    prisma.order.deleteMany({ where: { organizationId } }),
    prisma.customer.deleteMany({ where: { organizationId } }),
    prisma.product.deleteMany({ where: { organizationId } }),
    prisma.category.deleteMany({ where: { organizationId } }),
    prisma.trafficDaily.deleteMany({ where: { organizationId } }),
  ]);

  const categories = await Promise.all(
    CATEGORIES.map((name) => prisma.category.create({ data: { organizationId, name } })),
  );

  const products = await Promise.all(
    PRODUCTS.map((product) =>
      prisma.product.create({
        data: {
          organizationId,
          categoryId: categories[product.category]!.id,
          sku: product.sku,
          name: product.name,
          priceCents: product.priceCents,
          costCents: product.costCents,
        },
      }),
    ),
  );

  const customers = await Promise.all(
    Array.from({ length: 60 }, (_, index) => {
      const first = FIRST_NAMES[index % FIRST_NAMES.length]!;
      const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]!;
      const name = `${first} ${last}`;
      const handle = name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".");

      return prisma.customer.create({
        data: {
          organizationId,
          name,
          email: `${handle}@example.com`,
          country: pick(COUNTRIES),
          createdAt: new Date(today.getTime() - between(0, DAYS) * 86_400_000),
        },
      });
    }),
  );

  const orders: Array<{
    id: string;
    organizationId: string;
    customerId: string;
    number: string;
    status: "PENDING" | "PAID" | "REFUNDED" | "CANCELLED";
    subtotalCents: number;
    discountCents: number;
    taxCents: number;
    totalCents: number;
    placedAt: Date;
  }> = [];

  const items: Array<{
    id: string;
    organizationId: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }> = [];

  let orderNumber = 10_000;

  for (let dayOffset = DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(today.getTime() - dayOffset * 86_400_000);
    const weekday = date.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    // Gentle upward trend plus a quieter weekend.
    const trend = 1 + (DAYS - dayOffset) / (DAYS * 3);
    const count = Math.max(
      1,
      Math.round(between(2, 6) * trend * (weekend ? 0.55 : 1) + random()),
    );

    for (let index = 0; index < count; index += 1) {
      const customer = pick(customers);
      const lineCount = between(1, 3);
      const chosen = new Set<string>();

      let subtotal = 0;
      const orderId = randomUUID();

      for (let line = 0; line < lineCount; line += 1) {
        const product = pick(products);
        if (chosen.has(product.id)) continue;
        chosen.add(product.id);

        const quantity = between(1, 3);
        const lineTotal = product.priceCents * quantity;
        subtotal += lineTotal;

        items.push({
          id: randomUUID(),
          organizationId,
          orderId,
          productId: product.id,
          quantity,
          unitPriceCents: product.priceCents,
          lineTotalCents: lineTotal,
        });
      }

      const discount = random() < 0.25 ? Math.round(subtotal * 0.1) : 0;
      const tax = Math.round((subtotal - discount) * 0.08);
      const roll = random();
      const status =
        roll < 0.7 ? "PAID" : roll < 0.82 ? "PENDING" : roll < 0.9 ? "REFUNDED" : "CANCELLED";

      const placedAt = new Date(date);
      placedAt.setUTCHours(between(8, 21), between(0, 59), between(0, 59), 0);

      orders.push({
        id: orderId,
        organizationId,
        customerId: customer.id,
        number: `ORD-${orderNumber++}`,
        status,
        subtotalCents: subtotal,
        discountCents: discount,
        taxCents: tax,
        totalCents: subtotal - discount + tax,
        placedAt,
      });
    }
  }

  await prisma.order.createMany({ data: orders });
  await prisma.orderItem.createMany({ data: items });

  const traffic = Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(today.getTime() - (DAYS - 1 - index) * 86_400_000);
    const weekday = date.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const visitors = Math.round(between(120, 260) * (weekend ? 0.7 : 1) * (1 + index / (DAYS * 2)));
    return {
      organizationId,
      date,
      visitors,
      sessions: Math.round(visitors * (1.2 + random() * 0.4)),
    };
  });

  await prisma.trafficDaily.createMany({ data: traffic });

  const revenue = orders
    .filter((order) => order.status === "PAID")
    .reduce((sum, order) => sum + order.totalCents, 0);

  console.log(`Seeded workspace ${organization.name} (${organization.slug})`);
  console.log(
    `  ${products.length} products · ${customers.length} customers · ${orders.length} orders · ${items.length} lines · ${traffic.length} traffic days`,
  );
  console.log(`  paid revenue: ${(revenue / 100).toFixed(2)} ${organization.currency}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
