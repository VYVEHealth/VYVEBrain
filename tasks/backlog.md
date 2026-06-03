## Live content go-live (added 2026-06-02, PM-437)

### NEXT — live content go-live (PM-439, 2026-06-02) — continue here
- [ ] Dean: run `~/vyve_rename.py` then `--go`; paste fresh VYVE LIVES `ls`.
- [ ] Map schedule titles -> real filenames; generate calendar_occurrences rows (rebuilds 192 placeholders): daily-strand rotations + one-off talk placements; fill notes(filename)/session_title/host_name/host_role/session_description.
- [ ] `*-live.html` YouTube broadcast-status probe (override clock-only LIVE gate) — go-live blocker.
- [ ] Token-health monitor: daily pg_net refresh probe -> Brevo alert to team@ on invalid_grant.
- [ ] Stand up the always-on box; place vyve-live-runner.py; turn OFF session-publish hourly cron once box owns creation.
- [ ] 3 missing talk videos: "Why I Founded VYVE", "Doing Hard Things", "Not Drinking Alcohol".
- [ ] Place vyve-live-runner.py into a repo (currently only in a session output) — not yet version-controlled.


- [ ] Resolve a category RTMP ingest+key live via YouTube Data API liveStreams.list(part=cdn) (Yoga/Pilates & Stretch first).
- [ ] ONE test simulated-live push from Dean's Mac -> confirm session-publish binds broadcast + playlistItems.insert + replay appears.
- [ ] Seed Replays: upload back-catalogue (53 Movement -> Yoga/Pilates & Stretch playlist, 21 Mind -> Mindfulness & Mindset playlist) so Replays is populated for sales now.
- [ ] Stand up always-on ~GBP4/mo box (Dean creates/pays; Claude configures); get riverside_ masters onto it once.
- [ ] Wrap simulated-live-worker.py into a multi-session scheduler reading calendar_occurrences.
- [ ] Wire the 30-day calendar into calendar_occurrences (map readable titles -> riverside_ filenames).
- [ ] BLOCKED: Suicide and Men airing -> Phil clinical sign-off + crisis signposting (§23.84).
- [ ] PENDING: 6th Lewis video; morning_stillness classification.

## Trial / membership (added 2026-06-03, PM-438)

- [ ] DEAN (Stripe dashboard, closes the loop): register webhook endpoint `https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/stripe-webhook` (events `checkout.session.completed` + `customer.subscription.deleted`) and set its signing secret as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Functions secrets. Until set, payments succeed but membership won't flip (webhook fails safe).
- [ ] DEAN: confirm "Allow promotion codes" stays ON for the conversion Payment Link (`bJeeVe0Cs1Em53D5oh93y01`) else £20 is charged instead of £10.
- [ ] Read-path EF enforcement: add the membership gate to `member-dashboard` (and any other read EFs) so an expired member can't pull data even if the client gate is bypassed. Deferred at PM-438 (write-guard + client gate judged sufficient for trial; core EFs are 400+ lines, hand-redeploy = transcription risk).
- [ ] Extend the write-guard (`assert_member_not_expired`) beyond daily_habits/workouts/cardio/session_views to: mind_activities, movement_activities, connect_checkins, wellbeing_checkins, monthly_checkins.
- [ ] Web "Start free trial" sign-up flow (inverts the current pay-first signup) — NOT built (was step 6). Needed before public trial marketing.
- [ ] `continue.html` no-`cid` path = manual reconcile (rare; member reaches checkout without a bound id). Decide auto-handling later.
- [ ] GITHUB_PAT_CLAUDE expires 20 Jun 2026 — rotate before expiry (Vault `GITHUB_PAT_CLAUDE` on project ixjfklpckgxrwjlfsaaz).

# VYVE Health — Backlog

Last triage: 2026-05-26 (Chat 3 of brain overhaul). Recomposed from ~5,923 lines / 206 headings / 480 sub-headings of chronological journal into surface-bucketed live items. SHIPPED blocks dropped against changelog. Stale "Added" items pre-14 May dropped per triage rule. Bus-campaign chronicle (PM-30 → PM-65, 08–11 May) dropped — all shipped, surface state in master §19.

## NEXT FOCUS — Movement V2 CLOSED (28 May). Pick next from queued items below (PM-308 cardio walking removal, Achievements post-trial overhaul, In-App Tour, Layer 2 Realtime bridge).

**Movement V2 is member-reachable.** Step 4a-pre-2, 4a-page (Chunk B render scaffolds), 4b (multi-active-by-surface), and the plan-picker all SHIPPED 27-28 May (see changelog). Live flow: Body → Movement → State 5 "Start a movement programme" → `movement-plans.html` picker → pick Just Steps / Foundation / Distance Builder → set target → Start → movement.html renders step ring + week card. Members can hold a workouts plan AND a movement plan concurrently.

**SHIPPED 28 May:** PM-420 4c — Today's Movement card (`dc1108c5`), Sport pill (`f6aa4131`), Add Activity modal (`eaaf8683`). PM-420 4d — plan-fit nudge: `evaluate_plan_fit()` SQL-function cron (`vyve-evaluate-plan-fit` 04:00 UTC, jobid 32) + gold banner + carryover modal (`ec8bcffa`). All member-facing surfaces + the cron done. **PM-425..431 (28 May) closed the rest: Movement V2 is ~100% functionally complete.**

**Movement V2 — DONE (PM-425..431, 28 May):**
- ⚠️ **Dexie wpc PK→id bump (PM-425 `fb5e91e9`) — REVERTED PM-436 (`e44b2357`)** — re-keying the existing store jammed the iOS upgrade → noop shim → blank rings/habits/progress on every v21 device (§23.83). Reverted to `member_email` PK. Multi-plan-local mirror deferred; re-do via a NEW id-keyed store + device test (Option B, below), never re-key.
- ✅ **Picker → portal standard + instant start (PM-426 `030bab25`, PM-427 `a6c6b431`)** — theme.css/nav.js/cache-first paint; `startPlan` mirrors the new active row into Dexie so the home page reflects the switch instantly; Just Steps start fixed (`plan_duration_weeks` NOT NULL → sentinel `0`).
- ✅ **Render all plan shapes (PM-429 `74e3cb6d`, PM-431 `326532d4`)** — `renderPlan` routes any sessionless movement plan to the state layer; was bailing to no-plan for Just Steps then locked_ramp (§23.81 hard rule). prog-card names locked-ramp plans.
- ✅ **Live baseline recompute (PM-428 `7d2bc123`)** — `recompute_step_baselines()` SQL fn + cron jobid 33 (04:10 UTC); picker slider ceiling/default fixed. Modal opacity + editable Just Steps target (PM-430 `ee9ba078`).
- Post-trial backlog (not blocking): Return to Movement plan still INACTIVE pending Phil clinical sign-off; prompt-pool copy is Claude placeholder pending Lewis sign-off; Achievements-style UI polish pass on the movement ring.

**Movement V2 state matrix reference** (`<body data-mv-state="N">` on movement.html): 1=structured+HK, 2=structured+no-HK, 3=Just Steps+HK, 4=Just Steps+no-HK, 5=no plan. CSS-only show/hide off the body attr. Branch on `programme_json.surface==='movement'` (NOT category — spec drift, see changelog). plan_type values are `just_steps` / `locked_ramp`.

**Original Thursday pickup paragraph (still valid background):** Two binaries are with the platforms. iOS 1.4 build 3 sitting "Waiting for Review" in App Store Connect (auto-release on approval, 24–48hr expected). Android 1.0.5 versionCode 50 — needs confirmation Dean clicked "Send 1 change for review" from Play Console publishing overview (Pending #1 below). Assume approved by the time the next session opens; otherwise unblock by clicking through.

The session-opening question is the architectural decision PM-411 Item 1 Bug 3 / PM-413 Pending #5 left unresolved: capacitor.config.json is hybrid dev-loop + LiveUpdate today. Members on iOS 1.4 / Android 1.0.5 will be dev-loop mode, not bundled, contradicting §23.42. Real call between (a) proper bundled mode with @capawesome/capacitor-live-update on the prod channel, (b) accept dev-loop for trial cohort, (c) other. Talk-first; this drives the Mac-local sync work below.

Once doctrine is locked, do the Mac-local audit and selective commit per PM-413 Pending #2 — diff `~/Projects/vyve-capacitor` against remote `7a54c876`, curate legitimate ship-state changes (capacitor.config.json, build.gradle 1.0.5/code 50, Info.plist iPad orientation restore, package.json + lockfiles for @capawesome/capacitor-live-update@8.2.2, Android #0D2B2B background, regenerated mipmaps, Xcode/SPM lockfiles), atomic-commit. While there, knock out the small ones: .gitignore `www/` entry per the vyve-capacitor-mac-sync playbook (PM-413 Pending #4), Mac-local junk cleanup (literal `.git`/`.github` files + 7 .bak files at vyve-capacitor root, PM-413 Pending #3), and the keystore + password `Weareinthis2026!` into 1Password (P0 launch blocker — if Dean's Mac is wiped before keystore + password are co-located, the Android app is un-shippable for the lifetime of `co.uk.vyvehealth.app`).

Then PM-411 Bug B — the surgical 30–45min one. Workout selection doesn't update until reload. PF-7 Dexie stale-read race in `workouts-programme.js` L78–89. activateProgramme correctly clears cache + nulls programmeData + cacheRow + calls loadProgramme, but loadProgramme's Dexie-first path calls criticalHydrate un-awaited then reads Dexie immediately — Dexie still has the OLD plan because sync hasn't propagated. Single-file fix: await criticalHydrate, OR skip Dexie on cache-bust contexts, OR invalidate Dexie row before reading.

Post-binary the canonical NEXT pointer is the second pass of "in-app feature completeness" from PM-401.b: monthly check-in credit gap (real bug, members get zero credit today — see Infra / Data bucket), then certificates → leaderboard parity, then Your Journey scope decision (design talk before build). Bug A architectural (movement plan structurally homeless, 4-6h) sequences after trial data lands. Bug C (Browse Library runtime error) needs device console — schedule when Dean's at a Mac.

## PARKED — PM-411 — Body-hub overhaul Bug A/B/C

(Item 1 Bundle-prep CLOSED in PM-413. Item 2 + schema-architecture note preserved verbatim below.)

Surfaced during deanonbrown2@gmail.com end-to-end onboarding walk this session.

**Bug A — Architectural (4-6h, post-trial)**: Movement plan structurally homeless. exercise.html hero CTA L350 hardcoded `href="workouts.html"` ignoring programme category. Every workout_plan_cache row has `category: null` — no branching surface exists. Fix needs:
- programme_library category backfill
- Onboarding EF v37 writes category into workout_plan_cache
- exercise.html branches: `category === 'movement'` → movement.html, else → workouts.html
- movement.html consumes + displays programme card at top (currently only has session-logging pills + Mark as Done button)

Note: movement.html L440-486 already filters `category === 'movement'` — it's READY to consume categorised plans, nothing's writing them.

**Bug B — Surgical (30-45min, Thursday)**: Workout selection doesn't update until reload. PF-7 Dexie stale-read race in workouts-programme.js L78-89. activateProgramme flow correctly clears cache + nulls programmeData + cacheRow + calls loadProgramme, but loadProgramme's Dexie-first path calls criticalHydrate UN-AWAITED then reads Dexie immediately — Dexie still has OLD plan because sync hasn't propagated. Single-file fix: await criticalHydrate, OR skip Dexie on cache-bust contexts, OR invalidate Dexie row before reading.

**Bug C — Surgical (30-60min, needs device console)**: Browse Library tab broken at runtime. Static check clean — switchTab + loadLibrary + DOM + RLS + 30 programmes + CATEGORY_LABELS + loadPausedPlans all present. Failure is runtime JS error swallowed by outer try/catch. Candidates: getJWT undefined for new accounts, VYVEData API drift, async error in renderLibrary first-paint.

### Schema-architecture note (banked, not codifying solo)

`workout_plan_cache` has TWO contradictory UNIQUE indexes:
- `workout_plan_cache_member_email_key` UNIQUE on `(member_email)` — blocks multi-row
- `workout_plan_cache_one_active_per_member` UNIQUE on `(member_email) WHERE is_active=true` — assumes multi-row design

workout-library EF v13 paused-plan logic at L60-84 likely never works correctly — upserts at L98-110 `onConflict: 'member_email'` silently overwrite the previous plan due to the broader UNIQUE constraint. Empirically confirmed on test account: 1 row only, no paused Movement preserved after swap to Strength. Promotes to §23 on second contradictory-UNIQUE occurrence.

## PM-420 — Movement V2 build (PM-418 was the spec lock; PM-419 collided on Focus card fix)

**Spec locked PM-418, 27 May 2026.** Full design captured in `playbooks/movement-v2-spec.md`. Build chats read playbook once and execute — no design re-derivation needed.

**Scope.** Closes PM-411 Bug A (movement plan structurally homeless — category backfill + branching) and goes well beyond it. Adds the four-plan library (Just Steps / Foundation / Distance Builder / Return to Movement), state-aware `movement.html` (5 render variants), HK history pull at consent (90-day baseline via Capgo `queryAggregated`), plan-fit nudge intelligence, manual-step support for non-HK members, and full ecosystem wire (bus + Supabase + 10-surface completeness test).

**New §23 hard rules:** §23.78 (PM-420 step 4a-pre-1) — CHECK constraint write-surface audit before adding to pre-existing tables (earned the hard way via the production movement quick-log outage). The engagement-aggregator triple-occurrence rule originally slated as §23.78 — every new activity table requires touching SQL function + JS twin + dirty-mark trigger + tile renderers + charity reconcile + 10-surface completeness test — still needs its own number; will land as §23.79 when codified.

**Build sequence (7 steps, ~6-7 Claude-assisted sessions):**

1. ✅ **SHIPPED PM-419** — `programme_library.surface` column added (CHECK in `workouts` / `movement`), backfilled `workout_plan_cache.programme_json.surface` from existing plan_type. Onboarding EF v85 stamps surface. Naming: used `surface` not `category` (overrode playbook).
2. ✅ **SHIPPED PM-420 step 2** — Four movement plans seeded into `programme_library`: Just Steps (active), Sedentary Reset Foundation (active), Distance Builder (active), Return to Movement (INACTIVE pending Phil clinical sign-off). Prompt copy is Claude-drafted placeholder pending Lewis sign-off.
3. ✅ **SHIPPED PM-420 step 3** — HK 90-day baseline history pull at consent. EF `pull-baseline-steps` v1 deployed (verify_jwt:true). `healthbridge.js` v0.7→v0.8 with `pullBaselineHistory()` runs 3×30-day Capgo windows, fire-and-forget from `connect()`. Members get `baseline_steps_p50/p25/p75` + `baseline_source` + `baseline_activity_band` stamped in 2-3s post-Allow.
4. **IN PROGRESS PM-420 step 4a-pre-1** ✅ + **step 4a-pre-2** PARTIAL:
   - ✅ `movement_activities` extended (7 new columns: display_name, manual_steps, counts_for_charity, hk_native_uuid, hk_promoted_to, prompt_kind, metadata JSONB)
   - ✅ Source CHECK loosened to accept legacy 'manual' + new vocabulary (hot-fix from §23.78 trap — see master.md)
   - ✅ `manual_step_estimates` new table with RLS + email-lc trigger
   - ✅ Onboarding EF v86 deployed (deactivate-old + insert-new pattern, replaces upsert-via-on_conflict)
   - ❌ PENDING: `workouts-session.js` line 850 site patch (`&is_active=eq.true` filter add) — staged at `/home/claude/site/staging/`
   - ❌ PENDING: drop `workout_plan_cache_member_email_key` migration (full unique on member_email)
   - ❌ PENDING: `movement.html` V2 page build (the big mockup → production translation, est ~2 sessions)
5. Plan-picker page with smart sort by baseline fit + Just Steps slider with safeguards (1.3× warning, 1.5× cap) + adaptive toggle (~1 session) — folds into 4a-page since picker IS one of the 5 render variants
6. `evaluate-plan-fit` daily cron at 04:00 UTC + nudge banner UI + plan-up acceptance flow preserving streak + certificate state. Plan-down is NOT automatic — Phil-shaped human check-in only (~1 session)
7. Wire & subscribers audit per §23.78 (engagement aggregator triple-occurrence rule, not the new §23.78 CHECK-audit rule) — repo-wide grep for `movement:*` / `body:*` / `movement_activities` / `workout_plan_cache` / `baseline_steps_p50` subscribers, update SQL function + JS twin (`compute_engagement_components_v2` + `computeEngagementComponentsV2`), update `v_active_days`, add dirty-mark triggers on new tables, update charity reconcile (`charity_total_reconcile_and_heal()`), run 10-surface completeness test (~0.5-1 session). Also: `movement.html` quick-log writes should switch source literal `'manual'` → `'manual_log'` so the loose CHECK can be tightened back.

**Phil sign-off gates before ship:**
- Return to Movement plan content (audience overlaps post-injury / post-pregnancy)
- Just Steps slider max caps (especially Return to Movement plan max)
- Plan-fit nudge copy variants for each source plan
- HK consent disclosure copy addition

**Lewis copy gates:**
- 5 Today's Movement prompt text lines (one sentence each, generic — no curated content)
- 4 plan descriptions (library cards)
- Plan-fit nudge copy variants per source plan

**Out of scope for v1** (documented in playbook §13): Office Worker Mobility as distinct plan (folded into Foundation), automatic plan-down, adaptive bumps for manual-estimate members, curated mobility video content (post-trial), Android Health Connect (parked until device), real-time plan-fit evaluation (cron-driven correct starting shape).

**Mockup ship target:** `/mnt/user-data/outputs/movement-v1-final-spec.html` from the PM-418 session — source of truth for visual design. Playbook source of truth for logic.

**Dependencies:**
- Sequenced AFTER PM-413 (iOS 1.4 / Android 1.0.5 store approval) — trial cohort first
- Sequenced AFTER PM-411 Bug B (workout-library Dexie stale-read race) — Thursday-grade surgical fix
- Reads playbook `playbooks/movement-v2-spec.md` as single-read spec reference

## PARKED — Original PM-411 carry-over notes preserved

## Pre-bundle / app store (PM-413 follow-ups)

**Play Console final click (P0, confirm next session).** Confirm `In review` not `Draft` on play.google.com/console for VYVE Health Android. If still `Draft`, click `Send 1 change for review` from publishing overview.

**vyve-capacitor remote sync (P0 Thursday).** Mac local diff against remote `7a54c876` and atomic-commit per playbook — full file list in NEXT FOCUS above. Per the vyve-capacitor-mac-sync playbook, run BEFORE any new native edits to avoid layering more uncommitted state.

**capacitor.config.json doctrine — UNRESOLVED.** Mac local config is hybrid (`server.url` → `online.vyvehealth.co.uk` AND has LiveUpdate plugin block). Members on 1.4/1.0.5 will be dev-loop mode when iOS/Play Store approves. Contradicts §23.42. Three options (a) proper bundled mode with `@capawesome/capacitor-live-update` (app `f9961f66-eb66-4102-b1c5-f9b2c7baeebf`, prod channel `89e12796`), (b) dev-loop for trial cohort accepting network dependency, (c) other. Reference PM-411 Item 1 Bug 3 / PM-413 Pending #5.

**Mac local junk cleanup (P3).** `--exclude=.git` + `--exclude=.github` literal files (typo from earlier session) + 7 `.bak-pf14b` / `.bak2` / `.bak3` / `.bundled-backup` files at vyve-capacitor repo root. Tidy-up, not a blocker.

**`.gitignore` `www/` entry per playbook (P1).** Currently `www/` is rsync'd in from vyve-site but not committed. Not yet a problem because remote has no www/, but codify before the audit-and-curate pass to avoid accidentally committing 171 sync'd files.

**Keystore + password `Weareinthis2026!` into 1Password (P0 launch blocker).** Dean's 30s manual. Path `~/Projects/vyve-capacitor/android/app/keystore/vyve-release-key.jks`, PKCS12, alias `vyve-key`, SHA1 `CC:48:EA:AF:C1:47:ED:43:20:63:4F:FF:07:99:79:20:55:7D:23:B9`. If Mac is wiped before keystore + password are co-located, Android app is un-shippable for the lifetime of `co.uk.vyvehealth.app` on Play Store.

**`vyve-capacitor` git init + dirty tree commit + push to VYVEHealth/vyve-capacitor (P0).** Third-occurrence escalation. Cumulative uncommitted edits across `build.gradle`, `variables.gradle`, `keystore.properties`, `local.properties` over iOS + Android ships sit in unversioned working tree. `.bak-pf14b` / `.bak-pf14b-android` / `.bak` files are the only history. Any accidental file overwrite is unrecoverable.

**iOS encryption answer (banked).** Dean chose "Standard encryption" against research-backed advice of "None of the algorithms" for HTTPS-only apps (per Apple Developer Forums + official guidance). Standard requires export compliance documentation if Apple ever audits. Likely fine; if Apple asks for export docs post-approval, that's the audit trail.

**iOS App Review notes scan (P2, next submission).** Residual "PWA-based" framing was caught and rewritten this session; per §23.20 the product is no longer a PWA. Future submissions: scan App Review Notes for inherited PWA / "thin web wrapper" / "web shell" framing that could trigger Apple Guideline 4.2. Always describe as "native iOS app built with Capacitor wrapper".

**R8/ProGuard enable (P3, post-trial polish).** Play Console Warning 3 of 4 from PM-413 — no deobfuscation file. Future build improvement; makes crash stack traces more readable.

**Native debug symbols (P3, post-trial polish).** Play Console Warning 4 of 4 — no native code debug symbols uploaded. Same shape as ProGuard, harder to debug native crashes if they happen.

**Debug strip gating (P1, pre-next-binary, escalation pending home-surface verification).** PM-310 always-on live-tracker debug strip across the 8 `*-live.html` shells (via `session-live.js`) + `?debug=tracker` mind-video strip (via `mind.html`). Gate behind `localStorage.getItem('vyve_debug_tracker') === '1'`. **mind.html surface CLOSED PM-424 (`9300a0bf`)** — the PM-324 strip was leaking onto Today's Focus meditation play because PM-418 gated the open-time call but an ungated 1s poller re-inserted it; now guarded at `renderDebugStrip()` entry behind `vyve_dev_panel_unlocked`. **Remaining: the 8 `*-live.html` session-live strips** (PM-409.b gating still wants a device-walk confirm) + any other surface where `player-tracker.js` mounts a strip — apply the same function-entry guard pattern. PM-315 CSP fix for YT IFrame API still not validated on device walk — either validate first and remove strip, or keep flag-gated until next walk. Settings Reset Achievements + Force Refresh App buttons stay (intentional trial-period support tools). **PM-415 brain park (27 May): Dean flagged tracker debug visible on "main section" (likely index.html), suggesting the gating leak extends beyond the 8 live shells PM-409.b covered. First Thursday action: device-walk index.html with NO debug flags set, confirm whether debug strip renders. If yes, scope broadens to a full-surface sweep of anywhere `player-tracker.js` loads or `renderDebugStrip()` output is rendered. Promotes to P0 pre-bundle-rollout if confirmed (members on 1.4/1.0.5 would see this).**

**Native binary candidates for next cut.** When cutting binaries again, bundle: bundled exercise thumbnails + workout plan templates (audit total weight first — hundreds of images adds real MB), R8/ProGuard, native debug symbols, View Transitions API wire (PM-394 plan item — lower priority since snapshot-first paint already solves visible flicker; one chat as polish).

## Body hub

**Bug B (Thursday) + Bug A (post-trial) + Bug C (device-console session).** See PARKED block above. Bug A architectural sequence: programme_library category backfill → Onboarding EF v37 writes category into workout_plan_cache → exercise.html branches on category → movement.html consumes categorised plan.

**Exercise demo video coverage fill (P1, post-trial).** 129 of 297 rows in `workout_plans` have NULL `video_url` (43%). After PM-346 wired picker thumbnails to open the fullscreen player, members see dimmed thumbs on those rows = "no preview available". Honest but visible. Action: `GROUP BY plan_type` for NULL ratio first, then prioritise filming/sourcing. Likely distribution: PPL + Upper/Lower have high coverage; Home Workouts and Movement & Wellbeing have the gaps.

**PM-308 — Cardio walking removal + per-member custom kinds.** Specced fully (Dean's next ask, reading-pass + design-check before build). Cardio's fixed kind list shrinks to running / cycling / swimming / rowing / other (walking moves out — lives in Movement now). Plus: members add their own kinds ("Football" → persists for that member forever). Schema: new `member_cardio_kinds` table (member-scoped UUID PK, `member_email`, `kind_label`, `display_order`, `created_at`, UNIQUE on `(member_email, lower(kind_label))`, RLS member-scoped). Dexie SCHEMA_V16: `member_cardio_kinds: 'id, member_email, [member_email+kind_label], display_order'`. `cardio.cardio_type` value space: fixed values lose walking; member-defined as `custom:{slug}`. `cardio.html` UX: pill row with 4 fixed + N custom + "+ Add" pill at end. Cleanup: remove dead `r => r.logged_via !== 'movement'` filters in cardio.html / cardio-history.html / workout-history.html (no-ops post-PM-307). Estimate 2-3 sessions Claude-assisted.

**Exercise.html audit Commit 7 — Browse library prefetch (open).** workouts-library.js is NOT Dexie-wired (zero `VYVELocalDB`/`hydrate`/`prefetch`; 4 raw `fetch()`; has its own localStorage cache layer). Add background prefetch so the exercise library is warm by the time the member taps in. Dean's words: loaded in the background, already there on click.

**Walk-note persistence in the movement quick-logger.** The walk branch of movement.html `logMovement()` writes a `cardio` payload (`cardio_type:'walking'`, `duration_minutes`, `distance_km`, `client_id`) that does NOT carry the member's note. Non-walk branch persists `workout_name: sessionName`. Result: walk rows in Recent Movement + movement-history.html render the type-name ("Walk") as title, never the member's label. Fix: add the note to the walk's cardio payload (confirm cardio's free-text column name first — cardio.html's logger likely uses one). The mvlog render already shows `r.workout_name||r.notes||'Walk'` so walk titles light up automatically once populated. Not trial-blocking.

**Per-set save path (`tickSet` / exercise_logs) — same `await writeQueued` shape as PM-148 (latent).** workouts-session.js ~L421: the per-set save does `await VYVEData.writeQueued(...)` — identical network-blocking pattern PM-148 fixed in `completeWorkout`. Not reported as slow by Dean, but same latent bug — will hang the set-tick under backend load. Apply the same optimistic-first treatment when next touching the set path.

## Mind hub

**PM-319 mind tracker follow-ups.**
- Achievement evaluator subscribe to `mind:viewed`. Right hook for "X minutes of meditation/sleep/visualisation across a week" or "completed N visualisation sessions" metrics. Carries `watch_seconds`, `completed`, `kind`, `pct_watched`. Distinct from `mind:logged` which fires for every mind-pillar activity including journal/affirmations/breathwork.
- Backfill old `duration_seconds:30` rows. Pre-PM-319, every mind_activities row was stamped `duration_seconds=30` regardless of actual watch. If a future drop-off-curve analysis needs them treated as "at least 30s watched", a one-time `UPDATE mind_activities SET watch_seconds = duration_seconds WHERE watch_seconds IS NULL AND ref_id IS NOT NULL` would backfill. Defer until Achievements / analytics demand it.
- Sister-page consolidation. meditation.html, sleep.html, visualisation.html, breathwork.html all duplicate the PM-180/PM-183 setTimeout pattern mind.html retired. Each a candidate for the `VYVEPlayerTracker({mode:'mind'})` swap. Follow-up sprint — mind.html is the highest-impact target and shipped.
- Migration name mismatch (cosmetic). `pm315_mind_activities_watch_tracking` filename doesn't match canonical PM-319 brain entry. Migration names are append-only in Supabase. Accepted drift, no action.

**Background audio play for video catalogue (parked, post-trial decision).** YouTube IFrame embeds disallow audio-only/background playback per ToS — pauses on `visibilitychange:hidden`, WKWebView suspends timers on background, embed self-pauses by design. Three real options post-trial:
1. Tell members to get YouTube Premium. Zero engineering, zero risk, solves nothing for retention.
2. Self-host audio. Re-encode each video's audio track, upload to Supabase Storage, build native HTML5 `<audio>` player wired with `MediaSession` API + Capacitor background-media-controls plugin. iOS `UIBackgroundModes: [audio]` in Info.plist + Android `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission + foreground service manifest entry. Lock-screen controls + scrubber free with MediaSession. New iOS / Android store submission required.
3. Build audio-first content for mind/sleep tracks — drop video format for surfaces where audio is the product (HAVEN meditations, breathwork, sleep wind-downs, visualisation). Record audio-first, host on Supabase Storage, same player infra as (2). Cleanest end state.

Decision deferred until trial engagement data tells us which mind content members actually want to background. Folds with the post-trial podcast audio player bundle — shared Capacitor plumbing + Supabase Storage pattern + MediaSession wire. When either ships, the other is a 1-day follow-on.

**HAVEN clinical sign-off (Phil-blocked).** HAVEN persona built and live but not promoted widely pending Phil's clinical sign-off review. Conor Warren on HAVEN since 15 April.

**breathwork.html phase transitions (haptics adoption).** `VYVEHaptics.light()` on each inhale→hold→exhale→hold boundary. One-line add when next touching the page.

## Connect hub

**PM-197 Profile identity campaign — remaining work after PM-242 partial ship.** Read-side identity rendering on connect-feed.html + connect.html Recent Check-Ins is LIVE. `profile.js` helper exists. `connect-feed-preview` EF v2 enforces anonymous-coupling server-side. Three avatar states render: initials text / uploaded photo / V-mark for anonymous (uses `/logo-mark.png`). `vyve_identity_<email>` cross-member localStorage directory operational.

Still pending:
- Leaderboard avatars — blocked on additive `email` column return from `get_leaderboard()` Postgres RPC. Next-session full-repo audit before careful RPC change.
- Settings UI for changing privacy mode — members currently set `display_name_preference` via direct DB only; no member-facing toggle. Distribution at PM-242 ship: 16 anonymous, 3 full_name, 1 initials. Needs Settings page surface to let trial members pick.
- Curated avatar library (`avatar_kind`, `avatar_id` columns + ~12 SVGs). Full campaign owns. PM-242 ships only `avatar_url` photo + initials + V-mark anonymous path.
- Connect first-load modal for first-time display-name + avatar pickers (PM-197 Thread 1). Design locked, not shipped. First-time on connect.html with `members.connect_onboarded_at` null: single modal "Welcome to Connect. How would you like to appear?" with display name picker + avatar picker + Save/Skip. Defaults: first name + curated V-badge so skip path produces sensible identity. Modal does not gate Connect; page paints with defaults applied behind it.
- Photo upload architecture (PM-197 Thread 2). Capacitor `@capacitor/camera` plugin → native picker → base64/file URI → client-side 256×256 JPEG crop → upload to `member-avatars` Supabase Storage bucket (public-read, write-restricted to authenticated member writing own avatar) → write URL to `members.avatar_url`. Same shape WhatsApp / Slack / Instagram use.
- GDPR Article 17 bucket cleanup in erasure pipeline.

**PM-211 — Single source of truth for live sessions (post-launch, 1-2 sessions).** Live-session schedule data lives in three places that disagree: `sessions-data.js` (vyve-site, recurring), `service_catalogue` (Supabase, stale since PM-190.d), `calendar_occurrences` (Supabase, materialised). Move to one recurring-pattern source in Supabase + materialiser keeping `calendar_occurrences` topped up. Lewis edits one row, calendar + sessions page + Live This Week reflect within minutes. Delete `sessions-data.js`. Recommended: extend `service_catalogue` (add `schedule_days TEXT[]`, `tags TEXT[]`, `live_url`, `replay_url`; backfill from sessions-data.js shape). New EF `materialise-calendar-occurrences` + Sunday 03:00 UTC pg_cron + manual re-trigger endpoint for on-edit invalidation. sessions.html data binding migrates from `VYVE_SESSIONS` to `VYVELocalDB.service_catalogue`. CATALOGUE_INVALIDATION_KEY bump. Realistic timing: first 1-2 weeks post-launch.

**PM-213b — Live check-in form variants (post-trial).** New `live_checkin_submissions` table (UUID PK, `member_email`, `occurrence_id` → calendar_occurrences ON DELETE SET NULL, `variant` text NOT NULL, `answers` jsonb, `client_id` UUID, `created_at`). Plus `calendar_occurrences.checkin_variant` column so Lewis chooses which variant per check-in. checkin-live.html bespoke shape on top of PM-251 shell — embed question form inside `sl-tab-content` Info panel (or add 4th Check-in tab). Optimistic-first submit per §23.39. ~2 sessions Claude-assisted when prioritised.

**PM-251c — Chat unlock (v1.1 feature flag flip, ships first).** Locked behind `COMING_SOON_TABS = true` in `session-live.js`. Tabs render with lock icon + "Coming soon". Flip flag + port legacy chat code (was in pre-PM-251 engine; not retained in new engine to keep v1 surface clean). Chat-only: ~2 hour session (port + wire + device test). Q&A scope NOW lives in PM-416 (promoted to first-class upvote-ordered feed with admin moderation surface) — PM-251c flips chat tab only, leaves Q&A tab locked until PM-416 ships.

**PM-416 — Live session question submission + instructor feed (post-PM-251c, 3-4 sessions Claude-assisted).** Member-side Q&A tab in `session-live.html` with composer (280-char limit) + upvote-ordered feed of all questions for the occurrence (all-visible per Dean's call). Instructor-side `live-questions.html` in `vyve-command-centre` (admin.vyvehealth.co.uk) per Dean's call: two-column Pending/Answered layout, ≥18px type, Realtime sub with subtle new-arrival flash, optional Producer-mode toggle exposing "Highlight for Lewis" star (defers operator-model decision to post-pilot).

Schema: `session_questions` (UUID PK, occurrence_id FK → calendar_occurrences ON DELETE CASCADE, member_email, question_text 3-280 CHECK, status pending/answered/dismissed, answered_at, dismissed_at, upvote_count, client_id, created_at) + `session_question_upvotes` (composite PK (question_id, member_email), trigger keeps upvote_count synced). RLS: members see pending+answered (never dismissed), INSERT own with 5-pending-per-occurrence cap via trigger, UPDATE service-role only via question-moderate EF. Self-upvote prevented at trigger level.

Two new EFs both verify_jwt:true: `question-submit` v1 (validates occurrence broadcast_state IN ('live','starting'), enforces 5-pending cap, inserts, optimistic-first per §23.39) + `question-moderate` v1 (admin-gated, updates status). Both publish `live:question:created` / `:answered` / `:dismissed` / `:upvoted` via Realtime broadcast per §23.41-§23.50 bus discipline.

Dexie SCHEMA bump: `session_questions` member-scoped on occurrence_id, 24h TTL, pullable ordered by upvote_count DESC + created_at ASC.

Build order: (1) schema migration + RLS + trigger, (2) two EFs, (3) Dexie wire + sync.js PULLABLE, (4) `session-live.html` Q&A tab flip + composer + feed + upvote interaction + Realtime sub, (5) `live-questions.html` in vyve-command-centre — admin gate + occurrence picker + two-column feed + moderate actions + producer-star path, (6) bus events both sides, (7) device walk per PM-304 on real broadcast (schedule occurrence with starts_at=now()), (8) Lewis copy pass on composer placeholder + empty state + 280-char warning.

Risks: rate limiting tight (5→3 after first session if needed), no profanity filter v1 (post-trial: wordlist in EF, no AI moderation), withdraw vs answer race (EF returns current state, client reconciles), Realtime quota fine on Pro for 1000 viewers on one channel with 5-10s polling fallback ready, producer-star vs answered two-state UI needs device-walk validation.

Cross-refs: PM-251c (chat ships first, proves Q&A tab architecture), PM-211 (calendar_occurrences source-of-truth — FK target), PM-197 (member identity rendering on question feed avatars), §23.41-§23.50 (bus discipline).

Rejected alternatives (banked for future, see changelog PM-416): embedded Zoom/Teams in WKWebView (wrong tool, vendor-hostile to embedding), Daily.co/LiveKit/Agora real-time video embed (~$0.004/participant/minute viable but wrong product shape — broadcast Q&A is 1-to-many with text, not many-to-many video). Group therapy two-way video handled out-of-app via Zoom button → `window.open(url, '_system')` → native Zoom (separate ~1-evening ship, Phil clinical sign-off blocked).

**PM-251b — Instructor backfill on `service_catalogue.default_host_*`.** Single SQL UPDATE per category as instructor confirmed. PM-251 backfilled `default_host_name='Lewis Vines'` + `default_host_role='Co-Founder, VYVE Health'` on all 8 `type='live_session'` rows as placeholder. Real identities to populate: Mindfulness (Phil — gated on clinical sign-off review of voice), Workouts (Calum), Weekly Check-In (Vicki?), Group Therapy (Phil), Events & Run Club (Lewis), Education & Experts (TBD per guest), Podcast (Lewis). Photos: upload 512×512 JPEG to a `host-photos` Supabase Storage bucket (public-read, similar shape to `member-avatars`), then UPDATE `default_host_photo_url`. 15 minutes once instructors confirmed.

**At-risk-streak push notifications (PM-309 follow-up, Lewis-blocked on copy).** Dean's ask: 19:00/20:00/21:00 BST push "you're about to lose your X-day Elite streak" when member at-risk. Definition: streak ≥ 3 AND no activity today AND under grace-day rule yesterday IS in active-day set. Requires: Capacitor push-notifications plugin status check, new cron ~19:00 UTC enumerating at-risk members (member_home_state.overall_streak_current ≥ 3 AND last_activity_at::date < CURRENT_DATE), native push dispatch path decision (APNs/FCM direct from EF via REST, or third-party service), Lewis copy with variants for streak length brackets (3-6, 7-13, 14-29, 30+), Settings.html notification toggle row. Scope ~2-3 hour build once Lewis has copy + Capacitor plugin confirmed.

**Live viewer count on session pages.** Display only when 20+ viewers. Requires `liveBroadcasts.list?part=statistics` polling. Quota trivial (8 active broadcasts × hourly = 192 units/day) but UX adds complexity. Defer.

## Home / engagement

**Engagement Score v2 — follow-ups owed after PM-295 partial ship.**
1. Default flip + v1 cleanup. After 24-48hr v2 device verification, swap default so `engagement.html` redirects to v2 (or rename v2 over v1). Drop v1 `compute_engagement_components` + `compute_engagement_score` SQL functions, v1 `member_home_state` columns (`engagement_score`, `engagement_recency`, `engagement_consistency`, `engagement_variety`, `engagement_wellbeing`), v1 JS `computeEngagementComponents`. One Supabase migration + one vyve-site commit. Single session.
2. Activity Breakdown grid rebadge (Dean's call PM-295). Today: Habits / Body / Mind / Connect / Check-ins. Target: **Habits / Mind / Body / Cardio / Check-ins**. Remove Connect + sessions-bound card, split Body into Body (workouts only) + Cardio (cardio sessions only). Pillar rows above stay as-is — they reflect what the score is computed from. Breakdown is a member-facing slice and can differ.
3. Three-tab shell (Dean's design call PM-295). Engagement page becomes `[ Score ] [ Progress ] [ Achievements ]` sticky tabs. Score tab = current engagement-v2.html (post grid rebadge). Progress tab = charity mechanic + 5-track milestone progress per §17 + §11A. Achievements tab = port v1 trophy-cabinet block verbatim (full overhaul is the separate Achievements campaign).
4. `live_checkin_submissions` Dexie registration. Add to db.js SCHEMA_V14 + version chain + makeTable consumer + sync.js PULLABLE entry (member-scoped, week_start.gte 12-week lookback, ordered week_start.desc). Sequences with the live check-in form build.
5. `re-engagement-scheduler` v11 push thresholds. Three thresholds reading new `engagement_score_v2` + `engagement_pillars_touched_7` columns: Soft slide (Score <75 first time in 14 days, 7d cooldown), Pillar gap (Score <65 for 3 days, names empty pillar, 5d cooldown), Re-engagement (Score <55 for 7 days, routes into A/B/C1/C2/C3 + push, 14d cooldown). Lewis owns 5 pillar-gap notification copy variants. Build after 24-48hr v2 verification + default flip.
6. Lewis copy pass — Engagement v2 voice. All v2 band copy (Powerhouse / Strong week / Building / Quiet week titles + subs), 5 pillar explainer popovers, "How your score works" sheet body, 6 pillar empty-state hints. Shipped as functional placeholder. One copy commit.
7. v2 30-day strip — tap-day-to-expand activity detail. Parked post-soft-launch. Tap a day on 30-day chip-row → bottom sheet shows what was logged that day. Defer until soft-launch data shows curiosity-tap is real behaviour.
8. `/page-docs/` continued backfill per §11B. First batch beyond engagement.md: index.md, habits.md, exercise.md, mind.md, connect.md, then focus pages.

**PM-358 — Achievement tier curve + naming overhaul (P1, post-trial, gated on Lewis's v1 copy review landing first).**
1. Naming unit-blind. "Five Cardio Banked", "Three Workouts In", "Twenty-Five Strong" lose the noun. Every title must contain the unit explicitly. "Five Cardio Sessions" not "Five Cardio Banked". Bulk find-and-replace across all 528 rows.
2. Tier curve dies mid-game. Current bulk-count metrics use `1, 3, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000`. From tier 5 each step is ≥2× previous — gap goes 15 → 25 → 50 → 150 → 250 → 500 → 1500 → 2500 → 5000. 25→100 dead zone exactly where engagement-fatigue is highest. Proposed: `1, 3, 5, 10, 20, 35, 50, 75, 100, 150, 250, 500, 1000, 2500, 10000`. 15 tiers vs current 13. Member hits tiers every 1-2 weeks through month 3, every ~3 weeks through month 6, monthly into year one, rare prestige beyond. Apply to streak-adjacent bulk-count metrics. Streak metrics (3/7/14/30/60/100/200/365/...) leave as-is. Time-based (workout_minutes_total, cardio_minutes_total, mind_minutes_total) same fix scaled to minutes. HealthKit metrics already differently scaled — review separately. volume_lifted_total leave alone.
- Sequencing: Lewis returns v1 CSV with per-tier copy approved → bulk-UPDATE per-tier title/body/copy_status='approved' → curve overhaul → v2 CSV → Lewis sign-off → bulk-UPDATE final. Doing curve change AFTER per-tier copy lands means copy work isn't wasted on tiers that survive (tier 1-5 mostly overlap with current).

**"You've been away" Score copy state (small ship, ~20min, Lewis-blocked on copy).** PM-301 considered but not built: copy-only state on Score band detecting members who haven't logged anything for 5+ days. Override `scoreBandSub` text with welcome-back framing: "Welcome back. Your floor's still at 50, your streaks held what they could, here's where to start." Check `engagement_days_since_last_log` ≥5 in `renderScore()`. No structural change. Lewis voice pass on actual copy required. Defer until member-side report of "I came back from holiday and the page felt cold" confirms problem is real.

**Engagement v1 redirect file removal (post-PM-305, small commit ~early June).** PM-305 left `/engagement.html` as 2KB redirect file. Three things before deleting entirely: (1) confirm via service-worker logs no devices hitting `/engagement.html` directly — should all go to `/engagement-v2.html`, (2) remove `/engagement.html` from sw.js precache list, (3) delete file. Earliest sensible: ~1 week after PM-305 ship.

**Build banner restoration (broken since PM-256, <15min when picked up).** `?debug=build` should show build banner with vbb-marker + sw cache key. HTML element + JS wire still in index.html (L1077-1110 inspected at PM-293) but banner doesn't appear. Most likely: CSS specificity issue from PM-256 rewrite overriding `style.display = 'block'`, OR localStorage flag check at L1086 silently failing. Not a launch blocker — diagnostic affordance lost. Run `?debug=build` in Safari with DevTools, fix spec collision or JS hook.

**Home Today's Habits paints inactive rows as if active (backlog, low priority).** test1@test.com had 4 active member_habits rows in Supabase; settings showed "4 habits currently assigned" correctly; Home Today's Habits showed 8 cards — 4 active + 4 with `active=false`. Hypothesis space: localStorage cache painted before sync.js's `replaceForMember` ran most recently, OR different join path on home (daily_habits joined to habit_library showing any habit ever logged), OR PM-291 habits-on-home wiring reading different Dexie store. Not launch-blocking — fresh members at trial launch have no accumulated `active=false` rows.

**Engagement-v2 cold load slow-path investigation (post-trial).** PM-399 snapshot makes the LOADING hang visually invisible but `computeHomeStateFromDexie` 10-table heavy read still takes 1-30s on memory-pressured devices. Profiling pass post-trial to see where the time goes.

**Lucide icon swap across nav.js (Dean call PM-295).** Replace hand-rolled inline SVG icons in `nav.js` with Lucide (https://lucide.dev, MIT, ~1500 icons). Affects bottom-nav 5 icons (Home, Body, Mind, Connect, More) + More-menu entries. Inline chosen Lucide SVG paths only for icons in use — no CDN, no `lucide.min.js` dependency. Self-contained, can land any session.

**Real per-track progress on My Progress rings (post-pillar-realignment).** PM-257 paints 5 rings with `PROGRESS_TRACKS` placeholder zero values. Wire `home-state-local.js` compute functions into renderPills. Each ring `value/target` reads from member's monthly count. Mapping: Hydration → daily_habits where habit_title matches hydration; Movement → workouts + cardio combined; Mind → mind_activities; Nutrition → daily_habits where habit_title matches nutrition; Sessions → session_views. Target 30 for all (matches certificate milestone). Sequence AFTER pillar realignment (rings → Habits/Body/Mind/Connect/Check-ins) to avoid wiring math twice.

**PM-256 follow-ups (home redesign deferred items).**
- Habit icon redesign campaign. Current `iconForHabit(habit_title)` is 12-keyword regex match with 🌿 fallback. Add `icon TEXT NULL` column to `habit_library`. Backfill 30 current rows with curated emoji or SVG glyph (Dean's call on emoji vs commissioned SVG). Replace `iconForHabit()` with `habit.icon || iconForHabit(title)` fallback. Dexie `member_habits.allFor` already pulls full row — add `icon` to select. ~1 hour emoji / ~3-4 sessions SVG.
- Fractional-ring v2 for Progress Pills. Add `target_unit TEXT NULL` + `target_value NUMERIC NULL` to `habit_library`. Examples: `walk_8000_steps` → unit `steps`, target 8000. Backfill ~10-15 habits with meaningful numeric targets. New `getHabitProgress(habit, memberEmail)`: HealthKit-backed for steps/sleep/active_energy; water-backed for hydrate; time-backed for breathwork/meditation; boolean fallback otherwise. Ring math `Math.min(1, current / target)`. ~3-4 hours. Bundle into one trip through habits.html + index.html + habit_library migration with the icon redesign.
- AI-generated daily focus (post-trial). New table `daily_focus_log(member_email, focus_date, persona, time_of_day, content_json, generated_at)` UNIQUE `(member_email, focus_date, time_of_day)`. New Anthropic EF `generate-daily-focus` mirroring weekly check-in recs. Trigger from index.html boot if no row exists. Cost ~3 gens × 14 days × 30 members = 1260 calls/month at trial scale (~£3-5/month Sonnet 4).
- Tagline `time_of_day` column for TOD-aware rotation. Add `time_of_day TEXT NULL` to `taglines` (NULL = applies to all TODs). Lewis adds 4-6 per TOD via Supabase Studio. Replace `pickTagline()` with Dexie read filtered to current TOD or NULL, local-midnight-anchored day-index rotation. ~30min.
- Mood trend visualisation for Lewis (out-of-scope trial, marker for PM-214 admin console build).

**PM-257 follow-ups.**
- Focus carousel re-consideration. PM-257 ships single Today's Focus card that changes content by hour boundary. Worth a device review now that it's live — Dean previously stuck between carousel (3 cards) and single-shifting-card; my argument for single won. If Dean wants carousel after device review: restructure `.focus-card` to `.focus-carousel` container with 3 cards always visible, swipeable, active card derives from TOD on first render. ~45min, pure UI restructure, no data layer change.

## Settings / profile

**Settings UI for changing privacy mode (PM-197 follow-up — Profile identity).** See Connect hub. Members currently set `display_name_preference` via direct DB only.

**Capacitor + theme parity for nav-injected pages.** Bottom-nav opacity split on Connect (PM-405) shipped — verify no inverse drift on other surfaces during the next light-mode pass.

## Onboarding

**Onboarding EF v37 writes category into workout_plan_cache (PM-411 Bug A architectural prereq).** See Body hub.

**Persona welcome copy spot-check in `persona_welcome_copy` (Lewis-blocked).** Dean finalises lines via UPDATE in Supabase Studio; no vyve-site commit required. HAVEN short-circuit + SAFE_ECHO_GOALS whitelist + `{name}` interp all stay code-side as safety logic. `FALLBACK_COPY_TABLE` const carries cold paint. Schema-level work for PF-13 hydration copy finalisation is done — only sweep-the-fallback-to-match remains when Lewis spot-checks.

**In-App Tour (PF-23, post-bundle P1).** Elevated from "V2 post-launch blocked on Lewis copy" to next-up P1 after bundle ships (PM-404 brain close). Modal step-through (option a) confirmed for v1. Walks members through home dashboard (score ring + streak), first habit log, first workout log, first cardio log (with HealthKit consent prompt on iOS), first session watched, first weekly check-in. Each step ends with the member tapping the actual log button — earns first-tier achievement at each step + the `tour_complete` achievement on completion. Persistence via `members.tour_completed_at` + "Restart tour" in Settings. Skip path required. Dependencies: Lewis copy + screenshot approval. ~1-2 sessions, mostly UI.

## Admin / Command Centre

**Portal Admin UI for `calendar_occurrences` (sequenced after PM-215 cron + ~1 month of operational learnings via manual pasted-timetable path).** Spec defined in `playbooks/live-sessions-operations.md`. Build with usage data, not without. Repo `VYVEHealth/vyve-command-centre`, new page at `/calendar` or `/sessions`. MVP scope ~1 session Claude-assisted: list view of upcoming occurrences, add new session form (8 fields per intake spec, category dropdown of 8 canonical strings — no free text), edit form (locked once `starts_at <= now()`), cancel (sets `active=false`, warns if `youtube_broadcast_id IS NOT NULL`). Phase 2 ~half session: bulk add for recurring patterns. Does NOT do: YouTube broadcast management UI, Riverside integration, host photo upload (paste URL), replay management.

**Broadcast schedules UI (PM-402 follow-up).** Manual broadcast UI + cron rails shipped. Out-of-scope v1 parked: scheduler creation UI in Command Centre (rails ship dark per Dean's call); "pool of quotes" infrastructure for morning quotation (Lewis decides content shape); custom audience JSON editor (power user surface).

**Android FCM banners on broadcast push (standing backlog).** APNs end-to-end live for broadcast push. Android needs FCM credentials audit + dispatch path wire.

## Native / Capacitor

**Bundled exercise thumbnails + workout plan templates into Capacitor build (own scoped vyve-capacitor session).** Dean's direction: when app downloaded from store, build contains exercise thumbnails AND workout plan data — on-device from first launch. Distinct from sw.js precaching — commits thumbnails into vyve-capacitor as bundled assets shipping inside the binary. Videos NOT bundled (network-only). Workout pages reference local bundled asset path with network URL as fallback. First size up total thumbnail weight — hundreds of images may need compression before bundling. Pairs with vyve-capacitor git init.

**Android Health Connect wiring (PM-411 Item 1 Bug 7 carry-over).** AndroidManifest + Gradle SDK + healthbridge.js Android branch. Plugin present per package.json. Android FCM credentials audit alongside.

**Capgo HealthKit live-polling upgrade on Movement (v2 follow-up).** Deferred. Current pull is per-session; live-polling would surface walk credit in near-real-time.

**iOS background HealthKit sync (parked future vision).** Capgo 8.4.7 exposes zero background primitives. Architectural path is companion Swift Capacitor plugin (~400 lines) alongside Capgo. ~4-5 build sessions + 1 week device soak + App Store review cycle. Unpark signals: member feedback naming background sync specifically; enterprise pilot requirement.

**Nutrition/MFP reads via HK (parked).** Capgo 8.4.7 exposes no dietary types. Would need plugin fork/PR. Separate plan at `plans/nutrition-healthkit.md` when sequenced. Unblocks water habit auto-tick and MFP-native nutrition totals.

**PM-250 follow-up — Wire @capacitor/browser for external links inside the app.** Plugin already installed (`@capacitor/browser ^8.0.3` in vyve-capacitor/package.json). Wiring deferred from PM-250. ~30min. PM-250 suppressed long-press "Open in Safari" preview via `-webkit-touch-callout: none`, but tap on `<a href="https://example.com/...">` inside WKWebView still navigates IN the WebView (replacing app's web shell). Members visually trapped. Route external links through `Browser.open()` → SFSafariViewController on iOS / Chrome Custom Tab on Android. Audit first: grep external links, `window.open`, `location.href`, `target="_blank"`. Implement via delegated click handler in new `external-links.js` (or fold into nav.js) — Capacitor environments only via `window.Capacitor.isNativePlatform()` guard. `window.Capacitor.Plugins.Browser.open({url, presentationStyle: 'popover'})`. Ships in vyve-site (client-side JS) not vyve-capacitor — plugin already in binary. Sweep target per §23.59 for stale PWA-era assumptions (any "Add to home screen" / `beforeinstallprompt` handler / stale sw.js urlsToCache from removed pages).

## Infra / Data

**PM-417.b — HealthKit distance backfill patcher (P2, ~1.5 sessions Claude-assisted).** PM-417 forward-fix shipped to vyve-site `2e6ffb46` — healthbridge.js now captures `totalDistance` + `totalEnergyBurned` from Cap-go workout samples going forward. Backfill remains: ~6 months of HealthKit-sourced `cardio` rows have `distance_km IS NULL` for Lewis (and any other HK-connected member). New EF `backfill-hk-distance` (verify_jwt:true, admin-gated). Client-side re-pull required since HealthKit data lives on-device — server has native_uuid but cannot re-query alone. Flow: EF returns list of NULL-distance workout `native_uuid`s for member → client calls Capgo `queryWorkouts` in 30-day windows (max 365 days per MAX_SAMPLE_AGE_DAYS) → posts `{native_uuid, totalDistance, totalEnergyBurned}` back to EF → EF merges into `member_health_samples.metadata` AND updates `cardio.distance_km` via `promoted_id` link in transaction. Trigger from vyve-command-centre per-member, OR auto-trigger via new `member_health_connections.needs_backfill BOOLEAN` flag picked up on next normal pull_samples. Edge cases: workout deleted on device → leave NULL; third-party app workouts without totalDistance → leave NULL (document, don't engineer around). No native bundle change needed — client JS only, picks up via WKWebView refresh.

**PM-145 — `platform-alert` v10 + `alert-digest` EF + cron-noise cleanup (P0, design locked PM-403.b, build pending fresh chat).** ESCALATED 16 May (PM-149). On 16 May the `platform-alert` v8 storm drained the nano-tier 60-connection Postgres pool and caused a site-wide login outage. Mitigated by deploying `platform-alert` v9 — a deliberate no-op (instant 200, no DB/Brevo/push). Consequence: platform error monitoring has been OFF since 16 May. With bundle widening cohort to all members on approval, this is now blocking-grade P0.

Design locked PM-403.b. See changelog. Summary:
- `platform-alert` v10 — server-only replacement of v9. Fingerprint `(type, normalised_endpoint, member_email)`. Severity recalibration with 14-endpoint write-path list. Circuit breaker 20/60s → 429 for 5min. skeleton_timeout counter-in-details pattern. Writes only to `platform_alerts` — push_subscriptions write dropped entirely. <50ms 200-return. Client (vyveMonitor IIFE in auth.js L927-999) untouched.
- `alert-digest` EF + pg_cron — three slots 08:00/14:00/20:00 UTC. Always sends. Subject differentiates issues vs all-quiet. Per-fingerprint Claude Sonnet 4 diagnosis (4096 tokens, cap 10/email, EF source + last-3-commits context, hardcoded endpoint→file map). Anthropic failure degrades gracefully — email always sends. Brevo `team@vyvehealth.co.uk` to deanonbrown@hotmail.com + lewisvines@hotmail.com, tag `alert-digest`.
- Cron noise cleanup — `charity_total_reconcile_and_heal()` literal swap warning→info; `habit-reminder-daily` + `streak-reminder-daily` JSON-literal fix on the `current_setting('app.service_role_key', true)` pattern; sweep `cron.job` for shared-pattern siblings.

Order in build chat: cron noise (10 min) → platform-alert v10 → alert-digest EF + cron → manual digest invocation confirms all-quiet email lands → Session B walk.

Deferred from current scope: boot_id + app_version client injection (Stage 2, auth.js v3, post-bundle OTA). Command Centre alerts panel (Stage 5, post-bundle). Pattern detection EF (Stage 4, post-bundle).

**Monthly check-in credit gap (P0 own session, Lewis-gated).** `monthly_checkins` has NO counter trigger and NO charity trigger — a monthly check-in currently earns ZERO credit. Bus event `monthly_checkin:logged` should exist (achievements evaluator handlers `monthly_checkins_completed`, `monthly_avg_improved` reference per PM-342). Check what's actually firing. Convert increment-style counters (`increment_cardio_counter`, `increment_workout_counter`, `increment_habit_counter`, `increment_checkin_counter`, `charity_count_*`) to the stateless recompute pattern used by `update_cert_sessions_count` — drift-prone (no recount on DELETE). Recompute for check-in track must UNION `wellbeing_checkins` and `monthly_checkins`. Backfill `cert_*_count` columns. Per-track cap numbers (cardio/workouts/sessions credit first 2/day; habits + check-ins credit first 1/period) are a product decision — confirm with Lewis, don't change unilaterally. `activity_dedupe` replay (months of historically-discarded activity) — Dean's steer: fix-forward, treat replay as separate.

**index.html duplicate `posthog.init` cleanup (PM-408 follow-up, P3).** Lines 1043-1046 contain inline `posthog.init` running immediately (no defer) setting `posthog.__SV=1`. auth.js's deferred init at line 8 then no-ops on existing stub. Net effect: session_recording config in auth.js (100% sampling, `maskAllInputs:true`, `maskInputOptions.email:false`) NEVER applied on index.html. Single-ship fix: delete inline init, test in fresh Chrome incognito with DevTools (confirm `window.posthog` defined within first 200ms, session recording active, no console errors). If green, ship; if not, align inline init config with auth.js. ~4-file atomic ship. Verification via PostHog "Session replays" tab. Home page recordings missing is noticeable observability gap but not blocking trial.

**§23.65 forward-sweep audit (envelope-trusted subscribers).** PM-293 fixed home `habit:logged` subscriber to be envelope-aware. Same pattern applies to any cross-page subscriber watching `<event>:logged` from a publishing surface using fire-and-forget Dexie writes (§23.39 default). Audit signal: `grep -nE "VYVEBus\.subscribe\(['\"][a-z_]+:logged" *.html *.js`. For each match, check whether subscriber's only state-update path is a `loadX()`/`fetchX()` Dexie re-read. If yes, upgrade to envelope-aware per §23.65. Surfaces likely to need it: engagement.html (subscribes to most `:logged` for score recompute), exercise.html (hub surface counts). Connect + mind already swept in PM-390. Lower priority than home fix.

**PostgREST upsert hardening forward-sweep — keepalive + on_conflict audit (paired with §23.65 sweep).** PM-296 + PM-298 hardened `settings.html saveHabits` only. Every other un-awaited PostgREST write needs same two hardening points: `keepalive: true` on fetch options, and `?on_conflict=<cols>` + `resolution=merge-duplicates` (or `ignore-duplicates`) wherever the table has a UNIQUE constraint that could be hit by re-add path. Audit signal: `grep -nE "supaFetch\(['\"]/[a-z_]+.*method:\s*'(POST|PATCH)'" *.html *.js` for un-awaited or IIFE-wrapped calls. High-suspicion surfaces: `settings.html savePersona`/`saveGoal`/custom habit create/delete, cardio.html, workouts.html, mind activity writes, wellbeing-checkin.html (UNIQUE on `(member_email, iso_week)` — will re-submit 409?), nutrition_logs, weight_logs (already has upsert — confirm). 1-2 sessions Claude-assisted.

**PM-289 follow-up — Optimistic-write reconciliation watchdog (§23 candidate, hold for second occurrence).** PM-289 found `connect_checkins` POSTs silently failing in iOS WKWebView for days — optimistic Dexie write held UI in confident "posted" state with no diagnostic surface, even though server never received the row. Read paths have §23.46 ("paint truth, not placeholders") to keep them honest; write paths have no equivalent. Worth a §23 hard rule once pattern recurs: every optimistic-first write must have reconciliation watchdog that, within N seconds of optimistic Dexie write, verifies row exists server-side and surfaces visible failure banner if not. PM-289 only fixes iOS race (keepalive + awaited navigation) — if POSTs still fail in wild after this ship, new `console.error` on 4xx will show what's actually rejecting. Hold §23 rule until one more occurrence confirms failure mode generalises.

**`workout_plan_cache` contradictory UNIQUE indexes (banked, §23 candidate on second occurrence).** See PARKED PM-411 schema-architecture note. Two contradictory UNIQUE indexes (`workout_plan_cache_member_email_key` blocks multi-row; `workout_plan_cache_one_active_per_member` assumes multi-row). workout-library EF v13 paused-plan logic at L60-84 silently never works correctly. Promotes to §23 on second occurrence.

**Auth-shape gotcha (banked PM-402, §23 candidate on second occurrence).** Post-key-rotation `SUPABASE_SERVICE_ROLE_KEY` env in EFs is the new `sb_secret_*` publishable shape; `send-push` v13's `Bearer` equality check needs JWT-format `LEGACY_SERVICE_ROLE_JWT` instead. First runner deploy got `401 UNAUTHORIZED_INVALID_JWT_FORMAT`; both new EFs redeployed at v2 with corrected env. Pattern reference: `achievement-earned-push` v2 source. Promotes to §23 on second occurrence.

**Upsert-only sync EFs need reconciliation step (banked PM-410, §23 candidate on second occurrence).** `refresh-replay-videos` v1 was upsert-only; deletable upstreams left stale rows. v2 added reconciliation step. Promotes on second occurrence.

**Cross-visit dwell accumulation (tracking.js, post-launch low priority).** tracking.js v9 dwell accumulator resets on page unload — `visitStartTime` is in-memory; only `baseMinutes` (server `minutes_watched`) survives. Two sub-60s visits to same session don't sum. Anti-farm correct; wrong if we want to credit genuinely-interrupted viewing. Fix options if pursued: (a) create row early marked unqualified and accumulate server-side, or (b) track cumulative minutes per (category, date) in Dexie across page loads. Defer until post-launch + evidence it matters.

**tracking.js outbox wiring (§23.10 hardening candidate, post-launch).** tracking.js is critical activity-write path with NO outbox — direct fetch, `session:viewed:failed` to a bus nobody surfaces, no retry beyond in-visit heartbeat. Member loses connection at 60s mark and leaves → loses legit session view. vyve-offline.js has the outbox infrastructure; tracking.js was never wired. Wire writes through offline outbox. Not launch-blocking.

**NEW FEATURE — `page_visits` owned visit/dwell analytics (post-launch, ~2 sessions).** Owned, queryable record of page visits + time-on-page, Dexie→Supabase, SEPARATE from PostHog (PostHog stays as deep web-analytics/replay layer). New `page_visits` table (`member_email`, `page`, `entered_at`, `duration_seconds`, `activity_date` — one row per visit). Small shared tracker on every portal page captures entry on load + duration on `pagehide`/`visibilitychange` with `keepalive` on final beacon for iOS WKWebView. Local-first to Dexie table, background-drain via `_sync_queue`. Value: owned analytics, re-engagement triggers ("hasn't opened in 5 days"), employer insight, future member-facing "your week" view.

**NEW FEATURE — `session_schedule` table + live-session minute-windowing (post-launch, ~1.5-2 sessions).** Live-session minutes only count during actual broadcast window (e.g. 09:00-09:30 session: member on page 09:15-11:00 credited 15 min, not 105). Two pieces: (1) FOUNDATION — `session_schedule` table (`category`, `day_of_week` or date, `start_time`, `end_time`) — schedule currently only text on sessions.html. Also unblocks real "live now" home slot and real "Coming Up This Week" block. (2) tracking.js clamps live-session minutes to `overlap(visit_window, broadcast_window)`; replays unaffected. Caveat: tracking.js measures page dwell not video play-state — "present during window" is strong proxy but not true watch-tracking; true play-state needs YouTube iframe API (V2). Pairs with future minutes-based session goals.

**Local-sunset-aware hub hero rotation (future-vision, parked).** Today's three-state photo swap (morning / afternoon / night) driven by §23.55 pre-paint inline IIFE on `getHours()` with hardcoded boundaries 05-11 / 11-19 / 19-05. "19:00 = night" is wrong for half the user base half the year. London June: sunset ~21:30 (night appears 2.5hr early). Edinburgh December: sunset 15:40 (afternoon persists ~3.5hr past dark). Stockholm winter: night at 14:45. Recommended path: cached lat/lng + NOAA solar calculation. Geocode onboarding "Where are you based" → lat/lng at onboarding-EF time, persist to `members.lat`/`members.lng`. `member-dashboard` returns alongside payload, cached localStorage. Pre-paint IIFE reads cached lat/lng → NOAA solar position algorithm (~40 lines pure JS, zero deps) → today's sunrise + sunset → picks photo. <1ms, zero network, zero permissions. Falls back to 19:00 boundary if absent. ~2 hours single long session. Stripe-country fallback for ~10% geocoding failures (free-text "Where are you based" → typeahead OR country centroid). Unparks if user base reaches extreme-latitude markets, or post-trial premium-feel polish.

**Schema audit — every member-data table has `updated_at TIMESTAMPTZ` + `BEFORE UPDATE` trigger (pre-bundle / offline-correctness gate, parked post-binary).** Catalogue tables too (delta-pull depends). Add where missing in one-shot migration.

**Idempotency audit (pre-bundle / offline-correctness gate).** Every write surface generates `client_id` UUID client-side at write time. Server respects as dedupe key. mind_activities = gold standard. Verify: workouts / cardio / daily_habits / exercise_logs / custom_workouts / exercise_swaps / weight_logs / nutrition_logs / weekly_scores / wellbeing_checkins / monthly_checkins / session_views / replay_views.

**Airplane-mode device walk (pre-bundle / offline-correctness gate).** Dean's iPhone with server.url and network killed at OS level. Open every page in order. Record render behaviour (renders / spinner / empty / broken / honest offline). Anything broken or empty (when data exists in Dexie) = P0 fix. Pairs with `_sync_queue` drain hardening (drainer wakes on app launch, drains pending writes before letting user create new ones, handles ordering, resilient to individual row failures, tested against simulated 2-week-offline queue).

**Cold-start-no-network UX (pre-bundle / offline-correctness gate).** Login screen detects no-connection state, shows honest message ("VYVE needs internet for first sign-in. After that, the app works offline.").

**Fan-out-on-focus pattern (pre-bundle / offline-correctness gate).** Capacitor `App.addListener('appStateChange')` triggers incremental delta-pull when app returns to foreground. Per-table `last_sync_timestamp` stored in Dexie `_sync_meta`. `where updated_at > [last_sync_timestamp]`.

**✅ Certificates re-pillaring — SHIPPED PM-435 (2 Jun).** Done as FIVE Your Journey buckets (habits/mind/body/connect/checkins), NOT the originally-planned three Mind/Body/Connect — certs now mirror the Journey Progress tab exactly via `get_certificate_buckets()`. `pillar` column + legacy grandfather + silent backfill + certificate-checker v24 all shipped & verified. **Open follow-ups:** (1) **🎨 Certificate VISUAL DESIGN pass — `certificate.html` / `certificates.html` are functionally correct but placeholder-quality; need a proper premium design (Dean flagged 2 Jun).** (2) Mind persona "The Anchor" is a placeholder pending Lewis sign-off — he can also rename Warrior/Explorer to cleaner pillar names if wanted. (3) Goal-target re-pillaring (non-cert half of PM-159) still open. Folded into Phase 3 pillar realignment of the original PM-184 bundle-ready campaign. **PM-415 brain park (27 May): Dean flagged this as under-surfaced in the platform audit doc — the existing 5-track certs (Architect/Warrior/Relentless/Elite/Explorer) rate 4/5 in current state which masks that they don't reflect the strategic 3-pillar positioning we use in sales conversations. Audit-doc rewrites should rank certificate re-pillaring around #11-13 in priority remediation, not bury inside a 4/5 certificates rating. Timing stays post-trial because trial members earning current-track certs this month is fine (new tracks grandfather old earns).** Canonical entry — duplicate at L360 in post-trial section is a back-reference only.

**Continue Watching UI tile (PM-294 follow-up, post-soft-launch).** `replay_video_views_member_last_updated` index already powers the query — `SELECT youtube_video_id, watch_seconds, title FROM replay_video_views WHERE member_email = X AND completed = false ORDER BY last_updated_at DESC LIMIT 3`. UI shape: horizontal carousel on replays.html above playlist tiles, three cards showing "Resume from MM:SS" with thumbnail + remaining time. Tap = mountPlayer with `startSeconds` via YT IFrame API. Mockup-first. Sequence after soft-launch trial data confirms carousel is wanted — premature before knowing whether members care about resume vs restart.

**Per-instructor drop-off analytics (PM-294 follow-up, internal-only).** `host_name` denormalised on every `replay_video_views` row. Simple SQL `GROUP BY host_name, ROUND(watch_seconds * 100.0 / NULLIF(total_seconds, 0)) ORDER BY 2` gives drop-off curves. Consumer surface: internal-only dashboard tile in Command Centre (Lewis/Calum/Phil). Not member-facing. Build after first month of trial-scale data (~30 watches per instructor). Single EF + dashboard tile, no schema change.

**Per-category cumulative watch-time achievements (PM-294 follow-up, post-trial).** New metrics in `achievement_metrics` — `yoga_minutes_watched`, `mindfulness_minutes_watched`, `workouts_minutes_watched`, one per active category — tiers at 5/10/15/30/60/120/300 cumulative minutes (placeholder, design against real distribution after ~1 week trial data). Evaluator sums `watch_seconds` from Dexie's `replay_video_views` (PM-294) AND `session_live_views` (PM-304), filtered by `category`, divided by 60. Cumulative across all play sessions. Trigger event-driven: replay tracker publishes `replay:viewed` every 30s of accumulated playback; live tracker publishes `live:viewed` with identical payload. Achievements subscriber on both events re-evaluates per-category sum from Dexie and stamps `member_achievements` if tier crosses — instant unlock toast on device, no server round-trip. Existing nightly sweep stays as cross-device consistency safety net.

**Replay-aware charity math (Lewis-blocked).** Currently 30-activities-per-month charity counter reads legacy `replay_views` (page-presence attribution, dormant since PM-235). PM-294's `replay_video_views` is more honest signal — members who actually watch vs who happened to be on page. Question for Lewis: switch charity math to new table, or stay on legacy to avoid breaking 30-activities denomination mid-trial? Sub-question: minute-weighted charity attribution (1 charity month per N total watch-minutes rather than per N completed views) possible via `SUM(watch_seconds)` but different mechanic — Lewis's call. Park until post-trial review.

**PM-315 device-walk validation + PM-316+ state-machine fix.** PM-315 CSP fix for YT IFrame API not yet device-validated. Hypothesis-confirmed by PM-311 diagnostics but not walked. Resumption procedure documented (schedule test `calendar_occurrences` row with `starts_at = now() + 30s`, invoke `session-publish` via pg_net, Dean force-refreshes app, starts Riverside stream, verify debug strip shows `ytLoaded: true` / `playerConstructed: true` / `lastState: -1 → 3 → 1` / `watchSeconds: 0 → 30+` / `hasFirstWrite: true`, confirm row in `session_live_views`). PM-316+ bug: state machine resolves LIVE strictly on clock-time `row._start <= now < row._end`. If YouTube `enableAutoStart=true` flips broadcast live BEFORE scheduled `starts_at`, page sits in PRE_ROLL even though YouTube is broadcasting. Tracker doesn't attach. Workaround per memory #23: test rows `starts_at = now()` or `now+30s`, never `now+10min`. Architectural fix: state machine queries YouTube broadcast `lifecycleStatus`. Three options — cron-driven flag on `calendar_occurrences` (zero client-side YouTube API exposure, 5-min cron lag) / client-side YouTube embed status probe via `YT.Player.getPlayerState()` (real-time, requires iframe earlier than current PRE_ROLL CSS hides it) / hybrid. Pick after sketch session, likely option 2.

**Engagement-v2 recompute fan-in retrofit (low urgency, wait-for-glitch).** Sibling to index.html `_rerenderHome` retrofit. Bus subscribers currently fan out individually; consolidate into a single recompute on writes-batch.

**Affirmations per-day-cap design issue (parked).** Identified in PM-379 audit. Defer.

**`session-rp.js` playlist ID lookup migration to Dexie catalogue (PM-390 follow-on, banked).** Currently each rp shell exposes `window.VYVE_SESSION.playlistId` inline; session-rp.js reads it directly. When `replay_playlists.youtube_playlist_id` changes for any slug, every rp shell needs manual edit. Move to Dexie lookup via slug — mirrors PM-377/PM-378/PM-384 pattern, lets Lewis manage replay playlists from Supabase Studio. Promotion: next time `replay_playlists` row needs to change AND any rp shell touched.

**Periodic rp-shell drift audit (PM-390 follow-on, banked).** events-rp drifted to standalone 17.6KB page without being caught. Worth periodic grep across `*-rp.html` for byte-count outliers — any rp shell >5KB probably drifted from canonical. Could be one-shot playbook entry.

**Refactor onboarding v74 to call `generate-workout-plan` EF.** Remove ~120 lines of inline duplicated logic. EF has richer implementation (dedicated programme-overview step, better prompts, cleaner video enrichment) than onboarding's inline copy. ~2hr, zero-risk if deployed atomically.

**In-app onboarding fallback.** Simplified questionnaire inside portal for members with no workout plan (~3-4hr).

**Onboarding resilience: save-answers-first.** Progressive answer saving + error screen (~2-3hr).

**Replay 3 throwaway EFs (PM-410 cleanup).** `replay-inventory-tmp`, `replay-archive-tmp`, `replay-ghost-cleanup-tmp` still ACTIVE in Supabase but dormant. Dean to delete via Supabase dashboard when convenient.

**EF cleanup of one-shot patchers (recount needed).** ~32 still-ACTIVE candidates per the 9 April security audit only partially actioned: `seed-library-1`, `seed-library-2`, `seed-b1`, `create-ai-decisions-table`, `setup-ai-decisions`, `setup-member-units`, `trigger-owen-workout`, `trigger-callum-workout`, `thumbnail-audit`, `thumbnail-upload`, `thumbnail-batch-upload`, `generate-stuart-plan`, `send-stuart-reset`, `monthly-checkin-test`, `run-monthly-checkins-migration`, `run-migration-monthly-checkins`, `resend-welcome`, `delete-housekeeping`, `send-test-welcome`, `send-test-push`, `inspect-members-schema`, `create-test-member`, `add-exercise-stream`, `force-cache-refresh`, `update-brain-changelog`, `debug-cert-content`, `debug-show-file`, `test-html-render`, `smoketest-ach-push`. Keep `ban-user-anthony` if ban workflow still in use. Composio doesn't expose delete-EF tool — needs Supabase CLI/dashboard. [VERIFY: confirm against current Supabase EF list before action.]

## Lewis-blocked

**Connect "This Week's Challenge" content (PM-415 brain park, 27 May).** Connect hub challenge surface is built end-to-end — `connect-challenge.html` page, `weekly_challenges` + `weekly_challenge_participation` tables live since PM-186/187 (22 May), `connect-challenge-summary` EF renders summary on connect.html. What's missing is a real challenge row in the database. Lewis hasn't seeded one. Same shape as the Replays content refill — engine is ready, content is the gap. Lewis adds first challenge via Supabase Studio (single INSERT into `weekly_challenges`) and the surface lights up. Recommend writing 4-6 weeks of challenge content ahead so the surface stays populated without Lewis touching it weekly.

**Engagement v2 voice copy pass (Engagement Score v2 #6).** All v2 band copy + 5 pillar explainer popovers + "How your score works" sheet body + 6 pillar empty-state hints.

**Re-engagement push thresholds copy (Engagement Score v2 #5).** 5 pillar-gap notification copy variants (one per pillar).

**Achievement tier curve overhaul v1 CSV (PM-358).** v1 per-tier copy review must land first. Then bulk-UPDATE per-tier title/body/copy_status='approved', then curve overhaul → v2 CSV → Lewis sign-off → bulk-UPDATE final.

**At-risk-streak push copy.** Concise, action-oriented, no emojis ("Your 11-day streak is at risk. Log anything to keep it alive."). Multiple variants for streak length brackets (3-6, 7-13, 14-29, 30+).

**Persona welcome copy spot-check in `persona_welcome_copy`.** Dean finalises lines via UPDATE; sweep-the-fallback-to-match when Lewis spot-checks.

**Mind v1 Lewis copy review.** affirmations / journal / breathwork seed content. `COPY_LEWIS_REVIEW` tags throughout.

**PF-13 hydration COPY_TABLE finalisation.** 23 entries tagged `COPY_DEAN_FINAL` in `/hydration.js`. ~30-45 min Dean writing time.

**In-App Tour copy + screenshot approval.**

**Calorie-target habit (PM-286.x).** New habit in `habit_library` auto-ticking when within daily calorie target. Wording is clinically sensitive — "stay within calorie allowance" frames as restriction (problematic for RIVER/HAVEN), "hit your protein and calorie targets" frames as performance (fine for NOVA/SAGE/SPARK fat-loss or muscle-gain). Phil sign-off mandatory. Persona-conditional assignment logic doesn't exist — needs new rule in onboarding/recommendation flow ("never auto-assign to RIVER/HAVEN regardless of goal_focus"). Autotick rule via `habit_library.health_rule jsonb` doesn't currently support `nutrition_logs` totals — existing autotick is HealthKit-driven. New evaluator code path or extend existing.

**Live check-in form variants (PM-213b) Phil sign-off on mindfulness variant.** Phil-blocked.

**B2B volume tier definition (pre-first-enterprise-contract).** Dean + Lewis.

**Annual pricing discount % decision.**

**5 disabled Make tasks — keep or remove decision.**

**Public launch comms draft.**

**HAVEN clinical sign-off (Phil-blocked).** Formally decide: approve as-is or gate pending professional review. HAVEN actively being assigned (Conor Warren, 15 April).

**Replay-aware charity math (Lewis-blocked, Infra/Data above).**

**Re-engagement copy review.** Bulk-approve subjects + body copy across the A/B ladder (A_48h/96h/7d/14d, B_3d/7d/14d/30d). Current copy carried forward from v7 staticBodies + AI persona overlay; structurally correct but not yet copy-passed post-rewrite.

**Login auth pages copy review.** Bulk approval gate before next round of polish.

## Calum-blocked (external dependency)

**Workout Engine v2 (parked 27 April 2026, awaiting Calum's filled inputs pack).** Architecture decided: deterministic engine (filter → score with context weights → rank → fill slots) replaces AI exercise selection. AI only for programme name/rationale (Sonnet 4) + Layer 2 reviewer (Haiku 4.5). Drops cost ~30× AND raises quality by encoding Calum's expertise as data. Stages on restart: import 203+67=270 scored exercises into `exercise_scoring` table + name normalisation layer → deterministic engine in TS in `generate-workout-plan` v12 behind feature flag → persist new onboarding fields (`priority_muscle`, `session_length_workouts` columns on `members`) + onboarding EF v78→v79 → code Calum's 20 QA scenarios as automated tests → shadow mode ~50 onboardings → cutover after Calum sign-off → Movement & Wellbeing engine (Dean's call: separate path from workout engine). Inputs pack drafted: `VYVE_Inputs_Pack_for_Calum.docx` (13-page structured questions doc) + `VYVE_Exercise_Scoring_Gap.xlsx` (67-exercise gap list in Calum's format).

## Post-trial / post-launch

**PM-358 tier curve + naming overhaul.** See Home / engagement bucket. After Lewis v1 copy review lands.

**Achievements badge artwork upgrade.** Current SVG generator covers 4 shapes × 4 tints in `svgTrophy()`. Future upgrade via AI image gen (Gemini + Claude art direction with VYVE brand grade). Drop-in replacement of `svgTrophy()` calls. Data layer doesn't change.

**Index.html dashboard slot — latest unseen / closest inflight achievement tier.** ~1 session low risk (reads existing `getMemberAchievementsPayload()` output). Phase 3 sub-task confirmed unstarted PM-3.

**Background audio play for mind/sleep tracks.** See Mind hub. Post-trial decision once engagement data confirms which content members want to background.

**Continue Watching tile.** See Infra / Data.

**Per-instructor drop-off analytics.** See Infra / Data.

**Per-category cumulative watch-time achievements.** See Infra / Data.

**Page_visits owned analytics + session_schedule windowing.** See Infra / Data.

**Local-sunset-aware hero rotation.** See Infra / Data.

**Profile identity remaining work.** See Connect hub (avatar library, Settings UI, Connect first-load modal, photo upload architecture, GDPR cleanup).

**In-App Tour (PF-23).** See Onboarding.

**View Transitions API wire (PM-394 plan item).** Lower priority since snapshot-first paint already solves visible flicker; ship as polish item for cross-tab nav animation. One chat.

**Persistent-shell SPA migration (Option 3 from PM-394, architecturally-correct answer).** 8-11 hours / 3 sessions of Claude-assisted work with full week headroom. Post-binary parked.

**Achievement tier-threshold rework (PM-3 future vision).** Several ladders feel sparse at upper end (e.g. habits jumping 100 → 250 → 500 → 1000). Surgical add-tiers-between-existing-thresholds — preserves existing earned `member_achievements` rows, preserves Lewis-approved tier copy via `copy_status='approved'` gate. Workflow: audit 327 tiers identifying worst-spaced ladders → draft new in-between tier copy → bulk-approval doc to Lewis → SQL migration adding rows with `CASE WHEN copy_status='approved'` protection. Estimated 2 sessions. Trigger: real cohort feedback that next-tier-too-far is hurting engagement, or part of broader Achievements polish. Folded into PM-358 above.

**Locked / mandatory habits model (PM-153 follow-on).** Habits VYVE assigns to a member — monthly theme habits, autotick HealthKit set — should be MANDATORY. Member cannot remove. CAN add their own habits on top and remove the ones added themselves. `removable` boolean on `member_habits`, set false where `assigned_by IN ('admin','onboarding','autotick','theme_update')` and true where `assigned_by = 'self'`. Settings picker renders locked habits as un-checkboxable with "Set by VYVE" label (Lewis copy gate on label). Correct `autotick-7b` `created_by` mistag to `null` as part of same work (4 library rows, 3 members each). Not trial-blocking. Pairs with `member_habits` re-add duplicate fix (no unique constraint on `(member_email, habit_id)` — soft-delete + re-add creates second row; add unique + upsert that revives existing row).

**Certificate re-pillaring — SHIPPED PM-435.** See canonical entry in Infra / Data above. Remaining: visual design pass + Mind persona "The Anchor" Lewis sign-off.

**Accessibility — large text + WCAG pass.** Flagged by Alan 21 April (struggles to read portal at large-text iOS setting). Four-option plan at `plans/accessibility-large-text.md`. Option 1 (restore pinch-zoom) is 10min; Option 2 (in-app text-size toggle in Settings) is ~half day. Full WCAG 2.1 AA pass needed before public sector / Sage procurement.

**Onboarding "Where are you based" tightening.** Free-text → typeahead (city autocomplete) for cleaner geocoding. Pairs with local-sunset-aware rotation. OR accept ~10% failures with Stripe-country centroid fallback.

**Other "Soon" items (lower-traffic):** Load `vapid.js` on other portal pages (currently only index.html has push subscription), `certificate-checker` push notification on cert earned, Hash emails before sending to PostHog.

**Other "Later" items:** Social activity feed (spec pending Lewis sign-off on 7 product decisions), Dashboard widget customisation, Persona context modifier system, AI weekly goals Phase 2 (behavioural goals from check-in data), Weekly progress summary email (blocked on Lewis copy), PostHog / Supabase Auth identity wiring, Milestone message system, Today's Progress dot strip (blocked on Lewis copy), BIMI logo in inbox sender avatar (staged: audit SPF/DKIM/DMARC → UKIPO trademark pre-Sage contract → VMC + BIMI DNS post first enterprise contract).

**Grants & Partnerships:** National Lottery Awards for All application, The Fore grant (register June/July 2026), WHISPA research partnership (monitor May 2026 launch).

## Backlog — security & hygiene

**Security Quick Wins (from 16 April audit — long-tail).**
- Fix XSS: escape `firstName` in `index.html` before `innerHTML` rendering
- Fix `running_plan_cache` RLS: change `public_update` policy to `member_email = auth.email()`
- Fix INSERT policies on `session_chat`, `shared_workouts`, `monthly_checkins`
- Remove 3 redundant RLS policies on `members` table
- Add explicit service-role-only policies to the 7 aggregation/admin tables (document intent)

**Brain Hygiene (from 18 April reconciliation — still open).**
- Full rewrite of `brain/master.md` — accumulated schema + EF churn since last rewrite warrants own session, not patches. (Note: master.md is on a known cadence; this is a marker.)
- `monthly-checkin` integration smoke test — Deno test against throwaway test member before each deploy. The column drift that caused the 500 would have been caught by a single POST test against live schema.
- Delete `staging/onboarding_v67.ts` — stale by 7 versions (live is v74). Misleads future AI sessions.
- Archive pre-April changelog entries into `changelog-archive/2026-Q1.md` — current changelog is 22815 lines and growing unboundedly. [VERIFY: confirm current line count and timing.]
- Document user-ban workflow — `ban-user-anthony` v8 exists; anthony.clickit@gmail.com is in `auth.users` with no `public.members` row (orphan). Decide reusable pattern if bans happen again.
- Migrate `exercise.html` + `movement.html` off `#skeleton` + `#app` dual-main pattern. Both pages have `<div id="skeleton"><main>...</main></div>` wrapper before `<div id="app"><main>...</main></div>`. nav.js hardened via `document.body.prepend` so dual-main no longer breaks nav, but pattern is fragile — future utility doing `document.querySelector('main')` picks skeleton one. Single `#app` root with internal `data-state="skeleton|ready|error"`. Pair with Design System Phase D.
- Housekeeping from PM-378/PM-379 cross-repo collisions: rename `brain/staging/architecture-map-pm378.md` + sibling PM-379/PM-380 staging files to suffixed labels (`pm378b.md` etc) to disambiguate. No downstream references — single grep + file renames + single brain commit.

**Design System — Phase Roadmap (remaining).**
- Phase D: Component primitives (~2 days) — Shared `.btn`, `.card`, `.input`, `.modal-sheet` classes. Removes 72 unique button class names, 90 unique card class names.
- Phase E: Typography + spacing scale migration (~1 day) — Replace 118 unique font-size values and 264 unique padding values with `--text-*`, `--space-*` tokens.
- Future: `VYVE_Health_Hub.html` redesign + PWA linking — out of scope for Phases A-E.

**External legal / compliance markers.**
- BIMI staging (see Post-trial section).
- HealthKit submission-scope decision: submit all 7 reads, or phase to 4 (workouts + weight + steps + active_energy) with v1.1 for HR/sleep/distance.
- Privacy.html HealthKit section + Lewis sign-off + App Store Connect questionnaire (per next iOS submission).

## Recently shipped (last 7 days)

Captured here so the at-a-glance state of the recent past is one short list, not 24 SHIPPED blocks of varying length. All have changelog entries.

- **PM-413** (26 May) — iOS 1.4 build 3 + Android 1.0.5 versionCode 50 BOTH submitted to App Review. Bundle session execution end-to-end.
- **PM-412** (26 May) — iOS splash storyboard fix landed in vyve-capacitor remote `4f5f55ae`.
- **PM-411** (26 May) — Brain park / Bundle-prep prompt + Body-hub overhaul campaign documented for Thursday pickup.
- **PM-410** (26 May) — Replay catalogue wipe via YouTube archive + `refresh-replay-videos` v2 reconciliation. 33 test videos archived to private YouTube playlist. All replay-side Supabase wiped clean.
- **PM-409.b** (26 May) — Pre-bundle debug surface gating (debug strip + reset achievements + unified dev-panel flag).
- **PM-409** (26 May) — Facebook Make connection refresh scrubbed from forward-looking surfaces. Pre-bundle hygiene continuation of PM-407.
- **PM-408** (26 May) — Analytics taxonomy lands before Capacitor bundle freeze.
- **PM-407** (26 May) — Stale Lewis-blocker scrub: Brevo logo (never existed), health disclaimer (done), weekly+monthly check-in slider copy mirror (done).
- **PM-406** (26 May) — Pre-bundle offline scope fix; chart.umd.js vendored locally; PF-14c §2a violation closed.
- **PM-405** (26 May) — Bottom-nav opacity split on Connect + offline scope audit pre-bundle.
- **PM-404** (26 May) — In-App Tour PF-23 elevated to next-up P1 after bundle ships.
- **PM-403.b** (26 May) — Pre-bundle monitoring restoration design end-to-end (Sessions A+B build prompt drafted). Build executes next chat. Three-times-daily digest cadence locked, severity recalibration locked, circuit breaker threshold locked.
- **PM-402** (26 May) — Broadcast push infrastructure end-to-end. Lewis-facing manual broadcast UI in Command Centre + scheduled-push cron rails. SQL: `is_admin` RPC + `admin_broadcast_log` + `broadcast_schedules` + `resolve_broadcast_audience(jsonb)`. Two new EFs: `admin-broadcast-push` v2 + `scheduled-push-runner` v2. pg_cron job 28. Live at admin.vyvehealth.co.uk/#/broadcast.
- **PM-401.b → PM-401** (25 May) — Connect-page flicker arc closed in three atomic vyve-site ships. PM-399 Your Journey snapshot, PM-400 live carousel background-image + reaction-tap site surgical patch, PM-401 renderRecentCheckins same-layout guard. Plus PM-396/397/398 Home tab-in flicker fixes (value-mutation snapshot, layout-shift reservation, habit content-late instant-paint).
- **PM-395** (25 May) — Reaction-tap cache mutation pattern (closes tap-time own-only fallback flicker).
- **PM-393** (25 May) — Real fix to Connect tab-in flicker via inverted cache-first paint ordering.
- **PM-392** (25 May) — Connect feed prefetch + cache-first paint.
- **PM-391** (25 May) — Revert PM-390 reaction-subscriber double-mutation.
- **PM-390** (25 May) — §23.65 envelope-trusted subscriber sweep on connect.html + mind.html; engagement-v2 L1682 dead subscribe converted; events-rp.html unified onto canonical session-rp shell.
- **PM-389.b** (25 May) — Activity Breakdown tile counts on engagement-v2 rewritten Dexie-direct.
- **PM-388.b** (25 May) — Mood check-in faces swapped to canonical Lucide glyphs.
- **PM-387.b** (25 May) — JS twins of PM-386 SQL fix + Activity Breakdown tile parity for Body/Connect.
- **PM-386.b** (25 May) — Mind/Body double-counting class fixed at root.
- **PM-385.b** (25 May) — tracking.js retired from 8 *-live.html shells.
- **PM-384.b** (25 May) — checkin_questions catalogue (Tier 2.3 from PM-379 audit).
- **PM-382.b** (25 May) — body:logged aggregator publish from the three Body publishers.
- **PM-381.b** (25 May) — bus.js event-name regex loosened to 2+ colon segments.
- **PM-379.b** (25 May) — Monthly check-in recap rebuilt around canonical 4 pillars (Habits/Body/Mind/Connect) + EF v19 4-pillar activity rollup + AI prompt restructured.
- **PM-378** (25 May) — Podcast platform links catalogue: `podcast_platforms` table + podcast.html `.hero-listen` rewritten as Dexie-read with FALLBACK_PLATFORMS cold-paint.
- **PM-377** (25 May) — How-to library catalogue: `how_to_resources` table + how-to-pdfs.html / how-to-videos.html rewritten as catalogue reads.
- **PM-376** (25 May) — Bottom nav Body icon swapped dumbbell → person-standing (Lucide).
- **PM-375** (25 May) — Member Prompts system: Lewis-driven in-app questionnaires.
- **PM-372** (25 May) — `hydration.js` COPY_TABLE migrated to `public.persona_welcome_copy` (Tier 2.1).
- **PM-369** (25 May) — Haptics expansion across settings.html (13 call sites).
- **PM-367** (25 May) — Mind videos catalogue migration.
- **PM-365** (25 May) — Haptics: nutrition.html water stepper + weight log + TDEE save + log-food.html food add/delete.
- **PM-364** (25 May) — Haptics bridge swept platform-wide (haptics.js loaded on 41 activity surfaces).
- **PM-363** (25 May) — Achievements toast haptic wire at `showNext()` chokepoint.
- **PM-362.b** (25 May) — Weekly check-in recap rebuilt around 4 pillars.
- **PM-360** (25 May) — Home-page habit sibling renderer (paired with PM-359 habits.html haptic).
- **PM-359** (25 May) — Haptics: habits.html log tap + index.html long-press V-logo + settings.html theme + notification toggles.
- **PM-354/355** (25 May) — Brain whole-file overwrite hazard; §23.58 codified.
- **PM-353** (25 May) — Achievements v3 Dexie-first evaluator rollout, all 6 pillars LIVE.
- **PM-319** (25 May) — Mind activities watch tracking.
- **PM-315** (25 May) — CSP fix for YouTube IFrame API on all 8 *-live.html shells (root cause of PM-304 silent failure).
- **PM-310 → PM-312** (25 May) — Live tracker debug surface; Settings Reset Achievements + Force Refresh App buttons.
- **PM-307** (25 May) — Movement first-class. `movement_activities` table live with 24 rows migrated, RLS + triggers match `mind_activities`. movement.html rewritten single-table, movement-history.html simplified, engagement-v2.html BODY metric extended to sum workouts+cardio+movement. Bus event taxonomy locked — `movement:logged` from movement.html only.
- **PM-300/301/305** (25 May) — engagement-v2.html three-tab shell + Your Journey rename + count hero promotion + charity callout + v1 engagement.html retired (redirect-only).
- **PM-298 + PM-296** (24 May) — Settings habit-save Supabase write failure fix (keepalive + on_conflict + merge-duplicates).
- **PM-295** (25 May) — Engagement Score v2 implementation phases 1-4 (schema, v2 SQL function alongside v1, JS port with parity 72/72 on real data, new engagement-v2.html behind `?score=v2` flag, bus subscriber wiring on all score-affecting events).
- **PM-293/291/287/286/285** (24 May) — Home habit surface, cross-page sync, pot-coloured habit tiles.
- **PM-286** (24 May) — PM-215 YouTube broadcast-creation cron paired with PM-251 consumer contract. `session-publish` EF v1 + `session_categories` + `session-publish-hourly` pg_cron.
- **PM-284 + PM-283** (24 May) — Focus done-state device validation (body.is-completed auto-stamp via MutationObserver, page-reopen done-restore in shared chrome).
- **PM-278** (24 May) — `VYVEHaptics` bridge shipped.
- **PM-274 phase 1** (24 May) — Twelve `/focus/<slug>.html` pages live with shared chrome + §23.39 Dexie-write dispatch. Home carousel taps now route to functional pages.
- **PM-267b → PM-261b** (24 May) — Seven-commit hero arc brought home into full §23.55 + §23.57 hub-page compliance.
- **PM-256/257** (24 May) — Home redesign atomic ship.
- **PM-255** (24 May) — Past Sessions + My PRs Dexie wiring (promoted to standalone `personal-bests.html` + `workout-history.html`).
- **PM-251** (23 May) — Live session pages redesign: schema migration + 8-shell rewrite + 5-state engine + sessions.html hub gate end-to-end.
- **PM-250** (23 May) — Web-shell rotate-overlay deletion + vyve-capacitor commit locking portrait at OS layer.
- **PM-242** (23 May) — Profile identity partial ship: read-side identity rendering on connect-feed.html + connect.html Recent Check-Ins LIVE.
- **PM-235b** (~24 May) — Hourly replay refresh cron.
- **PM-228** (24 May) — `member-avatars` Storage bucket.
- **PM-225** (24 May) — `public.taglines` table.
- **PM-215** (24 May) — YouTube broadcast-creation cron landed (paired with PM-251 consumer).
- **PM-213** (23 May) — Live session pages redesign superseded by PM-251.
- **PM-212 + 212.1-.7** (23 May) — Podcast hub MVP + six same-day follow-ups.
- **PM-211 spec** (23 May) — Single source of truth for live sessions specced (build deferred post-launch — see Connect hub).
- **PM-210b** (23 May) — Connect calendar member UI shipped end-to-end. `calendar_occurrences` table, db.js SCHEMA_V9, sync.js plan entry + CATALOGUE_INVALIDATION_KEY bump to `pm210-calendar-occurrences`, connect-calendar.html NEW 798 lines.
- **PM-209 + PM-209.1** (22 May) — Mind hub Today's Focus tile: thumbnail fills the card; §23.52 earned.
- **PM-201/200/199/198** (22 May) — Connect hub posted-state polish + community preview EF + reaction count from Dexie + Elite hero card.
- **PM-187 + PM-186** (21 May) — Connect Phase 2: spec lock + 5 tables migrated + counters-render-truth (§23.46).

## Dexie resilience — PM-436 follow-ups (added 2026-06-02)
- **Graceful open-failure fallback** — when `db.open()` rejects / `VYVELocalDB.isEnabled()===false`, aggregate surfaces (home rings `loadPillarCounts`, habits.html) must NOT render a confident `0/30` / "no habits". Either a neutral placeholder ("—") distinguishing "unknown" from "zero", or fetch server-side pillar counts (extend `member-dashboard` EF to emit the 5 lifetime ring counts — today no server source: `member_home_state` carries old-vocab `*_this_month` + v2 engagement points, not lifetime per-pillar). Also covers the separate iOS "IndexedDB lost" (PF-30) pattern. Talk-first (read-path blast radius). §23.83 corollary.
- **`dexie_open_failed` / `dexie_idb_lost` alert** — telemetry already emitted in db.js open `.catch` (PostHog). Wire a threshold alert so this class is caught instantly, not by eye. Quick.
- **Option B — multi-plan-local mirror via NEW store** — re-do PM-425's goal (both workouts + movement wpc rows mirrored locally) via a new id-keyed store (e.g. `workout_plan_cache_v2`), repoint sync.js persist + workouts-programme.js / movement.html reads, leave the old member_email store untouched. Post-launch, with a real-iPhone upgrade pass. Never re-key the existing store (§23.83).
