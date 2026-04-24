# HealthKit views — inspector + personal activity feed

> **Status:** Drafted 24 April 2026 during session 5. Post-launch — not a v1 blocker.
> **Target:** Build during App Store review window (~3–7 day gap between submit and approve) or as v1.0.1/v1.1 in the week after launch.
> **Owner:** Dean (technical), Lewis (visual/copy sign-off on feed layout).
> **Related:** `plans/healthkit-health-connect.md` (v1 HK integration); `plans/habits-healthkit-autotick.md` (auto-tick engine); backlog "Social activity feed" (separate team-visible product track).

---

## Why this feature

Two separate features, bundled in one plan because they share data sources and architectural shape:

1. **Apple Health data inspector** (`apple-health.html`) — transparency page showing members everything VYVE has pulled from their HealthKit. Also serves as Dean's debug surface, and strengthens the privacy-first narrative for App Store review and for Lewis's enterprise sales.
2. **Personal activity feed** — Strava-style chronological timeline on `exercise.html` unifying VYVE-logged workouts/cardio with HealthKit-sourced Apple Watch / Strong / Strava entries. Personal only, not team-visible (that's the backlog's separate "Social activity feed").

Both are engagement multipliers, not submission blockers. Apple reviewers don't care either way. Members who have HealthKit connected feel the magic immediately.

---

## Scope decisions (locked 24 April 2026)

| Decision | Value | Rationale |
|---|---|---|
| Inspector path | **`apple-health.html`**, linked from Settings Apple Health panel "View your data →" | Discoverable where members manage the connection; matches iOS mental model |
| Inspector window | **Last 30 days** (default), extendable to last 60 days (EF cap) | Aligns with the current pull window; avoids loading infinite history |
| Inspector data scope | **Only HK samples** — doesn't duplicate the VYVE nutrition/workout tabs | Single-purpose page, not an aggregate dashboard |
| Feed location | **Section on `exercise.html`** under a new "Activity" tab | Fits the existing hub pattern (workouts, cardio, classes); no new top-level page needed |
| Feed scope v1 | **Workouts + cardio only** (VYVE-logged + HK-sourced unified) | Matches Strava mental model. Defer steps milestones / weight entries / session views to v1.1 |
| Feed chronology | **Reverse-chron, last 30 days**, paginate by loading next 30 on scroll | Standard feed pattern |
| Social overlay | **None.** Personal only — no kudos, no comments, no visibility to others | Social feed is a separate product with 7 open decisions still unresolved; keep this one simple |

---

## Feature 1 — Apple Health data inspector

### Page layout

Header row:
- Connection state chip: "Connected" (green) or "Not connected" (grey). Pulled from `member_health_connections` via the hydration flow that 5c shipped.
- Last sync timestamp: "Last synced 2 hours ago"
- "Sync now" button → `healthBridge.sync()`
- Total samples ingested counter: "1,284 samples across 7 data types"

Data cards — one per sample type, in this order:

**Workouts**
- List of rows (chronological descending), each showing:
  - Type (running / walking / strengthTraining / etc.)
  - Duration
  - Date + time
  - Source app (`app_source` field: "Apple Watch", "Strong", "Strava", etc.)
  - Promoted-to badge: "→ VYVE cardio" or "→ VYVE workouts" or "raw only" (for Yoga < 30min etc.)

**Steps**
- Daily bar chart, last 30 days (reusing engagement page charting pattern)
- Today's total prominently displayed
- Weekly average below

**Heart rate**
- Daily min / avg / max
- Last resting HR (if `restingHeartRate` scope added later)

**Active energy**
- Daily kcal total bar chart
- Weekly total

**Sleep**
- Per-night bars showing: total time asleep, broken down by rem / deep / light / awake segments (requires the `sleepState` metadata patch from `plans/habits-healthkit-autotick.md` Session 0)
- Member's current 7-day average

**Distance**
- Daily km total
- Monthly cumulative

**Weight**
- Log list + sparkline chart (reuses nutrition.html's weight chart component)
- "Last weighed" date
- Latest value

Footer:
- Link: "Manage permissions in iPhone Settings → Health → Data Access → VYVE Health" (matches Apple-native pattern from 612459b)
- Link: "Request a copy of your data" (Article 20 GDPR export — stub for now, pairs with Article 20 tool on backlog)
- Link: "Disconnect Apple Health" — calls `healthBridge.disconnect()` with confirmation modal. Reminds member they also need to revoke in iPhone Settings for a full revoke.

### Backend

Two approaches:

**(a) New EF: `get-health-data`** — takes JWT, returns the 30-day aggregated view across all 7 types. ~1 EF, single round trip. JWT-verified.

**(b) Extend `member-dashboard`** with a `health_detail: boolean` query param that, when true, includes the full sample breakdown. Reuses auth path.

I'd go **(a)** — the response payload for a detailed 30-day view is potentially large (workouts list + 30 days × 7 sample types of aggregates), and `member-dashboard` is already hot-path. Keep it separate.

EF response shape (rough):

```json
{
  "connection": { "last_sync_at": "...", "granted_scopes": [...], "total_synced": 1284 },
  "workouts": [ { "date", "type", "duration_min", "source", "promoted_to" }, ... ],
  "steps_daily": [ { "date", "total" }, ... ],
  "heart_rate_daily": [ { "date", "min", "avg", "max" }, ... ],
  "active_energy_daily": [ { "date", "total" }, ... ],
  "sleep_nightly": [ { "date", "asleep_min", "rem_min", "deep_min", "light_min", "awake_min" }, ... ],
  "distance_daily": [ { "date", "total_km" }, ... ],
  "weight_log": [ { "date", "kg" }, ... ]
}
```

All computed server-side from `member_health_samples`. Read-only. No PII leaks (data scoped to `auth.email() = member_email`).

### Audience framing in the UI

Header copy: "This is everything VYVE has pulled from your Apple Health. It never leaves your device to anywhere except our UK-based secure servers, and it's only used to auto-track your workouts, habits, and wellbeing score."

That sentence does double duty — privacy reassurance for members, and compliance copy if Apple reviewers navigate to this page during review.

---

## Feature 2 — Personal activity feed

### Placement

New "Activity" section on `exercise.html`, appearing below the existing Workouts / Cardio / Classes cards. Card header: "Your activity — everything you've done."

Each row:
- Date + time (smart format: "Today 9:04am", "Yesterday 6:30pm", "Tue 22 Apr")
- Activity type — single word or short phrase: "Run", "Walk", "Strength", "Yoga session", "VYVE workout"
- Primary metric — duration + (for cardio) distance + (if available) pace
- Source badge (small pill):
  - "⌚ Apple Watch" for HK-sourced Apple Watch workouts
  - "Strong" / "Strava" / "Garmin" for third-party apps that wrote to HK
  - "VYVE" for native VYVE logs (from `workouts` / `cardio` with no `app_source`)
  - "Live session" for `session_views` rows (if we extend scope to include those in v1.1)
- Optional: average HR if we can pull it from the overlap of `member_health_samples.heart_rate` within the workout's start/end window
- Tap target — expands inline or opens a detail view with the full HK metadata + a delete-or-edit affordance (VYVE-logged only; HK-sourced are read-only from the HK side — "To remove this, delete it in Apple Health")

### Data shape

No new tables. The feed is a client-composed view pulling from:

- `workouts` (strength sessions, VYVE-logged + HK-promoted)
- `cardio` (runs/walks/etc., VYVE-logged + HK-promoted)
- `member_health_samples` (for enriching with HR overlay; also potentially showing raw workouts that weren't promoted, like Yoga <30min, if we decide that's interesting)

Each row keeps a reference back to its source sample so "View in Apple Health" can work:

```
-- For HK-promoted rows, the source is traceable via:
select s.native_uuid, s.app_source, s.metadata
from workouts w
join member_health_samples s on s.promoted_id = w.id and s.promoted_to = 'workouts'
where w.id = ?
```

For VYVE-native rows, no samples row exists — display without the source badge (or with "VYVE" badge).

### Backend

One EF: `get-activity-feed` — takes JWT + optional `before` cursor + limit, returns merged chronological list across workouts + cardio, pre-joined with source sample metadata.

```
{
  "rows": [
    {
      "id": "uuid",
      "source_table": "workouts" | "cardio",
      "occurred_at": "2026-04-22T17:20:35Z",
      "type": "running",
      "duration_min": 19,
      "distance_km": null,
      "avg_hr": 142,
      "source_app": "Apple Watch",
      "is_editable": true,
      "native_uuid": "..."
    },
    ...
  ],
  "next_before": "2026-03-22T00:00:00Z"
}
```

Client fetches on section-enter, paginates on infinite scroll.

### HR overlay — how it works

For each cardio/workout row with a known native_uuid and start/end window:

```sql
select avg(value)::int as avg_hr
from member_health_samples
where member_email = $1
  and sample_type = 'heart_rate'
  and start_at >= $2  -- workout start
  and end_at <= $3    -- workout end
```

Only return `avg_hr` if sample count ≥ 3 (else too sparse to be meaningful). Computed server-side in the `get-activity-feed` EF as part of row hydration.

Future — v1.1: max HR, HR zones (requires zone config per member), pace for runs (requires distance vs duration aggregation).

---

## Shared dependencies

Both features depend on:
1. **HealthKit v1 shipped + members using it** — otherwise feeds are VYVE-only and inspector is empty.
2. **`sleepState` metadata patch** (Session 0 of `plans/habits-healthkit-autotick.md`) — for the inspector's sleep breakdown card to work. Also enables the sleep habit auto-tick. Single patch unlocks both features.
3. **Server-authoritative hydration (5c)** — connection state chip on inspector and source badges on feed rely on trustworthy `member_health_connections` reads.

---

## Per-session breakdown

| # | Session | Pre-req | Deliverables |
|---|---|---|---|
| 1 | **Data inspector page + EF** | v1 HK live, sleepState patch shipped | `apple-health.html` built with all 7 data-type cards; `get-health-data` EF (JWT-verified) returning aggregated 30-day view; Settings "View your data →" link; footer disconnect flow |
| 2 | **Personal activity feed** | Session 1 shipped (shared infra patterns) | `exercise.html` Activity section; `get-activity-feed` EF with HR overlay + pagination; source badges + smart-date formatting; tap-to-detail for VYVE rows |

Total: ~2 sessions.

Can be done in parallel if Dean wants two focused work streams; more likely sequential (~2–3 days calendar including Lewis's visual-design passes).

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Inspector looks empty for members who just connected and haven't synced much | Medium | Empty-state copy: "Your data will appear here after your first few days of use. Sync now to check." |
| HR overlay query is expensive (millions of heart_rate samples per active member) | Low-medium | Index on `(member_email, sample_type, start_at)` already exists; avg computation is cheap; watch query plan after first real-data testing |
| Feed makes VYVE-native workouts look stale next to Apple Watch workouts (because AW data is richer) | Medium | Equal visual weight in row design; don't surface metrics a row doesn't have (no fake nulls); VYVE-native sessions get their own badge with distinct icon |
| Member deletes a HK-sourced workout expecting it to go from Apple Health too | Medium | Detail view explicitly says "To remove from Apple Health, open the Health app" — we only delete the VYVE-side promoted row, not the native sample |
| Inspector page becomes the de-facto debug tool, reviewed by Apple during submission, and reveals rough edges | Low | Accepted risk — the page is privacy-forward and honest, exactly what Apple wants to see |

---

## Open questions parked for later

- Should the feed include live-session views (`session_views`) as rows? Opinion split — they're activity but not workouts. Defer to v1.1 based on member feedback.
- Should the inspector export data as a CSV or JSON file? Pairs with Article 20 tool (on backlog). Include button as stub now, wire when the Article 20 flow lands.
- Detail view for feed rows — inline expand or separate page? Inline is lighter; separate page is more extensible (comments, later kudos, share). Start inline, extract page later if needed.
- Filter/search on feed? "Show only runs in April." Not v1. Backlog item.
- Sharing a workout externally (native iOS share sheet with an image card)? Marketing-nice but out of v1 scope.

---

*Plan committed to brain 24 April 2026.*
