# Admin Dashboard — Data Infrastructure + Single-File Client

Shipped: 18 April 2026
Owner: Dean Brown
Related: `apps/admin-dashboard/admin.html` (committed separately)

---

## Purpose

Scalable admin/ops dashboard for VYVE. One page, two users (Dean + Lewis), backed by an
aggregation layer that keeps queries sub-millisecond at 5,000+ members.

## Architecture

### Data layer — hot / warm / cold

- **Hot (0–30 days):** raw activity tables (`daily_habits`, `workouts`, `cardio`,
  `session_views`, `replay_views`, `wellbeing_checkins`, `monthly_checkins`). Queried
  only for the member-deep-dive Timeline tab.
- **Warm (30–90 days):** `member_activity_daily` (one row per member per date with
  counts by type). Queried for charts and longer timelines.
- **Cold (90+ days):** summary fields on `member_stats`, `company_summary`,
  `platform_metrics_daily`. List views never touch raw tables.

### Aggregate tables (all RLS-enabled, no client policies — EF service-role only)

| Table | Role | Refreshed by |
|-------|------|-------------|
| `member_stats` (one row per member) | `last_activity_at`, rolling counts, engagement components, risk flags, programme state | `recompute_all_member_stats()` every 15 min |
| `member_activity_daily` (one row per member per date) | per-type daily counts (habits, workouts, cardio, sessions, replays, check-ins, total) | `rebuild_member_activity_daily()` nightly 03:00 UTC |
| `company_summary` | per-employer rollup: member_count, active_7d/30d, avg engagement, at_risk, needs_support | `recompute_company_summary()` daily 02:00 UTC |
| `platform_metrics_daily` | per-day KPIs: DAU/WAU/MAU, new_members, total_members, activity breakdown, emails, certs, alerts | `recompute_platform_metrics()` + `backfill_platform_metrics()` daily 02:15 UTC |
| `member_activity_log` (VIEW) | UNION over raw activity tables with metadata jsonb | n/a — live view |
| `admin_users` | allowlist for the admin-dashboard EF | manual INSERT |

### Engagement score

`engagement_score = 50 + activity_pts + consistency_pts + variety_pts + wellbeing_pts`
where each component is capped at 12.5. Mirrors the portal formula so admin and
members see the same number. Component breakdowns stored on `member_stats`
(`activity_score`, `consistency_score`, `variety_score`, `wellbeing_score_component`)
via the new `compute_engagement_components(...)` function.

### Risk flags (split per 18 Apr decision)

- `at_risk` — churn signal. `last_activity_at < now() - 14 days` OR wellbeing ≤ 4.
- `needs_support` — care signal. `persona = 'HAVEN'` OR `sensitive_context = true` OR
  latest stress ≤ 3 (inverted scale — 3 means very stressed).

### Client → EF → DB

1. `admin.html` signs the admin in with Supabase Auth (anon key + email/password).
2. Every data call POSTs to `admin-dashboard` EF with `Authorization: Bearer <JWT>`.
3. EF validates JWT (`supabase.auth.getUser(token)`), extracts email, checks
   `admin_users.active = true`, runs the query with the service-role client.
4. Service role key never touches the browser.

### EF actions

`overview`, `members` (paginated + search + filter + sort), `member_detail`,
`member_timeline` (30d raw / 30-90d daily), `member_raw` (full raw-table dump,
100 rows/table), `companies`, `platform` (last N days), `activity_feed`,
`alerts`, `health`.

## Scaling behaviour

- At 5,000 members: `member_stats` full scan < 10 ms; list view one-page query is
  indexed on `(last_activity_at DESC)` / `(engagement_score DESC)`.
- `member_activity_daily` at 365 d × 5,000 members = ~1.8M rows; PK + `idx_mad_date`
  keep any window query in the low-ms range.
- `member_activity_log` is a VIEW. Large date windows on it hit all six source
  tables; that's fine because each is indexed on `(logged_at DESC)` after today's
  audit-quick-win migration.
- Cron refresh: `recompute_all_member_stats()` is O(members). At 5k members × ~5 ms
  per recompute (log scans with member_email index) = ~25 s per cron tick. Budget
  OK — we're below the 15-min interval.

## Known bottlenecks & next steps

- `recompute_all_member_stats()` iterates every member in serial plpgsql. At 50k+
  members this will stop fitting in 15 min. When we hit that scale, switch to set-
  based SQL writing directly to `member_stats`.
- `member_activity_log` is a VIEW. If we ever need to serve large activity-feed
  windows, materialise it.
- Search in `members` action does an ILIKE fallback on `first_name/last_name/company`.
  At 50k+ members add a trigram index on those columns.
- PostHog still sends raw email PII (existing issue, not scoped here).

## What was different from the original spec

- `at_risk` was split into `at_risk` + `needs_support` (decision 2 of 3).
- Aggregate table chosen was `member_stats` joined to `members` (decision 3 of 3),
  not a duplicating `member_summary`.
- Admin dashboard uses an EF proxy with JWT + allowlist (decision 1 of 3) — no
  service key in the HTML.
- `member_activity_log` is a VIEW over raw tables (already was — prior session);
  the spec's `BIGSERIAL id` table was avoided to eliminate write amplification.
- Infrastructure partially pre-existed from a prior Claude session (tables + cron
  + 6 functions). Today's work extended it rather than re-created it.

## Deployment

- **Edge Function:** `admin-dashboard` v2, deployed to `ixjfklpckgxrwjlfsaaz` on
  18 April. `verify_jwt: false` (VYVE pattern), internal JWT validation.
- **HTML file:** `apps/admin-dashboard/admin.html` (~40 KB, single-file, CDN deps
  for supabase-js and Chart.js). Committed separately. Host on any static host —
  recommend `admin.vyvehealth.co.uk` via a subdomain on GitHub Pages from a
  dedicated `vyve-admin-site` repo, or inside `vyve-command-centre`.
- **Admin allowlist:** seeded with `deanonbrown@hotmail.com` and
  `lewisvines@hotmail.com`. To add more: `INSERT INTO admin_users (email, role, added_by) VALUES (...);`
- **Test flow:** Dean or Lewis logs in with their Supabase Auth password (same as
  the member portal). EF validates + looks up in allowlist. On success, all six
  dashboard views become accessible.
