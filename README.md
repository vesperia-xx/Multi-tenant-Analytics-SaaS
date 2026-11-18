# Vortex Metrics

**Multi-tenant analytics SaaS with tenant isolation enforced twice: in the application layer and in PostgreSQL.**

Vortex Metrics gives every organization its own workspace, its own data and its own permissions. Dashboards, tables and exports are powered by real SQL aggregates over a seeded PostgreSQL dataset — no mocks at runtime, no client-side math.

> **Status:** Phase 7 of 10 — audit ledger with field-level before/after diffs.
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
| 4 | Dashboard KPIs and analytics charts from real SQL | ✅ |
| 5 | Orders, customers and products tables (search, filters, sorting, pagination) | ✅ |
| 6 | CSV and PDF reports | ✅ |
| 7 | Audit log with before/after diffs | ✅ |
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

### 5. Optional: give your workspace something to measure

Register an account, then seed that workspace with six months of orders, customers, products and
traffic:

```bash
npm run db:seed -- --org acme-inc
```

The dashboard always reads PostgreSQL — the seed only provisions rows. Phase 8 adds the dedicated
Acme/Nordwind demo tenants and the read-only demo mode; this script can be re-run at any time and
replaces only the target workspace's analytics rows.

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
| `npm run db:seed` | Seed one workspace (`-- --org <slug>` or `-- --email <address>`) |
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
  lib/                    Utilities, env validation, Zod schemas, permission matrix
  server/
    analytics/            Range resolution and tenant-scoped SQL aggregates
    audit/                Audit list, detail and action catalogue
    auth/                 Password hashing, sessions, rate limits, Server Actions
    customers/            Customer list query
    db/client.ts          Prisma client with pg / Neon adapters
    email/                Resend delivery (optional)
    exports/              CSV/PDF HTTP helpers and the printed report
    orders/               Order list and detail queries
    org/                  Tenant context, invitations, roles and Server Actions
    products/             Product and category queries
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

Step-by-step instructions will be added in Phase 10 (`docs/deploy.md`).

## Notes on the Next.js version

This project runs **Next.js 16.4.6** with `cacheComponents` and `partialPrefetching` enabled. Runtime APIs (`cookies`, `headers`, `searchParams`) must sit behind Suspense boundaries, and static pages must avoid non-deterministic values at render time. The docs bundled in `node_modules/next/dist/docs/` are the reference for this version.

`/app/[orgSlug]` opts out of instant navigation (`export const instant = false`) on purpose: the
membership check must finish before the response streams so a cross-tenant URL returns a real 404
instead of a 200 with a not-found screen inside the stream. A `loading.tsx` gives the click an
immediate skeleton while that check runs.

## License

MIT — built as a portfolio project.
