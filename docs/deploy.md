# Deploying Vortex Metrics to Vercel + Neon

This is the production path used by the project: **Next.js on Vercel**, **PostgreSQL 16 on Neon**,
Prisma migrations from CI or a one-off shell, and a daily cron for operational housekeeping.

The repository ships two workflows:

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `.github/workflows/ci.yml` | push to `main`, pull requests, manual | Postgres service, migrations, seed, RLS proof, lint, typecheck, unit tests, build and Playwright E2E |
| `.github/workflows/deploy.yml` | tags `v*`, manual | optional production deploy through the Vercel CLI |

Vercel's Git integration is still the simplest production path: connect the repository, set the
environment variables once and every push to `main` deploys. Use the deploy workflow only if you
want tag-based or manual deploys from GitHub Actions.

---

## 1. Create the Neon database

1. Create a Neon project with **PostgreSQL 16**.
2. Copy two connection strings from **Connection Details**:
   - **Pooled** (`...-pooler...`): used at runtime by the serverless driver.
   - **Direct** (no `-pooler`): used by `prisma migrate` and the seed.
3. Keep the default Neon role. It is **not** a superuser and does not have `BYPASSRLS`, which is
   required for RLS. A superuser would silently bypass every policy.

The app expects this shape:

```text
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/vortex_metrics?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/vortex_metrics?sslmode=require"
```

> If you use a dedicated migration role, grant it ownership of the schema; the runtime role must
> remain a normal login. `FORCE ROW LEVEL SECURITY` covers the table owner, but nothing covers
> `SUPERUSER` or `BYPASSRLS`.

## 2. Configure Vercel

Import the repository in Vercel and use:

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Node.js | 22.x |
| Install command | `npm ci` |
| Build command | `npm run build` (it runs `prisma generate && next build`) |
| Output | Next.js default |

Set these environment variables for **Production** (and Preview if you want a working preview):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon **pooled** URL |
| `DIRECT_URL` | yes | Neon **direct** URL |
| `NEXT_PUBLIC_APP_URL` | yes | `https://your-domain.com` |
| `DEMO_MODE` | no | `true` shows the demo card and one-click sign-in |
| `DEMO_READ_ONLY` | no | `true` locks the demo tenants and the shared account |
| `RESEND_API_KEY` | no | transactional email for invitations and resets |
| `EMAIL_FROM` | no | verified sender, e.g. `Vortex Metrics <no-reply@example.com>` |
| `CRON_SECRET` | recommended | bearer token for `/api/cron/housekeeping` |

Do not put `DATABASE_URL`/`DIRECT_URL` in `NEXT_PUBLIC_*` variables. Nothing in the browser needs a
database credential.

## 3. Apply migrations and seed

Run these from a trusted shell or a one-off CI job with the production URLs:

```bash
export DATABASE_URL="postgresql://…-pooler…/vortex_metrics?sslmode=require"
export DIRECT_URL="postgresql://…/vortex_metrics?sslmode=require"

npm ci
npm run db:deploy          # prisma migrate deploy, uses DIRECT_URL
npm run db:seed            # demo tenants + audit fixtures
```

`db:seed` with no arguments replaces the analytics rows, members, pending invitations and audit
fixtures of **Acme Inc** and **Nordwind Studio** only. It never drops other workspaces. Run it again
whenever the public demo needs a clean reset.

For a private deployment, skip `db:seed`; registration creates a workspace on first sign-up.

## 4. Demo mode in production

The public demo is designed to be safe to expose:

- `DEMO_MODE=true` renders the credentials card and one-click **Open the demo** on `/login`.
- `DEMO_READ_ONLY=true` blocks settings edits, invitations, role changes, removals, workspace
  creation, invitation acceptance and session revocation in the Server Actions.
- Password resets for the shared demo account are suppressed, so one visitor cannot lock out the
  others.
- Reads, tables, audit entries, CSV and PDF exports remain available.
- `DEMO_READ_ONLY` also covers the shared account if it ever belongs to a non-demo workspace.

To reset the demo from a protected machine:

```bash
DATABASE_URL="…pooled…" DIRECT_URL="…direct…" npm run db:seed
```

## 5. Cron housekeeping

`vercel.json` registers a daily cron at **04:00 UTC**:

```json
{
  "crons": [{ "path": "/api/cron/housekeeping", "schedule": "0 4 * * *" }]
}
```

The route deletes expired sessions, reset tokens older than 30 days, rate-limit windows older than
two days and invitations expired/revoked more than 30 days ago. It never touches `audit_logs`: the
append-only trigger rejects deletes even from the housekeeping path.

Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when the variable exists. Test it
manually:

```bash
curl -i https://your-domain.com/api/cron/housekeeping \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected: `200 {"ok":true,"sessions":…,"resetTokens":…,"rateLimits":…,"invitations":…}`.
Without the header: `401`. Without `CRON_SECRET`: `503`.

## 6. Continuous integration

`ci.yml` runs against a disposable PostgreSQL 16 service:

1. `npm ci`
2. `npm run db:deploy`
3. `npm run db:seed`
4. `npm run db:check` — tables, trigram indexes, RLS flags and policies
5. `npm run db:rls` — proves the policies with a temporary non-superuser role
6. `npm run lint`
7. `npm run typecheck`
8. `npm run test` — Vitest unit/component suite
9. `npm run build`
10. `npx playwright install --with-deps chromium`
11. `npm run test:e2e` — Playwright against the production build

The workflow uploads `playwright-report/` when a test fails. E2E runs with one worker because the
demo account and audit ledger are shared state.

### Optional Vercel deploy workflow

`deploy.yml` needs three repository secrets:

| Secret | Where to find it |
| --- | --- |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link`, or the Vercel project settings |
| `VERCEL_PROJECT_ID` | same file |

Trigger it manually from the Actions tab or by pushing a tag such as `v1.0.0`. It runs
`vercel pull`, `vercel build --prod` and `vercel deploy --prebuilt --prod`.

## 7. Post-deploy smoke check

```bash
curl -I https://your-domain.com/login
```

Check for `content-security-policy`, `x-frame-options: DENY`, `x-content-type-options: nosniff`,
HSTS in production, and no `x-powered-by`.

Then sign in with the demo, open both tenants and verify:

- the dashboard shows real numbers, not zeros (RLS would return zero rows if the tenant setting
  were missing);
- orders/customers/products paginate and export;
- the audit ledger lists entries and opens a diff;
- settings are read-only when `DEMO_READ_ONLY=true`.

For a stronger check against a staging database:

```bash
DATABASE_URL="…" DIRECT_URL="…" npm run db:rls
DATABASE_URL="…" DIRECT_URL="…" npm run db:explain
```

## 8. Rollback

- **Application:** Vercel keeps immutable deployments. Promote a previous deployment or roll back
  from the project dashboard.
- **Migrations:** forward-only. The RLS migration only adds policies, triggers and an index, so a
  rollback of the app does not require a schema rollback.
- **Data:** use Neon's branching or point-in-time restore for destructive mistakes. `db:seed` is
  idempotent and only rebuilds the demo tenants.

## 9. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Every table is empty in production | The runtime role bypasses RLS or `withTenant` did not run; check that `DATABASE_URL` is the app URL, not a superuser |
| `P1001` during migrations | `DIRECT_URL` is wrong, or the Neon project is suspended |
| Server Actions fail behind a proxy | Add the public host to `serverActions.allowedOrigins` in `next.config.ts` |
| Cron returns 401 | `CRON_SECRET` is missing/mismatched, or the header is not a bearer token |
| PDF export times out | The route must run on the Node runtime; keep `runtime = "nodejs"` on PDF routes |
| Playwright cannot log in | Demo data was not seeded, or rate limits from a previous run were not cleared; `e2e/global-setup.ts` clears them |
| Invitations do not arrive | `RESEND_API_KEY`/`EMAIL_FROM` are unset; the UI surfaces the link to the inviter instead |

## 10. Security checklist

- [ ] `DATABASE_URL` uses a non-superuser, non-`BYPASSRLS` role.
- [ ] `DIRECT_URL` is only used by migrations/seed, never in the browser.
- [ ] `CRON_SECRET` is a long random value and present in Vercel.
- [ ] `DEMO_READ_ONLY=true` for any public demo.
- [ ] HSTS is present once the custom domain is on HTTPS.
- [ ] `npm run db:rls` passes against the deployed database (or a branch of it).
- [ ] Vercel deployment protection is enabled for preview deployments if they share real data.
