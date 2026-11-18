# Portfolio walkthrough — Vortex Metrics

**Production:** <https://vortex-metrics.vercel.app> · **Demo login:** `demo@vortex.test` / `vortex-demo-1`

Use this if you want to re-record the tour, if CI ever needs it re-created, or as the narration
script while screen-recording. Total run time: **~60 seconds**.

## Shot list

| # | Second | Action / view | What it proves |
| --- | --- | --- | --- |
| 1 | 0:00 | Land on `/login` | The demo is one click — no credentials, no signup. |
| 2 | 0:04 | Click **Open the demo** | Shared read-only demo account, decided server-side. |
| 3 | 0:08 | Acme Inc opens on `/app` | Account lists both workspaces, roles shown — Owner and Admin. |
| 4 | 0:12 | Click **Open** on Acme | KPIs animate up from zero: SQL aggregates, not mock numbers. |
| 5 | 0:18 | Revenue chart + Orders by status | Real 30-day revenue, paid-only definition, written on the chart. |
| 6 | 0:24 | Open **Orders** | URL-driven search, status filter, date range, server-side pagination. |
| 7 | 0:30 | Open any order | Line items, discounts, tax — a plain relational model, not denormalized JSON. |
| 8 | 0:36 | Switch workspace to **Nordwind Studio** | Same app, different tenant and different role (Admin) — tenant isolation in one click. |
| 9 | 0:42 | Open **Audit log** | Append-only ledger: actor, action, IP, user agent, entry id. |
| 10 | 0:48 | Filter `organization.updated` → **Inspect** | Field-level before/after diff, computed on read by a tested pure function. |
| 11 | 0:54 | Done — leave on the detail view | The last thing a recruiter sees is the audit trail, not a chart. |

## Narration (~150 words)

> Vortex Metrics is a multi-tenant analytics SaaS I built to prove the parts that usually stay
> hidden behind a real product. One click signs you into the shared demo. Acme Inc opens on real
> PostgreSQL data — revenue, orders, tell-you-why definitions. The orders table is searchable with
> server-side pagination; the audit log shows every change as a field-level diff with the actor,
> the IP and the entry id. Nothing here is a mock: the tenant is resolved from a verified
> membership, never from the client, and the database itself enforces the same boundary with row
> level security. The same app ships the exports, the CSV downloads and the permission matrix that
> hides and gates everything you just saw.

## Rehearsed without the camera

```bash
npx playwright install chromium   # or PLAYWRIGHT_CHANNEL=msedge
npm run build
npm run test:e2e                  # 9/9 green on the production build
```

## Checklist before sharing

- [ ] Latest deploy is green (`vercel ls`)
- [ ] `/login` shows the demo card and a working **Open the demo** button
- [ ] Orders table renders rows, not a stuck skeleton
- [ ] Audit entry detail loads with the diff and the raw payload
- [ ] `/app/[orgSlug]` returns a real `404` for a workspace you don't belong to
