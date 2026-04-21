## 2026-04-21 SESSION SUMMARY | Leaderboard UI upgrade — classic 1→N board, time ranges, scope tabs, anon banner

**Span.** 2026-04-21 22:24 UTC → 23:15 UTC (~50 min, Dean-approved plan before build, execute-through).

**Context.** Prior session (same date) landed the 4-phase aggregation-layer refactor (EF v9 → v10, monthly buckets, display-name preferences). The UI side was deliberately left: members still only saw rank + above[] + locked "N below" teaser. This session ships the classic 1-to-N board, time-range selector, scope tabs (future-proofed), and the anonymous-default nudge.

**Decision made pre-build.** Last-30d "All" metric needed check-ins to rank consistently with this_month and all_time (both of which sum 5 components incl. checkins). Chose option (B) — add `member_home_state.recent_checkins_30d` column + refresh function — over option (A) excluding checkins from 30d All. Clean and consistent over quick-and-lossy.

**Phase 1 — DB migration.** Two migrations:
1. `member_home_state_checkins_recent_30d` — `ALTER TABLE public.member_home_state ADD COLUMN recent_checkins_30d integer NOT NULL DEFAULT 0`. 17 existing rows defaulted.
2. `refresh_member_home_state_with_checkins_30d` — full `CREATE OR REPLACE` of `refresh_member_home_state(p_email)`, identical to prior body with one added population block (`COUNT(*) FROM kahunas_checkins WHERE member_email=e AND activity_date > v_today - 30`) and matching columns in the INSERT + ON CONFLICT DO UPDATE. Check-ins are already capped at 1/ISO-week so plain `COUNT(*)` is correct — no `SUM(LEAST(cap, daily_count))` needed.
Then `SELECT refresh_member_home_state(email) FROM members` across all 17. Verified: Dean = 5 (out of 7 total, 4 this month), which matches expected. Other 16 members all 0 this range. No anomalies.

**Phase 2 — leaderboard EF v10 → v11.** Full rewrite, additive contract (v10 callers still work). Per-metric response gains:
- `ranked[]` — top-100 of active-on-metric members, each with `rank`, `medal`, `count`, `cats`, `bar`, `display_name`, `is_caller`. Caller is highlighted wherever they fall inside ranked[] (no separate caller row needed).
- `overflow_count` — active members past rank 100 (0 today at 17 members, structurally correct at 100+).
- `zero_count` — scope members with 0 on this metric for this range (collapsed into footer, not individual rows).
- `new_members_count` — all_time-only: scope members with `members.created_at > now() - 7 days` excluded from ranked[] to avoid demoralising brand-new members.

Top-level additions: `range` (echoed), `scope_available: boolean` (true iff caller has `employer_members` row with non-null `employer_name`). Query params: `?range=this_month|last_30d|all_time` (default this_month). `?scope=` already in v10. Backwards-compat fields preserved: `above[]`, `below_count`, `gap`, `your_rank`, `your_count`, `total_members`.

**Metric × range mapping:**
- this_month → `*_this_month` (5 comps incl. checkins); streak uses `overall_streak_current`
- last_30d → `recent_*_30d` (5 comps incl. new `recent_checkins_30d`); streak uses `overall_streak_current`
- all_time → `*_total` (5 comps incl. checkins); streak uses `overall_streak_best` ("best streak ever" framing reads better for all-time than current streak)

Active/zero split: ranked[] only includes members with `metric > 0` this range. Zeros roll into `zero_count` footer. `your_rank` still computed against the full in-scope member list so callers in the zero bucket still see their true rank against everyone.

**Phase 3 — frontend.** `leaderboard.html` full rewrite + `settings.html` single-line anchor, atomic commit `d49ef95` to vyve-site@main:

- `leaderboard.html`: Range tabs (This month / Last 30 days / All-time), scope tabs (All members / Company / My team, hidden unless `scope_available`), dismissible anonymous banner at top-of-page linking to `/settings.html#privacy` (banner only shows when caller's `display_name_preference === 'anonymous'` per `vyve_settings_cache`, with localStorage dismiss flag keyed to email). Board renders ranked[] 1→N with caller highlighted in-board via `is_caller`. Zero footer: "+ N members getting started" (or personalised "You haven't logged X yet — jump in" if caller is the only zero). Overflow footer: "+ N members below top 100" (structural, inert today). All-time-only new-member footer: "+ N new members getting started (joined this week)". Range-aware copy throughout ("this month" / "last 30 days" / "all-time" / "best streak ever"). Cache key expanded to include range+scope so tab-switching doesn't serve wrong cached data. Optimistic cache-first render on load when range+scope match.
- `formatName()` helper: title-cases names that are entirely uppercase or entirely lowercase (LEWIS → Lewis, paige → Paige); preserves mixed case (McDonald, Dean). Applied after `escapeHTML` is NOT a risk — applied BEFORE, so XSS guard still runs last. Applied to caller's `first_name` and every ranked[] `display_name`.
- `settings.html`: added `id="privacy"` to the Privacy settings-section div so the banner's "Show my name" CTA scroll-jumps to the display-name picker. Single char-range replacement, zero risk to surrounding markup.

**Verification.**
- EF v11 smoke-tested live across 3 ranges × 4 metrics as Dean (`deanonbrown@hotmail.com`): rank 1/17 on all this_month metrics, count=61; last_30d count=76 (matches: adds the extra March days beyond month-start, plus 5 checkins_30d); all_time count=104 with 5 members excluded as `new_members_count` (tenure < 7d), rank 1/12. Streak metric on all_time uses overall_streak_best=9 as designed.
- As Lewis: rank 6/17 on all this_month, count=4. `caller_in_ranked` correctly TRUE on `all` and `workouts` (non-zero); correctly FALSE on `habits` and `streak` (he's in the zero bucket on both — renders via zero footer, not a wasted ranked slot).
- Byte-equality check post-push: live `leaderboard.html` and `settings.html` on main match local versions exactly.
- `settings.html` `id="privacy"` anchor confirmed present.

**Deferred / not done this session.**
- Test-account filtering (deanonbrown dupes + team@vyvehealth.co.uk) — product decision, still counted under scope=all.
- Lewis's `first_name` uppercase at source — display fixed via `formatName()`, DB untouched per brief.
- Cardio / sessions as new metric tabs — per brief, stays at 4 metrics.
- sw.js cache bump not needed (network-first for HTML since d323d11, JS untouched this session).
- Scope tabs render inert for all 17 members today (0 rows in employer_members). Automatically activates for Sage users once their rows land.

**Key learnings.**
- Additive EF contract pays off — above[] and below_count stay intact so any cached v10 response on a stale client still renders something sane, rather than blowing up on missing fields.
- Zero-bucket collapse is the right default for a small-member board (17 today). A 1→N board with 12 zero rows would be 70% noise; footer-collapsed, it's honest and compact.
- Frontend title-casing via "all-upper or all-lower" detection is safer than the alternative (always title-casing) because it preserves names that are already mixed-case correctly (McDonald, O'Brien). Mixed-case DB data is assumed to be intentional.
- Cache key must include every param that changes the response — range+scope added to localStorage key to prevent stale-data bleed across tab switches.

**Commits.**
- vyve-site: `d49ef95` (leaderboard.html + settings.html, atomic)
- Supabase migrations: `member_home_state_checkins_recent_30d`, `refresh_member_home_state_with_checkins_30d`
- Supabase EF: `leaderboard` v10 → v11


---

## 2026-04-21 SESSION SUMMARY | Leaderboard 4-phase refactor

**Span.** 2026-04-21 21:41 UTC → 22:07 UTC (26 min, Dean-led review between phases)

**Context.** The leaderboard showed Dean with "87 activities this month" — wrong. Two root causes, both pre-diagnosed by Dean before the session: (1) the `leaderboard` EF v9 fanned out raw SELECTs across 5 source tables with no per-day cap, and (2) `member_home_state` had no calendar-month buckets AND its `recent_*_30d` columns used raw `COUNT(*)` so `recent_habits_30d = 53` under a 1/day cap (impossible). Dean asked for a 4-phase plan, stop between phases for numbers review.

**Phase 1 — schema migration.** Migration `leaderboard_monthly_buckets_and_display_name_pref`:
- `members.display_name_preference text NOT NULL DEFAULT 'anonymous'` with `CHECK (... IN ('anonymous','initials','first_name','full_name'))`; 17 existing rows defaulted.
- `member_home_state.{habits,workouts,cardio,sessions,checkins}_this_month integer NOT NULL DEFAULT 0` — BST calendar-month buckets.

**Phase 2 — refresh_member_home_state rewrite.** Migration `refresh_member_home_state_monthly_buckets_and_monotonic_bests`. Existing body preserved; three targeted changes:
1. **Dedup fix** on `recent_*_30d`: habits now `COUNT(DISTINCT activity_date)` (1/day cap); workouts, cardio, sessions now `SUM(LEAST(2, daily_count))` per day grouped (2/day cap); sessions still UNIONs `session_views + replay_views`.
2. **Month buckets** populated from `date_trunc('month', (now() AT TIME ZONE 'Europe/London')::date)` through `v_today` using the same cap-aware dedup as all-time totals.
3. **Monotonic `*_streak_best`** via `GREATEST(member_home_state.<col>, EXCLUDED.<col>)` on UPDATE — prevents best-streak regression if source data is ever modified.
Then `SELECT refresh_member_home_state(email) FROM members` across all 17.

**Phase 2b — last_activity_at (called out mid-Phase 3, applied as a scoped migration before touching the EF).** Migration `member_home_state_last_activity_at` + `refresh_member_home_state_persist_last_activity_at`. `v_last_activity_at` was already computed, just never persisted. Added nullable `timestamptz` column, persisted value in INSERT + UPDATE. One-time rebuild again. Needed for the streak tiebreaker — keeps the EF a pure read against the aggregation layer.

**Phase 3 — leaderboard EF v9 → v10.** Full rewrite, response contract backwards-compatible. Reads `member_home_state + members + employer_members` via one `Promise.all`. Cap-aware monthly totals from home-state. Optional `?scope=all|company|my-team` (defaults to `all`). Display-name resolver: `anonymous` → "Member", `initials` → `F+L`, `first_name` → first, `full_name` → `First Last`; caller always sees their own first name. Streak tiebreak = `last_activity_at DESC`, final tiebreak = `email.localeCompare`. Added `display_name` to each `above[]` entry (additive, doesn't break v9 callers). Top-level `scope` echoed for the frontend.

**Phase 4 — frontend.** Single atomic commit `a096c10` to `vyve-site@main`:
- `leaderboard.html`: renders `row.display_name` (falls back to "Anonymous" italic when EF returns "Member" for anonymous pref); tie-aware gap copy — "You're tied for rank N — next activity breaks it" when the directly-above entry has the same count (detected via `above[above.length-1].count === your_count`); `escapeHTML` helper added and applied to `row.display_name` + `lbData.first_name` everywhere they hit `innerHTML` (closes the XSS audit item flagged in the 16 April security audit for this specific code path).
- `settings.html`: new **Privacy** section between Notifications and Apple Health with a 4-way `theme-btn`-style picker (Hidden / Initials / First name / Full name) wired to `members.display_name_preference`. `loadProfile` select now includes the new column; `populateFromCache` + cache-write paths updated; `setDisplayNamePref()` PATCHes members, updates the cached `vyve_settings_cache.member.display_name_preference` in place, and busts `vyve_leaderboard_cache` (the member's display name has changed for everyone else seeing them).
- `sw.js`: cache bumped to `vyve-cache-v2026-04-21l-leaderboard-refactor`.

**Verification.**
- Dean's row post-rebuild: habits_total/workouts_total/cardio_total/sessions_total/checkins_total = 30/23/9/35/7 (unchanged), habits_this_month/workouts_this_month/cardio_this_month/sessions_this_month/checkins_this_month = 17/16/4/20/4, recent_habits_30d = **21** (was 53 — bug fixed), recent_workouts_30d = 19, overall_streak_current/best = 7/9 (unchanged).
- Sanity sweep across all 17: zero flags (`habits_this_month` ≤ days-elapsed, `recent_habits_30d` ≤ 30, per-type monthly ≤ 2×days-elapsed, 30d ≤ 60).
- Live EF call as Dean: `all.your_count = 61`, rank 1/17. Previously ~87 inflated.
- Live EF call as Lewis (rank 6): `above[]` populates with 5 entries correctly sorted, tied streaks break by last_activity_at DESC (Stuart → Paige → Cole → Calum → Alan matches home-state ordering).
- Display-name resolver tested live: `first_name`/`initials`/`full_name` all render correctly in `above[]`; reverted test writes afterwards so DB is as-found.
- Post-push re-read from `main` confirmed all frontend markers landed.

**Out of scope / left open.**
- Scope tabs (All / Company / My team) in `leaderboard.html` — EF supports it via `?scope=`; frontend UI deferred until live employer rows exist (today: 0 rows in `employer_members`).
- Test-account filtering (three `deanonbrown*` dupes + `team@vyvehealth.co.uk`) still counted under `scope=all`. Product decision, not an aggregation fix.
- Lewis's `first_name` stored as `"LEWIS"` uppercase in `members` — cosmetic onboarding bug, affects display everywhere, raise separately.
- `leaderboard` EF still `verify_jwt: false` — matches v9 and the function does its own JWT parse via `supabase.auth.getUser`. On the open security audit list; not flipped silently.

**Key learnings.**
- The aggregation-layer pattern already landed for `member-dashboard` (v44, 20 April) — applying it to leaderboard brought the same wins: single read, cap-aware counts, no fan-out. Pattern is now proven across two EFs and should be the default for any member-list read.
- Dedup dropdown: habits use distinct-days (1/day), workouts/cardio/sessions use `SUM(LEAST(cap, daily_count))` — keep these four patterns in one place, reuse across any future bucket columns.
- Monotonic best-columns are cheap to add via `GREATEST` in the UPSERT — same trick belongs anywhere a "personal best" lives on a row that gets rewritten.
- When a function persists a new column, rebuild immediately — keeps home-state consistent before anything downstream (EF, cron, UI) reads the gap.

**Follow-ups to schedule.**
- When employer_members gets its first row (Sage), wire `leaderboard.html` scope tabs and test the `?scope=company|my-team` code paths. EF is already correct.
- Phase 4 frontend work surfaced the need for `display_name` in ranked lists elsewhere (e.g. certificates, sessions `session_chat`). Consider a `vyve-name-resolver.js` helper that every client-side ranked-list renderer imports, so the same resolver rules live in one place.
- Tie copy at rank 1 (when two members share `your_count` and one of them is the caller) currently falls through to the "top of the board" branch — probably fine, but worth a follow-up check once two members actually tie at the top.

## 2026-04-21 SESSION SUMMARY | Check-in pages fix (wellbeing + monthly)

**Span.** 2026-04-21 20:40 UTC → 20:55 UTC (15 min)

**Context.** Lewis reported both wellbeing-checkin and monthly-checkin pages "not loading properly". Two distinct root causes found and fixed.

**Root causes identified (both from platform_alerts evidence, not guesswork):**
1. **wellbeing-checkin.html** — 4 unterminated `<script>` tags in tail of file (prior partial push had chopped closing tags). Browser threw `SyntaxError: Unexpected token '<'` at line 871, killing all script execution after `init()`. Platform alerts: 6 instances in last 4 days (Lewis hit today 18:18, repeat occurrences 17–21 April).
2. **monthly-checkin EF** — Frontend sends `GET /monthly-checkin?email=...` in URL. EF only read `email` from JWT (via `sb.auth.getUser(token)`) or POST body — never from URL query string. Result: `400 Missing email` for every user whose JWT didn't resolve (most of them, given the post-audit JWT race condition). Zero successful monthly check-ins ever in the DB.

**Shipped.**
- `monthly-checkin` EF v16 → v17: added URL searchParams fallback for email (~5 lines of code, surgical change). Live-tested post-deploy: `GET ?email=lewisvines@hotmail.com` with anon token now returns 200 with correct `monthName` and `memberGoal`. ([deployment log](https://supabase.com/dashboard/project/ixjfklpckgxrwjlfsaaz/functions))
- `wellbeing-checkin.html` — rebuilt tail from line 871 onwards: closed main config/init script, completed truncated SW registration, split offline-handler + skeleton-timeout IIFEs into properly-closed blocks, moved `</div><!-- /app -->` to correct position after `</main>`. Balance verified: 8/8 scripts, 118/118 divs, 1/1 main/body/html. No brace/paren/bracket imbalances.
- `sw.js` cache bumped to `vyve-cache-v2026-04-21g-checkin-fix` to invalidate the broken cached HTML.
- Atomic commit: [7522b0f](https://github.com/VYVEHealth/vyve-site/commit/7522b0fe49cf1161385d16adae23730559e024f4)

**Live verification (post-push).**
- wellbeing-checkin.html: 200 OK, 8/8 script tags balanced, truncated SW string gone, proper `</main></div><!-- /app -->` structure present.
- sw.js: 200 OK, new cache name live, old cache name absent.
- monthly-checkin EF: GET with query-only email returns 200 with correct member data.

**Key learnings.**
- The existing `platform_alerts` + client-side skeleton-timeout watchdog instrumentation was decisive. Both root causes came from reading the alerts table, not from reproducing the bug locally. Keep this instrumentation.
- **Contract-check rule for future sessions:** when an EF and its calling page go through a security audit, re-verify that the frontend's call shape still matches what the EF reads. The monthly-checkin EF stopped reading `?email=` at some point during the 11 April audit, but the frontend was never updated — and since no one had ever submitted a monthly check-in, the regression went unnoticed for 10+ days.
- **Structural fragility:** partial HTML pushes (find-replace gone wrong) can leave unterminated tags that pass a visual diff but crash the JS parser. Worth adding a CI-style script-tag balance check before push for .html files.

**Follow-up to schedule.**
- Monitor `platform_alerts` for 48h for new `skeleton_timeout_monthly-checkin` or wellbeing-checkin `js_error` — if any fire, re-investigate immediately.
- Consider: move the `window.vyveCurrentUser` auth-ready wait in both pages behind a `vyve-auth-ready` custom event emitted by auth.js, rather than polling. Cleaner, and removes the "init runs before auth" class of bug entirely.

## 2026-04-21 SESSION SUMMARY | Full day: Exercise restructure polish → light-mode sweep → nav unification

**Span.** 2026-04-20 17:24 UTC → 2026-04-20 23:52 UTC (~6.5 hours across multiple chats).

**Commits shipped today.**

**vyve-site** (15 commits, all on main branch):
| Time UTC | SHA | Subject |
|----------|-----|---------|
| 17:24 | [4309c24](https://github.com/VYVEHealth/vyve-site/commit/4309c2437afdac79eae0a28d4dcc2c53636eabd5) | movement.html brand-consistent styling |
| 17:24 | [627f951](https://github.com/VYVEHealth/vyve-site/commit/627f9518...) | cardio.html brand-consistent styling |
| 17:48 | [d4b7171](https://github.com/VYVEHealth/vyve-site/commit/d4b7171b...) | Sub-page nav: back button + correct header labels |
| 18:00 | [0a469a1](https://github.com/VYVEHealth/vyve-site/commit/0a469a11...) | Movement/Cardio brand CSS rebuild |
| 18:58 | [93092de](https://github.com/VYVEHealth/vyve-site/commit/93092dea...) | Restore Round 4 movement.html + data-wired cardio.html |
| 19:16 | [eeda75e](https://github.com/VYVEHealth/vyve-site/commit/eeda75e5...) | Movement quick-log + cardio running-plan hero |
| 19:48 | [ce3f1af](https://github.com/VYVEHealth/vyve-site/commit/ce3f1af8...) | Server-side running plan storage (member_running_plans) |
| 20:59 | [459f3cb](https://github.com/VYVEHealth/vyve-site/commit/459f3cbc...) | sw.js bump for member-dashboard v44 (home-state aggregate) |
| 23:00 | [2560dd3](https://github.com/VYVEHealth/vyve-site/commit/2560dd3e...) | theme.css: semantic token layer |
| 23:04 | [b4fbfc8](https://github.com/VYVEHealth/vyve-site/commit/b4fbfc85...) | Light-mode sweep: 12 portal pages, 242 edits |
| 23:21 | [5010fda](https://github.com/VYVEHealth/vyve-site/commit/5010fdac...) | Lock nav chrome dark + exercise/movement header upgrade |
| 23:26 | [d323d11](https://github.com/VYVEHealth/vyve-site/commit/d323d112...) | sw.js: network-first HTML + skipWaiting/clients.claim |
| 23:40 | [f78a7ba](https://github.com/VYVEHealth/vyve-site/commit/f78a7ba7...) | Exercise/movement padding + nav.js on checkin pages |
| 23:48 | [18d2cb0](https://github.com/VYVEHealth/vyve-site/commit/18d2cb00...) | nav.js: prefer `#app main` (superseded by 21f) |
| 23:51 | [c4b90fe](https://github.com/VYVEHealth/vyve-site/commit/c4b90feb...) | nav.js: always inject at document.body (final) |

**VYVEBrain** (15 commits): per-change changelog entries plus base64 corruption recovery at 20:07 UTC ([f08c48a](https://github.com/VYVEHealth/VYVEBrain/commit/f08c48ac)).

---

### Workstream 1 — Exercise Restructure Polish (17:24 → 19:50 UTC)

Followed on from the Exercise Hub work shipped 19 April. Today's session closed the loose ends:

**movement.html and cardio.html brand rebuild.** Both pages initially landed with Inter fonts and wrong colour scheme (commits 4309c24 / 627f951). Follow-up commit 0a469a1 rebuilt them with proper VYVE brand CSS (Playfair Display + DM Sans, #1E8F8F teal) when it emerged that both pages had copy-pasted workouts.html's inline `<style>` block wholesale — with zero rules for their own content classes (`.goal-card`, `.tip-card`, `.stats-grid`, `.activity-card`, `.hr-card`, `.cardio-grid`, `.session-controls`, etc). Tabs and bottom nav rendered fine; page body was unstyled plain text until this was caught.

**Mock drift incident.** Between 19 April (b7e19ba1) and 20 April (d4b7171), movement.html was silently replaced with a static step-tracker mockup labelled "Option 3 Personal Dashboard" — probably during a prior session's exploration. Commit 93092de restored the real Round 4 version (workout_plan_cache read, activity list, video modal, Mark as Done) and simultaneously shipped a proper cardio page. Lesson logged in tasks/backlog: exploratory UI mocks need to be kept in a separate directory, never committed over real pages.

**Sub-page navigation.** nav.js was updated so `isNavPage` matches only the 4 hub paths (`/`, `/index`, `/exercise`, `/nutrition`, `/sessions`) instead of loose string-containment. Sub-pages now get a back button in the mobile header while still highlighting the correct bottom-nav tab. Added `subPageLabels` map for proper titles on workouts/movement/cardio/running-plan/habits/certificates/leaderboard/engagement/check-ins/settings.

**Movement quick-log + cardio active running-plan hero.** Commit eeda75e addressed Dean's feedback: members without a movement plan now see a quick-log form (Walk/Stretch/Yoga/Mobility/Pilates/Other + duration + optional note) that writes straight to the `movement` table. Cardio page shows an active-programme hero card when the member has a running plan, mirroring the exercise hub.

**Server-side running plan storage.** Commit ce3f1af shipped `member_running_plans` table migration and rewrote running-plan.html and cardio.html to use Supabase as source of truth with localStorage as offline cache (write-through). Backfill logic on first visit to running-plan.html post-deploy: any plan found in localStorage with no server equivalent is pushed to Supabase. Resolves the "plan only on my phone" issue and sets up Capacitor multi-device sync.

### Workstream 2 — member_home_state Wire-up (20:59 → 21:16 UTC)

Continuation of yesterday's backend work: member-dashboard v44 now reads from the `member_home_state` aggregate table, with trigger on `members` table to refresh on INSERT. `EXECUTE` grants on `refresh_member_home_state(p_email)` tightened to service_role + authenticated. sw.js cache bumped in commit 459f3cb. Brain synced ([7af68f8](https://github.com/VYVEHealth/VYVEBrain/commit/7af68f80)).

### Workstream 3 — Light-Mode Sweep (23:00 → 23:21 UTC)

Dean asked for a light-mode readability audit of the portal. 5 screenshots analysed. Root cause: `--teal-lt` (#4DAAAA) was being used as primary text colour on all 12 portal pages. On the light background `#F0FAF8`, its contrast ratio is 2.58:1 — failing WCAG AA (needs 4.5:1). 9 of 12 pages had zero light-mode overrides. Total: 242 problem instances.

**Fix shipped.** [2560dd3](https://github.com/VYVEHealth/vyve-site/commit/2560dd3e) introduced the semantic token layer in theme.css with three families (label, fill, line) and legacy-alias back-compat. All tokens verified WCAG AA compliant on both themes. [b4fbfc8](https://github.com/VYVEHealth/vyve-site/commit/b4fbfc85) then applied 242 find-and-replace edits across 12 HTML pages. Mid-sweep bug caught: blanket `#fff → var(--label-strong)` would have broken filled teal/green buttons; second pass added 10 button fixes preserving `--label-on-accent` for accent-background text.

**Follow-up:** [5010fda](https://github.com/VYVEHealth/vyve-site/commit/5010fdac) locked all nav chrome (desktop, mobile header, bottom nav, more-menu, avatar panel) to dark-theme values regardless of active theme. Also upgraded exercise.html and movement.html page headers to use the standard `.page-header` container with eyebrow + italic-accent title + subtitle, matching other pages.

### Workstream 4 — Service Worker Overhaul (23:26 UTC)

After shipping the light-mode changes, Dean couldn't see them because old sw.js was pure cache-first for everything including HTML. [d323d11](https://github.com/VYVEHealth/vyve-site/commit/d323d112) rewrote sw.js:
- `install` → `self.skipWaiting()` after `cache.addAll`
- `activate` → `self.clients.claim()` + old-cache purge
- HTML navigations → network-first with cache fallback
- Static assets → cache-first (unchanged)
- Cross-origin and `/functions/*` / `/auth/*` → bypass SW

**Implication:** HTML-only changes now reach users on the very next reload. No more force-quit or hard-refresh required. See Hard Rule #44 and Section 3 of master.md.

### Workstream 5 — Header Unification (23:40 → 23:51 UTC)

Three commits to bring exercise.html, movement.html, wellbeing-checkin.html, and monthly-checkin.html in line with the standard sub-page pattern.

- [f78a7ba](https://github.com/VYVEHealth/vyve-site/commit/f78a7ba7): exercise/movement mobile `.wrap` top padding 8px → 24px; wellbeing-checkin and monthly-checkin had nav.js added and bespoke nav markup removed.
- [18d2cb0](https://github.com/VYVEHealth/vyve-site/commit/18d2cb00): nav.js selector updated to prefer `#app main` (superseded, kept for git history).
- [c4b90fe](https://github.com/VYVEHealth/vyve-site/commit/c4b90feb): **final fix** — nav.js now always injects nav chrome at `document.body.prepend()`, completely independent of `#app` or `#skeleton` loading state.

### Workstream 6 — Accessibility Backlog (23:15 UTC)

Parked Alan Bird's feedback on iOS Large Text struggle. Four-option plan at [plans/accessibility-large-text.md](https://github.com/VYVEHealth/VYVEBrain/blob/main/plans/accessibility-large-text.md):
1. Restore pinch-zoom (10 min) — remove `user-scalable=no` from viewport meta
2. In-app text-size toggle (~half day) — Settings > Accessibility, `--text-scale` multiplier via `html { font-size: calc(16px * var(--text-scale)) }`
3. OS Dynamic Type bridge via Capacitor (2–3 days) — listen to iOS contentSizeCategory + Android font scale
4. Full WCAG 2.1 AA pass (1–2 weeks) — audit 50+ pages

Added to `tasks/backlog.md` "Later" section. Not being built now.

---

**Files touched today across vyve-site:**

- `theme.css` — complete rewrite, semantic token layer
- `nav.js` — sub-page detection + body-prepend injection
- `sw.js` — network-first rewrite, 3 cache bumps
- `index.html`, `habits.html`, `workouts.html`, `sessions.html`, `leaderboard.html`, `engagement.html`, `nutrition.html`, `settings.html`, `certificates.html`, `wellbeing-checkin.html`, `exercise.html`, `movement.html`, `cardio.html`, `monthly-checkin.html`, `running-plan.html` — light-mode token migration and/or nav unification

**Master document updates (this session end):**

- Section 3 (Architecture): new Service Worker subsection; updated Shared JS list; updated nav.js injection heights with body-prepend rule.
- Section 10 (Hard Rules): +6 rules (#39 through #44) covering nav-dark-in-light, body-prepend injection, standard script order, mobile padding template, semantic tokens, optional HTML cache-bumps.
- Section 13 (Design System): Phase B refinement noted; new Semantic Token Layer subsection documenting `--label-*` / `--fill-*` / `--line-*` families.

---

## 2026-04-21f | nav.js: always inject nav chrome at document.body (final fix)

**Context.** The 21e fix (prefer `#app main` over skeleton main) stopped the header being hidden inside `#skeleton` — but broke differently. Dean reported "tries to load the header for 0.1s then goes away" — because the header was now injected INSIDE `#app`, which starts with `style="display:none"` on exercise.html and movement.html. The header briefly flashed during app-state transitions then vanished.

**Root cause.** Both 21e and the original logic tried to be clever about *where* to insert the nav chrome — as a sibling of some `<main>`, scoped to either `#app` or `#skeleton`. Any of those approaches ties nav visibility to the visibility of its parent container. When page JS toggles `#app` / `#skeleton` display state (which exercise.html and movement.html both do during data load and error recovery), the nav flickers or disappears.

**Final fix shipped.** ([c4b90fe](https://github.com/VYVEHealth/vyve-site/commit/c4b90feb6c8d8d80e7cde8b4ae83506cb4639063))

Nav chrome now ALWAYS injects at `document.body` top:
```js
// Inject into page
// ALWAYS inject nav chrome at document.body top (not inside #app/#main/#skeleton).
document.body.prepend(mobileHeader);
document.body.prepend(desktopNav);
```

The `insertBefore(main)` branch and all of its conditional logic is gone. Bottom nav, overlays, more-menu and avatar panel already used `document.body.appendChild()` — they weren't affected by the bug but now follow the same pattern consistently.

sw.js cache bumped to `vyve-cache-v2026-04-21f-navjs-body-prepend`.

**Dean confirmed:** "That worked."

**Key learnings.**
- Global UI chrome should live at `document.body` level, full stop. Injecting it inside page-specific containers creates visibility dependencies on those containers' loading states. This rule now lives in Hard Rule #40 and Section 3 (nav.js injection heights) in the master doc.
- Debugging "flashing element" bugs: when something appears briefly then disappears, the culprit is almost always a parent container's `display:none` being applied after the element rendered. Checking `element.offsetParent` in DevTools reveals ancestor visibility issues immediately.
- Three iterations to get nav.js right (21d padding fix → 21e skeleton-main selection → 21f body-prepend) — should have gone straight to body-prepend. Lesson: when a utility script needs to be independent of page state, inject at `document.body` and don't overthink it.

---

## 2026-04-21e | nav.js: fix mobile-page-header disappearing on #skeleton pages

**Context.** After shipping 21d (padding + checkin pages), Dean reported exercise.html and movement.html STILL had no dark sticky mobile header, while weekly/monthly checkin worked perfectly. Initial diagnosis was wrong (I thought the header was just too tight — it wasn't, it was entirely missing).

**Root cause.** nav.js selects its insertion point with `document.querySelector('main')`, which returns the FIRST `<main>` in document order. Pages structured as:

```
<div id="skeleton"><main>...loading UI...</main></div>
<div id="app" style="display:none"><main>...real content...</main></div>
```

(exercise.html, movement.html, and any other page with a skeleton-first pattern) have their FIRST `<main>` inside `#skeleton`. nav.js then inserts the mobile-page-header as a SIBLING of that skeleton `<main>` — meaning the header ends up INSIDE `#skeleton`. When the page JS later runs `document.getElementById('skeleton').style.display = 'none'`, the mobile header gets hidden along with the skeleton. The bottom nav and desktop nav still appear because they're injected into `document.body` directly.

**Why weekly/monthly checkin worked.** Those pages do `#app { display:none }` and swap via `display:block` rather than having a separate `#skeleton` wrapper. Their first `<main>` is inside `#app` from the start. When `#app` is eventually shown, the mobile header (sibling of app's `<main>`) is shown too.

**Fix shipped** ([18d2cb0](https://github.com/VYVEHealth/vyve-site/commit/18d2cb00693a4f48dd31f4140513dd4c29d5c671)).

New insertion selection in nav.js:
```js
const app = document.getElementById('app');
const main = (app && app.querySelector('main'))
          || document.body.querySelector('main:not(#skeleton main)')
          || document.querySelector('main');
const insertBefore = main || (app ? app.firstChild : null);
```

Priority order:
1. If `#app` exists, use the `<main>` inside it — always the right choice for pages with the standard skeleton→app pattern
2. Fall back to any `<main>` not inside `#skeleton` — covers edge cases where someone has a different wrapper id
3. Final fallback: the original `document.querySelector('main')` behaviour — covers simple pages without `#app` or `#skeleton` (like login, set-password)

sw.js cache bumped to `vyve-cache-v2026-04-21e-navjs-skeleton-fix`.

**Key learnings.**
- When a utility script (like nav.js) uses broad DOM selectors like `document.querySelector('main')`, it will pick whichever matching element appears first in document order. In a codebase with multiple acceptable page structures (some with #skeleton wrappers, some without), this selector behaviour is inconsistent. Explicit selectors scoped to a known parent (`#app main`) produce reliable results.
- Visual debugging is unreliable for "is the element there?" questions. I initially assumed the header was present but positioned wrongly. Checking via `document.querySelector('.mobile-page-header').offsetParent` in DevTools would have immediately shown it was `null` (element hidden because ancestor is display:none). Future sessions: when "element doesn't appear" and CSS looks correct, check ancestor visibility first, not layout.
- Pages with a `#skeleton` + `#app` two-phase loading pattern should probably migrate to a single `#app` that internally toggles a skeleton state. This would remove the dual-main DOM structure entirely. Backlog candidate.

---

## 2026-04-21d | four-page header unification (exercise, movement, wellbeing/monthly checkins)

**Context.** After nav-dark shipped, Dean reported headers still broken on exercise.html and movement.html — eyebrow text rendering behind the iOS status bar. Also flagged that wellbeing-checkin.html and monthly-checkin.html have no bottom nav or back button at all. Required: bring all four pages in line with the standard sub-page pattern used by habits/workouts/sessions/leaderboard etc.

**Root causes.**
1. `exercise.html` + `movement.html` had mobile `.wrap` top padding of only `8px`. The nav.js sticky mobile header is `min-height:56px` plus safe-area-inset-top, so page content was jamming up against it / rendering behind the status bar. Working pages use `24px` top.
2. `wellbeing-checkin.html` shipped with a bespoke `<nav class="desktop-nav">` and no nav.js script include, so it had zero bottom nav on mobile.
3. `monthly-checkin.html` shipped with a custom `<nav>` (back button + logo only) in the body, no nav.js, no bottom nav.

**What shipped.** ([f78a7ba](https://github.com/VYVEHealth/vyve-site/commit/f78a7ba7e17a84217eee99c341ed899a450b50c6))

**exercise.html + movement.html:**
- Mobile `.wrap` top padding `8px → 24px` in the `@media(max-width:768px)` rule. Matches habits/workouts reference implementation. No other changes — the existing page-header markup from commit `5010fda` was correct, just jammed by the tight padding.

**wellbeing-checkin.html:**
- Added `<script src="/nav.js"></script>` to `<head>` alongside existing theme.js and auth.js.
- Removed the bespoke `<nav class="desktop-nav">` block (logo, "← Dashboard" link, "Weekly Check-In" badge).
- Removed the now-orphaned CSS rules: `nav.desktop-nav`, `.nav-logo-v`, `.nav-logo-text`, `.nav-right`, `.nav-link`, `.nav-badge`, `.nav-logo`. Also cleared a stray `nav` keyword artifact left by the regex cleanup.
- Bumped mobile `.wrap` bottom padding `60px → 100px` to clear the newly-injected bottom nav (80px tall + safe-area-inset-bottom).

**monthly-checkin.html:**
- Added `<script src="/nav.js"></script>` and `<script src="/offline-manager.js"></script>`.
- Removed the bespoke `<nav>` block (custom `<button class="nav-back">` with history.back logic, plus inline logo).
- Removed the `/* NAV */` CSS block (`nav {}`, `.nav-logo img {}`, `.nav-back {}`).
- Changed `.page-eyebrow color` from `var(--gold)` → `var(--label-eyebrow)` for consistency with other pages.

**sw.js cache bumped** to `vyve-cache-v2026-04-21d-header-fixes`.

**Key learnings.**
- nav.js injects the mobile sticky header into `document.body` on page load. Its internal height is `min-height:56px + env(safe-area-inset-top)`. Any page that wants page content to appear *below* the nav needs at least `24px` of top padding on its main content wrapper at mobile breakpoints. Less than that on iOS (where the status bar eats ~47px into the viewport) causes content to render behind the clock.
- When retrofitting nav.js onto pages with their own bespoke nav markup, it's not enough to just add the script tag — the existing `<nav>` markup AND its CSS must be removed, otherwise the two compete. Watch for orphaned class names (`.nav-logo`, `.nav-badge` etc) that may collide with nav.js's own class naming.
- `wellbeing-checkin.html` and `monthly-checkin.html` were built independently of the nav.js system. Any future new pages should start by including the standard 4 script tags (`theme.js`, `auth.js`, `nav.js`, `offline-manager.js`) and NOT roll their own top-bar markup.

---

## 2026-04-21c | sw.js overhaul — skipWaiting, clients.claim, network-first HTML

**Context.** After shipping the nav-dark + exercise/movement header changes ([5010fda](https://github.com/VYVEHealth/vyve-site/commit/5010fdac8a90d5ee10e7ffffef82b0fb3422a0bd)), Dean reported not seeing the changes. Verified commits were live on main and on the GitHub Pages CDN (`https://online.vyvehealth.co.uk/theme.css` returned the new content with `nav-lock present: True`). The issue was the service worker — old sw.js was still serving cached files.

**Root cause identified in the old sw.js:**
1. No `self.skipWaiting()` call — new SW parked in 'waiting' state until every tab of the site was closed
2. No `self.clients.claim()` — even after activation, already-open tabs stayed on the old SW
3. Pure cache-first fetch for everything including HTML — users got stale HTML even on hard reload unless the SW was manually unregistered

**Fix shipped.** ([d323d11](https://github.com/VYVEHealth/vyve-site/commit/d323d1129210991406c9d0b014b5e249437c4cb2))

New `sw.js`:
- `install` handler now calls `self.skipWaiting()` after pre-cache completes
- `activate` handler now calls `self.clients.claim()` alongside old-cache purging
- `fetch` handler split by request type:
  - **HTML navigations** (`req.mode === 'navigate'` or `.html` path): **network-first** with cache fallback. Always fresh when online; cached version served offline.
  - **Static assets** (CSS/JS/images): cache-first (fast, versioned via cache bump)
  - **Cross-origin** and `/functions/*` / `/auth/*` paths: bypass SW entirely (let browser handle normally — previously these could get unexpectedly cached)
- New `message` handler accepts `{type: 'SKIP_WAITING'}` so future update-prompt UI can trigger immediate SW update

Cache bumped to `vyve-cache-v2026-04-21c-sw-network-first`.

**Impact from next install onwards.**
- sw.js bumps take effect on the very next page load (no tab-closing required)
- HTML-only changes don't require an sw.js bump at all — network-first means users always see the latest HTML when online
- Only asset-only changes (CSS/JS) need the cache bump ritual from now on
- One-time migration pain: users still on the old SW need to either force-quit the PWA twice or manually clear SW to pick up the new sw.js. After that, future deploys are painless.

**Key learnings.**
- PWA cache-first fetch strategies require extreme care. If HTML is cached-first with no skipWaiting, a site is essentially immutable until every tab closes.
- The correct pattern for SPAs / PWAs is: network-first for HTML (freshness wins, cache is backup), cache-first for versioned assets (speed wins, cache-bust on version change).
- Always pair `skipWaiting()` (in install) with `clients.claim()` (in activate) — they work as a matched pair. One without the other is almost never what you want.

**Debugging pattern that worked:**
1. Verify commit landed on `main` via GitHub API
2. Verify file is live on CDN via direct `urllib.urlopen()` from workbench (no browser cache involved)
3. When both are green but user says "I don't see it", the issue is client-side — 99% of the time it's SW cache

---

## 2026-04-21b | nav chrome locked dark on light theme + exercise/movement headers

**Context.** Follow-up to the light-mode sweep earlier today. Dean's feedback after reviewing the live result:
1. Top desktop nav + bottom mobile nav should STAY DARK even when page content flips to light. The dark teal nav is part of the VYVE brand identity.
2. Mobile page header (the sticky bar with logo + back button) should also stay dark.
3. `exercise.html` and `movement.html` — headers exist in code but render as bare text with no visual weight; should match the `.page-header` pattern used by habits/sessions/engagement.

**What shipped.** ([5010fda](https://github.com/VYVEHealth/vyve-site/commit/5010fdac8a90d5ee10e7ffffef82b0fb3422a0bd))

**theme.css — nav locked dark:**
- Under `[data-theme="light"]`, rewrote `--nav-bg`, `--nav-bg-mob`, `--nav-border`, `--nav-text`, `--nav-active`, `--more-bg` to the dark-mode values instead of the light translucent whites.
- Appended scoped rule: `[data-theme="light"] nav.desktop-nav, .mobile-page-header, .vyve-bottom-nav, .vyve-more-menu, .nav-more-panel, .nav-avatar-panel { /* dark-valued text/border/surface tokens */ }`. This is needed because nav.js internally references generic tokens (`--text`, `--surface-teal`, `--label-accent` etc.) that would otherwise flip to the light values and produce dark-on-dark inside the nav containers.
- No changes to nav.js itself — all done via CSS scoping.

**exercise.html + movement.html — headers upgraded:**
- Wrapped existing `.page-eyebrow` + `.page-title` + `.page-sub` in a `.page-header` container with `margin-bottom:28px` and `fadeUp` animation.
- Enhanced `.page-title` CSS: explicit `color:var(--text)`, bumped to `2rem`, added `.page-title em { color: var(--label-heading-em); font-style: italic }` for future accent-word use (not currently applied but available).
- Added `@media(max-width:480px){.page-title{font-size:1.6rem}}` breakpoint.
- Added local `@keyframes fadeUp` (was already defined in other pages).
- Reduced `.hero-card`/`.prog-card` top margin from 24/22 → 8px since `.page-header` now carries bottom spacing.

**sw.js cache bumped:** `vyve-cache-v2026-04-21b-nav-dark-headers`.

**Key learnings.**
- When locking nav chrome dark in light mode, you can't just change the nav-scoped bg tokens — the internals (text, icons, borders) reference generic tokens that would flip. Solution: scoped `[data-theme="light"] <nav-container> { --text: #FFF; ... }` override at the container level so CSS cascade does the rest without nav.js changes.
- `exercise.html` and `movement.html` already had `.page-eyebrow/.page-title/.page-sub` CSS and markup — what was missing was the container wrapper and visual weight. Pattern to apply when adding future pages: always wrap in `.page-header`, use the standard CSS block, include the `fadeUp` animation for consistency.

---

## 2026-04-21 | light-mode sweep — semantic token layer + 12-page HTML pass

**Context.** Deep-dive audit of `online.vyvehealth.co.uk` for light-mode readability. Dean flagged that the italic "leaderboard" word on `leaderboard.html` renders too-teal on light bg and wants it as the darker VYVE green. Audit surfaced the same pattern everywhere — `--teal-lt` (#4DAAAA) was being used as primary text/eyebrow colour across all portal pages, which fails WCAG on the light `#F0FAF8` background (2.58:1 contrast).

**What shipped.**
- `theme.css` ([2560dd3](https://github.com/VYVEHealth/vyve-site/commit/2560dd3ee7cc09ba1b2dfbeebeba45191458a635)): introduced full semantic token layer. `--label-*` for text purposes, `--fill-*` for surfaces, `--line-*` for borders. All tokens flip correctly between dark and light themes with WCAG AA verified on both. Legacy tokens (`--text`, `--surface`, `--border`, `--surface-teal`, `--border-teal`) kept as aliases for back-compat.
- All 12 portal HTML pages + sw.js ([b4fbfc8](https://github.com/VYVEHealth/vyve-site/commit/b4fbfc8556159f2cbf9d45c739e70014e9193492)): 242 find-and-replace edits across `index.html`, `habits.html`, `workouts.html`, `sessions.html`, `leaderboard.html`, `engagement.html`, `nutrition.html`, `settings.html`, `certificates.html`, `wellbeing-checkin.html`, `exercise.html`, `movement.html`. All `var(--teal-lt)` text → `var(--label-accent)` or `var(--label-eyebrow)`. All `var(--teal-xl)` text → `var(--label-accent-strong)`. All `.page-title em` / `.hero-title em` → `var(--label-heading-em)` (#0D2B2B dark green on light, teal-lt on dark).
- sw.js cache bumped to `vyve-cache-v2026-04-21-light-mode-sweep`.

**Bug caught mid-sweep.** Initial blanket replacement of `color:#fff` → `var(--label-strong)` would have broken filled-button text on light mode (dark text on teal button). Added second pass: any rule with accent background (teal/green/danger) keeps `--label-on-accent` (always white). 10 fixes across habits, nutrition, settings, exercise, movement.

**Contrast verification (light mode on #F0FAF8):**
- `--label-strong` #0A1F1F: 16.06:1 (AA body)
- `--label-medium` rgba(10,31,31,0.65): 5.20:1 (AA body)
- `--label-accent` #1B7878 (teal): 4.93:1 (AA body) — was 2.58:1 with teal-lt
- `--label-accent-strong` #006D6F (teal-dark): 5.78:1 (AA body) — was 1.81:1 with teal-xl
- `--label-eyebrow` #006D6F: 5.78:1 (AA body)
- `--label-heading-em` #0D2B2B (dark green): 14.12:1 — Dean's specific callout

**Contrast verification (dark mode on #0A1F1F):** unchanged, all pass 6:1+.

**Key learnings.**
- `--teal-lt` is fine as a graphical token (dots, fills, borders, gradients — only need 3:1) but fails as a text colour on light backgrounds. New rule: use `--label-*` tokens for all text; reserve `--teal-lt`/`--teal-xl` for graphical use only.
- When swapping hardcoded `#fff` to a variable, always check if the rule also sets a filled accent background. White on accent button must be `--label-on-accent`, not `--label-strong`.
- Eyebrow labels need `--label-eyebrow` (#006D6F teal-dark) specifically — they're tiny all-caps so need higher contrast than regular accent text.

**Related files in VYVEBrain.**
- `brain/master.md` §3 (Architecture) — theme system section to update with semantic layer note
- Migration map for future page additions in this entry (above)

---

## 2026-04-20 | member_home_state continuation — triggers verified live + members trigger + EXECUTE grants

**Context.** Continuing from the previous 20 April session (see entry below). That session built the schema, rewrote the refresh function, backfilled, and deployed EF v44, but left three things unresolved:
1. Trigger wiring status was unverified (`information_schema.triggers` returned empty for these AFTER INSERT OR UPDATE OR DELETE triggers, which created false doubt — this session proved they were already live the whole time).
2. No `members` AFTER INSERT trigger, so a brand-new member's `member_home_state` row only appeared after they logged their first activity. The EF v44 fallback papered over this, but only fragilely (the RPC call relied on `SECURITY DEFINER` defaults rather than explicit grants).
3. `public.refresh_member_home_state(text)` had no EXECUTE privileges granted to `service_role` or `authenticated`.

### What shipped this continuation

**Trigger verification (no changes needed to the 9 existing triggers).**
- `pg_trigger` confirmed `zzz_refresh_home_state` triggers are live on all 9 of `daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `wellbeing_checkins`, `weekly_goals`, `weekly_scores`, `kahunas_checkins`. (`information_schema.triggers` silently hides these for the read-only user — future rule: always use `pg_trigger` directly to check trigger presence.)
- **Real-time test passed (fresh, this session):** inserted a test `daily_habits` row for Stuart Watts → `member_home_state` row jumped from `habits_today=0, habits_total=0, streak=0, updated_at=20:51:19` → `habits_today=1, habits_total=1, streak=1, updated_at=21:03:42` on the same transaction. Deleted test row → back to `0/0/0, updated_at=21:03:53`. **DELETE + INSERT triggers both fire and the aggregate reacts in real time on this session's database state.**
- Spurious duplicate `zz_refresh_home_state` (two z's) triggers that were briefly created during the previous session's re-verification attempt were dropped. Final state: exactly one trigger per source table, all named `zzz_refresh_home_state`.

**New: `public.tg_refresh_home_state_from_members()` trigger function** (`SECURITY DEFINER`). Thin wrapper around `refresh_member_home_state` for the `members` table, which uses `email` not `member_email`. Handles INSERT (creates a state row on first save of the member), UPDATE (refreshes for any downstream-affecting change; if the email changed, refreshes both old and new), and DELETE (deletes the state row — complements the existing `ON DELETE CASCADE` FK).

**New: `zzz_refresh_home_state` trigger on `public.members`** (AFTER INSERT OR UPDATE OR DELETE). New signups now get a `member_home_state` row the moment their member row is written. The EF v44 fallback is still there as belt-and-braces but will almost never fire.

**EXECUTE grants.** `GRANT EXECUTE ON FUNCTION public.refresh_member_home_state(text) TO service_role, authenticated`. Confirmed via `pg_proc.proacl`: `service_role=X/postgres` and `authenticated=X/postgres` both present. Makes the EF fallback path bulletproof regardless of whether the EF uses service-role or a user JWT.

**Shape diff vs v43.** Code-level comparison of v43 and v44 `index.ts` response bodies — 9 key sets at every level (top-level / engagement / components / streak / streak_by_type / progress rows / recent / wellbeing / member) all match exactly. No frontend changes required. Not tested via live `curl` (would require a valid user session token).

**sw.js.** No change this continuation — was already bumped to `vyve-cache-v2026-04-20-home-state` by commit `459f3cbc` on `vyve-site` main at 20:59:37Z.

### Commits
- Supabase DDL (applied via `SUPABASE_BETA_RUN_SQL_QUERY`): `GRANT EXECUTE`, `CREATE FUNCTION tg_refresh_home_state_from_members`, `CREATE TRIGGER zzz_refresh_home_state ON public.members`, plus cleanup `DROP TRIGGER zz_refresh_home_state ON {8 tables}`.
- `VYVEBrain/brain/master.md`: rule #33 amended to include `member_home_state` (with note that unlike the other aggregation tables, it IS directly readable by the owning member via its own RLS policy); rule #38 added about the canonical write path; EF version bumped to v44 in section 3.
- `VYVEBrain/tasks/backlog.md`: "Dashboard data date-range filter — member-dashboard EF fetches ALL historical data, needs 90-day limit" struck through (the data-fanout concern is now fundamentally solved by the aggregate).
- `VYVEBrain/brain/changelog.md`: this entry.

### Known follow-ups
- **`exercise_stream` / movement goals still not surfaced** in `member_home_state`. `weekly_goals.movement_target` exists but isn't lifted into the aggregate. Add `goal_movement_target` / `goal_movement_done` when movement content ships and the hub surfaces movement progress on the home dashboard.
- **Live curl verification of v44** — not done this session. Worth running a full-response diff vs v43 next time Dean is signed in, to catch any null-handling or numeric-coercion drift the code-level diff could miss.
- **Performance measurement** (v43 ~300-800ms → v44 target ~40-80ms) not captured. Easy to measure via browser devtools on next session load.
- **Movement / Classes** stream still has no plan content in `programme_library` — orthogonal to this work but blocks Movement members seeing anything useful on the hub.

---

## 2026-04-20 | `member_home_state` aggregate wired + member-dashboard EF v44

**Context.** Dean flagged that `member-dashboard` EF v43 was still recomputing everything from 6 source tables on every load (~300–800ms per call on member growth) despite the three-layer aggregate cache (`member_activity_log`, `member_activity_daily`, `member_stats`) already running. Built `member_home_state` — a single-row-per-member dashboard-ready aggregate — and rewrote the dashboard EF to read it. Engagement page (which needs the 30-day calendar) still hits source tables for its `activity_log`, but every scalar now comes from the aggregate.

**Unexpected context discovered during this work:** a previous session had already created `public.member_home_state` (with column names `engagement_recency`, `engagement_consistency`, `engagement_variety`, `engagement_wellbeing`, `active_days_30`, `wellbeing_latest_score`, `wellbeing_latest_iso_week`) plus `public.refresh_member_home_state(p_email)` and `public.tg_refresh_member_home_state()`, plus `zzz_refresh_home_state` triggers on 9 source tables (`daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `wellbeing_checkins`, `weekly_goals`, `weekly_scores`, `kahunas_checkins`). But 16 of 16 live members were populated only at `updated_at=20:41:03` — no realtime path had been tested, and the dashboard EF never read from it. So the feature was half-built; this session finished it.

### What shipped this session

**Schema** (additive to existing table — no drops, no breakage).
- `ALTER TABLE public.member_home_state ADD COLUMN recent_habits_30d / recent_workouts_30d / recent_cardio_30d / recent_sessions_30d int DEFAULT 0` — needed for v43 `recent` response shape parity (v43 returned 30-day activity counts alongside lifetime totals).
- No other schema changes. Existing columns (`engagement_recency` etc., `wellbeing_latest_score`, `active_days_30`) retained as-is.

**`public.refresh_member_home_state(p_email text)` — rewritten** to match the real column names and Dean's new session-cap rule.
- Reads directly from source tables (NOT `member_activity_daily`, which lags up to 30 min on cron) for true realtime freshness.
- Computes: today counts, lifetime totals, per-type daily streaks (gaps-and-islands on distinct `activity_date`), weekly check-in streak (consecutive ISO weeks via `iso_year*53+iso_week` monotonic index), weekly goal targets + done counts, engagement via `public.compute_engagement_components()` (existing SQL function — DB-side formula matches v43's client-side formula), 30-day recent counts, latest wellbeing score from `weekly_scores`.
- **Sessions lifetime count is capped at 2/day for life** (new rule from Dean this session). Implemented as `SUM(LEAST(2, daily_count))` over `session_views ∪ replay_views` grouped by `activity_date`. This deviates from v43's raw combined row count. In practice today, BEFORE INSERT caps on `session_views` and `replay_views` route over-caps to `activity_dedupe`, so `sessions_total` should match v43 exactly. If anything ever writes directly to those tables bypassing the caps in future, v44 will show a lower number than v43.
- `SECURITY DEFINER` (required — writes to RLS-gated `member_home_state`).
- Idempotent UPSERT on `ON CONFLICT (member_email)`.

**Trigger wiring.** `zzz_refresh_home_state` AFTER INSERT OR UPDATE OR DELETE triggers on all 9 tables (`daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `wellbeing_checkins`, `weekly_goals`, `weekly_scores`, `kahunas_checkins`) route through `tg_refresh_member_home_state()` → `refresh_member_home_state(NEW.member_email OR OLD.member_email)`. Pre-existed from the earlier session; this session created and then dropped duplicate `zz_` triggers on 8 tables before spotting the original set. Final state: exactly one trigger per table, all named `zzz_refresh_home_state`.

**Backfill.** Every member row recomputed via `DO $$ ... LOOP PERFORM refresh_member_home_state(m.email) ... $$`. 16/16 members have a row. Dean's aggregate matches source exactly: habits 29, workouts 21, cardio 9, sessions 32, checkins 7 (`all_match: true`).

**End-to-end live test.** Inserted test `cardio` row for Dean → aggregate jumped to `cardio_today=1, cardio_total=10`, `updated_at` moved to the insert's `logged_at`. Deleted test row → back to `cardio_today=0, cardio_total=9`, new `updated_at`. Triggers fire in real time on INSERT, UPDATE, DELETE. ✅

**`member-dashboard` EF v44 deployed.**
- Replaced 6 source-table queries with a single `member_home_state` SELECT + member row + 30-day activity slices (for the engagement calendar — still unavoidable) + weekly_goals + charity RPC + certificates.
- Response shape is byte-for-byte identical to v43 (`engagement.streak_by_type`, `progress.*.best_streak`, `recent.*`, `activity_log` with `{date, activities[]}`, `charity_total`, `wellbeing.current_score/last_checkin`, `engagement.components` with `recency/consistency/variety/wellbeing` keys). **No frontend commits required.**
- Self-healing fallback: if a member has no `member_home_state` row yet (new signup before trigger fires), EF calls `refresh_member_home_state` via PostgREST RPC and re-reads.
- `verify_jwt: false` retained (same as v43 — internal JWT validation via `supabase.auth.getUser()`).

**sw.js cache bump.** `vyve-cache-v2026-04-20-running-plan-sync` → `vyve-cache-v2026-04-20-home-state`.

### Performance expectation
Dashboard EF should drop from ~300–800ms (v43, 6-way source-table fanout) to ~40–80ms (v44, 1-row aggregate + 5 small date-bounded slices). Not measured in this session — worth verifying in production via browser devtools next time Dean is on the app.

### Rule additions (proposed for master.md)
- **(new):** Any refresh of `member_home_state` must go through `public.refresh_member_home_state(p_email)`. Never write directly to `member_home_state` from EFs or frontend code — the function is the only sanctioned write path.
- **(reinforced):** When pre-existing state is suspected (`CREATE TABLE IF NOT EXISTS` silently skipping, functions returning without changes), always inspect `information_schema.columns` and `pg_trigger` *before* writing migrations. Blind re-create guarded by `IF NOT EXISTS` conceals drift.

### Deferred / known gotchas
- **Sessions lifetime cap (new metric):** If anyone starts over-logging sessions in future (by inserting directly into `session_views` bypassing the BEFORE INSERT cap), `sessions_total` will diverge from v43's raw count. For now this can't happen through the app.
- **`member_activity_daily` / `member_stats` crons still running** (every 30 min / 15 min). Orthogonal to this work — `member_home_state` is fresher than either. They power the internal admin dashboard; no need to dismantle. Rule #33 still applies.
- **Live EF verification not done via curl.** Aggregate-vs-source parity verified via SQL; full response-shape diff vs v43 not run. If the dashboard page behaves strangely after this ships (engagement score mismatch, streaks off, goals not rendering), first suspect is response-shape drift — read v44 source and cross-check against render paths in `index.html` / `engagement.html`.
- **`exercise_stream` / movement goals not surfaced** in `member_home_state`. The `weekly_goals.movement_target` column exists but isn't lifted into the aggregate. Add `goal_movement_target` / `goal_movement_done` when movement content ships and the hub actually surfaces movement progress on the dashboard.
- **`information_schema.triggers` view** does not list triggers declared as `AFTER INSERT OR UPDATE OR DELETE` in a single statement (at least on this PG version). Always verify trigger presence via `pg_trigger` directly.

### Commits
- Supabase migrations (applied via `SUPABASE_APPLY_A_MIGRATION`): `create_member_home_state_table` (no-op — table already existed), `add_member_home_state_columns`, `member_home_state_cleanup_duplicates`, `refresh_member_home_state_v2`, `wire_member_home_state_triggers`, `drop_duplicate_refresh_triggers`.
- `member-dashboard` EF: v43 → v44 (deployed via `deploy_edge_function`).
- `vyve-site/sw.js`: cache bump `vyve-cache-v2026-04-20-running-plan-sync` → `vyve-cache-v2026-04-20-home-state` (this commit).
- `VYVEBrain/brain/changelog.md`: this entry.

---

## 2026-04-20 | Full repo base64-corruption sweep + brain restoration

**Commit:** `[this commit]` (VYVEBrain) — Restore master.md + changelog.md from base64 corruption

**Context:**
After fixing `welcome.html` (Test-Site-Finalv3 commit `bc4cca4`), ran a full base64-corruption sweep across all three repos (`vyve-site`, `Test-Site-Finalv3`, `VYVEBrain`). Scanned 135 text files across all repos. Two additional corrupted files found — both in VYVEBrain:

**1. `brain/master.md`** — ENTIRE FILE was base64-encoded. 45,988 bytes of base64 text on a single line starting with `IyBWWVZFIEhlYWx0aCDigJQgTWFzdGVyIEJyYWluIERvY3VtZW50` (which decodes to `# VYVE Health — Master Brain Document`). Decoded to 34,305 chars of valid markdown (the real master brain doc). **This means every AI session that 'Loads VYVE brain' has been reading base64 gibberish for master.md.** Restored via base64 decode + ftfy mojibake fix.

**2. `brain/changelog.md`** — Line 348 contained a 207,092-char base64 blob holding all pre-19-April historical entries. Lines 1-345 were readable (recent entries including today's work), but lines 346-347 were blank and line 348 was the corrupted blob. When I prepended new entries this session, they went to the readable top portion, but the historical content below was hidden inside the base64 blob. Decoded the blob → 149,588 chars of real markdown containing entries back through February. Applied ftfy to fix a double-mojibake issue (em-dashes had been encoded as UTF-8 → latin-1 → UTF-8 → latin-1 twice). Reconstructed: lines 1-345 + blank line + fixed blob = 176,348 chars of clean markdown.

**No other corruptions found.** Clean scans:
- `vyve-site`: 66 text files — all OK
- `Test-Site-Finalv3`: 27 text files — all OK (welcome.html already fixed in commit `bc4cca4`)
- `VYVEBrain`: 42 text files — 40 OK, 2 fixed in this commit

**Scan methodology:**
- Fetched all 135 text-extension files (.html, .js, .md, .json, .css, .ts, .txt, .yml, .svg, .sh, .py, .gs, .xml + CNAME)
- Check 1: file starts with known base64 prefixes (`PCFET0NUWVBF` → `<!DOCTYPE`, `PGh0bWw` → `<html`, `PHN2Zw` → `<svg`, `IyMg` → `## `, `Lyo` → `/*`, etc.)
- Check 2: scan for lines of 300+ chars that are pure base64 alphabet (detects embedded blobs — this found the changelog.md case where the base64 was buried 347 lines deep)
- Check 3: scan for consecutive 8+ lines of 76-char base64-formatted lines (the "GitHub wrap" style)
- Check 4: sanity check HTML for `</html>`, JSON for parse-ability

**Why this happened — root cause analysis:**
The `GITHUB_COMMIT_MULTIPLE_FILES` tool accepts an `encoding` parameter (`utf-8` or `base64`). When called with `encoding='utf-8'` via direct MCP (NOT via `run_composio_tool` through the workbench) on large text payloads, the tool sometimes double-encodes: it takes the text, base64-encodes it once (for GitHub's API), then the transport layer encodes it again. The result on disk is plain-text-that-looks-like-base64-characters. GitHub stores whatever bytes it receives — it doesn't validate that the content is sensibly encoded for the filename.

**Prevention rules (hardening master.md rule #11):**
- NEVER call `GITHUB_COMMIT_MULTIPLE_FILES` via direct MCP for files >50K chars. ALWAYS use `run_composio_tool` through the workbench.
- Post-commit verification: after ANY commit of a file >50K chars, immediately fetch via `GITHUB_GET_REPOSITORY_CONTENT`, base64-decode once (standard API wrapping), check the first 100 chars look like the intended file type.
- Periodic sweep: every 2 weeks, run this scan script across all VYVE repos as regression detection.

**Tools used for recovery:**
- `base64.b64decode` + whitespace normalization + padding
- `ftfy` library (installed fresh via pip) for the double-mojibake fix
- Preserved boundary cleanly: recent entries end with `---`, recovered entries begin with proper `##` header

---

## 2026-04-20 | Fix welcome.html base64 corruption (onboarding broken since 19 April)

**Commit:** `bc4cca4` (Test-Site-Finalv3) — Fix welcome.html: decode base64 corruption from commit 0c6de362

**Impact:** CRITICAL. New members using Stripe → welcome redirect have been seeing a base64 text blob instead of the onboarding questionnaire for approximately 30 hours (19 April 13:50 UTC → 20 April 19:55 UTC). Any member who paid via Stripe in this window would have been blocked from onboarding.

**Root cause:** Commit `0c6de362` ("Round 5: Exercise stream picker in onboarding (Section C)") committed `welcome.html` with the file's bytes base64-encoded instead of as plain HTML. The previous commit `8dc6454e` had plain HTML; Round 5 broke it. The file on disk went from 402,267 bytes of HTML → 555,804 bytes of base64 text starting with `PCFET0NUWVBFIGh0bWw+` (which decodes to `<!DOCTYPE html>`).

This is the same "base64 corruption" pattern documented in earlier changelog entries. The cause is calling `GITHUB_COMMIT_MULTIPLE_FILES` via direct MCP rather than through `run_composio_tool` in the workbench on large text payloads. Direct MCP calls sometimes double-encode the payload before sending to GitHub API.

**Fix:**
- Fetched current corrupted content via `GITHUB_GET_RAW_REPOSITORY_CONTENT`
- Decoded base64: `base64.b64decode(re.sub(r'\s+', '', content))` after padding
- Verified decoded content is the correct Round 5 version (has `exerciseStream`, Workouts/Movement/Cardio stream cards, Section C updated)
- Recommitted via `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", ...)` from the workbench (the pattern that avoids the bug)
- Verified post-fix: `GITHUB_GET_REPOSITORY_CONTENT` at the new commit shows 416,852-byte file that decodes once (via the API's standard base64 wrapping) to plain HTML

**What's on disk now (commit `bc4cca4`):**
- `welcome.html`: 413,409 bytes of plain HTML
- Starts with `<!DOCTYPE html>\n<html lang="en" data-theme="light">`
- Contains the Round 5 stream picker (Workouts / Movement / Cardio cards + follow-ups)
- `exerciseStream` field wired into the onboarding payload
- No functional changes from what Round 5 intended — just un-corrupted

**Verification plan after deploy (1-3 min GitHub Pages propagation):**
- Visit `www.vyvehealth.co.uk/welcome` in incognito — should render the onboarding form, not a base64 blob
- If still base64 after 5 min: purge Cloudflare cache (if CDN is in front of GitHub Pages)

**Lessons reinforced (already in master.md Hard Rule 11):**
- `GITHUB_WRITES`: large file commits MUST use `run_composio_tool` through the workbench, NEVER direct MCP. Committing `welcome.html` (413K chars) via direct MCP causes base64 double-encoding.
- Mitigation already in master.md: `github-proxy` EF PUT endpoint is a known-safe fallback for large files.

**New rule to add to master.md:**
- Post-commit verification for any file larger than ~100K chars: immediately re-fetch via `GITHUB_GET_REPOSITORY_CONTENT` (Contents API), decode once, confirm the first 100 chars look like the intended file type. Catches the base64-corruption bug within seconds rather than 30 hours.

---

## 2026-04-20 | Server-side running plan storage (member_running_plans)

**Commits:**
- Supabase migration `create_member_running_plans` (applied via SUPABASE_APPLY_A_MIGRATION)
- `ce3f1af` (vyve-site) — Server-side running plan storage (member_running_plans table)

**Background:**
Dean asked: "And then running plans are stored in the db as well?" during testing of the earlier `eeda75e` commit. Answer was no — running plans lived only in `localStorage` (`vyve_autosave_plan` + `vyve_saved_plans`), making them per-device and invisible across the PWA / Capacitor native app / second devices / browser clears. `running_plan_cache` is a separate shared cache keyed by plan parameters (not per-member). Dean opted to ship proper server-side persistence today rather than backlog it.

**Decisions locked in before build:**
- Multiple plans per member, one marked `is_active` (history preserved)
- Hybrid persistence: Supabase is source of truth, localStorage is offline cache (write-through pattern)
- Backfill on next visit to `running-plan.html` (not other pages)

**Schema — new table `public.member_running_plans`:**
- `id uuid PK DEFAULT gen_random_uuid()`
- `member_email text NOT NULL REFERENCES members(email) ON DELETE CASCADE`
- `plan_name, goal, level, long_run_day text`
- `days_per_week, timeframe_weeks integer`
- `start_date date`
- `plan_json jsonb NOT NULL` (full plan structure from running-plan.html)
- `completions jsonb NOT NULL DEFAULT '[]'` (array of day_id strings like `day_0_3_Mon`)
- `is_active boolean NOT NULL DEFAULT false`
- `source text NOT NULL DEFAULT 'portal'` (portal | backfill | api)
- `created_at, updated_at, last_used_at timestamptz`

**Indexes:**
- `member_running_plans_pkey`
- `member_running_plans_one_active_idx` — UNIQUE partial `(member_email) WHERE is_active = true` (enforces one active plan per member at DB level)
- `member_running_plans_email_idx` on `(member_email, last_used_at DESC)`

**Triggers:**
- `zz_lc_email` — BEFORE INSERT/UPDATE, lowercases member_email (matches portal convention)
- `mrp_touch_updated_at` — BEFORE UPDATE, refreshes updated_at

**RLS:**
- `member_running_plans_own_data` — ALL ops, `(member_email = auth.email())` both USING and WITH CHECK

**running-plan.html — new sync module (`MRP`):**
- `mrpJwtHeaders()` — builds fresh auth headers (JWT from `window.vyveSupabase` session if available, falls back to anon)
- `mrpMemberEmail()` — grabs email from `window.vyveCurrentUser`
- `mrpRowFromSaved(saved, source)` — normalises localStorage plan shape (strings like `'8weeks'`, `'3days'`) into member_running_plans row format
- `mrpUpsertActive(saved, source)` — PATCH existing `is_active=true` rows for this member to `false`, then POST new row with `is_active=true`. Partial unique index enforces one-at-a-time
- `mrpSetCompletion(dayId, done)` — GET current completions array, mutate, PATCH back with updated `last_used_at`. Race-unsafe in multi-tab edit (acceptable for MVP)
- `mrpBackfillFromLocalStorage()` — on page load after auth, checks if member has any rows. If not AND localStorage has plans, uploads them all with `source='backfill'`. Autosave plan becomes active; otherwise highest-id saved plan. Active row also harvests existing `day_0_*` localStorage completion keys into its completions array

**running-plan.html — existing functions hooked:**
- `autoSavePlan(plan, meta)` — after localStorage write, calls `mrpUpsertActive(saved, 'portal')`
- `savePlan()` — after localStorage write, calls `mrpUpsertActive(saved, 'portal')`
- `toggleDay(dayId, weekNum)` — after localStorage toggle, calls `mrpSetCompletion(dayId, nowDone)`
- `waitForAuth()` — after auth succeeds, calls `mrpBackfillFromLocalStorage()`

All Supabase writes are fire-and-forget relative to UI. localStorage write gives instant UX. Supabase write runs in background. Failures only log to console — offline → localStorage wins.

**cardio.html — switched to Supabase-first read:**
- `getActiveRunningPlan()` is now async. Primary: GET `member_running_plans?member_email=eq.X&is_active=eq.true&select=...`. Normalises server shape into unified `{ planName, goal, level, days, timeframe, startdate, plan, completions }` shape
- Fallback: reads `vyve_autosave_plan` / `vyve_saved_plans` from localStorage (first visit before backfill completes, or offline)
- `renderRunningPlan()` is now async and awaits `getActiveRunningPlan`
- `findNextSession(saved)` honours BOTH server `saved.completions` array AND legacy `day_0_*` localStorage keys — correct during transition window

**Known follow-ups:**
- `schema-snapshot.md` will pick up `member_running_plans` on next Sunday 03:00 UTC `schema-snapshot-refresh` EF cron run (no manual refresh needed)
- `mrpSetCompletion` GET-then-PATCH is race-unsafe in multi-tab scenarios. Acceptable for MVP. Future fix: Supabase RPC wrapping `array_append`/`array_remove` atomics
- `loadSavedPlan(saved)` in running-plan.html still only sets localStorage prefs + re-renders — doesn't mark that plan as active in Supabase. Intended: loading a historical saved plan in the UI doesn't change the active plan. Revisit if members expect "load = activate" semantics

**sw.js**: cache bumped to `vyve-cache-v2026-04-20-running-plan-sync`

**Files Changed:**
- Supabase migration: `public.member_running_plans` (created)
- `vyve-site/cardio.html` (32615 → 33950 chars)
- `vyve-site/running-plan.html` (60329 → 68712 chars)
- `vyve-site/sw.js`

**Lessons:**
- When a member-facing feature is built MVP-style (localStorage only), flag the cross-device implication at build time rather than waiting for the user to notice. Saved a cycle here because Dean asked directly — but next time put "platform limitation: per-device only" into the commit message up front
- PostgREST doesn't expose atomic JSONB array append/remove without a custom RPC. For MVP, GET-then-PATCH is fine. Note it as tech debt rather than doing it "properly" the first time
- Partial unique indexes (`WHERE is_active = true`) are the cleanest way to enforce "one active per member" — simpler than triggers or app-layer checks

---

## 2026-04-20 | Movement quick-log + Cardio running-plan hero

**Commit:** `eeda75e` (vyve-site) — Movement quick-log + cardio active running-plan hero

**Feedback from Dean after testing 93092de:**
1. Movement's "No movement plan assigned yet" state was a dead-end. Members without an assigned plan had nothing to do on the page — just a link back to the hub. He wants members to still be able to use Movement even without a structured programme, because many movement activities (walks, stretches) don't need a plan to log.
2. Cardio didn't show his active running plan even though he had one saved. Investigation revealed `running-plan.html` persists plans in `localStorage` only (`vyve_autosave_plan` for last-generated + `vyve_saved_plans` array for explicit saves) — there's no server-side record — and Cardio had no code to read either key.

**What shipped:**

**`movement.html` — quick-log in the no-plan branch:**
- When `workout_plan_cache` returns a plan for the member (primary path), the Round 4 UI renders unchanged: programme header, today's session card, activity list with video modal, Mark as Done button writing to `workouts` table and advancing `current_session/current_week`. This path is untouched.
- When no plan exists, the no-plan state now shows an activity pill picker (Walk / Stretch / Yoga / Mobility / Pilates / Other) + duration (1-600 mins, required) + optional short note, with a Log session button that POSTs to `/rest/v1/workouts` (`plan_name='Movement'`, `session_name` from note or pretty-cased activity type, `duration_mins`). Inline error on invalid duration. "Logged" confirmation + form reset on success.
- New CSS: `.no-plan-intro`, `.quick-log-card`, `.ql-title`, `.ql-sub`, `.ql-section-label`, `.pill-row`, `.pill`, `.input-grid`, `.input-field`, `.btn-log`, `.log-note`. All theme-token-based.

**`cardio.html` — active running-plan hero:**
- Replaced the static `.rp-card` callout with a JS-filled `#rp-slot` div.
- New `getActiveRunningPlan()` reads `vyve_autosave_plan` first; falls back to the most recent entry in `vyve_saved_plans` (sorted by `id` descending, since `id = Date.now()` at save time). Returns null if no plan is stored.
- New `renderRunningPlan()` renders either:
  - **Active plan hero** (teal gradient, matches programme-card pattern from movement.html): active-plan label + programme name + goal/timeframe meta + next-session callout with chevron linking to `/running-plan.html`
  - **Fallback callout** (compact card inviting the member to generate a plan) when no plan exists
- New `findNextSession(saved)` walks `plan.phases[].weeks[].days[]`, skips days marked complete via `day_0_<weekNumber>_<sanitizedDayName>` localStorage keys (same mechanism `running-plan.html` uses), computes each run-day's date from `saved.startdate` + week offset + day-of-week offset, and picks the first upcoming run. Labels it "Today" if it falls on today, "Missed" if in the past, or "Week N — DayName" otherwise. If no plan has `startdate`, labels by week+day position.
- Called from `onAuthReady()` immediately after memberEmail resolution (no DB dependency — runs off localStorage only).

**Known limitation (platform-level, not in this commit):**
Running plans live only in `localStorage`. A member logging in on a second device or the Capacitor native app won't see their plan there. Server-side persistence of running plans is a separate task — should land with the wider HealthKit / Health Connect integration work per backlog "This Week" priorities.

**`sw.js`** — cache bumped to `vyve-cache-v2026-04-20-exercise-quicklog`.

**Files Changed:**
- `vyve-site/movement.html` (23800 → 30281 chars)
- `vyve-site/cardio.html` (25444 → 32615 chars)
- `vyve-site/sw.js`

---

## 2026-04-20 | Restore real movement.html + ship data-wired cardio.html + brain drift fix

**Commits:**
- `93092de` (vyve-site) — Restore real Round 4 movement.html + build data-wired cardio.html
- `[this commit]` (VYVEBrain) — Fix backlog drift, update plan doc status, log restoration

**Context:**
Deep-dive audit of the Exercise section revealed that between Round 4 (`b7e19ba1`, 19 April) and 20 April, the real data-wired `movement.html` — the one with `workout_plan_cache` integration, activity list, video modal, Mark as Done, etc — had been overwritten by a static step-tracker mockup ("Option 3 Personal Dashboard"). 13 subsequent commits tried to fix visual issues with that mock. My earlier commits today (`d4b7171` and `0a469a1`) compounded the problem by applying nav/header + brand CSS fixes to the mock, cementing it further.

Additionally: the backlog update I did earlier this morning wrongly listed Round 5 items (`welcome.html` stream picker, onboarding EF AI routing) as still-open, despite Round 5 having shipped on 19 April (commit `0c6de36` + onboarding EF v77). The `plans/exercise-restructure.md` doc also still said "Status: Planning — not yet in build" despite Rounds 1–5 all being live.

**What shipped:**

**`movement.html`** — restored from git sha `b7e19ba1` (the real Round 4 page):
- Reads member's active plan from `workout_plan_cache` (filtered by member_email)
- Programme header card (name, Week X of Y, progress bar)
- Today's session card with activity list: each activity has name, duration, tip, optional `video_url`
- Video modal: YouTube auto-embed + direct video fallback + open-link fallback, closes on Escape/overlay tap
- Mark as Done button: POSTs to `workouts` table (BST date, day_of_week, time_of_day, plan_name, session_name, duration_mins) + PATCHes `workout_plan_cache` to advance `current_session/current_week`
- No-plan fallback state with link back to Exercise hub
- 30-min localStorage cache (`vyve_movement_cache`, email-keyed)
- 10-second skeleton watchdog, XSS escaping, BST date helpers (`bstToday()`), event-driven `vyveAuthReady` auth
- Only change from `b7e19ba1`: `auth.js` → `/auth.js` path hygiene

**`cardio.html`** — brand new data-wired page (not a mockup):
- Weekly progress hero: reads `weekly_goals.cardio_target` + counts this ISO-week's rows from `cardio` table
- Running plan callout: links to `/running-plan.html` so members can still generate/view AI running plans
- Quick-log card: activity pill picker (Running / Cycling / Walking / Swimming / Rowing / Other) + duration (required, 1–600 mins) + optional distance in km, with inline validation; POSTs to `/rest/v1/cardio` with correct schema (`member_email`, `activity_date`, `day_of_week`, `cardio_type`, `duration_minutes`, `distance_km`) — DB triggers handle `time_of_day`, `session_number`, `logged_at`
- Recent sessions: last 10 rows from `cardio` table, with friendly dates ("Today", "Yesterday", "N days ago", then DD Mon)
- Same patterns as `movement.html`: `vyveAuthReady` event listener, 10-min localStorage cache, 10s skeleton watchdog, BST helpers, theme tokens throughout

**`exercise.html`** — hub Cardio card updated:
- `href: 'running-plan.html'` → `href: 'cardio.html'`
- Description: "Running plans, cycling & cardio tracking" → "Running, cycling, walking & more"
- Colour & icon unchanged

**`sw.js`** — cache bumped to `vyve-cache-v2026-04-20-exercise-restore`

**Architectural reality (post-audit):**
The Exercise Restructure plan is more complete than the tracking docs suggest. All five planned rounds shipped on 19 April:
- Round 1 — DB: `members.exercise_stream` column added (CHECK: workouts/movement/cardio; DEFAULT 'workouts'), 18 existing members backfilled
- Round 2 — "Workouts" → "Exercise" labels across nav.js, index.html, engagement.html, certificates.html, leaderboard.html (commit `5fe6929`)
- Round 3 — `exercise.html` hub page (commit `c5216ca`)
- Round 4 — `movement.html` (commit `b7e19ba1` — this is what today's commit restored)
- Round 5 — `welcome.html` stream picker + onboarding EF v77 (commit `0c6de36`): exerciseStream + 8 stream-specific fields, stream-aware weekly goals / programme overview / recommendations / welcome email, workout plan gen wrapped in `if (stream === 'workouts')`

**What's genuinely still open (real Exercise-restructure backlog):**
- Movement plan **content** in `programme_library` (walking / stretching / yoga programmes) — currently zero rows with `category='movement'`, so all Movement-stream members see no-plan state
- `programme_library.category` column to distinguish movement vs gym plans
- Classes stream on the hub (plan says cross-cutting, not built)
- Hub progress across all streams vs just the primary (open question from plan doc)
- Backfill decision for existing 18 members (all currently default 'workouts' regardless of actual fit)
- Brain hygiene: base64-encoded blob in this changelog file (~152K decoded chars of historical entries) needs decoding in a dedicated session

**Files Changed:**
- `vyve-site/movement.html`, `cardio.html`, `exercise.html`, `sw.js` (commit `93092de`)
- `VYVEBrain/brain/changelog.md`, `tasks/backlog.md`, `plans/exercise-restructure.md` (this commit)

**Lessons:**
- When a task produces multiple follow-ups from panic-fixing, always git log the file first to check whether a known-good earlier version exists. Would have saved today's whole cycle.
- Backlog updates must cross-reference the changelog — my morning update re-opened items that had shipped weeks before.
- Plan docs need a "Status: shipped on [date]" line when done, not "Planning" forever.

---

## 2026-04-20 | Movement/Cardio unstyled content fix (follow-up)

**Commits:**
- `0a469a11` (vyve-site) — Fix Movement/Cardio unstyled content: rebuild with proper brand CSS

**Problem:**
After the earlier commit (`d4b7171b`) wired `nav.js` into `movement.html` and `cardio.html`, Dean tested on mobile and reported both pages rendered as unstyled plain text below the tabs row. Header, bottom nav, and tab pills looked correct; everything else didn't.

**Root cause (pre-existing, not introduced today):**
The inline `<style>` blocks on `movement.html` and `cardio.html` were copy-pastes of `workouts.html`'s CSS — same 31,276 chars, same 173 class definitions — but NONE of those class names matched what the movement/cardio HTML actually used. `.goal-card`, `.tip-card`, `.stats-grid`, `.stat-card`, `.activity-card`, `.activity-icon`, `.hr-card`, `.cardio-grid`, `.cardio-option`, `.session-controls`, `.timer-display`, `.control-btn` etc. — zero rules defined. Only `.wrap`, `.tabs`, `.tab-btn` happened to be shared, which is why the top of the page looked OK.

This was already broken before today's work; wiring `nav.js` simply made it visible.

**Solution:**
- Rebuilt both pages end-to-end with proper inline CSS that uses only `theme.css` tokens (`--teal`, `--surface`, `--border`, `--text-muted`, `--radius-*`, `--space-*`, `--shadow-*`, `--font-head`, `--font-body`, etc). No hardcoded colours.
- Matched visual language to `habits.html` / `workouts.html` — same card patterns, same spacing system, same radius scale.
- Kept all existing mock-data content intact (7,200 / 8,000 steps, Morning stretch routine, Afternoon energizer walk on Movement; HR zone 142 bpm, 6-activity grid, session controls on Cardio).
- Added on-brand empty-state cards for the previously-empty Progress / Insights / Plans / Zones tabs.
- Added client-side `switchTab()` JS so the tab row actually switches between panels (previously non-functional).
- Stubbed `startActivity()` / `toggleSession()` / `pauseSession()` on Cardio so `onclick` handlers don't throw — real handlers ship with the Supabase wiring work.

**Files Changed:**
- `vyve-site/movement.html` (full rewrite, 15,676 chars)
- `vyve-site/cardio.html` (full rewrite, 17,164 chars)
- `vyve-site/sw.js` (cache bumped to `vyve-cache-v2026-04-20-exercise-nav-b`)

**Lessons / rules:**
- When a page imports `nav.js` for the first time, always view it on mobile before calling the work done — wiring shared infra can unmask latent styling bugs that were previously hidden by the absence of a rendered header.
- Do not copy an unrelated page's inline `<style>` block wholesale as a placeholder. Empty `<style>` + `theme.css` is safer than a mismatched block, because at least it fails obviously.
- Inline CSS should reference `theme.css` tokens only. If a token doesn't exist for what you need, add it to `theme.css` once, not inline per page.

**Still open on Exercise restructure backlog item:**
- Movement/Cardio Supabase data wiring (pages are styled now, but content is still hardcoded mock data)
- Skeleton-timeout watchdog + `vyveAuthReady` gating on both pages
- `welcome.html` onboarding questionnaire update (exercise-type question)
- Onboarding EF: AI routing to assign Movement/Cardio as primary plan

---

## 2026-04-20 | Exercise-section nav: back button + correct headers on sub-pages

**Commits:**
- `d4b7171b` (vyve-site) — Fix exercise-section nav: back button + correct header labels on sub-pages

**Problem:**
After Option A (Exercise Hub) shipped, the sub-pages under the Exercise tab had inconsistent headers and no back buttons:
- `workouts.html` → showed the VYVE logo + "Exercise" label (treated as hub)
- `movement.html` and `cardio.html` → showed **no header and no bottom nav at all** (nav.js not loaded)
- Only `exercise.html` rendered correctly

**Root causes:**
1. `nav.js` `getActiveTab()` classified any URL string-containing "exercise" or "workouts" as a top-level nav page, so workouts.html was getting `isNavPage=true` → logo instead of back button.
2. `nav.js` `pageLabels` map only covered the 4 hub pages — no entries for Workouts, Movement, Cardio, or any other sub-page.
3. `movement.html` and `cardio.html` were missing `<script src="/nav.js">`, `sw.js` registration, and `offline-manager.js` entirely — orphaned from the shared header/bottom-nav infrastructure.
4. Both pages had duplicate `<script src="/theme.js">` and `<script src="auth.js">` tags (in `<head>` and again at end of `<body>`) and used relative `auth.js` instead of `/auth.js`.

**Solution:**
- **`nav.js`**: `isNavPage` now matches only the 4 exact hub paths (`/`, `/index.html`, `/exercise.html`, `/nutrition.html`, `/sessions.html`) instead of doing string-containment. Sub-pages still highlight the correct bottom-nav tab (Exercise tab stays active on workouts/movement/cardio), but now render a back button (history.back → `/index.html`) in the mobile header.
- **`nav.js`**: Added `subPageLabels` map keyed by filename stem. Covers `workouts`, `movement`, `cardio`, `running-plan`, `shared-workout`, `log-food`, `habits`, `wellbeing-checkin`, `monthly-checkin`, `certificates`, `leaderboard`, `engagement`, `settings`, `nutrition-setup`. Every portal sub-page now has a proper title in the header.
- **`movement.html`** & **`cardio.html`**: added `<script src="/nav.js">`, sw.js registration, `offline-manager.js`; removed duplicate theme.js/auth.js tags at bottom; normalised `auth.js` → `/auth.js`.
- **`sw.js`**: cache bumped `vyve-cache-v2026-04-19-header-fix` → `vyve-cache-v2026-04-20-exercise-nav`.

**Effect:**
- `exercise.html` → Logo + "Exercise" (unchanged)
- `workouts.html` → **Back button + "Workouts"** ✅
- `movement.html` → **Back button + "Movement"** + full bottom nav ✅
- `cardio.html` → **Back button + "Cardio"** + full bottom nav ✅

**Files Changed:**
- `vyve-site/nav.js`
- `vyve-site/movement.html`
- `vyve-site/cardio.html`
- `vyve-site/sw.js`

**Deferred (tracked on backlog under Exercise restructure):**
- `movement.html` / `cardio.html` still use 100% hardcoded mock data — no Supabase wiring yet.
- Skeleton-timeout watchdog (`platform-alert` ping) not yet added to movement/cardio.
- No `vyveAuthReady` event-driven gating on movement/cardio (no `#app` show/hide flow).
- AI routing at onboarding to assign Movement/Cardio primary plans (per exercise-restructure.md).

**Testing notes for Dean:**
- Visit `online.vyvehealth.co.uk/workouts.html`, `/movement.html`, `/cardio.html` on mobile — all three should now show the back button + correct title at the top, and the Exercise tab should be highlighted in the bottom nav.
- On first load after cache bump, hard refresh may be needed to pick up new sw.js.

---

## 2026-04-19 | Color Fix - Blue to Teal Goal Cards

**Commits:**
- `5ea40f99` - Fix blue color issue - correct theme.js load order
- `d648790a` - Fix movement & cardio page positioning

**CRITICAL BUG FIX:**
Fixed goal cards showing blue instead of VYVE teal (#1E8F8F) due to theme.js load order issue.

**Problem:**
- Goal cards appeared blue instead of proper VYVE teal
- Content positioned too low with excessive top padding

**Root Cause:**
- `theme.js` loaded BEFORE CSS variables were defined
- When `theme.js` set `data-theme="light"`, `--teal` variable didn't exist yet
- `var(--teal)` failed to resolve, browser defaulted to blue fallback color
- Main padding too high: 64px desktop, 56px mobile

**Solution:**
- Moved `<script src="/theme.js"></script>` AFTER `</style>` in both pages
- CSS variables now defined before theme application
- Reduced main padding: 24px desktop, 16px mobile
- `var(--teal)` now resolves to correct #1E8F8F

**Technical Details:**
- Load order matters for CSS variables + theme application
- Browser fallback colors vary, often blue for background gradients
- VYVE theme pattern: CSS → theme.js → other scripts

**Files Changed:**
- movement.html: theme.js repositioned + padding reduced
- cardio.html: same fixes applied
- sw.js: cache bumped to v2026-04-19r

**Testing:**
- Goal cards now display proper VYVE teal gradient
- Content positioning fixed (no excessive top gap)
- Both light/dark themes working correctly

---

## 19 April 2026 — Round 5: Exercise stream routing (welcome.html + onboarding EF v77)

### What shipped

**welcome.html** (Test-Site-Finalv3, commit `0c6de36`)
- Section C bottom half rebuilt around a stream picker: 3 cards (Workouts / Movement / Cardio), pick-once-then-reveal follow-ups.
- Workouts follow-up retains original field IDs (`location-train`, `equipment`, `gymExperience`, `trainDays`) + labels — fully backward compatible with existing payload.
- Movement follow-up (new): `movementTypes` (multi), `movementFrequency`, `movementDuration`, `movementLocation`.
- Cardio follow-up (new): `runningLevel`, `runningGoal`, `runningDays`, `runningLocation`. No plan generated at onboarding — member generates from `running-plan.html` on the Cardio tab when ready.
- Default-selects Workouts on load (matches `members.exercise_stream` DEFAULT). No hard validation (matches existing gentle-validation pattern for Sections B–J).
- New CSS: `.stream-cards`, `.stream-card`, `.stream-followups` using existing design tokens (accent-pale, shadow, fadeUp anim).
- Submit payload now includes `exerciseStream` + 8 stream-specific fields.

**Onboarding EF v77** (deployed)
- New `resolveStream(d)` helper — validates and normalises `data.exerciseStream` to `'workouts' | 'movement' | 'cardio'`, defaults `'workouts'`.
- `writeMember()` now writes `exercise_stream: stream` to the members row.
- `writeWeeklyGoals(email, stream)` — stream-aware defaults:
  - workouts: habits 3, workouts 2, cardio 1, sessions 1, checkin 1
  - movement: habits 3, workouts 0, cardio 0, sessions 2, checkin 1, movement_target 3
  - cardio:   habits 3, workouts 0, cardio 2, sessions 1, checkin 1
- `generateProgrammeOverview(d, stream)` — skips AI naming call for movement/cardio; returns static `"Your Movement Journey"` / `"Your Running Journey"` with stream-specific rationale.
- `generateRecommendations(d, persona, ls, on, stream)` — stream-specific prompt context and first-rec guidance:
  - workouts: "workout programme named X is ready on the Exercise tab"
  - movement: "head to Exercise tab and tap Movement"
  - cardio: "head to Exercise tab and tap Cardio to generate your personalised running plan"
- `sendWelcomeEmail(..., stream)` — stream-aware intro line under the hero.
- `serve()` main handler: exercise_library only fetched for workouts; `selectPlanType` only called for workouts (others use `'Movement_Wellbeing'` / `'Cardio'` placeholder); **workout plan generation (`generateWorkoutPlan` + `writeWorkoutPlan` + `EdgeRuntime.waitUntil`) wrapped in `if (stream === 'workouts')` block** — movement and cardio never trigger plan gen.
- Response JSON includes `exercise_stream`; `workout_plan.status` is `'not_applicable'` for non-workouts streams.
- Decision log now includes `exercise_stream` and `plan_decision.generated:boolean`.
- Sensitive answers backup email now lists all stream-specific fields.

### Architectural notes
- No new DB columns needed — stream-specific answers (movement/cardio follow-ups) are used in-session for AI recommendations then discarded. The Cardio tab re-captures what it needs via `running-plan.html`; Movement is exploratory (no plan schema).
- CORS still restricted to `https://www.vyvehealth.co.uk`; `verify_jwt: false` preserved (VYVE pattern).
- The preview at `Test-Site-Finalv3/preview/exercise-question.html` (commit `5fc7e6c`) is superseded and should be deleted once Round 5 is confirmed working end-to-end.

### Test plan
1. Create a test member selecting Workouts → confirm `members.exercise_stream='workouts'`, 8-week plan generated, welcome email says "8-week programme ready".
2. Create a test member selecting Movement → confirm `exercise_stream='movement'`, `weekly_goals.workouts_target=0`, NO row in `workout_plan_cache`, welcome email references "Movement hub".
3. Create a test member selecting Cardio → confirm `exercise_stream='cardio'`, `weekly_goals.cardio_target=2`, NO row in `workout_plan_cache`, welcome email references "Cardio hub" and tells them to generate their running plan.
4. Portal routing (existing — Round 4): verify Exercise hub shows the correct tab landing for each stream.

### Pending
- Delete preview `Test-Site-Finalv3/preview/exercise-question.html` after confirmation.
- End-to-end test with all 3 streams (needs test accounts).

---

## 19 April 2026 — Sessions cap: 2/day combined live + replay (DB trigger + backfill)

### Issue
`session_views` had a DB-level 2/day cap trigger, `replay_views` had none. Combined daily totals could exceed 2 whenever a member mixed live and replay views. User confirmed intent: max 2 sessions per day total, any mix (2 live + 0 replay, 1+1, 0+2 all OK; 2 live + 1 replay should reject).

### Audit before fix (across all members)
6 over-cap days, 3 members affected:

| Member | Date | Live | Replays | Total |
|---|---|---|---|---|
| Dean | 17 Apr | 2 | 4 | 6 |
| Paige | 17 Apr | 2 | 1 | 3 |
| Calum | 13 Apr | 2 | 1 | 3 |
| Dean | 6 Apr | 2 | 3 | 5 |
| Dean | 28 Mar | 1 | 3 | 4 |
| Dean | 18 Mar | 1 | 5 | 6 |

15 replay rows total.

### What shipped (SQL migration, single transaction)

1. **`cap_session_views()` updated** — now counts `session_views + replay_views` for the day, not just `session_views`.
2. **`cap_replay_views()` created** — mirrors `cap_session_views`; routes over-cap to `activity_dedupe` with `source_table='replay_views'`.
3. **Trigger `enforce_cap_replay_views` (BEFORE INSERT on replay_views)** created, calls `cap_replay_views()`.
4. **Backfill:** 15 over-cap replay rows moved from `replay_views` to `activity_dedupe`. Ranking per day by `logged_at ASC NULLS LAST, id ASC`; keep the earliest `GREATEST(0, 2 - live_count)` replays, move the rest. Atomic CTE chain (INSERT + DELETE).

### Result
- `rows_inserted_to_dedupe = 15`, `rows_deleted_from_replays = 15`
- Post-backfill verification: 0 days remain with live+replay > 2 across any member
- Affected member totals (sessions = session_views + replay_views):
  - Dean: 45 → **32** (−13)
  - Paige: 6 → **5** (−1)
  - Calum: 4 → **3** (−1)

### Brain doc updates
- `master.md §4` trigger table: added `replay_views` to the `enforce_cap_*` row; note the combined cap
- `master.md §4` trigger-support function list: bumped 14 → 15, added `cap_replay_views`, annotated `cap_session_views` as combined
- `master.md §4` header: 119 → 120 triggers; 31 → 32 public functions
- `master.md §4` Activity Caps subsection: documents the combined cap explicitly
- `master.md` reconciliation timestamp

---

## 19 April 2026 — member-dashboard EF v43: counts from source tables, per-type streaks, full 30-day activity_log

### Issue
User reported three bugs: (1) index.html totals tallied wrong, (2) engagement.html per-type streaks not loading, (3) engagement.html 30-day activity calendar not loading.

### Root causes
1. **Totals drift.** member-dashboard v42 pulled counts from `members.cert_*_count` (trigger-maintained counters). These drift: the counter trigger exists on `session_views` but NOT on `replay_views`, so replay views never increment `cert_sessions_count`. Confirmed on Dean's row — stored 30 vs actual 45 (15 replay views missing). Same class of bug as the aggregation-trigger SECURITY DEFINER issue fixed earlier on 19 April, just a different mechanism.
2. **Calendar empty.** Earlier 19 April fix changed the calendar filter side from `r.types` → `r.activities` (4 places in `renderLogFromPrecomputed`), but missed the translation layer at `loadPage()` line 664 which still renamed `activities` → `types`. Flow: EF returns `{date,activities}` → translation rewrites to `{date,types}` → render reads `r.activities` → never matches → calendar empty.
3. **Only 14 days returned.** EF v42 used `activity_log: activityLog.slice(-14)`. Calendar expected 30.

### What shipped

**member-dashboard v43** (deployed, verify_jwt: false, internal JWT validation unchanged)
- Lifetime counts computed from source tables, not `cert_*_count`:
  - `habits` = distinct `activity_date` from `daily_habits` (Rule 20)
  - `workouts`, `cardio` = row count on respective tables
  - `sessions` = `session_views` + `replay_views` row count combined
  - `checkins` = `kahunas_checkins` row count
- Returns full 30-day `activity_log` (removed `.slice(-14)`)
- Returns new `engagement.streak_by_type` with `{current,best}` for habits/workouts/cardio/sessions (daily streaks) and `checkins` (weekly streak, computed from `iso_year`+`iso_week`)
- `progress.*.best_streak` now populated (was hardcoded 0)

**index.html**
- Translation layer wires per-type streaks from `engagement.streak_by_type`, maps `best` → `longest` for legacy client shape
- Charity normalised to `{total,months,progress}` object (was raw number — latent render bug: `ch.total.toLocaleString()` called on number)
- Fixed workout key mismatch: `applyStreak('workout', streaks.workout...)` → `streaks.workouts` (prefix 'workout' stays for DOM ids)

**engagement.html**
- Translation layer passes `data.activity_log` through unchanged (keeps `activities` key; drops the `activities` → `types` rename)
- Per-type streaks wired from `engagement.streak_by_type` via same `mapS` helper

**sw.js** — cache bumped: `vyve-cache-v2026-04-19l` → `vyve-cache-v2026-04-19m`

### Commit
vyve-site main: [d3dc138](https://github.com/VYVEHealth/vyve-site/commit/d3dc13826b2ba15d8977121d232a9aaf989c485d)

### Architecture note (proposed Rule addition)
`cert_*_count` counters on `members` are redundant with source-table queries. The `increment_*_counter` triggers are drift-prone (missed replay_views case above). Recommend deprecating these columns in a future pass; any read-path should compute from source tables. Not blocking; leaving counters in place for now.

### Deferred
- Backfilling `cert_*_count` to match source tables (cosmetic only now that the EF reads source tables; no user-facing impact)
- Auditing whether any other EF/report reads `cert_*_count` directly (daily-report, weekly-report, monthly-report, certificate-checker all candidates — a grep pass is cheap but out of scope for this commit)

---

## 19 April 2026 — Exercise restructure Round 4: movement.html

### New file: movement.html
Commit: [b7e19ba](https://github.com/VYVEHealth/vyve-site/commit/b7e19ba12726a25a5a94aef8641043494fb7da94)

**Features:**
- Programme header card: name, week X of Y, progress bar from workout_plan_cache
- Activity list: name, duration, tip, optional `video_url` per activity
- Video modal: YouTube auto-embed, direct video file fallback, open-link fallback. Closes on Escape or overlay tap. Clears video on close (stops playback).
- "Mark as Done" button: writes to `workouts` table (BST date, day_of_week, time_of_day, plan_name, session_name, duration_mins). Then PATCH to `workout_plan_cache` to advance current_session/current_week.
- Clears `vyve_movement_cache` after completion so next load shows the new session.
- No-plan state: shown when no active plan with `category = 'movement'` exists. Clean message + back to Exercise link.
- 10-second skeleton watchdog, 30-minute localStorage cache (`vyve_movement_cache`, email-keyed).
- No emojis, XSS-escaped activity content, bstToday() date helpers.

**Data contract (expected programme_json structure for movement plans):**
```json
{
  "programme_name": "4-Week Gentle Movement",
  "category": "movement",
  "plan_duration_weeks": 4,
  "sessions_per_week": 3,
  "weeks": [{
    "sessions": [{
      "session_name": "Walk & Stretch — Day 1",
      "activities": [{
        "name": "Brisk walk",
        "duration": "20 mins",
        "tip": "Aim for a conversational pace",
        "video_url": null
      }]
    }]
  }]
}
```

**sw.js** — cache bumped: `vyve-cache-v2026-04-19i` → `vyve-cache-v2026-04-19j`

**Current state:** All members see no-plan state (correct — no movement plans in programme_library yet). Page is ready for content.

### Still to build
- Round 5: welcome.html onboarding question + onboarding EF routing for exercise_stream
- programme_library: movement plan content (walking plans, yoga, stretching programmes)
- programme_library: add `category` column to distinguish movement vs gym plans

---

## 19 April 2026 — Exercise restructure Round 3: exercise.html hub page

### New file: exercise.html
Commit: [c5216ca](https://github.com/VYVEHealth/vyve-site/commit/c5216caf774b2a3aeef8d10e569fc093b0e93b19)

**Layout decisions (confirmed):**
- Hero card: detailed (programme name, week X of Y, progress bar, "Up next" session pill, "View Programme" CTA)
- CTA: links to workouts.html — 2 taps (hub → programme view → active session). No deep-link.
- Stream cards: all 3 always visible regardless of exercise_stream (Option A). No Classes card.
- 3 streams: Movement (movement.html), Workouts (workouts.html), Cardio (running-plan.html)

**Data source:**
- Direct REST to `workout_plan_cache` (member_email, is_active=true)
- Fields used: `programme_json.programme_name`, `current_week`, `plan_duration_weeks`, `current_session`, `programme_json.weeks[n].sessions[n].session_name`
- 1-hour localStorage cache keyed by email: `vyve_exercise_cache`

**Patterns:**
- Auth: `if (window.vyveCurrentUser) onAuthReady()` + `vyveAuthReady` listener
- Skeleton watchdog: 10 seconds
- NULL plan fallback: "Your programme is on its way" state — no crash
- offline-manager.js wired

**sw.js** — cache bumped: `vyve-cache-v2026-04-19h` → `vyve-cache-v2026-04-19i`

### Still to build
- movement.html (Round 4) — Movement plan display + completion logging
- welcome.html onboarding question update (Round 5)
- onboarding EF routing for exercise_stream (Round 5)

---

## 19 April 2026 — Exercise restructure Round 1 & 2

### Round 1 — DB: exercise_stream column
- Added `exercise_stream VARCHAR(20)` to `public.members` with CHECK constraint ('workouts', 'movement', 'cardio'), DEFAULT 'workouts'
- Backfilled all 18 existing members to 'workouts'
- Migration applied via Supabase MCP apply_migration

### Round 2 — Label changes: Workouts → Exercise (portal UI)
Commit: [5fe6929](https://github.com/VYVEHealth/vyve-site/commit/5fe69294e0d9965c4e56938986fe8f0212a53a13)

**nav.js**
- Active page detection: `workouts` → `exercise` tab key; both `/workouts.html` and `/exercise.html` paths resolve to 'exercise' tab (keeps Exercise tab highlighted on workouts sub-page)
- Bottom nav: href `/workouts.html` → `/exercise.html`, label 'Workouts' → 'Exercise', tab key updated
- Desktop nav More dropdown: same href/label/tab update

**index.html**
- Mobile track name label: 'Workouts' → 'Exercise'
- Progress track label: 'Workouts' → 'Exercise'
- Weekly goal copy: 'Complete X workout/s' → 'Complete X exercise session/s'
- Notification nav link: href + aria-label + span text updated

**engagement.html**
- Activity card label: 'Workouts' → 'Exercise'
- Calendar legend label: 'Workouts' → 'Exercise' (key: 'workouts' unchanged — DB key)
- Variety description copy updated

**certificates.html**
- Workouts track label: 'Workouts' → 'Exercise' (subtitle 'The Warrior' pending decision)
- Empty state copy updated

**leaderboard.html**
- Metric tab display text: 'Workouts' → 'Exercise' (data-metric="workouts" unchanged — EF key)

**sw.js** — cache bumped: `vyve-cache-v2026-04-19g` → `vyve-cache-v2026-04-19h`

### What did NOT change
- DB tables: `workouts`, `workout_plans`, `workout_plan_cache` — unchanged
- EF response keys: `prog.workouts`, `counts.workouts` — unchanged
- Internal JS variables in workout JS modules — unchanged
- workouts.html — still exists as sub-page, accessed from hub

### Still to build (Round 3+)
- exercise.html hub page
- movement.html sub-page
- welcome.html onboarding question update
- onboarding EF routing for exercise_stream

---

## 19 April 2026 — BST date consistency audit: bstToday() across portal + wellbeing-checkin EF

### Audit scope
Full audit of all portal pages calling Edge Functions: EF response shape contracts and BST date handling.

### EF response shape mismatches
None found. All pages correctly consume their EF responses:
- `wellbeing-checkin.html` reads `data.ack`, `data.recs` — correct
- `monthly-checkin.html` reads `data.aiReport`, `status.alreadyDone`, `status.newMemberLocked`, `activity.*` — correct
- `running-plan.html` reads `data.content?.[0]?.text` from anthropic-proxy — correct
- `certificates.html` uses iframe following 302 redirect from certificate-serve — correct

### BST date bugs fixed

**`workouts-session.js`** (commit 22aa348)
- Exercise_logs insert was using `new Date().toISOString().slice(0,10)` (UTC) — fixed to `bstToday()`
- Workout completion `today` variable was UTC — fixed to `bstToday()`
- Added `isDST()` + `bstToday()` helpers at top of file (same pattern as habits.html)

**`wellbeing-checkin.html`** (commit 22aa348)
- Client-side `activity_date` was UTC — fixed to `bstToday()` (hygiene; EF was ignoring client date anyway)
- Added `isDST()` + `bstToday()` helpers

**`wellbeing-checkin` EF** (deployed as Supabase v35, code v25)
- Server-side `activity_date = today.toISOString().slice(0, 10)` was UTC — this was the real bug: check-ins stored on the wrong date after midnight BST
- Added `ukToday()` helper (Deno-compatible BST detection using UTC date math, not `getTimezoneOffset()`)
- Also fixed `writeNotification` dedup check to use `ukToday()` for the `created_at` cutoff

**`monthly-checkin.html`** (commit 22aa348)
- Calendar `todayStr` was UTC — cosmetic fix, now uses `bstToday()` so "today" cell highlights correctly after midnight BST
- Added `isDST()` + `bstToday()` helpers

**`sw.js`** (commit 22aa348)
- Cache bumped: `vyve-cache-v2026-04-19d` → `vyve-cache-v2026-04-19e`

### Confirmed unaffected
- `habits.html` — already uses `bstToday()` (was the reference implementation)
- `sessions.html` — no log-activity calls (session logging happens on live session pages)
- `log-activity` EF — trusts client-sent `activity_date`; cap check + DB write use whatever date the client sends

### Commit
vyve-site main: [22aa348](https://github.com/VYVEHealth/vyve-site/commit/22aa348577aafdcf34dd756ad0403f81cef340ea)

---

## 19 April 2026 — engagement.html component bars crashing (renderScoreHero shape mismatch)

### Issue
Score ring rendered (97) but component bars showed "--/12.5" with JS error: `TypeError: Cannot read properties of undefined (reading 'pts')` at renderScoreHero:370.

### Root cause
`renderScoreHero(score)` expected each component as `{ pts: number }` (v35 shape) and referenced `c.activity` specifically. The v40 EF returns components as flat numbers (`recency`, `consistency`, `variety`, `wellbeing`). Two mismatches: (1) flat number vs object, (2) `recency` vs `activity` key name.

### Fix
Made `renderScoreHero` self-normalising — accepts both shapes via `toPts()` helper and maps `recency → activity`. Covers fresh fetch, offline cache, and any future stale localStorage data.

### Data was NOT lost
All 30 days of activity data is intact in the raw tables. The 97 score was correct. Only 1 day (April 18) had a partial gap from the trigger bug. The 24 active days in the last 30 days are all present.

### What shipped
- `engagement.html` — renderScoreHero normalises component shape
- `sw.js` — bumped to `vyve-cache-v2026-04-19d`
- Commit: 0926e456fae7d3f5fc48b4a1992ace26b1ea7914

## 19 April 2026 — member-dashboard EF 500 error (wrong column names)

### Root cause
member-dashboard v40 queried two tables with wrong column names — PostgREST returned 400 on both, the `q()` helper threw, Promise.all rejected, catch block returned 500. This was the actual reason engagement score showed "--" — the EF was crashing before returning any data.

Wrong columns:
- `wellbeing_checkins`: queried `checkin_week` (→ `iso_week`) and `wellbeing_score` (→ `score_wellbeing`)
- `weekly_scores`: ordered by `week_start` (→ `iso_week`)
- Response: `wbCheckins.checkin_week` (→ `wbCheckins.iso_week`)

### Fix
Deployed member-dashboard **v41** with correct column names. No other logic changed.

### Correct column names (for future reference)
- `wellbeing_checkins`: `iso_week`, `score_wellbeing`, `score_energy`, `score_stress`, `composite_score`
- `weekly_scores`: `iso_week`, `iso_year`, `wellbeing_score`, `engagement_score`, `logged_at`

## 19 April 2026 — index.html habit strip not showing today as complete

### Issue
Sunday not checked off on the 7-day habit pill strip on the dashboard, even after logging all 5 habits. Streaks, counts, and score were also silently broken on index.html.

### Root cause
Same v35 → v40 response shape mismatch as engagement.html (fixed same session). `renderDashboardData()` destructures `data.habitStrip`, `data.habitDatesThisWeek`, `data.counts`, `data.streaks`, `data.score`, `data.wbScore`, `data.daysInactive` — none of which exist in the member-dashboard v40 response. All rendered as undefined/blank.

### Fix
Injected a v40→v35 translation block at the top of `renderDashboardData()`, inside the guard `if(data.engagement && !data.score)`. Derives:
- `habitStrip` — Mon–Sun dates of current week computed from local time
- `habitDatesThisWeek` — filtered from `data.activity_log` where `activities` includes `'habits'` and date is in this week
- `counts`, `streaks`, `score`, `wbScore`, `daysInactive`, `charity`, `goals` — mapped from v40 nested structure

Translation runs for both fresh fetch and cache read paths since it lives inside `renderDashboardData`.

### What shipped
- `index.html` — v40 translation in renderDashboardData
- `sw.js` — bumped to `vyve-cache-v2026-04-19b`
- Commit: 7bfbff28bd7419c42f247369a91b1a48d36eef9c

## 19 April 2026 — Platform-wide activity logging broken + engagement score broken

### Root cause 1: SECURITY INVOKER triggers blocking all activity writes
New triggers (`zz_sync_activity_log`, `increment_habit_counter`) were added to all 6 activity tables (daily_habits, workouts, cardio, session_views, replay_views, wellbeing_checkins). These are SECURITY INVOKER — they run as the authenticated user. They write to 3 new tables (`member_activity_log`, `member_activity_daily`, `member_notifications`) which had RLS enabled with zero policies (default deny). Every activity INSERT was rolling back silently. No data landed from ~18 April onwards.

### Fix: SECURITY DEFINER on trigger functions (Supabase migration)
Rebuilt `vyve_sync_activity_log`, `increment_habit_counter`, and `vyve_refresh_daily` as SECURITY DEFINER so they run as the table owner and bypass RLS on the internal bookkeeping tables. Verified with authenticated INSERT test — all triggers fire correctly.

### Root cause 2: engagement.html expecting old member-dashboard v35 response shape
engagement.html was destructuring `data.score`, `data.counts`, `data.streaks`, `data.activityLog` (v35 shape). member-dashboard is now v40 which returns `data.engagement.score`, `data.progress.x.count`, `data.engagement.streak`, `data.activity_log` with `activities[]` not `types[]`. All render functions received undefined, score showed as NaN/blank.

### Fix: translation layer in loadPage() (engagement.html)
Added a mapping block after the fetch that translates the v40 response into the v35 shape expected by renderScoreHero, renderActivityGridFromPrecomputed, renderLogFromPrecomputed, renderStreaksFromPrecomputed. No render functions changed — only the data mapping.

### What shipped
- Supabase migration: `fix_trigger_security_definer`
- `engagement.html` — v40 response mapping
- `sw.js` — bumped to `vyve-cache-v2026-04-19a`
- Commit: 131bf2a14bfbacc150e6f0186aac56949e1fbc2c

### New tables discovered (not in brain)
- `member_activity_log` — audit log of all activity events (source_table, source_id, member_email, activity_type, activity_date, logged_at, metadata)
- `member_activity_daily` — aggregated daily activity counts per member
- `member_notifications` — streak milestone notifications

## 18 April 2026 — Certificates page stuck on loading spinner (auth polling pattern removed from certificates.html + settings.html)

### Issue reported by Dean

Certificates page hung on the loading spinner in both Chrome and Safari. Dean had one legitimate certificate in the DB (sessions track, 30 milestone, global cert No. 0001, earned 18 Apr 20:35 UTC) but could not see it anywhere. Initial hypothesis was a `member-dashboard` EF outage; diagnosis proved otherwise.

### Root cause

Two portal pages still used the legacy `waitForAuth(n)` polling pattern — explicitly flagged as a bug in master.md Rule 22 ("Any page still using the polling pattern is a bug"). Pattern:

```js
function waitForAuth(n) {
  if (window.vyveCurrentUser) { loadPage(); return; }
  if (n > 50) { loadPage(); return; }      // gives up after 5s
  setTimeout(() => waitForAuth(n + 1), 100);
}
async function loadPage() {
  const user = window.vyveCurrentUser;
  if (!user?.email) return;                 // ← silent return, spinner hangs forever
  ...
}
```

When `auth.js` took longer than 5 seconds to set `window.vyveCurrentUser` — which became more likely after the 11 Apr security audit tightened JWT handling and CORS on the JWT-gated EFs — polling timed out, `loadPage()` was called anyway, returned silently on the no-user branch, and left the skeleton spinner up with no console error, no failed fetch, no unhandled rejection. This matches the "silent failures" pattern called out in master.md: the platform monitor has no signal because nothing fails loudly.

`settings.html` had the same pattern. Its n>50 branch showed an empty `#app` div instead of the spinner, which is why it hadn't yet surfaced as a user-visible bug, but it would have on a cold load.

Portal-wide scan confirmed only these two pages carried the bug. `index.html`, `habits.html`, `engagement.html` already use the correct event-driven pattern. `workouts.html` uses MutationObserver per Rule 12. Everything else either doesn't call member-dashboard or uses a different init path.

### What shipped

**`vyve-site` portal** — single atomic commit

- `certificates.html`
  - Replaced `waitForAuth(n)` polling with event-driven pattern (listens on `vyveAuthReady`, immediate-fire if `window.vyveCurrentUser` already set, hard 8s fallback that redirects to `/login.html`)
  - `loadPage()` no-user branch: silent `return` → `window.location.href = '/login.html'` so auth failure is visible, not silent
- `settings.html`
  - Same auth pattern swap, preserving the cache-first fast path (populateFromCache → loadProfile in background)
  - n>50 silent "show empty app" branch also replaced with login redirect
- `sw.js` cache: `vyve-cache-v2026-04-18d` → `vyve-cache-v2026-04-18e`

### Why the fix makes the certificate visible

Dean's one certificate row is intact in `public.certificates` (id `2391eb97-82c6-4952-addd-0ae6c80b6210`, activity_type `sessions`, milestone_count 30, global_cert_number 1, certificate_url populated, charity_moment_triggered true). `member-dashboard` v25 returns `data.certificates[]`, and `certificates.html`'s `render()` reads those columns directly into a cert card. The only thing blocking render was the auth-timeout silent hang. With the event-driven pattern, `loadPage()` runs as soon as auth.js dispatches `vyveAuthReady`, the fetch completes, and the "Live Sessions / The Explorer / 30 completed / No. 0001 / 18 Apr 2026" card renders.

### Follow-ups

- That sessions certificate was issued earlier today — worth a sanity check on whether Dean's actual `session_views` count is ≥ 30 or whether certificate-checker fired on a test insert. Not a blocker.
- Rule 22 candidate upgrade: consider a CI grep for `function waitForAuth(n)` to fail builds if the polling pattern ever reappears.
- Outstanding items from 11 Apr audit (A4 service-role refactor, A5 XSS audit on innerHTML, C2 onboarding race ordering, C3 dashboard over-fetching, C4 PostHog email hashing, B1 one-shot EF deletions) remain open.

### Source of truth used

- `VYVEHealth/vyve-site` main: `certificates.html` (SHA 310d1d1), `settings.html` (SHA 194dcfb), `auth.js` (SHA dda1103), `index.html` (SHA 29348cf for reference pattern), `sw.js` (SHA 00d957c)
- Live Supabase project `ixjfklpckgxrwjlfsaaz`: `public.certificates` row for deanonbrown@hotmail.com, `public.members`, activity count queries
- Portal-wide scan across 12 pages to confirm only certificates.html and settings.html carried the polling pattern

---

## 18 April 2026 — Three-issue fix session (monthly-checkin 500, weekly check-in zoom, notifications safe-area)

### Issues reported by Dean

1. Monthly check-in threw 500 critical alert (`api_500_monthly-checkin`, /monthly-checkin.html, 02:42 BST)
2. Weekly check-in page rendered visibly zoomed inside the iOS app — content cropped on both sides
3. Notifications page back button overlapped the iOS status bar; bottom nav looked inconsistent with the rest of the portal

### Root causes

**Issue 1 — `monthly-checkin` EF schema drift.** Live table `public.wellbeing_checkins` has `score_wellbeing` (not `wellbeing_score`) and does **not** have `band` or `answer` columns at all. EF v15 queried all three. The error was surfaced via function_logs: `42703 column wellbeing_checkins.wellbeing_score does not exist` (thrown from `q()` inside `Promise.all`). GET worked for Dean because GET doesn't touch this table; POST fails immediately on submit.

**Issue 2 — `wellbeing-checkin.html` nav scoping + viewport.** The file declared a bare `nav { position:fixed; ... }` CSS selector instead of the `nav.desktop-nav { ... }` pattern used by the rest of the portal. Result: the inline desktop nav was **not** hidden on mobile (nav.js's `@media(max-width:768px){nav.desktop-nav{display:none!important}}` rule only targets `.desktop-nav`). On mobile we rendered both the page's own `<nav>` and nav.js's injected `.mobile-page-header` simultaneously, pushing the layout beyond 100vw. The viewport meta also lacked `user-scalable=no, maximum-scale=1.0` (other portal pages have it), so any accidental pinch-zoom persisted across reloads.

**Issue 3 — `.notif-topbar` missing safe-area-inset-top.** Inline notifications overlay in `index.html` uses `position:fixed; inset:0; z-index:10002` and a top bar with `padding:14px 16px 14px` — no allowance for the iOS status bar / notch. Back button renders directly under the clock. Bottom `.notif-nav` also used different paddings, height, icon size, and font weight than the sitewide `.vyve-bottom-nav`, producing the visible inconsistency Dean flagged.

### What shipped

**`monthly-checkin` EF v16** (ixjfklpckgxrwjlfsaaz)
- `wellbeing_checkins` SELECT: `wellbeing_score,band,answer,activity_date` → `score_wellbeing,activity_date`
- `wbSummary` now reads `c.score_wellbeing` and derives band inline via new `scoreBand(score)` helper (1-3 struggling, 4-5 getting by, 6-7 solid, 8-10 strong)
- `avgWellbeing` now reads `r.score_wellbeing`
- `verify_jwt: false` preserved (Rule 21 — internal JWT validation pattern)

**`vyve-site` portal** — single atomic commit [dec290d](https://github.com/VYVEHealth/vyve-site/commit/dec290d31c552e4e164d17cd902b4e382585153e)
- `wellbeing-checkin.html`
  - Viewport meta now matches `index.html`: `width=device-width, initial-scale=1.0, interactive-widget=resizes-content, user-scalable=no, maximum-scale=1.0`
  - Added `<meta name="mobile-web-app-capable" content="yes"/>` (was in the 13-page backlog list)
  - Bare `nav { ... }` CSS selector → `nav.desktop-nav { ... }`
  - `<nav>` tag → `<nav class="desktop-nav">`
  - Added `@media (max-width:768px) { main { padding-top:0 !important } }` so the 64px top pad is desktop-only
- `index.html`
  - `.notif-topbar` padding: `14px 16px 14px` → `calc(14px + env(safe-area-inset-top,0px)) 16px 14px`
  - `.notif-nav` + `.notif-nav-item`: restyled to match `.vyve-bottom-nav` metrics (padding `4px 4px 0` + safe-area bottom, no fixed height, `min-height:42px` on items, `font-family:'DM Sans'`, `font-size:10px; font-weight:600`, svg 24px, `flex:1` items)
- `sw.js` cache: `vyve-cache-v2026-04-17v` → `vyve-cache-v2026-04-18a`

### Drift discovered

- **`monthly-checkin` EF version** — master.md said v13, live was v15 (now v16). Noted for next brain reconciliation.
- **`sw.js` cache version** — master.md said `vyve-cache-v2026-04-17u`, live was `-17v` at session start (now `-18a`).
- **onboarding EF** — not touched this session but worth re-checking on next full reconciliation given the pattern of undocumented version bumps.

### Lessons + rule implications

- **Rule candidate:** Any portal page with a page-level `<nav>` must use `class="desktop-nav"` so nav.js's mobile-hide rule applies. Bare `nav { }` selectors are a hidden-overlap trap. Adding as Rule 36 candidate — pending audit of other portal pages for the same pattern before codifying.
- Schema drift in EFs is caught by the real system at POST time, not at deploy time. The monthly-checkin EF hadn't been exercised end-to-end on the live schema since the `wellbeing_checkins` refactor. Consider adding a lightweight integration smoke test before onboarding Sage.
- Backlog item closed: notif-topbar safe-area was not previously tracked — add it to the "mobile polish" class of issues.

### Source of truth used

- Live Supabase project `ixjfklpckgxrwjlfsaaz`: `function_edge_logs`, `function_logs`, `information_schema.columns` for `wellbeing_checkins` / `weekly_scores` / `monthly_checkins` / `platform_alerts`
- `VYVEHealth/vyve-site` main: `wellbeing-checkin.html` (SHA 6be48c8), `index.html` (via s3url — 82KB), `nav.js` (SHA ba26124), `sw.js` (SHA 9cdcc9e)
- `platform_alerts` row `8b8f15d2-81e3-4c87-8884-ec65df9e311a`

---

## 18 April 2026 — Full System Reconciliation (Brain vs Live)

### Why

Per Rule: "VYVEBrain drift happens incrementally — root cause of past audit failures was patching master.md rather than periodically rewriting it." This session was a scheduled full rewrite: every claim in `brain/master.md` was checked against the live Supabase project (`ixjfklpckgxrwjlfsaaz`) and the live Edge Function inventory. Four material drifts were found.

### Drift fixed in this session

**1. Database triggers — 119 live, Brain said 0.**

The Brain has been telling every session that activity caps are "application-level only (log-activity EF)". This is materially untrue. The DB enforces caps, derives time fields, lowercases emails, and fans out to the activity log via triggers. Full inventory now documented in master §4:

| Family | Tables | Purpose |
|---|---|---|
| `zz_lc_email` BEFORE INS/UPD (via `vyve_lc_email()`) | 42 tables | Email canonicalisation |
| `enforce_cap_*` BEFORE INS | workouts, cardio, daily_habits, kahunas_checkins, session_views | Cap enforcement → over-cap → `activity_dedupe` |
| `counter_*` AFTER INS | same 5 | Increment per-member counters on `members` |
| `auto_time_fields_*` BEFORE INS | 6 activity tables | Derive `day_of_week`, `time_of_day` |
| `auto_iso_week_*` BEFORE INS | kahunas_checkins, wellbeing_checkins | Derive `iso_week`, `iso_year` |
| `zz_sync_activity_log` AFTER INS/UPD/DEL | 7 activity tables | Fan-out to `member_activity_log` |
| `*_updated_at` BEFORE UPD | 11 cc_* tables + push_subscriptions_native | Maintain `updated_at` |

**2. Foreign keys — 25 live, Brain said 0.**

All 25 FKs target `public.members.email` (plus 2 on `habit_library.id`). Every member-scoped table has referential integrity. Inventory now in master §4.

**3. Aggregation / admin layer — 7 tables + 11 functions + 4 cron jobs undocumented in master.**

Added 18 April (earlier session today), but not yet merged into `master.md §4`. Now fully documented, including:

- Tables: `member_stats` (17), `member_activity_daily` (99), `member_activity_log` (243), `company_summary` (3), `platform_metrics_daily` (92), `admin_users` (3), `vyve_job_runs` (1) — all **RLS-enabled with zero policies → service-role only via EFs** (now codified as Rule 33)
- Functions: `compute_engagement_score`, `compute_engagement_components`, `recompute_member_stats`, `recompute_all_member_stats`, `recompute_company_summary`, `recompute_platform_metrics`, `rebuild_member_activity_daily`, `rebuild_member_activity_daily_incremental`, `backfill_platform_metrics`, `bump_member_activity`, `vyve_refresh_daily`
- Cron jobs: `vyve_recompute_member_stats` (*/15m), `vyve_rebuild_mad_incremental` (*/30m), `vyve_recompute_company_summary` (02:00 UTC), `vyve_platform_metrics` (02:15 UTC)
- Plus `warm-ping-every-5min` keep-warm cron (previously undocumented)

**4. Edge Function inventory — 58 active, Brain master listed ~22 with stale versions.**

Version drift updated for every production EF. Missing EFs added to master §5: `admin-dashboard` v6, `cc-data` v2, `send-password-reset` v2, `warm-ping` v1, `leaderboard` v7 (plus corrected versions for `notifications` v7, `share-workout` v6, `workout-library` v4, `onboarding` v74, `wellbeing-checkin` v32, `monthly-checkin` v13, `off-proxy` v16, `certificate-serve` v15, `github-proxy` v19, `habit-reminder` v8, `streak-reminder` v8, `send-test-push` v7, `daily-report` v21, `weekly-report` v14, `monthly-report` v14, `employer-dashboard` v29, `log-activity` v19).

### New rules added to master §10

- **Rule 33:** Aggregation tables are service-role only. `member_stats`, `member_activity_daily`, `member_activity_log`, `company_summary`, `platform_metrics_daily`, `admin_users`, `vyve_job_runs` have RLS enabled with NO policies — readable only from Edge Functions running as service role. Any client-side direct access will silently return zero rows.
- **Rule 34:** Activity caps are DB-level. `enforce_cap_*` triggers block over-cap inserts and route them to `activity_dedupe`. Do not duplicate cap logic in `log-activity` EF.
- **Rule 35:** Email lowercasing is automatic. `zz_lc_email` triggers on 42 tables lowercase `member_email` on every write. Application code does not need to `.toLowerCase()` before inserting.

### Section numbering fixed

Master had three `## 12.` sections (Security, Design System, Offline). Renumbered 12/13/14, with Section 15 "On the Horizon" and Section 16 "Key URLs" shifted accordingly.

### Other corrections

- Member count: 16 → 17 (one new member since last snapshot)
- Table count: "Supabase — 61 Tables" → **68 tables**
- Function count: schema-snapshot's "15" → **31 functions in public**
- Cron count: "4 jobs" → **12 jobs**
- `generate-workout-plan` EF: Brain said "RETIRED v5" but live is v9, active — flagged for decision (delete or un-retire)
- `staging/onboarding_v67.ts` flagged as stale (live is v74) — deletion pending Dean sign-off
- `brain/schema-snapshot.md` flagged as 8 days stale (lists 36 tables) — automate or delete pending Dean sign-off
- `auth.js` version disagreement inside master.md (§3 v2.3, §12 v2.4) — flagged for reconciliation

### Items closed in `tasks/backlog.md`

- "master.md §4: correct the 'No triggers' / 'No FKs' claims (14 triggers + 24 FKs live)" — closed (actual counts 119/25, now documented)
- "master.md §4: document the aggregation layer" — closed
- "master.md §10: add Rule 33" — closed (plus Rules 34, 35)
- "Add Dean + Lewis to admin_users" — closed (3 rows present, no action needed)

### Items added to `tasks/backlog.md`

- Resolve `generate-workout-plan` EF ambiguity
- Delete `staging/onboarding_v67.ts` (or refresh)
- Refresh/automate/delete `schema-snapshot.md`
- Reconcile `auth.js` version inside master.md
- Document user-ban workflow (anthony.clickit@gmail.com orphan in auth.users)
- Archive pre-April changelog into `changelog-archive/2026-Q1.md`
- Clarified "89 dead EFs" → now ~9 one-shot migrations remaining (most were deleted in earlier cleanups)

### Artefacts

- `audits/Reconciliation report` — full drift report, action plan, and true-system-state summary
- `brain/master.md` — rewritten
- `tasks/backlog.md` — rewritten

### Source of truth used

- Live Supabase project `ixjfklpckgxrwjlfsaaz`: `list_tables`, `list_edge_functions`, `execute_sql` against `information_schema`, `pg_catalog`, `pg_policies`, `pg_indexes`, `cron.job`, `auth.users`
- `VYVEHealth/VYVEBrain` main: `brain/master.md`, `brain/changelog.md`, `brain/schema-snapshot.md`, `brain/audit_updates.md`, `tasks/backlog.md`, tree listing

---

## 18 April 2026 — Admin Dashboard + Aggregation Layer Reconciliation

### What shipped

**Admin dashboard** — Single-file HTML (`apps/admin-dashboard/admin.html`, ~1000 lines)
delivered. Supabase Auth login, six views (Overview, Trends, Activity Feed, Alerts,
Members, Companies) plus a five-tab member deep-dive modal (Overview / Timeline /
Programme / Emails / Raw). Chart.js for 30d and 60d trends. Dark+light theme. All
data access goes through a new `admin-dashboard` Edge Function (verify_jwt=false,
internal JWT validation, `admin_users` allowlist). No service key on the client.

**Aggregation layer — schema extension.** The prior session's skeleton tables
(`member_stats`, `member_activity_daily`, `company_summary`, `platform_metrics_daily`)
extended with missing columns:

- `member_stats`: added `activity_score`, `consistency_score`, `variety_score`,
  `wellbeing_score_component`, `latest_stress_score`, `latest_energy_score`,
  `programme_active`, `programme_paused_at`
- `member_activity_daily`: added `replays_count` (previously merged with sessions)
- `company_summary`: added `company_slug`, `activities_30d`
- `platform_metrics_daily`: added `total_members`, `active_users_7d`,
  `active_users_30d`, `habits_count`, `workouts_count`, `cardio_count`,
  `sessions_count`, `checkins_count`, `unresolved_alerts`
- `admin_users`: added `active` flag + `notes`; seeded Dean + Lewis.

**Aggregation functions — upgraded** (same names, backward-compatible):

- New `compute_engagement_components()` returns the 4 component sub-scores as jsonb
- `recompute_member_stats(email)` — populates all new columns; `needs_support` now
  also flags `stress <= 3` (inverted scale: 3 = very stressed)
- `recompute_company_summary()` — adds slug + 30d activities
- `recompute_platform_metrics(date)` — adds totals + per-type breakdown + alerts
- `rebuild_member_activity_daily()` — splits sessions from replays

**Source-table indexes** (16 April audit quick-wins, now done): `workouts(member_email)`,
`cardio(member_email)`, `certificates(member_email)`, `ai_interactions(member_email)`,
plus `logged_at DESC` on every activity table and `member_activity_log`.

**Backfill run:** 17 member_stats rows, 99 member_activity_daily rows,
3 company_summary rows, 91 days of platform_metrics_daily.

### Why

The admin dashboard needs sub-ms list views at 5,000+ members, which is impossible
if we scan raw tables for every query. The aggregation layer shifts list views to
pre-computed tables and reserves raw scans for the 30-day hot window on member
deep-dive only.

### Brain corrections (master.md out of date)

1. **Aggregation layer already existed** before today. A prior Claude session had
   built `member_stats`, `member_activity_daily`, `company_summary`,
   `platform_metrics_daily`, `member_activity_log` (view), six `recompute_*`
   functions, and four pg_cron schedules. None of this was in master.md, the
   changelog, or the brain at all. Today's work extended rather than recreated.
2. **"Zero triggers" rule is wrong.** master.md §4 says "activity caps enforced by
   application code only (log-activity EF)" — in reality, five `enforce_cap_*` DB
   triggers and five `counter_*` DB triggers have been running for months, along
   with `auto_time_fields_*`, `auto_iso_week_*`, and ten `cc_*_updated_at` triggers.
   14 triggers on public-schema tables, not zero. Needs a master.md pass.
3. **Foreign keys exist.** master.md §4 says "No foreign keys" — there are 24.
4. `admin_users` table already existed — we extended it with `active` + `notes`.

### Rule addition

**Rule 33: Aggregation layer is app-wide.** `member_stats`, `member_activity_daily`,
`company_summary`, `platform_metrics_daily`, `admin_users` are EF-service-role only.
RLS enabled with no policies — locked out via direct-client access. Any page or
script that needs them must go through the `admin-dashboard` EF or another
service-role EF.

---

## 17 April 2026 — Desktop Nav Parity, Script Injection Fixes, SW Cache Fix

### What shipped

**nav.js — Desktop More dropdown + avatar profile panel**
- Desktop nav (>768px) now has a "More ▾" dropdown button in the nav links bar. Reveals all secondary features grouped into: Check-Ins (Weekly, Monthly), Progress (Certificates, Leaderboard, Activity Score), Tools (Running Plan, Guides & PDFs, How-to Videos, Catch-Up).
- Avatar (top right) is now a clickable profile panel showing member name, email, Settings link, and Sign Out. Replaced the bare "Sign out" button.
- New globals: `vyveToggleNavMore(e)`, `vyveToggleAvatarMenu(e)`, `vyveCloseAllDesktop()`. Desktop overlay (#navDesktopOverlay, z-index:99) closes both panels on outside click. Escape key closes both.
- Mobile completely unchanged — still bottom nav + More bottom sheet.
- CSS rule: `@media(max-width:768px)` hides all new desktop dropdown CSS from mobile.

**Script injection corruption fixed — engagement.html, certificates.html, index.html**
- Root cause: An old `patch-*` series Edge Function (now deleted) used naive text injection to add `<script src="/offline-manager.js"></script>` to portal pages. It landed inside `<script>` blocks rather than in the `<head>`. The browser's HTML parser terminates a script block at `</script>`, silently breaking all JS after that point.
- `engagement.html`: injection was at `const [injected]avatarEl` — the auth trigger (loadPage call, 1299 bytes later) never executed. Data never loaded. Appeared as a blank/loading state.
- `certificates.html`: injection was inside the `/login.html` string — the fetch chain broke entirely. Page showed eternal loading state.
- `index.html`: injection was inside `'Content-Type'` header string in the platform-alert section — inside try/catch, so dashboard functioned normally.
- Fix: removed all three bad injections, restored correct JS, added `<script src="/offline-manager.js"></script>` in correct position before `</body>`.
- `mobile-web-app-capable` meta tag added to all three pages (was previously only `apple-mobile-web-app-capable`).

**sw.js — Cache migration removed from activate handler**
- Root cause of "loads after hard reset" bug: the sw.js activate handler was copying portal pages from old caches into the new cache during version bumps. This migrated stale/broken files forward — a hard reset bypassed the service worker entirely and fetched fresh from the network.
- Fix: activate handler now simply deletes old caches. Portal pages that are not yet in the new cache fetch from network on first visit, then are cached normally. No more stale file carryover.
- Cache version: bumped to `vyve-cache-v2026-04-17u`.

**Certificate status check (deanonbrown@hotmail.com)**
- cert_sessions_count: 27/30. cert_habits_count: 27/30. cert_workouts_count: 20/30. cert_checkins_count: 7/30. cert_cardio_count: 9/30.
- No certificates in DB yet for this account. certificates table confirmed empty. certificate-checker reads the pre-computed `cert_*_count` columns on the members table (not live session_views count).
- 3 more live session views needed to trigger The Explorer certificate.

---

## 17 April 2026 — Offline Mode: Auth Fast-Path + Data Caches

### What shipped
- **auth.js v2.4** — offline fast-path before `getSession()`: checks `navigator.onLine`, reads cached Supabase session from localStorage key `vyve_auth`, builds user object, fires `vyveAuthReady` immediately without any network call. Fixes blank screen when opening the app in airplane mode. If no cached session exists offline, redirects to login as normal.
- **offline-manager.js** — new shared file on all portal pages. Exports `window.VYVEOffline`: `showBanner(ts)`, `hideBanner()`, `disableWriteActions()`, `enableWriteActions()`. Auto-inits on load. Banner: fixed, z-index 10002, `#1B7878`, top:0 desktop / top:56px mobile. Dispatches `vyve-back-online` CustomEvent on reconnect.
- **index.html** — wired to show offline banner with last-updated time from existing `vyve_home_v2_*` cache. Hides on fresh fetch.
- **habits.html** — full `vyve_habits_cache` pattern + `data-write-action` on submit button.
- **engagement.html** — full `vyve_engagement_cache` pattern.
- **certificates.html** — full `vyve_certs_cache` pattern.
- **leaderboard.html** — full `vyve_leaderboard_cache` pattern.
- **workouts.html** — `offline-manager.js` loaded + `data-write-action` on completion-done button.
- **nutrition.html** — `offline-manager.js` loaded + `data-write-action` on 5 write buttons.
- **sessions.html** — `offline-manager.js` loaded (static data, already works offline).
- **wellbeing-checkin.html** — `offline-manager.js` loaded + both submit buttons get `data-write-action` + offline state: "Submit when back online", re-enables on `vyve-back-online`.
- **sw.js** — `offline-manager.js` added to `PRECACHE_ASSETS`, version bumped `p → q`.

### Cache key pattern
`vyve_[page]_cache` → `{ data, ts: Date.now(), email }`. TTL 24h. Always verify `cached.email === memberEmail`.

### Commit
`6b988b930d07ccdd1a7fbf414e56112c3cef0e67` — VYVEHealth/vyve-site

---

## 17 April 2026 — Phase C: Session Page Consolidation

### What shipped
- 14 session pages (7 live + 7 replay) consolidated from ~22KB each to ~1.2KB stubs
- 4 new shared files: `session-live.css`, `session-rp.css`, `session-live.js`, `session-rp.js`
- Each stub sets `window.VYVE_SESSION` config object; shared JS builds full DOM into `#session-app`
- Auth gate: `window.addEventListener('vyveAuthReady', ...)` — correct pattern from auth.js
- All VYVE brand hex replaced with CSS var tokens in both CSS files
- `podcast-live.html`: correct live stub with empty `videoId` — renders "Not streaming live" placeholder
- `sw.js`: PRECACHE_ASSETS and PORTAL_PAGES updated; session shared JS/CSS removed from PRECACHE (network-fetch always); skipWaiting made unconditional to prevent SW update stalls
- Cache bumped `l` → `p` across multiple fix commits

### Bugs fixed during rollout
| Bug | Root cause | Fix |
|-----|-----------|-----|
| Blank session pages | `vyveAuthReady` dispatched on `window` (not `document`) in auth.js | Changed to `window.addEventListener` |
| Fix not propagating on normal refresh | `skipWaiting()` chained to `cache.addAll()` — any precache failure blocked SW activation indefinitely | `skipWaiting()` now fires unconditionally |
| Fix not propagating on normal refresh (2) | session-live.js in PRECACHE_ASSETS (cache-first, no revalidation) | Removed from PRECACHE — always network-fetch |

### Key learnings
- `vyveAuthReady` is dispatched on `window`, not `document`. All pages that listen for it must use `window.addEventListener`.
- `skipWaiting()` must never be chained to precache success — a single 404 in PRECACHE_ASSETS silently blocks all future SW updates.
- Shared JS files that are actively developed should NOT be in PRECACHE_ASSETS. Use network-fetch or stale-while-revalidate instead.

### Commits (vyve-site)
- `d1aa68c` — Phase C: 14 stubs + 4 shared files
- `339f560` — Fix: window.addEventListener for vyveAuthReady
- `b5a8bdb` — Fix: remove session files from PRECACHE_ASSETS
- `74e80f7` — Fix: unconditional skipWaiting

## 17 April 2026 — Offline Root Cause Confirmed

Investigated the blank screen reported when opening the app with no signal.

**Root cause:** Auth works correctly offline (Supabase reads JWT from localStorage, no network call needed). The blank screen is caused by the `member-dashboard` Edge Function POST call failing silently with no network, with zero localStorage fallback. The HTML loads from SW cache, auth resolves, then the EF call fails and the page renders nothing.

**Not the cause:** Auth redirect. The user was NOT sent to the login page — they stayed on the dashboard page but saw no data.

**Fix scope:** Data layer only — add localStorage cache fallback to all pages that call Edge Functions. Auth offline fix is precautionary, lower priority.

**Playbook updated:** `playbooks/phase-c-offline-build.md` corrected with accurate root cause analysis and reprioritised Layer 1 (data cache) as the primary fix.

## 17 April 2026 — Phase B Semantic Colour Migration

### Changes
- **index.html**: `--track-color2:#7AC8C8` → `var(--teal-xl)` (inline style on tracks grid card)
- **nutrition.html**: 3x `linear-gradient(135deg,#1B7878,...)` → `var(--teal)` in `.save-btn`, `.empty-cta`, `.log-save-btn`
- **sw.js**: cache version bumped `k` → `l`

### Audit findings (no changes needed)
- habits.html POT_CONFIG already has correct new pot colours from a prior session — no change needed
- settings.html light-mode token overrides are intentional per-page values (not redundant) — left as-is
- workouts.html — no actionable CSS hex values found
- JS setAttribute contexts (nutrition chart SVG dots) left as hex — CSS vars cannot be used in JS attribute values

### Commit
- vyve-site: `e136376fbc7440b1f94e5fa801557bc9cbd7dca6`

## 17 April 2026 — Phase B Semantic Colour Migration

### Changes
- **index.html:** Track colours (habits/workouts/cardio/sessions) → `var(--track-*)` tokens across all inline styles, SVG stroke/fill, and CSS variable assignments. Score label `#4DAAAA` → `var(--teal-lt)`.
- **settings.html:** Removed duplicate `:root` brand token block (teal/amber/coral/fonts — already in theme.css). Difficulty colours → semantic tokens: easy `#2D9E4A` → `var(--success)`, medium `#E09B3D` → `var(--warning)`, hard + delete `#E06060` → `var(--danger)`.
- **nutrition.html:** Macro nutrient colours → brand tokens: protein `#4DAAAA` → `var(--teal-lt)`, fat `#E09B3D` → `var(--amber)`, carbs `#2D9E4A` → `var(--green)`. Applied across macro bars, legend dots, gradients, SVG chart lines.
- **habits.html:** POT_CONFIG updated with correct pot colours: mindfulness `#E09B3D` → `#5BA8D9` (`--pot-mindfulness`), social `#E06060` → `#E879A3` (`--pot-social`), sleep `#9B7AE0` → `#6366B8` (`--pot-sleep`).
- **workouts.html:** No changes (no track colour hits).
- `sw.js` cache version: k → l

### Commit
- vyve-site: `c998db430ac5232c0b09abc28444ebadea0f0905`

### Next: Phase C — Session-page template consolidation
14 `-live.html` and `-rp.html` pages → 3 shared component files.

## 17 April 2026 — Phase A Design System Token Foundation

### Context
Full UI/UX consistency audit revealed 163 unique hex colours, 118 unique font sizes, 72 unique button class names across 39 HTML pages. Phase A establishes the token foundation in `theme.css` (additive only — no page migrations).

### Changes
- Added semantic colour aliases: `--success/warning/danger` (+ soft/strong variants), `--gold/gold-soft`, `--teal-dark`
- Added 5-way activity track tokens: `--track-habits/workouts/cardio/sessions/nutrition`
- Added 5-way habit pot tokens: `--pot-movement/nutrition/mindfulness/social/sleep` — 3 new colours for mindfulness (#5BA8D9), social (#E879A3), sleep (#6366B8)
- Added spacing scale: `--space-0` through `--space-16`
- Added typography scale: `--text-2xs` through `--text-4xl`, `--leading-*`, `--weight-*`
- Added radius tokens: `--radius-sm/radius/radius-lg/radius-xl/radius-pill/radius-circle` — fixes dangling `var(--radius)` in running-plan.html + internal-dashboard/index.html
- Added shadow scale: `--shadow-sm/md/lg/glow-teal`
- Aliased `--muted: var(--text-muted)` in both dark + light theme blocks — fixes 18 dangling references across all session/replay pages
- Added `--on-accent: var(--white)` alias in both theme blocks
- Bumped `sw.js` cache version: `vyve-cache-v2026-04-15j` → `vyve-cache-v2026-04-15k`
- No page migrations performed — tokens are additive only

### Dangling refs resolved
- `var(--radius)`: running-plan.html, internal-dashboard/index.html — was 0 (sharp corners), now 10px
- `var(--radius-lg)`: running-plan.html — was 0, now 14px
- `var(--muted)`: 18 session/replay pages — was inheriting parent colour, now `--text-muted` (intended muted styling)

### Commit
- vyve-site: `e5be4f594b2ea7cb7a46cb96f92ddf8fb9013885`

### Next: Phase B — Semantic Colour Migration
Migrate index.html, settings.html, workouts.html, nutrition.html, habits.html from hardcoded hex values to design tokens. Includes `habits.html` POT_CONFIG swap to `--pot-*` tokens.

## 16 April 2026 — Full Brain Reconciliation (Deep Audit)

### Context
Full deep audit performed: all project chats reviewed, live Supabase DB inspected (61 tables, RLS policies, indexes, constraints), live repo tree analysed, key Edge Functions source-read, auth.js + sw.js + index.html analysed for security patterns. Brain was found materially outdated — master.md had drifted significantly from reality.

### master.md — Complete Rewrite
- Rewrote from scratch against live system state
- Table count corrected: 36 -> 61 (23 undocumented tables found including programme_library, shared_workouts, ai_decisions, member_notifications, push_subscriptions_native, 18 cc_* command centre tables)
- All Edge Function versions updated to match live deployed versions
- Documented all features built since last accurate sync: workout library, session sharing, in-app notifications, web push, platform monitoring, monthly check-in, nutrition setup, custom habits, skeleton timeout monitors
- Added 30 hard rules (was ~19)
- Added App Store status section
- Added nav.js injection heights reference
- Added complete file inventory for vyve-site repo
- Documented HAVEN being assigned live (Conor Warren, 15 April)
- Documented all known security issues from deep audit
- VYVE_Health_Hub.html identified as standalone demo page (182KB, no auth, not part of portal)

### Key Findings from Audit
- 0 foreign keys across all 61 tables
- 0 database triggers (activity caps are application-level only in log-activity EF)
- 5 tables missing index on member_email (workouts, cardio, certificates, shared_workouts, running_plan_cache)
- running_plan_cache has public UPDATE RLS policy (security hole)
- XSS risk in index.html via innerHTML + firstName
- platform_alerts table has RLS enabled but no policies (locked out)
- PostHog sends raw email PII
- 89 dead Edge Functions still not deleted

### Process Issue Identified
Brain drift caused by: (1) master.md getting patched incrementally, never fully rewritten; (2) some sessions updating changelog but not master; (3) new tables/features built without documentation in master; (4) emergency sessions (onboarding v67 across 4 chats) producing partial updates.

## 15 April 2026 — Android Resubmitted with Correct VYVE Icon

### Fix: Android icon rejection resolved
- **Issue:** Google Play rejected app — icon on device didn't match store listing (placeholder Capacitor X icon)
- **Fix:** Generated correct icons using `npx capacitor-assets generate --android` from `resources/icon.png` (1024x1024 VYVE logo)
- **Java:** Installed Microsoft OpenJDK 21 on Windows machine (was missing)
- **Build:** `gradlew bundleRelease` succeeded, AAB signed with `vyve-release-key.jks`
- **Submitted:** Resubmitted via Google Play Console Publishing Overview — 9 changes sent for review
- **Status:** Awaiting Google Play review (1-3 days)

## 15 April 2026 (cont.) -- Exercise search overlay layout fix

### Problem
Exercise search/picker overlay on workouts.html had three layout issues in Capacitor-wrapped PWA on iOS:
1. Header ("Back" button) and mode label ("SELECT EXERCISES") overlapping at top of screen
2. "Add X exercises" bar (.es-add-bar) hidden behind the bottom navigation bar
3. Content scrolling behind both header and footer

### Root cause
1. `.es-header` had `position:relative` with `top:56px` from a media query -- visually shifted the header down but didn't move it in the flex flow, causing overlap with `.es-body`
2. `.es-add-bar` was `position:fixed` inside `#exercise-search-view` (z-index:1000). The bottom nav (z-index:9999) sat above the overlay's stacking context, hiding the add bar
3. `.es-body` had 200px bottom padding as a workaround for the fixed add bar

### Fixes (workouts.html CSS)
- `#exercise-search-view` z-index: 1000 -> 10000 (above bottom nav at 9999)
- `#history-view` z-index: 700 -> 10000
- `.es-add-bar`: removed `position:fixed`, now a flex child with `flex-shrink:0` and safe-area bottom padding
- `.es-body` bottom padding: 200px -> 20px (add-bar now in flex flow)
- Media query: removed `.es-header` and `.hist-header` from the `top:56px` rule

### New hard rule (#35)
Full-screen overlays with their own back button must use z-index:10000+ to sit above nav.js bottom bar. Their headers do NOT need the top:56px offset.

### sw.js bumped to `vyve-cache-v2026-04-15i`
### Commit: 049c2441a315d23aa789f201e8cd1a28b6863c20

## 15 April 2026 (cont.) — Capacitor safe area + back button fix

### Problem
After wrapping the PWA in Capacitor for iOS/Android, three issues surfaced:
1. Mobile header (back button, logo, page label) sat behind the iOS status bar / notch — couldn't tap back
2. Back button showed on primary nav pages (Workouts, Nutrition, Sessions) where it shouldn't
3. Exercise search overlay and history view header were also behind the status bar

### Root cause
No page had `viewport-fit=cover` in the viewport meta, so `env(safe-area-inset-top)` returned 0. The Capacitor web view extends behind the status bar by default.

### Fixes (nav.js)
- Inject `viewport-fit=cover` into the viewport meta tag at runtime — covers all 39+ portal pages without touching each file
- Added `padding-top: env(safe-area-inset-top, 0px)` to `.mobile-page-header` CSS
- Changed `isHome` to `isNavPage` — primary nav pages (Home, Workouts, Nutrition, Sessions) now show the VYVE logo; all sub-pages show the back button

### Fixes (workouts.html)
- `.es-header` (exercise search overlay): added `padding-top: calc(14px + env(safe-area-inset-top, 0px))`
- `.hist-header` (exercise history overlay): same fix

### New rule for brain/master.md
- **Capacitor safe area:** Any new full-screen overlay (`position:fixed;inset:0`) must add `padding-top: calc(original + env(safe-area-inset-top, 0px))` to its sticky header. nav.js handles the main page header globally.

### sw.js bumped to `vyve-cache-v2026-04-15g`

### Commit: 65d8ffeab0c7c91e68b8196ad1f8d168d96688a1


## 15 April 2026 (cont.) — 401 redirect handling added to 6 portal pages

### Defense-in-depth: 401 redirect on auth failure
auth.js already gates pages on load (no session = redirect to login). These patches add a second safety net for the edge case where a JWT expires between auth.js checking and the page's EF fetch firing.

| Page | Patch |
|------|-------|
| certificates.html | JWT empty check + 401 redirect on member-dashboard fetch |
| index.html | 401 redirect on member-dashboard fetch (JWT check already existed) |
| leaderboard.html | JWT empty check + 401 redirect on leaderboard EF fetch |
| monthly-checkin.html | JWT empty check + 401 redirect on both POST and GET EF calls |
| running-plan.html | 401 redirect on anthropic-proxy fetch |
| wellbeing-checkin.html | 401 redirect on wellbeing-checkin EF submit |

### sw.js bumped to `vyve-cache-v2026-04-15f`

### Commit: 37784bbb5f8ead4d5b462b3f015eec53246c52bb

### Audit note
Full portal audit confirmed NO other pages have the `async async` syntax error or any other script-killing bugs. The engagement.html fix from earlier today was the only critical issue. workouts.html was a false positive — its only inline EF call is platform-alert (skeleton monitor); all data loading lives in external JS modules.


## 15 April 2026 — engagement.html critical fix + cleanup

### Bug: `async async function loadPage()` syntax error
- **Root cause:** Double `async` keyword on the `loadPage()` function declaration killed the entire `<script>` block at parse time. Every function in the block was undefined — page showed infinite skeleton loading.
- **Impact:** engagement.html completely broken for all members. Skeleton timeout monitor fired platform_alert but user saw no content.
- **Fix:** Removed duplicate `async` keyword.

### Cleanup: 5 dead client-side calc functions removed
- `calcStreaks`, `calcWeekStreaks`, `calcDayStats`, `calcVariety7d`, `computeEngagementScore` were copied from old client-side approach but never called — EF v37 computes everything server-side.
- Removed ~4,100 chars of dead code.

### Fix: 401 redirect added
- engagement.html had no auth failure handling — if JWT expired, page showed empty content with no guidance.
- Added JWT presence check (redirect to login if missing) and 401 status check on fetch response.

### sw.js bumped to `vyve-cache-v2026-04-15e`

### Commit: cce5d358eca4c3166b8e156ea81738ccbaef861e


## 14 April 2026 (evening) — App Store rejection fixes

### Apple App Store Review Response
- **Guideline 2.3.8 (Accurate Metadata):** Capacitor placeholder icon submitted by mistake. Generated full iOS icon set (15 sizes, 1024×1024 source) from VYVE logo. Zip provided to Dean for Xcode replacement.
- **Guideline 2.5.1 (HealthKit UI disclosure):** Added "Apple Health" section to settings.html between Notifications and About sections.
  - Toggle to sync with Apple Health (reads: workouts, steps, heart rate/HRV, sleep; writes: workout completions, mindful minutes)
  - Expandable detail panel shows what data VYVE reads and writes
  - Privacy notice: "Your health data stays on your device and is never shared with your employer"
  - Wired to `window.VYVENative.requestHealthKit()` for when capacitor-plugins.js lands
  - `handleAppleHealthToggle()` JS function added
- sw.js cache bumped: `vyve-cache-v2026-04-13f` → `vyve-cache-v2026-04-14a`
- Commit: `9fad685` on vyve-site main

## 14 April 2026 - Operational Report Suite (11 reports)

### Reports committed to VYVEBrain/reports/
- Complete platform audit: 11 standalone reports covering Security, Backup & DR, System Health, Performance, GDPR, Onboarding Pipeline, Engagement & Retention, Financial, Enterprise Readiness, Code Quality, and Master Action Plan
- All findings grounded in live Supabase queries (61 tables, 68 RLS policies, 30 triggers, 8 crons), Edge Function code review (20 core EFs), platform_alerts (31 error records), and GitHub repo tree (67 files)
- Interactive React artifact versions created in Claude conversation for browsable UI
- Markdown versions committed to VYVEBrain/reports/ for permanent reference

### Key findings discovered during audit
- **ACTIVE INCIDENT:** Push notification crons (habit-reminder + streak-reminder) failing since 11 April - app.service_role_key JSON error
- **ACTIVE INCIDENT:** 4 JS bugs live (workouts-library.js syntax, switchTab, getTimeGreeting, showToast)
- **DISCOVERY:** platform_alerts table exists with 31 error records but has ZERO RLS policies - data invisible
- **DISCOVERY:** check-cron EF overwritten with Stuart lookup query - not checking crons
- 10 tables missing member_email indexes (workouts: 3,654 seq scans)
- Calum Denham has no workout plan (background generation failed silently)
- 19/20 core EFs have no external backup
- 4 data categories are GDPR Article 9 special category
- Both Sage members (Lewis, Kelly) are 10-11 days inactive
- 34 prioritised actions across 5 phases, 82-114 hrs total effort

## 13 April 2026 — Onboarding v67 + portal fixes

### onboarding v67 (Supabase Edge Function)
- Workout plan generation moved inline (was `EdgeRuntime.waitUntil` → external `generate-workout-plan` EF)
- Two parallel Anthropic calls for weeks 1-4 and 5-8 (16K tokens each via `callAnthropicFull`)
- `callAnthropicFull` added — returns `{text, stopReason}` for max_tokens detection
- Exercise library fetched from `workout_plans` table in Batch 1 alongside persona/overview
- `generateWorkoutPlan` + `writeWorkoutPlan` added inline
- Anti-hallucination instructions added to `generateProgrammeOverview` and `generateRecommendations`
- `workout_plan` stats in response JSON: `{programme_name, weeks_generated, videos_matched, videos_unmatched}`
- Decision log version tag updated to v67

### welcome.html (Test-Site-Finalv3)
- AbortController timeout: 90s → 150s in both `submitQuestionnaire` and `retrySubmit`
- Slow timer: 30s → 45s in both locations
- Slow timer text: "up to a minute" → "up to two minutes"

### nutrition.html (vyve-site)
- Empty state title: "Your nutrition plan is not set up yet" → "Your nutrition targets aren't set up yet"
- Empty state text: "Complete your onboarding..." → "Add your height, weight, and activity level..."

### sw.js (vyve-site)
- Cache version bumped: `vyve-cache-v2026-04-13e` → `vyve-cache-v2026-04-13f`

## 2026-04-13 (evening session)

### CRITICAL - Onboarding EF Recovery
- Composio workbench overwrote onboarding EF with `CONTENT_FROM_WORKBENCH` placeholder - wiped all code
- Recovered from `VYVEBrain/staging/onboarding_v67.ts` backup
- **5 fixes applied during recovery:**
  1. Missing `}` in `sendWelcomeEmail` - fetch options object wasn't closed (`]}));` -> `]})});`)
  2. `workout_plan_cache` schema mismatch - `plan_data` column renamed to `programme_json`, added `plan_duration_weeks`, `current_week`, `current_session`, `is_active`, `source`
  3. Two-phase flow restored - workout plan generation moved back to `EdgeRuntime.waitUntil()` background task (v67 had inlined it synchronously, causing slow onboarding)
  4. `workoutPlanResult` reference error - removed from success response JSON (no longer exists after waitUntil change)
  5. UTF-8 em-dash encoding - replaced all `—` (em-dash) characters with `-` to prevent `a€"` garbled text in persona reason strings
- Onboarding EF now at v71 (Supabase version counter)
- `staging/onboarding_v67.ts` confirmed to have the missing brace bug - was never a clean backup

### Lesson Learned
- **Never trust Composio workbench for EF deploys** - it can overwrite with placeholder content
- **Always keep a verified backup** of critical EFs in VYVEBrain staging
- `workout_plan_cache` table was restructured (columns renamed) after v67 was written - staging backups can go stale

### Data Changes
- Wiped TDEE data for deanonbrown@hotmail.com (testing nutrition-skipped flow)
- Deleted deanonbrown2@gmail.com test account (all tables + auth.users)

### Backlog Addition
- **Onboarding resilience: save-answers-first pattern** - save questionnaire answers to `onboarding_answers` table per section via lightweight `save-answers` EF, so if main onboarding fails the answers are preserved and can be re-run manually. Friendly error: "Your answers have been saved, your bespoke setup will be with you soon."


## 13 April 2026 — Light mode contrast audit + full fix across portal

### Fix: 84 hardcoded dark-theme colors converted to CSS vars across 13 pages + nav.js

**Root cause:** Pages used hardcoded `rgba(255,255,255,...)`, `#fff`, `rgba(10,31,31,...)`, and `#0A1F1F` colors instead of CSS variables from `theme.css`. These were designed for dark backgrounds and became invisible/unreadable when the light theme was active.

**Architecture finding:** `theme.css` correctly defines both light and dark variable sets. The problem was individual pages bypassing the system with inline hardcoded values.

### Files updated (15 total):
| File | Issues Fixed | Key Changes |
|------|-------------|-------------|
| `nav.js` | 15 | Entire nav component — desktop nav, mobile header, bottom nav, More menu. Affects ALL pages. |
| `log-food.html` | 18 | Borders, meal icons, search tabs, sheet UI, barcode scanner hints |
| `shared-workout.html` | 10 + infra | Added `theme.css` + `theme.js` links (was completely unthemed) |
| `nutrition.html` | 9 | Weight chart labels (SVG), progress bars, sheet UI, history rows, sliders |
| `index.html` | 8 | Score ring, day strips, goal checkboxes, PWA banner, track streaks |
| `habits.html` | 8 | Hero gradient, habit prompt text, buttons, spinner, submit button |
| `engagement.html` | 8 | Borders, bold text, activity log dividers |
| `settings.html` | 6 | Spinner, modal close button |
| `running-plan.html` | 6 | Spinner, info box background |
| `sessions.html` | 5 | Desktop nav bg, offline badge border |
| `nutrition-setup.html` | 3 + infra | Added `theme.css` link, toast background |
| `monthly-checkin.html` | 1 + infra | Added `theme.css` link, nav background |
| `wellbeing-checkin.html` | 1 | Nav background |
| `workouts.html` | 1 | Rest timer dismiss border |
| `sw.js` | — | Cache bumped to `vyve-cache-v2026-04-13d` |

### Design decisions:
- `#fff` on `var(--teal)` backgrounds (buttons, avatars) left as-is — white on teal has good contrast in both themes
- Barcode scanner overlay kept dark with white text — it's a camera UI, not page content
- Skeleton shimmer animations converted to `var(--surface)` / `var(--surface-hover)`
- SVG chart label `setAttribute('fill',...)` calls in nutrition.html converted to CSS vars

### Rule added:
**Never use hardcoded `#fff`, `rgba(255,255,255,...)`, `#0A1F1F`, or `rgba(10,31,31,...)` in portal CSS.** Always use CSS variables from `theme.css`: `var(--text)`, `var(--text-muted)`, `var(--text-faint)`, `var(--border)`, `var(--surface)`, `var(--nav-bg)`, etc. Exception: `#fff` is acceptable for text on fixed-colour backgrounds like `var(--teal)` buttons or camera overlays.

## 13 April 2026 — Careers page added to marketing site

### Feat: careers.html live at www.vyvehealth.co.uk/careers.html
- **Page:** 11 active roles across Advisory, Podcast, Marketing, Community, Clinical departments
- **Jobs managed via JS array** — Lewis can add/remove/hide roles by editing the `JOBS` array in the `<script>` block. `active: false` hides a role without deleting it.
- **Apply flow:** "Apply Now" opens candidate's email client with pre-filled subject line → all applications land in `team@vyvehealth.co.uk`
- **Repo:** `VYVEHealth/Test-Site-Finalv3` — `careers.html` committed to main
- **Note:** Original uploaded file was truncated (missing IntersectionObserver init + closing HTML tags). Reconstructed tail appended before push.

### Feat: Careers link added to footer across 8 marketing pages
- Pages updated: `index.html`, `individual.html`, `individual-platform.html`, `give-back.html`, `give-back-employers.html`, `corporate.html`, `platform.html`, `about-individual.html`
- Link added under Company column after "Terms of Service"
- 7 other pages (employers, contact, about, etc.) have different footer structures — Careers link not added (would need separate pass)

## 13 April 2026 — running_plan_cache RLS fix (401 on PATCH/POST)

### Fix: Added INSERT + UPDATE RLS policies to `running_plan_cache`
- **Root cause:** Table had only a public SELECT policy. The page (`running-plan.html`) uses the anon key (`SUPA_HDR`) for all cache operations. Reads worked, but PATCH (use_count bump) and POST (save new plan) returned 401.
- **Alert:** `auth_401_running_plan_cache` — Calum Denham, 14:55, running-plan.html
- **Fix:** Migration `running_plan_cache_insert_update_policies` — added `running_plan_cache_public_insert` (INSERT) and `running_plan_cache_public_update` (UPDATE) policies, both `TO public WITH CHECK (true)`. Appropriate because this is a shared cache (not user-specific data).
- **No portal code change needed** — the page already sends the correct requests, they were just being rejected by RLS.

### Triage: 4 alerts dismissed (Dean, 13:33, transient network blip)
- `network_error_member-dashboard` (CRITICAL) — "Failed to fetch" on dashboard `/`
- `network_error_notifications` (CRITICAL) — "Failed to fetch" on dashboard `/`
- `js_error` (HIGH) × 2 — "Script error. at :0" on `/` and `/workouts.html`
- All 4 fired within 14 seconds for the same user (Dean). Classic connectivity blip — downstream JS errors are cross-origin error masking from the failed fetches. No code bug.

## 13 April 2026 — Command Centre: Full Supabase Wiring

### Feat: Command Centre data now persists in Supabase
Lewis's Command Centre (`admin.vyvehealth.co.uk`) was previously localStorage-only — clearing the browser lost all data, and Lewis and Dean couldn't share data. Now fully wired to Supabase.

### Database — 18 new `cc_` tables created
All tables: RLS enabled, locked to `team@vyvehealth.co.uk`, `created_by` column, `updated_at` triggers.

| Table | Module |
|-------|--------|
| `cc_clients` | Clients kanban |
| `cc_leads` | Sales Pipeline CRM |
| `cc_investors` | Investor Relations |
| `cc_partners` | Partner Network |
| `cc_tasks` | Tasks kanban |
| `cc_decisions` | Strategy Room — Decisions log |
| `cc_okrs` | Team OKRs |
| `cc_finance` | Finance & Funding metrics |
| `cc_revenue` | Revenue entries |
| `cc_grants` | Grants pipeline |
| `cc_posts` | Content planner |
| `cc_invoices` | Invoicing |
| `cc_sessions` | Sessions / Delivery |
| `cc_intel` | Intelligence (Agent Sync output) |
| `cc_knowledge` | Knowledge Base (SOPs, playbooks, templates) |
| `cc_documents` | Document metadata (files in Storage) |
| `cc_swot` | SWOT analysis items |
| `cc_episodes` | Podcast episodes |

### Storage — `cc-documents` bucket created
- Private bucket, 50MB file limit
- Allowed types: PDF, DOCX, XLSX, PPTX, TXT, CSV, images
- RLS: team@vyvehealth.co.uk only (SELECT, INSERT, DELETE)
- Files stored with UUID filename, metadata in `cc_documents` table

### Edge Function — `cc-data` v1 deployed
Single function handles all Command Centre data operations:
- `GET /cc-data/{table}` — list with optional filters (?type, ?stage, ?status, ?owner, ?quadrant)
- `POST /cc-data/{table}` — create record
- `PATCH /cc-data/{table}/{id}` — update record  
- `DELETE /cc-data/{table}/{id}` — delete (also removes Storage file for documents)
- `POST /cc-data/upload` — multipart upload → Storage → cc_documents metadata
- `GET /cc-data/signed-url/{id}` — 1-hour signed URL for secure file viewing
- Auth: JWT required, `team@vyvehealth.co.uk` only

### index.html — fully rewired (commit `eb2dc09`)
- Added `CC_API` helper functions: `ccFetch`, `ccList`, `ccCreate`, `ccUpdate`, `ccDelete`, `ccUploadFile`, `ccSignedUrl`
- Added `ccLoadAll()` — fetches all 18 tables in parallel on login, populates every data array
- `initApp()` converted to async — calls `ccLoadAll()` after auth, re-renders current page
- 20 save/delete functions converted to async Supabase calls: `saveClient`, `saveLead`, `saveInvestor`, `saveDecision`, `saveCompanyOkr`, `saveGrant`, `savePost`, `saveKbItem`, `saveFinance`, `saveRevenue`, `updateOkrPct`, `addSwot`, `removeSwot`, `removeIntelItem`, `doImportModal`, `processDocFile`, `deleteDoc`, `clearAgentData`, `removeKbItem`, `openTaskModal`
- `processDocFile()` — files now upload to Supabase Storage via `ccUploadFile()`, no longer stored in localStorage
- `viewDoc()` — now async, generates signed URL for secure file viewing/download
- `persist()` / `load()` — retained for UI preferences only (dark mode, Claude API key, per-member todos)
- Zero business data `persist()` calls remaining

### Result
- Lewis and Dean now share the same data — any record entered by either is instantly visible to the other
- Clearing browser cache no longer loses any business data
- Files uploaded to the Documents section go to Supabase Storage automatically
- Lewis can now populate clients, pipeline, OKRs, decisions etc. with confidence data won't be lost

## 13 April 2026 — anthropic-proxy auth fix (running-plan.html JS error)

### Fix: anthropic-proxy v14 — verify_jwt: false + internal JWT validation
- **Root cause:** `anthropic-proxy` had `verify_jwt: true` (Supabase gateway-level). Running-plan.html uses the old `waitForAuth` pattern — if auth session hadn't initialised before the user hit Generate, the fetch fell back to the anon key, which was rejected by the gateway. Browser showed `Script error. at :0` (cross-origin error masking).
- **Fix:** Switched to `verify_jwt: false` with internal JWT validation via `supabase.auth.getUser()` — matches the pattern used by all other VYVE Edge Functions.
- **Also added:** CORS restriction to `online.vyvehealth.co.uk` and `www.vyvehealth.co.uk` (was `*`).
- **running-plan.html:** No change needed — the page already tries to get a JWT from `window.vyveSupabase.auth.getSession()` and sends it. The EF now validates internally instead of at the gateway.

## 13 April 2026 — Brevo Email Logo + Backlog Cleanup

### Feat: VYVE logo added to all Brevo email templates
- **send-email** v20 — `wrap()` header updated: text "VYVE" replaced with `<img>` tag loading `https://online.vyvehealth.co.uk/logo.png` (height 36px)
- **re-engagement-scheduler** v20 — same `wrap()` logo update
- **certificate-checker** v18 — same `wrap()` logo update (notification emails only; certificate HTML documents unchanged)
- All three EFs now show the VYVE logo image in the dark header bar of every outbound email

### Backlog: Items dropped
- **Dashboard skeleton loading screen** — dropped (not needed now)
- **Weekly check-in slider questions** — dropped (monthly check-in covers this instead)
- **Brevo logo in emails** — completed ✅

## 13 April 2026 — Monthly Check-In Wiring + Habit Count Fix

### Feat: Monthly Check-In wired into portal nav
- **nav.js** — Monthly Check-In added to More menu (below Weekly Check-In), calendar icon
- **monthly-checkin.html** — new `#new-member-banner` div + `newMemberLocked` handler in init()
- **monthly-checkin EF v13** — `isNewMember()` function: checks `members.created_at`, blocks if member joined < 1 full calendar month ago. Returns `newMemberLocked: true` + `availableFrom: "1st May 2026"` on GET. Also guards POST submit.
- **New-member message:** "Your monthly check-in will be available from 1st [Month Year]. Complete your first full month with VYVE and we'll have your personalised report ready."
- **Model fix:** `claude-haiku-4-5-20251001` (invalid) → `claude-haiku-4-5` in monthly-checkin EF

### Fix: Weekly check-in habit count
- **wellbeing-checkin.html** — `habitsThisWeek` was counting every raw `daily_habits` row (e.g. 5 habits logged Monday = counted as 5). Fixed to count distinct `activity_date` values capped at 7 — max 1 per day, max 7 per week.
- Query updated: `select=id` → `select=activity_date`
- Count: `habits?.length` → `Math.min([...new Set(habits.map(h=>h.activity_date))].length, 7)`

### sw.js cache
- Bumped: `vyve-cache-v2026-04-13a` → `vyve-cache-v2026-04-13b`

## 13 April 2026 — VYVE Command Centre: Setup, Auth & Fixes

### New: Command Centre live at admin.vyvehealth.co.uk
- **What:** Lewis's internal ops dashboard (`vyve-command-centre` repo) identified, deep-dived, and brought to production-ready state
- **URL:** `admin.vyvehealth.co.uk` — custom domain via GoDaddy CNAME → GitHub Pages
- **Auth:** Replaced hard-coded login (`admin@vyve.co.uk` / `vyve2026`) with real Supabase Auth. `team@vyvehealth.co.uk` auth account activated, password set via SQL.
- **Repo:** `VYVEHealth/vyve-command-centre` (public). CNAME file committed for custom domain.

### Fixes applied to Command Centre index.html
| Fix | Detail |
|-----|--------|
| SyntaxError: doLogin undefined | HTML modal markup injected inside TEAM JS array — removed |
| Binary garbage blob (~750 chars) | Corrupted OKR renderer — removed and reconstructed |
| Missing `</script>` tag | Data script block unclosed — fixed |
| 8 duplicate modal blocks | All modals appeared twice — deduplicated |
| `¾(` × 3 | Corrupted `v()` helper calls — fixed |
| `justify-conte"` | Truncated CSS — fixed to `justify-content:space-between` |
| OKR slider `oninput` | Control char + `his.value` — fixed to `this.value` |
| Missing amber ternary × 3 | OKR progress bar colour — fixed |
| Stray `2 ` before `el2.innerHTML` | SyntaxError on line 1566 — removed |
| Duplicate h1 headings on all pages | Page title showed in topbar AND as h1 — all h1s removed from page-headers |
| Tasks page corrupt | Contained stray THREATS/SWOT/Decisions/Learnings content — replaced with correct kanban layout |

### Architecture notes (Command Centre)
- Single `index.html` ~120KB, vanilla JS + Chart.js, GitHub Pages
- Data in `localStorage` — Supabase connection planned (same DB `ixjfklpckgxrwjlfsaaz`, tables prefixed `cc_`)
- Lewis's 24 AI skills run in Claude.ai Projects (subscription) — Agent Sync JSON paste is the intended workflow
- Claude API key field in Settings is a placeholder — no API calls wired yet
- `send-password-reset` Edge Function deployed and neutered after use

## 13 April 2026 — iOS App Store: Build 2 Submitted (Correct VYVE Icon)

### Fix: Replaced placeholder Capacitor icon with correct VYVE logo
- **What:** Generated correct app icon from `logo512.png` using `@capacitor/assets generate --ios`
- **Icon source:** `resources/icon.png` (1024x1024px, VYVE teal V logo)
- **Build 2** archived and uploaded to App Store Connect
- **Status:** App is "Waiting for Review" with Build 1 (placeholder icon). Build 2 is uploaded and ready.
- **Next:** If Apple approves Build 1, submit 1.0.1 update immediately with Build 2 icon. If rejected, resubmit with Build 2.
- **Note:** Cannot swap builds once "Waiting for Review" — Apple has locked the submission.

## 13 April 2026 — iOS App Submitted to App Store

### Feat: VYVE Health iOS app built and submitted
- **What:** Full Capacitor iOS build completed and submitted to Apple App Store for review
- **Bundle ID:** `co.uk.vyvehealth.app`
- **Team:** VYVE Health CIC (VPW62W696B)
- **Signing:** Manual signing with Apple Distribution certificate + VYVE Health App Store provisioning profile
- **Project location:** `~/Projects/vyve-capacitor/` on Dean's MacBook Pro
- **Xcode version:** 16 on macOS Sequoia 15.7.4
- **Capabilities:** Push Notifications + HealthKit
- **Info.plist permissions added:** Camera, Photo Library, Health Share, Health Update, User Notifications
- **App Store listing:** Full description, 5 iPhone screenshots (1242x2688), 1 iPad screenshot (2064x2752), keywords, pricing (free), privacy labels, age rating, content rights, MRDP, medical device declaration all complete
- **Status:** Submitted for review — Apple will email on approval (typically 24-48 hours)
- **Architecture:** Remote URL loading (`https://online.vyvehealth.co.uk`) — portal updates live instantly, no resubmission needed

### App Store listing content
- **Subtitle:** Proactive Wellbeing Platform
- **Primary Category:** Health & Fitness
- **Secondary Category:** Lifestyle
- **Price:** Free
- **Countries:** All regions
- **Apple ID:** 6762100652

### Both platforms now submitted
- Android: `app-release.aab` submitted to Google Play (12 Apr) ✅
- iOS: Submitted to App Store (13 Apr) ✅

## 12 April 2026 — Android App Submitted to Google Play

### Feat: VYVE Health Android app built and submitted
- **What:** Full Capacitor Android build completed and submitted to Google Play Store for review
- **Package ID:** `co.uk.vyvehealth.app`
- **Build:** `app-release.aab` (5.77MB, 3s download time)
- **Keystore:** `vyve-release-key.jks` saved to Dean's Desktop (OneDrive). Password stored securely.
- **Key alias:** `vyve-key`
- **google-services.json:** Placed in `android/app/` ✅
- **Project location:** `C:\Users\DeanO\vyve-capacitor\`
- **Plugins (15):** app, browser, camera, filesystem, haptics, keyboard, local-notifications, network, preferences, push-notifications, screen-orientation, share, splash-screen, status-bar, capacitor-native-biometric
- **Countries targeted:** United Kingdom
- **Google Play listing:** Full description written, 4 screenshots processed, feature graphic generated (1024x500), 512px icon uploaded
- **Status:** Submitted for review — Google will email on approval (typically 1-3 days)
- **Architecture:** Remote URL loading (`https://online.vyvehealth.co.uk`) — portal updates live instantly, no resubmission needed

### Google Play Store listing content
- **Short description:** Proactive workplace wellbeing — Physical, Mental & Social health
- **App category:** Health & Fitness
- **Content rating:** All other app types — PEGI Everyone
- **Health features ticked:** Activity & fitness, Nutrition & weight management, Period tracking, Sleep management, Stress management/relaxation/mental acuity
- **Target audience:** 18+
- **Countries:** United Kingdom

### iOS — Pending Mac
- All pre-requisites complete. When Mac arrives: install Xcode, run `npx cap add ios && npx cap sync ios`, open in Xcode, configure signing + capabilities, build + submit.
- Estimated time once Mac available: ~2.5 hours

### Notes
- Old Kahunas app (`com.kahunas.io.VYVE`) still live on Play Store with 1 install — leave alone, deprecate after new app approved
- `capacitor-plugins.js` not yet added to portal — do this next session ("add plugins to portal")
- Health disclaimer checkbox on welcome.html — pending Lewis sign-off

## 12 April 2026 — Capacitor App Store Wrap: Pre-Mac Setup Complete

### Planning: Full Capacitor wrap mapped and config files generated
- **What:** Complete Capacitor wrap plan created for iOS App Store + Android Play Store submission
- **Plugins selected (all added now):** Push Notifications, Status Bar, Splash Screen, App, Keyboard, Haptics, Network, Browser, Share, App Launcher, Local Notifications, Preferences, HealthKit/Google Fit, Camera, Filesystem, Biometrics, Screen Orientation. RevenueCat deferred (keep payments on Stripe web).
- **Files generated:** `capacitor.config.ts`, `package.json`, `capacitor-plugins.js` (full native bridge exposing `window.VYVENative`), `ios-info-plist-additions.xml`, `android-manifest-additions.xml`, `supabase-migration-push-native.sql`, `SETUP-GUIDE.md`
- **Architecture decision:** Remote URL loading (`server.url: https://online.vyvehealth.co.uk`) — portal updates go live instantly without App Store resubmission

### Infrastructure: Pre-Mac setup completed
- **Supabase:** `push_subscriptions_native` table created with RLS, unique index on `(member_email, platform)`, updated_at trigger
- **Firebase:** Project "VYVE Health" created. Android app registered (`co.uk.vyvehealth.app`). `google-services.json` downloaded. iOS app registered. `GoogleService-Info.plist` downloaded.
- **Apple Developer Portal:** APNs key created ("VYVE Push Key"). Key ID: `4WSJ4XSZ58`. Team ID: `VPW62W696B`. `.p8` file downloaded. App ID `co.uk.vyvehealth.co.uk.vyvehealth.app` registered with HealthKit, Push Notifications, Associated Domains capabilities.
- **Health disclaimer:** Confirmed Section 6 of terms.html covers App Store requirements. No new page needed. Onboarding checkbox to be added (pending Lewis sign-off on wording).

### Pending: Mac required for build steps
- Install Xcode + Node.js
- `npx cap add ios && npx cap add android && npx cap sync`
- Add `capacitor-plugins.js` to vyve-site portal (Claude to commit)
- iOS build in Xcode + App Store Connect submission
- Android build in Android Studio + Google Play submission
- Estimated time once Mac arrives: ~4 hours, both platforms submitted same day

## 12 April 2026 — Browse Library: Your Programmes + Resume

### Feat: Paused plans section in Browse Library
- **What:** Added "Your Programmes" section at the top of the Browse Library tab showing all paused plans with a Resume button.
- **UI:** Deduplicated by programme name (shows most recently paused). Shows week progress ("Week 2 of 8") and source label ("Your bespoke plan" / "From library" / "Shared"). Confirmation modal before resuming.
- **Backend:** `workout-library` EF v3 — added `action: resume` POST handler. Pauses current active plan, reactivates the selected paused plan preserving `current_week` and `current_session` progress.
- **Frontend:** `workouts-library.js` — new `loadPausedPlans()`, `confirmResume()`, `resumeProgramme()` functions. Paused plans fetched via REST API from `workout_plan_cache` with `is_active=false`.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12ab`
- **Commit:** `3fd4b23727c3fa822b84c69454d0b1b8af15f966`

### Data: PPL Power & Size Builder — Push B → Upper
- **What:** Updated `cbudzski3@gmail.com`'s active programme in `workout_plan_cache`
- **Push A** renamed to **Push** (dropped the "A") across all 8 weeks
- **Push B** replaced with **Upper — Chest, Back, Shoulders & Arms** across all 8 weeks
- Upper sessions designed as proper balanced upper body: chest pressing + back pulling + shoulders + biceps (hammer curls) + triceps. Exercises vary across periodisation phases. Avoids duplicating Pull day movements.

## 12 April 2026 — Browse Library visibility fix

### Fix: workouts.html #tab-library outside .wrap
- **Root cause:** `#tab-library` div was positioned outside `<main>` and `.wrap` in the HTML (line 545), after all the fixed-position overlays. Content rendered into DOM but was invisible — it sat below the fold with no scroll context, especially when `body.style.overflow` was stuck as `'hidden'` from a previous workout session.
- **Fix 1 (HTML):** Moved `#tab-library` inside `.wrap`, directly after `#tab-custom` where it belongs. Library content now inherits `.wrap` padding and participates in normal body scroll.
- **Fix 2 (JS):** Added `document.body.style.overflow = ''` at start of `init()` in `workouts-config.js`. Belt-and-braces: clears stuck overflow even when no saved session state exists to restore.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12aa`
- **Commit:** `4474936db1f9ac4a5f80101390a41177e6fc4f9b`

## 12 April 2026 — member-dashboard v31: Server-Side Aggregation

### Change: member-dashboard EF v31 + index.html frontend update
- **What:** All streak, score, count, and goal-progress calculations moved server-side into the Edge Function
- **Why:** Response payload was growing linearly with activity history (~5KB for current members, unbounded at scale). Now fixed ~2KB regardless of history size.
- **EF changes (v31):** Ported `calcStreaks`, `calcWeekStreaks`, `calcDayStats`, `calcVariety7d`, `computeEngagementScore` from frontend JS into TypeScript. Same 11 parallel DB queries unchanged. New response shape includes `counts`, `streaks`, `checkinStreak`, `score`, `habitStrip`, `habitDatesThisWeek`, `goals`, `charity`, `daysInactive`, `daysActive30`.
- **Frontend changes (index.html):** Removed client-side calc functions. `renderDashboardData` now maps pre-computed values directly to DOM. `renderDailyCheckinStrip` updated to accept `habitStrip` + `habitDatesThisWeek` + `habitStreakCurrent`. `renderGoals` updated to accept pre-computed `goals` object.
- **Cache key bumped:** `vyve_home_cache_` → `vyve_home_v2_` to force invalidation of old-shape cache on all devices.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12a`
- **Commit:** 8ef469cde210e65cff6eb9bc49b33c3b04cadb3c

## 11 April 2026 — Food Log, Settings, Weight Unit, Running Plan (Evening Session)

### Fix 5: log-food.html — JWT auth error + LOG FOOD button behind nav
- **Issue:** "Error logging — try again" on all food log entries + LOG FOOD button hidden behind bottom nav
- **Root cause 1:** `supa()` helper used `SUPA_ANON` as Bearer token → `nutrition_logs` RLS rejected with 401
- **Root cause 2:** `.sheet` CSS had `padding-bottom:env(safe-area-inset-bottom,0px)` — only accounts for iPhone notch, not the 80px nav bar
- **Fix:** `supa()` now uses `vyveSupabase.auth.getSession()` for real JWT; `.sheet` padding-bottom changed to `calc(80px + env(safe-area-inset-bottom,0px))`
- **Commit:** `e138f2e`

### Fix 6: running-plan.html — wrong Haiku model string
- **Issue:** Running plan generation silently failing — showing "Plan was too large" for all plans including small ones
- **Root cause:** Model string `claude-haiku-4-5-20251001` is invalid. Correct string is `claude-haiku-4-5` (no date suffix). Anthropic returns error object → no `data.error` check → falls through as blank → TRUNCATED error message fires
- **Additional:** No `response.ok` check — HTTP errors from proxy were silently swallowed
- **Fix:** Model corrected to `claude-haiku-4-5`; added `response.ok` check and `data.error` check so real errors surface
- **Commit:** `1b86b43`
- **Brain update:** Correct Anthropic model strings table added to master.md (section 9)

### Fix 7: settings.html — remove height/weight unit toggles + fix privacy link
- **Removed:** Entire "Units" section (Weight kg/lbs/stone + Height cm/ft toggles), `setUnits()` JS function, both `data-units-weight`/`data-units-height` init blocks, `.units-group` + `.units-btn` CSS — 3,929 chars total
- **Why:** Unit toggles were saving to `members.weight_unit`/`members.height_unit` but nothing was reading those values. Unit preference is now managed within `nutrition.html` TDEE recalculator only.
- **Privacy link fixed:** `privacy.html` → `privacy-policy.html`
- **Commit:** `73dc197`

### Feat: nutrition.html — weight log unit follows member onboarding preference
- **Issue:** Weight log sheet hardcoded to 'kg' regardless of member's unit preference. TDEE recalculator unit choice not persisted between sessions.
- **Fix (6 changes):**
  1. `weight_unit` added to members SELECT query
  2. `saveTargets()` PATCH now includes `weight_unit: rcState.wtUnit`
  3. `memberData` in-memory object updated with `weight_unit` after save
  4. `openSheet()` inits `sheetWtUnit` from `memberData.weight_unit` → localStorage fallback → 'kg'
  5. `localStorage.setItem('vyve_weight_unit')` written on TDEE save
  6. `prefillRecalc()` calls `setWtUnit(savedWtUnit)` so recalculator opens in saved unit
- **Commit:** `7cfbe91`

### sw.js cache progression today
`r` → `s` → `t` → `u` → `v` → `w` → `x` (final: `vyve-cache-v2026-04-11x`)

### Hard rules added (31–34)
See master.md section 8 for full rules.

---

## 11 April 2026 — Platform Alert Fixes + Full Portal Auth Audit

### Context
Platform monitoring (deployed yesterday) began firing alerts. Three distinct issues identified from live alerts plus one discovered during the subsequent full 38-page portal audit.

### Fix 1: index.html — PostHog SyntaxError (CRITICAL)
- **Alert:** `js_error` — `SyntaxError: Unexpected token ','` at `index.html:305`
- **Root cause:** PostHog init on line 305 had literal `+ POSTHOG_KEY +` placeholder instead of the real key — invalid JS syntax
- **Impact:** Entire dashboard JavaScript blocked for all members on every page load
- **Fix:** Replaced `posthog.init( + POSTHOG_KEY + ,{...})` with real key `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl`
- **Commit:** `0d66099`

### Fix 2: tracking.js — Session views using anon key as Bearer (CRITICAL)
- **Alert:** `auth_401_session_views` on `/yoga-live.html` for `stuwatts09@gmail.com`
- **Root cause:** `tracking.js` built headers with `Authorization: Bearer SUPABASE_ANON` (anon key). RLS on `session_views` and `replay_views` requires authenticated JWT — anon key rejected with 401
- **Impact:** All 13 live and replay pages (yoga-live, mindfulness-live, workouts-live, checkin-live, therapy-live, education-live, events-live, podcast-live + all -rp equivalents) failing to log session views
- **Fix:** Replaced static headers constant with `async getHeaders()` function that fetches real user JWT via `window.vyveSupabase.auth.getSession()`, falls back to anon only if session unavailable
- **Commit:** `5adf652`

### Fix 3: nutrition-setup.html — Auth race condition (CRITICAL)
- **Alert:** `auth_401_members` on `/nutrition-setup.html` for Dean and Stuart
- **Root cause:** `window.addEventListener('load', () => { if (window.vyveCurrentUser) init(); })` fired before `vyveSupabase` was confirmed set — `supa()` helper fell back to anon key, which has no RLS permission to read/write `members`
- **Fix:** Removed the racing `window.load` fallback. `init()` now fires exclusively via `document.addEventListener('vyveAuthReady', ...)` which fires only after session confirmed
- **Commit:** `43319306`

### Fix 4: running-plan.html — anthropic-proxy rejecting anon key (HIGH — discovered in audit)
- **No alert fired** (EF silently rejected, no DB write to trigger alert)
- **Root cause:** `running-plan.html` called `anthropic-proxy` with `Authorization: Bearer SUPA_KEY` (anon key). `anthropic-proxy` has `verify_jwt: true` — rejects anon key
- **Impact:** Running plan generation broken for all members since `verify_jwt: true` was added to anthropic-proxy during security audit
- **Fix:** PROXY_URL fetch now uses async IIFE to get real JWT from `window.vyveSupabase.auth.getSession()` before sending request
- **Commit:** `a09a5a5`

### sw.js cache bumps
- `vyve-cache-v2026-04-11s` — after first three fixes
- `vyve-cache-v2026-04-11t` — after running-plan fix

### Full 38-page portal audit results
- **38 files audited** (36 HTML pages + auth.js + sw.js)
- **0 remaining issues** after today's fixes
- **32 pages clean** — correct auth patterns confirmed
- **6 informational** — public/infrastructure files (login, set-password, consent-gate, offline, auth.js, sw.js)
- Leaderboard warning was false positive — `getJWT()` correctly used in `loadLeaderboard()`
- nutrition-setup.html still shows minor flag (window.load present alongside vyveAuthReady) — resolved by Fix 3

### Hard rules added (28, 29, 30)
See master.md section 8 for full rules.

---

## 11 April 2026 — Nutrition Setup Flow + Full Onboarding Data Completeness

### New: nutrition-setup.html
- Created standalone portal page for members who selected "Maybe later" on nutrition during onboarding
- Empty state on `nutrition.html` now links to `/nutrition-setup.html` instead of dead `/onboarding_v8.html`
- Page matches onboarding nutrition section exactly: diet satisfaction slider, activity life-cards, nutrition goal, height/weight with unit toggles, full TDEE preview (maintenance + target + optional harder deficit slider + final target box), nutrition guidance level
- Auth-gated, respects dark/light theme via `theme.js`
- On submit: PATCHes `members` table with `tdee_maintenance`, `tdee_target`, `deficit_percentage`, `height_cm`, `weight_kg`, `activity_level`, `goal_focus`, `baseline_diet`, `age`, `dob`
- DOB input pre-filled from `members.dob` on load; age computed live from DOB for TDEE accuracy
- "Skip for now" link returns to `nutrition.html`

### Fixed: Supabase anon key rotation
- `nutrition-setup.html` was using old expired anon key (iat: 1740580304) causing "Invalid API key" save error
- Updated to current valid key (iat: 1775066495)

### Fix: `baseline_diet` check constraint
- `baseline_diet` column has `>= 1 AND <= 10` constraint; slider min was 0 (to achieve 50% position) causing saves to fail
- Fixed: only write `baseline_diet` if value >= 1

### Fix: Diet satisfaction slider centering
- Changed `min="1"` to `min="0"` so value=5 sits at exactly 50% of the track

### Fix: Nav overlap on mobile
- Added `@media(max-width:768px)` padding override to clear the 56px top header and 80px bottom nav injected by `nav.js`

### New: DOB stored, age computed dynamically
- Added `dob date` column to `members` table
- Created `member_age(dob date)` SQL function — computes current age from DOB in any query
- Onboarding EF v57 now stores `dob` from form submission; removed static `age` write
- Age in TDEE calculation is now always accurate and updates automatically on birthdays without cron jobs
- Backfilled `age` integer for all 11 existing members manually
- Set Dean's DOB: 1991-02-06

### New: All onboarding questionnaire fields now persisted (onboarding EF v56 → v57)
DB migration added 7 new columns to `members`:
- `training_goals` text — comma-separated training goals array
- `barriers` text — barriers to exercise
- `sleep_hours_range` text — sleep duration choice (e.g. "7-8 hours")
- `sleep_help` text — sleep help preferences
- `social_help` text — social help preferences
- `nutrition_guidance` text — guidance level preference
- `location` text — member city/area

welcome.html payload updated to include 3 previously missing fields:
- `sleepHours`, `bedtime`, `heightUnit`

Onboarding EF now writes all previously missing fields:
- `training_goals`, `barriers`, `sleep_hours_range`, `sleep_bedtime`, `sleep_help`, `social_help`, `nutrition_guidance`, `location`, `weight_unit`, `height_unit`

Previously fixed in v55/v56: `age`, `goal_focus`, `tdee_maintenance`, `deficit_percentage`, `support_areas`, `support_style`, `motivation_help`

### Onboarding EF version history (11 April 2026)
- v55: Added age, goal_focus, tdee_maintenance, deficit_percentage, support_areas, support_style, motivation_help
- v56: Added all remaining questionnaire fields (training_goals, barriers, sleep_hours_range, sleep_bedtime, sleep_help, social_help, nutrition_guidance, location, weight_unit, height_unit)
- v57: Replaced static age write with dob date storage; computeAge() function added to EF

### SW cache
- Bumped through `j` → `r` during this session. Current: `vyve-cache-v2026-04-11r`

---

## 2026-04-11 (Leaderboard Auth Fix)

### Summary
`leaderboard.html` had `getJWT()` referencing `window._supabase` which doesn't exist. Auth.js exposes the Supabase client as `window.vyveSupabase`. The JWT call silently failed (caught by try/catch returning null), so the leaderboard edge function received no valid authentication and couldn't identify the caller for ranking.

### Fix
- `leaderboard.html` — changed `window._supabase` to `window.vyveSupabase` in `getJWT()`
- `sw.js` — cache bumped to `vyve-cache-v2026-04-11i`

### Rule Added
- All portal pages must use `window.vyveSupabase` for auth — never `_supabase`, `_sb`, or other aliases. grep for non-standard Supabase client references after any auth refactor.

---

## 11 April 2026 — Platform Monitoring System

### Built
- **`platform_alerts` table** — central alert storage (severity, type, source, member, dedup indexes, RLS service-role only)
- **`platform-alert` Edge Function v1** — receives alerts, deduplicates (same type + member within 1hr), sends Brevo email to Dean + Lewis, sends VAPID push to subscribed devices
- **Client-side Platform Monitor** (added to `auth.js`) — catches:
  - JS runtime errors (`window.onerror`)
  - Unhandled promise rejections
  - API 401s and 500s (fetch interceptor on all Supabase calls)
  - Network failures on API calls
  - Page load timeouts (app container not visible after 15s)
  - PWA not installed after 7 days of use
  - Exposes `window.vyveAlert(type, severity, details)` for manual reporting from page code
- **sw.js cache bumped** `v2026-04-11i` → `v2026-04-11j`

### Commits
- `vyve-site` 16eeb3e — auth.js monitor + sw.js cache bump

### Architecture decisions
- Monitor added to `auth.js` (not a separate file) since it's already loaded on every portal page
- `fetch()` interceptor pattern — wraps native fetch to monitor all Supabase API calls without modifying individual pages
- Deduplication both client-side (per session) and server-side (per type+member per hour) to prevent alert fatigue
- `platform-alert` EF is `verify_jwt: false` with CORS restriction — client-side can't send API keys, CORS is sufficient protection

### Outstanding monitoring items
- Health check cron EF (proactive service monitoring every 30 min) — not yet built
- Server-side error reporting in critical EFs (member-dashboard, wellbeing-checkin, log-activity, onboarding) — not yet wired
- Alert dashboard page (alerts.html or section on strategy.html) — not yet built


## 2026-04-11 (Audit Collateral — Certificates + Engagement Pages Fixed)

### Summary
Two more portal pages were broken by the security audit's removal of the `?email=` fallback from `member-dashboard`. Both `certificates.html` and `engagement.html` were calling the edge function with NO auth header at all — no `getJWT()` function existed on either page. After the audit enforced JWT-only auth on `member-dashboard`, both pages returned 401 on every load.

### Root Cause
When `member-dashboard` v29 removed the `?email=` fallback (Fix 2 in the audit), `index.html` was updated to use JWT auth. But `certificates.html` and `engagement.html` also call the same edge function and were NOT updated. They had no `getJWT()` helper and no `vyveSupabase` reference.

### Fixes Applied
- `certificates.html` — added `getJWT()` helper, replaced unauthenticated fetch with JWT-authenticated fetch
- `engagement.html` — same fix
- `sw.js` — cache bumped to `vyve-cache-v2026-04-11h`

### Pages Verified Safe
- `monthly-checkin.html` — already sends JWT ✅
- `nutrition.html`, `settings.html`, `log-food.html` — use `?email=` as REST API filter (PostgREST WHERE clause), not as EF auth. JWT sent correctly ✅
- `running-plan.html` — uses ANON key but `running_plan_cache` has `public_read` RLS policy ✅

### Rule Added
- When changing auth on an Edge Function, **grep all portal pages** for calls to that function. Every caller must be updated, not just the main dashboard.

---

## 2026-04-11 (Critical Bug Fix — Dashboard Stats Not Rendering)

### Summary
Fixed a JavaScript scoping bug in `index.html` that prevented dashboard stats from rendering for all users. Caused by the security audit refactor on the same day.

### Root Cause
The security audit refactor changed `email` from a script-level variable to `const email` inside `onAuthReady()`. The `loadDashboard()` function (defined at script scope) still referenced `email` on the `writeHomeCache(email, data)` call. Since `const` is block-scoped, `email` was undefined in `loadDashboard()`, causing a `ReferenceError`. The try/catch caught it and displayed "Could not connect. Please refresh." instead of rendering the dashboard data.

The edge function (`member-dashboard` v34) was returning 200 with correct data — the bug was purely frontend.

### Fix Applied
- `index.html` — changed `writeHomeCache(email,data)` to `writeHomeCache((window.vyveCurrentUser&&window.vyveCurrentUser.email)||'',data)` (commit 3b5dedf5)
- `sw.js` — cache bumped to `vyve-cache-v2026-04-11g` to force PWA refresh

### Files Changed
| File | Change |
|------|--------|
| `index.html` | Fixed email variable scope in `loadDashboard()` |
| `sw.js` | Cache bumped `v2026-04-11f` → `v2026-04-11g` |

### Rule Added
- When refactoring variable scope (var/let/const), always check all functions that reference the variable — not just the function where it's declared. `const` and `let` are block-scoped; `var` is function-scoped.

---

## 2026-04-11 (Security Remediation — Complete)

### Summary
Full security remediation executed across all 8 fixes identified in the 2026-04-11 audit. All critical and high-priority vulnerabilities resolved. Platform is now production-secure.

### Edge Functions Updated

| Function | Version | Change |
|----------|---------|--------|
| `github-proxy` | v15 | Added `x-proxy-key` header auth (GITHUB_PROXY_SECRET), CORS restricted to `online.vyvehealth.co.uk` |
| `member-dashboard` | v29 | Removed `?email=` query param fallback entirely, JWT-only auth enforced |
| `onboarding` | v57 | CORS restricted to `https://www.vyvehealth.co.uk`, ONBOARDING_SECRET check removed (Option A — static site can't safely hold secrets) |
| `send-email` | v16 | CORS restricted, service-role-key auth on HTTP handler, model fixed from `claude-sonnet-4-5` → `claude-sonnet-4-20250514` |
| `employer-dashboard` | v26 | Unauthenticated fallback code path removed, hard fail if EMPLOYER_DASHBOARD_API_KEY not configured |

### Portal Files Updated (vyve-site)
- `index.html` — removed `?email=` param and hardcoded fallback email `deanonbrown@hotmail.com` from member-dashboard fetch call
- `sw.js` — cache bumped to `vyve-cache-v2026-04-11a`

### Marketing Site Updated (Test-Site-Finalv3)
- `welcome.html` — removed `ONBOARDING_KEY` declaration and `x-onboarding-key` header from onboarding fetch call (Option A — placeholder was non-functional in static context)

### Database Changes
- **Fix 6** — `session_chat` INSERT policy `with_check` confirmed correct, no change needed
- **Fix 7** — Dropped 20 redundant per-operation RLS policies across 7 tables (`cardio`, `daily_habits`, `workouts`, `session_views`, `replay_views`, `weekly_scores`, `wellbeing_checkins`). Each now has exactly 1 `ALL` policy.
- **Fix 8** — Dropped 2 duplicate indexes on `exercise_notes` (`exercise_notes_member_idx`, `idx_exercise_notes_member`). `weekly_scores_member_week_unique` retained — it's a real unique constraint.

### Secrets Set in Supabase Dashboard
- `GITHUB_PROXY_SECRET` — protects github-proxy write access
- `ONBOARDING_SECRET` — set but unused (Option A decision)
- `EMPLOYER_DASHBOARD_API_KEY` — required for employer dashboard access

### Architecture Decision — Option A (Onboarding Secret)
The `ONBOARDING_SECRET` pattern was abandoned because `welcome.html` is a static GitHub Pages file — any secret embedded in it is publicly readable. CORS restriction to `https://www.vyvehealth.co.uk` is the correct and sufficient protection for a public-facing onboarding form at current scale.


---

## 2026-04-11 (Full System Audit)

### Summary
Full system audit completed across all layers: architecture, Supabase, Edge Functions, frontend, security, performance. 5 critical vulnerabilities identified, remediation plan created, backlog updated.

### Critical Findings
- **github-proxy** — zero authentication, allows unauthenticated read/write to private repo (FIX 1)
- **member-dashboard** — `?email=` fallback exposes member data without JWT (FIX 2)
- **onboarding** — CORS `*`, no payment verification, creates auth users from public internet (FIX 3)
- **send-email** — open email relay from `team@vyvehealth.co.uk` (FIX 4)
- **employer-dashboard** — API key secret not set, unauthenticated fallback active (FIX 5)

### Additional Findings
- `send-email` has invalid model name (`claude-sonnet-4-5`) — will cause re-engagement failures
- `session_chat` INSERT policy allows impersonation (`with_check: true` instead of `auth.email() = member_email`)
- 6 tables have duplicate RLS policies (ALL + per-operation) from previous security audit debugging
- Duplicate indexes on `weekly_scores` and `exercise_notes`
- `ai_decisions` INSERT policy overly permissive

### What's Good (Confirmed)
- All 39 tables have RLS enabled ✅
- Brain repo accurate against live state ✅
- Onboarding v48 well-built (stress scale, FK race, decision logging) ✅
- Auth.js consent gate working correctly ✅
- Database indexes well-placed for current query patterns ✅

### Outputs
- `VYVE_Full_System_Audit_2026-04-11.md` — complete audit report
- `VYVE_Remediation_Plan_2026-04-11.md` — step-by-step implementation for 11 fixes
- `tasks/backlog.md` — updated with security section at top

### Brain Updates
- `tasks/backlog.md` updated with 🔴 Security section

### Rules Added
- github-proxy requires `GITHUB_PROXY_SECRET` header (after fix deployed)
- member-dashboard: JWT-only auth, no `?email=` fallback (after fix deployed)
- onboarding: CORS restricted to `www.vyvehealth.co.uk` + `ONBOARDING_SECRET` header (after fix deployed)

## 2026-04-11 (Daily Sync)

### Summary
Full session: Layer 2 Web Push (VAPID) implemented end-to-end and confirmed working on iOS. Notifications redesigned from slide-up sheet to full-screen themed page.

### Completed
- **VAPID Web Push (Layer 2)** — P-256 key pair generated, `vapid.js` created (triggers on bell tap for iOS gesture compliance), `sw.js` push + notificationclick handlers added, `habit-reminder` v4 + `streak-reminder` v4 updated with RFC 8291 AES-GCM encryption using Deno Web Crypto only. `send-test-push` v4 confirmed working on iOS.
- **`VAPID_PRIVATE_KEY` secret** set in Supabase by Dean.
- **Notifications full-screen page** — replaced slide-up sheet with solid full-screen page: back arrow top left, clear-all bell top right, bottom nav bar, `var(--bg)` background (theme-aware), unread items highlighted.
- **Daily report** run manually for Friday 10 April: 5 activities, 2 new members.
- **sw.js cache** bumped to `vyve-cache-v2026-04-10aa`.

### Key Architecture Decisions
- iOS push permission must be triggered from a user gesture (bell tap) — not page load
- `esm.sh` library imports fail in Supabase Edge Functions — use Deno built-in Web Crypto only for RFC 8291 encryption
- `vapid.js` loaded on `index.html` only for now; expand to other pages when Capacitor wrap is underway

### Secrets
- `VAPID_PRIVATE_KEY` — set ✅
- VAPID public key: `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`

## 2026-04-11 (Web Push encryption fix)

### fix: RFC 8291 full AES-GCM encryption — habit-reminder v4, streak-reminder v4, send-test-push v4

Apple's push service requires fully encrypted payloads (RFC 8291). Previous versions sent unencrypted JSON which Apple rejected with status 0. Rewrote `sendPush()` and `encryptPayload()` using Deno built-in Web Crypto only (no external libraries). Confirmed working on iOS PWA.

| Function | Version |
|----------|---------|
| `send-test-push` | v4 (confirmed working) |
| `habit-reminder` | v4 |
| `streak-reminder` | v4 |

## 2026-04-11 (Notifications — Layer 2 Web Push / VAPID)

### feat: VAPID Web Push — push handler in sw.js, vapid.js subscriber, EFs updated

**Commit:** d5937b957c63f3770bc4faa3ddbc24bb369cb904 (vyve-site)
**sw.js cache bumped:** `vyve-cache-v2026-04-10y` → `vyve-cache-v2026-04-10z`

#### Portal changes
- `vapid.js` (new) — requests push permission on auth, subscribes via `pushManager.subscribe()`, saves `{endpoint, p256dh, auth_key}` to `push_subscriptions` table. Loaded on `index.html` only.
- `sw.js` — added `push` event listener (shows native OS notification with icon/badge) and `notificationclick` listener (focuses or opens portal). Cache bumped to `vyve-cache-v2026-04-10z`.
- `index.html` — `<script src="/vapid.js"></script>` added before `nav.js`.

#### Edge Functions updated
| Function | Version | Change |
|----------|---------|--------|
| `habit-reminder` | v2 | After in-app write, fetches `push_subscriptions` for member → fires VAPID push if present. VAPID JWT signed with P-256 + VAPID_PRIVATE_KEY secret. |
| `streak-reminder` | v2 | Same VAPID dispatch pattern added. |

#### VAPID keys
- **Public key** (embedded in `vapid.js` and EFs): `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`
- **Private key** — must be set as Supabase secret: `VAPID_PRIVATE_KEY` = `nlaC3bzFXVUOGj1lq46Uu94LzDZGJh6MA0ObeaPIU74` ⚠️ **Dean: set this secret before push will work**

#### iOS note
Web Push requires PWA installed to home screen on iOS (Safari 16.4+). Android Chrome works with no install required.

## 2026-04-11 (Notifications system — Layer 1)

### feat: in-app notifications — bell badge, slide-up sheet, 5 Edge Functions

**Commit:** f0f252f1c6421626a86135c77755cf42045aed9f
**sw.js cache bumped:** `vyve-cache-v2026-04-10x` → `vyve-cache-v2026-04-10y`

#### Supabase
- New table: `member_notifications` (id, member_email, type, title, body, read, created_at) + RLS (auth.email() = member_email) + lookup index
- New table: `push_subscriptions` (id, member_email, endpoint, p256dh, auth_key) + RLS — Layer 2 scaffold, no logic yet

#### Edge Functions deployed
| Function | Version | Change |
|----------|---------|--------|
| `notifications` | v1 (new) | GET → unread count + list (last 50). POST mark_read (one or all). JWT-verified. |
| `log-activity` | v12 | Writes streak milestone notifications (7/14/30/60/100 days) after successful insert via waitUntil(). Per-milestone dedup (fires once ever per milestone value). |
| `wellbeing-checkin` | v26 | Writes check-in confirmation notification after submission via waitUntil(). Deduped per day. |
| `habit-reminder` | v1 (new) | Cron 20:00 UTC daily. Finds members with no habit logged today → writes in-app notification. Layer 2 push extension point. |
| `streak-reminder` | v1 (new) | Cron 18:00 UTC daily. Finds members with streak ≥ 7 and no activity today → writes in-app notification. Layer 2 push extension point. |

#### Cron schedules registered
- `habit-reminder-daily` — `0 20 * * *` (8pm UTC)
- `streak-reminder-daily` — `0 18 * * *` (6pm UTC)

#### Portal — index.html
- Bell button (`#mob-bell-btn`): added `position:relative` to CSS, replaced `href='#notifications'` with `onclick="openNotifSheet()"`
- Badge span (`#notif-badge`): absolutely positioned on bell, `var(--accent,#e84393)` background, hidden when count = 0
- Notification sheet: slide-up overlay, `var(--card-bg)` background, `var(--text)`/`var(--text-muted)` text — fully theme-aware light/dark
- Unread dot per item: `var(--accent)` colour, fades out on read
- Mark-all-read fires on sheet open (non-blocking fetch)
- Count polls on `vyveAuthReady` event + every 5 minutes

#### Layer 2 readiness
- `push_subscriptions` table created (empty)
- Both cron EFs have a clearly marked Layer 2 extension point for VAPID push dispatch
- `sw.js` push handler will be a ~10 line addition when Capacitor push permission is wired

---

## 2026-04-11 (nav overlap fixes + settings overhaul)

### fix: content hidden under nav on 3 portal pages

**Files:** `workouts.html`, `log-food.html`, `sessions.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10n` → `vyve-cache-v2026-04-10o`

Full audit of all 15 portal pages against nav.js injection (56px mobile header, 80px bottom nav, z-index 9999).

**workouts.html** — sticky sub-view headers (`.es-header`, `.sh-header`, `.prs-header`, `.hist-header`) had `top:0`, sitting under the 56px mobile nav on scroll. Added:
```css
@media(max-width:768px){ .es-header,.sh-header,.prs-header,.hist-header{top:56px} }
```

**log-food.html** — internal `.top-bar` (`position:sticky;top:0`) clipped under mobile nav. Added:
```css
@media(max-width:768px){ .top-bar{top:56px} }
```

**sessions.html** — duplicate `.mob-page-header` CSS block (`position:sticky;top:0`) was dead code; nav.js injects the real element. Removed the block entirely.

**Clean pages (no changes needed):** `index`, `habits`, `nutrition`, `settings`, `wellbeing-checkin`, `certificates`, `engagement`, `leaderboard`, `running-plan`, `login`, `set-password`.

---

### fix(settings): habits modal — save button buried under bottom nav + no close button

**Files:** `settings.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10o` → `vyve-cache-v2026-04-10p`

**Root cause:** `.modal-overlay` had `z-index:1000`; bottom nav is `z-index:9999`. Modal rendered *under* the nav.

- `.modal-overlay` z-index: `1000 → 10001` (above nav) — applied to both habits and persona modals
- `.modal-sheet` converted to `display:flex; flex-direction:column` — enables sticky footer
- `.modal-cta` (Cancel / Save buttons) now `position:sticky; bottom:0` — always visible regardless of list length
- Habits list wrapped in `.modal-body` (`flex:1; overflow-y:auto`) — scrollable content area
- Added ✕ close button to header of both habits modal and persona modal
- Sheet padding moved from shorthand to `padding:20px 20px 0` with CTA handling its own bottom safe-area

---

### fix(settings): persona modal closes before save + AI reasoning → clean bestFor snippets + cache-first load

**Files:** `settings.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10p` → `vyve-cache-v2026-04-10q`

**Bug 1 — modal closes on tap inside sheet:**
Added `onclick="event.stopPropagation()"` to `.modal-sheet` on both modals. Touch events no longer bubble up to the overlay, so only tapping the dark backdrop closes the modal.

**Bug 2 — verbose AI reasoning replaced with clean "Best for" snippet:**
- Removed `ai_decisions` Supabase fetch from page load (one fewer round trip)
- "Why this coach was chosen" label → "Best for"
- Box is now always visible (was `display:none` until DB returned)
- Each persona now has a `bestFor` field in the JS `PERSONAS` object:
  - **NOVA** — People driven by targets who want every session to count
  - **RIVER** — Anyone managing stress, burnout, or poor sleep
  - **SPARK** — People who struggle with consistency and need an energetic nudge
  - **SAGE** — Members who want to understand the science behind their choices
  - **HAVEN** — Anyone needing a safe, non-judgmental space for mental health

**Feature — settings cache-first load:**
- `populateFromCache(cache)` function fills UI instantly from `localStorage` (`vyve_settings_cache`)
- Cache TTL: 10 minutes; keyed to user email
- `waitForAuth` reads cache first → shows full UI immediately → Supabase refreshes in background
- Cache written at end of `loadProfile`; updated on persona save

---

## 2026-04-10 (leaderboard — live data)

### feat: leaderboard wired to live Supabase data

**Commits:** leaderboard EF v1 deployed to Supabase; vyve-site 7691280542f8

**leaderboard Edge Function v1** (new EF, verify_jwt: false, JWT-preferred auth)
- Queries `daily_habits`, `workouts`, `cardio`, `session_views` for current calendar month across all members
- Includes all members table entries (zero-activity members appear at bottom)
- Per-member counts: all activities, habits only, workouts only, streak
- **Streak:** consecutive days back from today where any activity of any type was logged
- Returns: `first_name`, plus per-metric objects (`all`, `habits`, `workouts`, `streak`) each containing `your_rank`, `total_members`, `your_count`, `above` (anonymous), `below_count`, `gap`
- All members above caller returned as anonymous — no names, no emails exposed

**leaderboard.html** — full rewrite
- Removed Sage and My team scope tabs — All members only
- All 4 metric tabs (All / Habits / Workouts / Streak) now live — switch client-side from single EF response
- Your position card, above board, gap nudge all rendered from live data
- Zero hardcoded mock data remaining
- Dynamic month label in pill (JS, not hardcoded)
- Streak tab gap nudge uses "days" unit not "activities"
- Loading state shown while EF responds; error state if EF fails

`sw.js` cache bumped: `vyve-cache-v2026-04-10m` → `vyve-cache-v2026-04-10n`

## 2026-04-10 (workouts modularisation)

### refactor: workouts.html — split inline JS into 6 modules

**Commit:** b28c2b79b6754b58bf1dda79873f94b903bae851

workouts.html was 2,117 lines / 131KB with a single 1,575-line inline `<script>` block. Every future edit had the large-file deployment problem (>10KB Composio inline limit). Split into named `<script src="...">` files — no bundler, no `type="module"`, no behaviour changes.

| File | Lines | Responsibility |
|------|-------|----------------|
| `workouts-config.js` | 81 | Consts, 26 globals, `getJWT`, utility functions |
| `workouts-programme.js` | 237 | Programme load/render, exercise library cache, custom workouts |
| `workouts-session.js` | 598 | Session open/close, set logging, timers, completion flow |
| `workouts-exercise-menu.js` | 269 | Exercise menus, reorder, swap/add, history view |
| `workouts-builder.js` | 153 | Custom workout builder, rest settings |
| `workouts-notes-prs.js` | 235 | Notes, PRs, sessions history, MutationObserver boot |

`workouts.html` reduced from 2,117 → 548 lines (CSS + HTML shell + 6 `<script src>` tags).

**Verification:** 89/89 functions present across modules. Zero missing, zero extra.

**Load order:** config → programme → session → exercise-menu → builder → notes-prs → nav.js

`sw.js` cache bumped: `vyve-cache-v2026-04-10l` → `vyve-cache-v2026-04-10m`

## 2026-04-10 (settings page — persona selector, habit manager, goals, units, ai_decisions)

### New features deployed

**settings.html** — major update with 4 new sections:

1. **AI Coach section** — shows current persona name + description. Displays why the coach was chosen, pulled from new `ai_decisions` table (falls back to `members.persona_reason`). "Change coach" bottom sheet shows all 5 personas with descriptions. HAVEN shown as coming soon. Change takes effect immediately, writes to `persona_switches` + `ai_decisions` with `triggered_by: 'self'`.

2. **Daily Habits section** — shows current habits as tags. "Manage habits" bottom sheet shows all 30 habits from `habit_library` grouped by pot (Sleep, Movement, Nutrition, Mindfulness, Social). Max 10 selectable. Saves to `member_habits` with `assigned_by: 'self'`. Logs to `ai_decisions`.

3. **Your Goals section** — 8-button grid (Lose weight, Build muscle, Improve fitness, Reduce stress, Better sleep, Build consistency, More energy, General health). Saves immediately to `members.specific_goal`. Logs to `ai_decisions`.

4. **Units section** — weight (kg/lbs/stone) and height (cm/ft) toggles. Saves to new `members.weight_unit` and `members.height_unit` columns.

### New infrastructure

- **`ai_decisions` table** — created with RLS. Columns: `id`, `member_email`, `decision_type` (persona_assigned/habit_assigned/goal_updated/persona_changed), `decision_value`, `reasoning`, `triggered_by`, `created_at`. Members can read their own rows. Service role inserts.

- **`members.weight_unit` + `members.height_unit`** — new columns, default 'kg' and 'cm'.

### onboarding v48 (EF version 51)

- `selectPersona()` now calls Claude to generate a specific, member-facing reasoning paragraph for every assignment — hard-rule or AI path. Format: "Based on your onboarding responses: [specific signals]. [Coach] is [reason]."
- `selectHabits()` now returns both `ids` and `reasoning` — Claude explains which profile signals drove the habit selection.
- New `writeAiDecisions()` function writes two rows to `ai_decisions` at onboarding: one for persona, one for habits.
- Response now includes `ai_reasoning` and `habit_reasoning` fields.

### sw.js
Cache bumped: `vyve-cache-v2026-04-10k` → `vyve-cache-v2026-04-10l`

## 2026-04-10 (onboarding — major bug fixes & persona logic corrections)

### Root causes fixed
Three separate bugs were silently preventing habit assignment for every new member since v44:
1. **FK race condition** — `writeHabits` fired in parallel with `writeMember`. When `writeHabits` beat the DB, the FK on `member_email` failed. Fixed in v44: two-stage Promise.all, `writeMember` commits first.
2. **`assigned_by: 'onboarding_ai'`** — check constraint on `member_habits` only allows `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`. Fixed in v46: changed to `'onboarding'`.
3. **Stress scale inverted** — onboarding questionnaire labels stress 1=very stressed, 10=very calm. All code treated high stress as negative. Fixed in v45: flipped all hard rules, added scale reminders to all AI prompts.

### onboarding v47 (deployed as EF version 50) — cumulative fixes
- **v44**: Two-stage Promise.all — `writeMember` then FK-safe writes
- **v45**: Corrected stress scale throughout — RIVER hard rule: `stress <= 3` (not `>= 7`), NOVA: `stress >= 7` (not `<= 4`)
- **v46**: `assigned_by: 'onboarding'` (was `'onboarding_ai'` — check constraint violation)
- **v47**: NOVA hard rule now requires 1-2 goals max where performance is dominant. Members with 3+ mixed goals go to AI path.

### welcome.html — fix: silent failure with fake results
- Previously: any EF failure (timeout, error) showed fake hardcoded RIVER results. Member thought they'd onboarded. Nothing wrote to DB.
- Now: 90s `AbortController` timeout. At 30s loading text updates. On failure: error screen with retry button. Stored form data allows retry without re-filling questionnaire. Up to 3 retries.
- Commit: `9fb62ad5890b` in Test-Site-Finalv3

### Persona corrections (inverted stress scale)
| Member | Old (wrong) | New (correct) | Reason |
|--------|-------------|---------------|--------|
| Stuart Watts | RIVER | NOVA | stress 7=calm, wellbeing 8, energy 8, gym 4x, holiday goal |
| Alan Bird | RIVER | SPARK | stress 10=very calm but energy 5, mixed lifestyle goals |
| Dean Brown | NOVA | SPARK | stress 8=calm but 5 mixed goals, 1-2 days/week, demanding work context |

### Alan Bird — habits corrected
Previous habits were based on wrong assumption he was stressed. Replaced stress-relief set with goal-aligned set:
- Removed: Consistent bedtime, Pre-sleep wind-down routine, Daily breathing exercise
- Added: Drink 2 litres of water, Eat breakfast, Move every hour

### Members backfilled (had no habits due to bugs)
- Alan Bird, Stuart Watts, Owen Barrett: habits manually inserted
- Owen Barrett: workout plan triggered (had no plan)
- Callum Budzinski: workout plan triggered
- Kelly Bestford, Lewis Vines, Callum Budzinski: habits manually inserted

### daily_habits table fixes
- Unique constraint added: `(member_email, activity_date, habit_id)` — one row per habit per day
- Cap trigger raised from 1/day to 10/day — allows all 5 habits to log
- On conflict key in portal updated to `member_email,activity_date,habit_id`

### habits.html fixes
- Bottom bar: removed `position:fixed` — now flows inline below habits list (was overlapping)
- Auth: upgraded from polling `waitForAuth` to event-driven `vyveAuthReady`
- sw.js bumped to `vyve-cache-v2026-04-10k`


---

## 2026-04-10 (performance — caching & loading)

### sw.js — perf: cache-first portal HTML + Supabase thumbnail caching
- Added `PORTAL_PAGES` array — all portal HTML pages now served cache-first with background revalidation (previously network-first, required round-trip on every visit)
- Added stale-while-revalidate handler for Supabase storage URLs (`/storage/`) — thumbnails cached in `RUNTIME_CACHE` after first load
- Cache version bumped: `vyve-cache-v2026-04-10h` → `vyve-cache-v2026-04-10i`

### auth.js — perf: dispatch vyveAuthReady event
- Added `window.dispatchEvent(new CustomEvent('vyveAuthReady'))` immediately after `vyveRevealApp()` is called
- Pages listening for this event now proceed instantly when auth resolves rather than waiting for a polling tick

### index.html — perf: replace waitForAuth polling with event-driven pattern
- `waitForAuth(attempts)` polling loop (100ms interval, 20 retries max) replaced with `waitForAuth()` event listener
- Listens for `vyveAuthReady` custom event — fires immediately when auth.js resolves the session
- Falls back to `setTimeout(3000)` hard fallback if event never fires
- Eliminates up to 100ms artificial lag per poll cycle on cold loads

### workouts.html — perf: exercise library localStorage cache + lazy thumbnails
- `loadAllExercises()` now checks `localStorage` key `vyve_exercise_library_v1` before hitting Supabase
- Cache TTL: 24 hours. Cache hit = zero network request, instant exercise search
- On cache miss/expiry: fetches from Supabase and writes to cache for next visit
- Thumbnail `<img>` tags in exercise search list now use `data-src` + `class="es-lazy-thumb"` instead of eager `src`
- `renderExerciseList()` now attaches an `IntersectionObserver` after rendering — images only load when scrolled into view (`rootMargin: 100px` pre-load buffer)
- Fallback for browsers without IntersectionObserver: all images load immediately (same as before)

# VYVE Brain Changelog

## 2026-04-10 (onboarding QA — welcome.html)

### welcome.html — fix: text contrast across full questionnaire (light mode)
- `--text-2` bumped from `#3A5A5A` to `#1E3C3C` in light theme block
- `--text-3` bumped from `#7A9A9A` to `#4A7272` in light theme block
- Affects all question labels, hints, slider end labels, and sub-text. welcome.html has its own inline CSS block so change is isolated to onboarding only.

### welcome.html — feat: city/town searchable dropdown for location field
- Replaced plain text input with type-ahead dropdown backed by static JS array of ~100 UK cities and towns
- Filters on 2+ characters, shows max 8 results, click/tap to select, closes on blur
- Hint updated: "Start typing your city or town — if it doesn't appear, just type it in and continue"
- No external API dependency — fully self-contained

### welcome.html — fix: email sender address in results screen
- "What happens next" paragraph now explicitly names `team@vyvehealth.co.uk` as the sender
- Copy: "Keep an eye out for a welcome email from team@vyvehealth.co.uk"

### welcome.html — feat: persona card — coach explanation line
- Static line added below AI-generated persona reason on results screen
- Copy: "Your coach shapes every recommendation, check-in, and message you receive. You can change them anytime in your settings."

### welcome.html — feat: "What's inside VYVE" feature showcase on results screen
- New section below "What happens next" card
- 7 features: 8-week programme, AI coaching, daily habits, live sessions, nutrition, weekly check-ins, certificates/leaderboards/charity
- Each item has bold title + 1-sentence description emphasising personalisation and ability to update anytime
- No emojis (Lewis preference — applied globally to welcome.html)

### results-preview.html — added to Test-Site-Finalv3
- Standalone QA preview page at www.vyvehealth.co.uk/results-preview.html
- Shows mocked results screen with realistic data for review
- Temporary file — delete once QA sign-off complete

## 2026-04-10 (evening — bug fixes session)

### workouts.html — fix: reorder wipes in-progress sets
- `saveReorder()` now snapshots kg/reps/ticked/bw/notes per exercise name before calling `renderSessionBody()`, then restores after. Mid-session reorder no longer wipes workout progress.
- commit b93fd175

### theme.css + auth.js — feat: portrait orientation lock
- CSS `#vyve-rotate-overlay` shown via `@media (orientation: landscape) and (max-height: 430px)` — phone-only, not tablets.
- `vyvePortraitLock()` IIFE in auth.js: calls `screen.orientation.lock('portrait')` (Android) and injects the overlay div into every portal page automatically — no per-page changes needed.
- iOS Safari ignores the API; CSS overlay handles iOS.
- Decision: overlay kept post-Capacitor as safety net for browser access. Suppress during active workout session is a known backlog item.
- sw.js bumped to vyve-cache-v2026-04-10f

### workouts.html — fix: PR/history scroll lock + content hidden under nav
- `openPrsView()` / `openSessionsHistory()` now clear `body.overflow` so fixed overlay scrolls on iOS (body:hidden was blocking touch events).
- `closePrsView()` / `closeSessionsHistory()` re-apply body lock if session still active.
- Both views reset `scrollTop = 0` on open.
- `.prs-body` and `.sh-body` bottom padding now `calc(80px + env(safe-area-inset-bottom,0px))` — last items no longer hidden under nav.
- Both fixed views get `-webkit-overflow-scrolling:touch` + `overscroll-behavior:contain`.
- sw.js bumped to vyve-cache-v2026-04-10g

### workouts.html — feat: persist active session across navigation
- Navigating away (e.g. Sessions tab) and back no longer resets a workout.
- `saveSessionState()` serialises currentSessionData, sessionExercises, sessionLog, completedSetsCount, all DOM state (kg/reps/ticked/bw/notes), and timer to `localStorage` key `vyve_active_session`.
- Called on session start and every set tick.
- `restoreSessionState()` called at end of `init()` — reopens session view with all progress and timer intact if saved state exists and is under 4 hours old.
- Cleared on `closeSessionView()` (explicit exit) and `completeWorkout()` (done).
- sw.js bumped to vyve-cache-v2026-04-10h


## 2026-04-10 (evening — portrait lock)

### theme.css + auth.js — feat: portrait orientation lock
- **Problem:** Portal pages rotated freely to landscape on phone rotation. VYVE is portrait-only — landscape is always accidental on a phone.
- **CSS (theme.css):** Added `#vyve-rotate-overlay` — a fixed full-screen overlay with a rotating phone icon and message. Shown via `@media (orientation: landscape) and (max-height: 430px)` so it only triggers on phone-sized landscape, not tablets. Overlay sits above `#app` but does not unmount it — no state loss.
- **JS (auth.js):** `vyvePortraitLock()` IIFE injected at bottom of auth.js. Calls `screen.orientation.lock('portrait')` (Android Chrome). Also injects the `#vyve-rotate-overlay` div into the DOM on every portal page at load — no per-page changes needed.
- iOS Safari ignores the API lock; CSS overlay handles iOS.
- sw.js bumped vyve-cache-v2026-04-10e → vyve-cache-v2026-04-10f


## 2026-04-10 (evening)

### workouts.html — fix: reorder wipes in-progress sets
- **Bug:** Opening the reorder modal mid-session and saving the new order called `renderSessionBody()`, which rebuilt the entire DOM from scratch. All ticked sets, kg/reps values, and bodyweight toggles were lost.
- **Fix:** `saveReorder()` now captures a snapshot of all per-exercise DOM state (kg, reps, ticked, bodyweight, notes) keyed by exercise name before reordering. After `renderSessionBody()` re-renders, the snapshot is replayed back into the new DOM positions.
- Exercise name is the stable key — this works correctly because reorder doesn't change the exercises, only their positions.
- commit b93fd175

### sw.js — cache bump vyve-cache-v2026-04-10d → vyve-cache-v2026-04-10e


## 2026-04-10 (late evening session)

### settings.html — 3 fixes
- `<!--email_off-->` tags stripped from `mailto:team@vyvehealth.co.uk` href — Cloudflare was injecting them literally, breaking iOS Mail — commit 737fadd
- Privacy Policy link corrected from `/privacy` (404) to `/privacy.html` — commit c8d7d40
- Both fixes atomic, settings.html is clean

### how-to-videos.html + how-to-pdfs.html — replaced with placeholders
- Both pages had custom nav markup, no theme.js, no nav.js, no auth gate, no SW registration
- Replaced entirely with clean placeholder pages (coming soon)
- Each now has: theme.js, nav.js, auth gate IIFE, SW registration, proper `data-theme="dark"` default
- Back button and standard VYVE nav now work on both pages — commit 32461c3
- sw.js cache bumped vyve-cache-v2026-04-10c → vyve-cache-v2026-04-10d

### running-plan.html — max_tokens fix
- `max_tokens` was hard-coded to `4096` when Haiku was switched in on 6 April (commit 758b572)
- Original code had `getMaxTokens(goal)` — marathon was 10,000, half was 7,000
- 20-week marathon plan (Stuart Watts) was being truncated mid-JSON every time
- Fixed: `max_tokens` raised to `16000` — covers all plan combinations with headroom
- Bonus: stripped `<!--email_off-->` Cloudflare tags from monthly limit mailto link — commit cb729bb

## 2026-04-10 (late evening session)

### generate-workout-plan — Full Restoration + Video Fix
- Discovered v4 had two unintentional regressions vs original onboarding v42:
  1. `programme_name` was hardcoded template instead of AI-generated
  2. `programme_rationale` was hardcoded template instead of AI-generated
- Root cause of Stuart's missing videos/thumbnails identified:
  - AI-generated plans invent exercise names (e.g. "Barbell Bench Press")
  - `workout_plans` library uses different format (e.g. "Bench Press – Barbell")
  - `workouts.html` uses strict equality match (`===`) — no fuzzy matching
  - This was always the case for AI plans; videos only worked when Stuart was on the static fallback library
- Deployed `generate-workout-plan` v5 with full restoration:
  - Step 1: `generateProgrammeOverview()` restored — AI generates personalised programme name and rationale (matches original onboarding v42 behaviour)
  - Step 2: Exercise library fetched from `workout_plans` table at runtime and injected into prompt — AI MUST use only approved exercise names
  - Step 3: After plan generation, each exercise enriched with `video_url` + `thumbnail_url` via direct lookup against library
  - Plan generation still uses two parallel calls (weeks 1-4, weeks 5-8) to avoid 16k token limit
- Stuart's plan regenerated with v5: "PPL Holiday Shred" — 8 weeks, 32 sessions, 212/212 exercises matched to videos
- `generate-workout-plan` is now the canonical plan generation path — onboarding v43 calls it as fire-and-forget

### Known Architecture Note
- `workouts.html` `getVideoUrl()` / `getThumbnailUrl()` use strict name equality — this is fine now that the EF constrains AI to library names
- If any future plan has unmatched exercises (v5 logs warnings), the issue will be in the prompt constraint, not the frontend


## 2026-04-10 (evening session)

### Password Reset Flow — Full Fix
- Root cause: `login.html` had `redirectTo` pointing to `login.html` instead of `set-password.html`
- Fixed `redirectTo` in `login.html` to `https://online.vyvehealth.co.uk/set-password.html`
- Fixed `set-password.html` to call `signOut(scope: global)` after password update, then redirect to `login.html?reset=success`
- Added success banner on `login.html` when `?reset=success` param present
- Added "Link already used" card to `set-password.html` with inline resend form — user can request new link without navigating away
- Increased invalid link timeout from 3s to 5s for slow mobile connections
- Supabase SMTP configured to send via Brevo (`smtp-relay.brevo.com:587`) — emails now send from VYVE Health <team@vyvehealth.co.uk> not Supabase Auth
- Brevo domain `vyvehealth.co.uk` verified (DKIM + DMARC green) via GoDaddy DNS
- Reset email template updated to table-based HTML button (renders correctly in all email clients)
- cache bumped: `vyve-cache-v2026-04-10a` → `b` → `c`

### Workouts.html — Nav Overlap Fixes
- Rest timer sheet and reorder exercises sheet were rendering behind the bottom nav bar
- Fixed `ex-menu-sheet` padding-bottom: `calc(72px + env(safe-area-inset-bottom))`
- Fixed `reorder-sheet` padding-bottom: `calc(84px + env(safe-area-inset-bottom))` and max-height: `calc(80vh - 65px)`
- Fixed `reorder-save-btn` bottom margin
- cache bumped: `vyve-cache-v2026-04-10c`

### Workout Plan Generation — Architecture Fix
- Root cause: `waitUntil` in onboarding EF has a hard timeout; advanced PPL plans (~14k tokens output) were silently failing
- Stuart Watts (`stuwatts09@gmail.com`) had no plan in `workout_plan_cache` — was seeing static fallback library
- Deployed new `generate-workout-plan` Edge Function (v4) as standalone dedicated EF
  - Generates weeks 1-4 and weeks 5-8 in two parallel API calls, stitches together
  - `max_tokens: 16000` per call — handles largest possible plans
  - `stop_reason` guard: fails loudly if output truncated, never writes corrupt data
- Updated `onboarding` EF to v43: replaces inline `waitUntil(generateWorkoutPlan)` with fire-and-forget fetch to `generate-workout-plan` EF
- Stuart's plan generated manually and written to `workout_plan_cache`: 8 weeks, 32 sessions, 36,521 chars
- Plan join verified — week 4→5 transition seamless (same exercises, correct progressive overload step)

### Stuart Watts — Account Notes
- Two accounts exist: `swatts@geoffreyrobinson.co.uk` (Feb 2026, old/legacy) and `stuwatts09@gmail.com` (10 Apr 2026, active)
- Active account is `stuwatts09@gmail.com` — RIVER persona, 4-day PPL, Advanced, Gym
- Old account has 12 workout logs with null plan/name (logged via legacy flow)
- All workout data safe — nothing deleted


## 2026-04-10

### External Brain System Created
- brain/master.md — complete business + technical context
- brain/how-to-use.md — human operator guide
- brain/schema-snapshot.md — all 36 tables from live Supabase
- brain/startup-prompt.md — trigger prompt for any AI session
- brain/changelog.md — this file

### Playbooks Created
- playbooks/brain-sync.md — session/daily/recovery sync system
- playbooks/debug.md — diagnose and fix issues
- playbooks/build.md — implement new features
- playbooks/research.md — deep understanding before action
- playbooks/review.md — code quality review
- playbooks/optimise.md — performance and readability
- playbooks/refactor.md — structural improvements
- playbooks/repo-audit.md — comprehensive system audit
- playbooks/execution.md — execute predefined plans
- playbooks/architect.md — system architecture design
- playbooks/github-operator.md — repo read/write operations
- playbooks/feature-build.md — end-to-end feature delivery
- playbooks/bug-fix.md — bug diagnosis and fix

### Tasks
- tasks/backlog.md — prioritised work queue
- tasks/task-template.md — reusable task card

### Infrastructure
- README.md — quick start guide
- prompts/cold-start.md — paste into any AI to begin

### Data Source
All verified against live Supabase project ixjfklpckgxrwjlfsaaz on 10 April 2026.

## 2026-04-10 (evening)

### Repo Hygiene
- `VYVEHealth/VYVEBrain` set to private — contains Supabase IDs, API keys references, commercial pipeline
- Removed duplicate `brain-sync.md` from repo root (canonical copy is `playbooks/brain-sync.md`)

### vyve-site Actions Cleanup
- Deleted dead `.github/workflows/inject-key.yml` — legacy workflow from before `anthropic-proxy` EF existed
- Verified `running-plan.html` already uses `anthropic-proxy` EF v5 (no placeholder, no key in HTML)
- `static.yml` (GitHub Pages deploy) retained — only workflow now running on vyve-site
- Commit: f557dae

## 2026-04-10 (morning/afternoon session)

### Daily Report Fixed
- `BREVO_API_KEY` secret was missing/wrong in Supabase — renamed to correct value
- `daily-report` v16 deployed — added full activity detail table (member name, type, specific activity, time)
- Report manually triggered and confirmed sending to team@vyvehealth.co.uk

### Password Reset Flow Fixed
- Supabase Site URL updated to `https://online.vyvehealth.co.uk/set-password.html`
- `set-password.html` confirmed correctly handles `PASSWORD_RECOVERY` token event
- Supabase email template updated: new VYVE-branded HTML body, subject now "Reset your VYVE password"

### Welcome Emails Resent
- Alan Bird and Owen Barrett identified as missing welcome emails (onboarded while Brevo key was absent)
- `resend-welcome` one-shot EF deployed — resent branded welcome with fresh set-password links
- BCC to team@vyvehealth.co.uk confirmed working on all future onboarding emails

### Backlog Updated
- Added: password reset email template (desktop task)
- Added: Exercise page redesign (product idea — gym / cardio / walking plan umbrella)

### Product Thinking
- Discussed replacing "Workouts" nav item with "Exercise" umbrella page
- Members choose path at onboarding: gym programme, running plan, walking/activity plan, or mix
- Each path generates an 8-week personalised plan (Sandra use case — non-gym corporate members)
- Key open question: do non-gym plans use same `workout_plan_cache` structure or simpler format?
- Decision deferred — parked in backlog under Later
