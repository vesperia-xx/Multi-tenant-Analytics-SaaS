import "dotenv/config";

import { randomUUID } from "node:crypto";

import { Role } from "../src/generated/prisma/enums";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/demo";
import { hashPassword } from "../src/server/auth/password";
import { hashToken } from "../src/server/auth/tokens";
import { prisma } from "../src/server/db/client";

/**
 * Seed script.
 *
 *   npm run db:seed
 *     Provisions the two public demo tenants, their members, a pending
 *     invitation and a small audit ledger. Safe to run repeatedly.
 *
 *   npm run db:seed -- --org acme-inc
 *   npm run db:seed -- --email owner@example.com
 *     Replaces only the analytics rows of one existing workspace. Members,
 *     invitations and audit entries are left alone.
 *
 * Analytics always come from PostgreSQL; this script only provisions rows.
 */

type CatalogProduct = {
  sku: string;
  name: string;
  priceCents: number;
  costCents: number;
  category: number;
};

type Blueprint = {
  slug: string;
  name: string;
  currency: string;
  timezone: string;
  isDemo: boolean;
  seed: number;
  days: number;
  orders: readonly [number, number];
  weekendFactor: number;
  trendBoost: number;
  maxLines: number;
  customerCount: number;
  traffic: readonly [number, number];
  domain: string;
  categories: readonly string[];
  products: readonly CatalogProduct[];
};

type DemoPerson = { name: string; email: string; role: Role };

type DemoBlueprint = Blueprint & {
  demoRole: Role;
  people: readonly DemoPerson[];
  pendingInvite: { email: string; role: Role };
};

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

/** Catalogue used when seeding an arbitrary workspace with `--org`. */
const LEGACY_CATALOG: readonly CatalogProduct[] = [
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

const ACME: DemoBlueprint = {
  slug: "acme-inc",
  name: "Acme Inc",
  currency: "USD",
  timezone: "America/New_York",
  isDemo: true,
  seed: 20261118,
  days: 180,
  orders: [2, 6],
  weekendFactor: 0.55,
  trendBoost: 0.33,
  maxLines: 3,
  customerCount: 68,
  traffic: [160, 300],
  domain: "acme.example",
  categories: ["Audio", "Workspace", "Travel", "Lighting"],
  products: [
    { sku: "AUD-001", name: "Field Notes Headphones", priceCents: 22_900, costCents: 11_400, category: 0 },
    { sku: "AUD-002", name: "Ribbon Wireless Speaker", priceCents: 14_500, costCents: 6_900, category: 0 },
    { sku: "DES-010", name: "Drafting Desk Lamp", priceCents: 18_200, costCents: 8_400, category: 1 },
    { sku: "DES-011", name: "Oak Monitor Stand", priceCents: 9_600, costCents: 4_100, category: 1 },
    { sku: "DES-012", name: "Cork Desk Mat", priceCents: 6_800, costCents: 2_700, category: 1 },
    { sku: "TRV-100", name: "Weekender Roll-Top Pack", priceCents: 16_800, costCents: 7_600, category: 2 },
    { sku: "TRV-101", name: "Transit Tech Pouch", priceCents: 5_400, costCents: 2_100, category: 2 },
    { sku: "TRV-102", name: "Aluminium Passport Case", priceCents: 4_600, costCents: 1_700, category: 2 },
    { sku: "LGT-200", name: "Linen Task Light", priceCents: 11_900, costCents: 5_200, category: 3 },
    { sku: "LGT-201", name: "Sculptural Table Lamp", priceCents: 24_000, costCents: 11_000, category: 3 },
  ],
  demoRole: Role.OWNER,
  people: [{ name: "Maya Chen", email: "maya.chen@acme.example", role: Role.VIEWER }],
  pendingInvite: { email: "research@acme.example", role: Role.VIEWER },
};

const NORDWIND: DemoBlueprint = {
  slug: "nordwind-studio",
  name: "Nordwind Studio",
  currency: "EUR",
  timezone: "Europe/Oslo",
  isDemo: true,
  seed: 20260104,
  days: 180,
  orders: [1, 5],
  weekendFactor: 0.75,
  trendBoost: 0.22,
  maxLines: 2,
  customerCount: 54,
  traffic: [90, 190],
  domain: "nordwind.example",
  categories: ["Print", "Object", "Textile", "Paper"],
  products: [
    { sku: "PRT-001", name: "Fjord Study No. 4", priceCents: 8_900, costCents: 2_400, category: 0 },
    { sku: "PRT-002", name: "Arctic Light — Poster", priceCents: 5_200, costCents: 1_600, category: 0 },
    { sku: "PRT-003", name: "Nordlys Print, Large", priceCents: 14_500, costCents: 4_300, category: 0 },
    { sku: "OBJ-010", name: "Stoneware Vase, Tall", priceCents: 12_600, costCents: 5_100, category: 1 },
    { sku: "OBJ-011", name: "Cast Glass Tray", priceCents: 7_400, costCents: 3_000, category: 1 },
    { sku: "OBJ-012", name: "Brass Candle Holder", priceCents: 6_400, costCents: 2_600, category: 1 },
    { sku: "TXT-100", name: "Lambswool Throw", priceCents: 19_800, costCents: 8_900, category: 2 },
    { sku: "TXT-101", name: "Linen Cushion Cover", priceCents: 4_900, costCents: 1_800, category: 2 },
    { sku: "PAP-200", name: "Studio Notebook A5", priceCents: 2_800, costCents: 900, category: 3 },
    { sku: "PAP-201", name: "Risograph Card Set", priceCents: 3_600, costCents: 1_200, category: 3 },
  ],
  demoRole: Role.ADMIN,
  people: [
    { name: "Ingrid Solberg", email: "ingrid@nordwind.example", role: Role.OWNER },
    { name: "Theo Lange", email: "theo.lange@nordwind.example", role: Role.MANAGER },
  ],
  pendingInvite: { email: "press@nordwind.example", role: Role.MANAGER },
};

const DEMO_BLUEPRINTS: readonly DemoBlueprint[] = [ACME, NORDWIND];

function mulberry32(seed: number) {
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function handleOf(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".");
}

async function seedAnalytics(
  organization: { id: string; slug: string; name: string; currency: string },
  blueprint: Blueprint,
): Promise<{ products: number; customers: number; orders: number; lines: number; traffic: number }> {
  const organizationId = organization.id;
  const rng = mulberry32(blueprint.seed);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(rng() * items.length)]!;
  const between = (min: number, max: number): number => min + Math.floor(rng() * (max - min + 1));

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const DAYS = blueprint.days;

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { organizationId } }),
    prisma.order.deleteMany({ where: { organizationId } }),
    prisma.customer.deleteMany({ where: { organizationId } }),
    prisma.product.deleteMany({ where: { organizationId } }),
    prisma.category.deleteMany({ where: { organizationId } }),
    prisma.trafficDaily.deleteMany({ where: { organizationId } }),
  ]);

  const categories = await Promise.all(
    blueprint.categories.map((name) => prisma.category.create({ data: { organizationId, name } })),
  );

  const products = await Promise.all(
    blueprint.products.map((product) =>
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
    Array.from({ length: blueprint.customerCount }, (_, index) => {
      const first = FIRST_NAMES[index % FIRST_NAMES.length]!;
      const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]!;
      const name = `${first} ${last}`;

      return prisma.customer.create({
        data: {
          organizationId,
          name,
          email: `${handleOf(name)}@${blueprint.domain}`,
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
    const trend = 1 + (DAYS - dayOffset) / (DAYS / blueprint.trendBoost);
    const count = Math.max(
      1,
      Math.round(between(blueprint.orders[0], blueprint.orders[1]) * trend * (weekend ? blueprint.weekendFactor : 1) + rng()),
    );

    for (let index = 0; index < count; index += 1) {
      const customer = pick(customers);
      const lineCount = between(1, blueprint.maxLines);
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

      const discount = rng() < 0.25 ? Math.round(subtotal * 0.1) : 0;
      const tax = Math.round((subtotal - discount) * 0.08);
      const roll = rng();
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
    const visitors = Math.round(
      between(blueprint.traffic[0], blueprint.traffic[1]) * (weekend ? 0.7 : 1) * (1 + index / (DAYS * 2)),
    );

    return {
      organizationId,
      date,
      visitors,
      sessions: Math.round(visitors * (1.2 + rng() * 0.4)),
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

  return {
    products: products.length,
    customers: customers.length,
    orders: orders.length,
    lines: items.length,
    traffic: traffic.length,
  };
}

async function upsertDemoUser(
  person: { name: string; email: string },
  passwordHash: string,
): Promise<{ id: string; name: string; email: string }> {
  return prisma.user.upsert({
    where: { email: person.email },
    create: {
      name: person.name,
      email: person.email,
      passwordHash,
      isDemo: true,
      emailVerifiedAt: new Date(),
    },
    update: {
      name: person.name,
      passwordHash,
      isDemo: true,
      emailVerifiedAt: new Date(),
    },
    select: { id: true, name: true, email: true },
  });
}

async function seedDemoAudit(
  organizationId: string,
  blueprint: DemoBlueprint,
  actors: { demoId: string; people: Map<string, { id: string; name: string; email: string }> },
  organizationCreatedAt: Date,
  invitation: { email: string; role: Role },
): Promise<void> {
  const at = (days: number, hours = 0) =>
    new Date(organizationCreatedAt.getTime() + days * 86_400_000 + hours * 3_600_000);

  const ownerEmail =
    blueprint.people.find((person) => person.role === Role.OWNER)?.email ?? DEMO_EMAIL;
  const ownerId = actors.people.get(ownerEmail)?.id ?? actors.demoId;

  const memberEntries = [
    { userId: actors.demoId, email: DEMO_EMAIL, role: blueprint.demoRole },
    ...blueprint.people.map((person) => ({
      userId: actors.people.get(person.email)?.id ?? actors.demoId,
      email: person.email,
      role: person.role,
    })),
  ];

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId,
        actorId: ownerId,
        action: "organization.created",
        resourceType: "organization",
        resourceId: organizationId,
        after: {
          name: blueprint.name,
          slug: blueprint.slug,
          currency: blueprint.currency,
          timezone: blueprint.timezone,
        },
        ip: "192.0.2.10",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        createdAt: at(0),
      },
      ...memberEntries.map((member, index) => ({
        organizationId,
        actorId: member.userId,
        action: "member.joined",
        resourceType: "membership",
        resourceId: member.userId,
        after: { email: member.email, role: member.role },
        ip: "192.0.2.10",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        createdAt: at(0, index + 1),
      })),
      {
        organizationId,
        actorId: actors.demoId,
        action: "organization.updated",
        resourceType: "organization",
        resourceId: organizationId,
        before: {
          name: blueprint.name,
          currency: blueprint.currency,
          timezone: "UTC",
        },
        after: {
          name: blueprint.name,
          currency: blueprint.currency,
          timezone: blueprint.timezone,
        },
        ip: "192.0.2.10",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        createdAt: at(45),
      },
      {
        organizationId,
        actorId: actors.demoId,
        action: "invitation.created",
        resourceType: "invitation",
        resourceId: null,
        after: { email: invitation.email, role: invitation.role },
        ip: "192.0.2.10",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        createdAt: at(178),
      },
      {
        organizationId,
        actorId: actors.demoId,
        action: "report.exported",
        resourceType: "report",
        resourceId: null,
        after: { format: "pdf", resource: "analytics", filters: { range: "30d" } },
        ip: "192.0.2.10",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        createdAt: at(176),
      },
      {
        organizationId,
        actorId: actors.demoId,
        action: "report.exported",
        resourceType: "report",
        resourceId: null,
        after: { format: "csv", resource: "orders", rows: 248, filters: { status: "PAID" } },
        ip: "192.0.2.10",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        createdAt: at(170),
      },
    ],
  });
}

async function seedDemo(): Promise<void> {
  const now = new Date();
  const organizationCreatedAt = new Date(now.getTime() - 179 * 86_400_000);

  const demoHash = await hashPassword(DEMO_PASSWORD);
  // Extra members are part of the cast, not accounts visitors are meant to use.
  const memberHash = await hashPassword(randomUUID());

  const demoUser = await upsertDemoUser({ name: "Demo Owner", email: DEMO_EMAIL }, demoHash);

  for (const blueprint of DEMO_BLUEPRINTS) {
    const organization = await prisma.organization.upsert({
      where: { slug: blueprint.slug },
      create: {
        name: blueprint.name,
        slug: blueprint.slug,
        currency: blueprint.currency,
        timezone: blueprint.timezone,
        isDemo: true,
        createdAt: organizationCreatedAt,
      },
      update: {
        name: blueprint.name,
        currency: blueprint.currency,
        timezone: blueprint.timezone,
        isDemo: true,
        createdAt: organizationCreatedAt,
      },
      select: { id: true, name: true, slug: true, currency: true },
    });

    const people = new Map<string, { id: string; name: string; email: string }>();
    for (const person of blueprint.people) {
      const user = await upsertDemoUser(person, memberHash);
      people.set(person.email, user);
    }

    const keepEmails = [DEMO_EMAIL, ...blueprint.people.map((person) => person.email)];
    await prisma.membership.deleteMany({
      where: {
        organizationId: organization.id,
        user: { email: { notIn: keepEmails } },
      },
    });

    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: demoUser.id,
          organizationId: organization.id,
        },
      },
      create: {
        userId: demoUser.id,
        organizationId: organization.id,
        role: blueprint.demoRole,
      },
      update: { role: blueprint.demoRole },
    });

    for (const person of blueprint.people) {
      const user = people.get(person.email)!;
      await prisma.membership.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id,
          },
        },
        create: {
          userId: user.id,
          organizationId: organization.id,
          role: person.role,
        },
        update: { role: person.role },
      });
    }

    await seedAnalytics(organization, blueprint);

    await prisma.invitation.deleteMany({ where: { organizationId: organization.id } });
    await prisma.invitation.create({
      data: {
        organizationId: organization.id,
        email: blueprint.pendingInvite.email,
        role: blueprint.pendingInvite.role,
        tokenHash: hashToken(randomUUID()),
        invitedById: demoUser.id,
        expiresAt: new Date(now.getTime() + 5 * 86_400_000),
        createdAt: new Date(now.getTime() - 2 * 86_400_000),
      },
      select: { id: true },
    });

    await prisma.auditLog.deleteMany({ where: { organizationId: organization.id } });
    await seedDemoAudit(
      organization.id,
      blueprint,
      { demoId: demoUser.id, people },
      organizationCreatedAt,
      blueprint.pendingInvite,
    );

    console.log(
      `  members: ${[DEMO_EMAIL, ...blueprint.people.map((person) => person.email)].join(", ")}`,
    );
    console.log(`  pending invitation: ${blueprint.pendingInvite.email}`);
  }

  console.log("");
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Workspaces: ${DEMO_BLUEPRINTS.map((blueprint) => `/app/${blueprint.slug}`).join(" · ")}`);
}

async function seedExistingWorkspace(): Promise<boolean> {
  const slug = argument("--org");
  const email = argument("--email");

  const organization = slug
    ? await prisma.organization.findUnique({ where: { slug } })
    : email
      ? await prisma.organization.findFirst({
          where: { memberships: { some: { user: { email } } } },
          orderBy: { createdAt: "asc" },
        })
      : null;

  if (!organization) {
    console.error(
      slug || email
        ? "No workspace found for those arguments. Register an account first, or omit them to seed the demo tenants."
        : "No workspace found. Omit the arguments to seed the demo tenants.",
    );
    process.exitCode = 1;
    return false;
  }

  const blueprint: Blueprint =
    DEMO_BLUEPRINTS.find((candidate) => candidate.slug === organization.slug) ??
    ({
      ...ACME,
      slug: organization.slug,
      name: organization.name,
      currency: organization.currency,
      timezone: organization.timezone,
      isDemo: organization.isDemo,
      seed: 20261117,
      categories: ["Outerwear", "Footwear", "Accessories", "Home"],
      products: LEGACY_CATALOG,
      domain: "example.com",
      orders: [2, 6],
      weekendFactor: 0.55,
      trendBoost: 0.33,
      maxLines: 3,
      customerCount: 60,
      traffic: [120, 260],
    } satisfies Blueprint);

  await seedAnalytics(organization, blueprint);
  return true;
}

async function main() {
  const hasTarget = Boolean(argument("--org") || argument("--email"));

  if (hasTarget) {
    await seedExistingWorkspace();
    return;
  }

  await seedDemo();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
