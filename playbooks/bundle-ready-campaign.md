# Bundle-Ready Campaign

**Launched:** 21 May 2026 (PM-184).
**Supersedes:** Premium Feel Campaign (PF-1 through PF-40). PF-1 through PF-15 + PF-30 remain SHIPPED. PF-16 through PF-29 fold into the phases below. PF-40 formally closed — its remaining sub-items (40.3 through 40.12) absorbed into Phases 4–5 here.
**Target ship:** 31 May 2026, OR honest slip.
**Goal:** Ship a bundled iOS + Android app that members can use offline on the tube, on a flight, in a hospital basement. Bundled shell + Dexie data + Capawesome OTA = a wedge no competitor in the UK workplace wellbeing space has.

---

## Why this campaign exists

The April–May 2026 work shipped real architecture: Capacitor bundled mode (iOS 1.3 / Android 1.0.3 via PM-115/116), Capawesome OTA pipeline, Dexie + sync + bus, optimistic-first §23.39 skeleton, fat-row hydrate. The Mind section v1 (PM-173 through PM-183) was the first feature built end-to-end on that stack — and it works.

But the rest of the app was built before the architecture stabilised. Body section pages (workouts, cardio, movement, exercise) exist but were not designed around the pillar model. Connect section doesn't exist yet — leaderboard + sessions + charity live as standalone pages with no unifying hub. Home page still presents the old certificate-track model. Engagement page Variety component still scores per-activity-type, not per-pillar. Weekly/monthly check-ins don't surface Mind activity at all.

Bundling the app today would ship an inconsistent surface: a polished Mind section, a half-pillared Body section, no Connect section, an old-shape Home. Members would see the seams. Worse: bundling locks the shape into the IPA — anything wrong gets fixed only on the next OTA, which means "wrong shape" stays in front of every member who hasn't opened the app for a while.

This campaign builds the consistent surface — Mind, Body, Connect — verifies it's truly offline-first across every page, then bundles.

---

## Architectural commitment (IMMUTABLE — inherited from PM-77 / PM-106)

Restated here so this playbook is self-contained:

- VYVE is a Capacitor-wrapped native iOS+Android app with web fallback at online.vyvehealth.co.uk. **Not a PWA.**
- **Dexie is the source of truth for everything the app reads.** Network is for sync, for honestly-network-bound surfaces (§23.10), and for non-current-programme assets fetched on view.
- **First-login is the long load**, masked by the consent gate and persona-led walkthrough. Subsequent opens are instant from Dexie.
- **Writes go Dexie-first** via the §23.39 optimistic-first skeleton: Dexie upsert sync, bus publish, un-awaited POST, 4xx revert, network-throw enqueue to `_sync_queue`.
- **Single-device-per-user is the working assumption.** Last-write-wins for any conflicts. Multi-device cross-sync is post-launch.
- **Supabase remains** the sync target, the cross-device propagation layer via Realtime, the server-side compute layer for AI generation + cron-driven achievements/certificates + leaderboards + employer aggregate reporting. **It is not the rendering source.**

---

## The six phases

### Phase 0 — Mind section v1 user-visible
**Status:** SHIPPED 20 May 2026 (PM-173 → PM-183).

All six user-visible Mind pages live behind §23.39:
- breathwork.html (PM-174, music PM-177, countdown PM-181)
- journal.html (PM-175, in-page history PM-179)
- affirmations.html (PM-176, v2 PM-178)
- meditation.html, sleep.html, visualisation.html (PM-180, YouTube embed bridge + PM-182 thumbnails)
- mind.html hub (PM-183)

**Outstanding:**
- ElevenLabs/Calum real audio swap for meditation/sleep/visualisation (post-launch, the YouTube bridge buys ~1 week)
- Lewis copy review pass on affirmations/journal/breathwork seed content (`COPY_LEWIS_REVIEW` tags throughout)

These are not Phase 0 blockers — the YouTube bridge is shippable to members as-is.

---

### Phase 1 — Body section consolidation
**Goal:** Body hub `body.html` proper landing page mirroring `mind.html` shape: Today's focus + Day streak + Today's progress, but for Workouts / Cardio / Movement.

**The shape:**
- Today's focus card — daily rotation across the member's assigned programme's exercises (or a curated mixed pool if not yet onboarded). Uses the same `djb2(memberEmail|todayStr) % N` algorithm as `mind.html`. Tap opens the relevant page.
- Day streak — distinct `body_activities.activity_date` consecutive days across all kinds (workouts + cardio + movement). One-day grace, 30-day ceiling. Same algorithm as mind.html.
- Today's progress — count of today's body activity rows, display capped per the new pillar-Variety cap.

**Sub-tasks:**
- Create `body_activities` table in Supabase (mirror of `mind_activities` shape: `kind` discriminator across workouts/cardio/movement, `ref_id`, `activity_date`, `client_id`, `duration_seconds`). Migration in same atomic commit as the page wires.
- OR: virtual rollup view across existing `workouts` + `cardio` + (movement tables) that mind-hub-style queries can hit. Decide based on what's cleaner — Dean prefers tables not views per recent pattern, so `body_activities` table is the default unless that fails an audit.
- Wire `body.html` against the table.
- Audit each sub-page (workouts.html, cardio.html, movement.html, exercise.html) to confirm Dexie-first reads + §23.39 writes. PF-7, PF-9, PM-154–157, PM-166–170 have shipped Dexie-first reads on these pages; this phase is consolidation, not re-build.
- 30s engagement gate where appropriate (probably not — workouts have explicit completion, cardio has explicit save).

**Exit criterion:** Body hub paints from Dexie in <200ms cold-load. Every Body sub-page renders real member data from Dexie. Every Body write surface uses §23.39 with `client_id` idempotency.

**Estimated:** 2–3 sessions.

---

### Phase 2 — Connect section build
**Goal:** Connect hub `connect.html` (NEW), unifying leaderboard + sessions + charity impact + (optionally) social feed.

**The shape:**
- Charity impact hero — "Your team has donated X months. Y months until the next donation." Replaces nothing currently — this surface is buried in the home page right now.
- Today's session card — next scheduled live session for today, with countdown. Tap opens sessions.html.
- Leaderboard preview card — member's current rank in their default scope (All members / Company / Team). Tap opens leaderboard.html.
- Day streak — count of distinct days the member has engaged with a Connect surface (viewed a session, opened leaderboard, etc.). Algorithm reusable.

**Sub-tasks:**
- Create `connect.html` from scratch — base shape lifted from `mind.html` / `body.html`.
- Audit sessions.html, leaderboard.html for Dexie-first reads. Sessions schedule = catalogue table, hydrates with the rest. Leaderboard = §23.10 carve-out (cross-member aggregate, fetched online, designed offline state).
- Charity impact data — currently computed via `get_charity_total()` SQL function. Verify the Dexie-cached version on home page is wired correctly; if not, this is the moment to fix.
- Sessions Realtime subscription for live chat already exists — verify it gracefully no-ops offline.

**Exit criterion:** Connect hub paints from Dexie + designed offline state for leaderboard / live chat. Every Connect surface degrades honestly when offline (§23.10 compliant).

**Estimated:** 2–3 sessions.

---

### Phase 3 — Pillar realignment
**Goal:** Home / Engagement / Weekly check-in / Monthly check-in / Certificates all reflect the Mind / Body / Connect pillar model.

**Sub-tasks:**

- **Home page rewrite (index.html).** Replace certificate-track cards with three pillar tiles (Mind, Body, Connect) showing Today's progress per pillar. Activity Score Ring retained but Variety component reframes (see next bullet). PM-73 home redesign mockup (`playbooks/home-redesign-v2-mockup.html`) is a starting reference but the pillar reframe likely changes the shape — review and update.

- **Engagement page rewrite (engagement.html).** Variety component (currently scores per-activity-type: habits, workouts, cardio, sessions, check-ins) reframes to per-pillar coverage: Mind, Body, Connect. Each pillar contributes up to 4.17 points (12.5 / 3) to the Variety score. Score methodology section updated. Activity Breakdown table reorganises around pillars.

- **Weekly check-in rewrite (wellbeing-checkin.html + EF v29).** Activity summary now rolls up Mind + Body + Connect activities, not raw counts. AI prompt to Anthropic includes pillar-coverage data. Slider questions updated per Lewis (this was an open decision pre-audit; resolved here as part of the pillar pass).

- **Monthly check-in rewrite (monthly-checkin.html + EF v18).** Same as weekly.

- **Certificates re-pillaring.** Current 5 tracks (Architect = Habits, Warrior = Workouts, Relentless = Cardio, Elite = Check-ins, Explorer = Sessions) reorganise around Mind / Body / Connect. Three pillar certificates instead of five activity certificates. Existing earned certificates grandfather under the old model — only NEW certificates earned post-launch use the new model. Database migration writes a `pillar` column to `certificates`; old rows get `pillar = 'legacy'`. Lewis sign-off on the three new pillar certificate titles + tier copy.

**Exit criterion:** Every member-facing surface that previously framed around activity types now frames around pillars. No mixed messaging.

**Estimated:** 3–4 sessions (likely the heaviest phase).

---

### Phase 4 — Offline-correctness sweep (PRE-BUNDLE GATE)
**Goal:** Verify every page is truly offline-first before locking the IPA shape.

This phase produces a populated `playbooks/offline-correctness-audit.md` — the per-page audit table — and fixes anything it surfaces.

**Sub-tasks:**

- **Schema audit:** every member-data Supabase table has `updated_at TIMESTAMPTZ` with `BEFORE UPDATE` trigger. Enumerate via `pg_trigger`, add where missing. One-shot migration.

- **Idempotency audit:** every write surface generates `client_id` client-side at write time. Server respects it as a dedupe key. Mind activities do this; verify workouts, cardio, exercise_logs, weight_logs, custom_workouts, exercise_swaps. Add where missing.

- **Page-by-page airplane-mode walk:** dev-iPhone with `server.url` disabled and network killed at OS level. Open every page in order. Record render behaviour (renders / spinner / empty / broken). Anything broken or empty becomes a P0 fix.

- **Cold-start-no-network UX:** login screen detects no-connection state and shows honest message ("VYVE needs internet for first sign-in. After that, the app works offline.").

- **Fan-out-on-focus pattern:** Capacitor `App.addListener('appStateChange')` triggers incremental delta-pull when app returns to foreground. Per-table `last_sync_timestamp` stored in Dexie `_sync_meta`. `where updated_at > [last_sync_timestamp]`.

- **`_sync_queue` drain hardening:** drainer wakes on app launch, drains pending writes before letting user create new ones, handles ordering, resilient to individual row failures.

**Exit criterion:** Airplane-mode walk passes on every page. Schema audit clean. Idempotency audit clean. Drain handles a 2-week-offline queue cleanly in test.

**Estimated:** 2–3 sessions including the walk + any fixes surfaced.

---

### Phase 5 — Bundle and OTA
**Goal:** Ship to members.

**Sub-tasks (already queued in backlog as the three PM-178-followup tasks):**

- Port PM-178 `hotfix/programme-render-shape` to main (two-file patch, sw.js cache bump).
- Sweep main for unship-ready in-progress work. Phases 1–4 work should account for most of this — the sweep is the final gate.
- First-ever OTA push to Capawesome production channel:
  ```
  cd ~/Projects/vyve-capacitor
  mv www www.bak-pre-ota-$(date +%Y%m%d-%H%M%S)
  mkdir www
  curl -L -H "Authorization: token <PAT>" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/VYVEHealth/vyve-site/tarball/<merged-SHA>" \
    -o /tmp/vyve-site-ota.tar.gz
  tar -xzf /tmp/vyve-site-ota.tar.gz -C www --strip-components=1

  grep -c "HOTFIX (programme-render-shape)" www/exercise.html www/workouts-programme.js

  npx @capawesome/cli apps:bundles:create \
    --app-id f9961f66-eb66-4102-b1c5-f9b2c7baeebf \
    --channel 89e12796-aa41-4176-8d78-bc2ef6dfd5c2 \
    --path www
  ```
- Consider `--rollout 0.1` for safety on first-ever OTA. Roll to 100% after 24h of clean telemetry.

**Exit criterion:** OTA bundle live on production channel. Telemetry shows members updating cleanly. No P0 regressions in the first 48 hours.

**Estimated:** 1 session.

---

### Phase 6 — External-blocker items (off the critical path)
These are tracked but not gating. They have their own owners and timelines.

- **HAVEN clinical sign-off** (Phil). Auto-assignment currently active in production. Decide whether to pause until sign-off or accelerate Phil's review. Conor Warren is on HAVEN since 15 April — has the member had any concerning interactions? Worth pulling logs as part of Phil's review.
- **Weekly check-in nudge copy split** (Phil + Lewis). First-time activation vs continuity. Mental-health-adjacent — gated on Phil.
- **PF-13 hydration COPY_TABLE finalisation** (Dean writes, Lewis spot-check). 23 entries tagged `COPY_DEAN_FINAL` in `/hydration.js`. ~30–45 min.
- **Brevo logo removal** (~$12/month addon). Lewis to action before any enterprise demo.
- **Facebook Make connection refresh** — expires 22 May 2026. Lewis to action — this is urgent (today or tomorrow).
- **Public launch comms draft** (Lewis).
- **B2B volume tier definition** (Lewis + Dean) — define formally before first enterprise contract.
- **Lewis copy review** on affirmations / journal / breathwork seed content (Mind v1 carryover).

---

## What drops off the radar entirely

These were live items pre-audit. Confirmed deferred / dropped:

- **Layer 6 SPA shell** — dropped. Local-first delivers the perceived speed; SPA shell is no longer worth the rewrite.
- **PM-71 / PM-71b dashboard payload trim** — obsolete. Post-bundle the `member-dashboard` EF gets called rarely; trimming its payload is no longer load-bearing.
- **PM-72 materialise `achievement_progress`** — obsolete for the same reason.
- **Backend EF perf work for the home payload (§23.5.1)** — obsolete for the same reason. The 17s cold / 7s warm latency was the dominant perf bottleneck *because* the page rendering blocked on it; post-bundle, Dexie-first paint renders in <200ms regardless of EF latency.
- **PWA install prompt code in index.html** — legacy, slated for removal in Phase 1 or earlier.
- **In-App Tour (PF-23)** — explicitly V2 per active.md §5. Builds on Achievements which are post-trial overhaul. Do not work on before launch.
- **Achievements system major overhaul** — post-trial, do not work on before launch.

---

## Operating mode (inherited from PM-77 / PM-106)

- **Claude leads, Dean drives.** Default for technical decisions: Claude decides and moves forward, Dean retains veto.
- **Single atomic commit per session** to VYVEBrain. Master / active / changelog / backlog / playbooks all move together.
- **§23.41 pre-commit SHA refresh** is mandatory. Parallel sessions exist; refresh before write or clobber risk.
- **§23.42 production reach** — main HEAD does not reach members until the next OTA bundle is pushed via Capawesome. Dean's dev iPhone (server.url loop) sees changes immediately; members do not.
- **§23.39 optimistic-first** is the canonical write pattern for all new feature work.

---

## Status at PM-184 commit (21 May 2026)

- **Phase 0:** SHIPPED.
- **Phase 1:** NOT STARTED. Next ship after this brain commit.
- **Phase 2:** NOT STARTED.
- **Phase 3:** NOT STARTED.
- **Phase 4:** NOT STARTED. Audit framework scoped in `playbooks/offline-correctness-audit.md` (NEW this commit).
- **Phase 5:** NOT STARTED. Three tasks queued in backlog from PM-178.
- **Phase 6:** OPEN ITEMS (per-item status above).

**Next session pickup:** Phase 1 — Body section consolidation. Decide `body_activities` table shape, ship migration + body.html + sub-page audit pass.
