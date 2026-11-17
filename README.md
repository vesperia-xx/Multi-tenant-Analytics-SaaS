# Vortex Metrics

**Multi-tenant analytics SaaS with tenant isolation enforced twice: in the application layer and in PostgreSQL.**

Vortex Metrics gives every organization its own workspace, its own data and its own permissions. Dashboards, tables and exports are powered by real SQL aggregates over a seeded PostgreSQL dataset — no mocks at runtime, no client-side math.

> **Status:** Phase 3 of 10 — organizations, memberships, invitations, org switcher and RBAC guards.
> See the [roadmap](#roadmap) for what ships next.

---

## Why this project exists

Most portfolio dashboards stop at charts. The interesting problem in a B2B analytics product is everything behind them:

- How does a request become a **tenant-scoped query** without the client ever choosing the tenant?
- How do **four roles** share one permission matrix that the server enforces and the UI reflects?
- How do you prove **who changed what** months later, with a field-level diff?
- How do you keep **search, sorting and pagination** fast on a real dataset?
- How do you make a single forgotten `WHERE` clause fail **closed** instead of leaking data?

Vortex Metrics is built around those questions.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4, custom design tokens, dark/light themes |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 (driver adapters: `pg` locally, Neon serverless in production) |
| Data fetching | React Server Components + TanStack Query for interactive tables |
| Charts | Recharts |
| Validation | Zod |
| Auth | Custom opaque, database-backed sessions (no third-party auth) |
| Reports | Streaming CSV + PDF generated in a Node runtime |
| Tests | Vitest + Testing Library, Playwright (E2E) |
| Infra | Docker Compose locally, Vercel + Neon in production |

## Architecture at a glance

```
Browser
  │  /app/[orgSlug]/...        orgSlug is the only tenant identifier the client sends
  ▼
Next.js server
  ├─ Session guard (hashed token → user, 30-day expiry)
  ├─ Membership guard (orgSlug + session → role, 404 if not a member)
  ├─ Permission matrix (Owner / Admin / Manager / Viewer)
  ├─ Zod validation + Postgres-backed rate limits
  ├─ Repositories (orgId is a required first argument)
  └─ Analytics SQL (parameterized, windowed, period-over-period)
  ▼
PostgreSQL 16
  ├─ Composite indexes that always start with organization_id
  ├─ pg_trgm + GIN indexes for case-insensitive table search
  └─ Row-Level Security with FORCE (Phase 9)
```

Tenant scoping is **structural**, not conventional:

1. The tenant comes from the URL (`/app/acme/dashboard`) and is resolved to a `Membership` row.
2. The client never submits an `orgId`.
3. Cross-tenant lookups return **404**, never 403, so the API cannot confirm that a record exists elsewhere.
4. Row-Level Security adds a final, database-level check that fails closed.

See [`docs/architecture.md`](docs/architecture.md) for the ERD, RBAC matrix and indexing decisions (in Spanish).

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Setup, architecture, database schema, design system, marketing shell | ✅ |
| 2 | Authentication: register, login, logout, password reset, sessions | ✅ |
| 3 | Organizations, memberships, invitations, org switcher, RBAC guards | ✅ |
| 4 | Dashboard KPIs and analytics charts from real SQL | ⏳ |
| 5 | Orders, customers and products tables (search, filters, sorting, pagination) | ⏳ |
| 6 | CSV and PDF reports | ⏳ |
| 7 | Audit log with before/after diffs | ⏳ |
| 8 | Seeded demo tenants + read-only demo mode | ⏳ |
| 9 | Performance work, PostgreSQL RLS with FORCE, security hardening | ⏳ |
| 10 | Tests, CI/CD, Vercel + Neon deployment, docs | ⏳ |

## Local development

### Requirements

- Node.js 20.19+ (developed on Node 24)
- Docker Desktop (for PostgreSQL)
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d db
```

The database listens on **port 5434** (project 01 already uses 5432). An optional Adminer UI is available with:

```bash
docker compose --profile tools up -d adminer   # http://localhost:8081
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

`.env.example` documents every variable. The defaults already point to the Docker database.

### 4. Apply migrations and generate the client

```bash
npm run db:migrate     # prisma migrate dev
npm run db:generate    # prisma generate (also runs on build)
```

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Seed data arrives in Phase 8 with the demo tenants. Until then, creating an account also
> creates a workspace you own, which is enough to exercise the auth flows.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (flat config, Next.js rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (unit + component) |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply pending migrations (CI / production) |
| `npm run db:reset` | Drop, re-migrate, regenerate and reseed |
| `npm run db:seed` | Run the seed script |
| `npm run db:studio` | Prisma Studio |
| `npm run db:check` | Verify connectivity, tables and trigram indexes |

## Project structure

```
prisma/
  schema.prisma           14-model data model (source of truth)
  migrations/             SQL migrations, including pg_trgm indexes
scripts/
  db-check.ts             Connectivity + index smoke test
src/
  app/
    (auth)/               login, register, forgot-password, reset-password, invite/[token]
    app/                  account area: all workspaces and active sessions
    app/[orgSlug]/        tenant-scoped shell, overview and settings
    page.tsx              Marketing landing page
    layout.tsx            Root layout, theme provider, toasts
    globals.css           Design tokens (oklch) + utilities
  components/
    app/                  Account overview, workspace shell, members and invitations
    auth/                 Auth shell, forms, feedback, invitation acceptance
    brand/                Logo
    layout/               Marketing header, mobile nav, footer
    marketing/            Printed report specimen
    theme/                Theme provider and toggle
    ui/                   Button, Card, Badge, Input, Field, Toaster
  lib/                    Utilities, env validation, Zod schemas, permission matrix
  server/
    auth/                 Password hashing, sessions, rate limits, Server Actions
    db/client.ts          Prisma client with pg / Neon adapters
    email/                Resend delivery (optional)
    org/                  Tenant context, invitations, roles and Server Actions
  proxy.ts                Optimistic cookie check for /app/*
  generated/prisma/       Generated Prisma client (gitignored)
```

## Authentication and sessions

Custom, opaque, database-backed sessions — no Auth.js and no JWT. A JWT cannot be revoked
server-side, and revocation is the point.

| Concern | Implementation |
| --- | --- |
| Cookie | `vortex_session`, `httpOnly`, `sameSite=lax`, `secure` in production, 30-day absolute expiry |
| Token | 32 random bytes (base64url) held only by the browser; the database stores its SHA-256 digest |
| Lookup | One indexed query on `sessions.token_hash`; `last_used_at` is refreshed at most once an hour |
| Revocation | Per session (`revoked_at`), plus "sign out other devices"; a password reset revokes every session |
| Passwords | `scrypt` (N=16384, r=8, p=1, 64-byte key) with a per-password salt and `timingSafeEqual` |
| Enumeration | Unknown emails and wrong passwords answer identically and cost the same work (a dummy hash is verified) |
| Rate limits | Postgres fixed windows shared across serverless instances |
| Reset links | 32 random bytes, hashed at rest, single use, 60-minute expiry; a new link invalidates the previous one |
| Routing guard | `src/proxy.ts` only checks that the cookie exists; the real check is `requireViewer` in the data access layer |

Registration is open: creating an account creates the user, a workspace and an `OWNER`
membership in one transaction, with two audit entries (`organization.created`, `member.joined`).
The workspace slug is derived from the name and reserved words (`app`, `login`, `api`, …) are skipped.

### Password reset without an email provider

`RESEND_API_KEY` and `EMAIL_FROM` are optional. Without them:

- the reset link is printed to the server log in development;
- in demo mode it is also returned to the UI **for seeded demo accounts only** (`users.is_demo`),
  never for a visitor's own account;
- the response to "forgot password" is always the same, so it never confirms whether an email exists.

## Multi-tenancy and roles

| Role | Scope |
| --- | --- |
| **Owner** | Everything, including organization deletion and ownership transfer |
| **Admin** | Members, invitations, settings, audit log, reports and all data writes (cannot modify the Owner) |
| **Manager** | Analytics, orders and customers; products are read-only |
| **Viewer** | Read-only, including exports |

Memberships are per organization, so one user can be an Owner in one workspace and a Viewer in another — which is exactly what the demo account does.

### Resolving the tenant

`/app/[orgSlug]` is the only place a tenant is named. The layout calls `requireOrgContext(slug)`, which
reads the session, then looks for a `Membership` joining the viewer to the organization with that slug.
No row means `notFound()`: a workspace you do not belong to is indistinguishable from one that does
not exist.

The resolved context (`{ viewer, organization, membership.role }`) is memoised per request with React
`cache`, so the layout, the page and any action share one query. The client never posts an `orgId`.
The switcher posts a **slug**, and the server re-checks the membership before remembering it on the
session as a convenience hint for "continue where you left off".

### Roles are one matrix, used twice

`src/lib/permissions.ts` holds the permission list, the role matrix and the hierarchy rules. Server
Actions call `can(role, permission)` and `canManageMember(actor, target)`; the UI uses the same
functions to decide which controls to render. The rules that matter:

- Owners are never modifiable, including by themselves, so the last Owner cannot be demoted.
- An Admin can invite and manage Managers and Viewers, but never another Admin or an Owner.
- Nobody can change their own role or remove themselves.
- Every accepted invitation, role change, removal and settings edit lands in `audit_logs` with a
  before/after snapshot.

### Invitations

An invitation is a one-time token, hashed at rest (`invitations.token_hash`), tied to one email
address and expiring after seven days. Re-inviting the same address revokes the previous link.
Acceptance requires the signed-in account to match the invited address, so a forwarded link cannot be
redeemed by someone else.

`RESEND_API_KEY` remains optional. Without it, the invite link is printed to the server log and — in
development or demo mode — shown in the workspace settings to the **inviter**, who already holds
`member:invite`. It is never shown to the invitee through this screen, unlike reset links, which are
only surfaced for seeded demo accounts.

## Deployment

The target platform is **Vercel + Neon Postgres**:

- `DATABASE_URL` → pooled Neon connection (used by the serverless driver)
- `DIRECT_URL` → direct connection (used by Prisma migrations)
- `NEXT_PUBLIC_APP_URL` → public base URL
- Optional: `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `DEMO_MODE`, `DEMO_READ_ONLY`

Step-by-step instructions will be added in Phase 10 (`docs/deploy.md`).

## Notes on the Next.js version

This project runs **Next.js 16.4.6** with `cacheComponents` and `partialPrefetching` enabled. Runtime APIs (`cookies`, `headers`, `searchParams`) must sit behind Suspense boundaries, and static pages must avoid non-deterministic values at render time. The docs bundled in `node_modules/next/dist/docs/` are the reference for this version.

`/app/[orgSlug]` opts out of instant navigation (`export const instant = false`) on purpose: the
membership check must finish before the response streams so a cross-tenant URL returns a real 404
instead of a 200 with a not-found screen inside the stream. A `loading.tsx` gives the click an
immediate skeleton while that check runs.

## License

MIT — built as a portfolio project.
