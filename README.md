# Vortex Metrics

**Multi-tenant analytics SaaS with tenant isolation enforced twice: in the application layer and in PostgreSQL.**

Vortex Metrics gives every organization its own workspace, its own data and its own permissions. Dashboards, tables and exports are powered by real SQL aggregates over a seeded PostgreSQL dataset — no mocks at runtime, no client-side math.

> **Status:** Phase 9 of 10 — RLS with FORCE, measured query plans and security headers.
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
| Reports | CSV + PDF (`@react-pdf/renderer`) generated in a Node runtime |
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
  └─ Row-Level Security with FORCE on the tenant data plane
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
| 4 | Dashboard KPIs and analytics charts from real SQL | ✅ |
| 5 | Orders, customers and products tables (search, filters, sorting, pagination) | ✅ |
| 6 | CSV and PDF reports | ✅ |
| 7 | Audit log with before/after diffs | ✅ |
| 8 | Seeded demo tenants + read-only demo mode | ✅ |
| 9 | Performance work, PostgreSQL RLS with FORCE, security hardening | ✅ |
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

### 5. Provision the demo (and optionally your own workspace)

With no arguments the seed provisions the two public demo tenants, their members, a pending
invitation and a small audit ledger:

```bash
npm run db:seed
```

To fill an existing workspace instead, keep the target explicit:

```bash
npm run db:seed -- --org acme-inc
npm run db:seed -- --email owner@example.com
```

The dashboard always reads PostgreSQL — the seed only provisions rows. Running it again replaces
only the target workspace's analytics rows; the demo run also resets the demo members, invitation
and audit ledger, so it is safe to repeat.

### 6. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
| `npm run db:seed` | Seed the demo tenants, or one workspace with `-- --org <slug>` / `-- --email <address>` |
| `npm run db:rls` | Prove the RLS policies with a temporary non-superuser role |
| `npm run db:explain` | Print `EXPLAIN ANALYZE` plans for the dashboard and table queries |
| `npm run db:studio` | Prisma Studio |
| `npm run db:check` | Verify connectivity, tables and trigram indexes |

## Project structure

```
prisma/
  schema.prisma           14-model data model (source of truth)
  migrations/             SQL migrations, including pg_trgm indexes
  seed.ts                 Demo tenants, editable workspace seed, audit fixtures
scripts/
  db-check.ts             Connectivity + table, index, RLS and policy smoke test
  rls-check.ts            Proves tenant policies with a temporary non-superuser role
  explain.ts              EXPLAIN ANALYZE report for the dashboard and table queries
src/
  app/
    (auth)/               login, register, forgot-password, reset-password, invite/[token]
    app/                  account area: all workspaces and active sessions
    app/[orgSlug]/        tenant-scoped shell, dashboard, tables, audit and settings
    api/org/[orgSlug]/    authenticated JSON endpoints and CSV/PDF exports
    page.tsx              Marketing landing page
    layout.tsx            Root layout, theme provider, toasts
    globals.css           Design tokens (oklch) + utilities
  components/
    app/                  Account overview, workspace shell, members and invitations
    app/analytics/        KPI cards, Recharts panels, filters, empty states
    app/audit/            Audit ledger and entry diff view
    app/customers/        Customer table view
    app/orders/           Order table view
    app/products/         Product table view
    app/table/            Shared TanStack Table shell, filters and skeletons
    auth/                 Auth shell, forms, feedback, invitation acceptance
    brand/                Logo
    layout/               Marketing header, mobile nav, footer
    marketing/            Printed report specimen
    theme/                Theme provider and toggle
    ui/                   Button, Card, Badge, Input, Field, Toaster
  lib/                    Utilities, env validation, Zod schemas, permission matrix, demo state
  server/
    analytics/            Range resolution and tenant-scoped SQL aggregates
    audit/                Audit list, detail and action catalogue
    auth/                 Password hashing, sessions, rate limits, Server Actions
    customers/            Customer list query
    db/client.ts          Prisma client with pg / Neon adapters
    db/tenant.ts          Transaction-scoped RLS context (`withTenant`)
    email/                Resend delivery (optional)
    exports/              CSV/PDF HTTP helpers and the printed report
    orders/               Order list and detail queries
    org/                  Tenant context, invitations, roles, demo guard and Server Actions
    products/             Product and category queries
  proxy.ts                Optimistic cookie check for /app/*
  generated/prisma/       Generated Prisma client (gitignored)
```

## Demo mode

`npm run db:seed` provisions two independently populated tenants and one shared account:

| Workspace | Currency / zone | Role for the demo account | Data |
| --- | --- | --- | --- |
| **Acme Inc** (`/app/acme-inc`) | USD · `America/New_York` | Owner | 781 orders, 68 customers, 10 products |
| **Nordwind Studio** (`/app/nordwind-studio`) | EUR · `Europe/Oslo` | Admin | 659 orders, 54 customers, 10 products |

**Login:** `demo@vortex.test` / `vortex-demo-1`. With `DEMO_MODE=true`, the login page shows both
credentials and a one-click **Open the demo** action.

The demo account is deliberately varied: Owner in Acme, Admin in Nordwind, and a Viewer and a
Manager appear in the member lists. A pending invitation and seven or eight audit entries per
tenant make the read-only settings and audit screens worth visiting.

### What read-only means

`DEMO_READ_ONLY=true` locks both seeded organisations **and the shared account**, so a preview
cannot become a back door through a workspace created earlier. The guard lives in the Server
Actions, not in the buttons:

- settings edits, invitations, revocations, role changes and member removal return a clear error;
- the demo account cannot create workspaces, accept invitations or revoke sessions;
- password resets for the demo account are suppressed entirely, so one visitor cannot lock out
  the rest (the generic response is unchanged);
- **reads and exports stay available**: dashboards, tables, order detail, CSV/PDF and the audit
  ledger all work. An export still writes its internal `report.exported` audit entry.

The UI reflects the same rule: a read-only strip appears in the workspace, the profile becomes a
value summary, member rows lose their controls and the invite form is replaced by an explanation.
`DEMO_MODE` and `DEMO_READ_ONLY` are independent: the first advertises the demo, the second
enforces it.

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
- with `DEMO_READ_ONLY` enabled, reset tokens are not issued for the shared demo account at all;
- the response to "forgot password" is always the same, so it never confirms whether an email exists.

## Multi-tenancy and roles

| Role | Scope |
| --- | --- |
| **Owner** | Everything, including organization deletion and ownership transfer |
| **Admin** | Members, invitations, settings, audit log, reports and all data writes (cannot modify the Owner) |
| **Manager** | Analytics, orders and customers; products are read-only |
| **Viewer** | Read-only, including exports |

Memberships are per organization, so one user can be an Owner in one workspace and an Admin in another — which is exactly what the demo account does.

### Resolving the tenant

`/app/[orgSlug]` is the only place a tenant is named. The layout calls `requireOrgContext(slug)`, which
reads the session, then looks for a `Membership` joining the viewer to the organization with that slug.
No row means `notFound()`: a workspace you do not belong to is indistinguishable from one that does
not exist.

The resolved context (`{ viewer, organization, membership.role }`) is memoised per request with React
`cache`, so the layout, the page and any action share one query. The client never posts an `orgId`.
The switcher posts a **slug**, and the server re-checks the membership before remembering it on the
session as a convenience hint for "continue where you left off".

### Row-Level Security, as a second fence

Application scoping is the first fence; PostgreSQL RLS is the second. Every tenant read or write
runs through `withTenant(orgId, fn)`, which opens a transaction, sets
`app.current_organization_id` with `set_config(..., true)` and hands the transaction client to the
query. The setting is transaction-local, so a pooled connection cannot leak a tenant into the next
request.

The policies cover the data plane — `orders`, `order_items`, `customers`, `products`, `categories`,
`traffic_daily` and `audit_logs` — with `ENABLE` and `FORCE ROW LEVEL SECURITY`. A missing tenant
setting fails closed: the policy comparison is `NULL`, so the query sees zero rows. The tables that
must resolve the tenant before it is known (`users`, `organizations`, `memberships`, `invitations`,
`sessions`, reset tokens) stay outside RLS by design and are always queried by user or token, never
by a client-supplied organization id.

`FORCE` matters because the table owner would otherwise bypass its own policies. The local
`postgres` connection is a superuser and therefore bypasses RLS at runtime; `npm run db:rls` proves
the policies with a temporary non-superuser role: tenant A sees 781 orders, tenant B 659, an explicit
cross-tenant predicate returns zero and no setting returns zero. The full demo E2E was also run
against a dedicated non-superuser login on a fresh database: every page, table, export and audit
entry returned its tenant's rows.

`audit_logs` is also append-only at the database level: a `BEFORE UPDATE OR DELETE` trigger raises
unless the seed's explicit `app.allow_audit_maintenance` flag is set inside its own transaction.

### Performance, measured

`npm run db:explain` runs the dashboard and table query shapes with `EXPLAIN (ANALYZE, BUFFERS)` on
the seeded Acme tenant and reports execution time, chosen indexes and sequential scans. The latest
run on the local dataset:

| Query | Execution | Indexes | Seq scans |
| --- | --- | --- | --- |
| Dashboard totals (current + previous) | 1.14 ms | `orders_organization_id_placed_at_idx` | none |
| Revenue series (30d, day) | 0.72 ms | `orders_organization_id_placed_at_idx` | none |
| Orders page (status + date) | 1.33 ms | `orders_organization_id_status_placed_at_idx`, `customers_pkey` | none |
| Orders search (ILIKE) | 4.61 ms | `orders_organization_id_placed_at_idx`, `customers_pkey` | none |
| Customers page (spend aggregate) | 1.78 ms | — | `orders`, `customers` |
| Audit action filter | 0.17 ms | — | `audit_logs` |

The sequential scans are honest: 68 customers and seven audit rows do not justify an index scan at
this size. The composite indexes are what keep the growing `orders` table on index plans. The
trigram GIN indexes are available for leading-wildcard search; at 781 orders the planner still
prefers the tenant index. Phase 9 also adds `audit_logs (organization_id, action, created_at DESC)`
for the action filter once the ledger grows.

### Security headers

Every response carries a CSP (`default-src 'self'`, no external sources, `frame-ancestors 'none'`,
`object-src 'none'`, `form-action 'self'`), `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` and
`Cross-Origin-Resource-Policy`. Production adds HSTS and `upgrade-insecure-requests`; development
keeps `'unsafe-eval'` for Turbopack HMR. `x-powered-by` is disabled.

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

## Analytics

Every figure on the dashboard is a SQL aggregate over the workspace's own rows. There is no
client-side arithmetic and no fixture: if the range is empty, the UI says so.

| Figure | Definition |
| --- | --- |
| **Revenue** | `SUM(total_cents)` of `PAID` orders only |
| **Orders** | All orders except `CANCELLED` |
| **Average order** | `AVG(total_cents)` of paid orders |
| **New customers** | `customers.created_at` inside the range |
| **Orders by status** | Count and share per status, including cancelled |
| **Top products** | `order_items` joined to products, cancelled orders excluded |
| **Traffic / conversion** | `traffic_daily` totals; conversion = paid orders ÷ sessions |

Ranges resolve in the workspace's timezone (`organizations.timezone`), not the server's. The URL
carries `range` (`7d`, `30d`, `90d`, `12m`, `custom`), optional `from`/`to` and `granularity`
(`day`, `week`, `month`); invalid values fall back per field instead of breaking the page. Custom
ranges are capped at 400 days and never reach the future. Presets, granularity and the custom form
are plain links and a native `GET` form, so the dashboard works before hydration.

Each KPI compares against the immediately preceding window of the same length. With no baseline
the delta reads "No baseline" rather than a misleading `+100%`.

The revenue series uses a `generate_series` spine so empty days still produce a point, and
`date_trunc` runs on `placed_at AT TIME ZONE <workspace zone>`. All queries filter by
`organization_id`, which is the first column of the relevant composite indexes.

## Tables

`/app/[orgSlug]/orders`, `/customers` and `/products` share one table shell: URL-driven filters,
server-side sorting and pagination, and a client cache keyed by the full query string.

| Concern | Implementation |
| --- | --- |
| Filters | Free-text search, status/date/country/category filters — all in the URL |
| Sorting | Whitelisted columns per table; the server interpolates the column name from a map, never from input |
| Pagination | `LIMIT`/`OFFSET` plus `COUNT(*) OVER()` in the same query, so the total is free |
| Search | `ILIKE '%term%'` on columns backed by `pg_trgm` GIN indexes |
| Fetching | Authenticated `GET /api/org/[orgSlug]/{orders,customers,products}` Route Handlers |
| Client state | TanStack Query (keys include every param) + TanStack Table v9 for the column/row model |
| Security | Each handler re-resolves the session and membership; anonymous → 401, foreign tenant → 404 |
| Caching | JSON responses are `private, no-store`; no tenant data is shared between requests |

Invalid parameters never 500: each field falls back on its own, page size clamps to 5–50 and the
sort key falls back to the table's default. The order number links to a read-only detail page with
line items and totals.

TanStack Table v9 is used only for the header/row model; sorting and pagination are manual because
PostgreSQL owns the page. That keeps one source of truth and avoids sorting 10 of 822 rows in the
browser.

## Exports

Two export paths, both generated from the same SQL as the screen:

| Export | Endpoint | Contents |
| --- | --- | --- |
| Orders CSV | `/api/org/[orgSlug]/exports/orders` | Current filters and sort, every matching row (not just the page), cap 10 000 |
| Customers CSV | `…/exports/customers` | Search/country filters, spend and order counts |
| Products CSV | `…/exports/products` | Search/status/category filters, price and cost |
| Analytics PDF | `…/exports/report?range=…` | KPIs with deltas, revenue by bucket, top products, status split and acquisition |

CSV files use a UTF-8 BOM (Excel opens accents correctly), CRLF line endings, decimal money
(`189.00`) and ISO timestamps. Text cells that start with `=`, `+`, `@`, tab or CR are prefixed with
an apostrophe so a spreadsheet never executes them as formulas; numeric values such as `-12.50` are
left intact.

The PDF is rendered in a Node runtime with `@react-pdf/renderer` from the same
`getDashboardData` result as the dashboard, so the printed report and the chart cannot disagree.

Every export re-checks session and membership (401/404), requires the `export` permission (all four
roles have it), is limited to 20 per user per workspace per hour, returns `private, no-store`, and
writes a `report.exported` entry to the audit ledger with the format, resource, row count and
filters.

## Audit log

`audit_logs` is append-only: no endpoint updates or deletes a row. Every meaningful action writes
one entry with the actor, the action, the resource and JSON snapshots of `before` and `after`.

| Action | Written by |
| --- | --- |
| `organization.created` / `organization.updated` | Registration and workspace settings |
| `member.joined` / `member.role_changed` / `member.removed` | Invitations accepted and member management |
| `invitation.created` / `invitation.revoked` | Invite and revoke flows |
| `report.exported` | Every CSV or PDF download, with format, rows and filters |

The ledger is readable by **Owners and Admins only** (`audit:read`). The nav item is hidden for
Managers and Viewers, a direct URL renders a restricted panel, and the JSON endpoint answers 403.

`/app/[orgSlug]/audit` lists entries newest-first with free-text search (action, actor, resource),
an action filter, a date range and pagination. `/audit/[logId]` shows the field-level diff:

- `changed`, `added` and `removed` fields, side by side;
- the raw before/after JSON;
- context: actor and email, resource, IP, user agent, timestamp and entry id.

Diffs are computed by `src/lib/diff.ts`, a pure function shared by the page and the unit tests, so
the UI never reinterprets a snapshot on its own.

## Deployment

The target platform is **Vercel + Neon Postgres**:

- `DATABASE_URL` → pooled Neon connection (used by the serverless driver)
- `DIRECT_URL` → direct connection (used by Prisma migrations)
- `NEXT_PUBLIC_APP_URL` → public base URL
- Optional: `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `DEMO_MODE`, `DEMO_READ_ONLY`

`DATABASE_URL` must use a role without `SUPERUSER` or `BYPASSRLS` for RLS to apply; Neon's default
role qualifies. The local `postgres` superuser bypasses RLS, which is why `npm run db:rls` proves the
policies through a temporary non-superuser role. The table owner is still covered because the
policies use `FORCE`.

For a public preview, run `npm run db:seed` with `DATABASE_URL` pointed at the production
database, then set both demo flags to `true`. The seed is idempotent, so the same command restores
the demo after a reset.

Step-by-step instructions will be added in Phase 10 (`docs/deploy.md`).

## Notes on the Next.js version

This project runs **Next.js 16.4.6** with `cacheComponents` and `partialPrefetching` enabled. Runtime APIs (`cookies`, `headers`, `searchParams`) must sit behind Suspense boundaries, and static pages must avoid non-deterministic values at render time. The docs bundled in `node_modules/next/dist/docs/` are the reference for this version.

`/app/[orgSlug]` opts out of instant navigation (`export const instant = false`) on purpose: the
membership check must finish before the response streams so a cross-tenant URL returns a real 404
instead of a 200 with a not-found screen inside the stream. A `loading.tsx` gives the click an
immediate skeleton while that check runs.

## License

MIT — built as a portfolio project.
