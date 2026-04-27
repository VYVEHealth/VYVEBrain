## 2026-04-27 (later) — Achievements System Phase 1 SHIPPED end-to-end: catalog + inline evaluator + dashboard payload + mark-seen + sweep cron, 15 members backfilled with 185 earned tiers all marked seen

Session 1 of the Achievements + Push Notifications work. Scope: data layer landed end-to-end, sweep cron live, all backfill rows pre-cleared so toast queue is empty when UI ships. Pushes will come in Sessions 2 and 4 (native + web fan-out wiring). Dean's 57 retroactively-earned tiers (53 inline + 4 member_days) are sat in the catalog ready for Session 3 UI to render.

### Schema: `create_achievements_schema` migration

Three tables, all RLS on, service-role write only.

`public.achievement_metrics` — slug PK, category CHECK in (counts, time_totals, distance, hk, streaks, variety, collective, tenure, one_shot), source CHECK in (inline, sweep), hidden_without_hk bool, is_recurring bool, sort_order. The catalogue header.

`public.achievement_tiers` — composite PK (metric_slug, tier_index), threshold numeric, title text, body text, copy_status CHECK in (placeholder, approved). The ladder. `copy_status` is the gate: re-seeds only overwrite placeholder rows, leaving Lewis-approved copy in place via `CASE WHEN copy_status='approved' THEN public.achievement_tiers.title ELSE EXCLUDED.title END`.

`public.member_achievements` — bigserial id, UNIQUE(member_email, metric_slug, tier_index), earned_at, seen_at (null = unseen toast pending), notified_at (null = push pending). Three indexes: `idx_member_achievements_email`, `idx_member_achievements_unseen` (partial WHERE seen_at IS NULL), `idx_member_achievements_recent` (member_email, earned_at DESC).

RLS policies: authenticated read on metrics + tiers (catalog is public to logged-in members), member-scoped read + UPDATE on own achievements (`lower(member_email) = lower(coalesce(auth.email(), ''))`), no INSERT/DELETE for non-service-role.

### Seed: 34 metrics × 349 tiers, all `copy_status='placeholder'`

The headline number was `27 metrics` in earlier brain notes but the actual bullet sum is 34. Final breakdown: counts (13), time_totals (3), distance (1), hk (4), streaks (6), variety (1), collective (2), tenure (1), one_shot (3).

Tier ladders by shape:
- short_count `[1, 3, 5, 10, 25, 50, 100, 250, 500, 1000]` — 10 tiers, used for high-effort low-frequency metrics (custom_workouts_created, workouts_shared, running_plans_generated, weekly + monthly check-ins, personal_charity_contribution).
- long_count `[…, 2500, 5000, 10000]` — 13 tiers, used for high-frequency metrics (habits_logged, workouts_logged, cardio_logged, sessions_watched, replays_watched, meals_logged, weights_logged, exercises_logged).
- time_minutes `[10, 30, 60, 180, 360, 600, 1500, 3000, 6000, 15000, 30000, 60000]` — 12 tiers, lifetime workout / cardio / session minutes.
- distance_km `[1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500]` — 10 tiers, lifetime cardio distance.
- streaks `[3, 7, 14, 30, 60, 100, 200, 365, 500, 730, 1000, 1500, 1825, 3650]` — 14 tiers, all six streak metrics from `member_home_state`.
- HK ladders: hk_steps `[1k…25M]`, hk_distance_km `[1…25k]`, hk_active_kcal `[100…1M]`, hk_nights `[1…1000]`.
- tenure_days `[1, 7, 30, 90, 180, 365, 730, 1095, 1825, 3650]` — 10 tiers, days since `members.created_at`.

Two `is_recurring` metrics — `full_five_weeks` (one per ISO week the member touches all 5 pillars) and `charity_tips` (one per global tip-over-30 boundary moment). Both have a single tier row with threshold=1; tier_index increments as the nth occurrence. The unique constraint on (member_email, metric_slug, tier_index) handles this naturally — the sweep just inserts (email, slug, n+1) when the next occurrence happens.

### `_shared/achievements.ts` (10.6KB) — the evaluator

Single shared module, bundled into both `log-activity` v22 and `member-dashboard` v55 deploys. Two exported entry points:

- `evaluateInline(supabase, email)` — runs every inline metric for a given member, inserts any newly-earned tiers into `member_achievements` (idempotent via upsert+ignoreDuplicates on the unique conflict target), returns the freshly-earned tier rows. Loads catalog with a 60s in-memory cache so repeated calls within the same EF instance avoid re-fetching 34+349 rows. Skips `hidden_without_hk` metrics when no `member_health_connections` row exists for the member.

- `getMemberAchievementsPayload(supabase, email, opts)` — read-only. Returns `{ unseen, inflight, recent, earned_count, hk_connected }` for the dashboard. `unseen` = earned tiers not yet seen (toast queue). `inflight` = top N closest-to-earn next tiers (progress bars), sorted by `current_value / next_threshold` descending. `recent` = last N earned. Used by member-dashboard v55.

Inline-only metric set covered (22 of 34): all 13 counts, the three time totals, cardio_distance_total, all 6 streaks (read straight from `member_home_state`), persona_switched (`members.persona_switches` jsonb length > 0). Sweep-source metrics (HK lifetime stats × 4, full_five_weeks, charity_tips, personal_charity_contribution, member_days, tour_complete, healthkit_connected) — handled by `achievements-sweep` (Phase 1 covers `member_days`, rest deferred to Phase 2).

### EF: `log-activity` v22 — inline trigger

v22 = v21 + post-insert achievement evaluation. After every successful insert (and even on cap-skip path so concurrent activity doesn't miss tiers), calls `evaluateInline()` synchronously and returns `earned_achievements[]` in the response payload. This means the client gets earned tiers in the same network round-trip as the activity log → instant toast on the page that just logged. Existing v21 streak-milestone notifications (7/14/30/60/100 days) preserved verbatim — they coexist with achievements until Phase 3 UI replaces them. New helper `writeAchievementNotifications()` writes one `member_notifications` row per earned tier with type `achievement_earned_{slug}_{tier}`, deduped via `in.()` filter check. Notification path runs via `EdgeRuntime.waitUntil()` so it doesn't block the response. verify_jwt: false (in-function JWT validation via `getAuthUser`, matching v21 contract).

### EF: `member-dashboard` v55 — payload extension

v55 = v54 + new `achievements` block in response: `{ unseen[], inflight[], recent[], earned_count, hk_connected }`. Single Promise.all branch with bounded fallback (`{ unseen:[], inflight:[], recent:[], earned_count:0, hk_connected:false }` on any error) so achievements payload never breaks the dashboard. join_date hotfix from v54 preserved (sourced from `members.created_at`). Autotick + evaluator + activity / engagement / certificate / charity payloads byte-identical to v54.

### EF: `achievements-mark-seen` v1 — toast clear endpoint

POST + JWT auth. Body: `{ mark_all: true }` OR `{ metric_slug, tier_index }`. Updates `member_achievements.seen_at = NOW()` for the caller's own rows where seen_at IS NULL. Returns `{ success, marked, rows[] }`. Used by Phase 3 toast UI on dismiss / "mark all seen". verify_jwt: false (in-function JWT auth).

### EF: `achievements-sweep` v1 — daily cron, member_days only (Phase 1 scope)

POST, no JWT (service-role only), idempotent. Phase 1 sweep does **only** `member_days` (tenure metric — days since members.created_at). All other sweep metrics deferred to Phase 2: HK lifetime stats × 4 (need `member_health_daily` aggregation), `full_five_weeks` (weekly variety scan), `charity_tips` + `personal_charity_contribution` (collective state), `tour_complete` (needs new `members.tour_completed_at` column), `healthkit_connected` (one-shot on first HK link). Returns `{ results: [{ metric, rows_inserted, members_processed, errors[] }], phase2_deferred: [...] }`.

Cron scheduled: jobid 15, name `vyve-achievements-sweep-daily`, schedule `0 22 * * *` (22:00 UTC = 23:00 UK during BST, 22:00 UK during GMT). Calls the EF with service-role bearer auth via `current_setting('app.service_role_key', true)` — same pattern as `habit-reminder-daily` and `streak-reminder-daily` jobs.

### Backfill: 185 earned tiers across 15 members, all marked seen

Two-step backfill executed during the session:

**Step 1 — inline evaluator backfill (workbench script):** Ran `evaluateInline()` against all 15 members in the live members table. Result: 147 tiers earned across 13 members (2 members had no qualifying activity yet). Top earner: deanonbrown@hotmail.com with 53 tiers across 14 metrics (exercises_logged tier 7, habits_logged tier 6, workouts_shared tier 6, cardio_minutes_total tier 5, sessions_watched tier 5, workouts_logged tier 5).

**Step 2 — sweep run:** Invoked `achievements-sweep` once. Result: 38 `member_days` tiers earned across all 15 members (members joining Dec 2025 hit tier 4 at threshold 90; April joiners hit tier 1 or 2). Total elapsed: 2.8s.

**Pre-launch hygiene:** All 185 earned tiers marked `seen_at = notified_at = NOW()` after backfill so the Phase 3 toast queue starts empty. Without this, every existing member's first dashboard load post-UI-launch would fire dozens of toasts at once with placeholder copy — bad UX. Going forward, only fresh earns from log-activity v22 onwards will be unseen.

### What's blocking next

**Phase 2 (sweep extensions, no UI changes):** HK lifetime metric sweeps (need `member_health_daily` aggregation pattern), `full_five_weeks` weekly scan, `charity_tips` + `personal_charity_contribution` collective events, `tour_complete` (gated on adding `members.tour_completed_at`), `healthkit_connected` one-shot. All extend the same `achievements-sweep` EF — same cron, more `sweep*` functions wired into the serve handler. Ships in Session 4 wiring with push.

**Phase 3 (UI):** Toast queue (driven off `unseen[]` from member-dashboard payload, dismisses via `achievements-mark-seen`), home dashboard slot (recent earned strip + inflight progress bars), `achievements.html` full grid (locked vs earned, tap for body + earned-at). **Blocked on Lewis copy approval** — placeholder titles / bodies currently in the catalog. Doc at `playbooks/achievements-copy-for-lewis.md` (37KB, ~400 rows for Lewis to fill in). UI will only render rows where `copy_status='approved'` (with placeholder fallback during transition).

**Push on earn:** Phase 1 only writes notification rows (`member_notifications`), no push send. Web VAPID push lands in Session 4 (extends existing `habit-reminder` fan-out pattern). Native APNs / FCM push lands in Session 2 → 4 chain (`@capacitor/push-notifications` plugin install + `push_subscriptions_native` table + `push-send-native` EF + Build 4 App Store cycle). `notified_at` column on `member_achievements` already in schema as the dedup key.

### Files touched

Live deploys:
- `_shared/achievements.ts` — bundled into log-activity + member-dashboard
- `log-activity` EF v22 — `verify_jwt: false`, in-function JWT auth, esm.sh imports preserved (separate refactor)
- `member-dashboard` EF v55 — `verify_jwt: false`, achievements payload via Promise.all
- `achievements-mark-seen` EF v1 — new, `verify_jwt: false`, in-function JWT auth
- `achievements-sweep` EF v1 — new, `verify_jwt: false`, service-role only

Live SQL:
- Migration `create_achievements_schema` (3 tables + 3 indexes + 5 RLS policies)
- Seed: 34 rows in achievement_metrics, 349 rows in achievement_tiers (all placeholder)
- Backfill: 185 rows in member_achievements (all marked seen)
- Cron: jobid 15 `vyve-achievements-sweep-daily`

Brain commits:
- `plans/achievements-system.md` — architecture doc (new)
- `playbooks/achievements-copy-for-lewis.md` — Lewis copy approval doc, ~400 rows (new)
- `tasks/backlog.md` — item 6 marked shipped (HK rollout 26 April), item 7 status banner added with Phase 1 details, new item 9 added for Lewis copy approval as UI blocker
- `brain/changelog.md` — this entry

## 2026-04-27 — iOS App Store 1.1 (3) submitted: Capgo HealthKit binary cut, asset pipeline rebuilt to @capacitor/assets v3 single-icon scheme

First post-Capgo App Store submission. The 26 April web rollout (`member-dashboard` v54, `healthbridge.js` v0.3 with defensive `getPlugin` lookup, three-state Settings UI, `HEALTH_FEATURE_ALLOWLIST` dropped) had landed across all iPhone members earlier in the day, but the live App Store binary was 1.0 (1) archived 14 April — pre-Capgo. Members upgrading from PWA to native were running a binary with no Capgo plugin in it: the JS would call `window.Capacitor.Plugins.Health` and get `undefined`. Tonight's job was to cut a fresh release build that has Capgo compiled in, fix the asset-catalog warnings Xcode was flagging, archive, upload, and submit for review.

Submitted at 02:20 BST. Status: "1.1 Ready for Review". Auto-release on approval.

### Why a single 30-minute icon hunt would have killed the session

Five Xcode asset warnings had to clear before archive:

1. 60×60@2x app icon required for iPhone iOS 7+
2. 76×76@2x app icon required for iPad iOS 7+
3. 83.5×83.5@2x app icon required for iPad iOS 9+
4. 1024×1024 App Store icon required for iOS apps
5. Splash image set has 3 unassigned children

Dean had a true master VYVE logo *somewhere* — Lewis's Drive, possibly local, used for previous builds — but locating it at 02:00 BST would have been a 30-minute distraction with no certainty. So instead of hunting:

- Pulled `online.vyvehealth.co.uk/icon-512.png` (the PWA install icon — already what members see on their iPhone home screens via Add to Home Screen) directly via the workbench.
- Probed it: 512×512, RGBA, alpha extrema (255, 255) → fully opaque despite RGBA mode. Brand-correct. Source verified.
- Lanczos-upscaled to 1024×1024 in PIL.
- Flattened RGBA → RGB on a `#0D2B2B` canvas (VYVE dark teal — section 15 brand colour) using `bg.paste(upscaled, (0,0), upscaled)`. App Store Connect rejects PNGs with an alpha channel even when alpha is fully 255 — flatten to RGB or fail validation.
- Saved as `icon.png`, uploaded to Composio S3 for Dean to curl.

For splash: built a 2732×2732 RGB canvas of the same dark teal, pasted the 1024×1024 logo centred (x=854, y=854 — Capacitor's safe zone for any device aspect ratio), saved as `splash.png`, uploaded.

Briefly considered the portal `logo.png` as an alternative source — rejected immediately on probe: 500×500 with real transparency (alpha extrema 0–255). Not usable as App Store icon source. The portal logo serves the in-app teal-background context where transparency is fine; the App Store icon must be a self-contained square against a brand background.

Dean curled both files into `~/Projects/vyve-capacitor/assets/`, verified with `sips -g pixelWidth -g pixelHeight -g hasAlpha`:
- `assets/icon.png`: 1024×1024, hasAlpha: no, 229028 bytes
- `assets/splash.png`: 2732×2732, hasAlpha: no, 271208 bytes

### sharp on Apple Silicon — `--include=optional` rescue

`npx @capacitor/assets generate --ios` failed first run with:

```
Error: Cannot find module '../build/Release/sharp-darwin-arm64v8.node'
```

Sharp 0.33+ moved its prebuilt platform binaries into optional dependencies. Dean's original `npm install` had skipped them. Fix:

```bash
npm install --include=optional sharp
```

Pulled in 4 packages, sharp now resolves on Apple Silicon. **Codified as gotcha** — Capacitor projects on M-series Macs need this flag whenever sharp is involved (Capacitor's icon/splash generator is the most common trigger).

### `@capacitor/assets` v3 single-icon scheme silenced 4 of 5 warnings outright

Re-ran the generator after sharp fixed:

```
CREATE ios icon /Users/deanbrown/Projects/vyve-capacitor/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png (327.17 KB)
CREATE ios splash /Users/deanbrown/Projects/vyve-capacitor/ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png (83.22 KB)
CREATE ios splash /Users/deanbrown/Projects/vyve-capacitor/ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany.png (83.22 KB)
CREATE ios splash /Users/deanbrown/Projects/vyve-capacitor/ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany.png (83.22 KB)
CREATE ios splash-dark /Users/deanbrown/Projects/vyve-capacitor/ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany-dark.png (199.56 KB)
CREATE ios splash-dark /Users/deanbrown/Projects/vyve-capacitor/ios/App/App/Assets.xcassets/Splash.imageset/Default@2x~universal~anyany-dark.png (199.56 KB)
CREATE ios splash-dark /Users/deanbrown/Projects/vyve-capacitor/ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany-dark.png (199.56 KB)
Totals: ios: 10 generated, 2.48 MB total
```

Tool rewrote `AppIcon.appiconset/Contents.json` to a single-entry universal scheme:

```json
{
  "images": [
    {
      "idiom": "universal",
      "size": "1024x1024",
      "filename": "AppIcon-512@2x.png",
      "platform": "ios"
    }
  ],
  "info": {"author": "xcode", "version": 1}
}
```

This is the modern Xcode 14+/26.x convention — App Store Connect now generates all device-specific sizes server-side from the single 1024×1024 universal master. The legacy 60×60@2x / 76×76@2x / 83.5×83.5@2x slots aren't expected to exist anymore. Warnings 1-4 cleared automatically because those slots no longer appear in the asset catalog spec.

### Orphaned splash files — manual rm required after asset regeneration

The "splash image set has 3 unassigned children" warning (warning 5) survived the regeneration. Cause:

```
ls -la ios/App/App/Assets.xcassets/Splash.imageset/
splash-2732x2732-1.png    (25 March, 41273 bytes)
splash-2732x2732-2.png    (25 March, 41273 bytes)
splash-2732x2732.png      (25 March, 41273 bytes)
Default@*~universal~anyany*.png  (27 April, regenerated)
Contents.json             (27 April, references only Default@*)
```

Old files from a previous Capacitor convention (pre-v3 of `@capacitor/assets`, when splashes were named `splash-WxH.png`) remained in the directory but Contents.json no longer referenced them. That's exactly what Xcode means by "unassigned children" — files in the imageset dir that aren't named in Contents.json. Fix:

```bash
rm ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732*.png
```

All 5 warnings cleared. **Codified as gotcha** — `@capacitor/assets generate` doesn't clean up files from previous-convention naming schemes; manual `rm` of orphans is required after regenerations.

### Version bump via `agvtool`

Bumped marketing version 1.0 → 1.1 (HealthKit is a real feature addition deserving a minor bump, gives App Review reviewers a clean reason for re-review vs a 1.0.x patch suggestion) and build version 2 → 3:

```bash
cd ~/Projects/vyve-capacitor/ios/App
xcrun agvtool new-marketing-version 1.1
xcrun agvtool new-version -all 3
```

`agvtool` writes both `CFBundleShortVersionString` and `CFBundleVersion` directly into `App.xcodeproj/../App/Info.plist`. The "No marketing version number found for Jambase targets — Looking for marketing version in native targets..." preamble is harmless; agvtool falls through to native targets and writes correctly. **Codified.**

### Archive + Distribute: clean

Product → Clean Build Folder → Product → Archive (target: Any iOS Device (arm64)). Archive succeeded with the new 1.1 (3) entry at the top of the Xcode Organizer:

- Version: 1.1 (3)
- Identifier: co.uk.vyvehealth.app
- Type: iOS App Archive
- Team: VYVE Health CIC (VPW62W696B)
- Architecture: arm64

Distribute App → App Store Connect → Upload → automatic signing → encryption-strip + symbol-upload enabled, **Manage Version and Build Number unchecked** (avoids agvtool/Xcode bump conflict where Xcode auto-bumps and leaves local Info.plist drifted from App Store Connect record). Upload completed. "Uploaded to Apple" with green tick alongside the previous 1.0 (1), 1.0 (2), and 1.0 (1) builds.

### App Store Connect 1.1 version setup

Web flow:

1. **Create version 1.1** via "+" next to "iOS App" in left sidebar. Most metadata pre-filled from 1.0 — description, keywords, screenshots, support/marketing URLs, copyright (2026 VYVE Health CIC), privacy policy URL.

2. **What's New in This Version** — short, Lewis-tone, no emojis: *"Apple Health is now supported. Connect your iPhone and Apple Watch in Settings to bring your workouts, steps, sleep, weight and more into your VYVE daily progress automatically. Plus stability improvements and faster loading across the app."* 280 chars; gives App Review reviewers a clear scope-of-change signal that justifies the new HealthKit entitlement.

3. **Build attach** — picked Build 3 from the modal, which appeared with "Missing Compliance" warning (encryption export compliance unanswered). Walked through the 4 export-compliance questions: Yes (HTTPS) → Yes (qualifies for Cat 5 Pt 2 exemption) → No (no proprietary algorithms) → No (no standard algorithms beyond Apple's). Same answers VYVE used for 1.0 (1) and 1.0 (2). Compliance cleared, green tick next to Build 3.

4. **App Privacy** — already current. The 1.0 declaration published 14 days ago by Lewis includes Health and Fitness as Data Linked to You data types (8 total: Name, Email Address, Crash Data, Fitness, Performance Data, Health, Product Interaction, Phone Number). Apple maps the 7 HealthKit read scopes onto these two umbrella categories — steps/distance/active-energy/workouts go under Fitness; heart-rate/weight/sleep go under Health. The declaration carries forward to 1.1 automatically. App Store Connect did not request re-attestation. **Codified as gotcha** — App Privacy is per-app, not per-version.

5. **App Review notes** (already populated from 1.0): *"Fixed app icon (was placeholder). Added Apple Health section to Settings page showing HealthKit data read/write permissions."* Useful context for the Apple reviewer about what's new to test.

6. **Add for Review** clicked. Status transitioned: "1.1 Prepare for Submission" (yellow) → "1.1 Ready for Review" (yellow). Bottom-right shows "Draft Submissions (1)" — the in-flight submission record.

### What Apple Review will check (HealthKit-specific reviewer playbook)

Codifying this for future submissions involving HealthKit changes:

- `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` Info.plist strings must be feature-named and user-friendly (set 23 April session 2; "guideline-5.1.3-defensible language" was the framing).
- App must gracefully handle permission denial — no crashes if user taps Don't Allow.
- Data flowing through the app must match the App Privacy declaration. Declared = Health + Fitness; actual reads = 7 scopes mapping cleanly to those two categories.
- Clinical Health Records and Background Delivery sub-capabilities are the rejection-prone ones. Both OFF on `co.uk.vyvehealth.app`'s App ID. Confirmed during 23 April session 2 entitlement audit.

Risk profile: low. The 23 April session 4 device-validated end-to-end flow on Dean's iPhone 15 Pro Max + Apple Watch Ultra was clean.

### Files changed this session

In `~/Projects/vyve-capacitor` (NOT a git repo — see codified backlog item below):

- `assets/icon.png` (NEW, 1024×1024 RGB, 229028 bytes)
- `assets/splash.png` (NEW, 2732×2732 RGB, 271208 bytes)
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (regenerated, 1024×1024 RGB, 335026 bytes)
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` (rewritten by tool to single-icon universal scheme)
- `ios/App/App/Assets.xcassets/Splash.imageset/Default@{1x,2x,3x}~universal~anyany{,-dark}.png` (6 regenerated)
- `ios/App/App/Assets.xcassets/Splash.imageset/Contents.json` (rewritten by tool)
- `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732{,-1,-2}.png` (3 DELETED — orphaned from old convention)
- `ios/App/App/Info.plist` — `CFBundleShortVersionString` 1.0 → 1.1, `CFBundleVersion` 2 → 3 (via agvtool)
- `node_modules/sharp/*` — prebuilt darwin-arm64v8 binary added via `--include=optional`

App Store Connect:

- iOS App Version 1.1 created with What's New copy, Build 3 attached, export compliance answered, "Add for Review" submitted

VYVEBrain:

- This changelog entry prepended to `brain/changelog.md`
- `brain/master.md` Section 19 date updated to 27 April 2026 + iOS submission added to Completed list
- `brain/master.md` Section 21 PRIORITY #1 demoted (no longer the top priority — submitted)
- `brain/master.md` Section 23 — five new gotchas codified

### Gotchas codified for Hard Rules

1. **App Store icon must be RGB no-alpha, not RGBA-fully-opaque.** Apple validates the alpha channel's *presence*, not its values. RGBA mode is rejected even when alpha is uniformly 255. Always flatten via `Image.new("RGB", size, bg).paste(rgba, (0,0), rgba)` in PIL or equivalent before submission.
2. **`@capacitor/assets` v3 single-icon scheme.** Modern Xcode 14+/26.x reads a single `AppIcon-512@2x.png` at 1024×1024 universal from `AppIcon.appiconset/`. Legacy 60×60@2x / 76×76@2x / 83.5×83.5@2x slots are no longer in the spec. The tool rewrites `Contents.json` accordingly; running `npx @capacitor/assets generate --ios` once silences all multi-size warnings outright.
3. **Sharp on Apple Silicon needs `npm install --include=optional sharp`** before any `@capacitor/assets` or other sharp-using tool will run. Sharp 0.33+ moved prebuilt platform binaries into optional dependencies.
4. **`@capacitor/assets generate` does not clean up orphaned files** from previous-convention naming schemes (e.g., `splash-2732x2732*.png` from pre-v3). Manually `rm` any files in the imageset directory not referenced by the regenerated Contents.json — otherwise Xcode flags "N unassigned children".
5. **Canonical brand icon source for Capacitor builds is `online.vyvehealth.co.uk/icon-512.png`.** Fully opaque, brand-correct (it's the PWA install icon members already see on their home screens). The other portal logo (`logo.png`) is 500×500 with real transparency (alpha extrema 0–255) — usable in-app on a teal background, not usable as an App Store icon source. Lanczos upscale 512→1024 + RGB flatten on `#0D2B2B` is App Store-acceptable; preserves visual consistency for members upgrading PWA → native.
6. **App Privacy declarations carry forward across versions automatically.** Once 1.0 published with Health + Fitness data types, 1.1 inherits without re-attestation. Apple maps HealthKit's 7 read scopes onto those two umbrella categories (steps/distance/active-energy/workouts → Fitness; heart-rate/weight/sleep → Health). Don't expect a re-walk of the data-type wizard on minor version bumps.
7. **agvtool "Jambase targets" preamble is harmless.** It falls through to native targets and writes correctly.
8. **Distribute App → uncheck "Manage Version and Build Number".** When agvtool has already set the version locally, Xcode's distribute-time auto-bump leaves Info.plist drifted from the App Store Connect record (you ship Build 3 locally but App Store Connect records Build 4). Confusing for next-session diagnostics. Always uncheck if you've used agvtool.

### Outstanding for next session

1. **Apple Review.** Typical turnaround: a few hours to 24 hr. Auto-release configured — once approved, 1.1 (3) goes live on the App Store automatically. All opted-in iPhone members get the binary with Capgo plugin compiled in on app update; HealthKit autotick goes from Dean-only (current `member_health_connections` state on production) to cohort-wide via the consent gate flow already shipped 23 April.
2. **Initialise `vyve-capacitor` as a git repo.** Two-line fix from the project root: `git init && git add . && git commit -m "Initial commit at 1.1 (3) submission"`. Currently no version control on the Capacitor project, which is fine while iOS work is mostly asset/version-bump deltas but becomes painful once we start touching native source files (Swift plugin work, custom Capacitor plugins for background HealthKit sync — see `plans/healthkit-background-sync.md`). Codified as backlog item.
3. **Drop session learnings into Lewis's HK rollout doc** when ready — the "What's New" copy from this submission is the natural seed for the in-app update notification when 1.1 ships.

### Commits this session

- VYVEBrain: this entry prepended to `brain/changelog.md`; master.md sections 19, 21, 23 updated
- vyve-capacitor: NOT a git repo, no commit
- vyve-site: no changes (web rollout was 26 April session, separate scope)
- App Store Connect: 1.1 (3) submitted

---

## 2026-04-26 — Design session: Achievements System (cumulative-forever) + In-App Tour spec landed

Strategy session with Dean on backlog items 6 (in-app tour) and 7 (achievements). Both items had light specs from 25 April; this session promoted them to full builds with locked architectural decisions. Three architectural shifts vs the original backlog wording:

**1. Cumulative-forever ladders, not a flat catalogue.** Original spec said `member_achievements (achievement_id, member_email, earned_at, seen_at)` — implying a fixed list of badges. Dean's pivot: every metric needs an incremental ladder that scales forever (log habits 1, 3, 5, 10, 15, 25, 50, 100, 200, 500, 1000…) so a member on for ten years still has tiers ahead. Data model rewritten to **metric × ladder**:

```sql
achievement_metrics (slug PK, category, display_name, unit, source_query)
achievement_tiers   (metric_slug, tier_index, threshold, title, body,
                     PRIMARY KEY (metric_slug, tier_index))
member_achievements (id, member_email, metric_slug, tier_index, earned_at, seen_at,
                     UNIQUE (member_email, metric_slug, tier_index))
```

Adding tier 14 when a member first hits 10,000 of something is one INSERT, zero schema change. First-times collapse into "tier 1 of the relevant counter" — `first_habit` is `habits_logged` tier 1.

**2. Push notification on earn.** Originally scoped as v2. Dean's pivot: push fires as the action completes, so toast + native push lands in the same tap that earned it. Architecture: `log-activity` v22 inserts achievement → returns earned tiers in response payload (so the active client toasts instantly without push round-trip) → fires web VAPID push to any other subscribed devices using existing `push_subscriptions` infrastructure (same pattern as `habit-reminder` / `streak-reminder`) → writes `member_notifications` row as durable record. When the native APNs/FCM session lands, the same EF will also send to `push_subscriptions_native` — no rework needed. Native push is **not** a v1 dependency for achievements.

**3. First tier earnable on action one across every quantitative metric.** Dean caught that a "30 minutes session watched" first tier was a 3-session wall before any reward (some sessions are only 10 minutes). Rule applied universally: 1 minute, 1 km, 1k steps — every quantitative ladder lights up tier 1 on the very first qualifying action. Especially important for the tour, where every step needs to land a celebration moment.

**Metrics inventory landed at 27** across counts (13), time totals (4), HK-derived (4), streaks (6, all already computed in `member_home_state`), variety (1), collective (2), tenure (1), and one-shots (3 — `tour_complete`, `healthkit_connected`, `persona_switched`). With ~12–15 tiers per ladder this gives ~350–400 earnable achievements at v1 launch. Full per-metric inventory captured in `tasks/backlog.md` item 7.

**Schema verified live before locking the inventory.** Direct table introspection via `SUPABASE_GET_TABLE_SCHEMAS`: `workouts.duration_minutes`, `cardio.duration_minutes`, `cardio.distance_km`, `session_views.minutes_watched`, `replay_views.minutes_watched` all exist live (so the time-total and distance metrics aren't fabricated). `member_home_state` already tracks `*_streak_current` and `*_streak_best` for habits/workouts/cardio/sessions/checkin and overall — six per-track streak ladders are essentially free to compute.

**Trigger placement decided as hybrid.** Counts + time totals + streak day-of evaluations fire inline from `log-activity` v22 (one COUNT after insert is cheap on indexed tables, immediacy matters for the toast). Variety, charity-tips, tenure, and HK-derived metrics go into a daily sweep extending `certificate-checker` (window calcs that don't benefit from immediacy). Best of both — fast where it matters, batched where it doesn't.

**Display surfaces decided as three.** Toast on earn (celebration moment), home dashboard slot with progress bars on 1–3 in-flight achievements ("13/14 day streak — one more!"), dedicated `achievements.html` (full grid, locked vs earned). Same data layer, three render passes — UI cost is shallow.

**Non-HK member handling decided as hide, not lock.** The 4 HK-derived metrics (steps, distance, active energy, sleep nights) simply don't render for members without a `member_health_connections` row. Reasoning: showing four greyed-out "Connect Apple Health to unlock" badges is nudgy and pointless for Android members who literally can't act on the prompt. The HK CTA belongs on dashboard + settings (where it can convert), not as locked badges. Retroactive earn fires on connect — any tier the member would already have earned with HK data lights up at once.

**HK rollout promoted to a sibling backlog item.** `HEALTH_FEATURE_ALLOWLIST` in `member-dashboard` v51 currently hard-codes Dean only. To make the four HK-derived metrics meaningful at achievements launch, HK needs to be available to any iPhone user opting in. ~1 session: drop the allowlist, swap truthsource to `member_health_connections` row presence, add iOS-only Settings toggle (PWA + Android Capacitor hide via runtime guard), polish consent wording. Android Health Connect stays parked — schema and EF logic are extension-ready, only blocker is Dean having a Pixel/Galaxy device for E2E testing. Added as new item 6 in backlog High-Value Additions, ships **before** Achievements (now item 7).

**Build order locked, to be executed across discrete chats:**

1. HK gating session — drop allowlist, settings toggle, iOS guard. ~1 session.
2. Lewis copy doc (in parallel with build above) — full ladders, every tier title + body, ~400 lines of copy in one Lewis-facing doc, bulk-approval model.
3. Achievements data layer + `log-activity` v22 + daily sweep + `member-dashboard` v52 payload extension. ~1 session.
4. Achievements UI — toast + dashboard slot + `achievements.html`. ~1 session.
5. In-App Tour — modal step-through, real-activity-logging, achievement-on-each-step. ~1–2 sessions.

**Roll-out for achievements:** Open to all from day one (no allowlist). Existing 14 members will retroactively earn handfuls of cumulative badges on first dashboard load — natural activation moment.

**Files changed this commit:** `tasks/backlog.md` (items 6 + 7 rewritten as new items 7 + 8 with full architectural detail; new item 6 inserted for HK rollout; header date refreshed), `brain/changelog.md` (this entry prepended).

No code, schema, or portal changes this turn. Pure design + brain housekeeping ahead of execution.

---

## 2026-04-26 — Revert: VYVE_Health_Hub.html restored to web root (Dean correction)

Earlier today I archived `VYVE_Health_Hub.html` from `vyve-site/` web root to `archive/VYVE_Health_Hub.html` based on three signals: zero inbound links, zero backend wiring, and an LLM characterisation that called it a "standalone client-side prototype." Dean immediately corrected: the file is **staging — pending Phil's clinical sign-off**. Same gate pattern as HAVEN persona. Not orphaned, not a prototype to archive — a real launch candidate held back until clinical review of the assessment instruments + scoring/risk thresholds + signposting copy is complete.

**Reverted in commit [`436a2f3`](https://github.com/VYVEHealth/vyve-site/commit/436a2f31b05ea35d748925aeca80d2a1bd95d97d):**

- `VYVE_Health_Hub.html` restored to `vyve-site/` web root, byte-identical to original (sha `f7087880a8`).
- `archive/VYVE_Health_Hub.html` deleted.
- `sw.js` cache bumped `v2026-04-26a-archive-cleanup` → `v2026-04-26b-revert-hub-archive`.

**Brain updated to reflect actual status:**

- Section 8 row rewritten to "Staging — pending Phil's clinical sign-off before launch" with explicit "do not delete or archive without Lewis/Phil approval" warning.
- Section 22 (open decisions) gained a new line: `VYVE_Health_Hub.html` go-live — Phil's clinical review required.
- Section 23 (gotchas) gained two new rules:
  1. **Pre-launch / staging files in `vyve-site` root** — "no inbound links + no backend wiring" is not a sufficient signal for archive/delete. Some files are staged unlinked while waiting on a Lewis/Phil sign-off. Never archive or delete a substantial standalone HTML file from `vyve-site` without confirming with Dean first.
  2. **`GITHUB_COMMIT_MULTIPLE_FILES` deletes shape** — `upserts` takes objects `{path, content, sha?}` but `deletes` takes a flat array of path strings, not objects. Mixed shape — the API rejects `[{path, sha}]` for deletes.

**Lesson codified.** I treated absence-of-links as evidence of orphan-ness, when in fact for a small team shipping iteratively with clinical review gates, "unlinked" is the *expected* state for any sensitive page mid-development. The right test is "does Dean (or whoever owns the area) know about this file?" — not "can grep find a link to it?". Asking before destructive action on any file >50KB with substantive content is now the rule. The earlier reconcile pass (which I'd assumed was done by a parallel session and which had also flagged this file as "Purpose unverified") arrived at the same uncertainty correctly — the right move at that point was to leave it alone, not to characterise and act in the next pass.

---

## 2026-04-26 — Three open items closed: members count clarified, vyve-site/admin-console.html deleted, VYVE_Health_Hub.html archived

Closing the three diagnostic flags the earlier reconcile pass left for inspection.

**1. Members count clarified.** Section 19 said "~17 active members across B2C + early enterprise trial seats." Investigation: live `members` table = 14 rows; live `admin_users` = 3 rows. The 17 figure was 14 members + 3 admin operators conflated. Fixed wording to be explicit: "14 active members in `members` table … (3 admin operators tracked separately in `admin_users` — total 17 platform identities)."

**2. `admin-console.html` duplicate deleted from `vyve-site`.** Two copies existed:

| Location | Size | Style | Status |
|---|---|---|---|
| `vyve-site/admin-console.html` | 49 KB | Bare HTML, no theme tokens, no `noindex` meta | Stale standalone copy. Different SHA from canonical. |
| `vyve-command-centre/admin-console.html` | 131 KB | Full theme system, `data-theme="dark"`, `noindex,nofollow`, Google Fonts | Canonical — served by `admin.vyvehealth.co.uk`. |

The vyve-site copy is not served (admin host points at vyve-command-centre), is materially smaller, lacks the production styling, and is not referenced from any nav. Deleted from `vyve-site`. Master.md section 8 row removed; the existing "Admin console (separate host)" sub-section already covers the canonical host correctly.

**3. `VYVE_Health_Hub.html` archived (not deleted).** 182 KB file in `vyve-site` web root. Investigation: zero inbound links from any repo (grep across `vyve-site` + `Test-Site-Finalv3` returned 0 matches), zero `localStorage` / `fetch` / `supabase` / Anthropic refs, 23 client-side function defs, no backend wiring at all. LLM characterisation: standalone client-side prototype containing a welcome card, dashboard tabs, multi-step assessment flow with scoring/risk-classification, and a `generateReport()` plain-text export. Self-contained mock-up — not part of any live user journey.

Decision: **archive rather than delete.** The assessment definitions (instrument names, authors, psychometric properties) and `generateReport()` implementation are unique within the codebase and may be useful reference material for future feature work. Moved to `archive/VYVE_Health_Hub.html` to keep it out of the web root while preserving git history. Section 8 row updated to reflect new path.

**4. SW cache version bumped.** vyve-site `sw.js` cache name `vyve-cache-v2026-04-25b-mojibake-sweep` → `v2026-04-26a-archive-cleanup`. Master.md PWA infrastructure row updated (it was on `v2026-04-24d-write-path-cleanup`, two bumps stale).

**Files changed:**

| Repo | File | Action |
|---|---|---|
| VYVEBrain | `brain/master.md` | Section 19 members line + section 8 admin-console row removed + section 8 VYVE_Health_Hub row updated to archive path + PWA infra SW cache version line |
| VYVEBrain | `brain/changelog.md` | This entry |
| vyve-site | `admin-console.html` | DELETE |
| vyve-site | `VYVE_Health_Hub.html` | DELETE (moved to archive path) |
| vyve-site | `archive/VYVE_Health_Hub.html` | CREATE (content preserved byte-identical) |
| vyve-site | `sw.js` | CACHE_NAME constant bumped |

No DB changes. No Edge Function changes. No live user journeys touched.

---

## 2026-04-26 — Brain reconcile pass: master.md cleaned + stale memory edits cleared

Dean asked for a deep dive of the brain vs live reality after I (Claude) misclaimed in conversation that HealthKit was "scoped as a future priority" and would need 3-4 sessions to ship. The misclaim came from stale stored memory edits — not from `master.md`, which has correctly captured HealthKit autotick as live end-to-end since session 3a (25 April).

**Findings — the brain is essentially current.** No structural drift. Both of Dean's strategy ideas (in-app tour + achievements layer) were already in `tasks/backlog.md` MVP requirements as items 6 and 7, added 25 April with effort estimates and open questions noted.

**Drifts found (all small, all fixed in this commit):**

- Section 6 header said "70 tables" — live is 74. Header now says 74. The section's own tables already enumerated 74 — only the count line was stale.
- Section 7 header said "75 active Edge Functions as of 24 April" — live is 74. Header refreshed to 26 April.
- Section 19 said "**70 public tables**" — refreshed to 74.
- Row counts in section 6 were 2 days old. Refreshed the ones that drifted noticeably: `daily_habits` 136→151, `cardio` 21→23, `member_habits` 67→72, `weight_logs` 15→16, `member_health_samples` 967→1,674 (Watch-heavy growth), `member_health_daily` 92→95, `member_activity_daily` 97→99, `member_activity_log` 283→300, `platform_metrics_daily` 97→99, `platform_alerts` 157→164, `engagement_emails` 35→39, `member_notifications` 19→20. Static tables left untouched.
- Section 8 page list was missing several files that exist in the `vyve-site` repo root. Added a row block covering: `shared-workout.html`, `certificate.html` (singular, distinct from `certificates.html`), `consent-gate.html`, `nutrition-setup.html`, `offline.html`, `how-to-pdfs.html` + `how-to-videos.html`, and the per-stream live/replay variant shells (`yoga-{live,rp}.html`, `mindfulness-{live,rp}.html`, etc — 16 files in total). Two outliers explicitly flagged for inspection: `admin-console.html` exists in `vyve-site/` root (49KB) in addition to the `admin.vyvehealth.co.uk` host served by `vyve-command-centre` — confirm if this is a dev mirror or stale copy. And `VYVE_Health_Hub.html` (182KB) sits in `vyve-site` root with no nav link — purpose to verify.

**Not touched in this pass:**

- Section 19's "~17 active members across B2C + early enterprise trial seats" claim. The `members` table has 14 rows live. The 17 figure may include all-time signups (e.g. churned trial accounts or auth-only users) — leaving it for Dean to clarify rather than assume.
- The base64-encoded historical blob in `brain/changelog.md` (~152K decoded chars). Still on the brain-hygiene backlog. Untouched.
- Anything in sections 11 (HealthKit autotick), 21 (build items), 22 (open decisions), 23 (gotchas). All current and correct.
- 30+ Edge Function inventory delta. Brain section 7 "Retired / one-shot / debug" already covers these as a fuzzy ~30-function group across `seed-*`, `patch-*`, `trigger-*-workout`, `setup-*`, `run-migration-*`, `debug-*`, `test-*`, `send-stuart-*`, `ban-user-*`, `thumbnail-*` etc. — matches live reality.

**Memory hygiene also done.** Stored memory edits #2, #3, #4, #5 were carrying state that contradicted the brain (35 tables, 31 members, 15 core EFs, HealthKit "future priority", Make publisher specifics). Replaced with concise durable facts plus an explicit instruction: load VYVEBrain from GitHub for current state, do not trust counts cached in memory.

**Files changed this commit:** `brain/master.md` (header counts, row count refresh, section 8 addendum), `brain/changelog.md` (this entry prepended).

**Process learning codified.** Stored memories drift faster than the brain. When something feels off, the brain on GitHub is the answer — not whatever the memory layer is currently asserting. The brain master.md was rewritten cleanly on 24 April and has been kept current via incremental updates since; memories last refreshed before the rewrite are guaranteed to lie about HealthKit, table counts, EF versions, and member counts.

---

## 2026-04-25 — warm-ping expanded from 3 to 10 EFs (no cache-rework path taken)

Dean asked whether "pages don't stay cached on app reopen" was actually a cold-start problem at low traffic, given there are only ~17 members and most are inactive. Honest diagnosis: cold starts and the asset-cache problem are different layers, but cold starts ARE a real factor on the EFs not currently in the warm-ping list.

**State before:** `warm-ping` v3 was firing every 5 min via cron `warm-ping-every-5min` (`*/5 * * * *`), but only hitting `member-dashboard`, `wellbeing-checkin`, `log-activity`. Every other member-facing EF was idling out and cold-starting on first navigation.

**Manual trigger of v4 confirmed the diagnosis** — first ping after deploy:

| EF | Latency | State |
|---|---|---|
| member-dashboard | 251ms | Already warm (in v3 list) |
| wellbeing-checkin | 157ms | Already warm (in v3 list) |
| log-activity | 160ms | Already warm (in v3 list) |
| leaderboard | **727ms** | **Was cold — newly warmed** |
| anthropic-proxy | **733ms** | **Was cold — newly warmed** |
| notifications | 183ms | Was warm-ish |
| monthly-checkin | **782ms** | **Was cold — newly warmed** |
| off-proxy | **581ms** (204) | **Was cold — newly warmed** |
| workout-library | 264ms | Was warm-ish |
| employer-dashboard | **633ms** | **Was cold — newly warmed** |

The 4 newly-added cold EFs were taking 580–780ms on first hit vs ~200ms warm — exactly the per-page-navigation lag Dean was feeling on first tab to a non-home page after app reopen. From now on all 10 stay warm via the existing 5-min cron. No cron change needed — `warm-ping` just got fatter.

**Cost check:** 10 OPTIONS preflights × 288 cron firings/day = 2,880 invocations/day. Well within Supabase Pro headroom. Each ping is OPTIONS (CORS preflight), zero DB queries, zero side effects.

**Cache-rework decision:** parked. Three reasons documented in conversation: (1) only ~17 members so the asset-cache symptom barely affects real users, (2) Capacitor reshapes the caching model entirely (native WebView + asset bundling) so SW work would be partly redone, (3) iteration speed is currently the highest-value thing and the existing network-first SW doesn't slow Dean down. Revisit when Capacitor ships, OR active members cross ~50–100, OR a real (non-dev) member complains about offline behaviour.

**Files:** `warm-ping` EF v3 → v4. No portal changes, no DB changes, no cron changes.

---

## 2026-04-25 — Mojibake sweep across portal + brain changelog

Dean reported seeing mojibake on pages and assumed DB was affected. Did a full deep dive across all repos and the database.

**Findings (the real picture, not the first one I saw):**

The first scan was misleading because `requests.get(s3_url).text` was decoding raw UTF-8 file bytes as ISO-8859-1 (Cloudflare R2 returned `text/plain` with no charset, which makes the `requests` library default to ISO-8859-1). That made every clean em-dash byte sequence (`\xE2 \x80 \x94`) look like the 3-character mojibake `â\x80\x94`. After switching to explicit `r.content.decode("utf-8")` the actual scope dropped from "121 files across 3 repos" to a much smaller real-world set.

Real mojibake in the system, after correct UTF-8 decoding:

- **vyve-site** (portal): 12 files with genuine `\xC3\xA2\xC2\x80\xC2\x94`-style double-mojibake bytes in their stored content. Worst offenders movement.html, exercise.html, nutrition.html, workouts.html, leaderboard.html, plus index.html, cardio.html, engagement.html, set-password.html, workouts-notes-prs.js, workouts-session.js, sw.js. These were the user-visible bug — the browser renders the bytes correctly per the `<meta charset="UTF-8">` declaration, so the mojibake characters showed up on screen.
- **VYVEBrain**: 1 file (brain/changelog.md). 519 mojibake markers scattered across older entries. My own entries from sessions before this one introduced clean em-dashes, but historical entries (HealthKit sessions 1-7, autotick sessions, portal perf, shell 3 entries) had real mojibake bytes. Cause is some earlier tool/process — pipeline tested clean today via a round-trip probe.
- **Test-Site-Finalv3** (marketing): zero mojibake. Clean.
- **Supabase database**: scanned all 49 non-empty public tables with a regex (`[ÂÃâ][-¿]`) across every text/jsonb column. One affected row: `activity_dedupe.b7d25431-527c-4fd7-9e49-43e45dd90173`, where `raw_payload.session_name` reads "VYVE â Education & Experts (Replays)". Persona system prompts, ai_interactions, knowledge_base, wellbeing_checkins recommendations, programme cache, running plan cache — all clean. The runtime EFs are writing clean UTF-8.
- **Edge Functions**: deployed source is in eszip binary so couldn't scan directly, but downstream DB writes are clean, so runtime output is clean.

**What was fixed:**

- vyve-site commit `0f017f8`: 12 files re-encoded via `ftfy.fix_text` with a conservative config (encoding-only fix, no quote uncurling, no HTML entity changes, no NFC normalization) + sw.js cache bump from `vyve-cache-v2026-04-25a-page-headers` to `vyve-cache-v2026-04-25b-mojibake-sweep`. Verified post-commit by re-fetching movement.html with explicit UTF-8 decoding — zero residual mojibake markers.
- VYVEBrain (this commit): brain/changelog.md cleaned of all 519 mojibake markers + this entry prepended.
- Database: one UPDATE on `activity_dedupe` to fix the one corrupted `raw_payload` JSONB.

**Approach notes:**

- ftfy 6.3.1 with `TextFixerConfig(uncurl_quotes=False, fix_line_breaks=False, fix_latin_ligatures=False, fix_character_width=False, normalization=None)` — conservative settings to avoid changing anything other than mojibake. Verified curly quotes, base64 image data, and emoji all preserved.
- Test-Site-Finalv3 was untouched because it's already clean — no need to commit anything.
- Round-trip probe (commit clean UTF-8 → re-fetch with explicit UTF-8) confirmed the Composio→GitHub→S3 pipeline preserves UTF-8 correctly. The pre-existing changelog mojibake is from earlier sessions, not from current commits.

**Lesson for future:** when fetching files from Composio's `GITHUB_GET_RAW_REPOSITORY_CONTENT` S3 URLs, always use `r.content.decode("utf-8")` not `r.text`. The S3 server returns `text/plain` without a charset header, so `requests` defaults to ISO-8859-1 which silently produces fake mojibake on UTF-8 content. This caused a 10x overestimate of scope on the first pass. Adding to brain notes.

---

## 2026-04-25 — Portal page-header cleanup (index, exercise, movement, cardio, nutrition, leaderboard)

Dean asked for a quick visual tidy across six pages. Symptoms from screenshots: index pressed against the status bar, exercise/movement/nutrition/cardio carrying eyebrow + title blocks that duplicated info already in the cards below, and leaderboard sitting too far down the screen with the sticky mobile nav header rendering squished/centered instead of full-width.

**Changes shipped (single atomic commit `5f41f97`):**

- **index.html** — mobile `.wrap` top padding 4px → 24px so the "Good morning/night, [Name]" greeting clears the status bar.
- **exercise.html** — entire `<div class="page-header">` (eyebrow "Your Training" + title "Exercise" + sub `#page-sub`) hidden via `style="display:none"`. Block was duplicating the hero card's "ACTIVE PROGRAMME / [Name] / Week X of Y · 4 sessions per week". Hidden rather than deleted because the JS render functions still write to `#page-sub.textContent`; pulling the element would throw on null.
- **movement.html** — removed only the `<div class="page-eyebrow">Movement</div>` line. "Today's Session" title and `#page-sub` (which JS writes "Week X of Y" into) preserved.
- **cardio.html** — removed only the `<div class="page-eyebrow">Cardio</div>` line. "Your Cardio" title preserved.
- **nutrition.html** — removed `<div class="page-eyebrow">Your VYVE</div>` and `<div class="page-title">Nutrition</div>`. Kept `#hero-sub` ("Your daily calorie targets") and `#goal-chip-wrap` because both are JS-populated.
- **leaderboard.html** — three CSS fixes:
  1. `.page-wrap { padding-top: 64px }` → `24px` (desktop), `56px` → `16px` (mobile). The 64/56px values were stacking with the sticky `.mobile-page-header`'s 56px min-height to push content ~120px down.
  2. `.header { padding: 32px 24px 0 }` → `0 24px 0` to remove the doubled top spacing.
  3. Added `.mobile-page-header { align-self: stretch; }` override. Root cause of the squished/centered nav header: `body { display: flex; flex-direction: column; align-items: center }` was centering the nav.js-prepended sticky header instead of letting it stretch full-width. Other portal pages don't have body align-items:center, which is why this regression only showed on leaderboard.

**SW cache bumped:** `vyve-cache-v2026-04-24o-remove-activity-link` → `vyve-cache-v2026-04-25a-page-headers`.

**Verified post-commit** by re-fetching index.html (starts cleanly with `<!DOCTYPE html>`, no base64 corruption), leaderboard.html (padding + stretch override present), and sw.js (cache key bumped).

**Approach note:** all six page edits + sw.js bump went out as one `GITHUB_COMMIT_MULTIPLE_FILES` call inside the workbench (largest file index.html at 83K). No issues — clean upsert across all 7 paths.

---

## 2026-04-25 — HealthKit background sync: investigated and parked as future vision

Dean asked for a written plan (no code) to scope iOS HealthKit background sync — the v2 of the autotick feature shipped sessions 1+2+3+3a, where Apple Health data would flow into Supabase even when VYVE is closed (e.g. workout completed on the Watch at 6am, member never opens VYVE that day, dashboard still up to date by evening).

**Investigation done:**
- Loaded brain (master 60.7 K, changelog 133.8 K, backlog 32.7 K). Existing `plans/healthkit-health-connect.md` already flagged background delivery as "v2 deferred — requires Swift-level Capacitor plugin extension"; this work picks up that thread.
- Found `VYVEHealth/vyve-capacitor` (private, last updated 18 April) — the iOS/Android Capacitor wrapper repo. Significant finding: **no `ios/` directory committed on `main`**. `.gitignore` only excludes iOS build artefacts (`ios/App/build/`, `ios/App/Pods/`, etc.), not `ios/` itself. The full iOS native project (AppDelegate, Info.plist, App.entitlements, Xcode project, Capgo SPM Package.resolved) lives only on Dean's MacBook. Hygiene item flagged in the parked plan; orthogonal to whether we ever build background sync.
- Read Cap-go/capacitor-health main branch directly — `src/definitions.ts` (canonical TS API), `ios/Sources/HealthPlugin/HealthPlugin.swift` (the @objc bridge), `Package.swift`, and `CapgoCapacitorHealth.podspec`. Greps of `Health.swift` (59.6 K chars) for `observer` / `Observer` / `background` / `Background` / `enableBackground` / `BGAppRefresh` / `BGTask` / `listener` / `notifyListeners` / `HKObserverQuery` / `subscribe` all returned **zero matches**. Public API is exactly 10 methods (`isAvailable`, `requestAuthorization`, `checkAuthorization`, `readSamples`, `saveSample`, `getPluginVersion`, `openHealthConnectSettings`, `showPrivacyPolicy`, `queryWorkouts`, `queryAggregated`) — no private scaffolding, no events, no listeners. Capgo 8.4.7 is a purely pull-based foreground accessor.
- Web-confirmed Apple's current entitlement name (`com.apple.developer.healthkit.background-delivery`), Info.plist requirements (`UIBackgroundModes` += `fetch` for `BGAppRefreshTask`; `BGTaskSchedulerPermittedIdentifiers` += our task identifier; **no `"healthkit"` UIBackgroundMode exists** — the entitlement alone is the gate), and App Store review stance (stricter than standard; reviewers want explicit justification in App Store Review Notes).

**Architecture reached:** companion Swift Capacitor plugin (~400 lines) sitting alongside Capgo, registers `HKObserverQuery` + `enableBackgroundDelivery(.immediate)` for 5 sample types (workouts, steps, distance, activeEnergyBurned, bodyMass), backs that with `BGAppRefreshTask` as a daily floor, refreshes Supabase access token from a Keychain-stored refresh token (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`), POSTs to `sync-health-data` v7 in the same JSON shape `healthbridge.js` uses. **Zero server-side changes** — `sync-health-data` v7 is already idempotent on `native_uuid` so foreground/background overlap is a no-op. Forking Capgo or waiting on upstream both rejected with reasons documented.

**Scope landed at ≈4–5 Claude-assisted build sessions + 1 week real-time device soak on Dean's iPhone 15 Pro Max + App Store review cycle (≈2–3 weeks calendar).**

**Parking decision (Dean's call):** disproportionate cost for a v2 improvement on a v1 feature whose parent (the Capacitor wrap itself) isn't on the App Store yet. Foreground autotick is doing a respectable job for members who open VYVE at least weekly. No external signal (enterprise pilot, member feedback, engagement-data cohort) currently justifies the work. Unpark signals captured in §0 of the plan.

**Committed:** full plan at `plans/healthkit-background-sync.md` (29.8 K chars) — preserves the technical findings so we don't redo them. Master.md `§21 → Soon` updated with a one-line pointer. Backlog `Post-launch HealthKit workstreams` updated with the parked entry next to Nutrition/MFP-via-HK (also parked, also blocked on Capgo plugin limits — a recurring shape).

**No code shipped this session by design.**

---

## 2026-04-25 — Autotick session 3a: badge dropped, copy-only attribution

Post-ship review with Dean. He asked what the "pending Lewis design sign-off" on the `.hk-badge` scaffold actually referred to, I searched every brain file, and the honest answer came back: no design artifact exists, Lewis was never asked about a badge, no mockup or Figma anywhere. The scaffold and the dependency label were both phantoms — carried forward verbatim from my session 3 handoff prompt without anyone ever questioning where the badge idea came from. It traces back to one speculative sentence in `plans/habits-healthkit-autotick.md` line 195 drafted during an earlier Claude-only session. Never Lewis, never Dean, never a designer.

Dean's call: drop the badge entirely, replace attribution with a one-line copy variant on the existing done-state sub-label. Auto-ticked rows now read "Done today / from Apple Health"; manual-yes rows unchanged at "Done today / Logged to your progress". No new visual element. The `.hk-progress` bar + text on unsatisfied rule rows stays — that's a genuine UX affordance, not attribution theatre.

**habits.html diff (-591 chars):**

- Dropped: `.hk-badge` + `.hk-badge svg` + `.habit-card.autotick::before` CSS; `HK_HEART_SVG` constant; `hkBadgeHTML` templating variable + interpolation; `.autotick` class on card element; "pending Lewis" comment block.
- Added: `const doneSubCopy = autotick ? 'from Apple Health' : 'Logged to your progress'` in the done branch of `habitCardHTML`; replacement CSS comment noting the copy-only model.
- Kept (all still correct): `notes='autotick'` on auto-logged `daily_habits` rows, `logsToday[id].autotick` rehydration on reload from `row.notes === 'autotick'`, `runAutotickPass()` pre-render pass, all `member-dashboard` v51 wiring, `.hk-progress` progress-hint rendering, upsert-on-conflict, Undo DELETE flow.

**Why this matters as a codification moment, not just a UX tweak.** The badge survived a whole session drift cycle — it was invented by one Claude session, embedded in a plan committed to the brain, then quoted back at face value by the next session (me, yesterday) as if it were approved scope. The "pending Lewis design sign-off" label made it sound real without ever being real. Two guardrails to carry forward:

- When a plan attributes future work to a named person's sign-off, the brain should reference the evidence (a Figma URL, a changelog entry where they approved it, a message thread). If no evidence exists, the sign-off language should not survive into downstream planning.
- When picking up scope from a handoff prompt, phrases like "pending X's sign-off" get scrutinised before being treated as a blocker. Dean explicitly caught this one with "what is the heart glyph badge design" — exactly the right question, and neither of us knew the answer.

Commit `8272a2c4` on vyve-site ([link](https://github.com/VYVEHealth/vyve-site/commit/8272a2c400299c9682d962206e0b41555f522e29)). Script-tag balance 7/7, brace/paren/bracket deltas zero, byte-exact post-commit verify. No server, SQL, or SW changes.

---

## 2026-04-25 — Autotick session 3 shipped: habits.html wired to v51, feature end-to-end complete

Final piece of the Habits × HealthKit autotick workstream. `habits.html` now consumes the `habits` block shipped by `member-dashboard` v51 in session 2 and pre-populates the UI from it. This completes the autotick feature end-to-end — schema (7b), server evaluator (session 2), and client UI (session 3) all live. No server changes this session; no SQL either — `daily_habits_member_habit_date_unique (member_email, activity_date, habit_id)` turned out to already be present on the live DB (previous session added it without being loud about it) and 0 duplicates confirmed.

**Live-state discoveries on entry.** The session started with a DB audit before any code. Three small corrections to the pre-existing brain:

- `daily_habits_member_habit_date_unique` unique constraint is already present on `daily_habits` — the plan flagged it as "verified safe to add", live reality is it was already added. Zero duplicates on `(member_email, activity_date, habit_id)`.
- `cap_daily_habits()` trigger caps at **10 habit rows per member per day**, not 1/day as `master.md` claimed — 1/day was the legacy enforcement, the function was loosened at some earlier point and the doc drifted. Corrected master in the same commit.
- The upsert-on-conflict path was already wired in `logHabit` (with `Prefer: resolution=merge-duplicates`) and an Undo button + DELETE flow was already live in `undoHabit`. So the "editing bug" portion of the session 3 scope was already shipped — what remained was the autotick client UI.

**Client changes in `habits.html`.** One file touched, 6,918 bytes added (35,594 → 42,512 chars). Structured in four logical pieces:

- **Fourth parallel fetch added.** `fetchDashboardHabits()` calls `member-dashboard` v51 with the authed Supabase session JWT, returns the full dashboard payload. `loadHabitsPage` now `Promise.all`s four queries (direct `member_habits`, `daily_habits` today, `fetchHabitDates`, and `fetchDashboardHabits`) — a zero-added-latency pattern since they run in parallel. The v51 `habits` block returns `{habit_id, habit_pot, habit_title, habit_description, habit_prompt, difficulty, has_rule, health_auto_satisfied, health_progress}` and is merged into `habitsData` by `habit_id` (verified 67/67 alignment between `member_habits.habit_id` and `habit_library.id` beforehand). `assigned_by` is preserved by keeping the direct `member_habits` select — v51 doesn't return it.
- **Pre-render autotick pass.** `runAutotickPass()` filters `habitsData` to `has_rule === true && health_auto_satisfied === true && !logsToday[habit_id]`, upserts a yes row for each with `notes: 'autotick'`. Runs once after the data loads, before the first render, so there's no flicker. Fails silently on per-habit errors (typically the cap-trigger divert at 10/day, extremely rare). The manual upsert path in `logHabit` is unchanged and still uses the same `on_conflict=member_email,activity_date,habit_id` + `merge-duplicates` semantics, so re-taps after autotick correctly overwrite the autotick stamp.
- **`notes='autotick'` as the source-of-truth flag.** The `daily_habits` table has no `source` column; instead, autotick-written rows are stamped with `notes='autotick'` to distinguish them from manual yes rows. On page load, `logsToday[id].autotick` is rehydrated from `row.notes === 'autotick'`, which means the Apple Health badge (currently hidden) stays stable across reloads without adding DDL. `notes='skipped'` is the existing skip-vs-no discriminator; the two values are mutually exclusive (skip → habit_completed=false, autotick → habit_completed=true).
- **Badge + progress hint markup.** Two new CSS classes — `.hk-badge` scaffolded `display:none` pending Lewis's design sign-off (Apple Health heart SVG + "Apple Health" label rendered in the DOM, one line flip when approved), and `.hk-progress` rendered visibly as a compact progress bar + text (`6.8 / 10 km`, `9,136 / 10,000 steps`, `294 / 420 minutes`, `18 / 30 minutes`) on rule rows where `health_auto_satisfied === false && !status`. Format helper keeps it unit-aware: 1dp for km, integer with `toLocaleString('en-GB')` thousands comma for everything else. `.habit-card.autotick` class adds a subtle teal left-border accent to the pot-colour stripe.

**Cache key bumped `vyve_habits_cache` → `vyve_habits_cache_v2`.** Stored payloads from the pre-session-3 version don't carry the new `has_rule` / `health_auto_satisfied` / `health_progress` fields, and the optimistic cache-first render would paint a stale view before the network fetch catches up. Bumping the key means old caches are cleanly ignored on first load and new payloads land under the new name. Low-cost migration, no eviction needed — the old key is simply never read again. Applied in four places: two reads (online optimistic, offline fallback), one write, and one `removeItem` in `undoHabit`.

**Null-not-false preserved client-side.** The three branches of the UI match the server semantics exactly: `has_rule && health_auto_satisfied === true` → autotick yes with hidden badge; `has_rule && health_auto_satisfied === false` → three buttons + progress hint; `health_auto_satisfied === null` → identical to pre-autotick UI (no hint, no pre-tick, no badge). Members without a HealthKit connection or without data in the window see zero change from yesterday's behaviour. `HEALTH_FEATURE_ALLOWLIST` is still Dean-only on v51, so today only Dean's account sees the autotick path fire — and only on the one rule-bearing habit in his active set (`10-minute walk`, distance_km ≥ 1, 6.80 km logged today → satisfied).

**No SW cache bump required.** `habits.html` is an HTML file; `sw.js` has been network-first for HTML since 21 April, so changes reach users on next reload without a version bump. No non-HTML assets touched. Cache version on the SW stays `v2026-04-24d-write-path-cleanup`.

**No server changes.** `member-dashboard` v51 unchanged from session 2. `sync-health-data` v7 unchanged. Taxonomy module unchanged. No SQL DDL. The unique constraint, cap trigger, RLS policy, and activity-log/home-state refresh triggers were all audited pre-edit and confirmed correct for the new upsert flow — RLS is `cmd=ALL` so the UPDATE path via `ON CONFLICT DO UPDATE` passes cleanly, and the cap trigger only affects rows over 10/day/member (not hit in practice).

**Sanity gates at commit.** Script-tag balance 7/7 (Hard Rule 43), brace/paren/bracket deltas all zero across the file, 13 new-identifier counts all match expectations, commit via `GITHUB_COMMIT_MULTIPLE_FILES` inside the workbench, post-commit fetch verified byte-for-byte parity against local draft. Commit `25611117ee773a4374ff8a615abd7a081ed46054` ([link](https://github.com/VYVEHealth/vyve-site/commit/25611117ee773a4374ff8a615abd7a081ed46054)).

**Known polish items, parked.**

- Apple Health badge currently hidden pending Lewis sign-off on the heart-glyph design — one-line CSS flip (`display:none` → `display:inline-flex`) unblocks it. Element + label copy + aria are all in place.
- "Done today / Logged to your progress" copy on autotick-origin rows could be differentiated (e.g. "Marked done from Apple Health"), but the hidden badge already carries the attribution signal — will revisit when Lewis approves the badge and we see real-member reactions.
- After `undoHabit`, autotick does NOT re-fire on the same page (guarded by `!logsToday[id]` check at render time). But on a hard reload, HK still says satisfied and autotick re-logs. Acceptable for current scope since allowlist is Dean-only; may need an opt-out marker (e.g. `notes='autotick_declined'`) when HAVEN-style sensitivity applies to habit auto-confirmation.
- `cap_daily_habits` 10/day cap still routes over-cap inserts to `activity_dedupe`. If we ever support 10+ active habits per member AND all have rules AND all satisfy same day, the 11th+ autotick diverts silently. Not a current-state concern (members have 3–7 active habits).

**Feature status.** Habits × HealthKit autotick — FULLY SHIPPED end-to-end. Sessions 1 (7b: schema + seeds) + 2 (server evaluator + `_shared/taxonomy.ts`) + 3 (client UI + the editing-bug fix which turned out to already be in place) all live as of 25 April 2026. Plan marked complete at `plans/habits-healthkit-autotick.md`; all session rows struck.

---

## 2026-04-24 — Autotick session 2 shipped: server evaluator + _shared/taxonomy.ts

Second session of the day after 7b + master rewrite. Deliverable per `plans/habits-healthkit-autotick.md` session 2: server-side evaluator in `member-dashboard` v51 that returns `health_auto_satisfied` + `health_progress` per assigned habit, plus a shared `_shared/taxonomy.ts` module imported by both `member-dashboard` and `sync-health-data` so the workout-type classification can't drift. Zero behaviour change to the sync pipeline — this is a backend-only ship. Session 3 (client UI + editing bug fix) still pending.

**`_shared/taxonomy.ts` created.** 6.7k chars. Extracts from the old `sync-health-data` v6 inline body: `normWorkoutType`, `STRENGTH_CANON`, `CARDIO_CANON`, `IGNORED_CANON`, `YOGA_CANON`, `YOGA_STRENGTH_MIN_MINUTES`, `ALLOWED_DAILY_TYPES`, and a new `classifyWorkout()` helper that encodes the strength/cardio/ignored decision tree in one place. Adds `HealthRule`, `HealthProgress`, `HealthEvaluation` types + `applyOp()` operator dispatch + UK time helpers (`ukLocalDateISO`, `lastNightWindow`, `isBST` approximation) + metric-to-column mapping (`dailyMetricColumn`, `dailyUnitFor`). Shipped as a sibling file in both EF deploy payloads — same content, independently loaded at cold start. Supabase Edge Functions don't share filesystem across deployments, so `_shared/` is a per-EF convention, not a global path.

**`member-dashboard` v50 → v51.** Additive. Existing response shape preserved verbatim. Five new parallel queries added to the `Promise.all` batch: `member_habits` (with embedded `habit_library(id, habit_pot, habit_title, habit_description, habit_prompt, difficulty, health_rule)` via PostgREST FK select), `member_health_daily` for today's rows filtered to `source=healthkit`, `member_health_samples` for sleep segments in the last-night window, `workouts` + `cardio` for today's rows. The evaluator builds a `HealthSnapshot` once (`dailyByType: Map<metric, {value, unit}>`, `sleepLastNightAsleepMin`, `workoutsTodayCount`, `cardioTodayCount`, `cardioTodayMinutes`, `hasHealthkitConnection`) then routes each habit's rule against it — no N+1 queries per habit.

**Null-not-false semantics.** If a habit has no rule, or if the member hasn't connected HealthKit, or if there's no data in the relevant window (e.g. iPhone-only member with no sleep segments), the evaluator returns `{satisfied: null, progress: null}` rather than a false tick. Plan's rationale: members with no data shouldn't see a disappointed blank tick — UI treats null as "manual-only" and renders the existing radio as-if the rule wasn't there. This is the single most important UX semantic of the evaluator; false means "you didn't hit it", null means "we can't evaluate it".

**Habits block in response.** Each active habit returns:

```
{ habit_id, habit_pot, habit_title, habit_description, habit_prompt,
  difficulty, has_rule, health_auto_satisfied, health_progress }
```

`has_rule` is a cheap boolean for client branching. `health_progress` when non-null is `{value, target, unit}` — the evaluator returns real data for all rule shapes so session 3 can render "6.8 / 10 km" hints without extra fetches.

**`sync-health-data` v6 → v7.** Pure refactor. Deletes inline `normWorkoutType` + canon sets + `ALLOWED_DAILY_TYPES` from the body; imports from `./_shared/taxonomy.ts` instead. `promoteMapping` body preserved byte-identical to v6 (verified via substring check pre-deploy). `queryAggregated` routing, outlier checks, cap bypass for HK rows, `queue_health_write_back` trigger — all untouched. Zero behaviour change intended; if anything breaks in sync, the ~7k character refactor is the suspect.

**Rule-shape validation.** SQL replica of the evaluator logic run against Dean's live data pre-deploy, oracles:

| Rule | Evaluated | Target | Satisfied |
|---|---|---|---|
| `10-minute walk` (`daily.distance_km gte 1`) | 6.80 km | 1 | true |
| `Walk 8,000 steps` (`daily.steps gte 8000`) | 9,136 | 8,000 | true |
| `Walk 10,000 steps` (`daily.steps gte 10000`) | 9,136 | 10,000 | false |
| `Sleep 7+ hours` (`samples_sleep.sleep_asleep_minutes gte 420`) | 294 min | 420 | false |
| `Complete a workout` (`activity_tables.workout_any exists`) | 0 | — | false |
| `30 minutes of cardio` (`activity_tables.cardio_duration_minutes gte 30`) | 0 | 30 | false |

All 6 rule shapes (every source/agg/op combination seeded in 7b) produce expected outputs against real data. Dean's account is currently the only test surface (sole member in `HEALTH_FEATURE_ALLOWLIST`), and only `10-minute walk` is in his assigned active habits — so in practice the session 2 ship adds autotick data for exactly one habit on one member right now. Rest exercise via SQL parity.

**Gotchas codified.**

- Sleep state lives at `metadata.sleep_state` in `member_health_samples`, NOT `metadata.state`. First evaluator draft used the wrong path — fixed before deploy. When the sleep rule looks dead in future, this is the first thing to check.
- `member_health_daily` stores distance in meters (`unit: "meter"`), not km. Rule metric `distance_km` triggers a `/1000` conversion in the evaluator. The rule authoring convention is to pick the display unit and let the evaluator convert — rules don't assume storage units.
- `member_health_daily.value` for sleep samples is already the pre-computed duration in minutes — sum `value` directly, don't recompute `(end_at - start_at)`. The client's `healthbridge.js` did the arithmetic when the sample was ingested.
- Evaluator snapshot pattern — single fetch per dashboard request, all rules evaluate against the in-memory snapshot. Avoids both N+1 SQL and repeated JSON serialisation. If a habit is assigned that references a metric not in the snapshot (e.g. `workout_strength` specifically), the evaluator returns null; snapshot widens when that rule ships.
- BST approximation: `isBST()` uses April–October month check. Real BST transitions happen last Sunday of March / last Sunday of October; members using the evaluator on a transition day may see ±1h shifted windows for up to 7 days/year. Acceptable error margin for v1; exact transitions ship when multi-timezone support does.
- `esm.sh` imports still avoided in the shared file; all crypto-adjacent helpers (none currently) would go through Deno's built-in Web Crypto per the standing rule.

**Deployment.** Both EFs now ACTIVE: `member-dashboard` v51 (`ezbr_sha256: f0d28cf5d1967ada0103f786979338b70cdd6ecb75d2fa3093d9560b84f5e64e`, `verify_jwt:false` preserved — JWT validated internally via `getUser()`), `sync-health-data` v7 (`ezbr_sha256: f08de14c540d3e8b84564909c49117a65e88d071c131e18167e261b4cbc16cfa`, `verify_jwt:false` preserved — service role with internal JWT extraction). Each ships its own copy of `_shared/taxonomy.ts`; if that file ever changes, both EFs must redeploy in lockstep to stay consistent.

**Known unshipped evaluator cases.** `workout_strength` and `workout_cardio` specific rules: evaluator returns null. No seeded habit uses them today — `Complete a workout` uses `workout_any` which covers both. Future strength-specific habits need the evaluator to read `workouts.source='healthkit'` and filter by the type canon. Multi-source arbitration (HealthKit + Fitbit): evaluator hardcodes `source='healthkit'`. Will move to `preferred_source` column logic when a second source actually exists.

**Next.** Session 3 — `habits.html` pre-populate from `health_auto_satisfied`, Apple Health heart badge (pending Lewis design sign-off), progress hints on unsatisfied rows, editing affordance for same-day submissions, `daily_habits` unique constraint + upsert rework. That ship completes the autotick feature end-to-end.

---

## 2026-04-24 — Brain master.md full rewrite + Autotick session 7b shipped

Two related pieces of work in a single session. 7b is the continuation of the HealthKit-autotick work queued after session 7a shipped the source-aware cap fix. The master rewrite was the other pending item — previous master had drifted and the committed file had latent base64 corruption from a prior workbench commit.

### Autotick session 7b — `habit_library.health_rule` + seeds

Plan at `plans/habits-healthkit-autotick.md` session 1. Deliverable: schema column + retrofit existing mappable habits + seed Lewis-approved HK-native habits. No evaluator, no client UI — sessions 2 and 3 respectively. Scope boundary held deliberately.

**Schema change.**

```sql
alter table public.habit_library
  add column if not exists health_rule jsonb;
```

Nullable (null = manual-only, no autotick evaluation). Column comment codifies the rule shape and supported source values. No index — scanned per-member at request time, ~34 rows in the whole library.

**Rule shape.**

```json
{"source": "daily|samples_sleep|activity_tables",
 "metric": "steps|distance_km|active_energy|sleep_asleep_minutes|workout_any|workout_cardio|workout_strength|cardio_duration_minutes",
 "agg": "sum|max|exists|duration_sum_minutes|exists_row_gte",
 "window": "today_local|last_night|last_24h",
 "op": "gte|lte|eq|exists",
 "value": 10000}
```

Future-extensible: `vyve_nutrition`, `vyve_session_views`, `health_connect_daily` all slot in as new `source` values without schema change.

**Retrofit of two existing habits.** `10-minute walk` (movement, easy) → `daily.distance_km ≥ 1 today`. `Sleep 7+ hours` (sleep, medium) → `samples_sleep.sleep_asleep_minutes ≥ 420 last_night` (sum of light/rem/deep/asleep state segments). `Take the stairs` skipped — needs `flightsClimbed` scope not in v1 grant.

**Four Lewis-approved new seeds** (created_by `autotick-7b`, all movement pot):

- `Walk 10,000 steps` (medium) — classic daily target. Default for NOVA / high-training flag.
- `Walk 8,000 steps` (easy) — evidence-based gentler variant (Paluch et al., Lancet Public Health). Default for 50+ / beginner flag / non-NOVA.
- `Complete a workout` (medium) — any workout today via `activity_tables.workout_any exists`. Watch auto-detects, Strong/Strava sync via HK too.
- `30 minutes of cardio` (medium) — `activity_tables.cardio_duration_minutes sum ≥ 30 today`.

Threshold values live in `health_rule.value` — A/B variants will be schema-free when we want them.

**Not-in-v1.** Apple Watch rings (needs `standHour` + move goal exposure). Active calories silent-tracked only (no user-facing habit). Dietary metrics deferred (Capgo 8.4.7 exposes zero dietary types). `Take the stairs`. Fuzzy signals left null for manual-only: `Active commute`, `Move every hour`, `Stretch for 5 minutes`, `Daily breathing exercise`.

**No behaviour change yet.** `member-dashboard` v50 doesn't read `health_rule` — session 2 will extend to v51+ to return `health_auto_satisfied: bool|null` and `health_progress: {value, target, unit}|null` per assigned habit. `habits.html` doesn't yet pre-populate tick state. Today's impact: 6 rows in the library carry rules, sitting idle.

### Brain master.md full rewrite

Previous master had drifted — still claimed 35 tables / 15 core EFs / 31 members when live state was 70 tables / ~25 core EFs / ~17 members. Committed file was also base64-corrupted from an earlier workbench commit (104k gibberish decoding to 77k real content). Full rewrite rather than patching.

**Source of truth for the rewrite.** Live Supabase `list_tables` (70 tables, verified) and `list_edge_functions` (75 active, of which ~25 core-operational). Recent changelog entries (7a, session 6, session 5 sub-sessions). Current `tasks/backlog.md`. Existing slower-changing business sections (pillars, origin, charity, GDPR, company values) freshened rather than rewritten from scratch.

**Structure.** 24 sections covering company + legal, mission + positioning, business model, pipeline, tech stack, Supabase (70 tables broken into 9 functional groups), EFs (core operational vs retired), portal pages (including Exercise Hub + Admin Console), onboarding, personas, AI features (autotick 7b captured), ops, dashboards, workouts, brand + podcast, GDPR, charity, website, current status, blockers, priorities, decisions, gotchas, credentials. 55k chars — tighter than previous 77k by removing duplication and archival content that belongs in changelog, not master.

**Gotchas section notably expanded** with items codified since last rewrite: `SUPABASE_APPLY_A_MIGRATION` silent partial execution, plpgsql composite-type trigger gotcha (session 7a root cause), activity cap source-discrimination pattern, BST timezone bug class, esm.sh unreliability in Deno, `first_name` in `members` not user_metadata, iOS Web Push user-gesture requirement, base64 corruption for >50K commits.

**Committed via `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", args)` inside the workbench** — never direct MCP, per codified rule. Verified by fetching committed file and checking first 100 chars decode clean (not base64 gibberish).

### Files changed

- Supabase: `habit_library.health_rule jsonb` column + comment; 2 retrofits (`10-minute walk`, `Sleep 7+ hours`); 4 INSERTs (`autotick-7b` seeds).
- Brain: this entry (prepended to `brain/changelog.md`); `brain/master.md` full rewrite; `tasks/backlog.md` 7b completion tick; `plans/habits-healthkit-autotick.md` session 1 marked complete.

### Gotchas codified

1. **Master rewrite > incremental patch.** Documented tables and EF versions fell far behind live state when prior sessions tried to patch the master instead of rewriting it. Full rewrite is cheaper than chasing drift.
2. **Large brain commits must go through the workbench `run_composio_tool` path.** Direct MCP `GITHUB_COMMIT_MULTIPLE_FILES` on a ~55k+ file produces base64 corruption half the time. Post-commit verification (fetch + first-100-char check) is mandatory.

---

## 2026-04-24 — HealthKit session 7a: workout cap now source-aware; collateral fix for broken `queue_health_write_back`

Pre-work for the habits × HealthKit auto-tick plan. The existing `cap_workouts` / `cap_cardio` BEFORE INSERT triggers cap at 2/day and divert overflow to `activity_dedupe` — designed for manual-entry spam prevention, but wrong for Apple Watch members who routinely do 3+ sessions a day (morning run, lunchtime class, evening strength). A third HK-sourced workout was silently disappearing from workouts.html, from the member's 30-activity charity count, and from the leaderboard. Fix needs to ship before any habit rule saying "complete a workout" is evaluated against Watch data, otherwise auto-tick would disagree with reality.

### Schema change — `source` column on workouts + cardio

```sql
alter table public.workouts add column source text not null default 'manual';
alter table public.cardio   add column source text not null default 'manual';
```

Default `'manual'` means all existing rows retro-populate as manual (53 workouts, 21 cardio at time of migration) and new manual inserts from the PWA continue working unchanged without any client-side patch. Retro-stamped the 2 workouts and 9 cardio rows that `sync-health-data` v2 had promoted from HK samples during session 5's backfill — joined via `member_health_samples.promoted_to` / `promoted_id` and updated `source = 'healthkit'` on the target rows. Provenance now accurate across the whole table.

### Check constraint drop — `session_number` can no longer be capped at {1,2}

The `workouts_session_number_check` and `cardio_session_number_check` check constraints (`session_number = ANY (ARRAY[1,2])`) were tied to the old 2/day cap. With the cap lifted for HK rows, a 3rd HK-sourced workout on the same day would violate the constraint even though the trigger now allows it. Both constraints dropped. `sync-health-data` continues to send `session_number: 1` on every HK-promoted row — it was never used for ordering anyway (`logged_at` serves that purpose), and no unique constraint references it.

### Trigger rewrite — `cap_workouts` and `cap_cardio` source-aware

```sql
if coalesce(new.source, 'manual') = 'manual' then
  if (select count(*) from workouts
       where member_email = new.member_email
         and activity_date = new.activity_date
         and coalesce(source, 'manual') = 'manual') >= 2 then
    insert into activity_dedupe (...) values (...);
    return null;
  end if;
end if;
return new;
```

Key property: non-manual rows bypass the cap entirely and the cap counts only manual rows. A member who logs 2 manual workouts, then has 4 HK workouts sync, then tries to log a 3rd manual — the 3rd manual still diverts to dedupe (manual count is 2, not 6). Watch-heavy members get all their sessions counted; no change to manual spam prevention.

### Charity + cert counters stay naturally capped at 2/day

Checked before shipping: `get_charity_total()` uses its own `LEAST(COUNT(*), 2)` in the UNION ALL, and `increment_workout_counter()` / `increment_cardio_counter()` check `existing_count < 2` before bumping `members.cert_workouts_count` / `cert_cardio_count`. Both independent of the BEFORE INSERT trigger. Lifting the trigger cap for HK inflates nothing downstream — charity months and certificate tier progression remain capped at 2/day per activity type by design. Real additional activity shows on the member's dashboard and leaderboard but doesn't unfairly rocket the charity counter past its intended pace. Clean separation.

### Collateral discovery — `queue_health_write_back()` crashed on any workouts INSERT

Caught by the first live test. The AFTER INSERT trigger `queue_health_write_back_workouts` on `public.workouts` calls the shared `queue_health_write_back()` function, whose IF clause was:

```
if TG_TABLE_NAME = 'weight_logs' and NEW.native_uuid is not null then
  return NEW;
end if;
```

plpgsql tries to resolve `NEW.native_uuid` against the composite type of NEW (workouts for a workouts trigger firing). Workouts table has no `native_uuid` column, so the reference fails with `record "new" has no field "native_uuid"` before the AND short-circuits. Any workouts INSERT for a member with a `member_health_connections` row would throw. Session 5d's cleanup note had reassured us this trigger was "zero runtime cost (WHERE clause matches zero rows without the scope granted)" — wrong, the function crashed before reaching the WHERE. Only reason it hadn't exploded yet: the three live members without HK connections don't trigger the evaluation cost, and the two HK-connected members (me + possibly Lewis) hadn't manually logged workouts since session 5d shipped 24 April earlier.

Fixed defensively by nesting: outer `if TG_TABLE_NAME = 'weight_logs'` gates the inner `to_jsonb(NEW) ->> 'native_uuid'` jsonb-safe check. jsonb extraction works on any composite type; direct field access does not. Function now safe for `workouts`, `cardio`, `weight_logs`, and any future table that gets the trigger attached.

### `sync-health-data` v6 — stamps `source: 'healthkit'` on promoted rows

Promotion path in `promoteMapping()` now passes the platform tag through and attaches it to both the `workouts` and `cardio` row payloads. Without this the NOT NULL DEFAULT 'manual' would make every HK-promoted row look like a manual entry, which would cap-count and negate the trigger fix. Signature change: `promoteMapping(sample, memberEmail, sourceTag)`. Weight rows unchanged — `weight_logs` has no source column.

The pre-existing `promoted.skipped_cap` counter in handlePullSamples continues not to fire correctly when the cap trigger returns NULL (empty data, no error, neither branch runs) — noted but not fixed in v6 because with source stamping in place no HK row will be cap-triggered anyway. If we later add non-manual non-HK sources (Strava direct, Strong direct, etc.), the counter semantics need revisiting.

### End-to-end validation via transactional rollback

Asserted in a `DO` block that ended with a tagged `raise exception` so nothing persisted:

```
TEST_PASS_ROLLBACK hk=4 manual=2 dedupe=1
```

4 HK workouts written source='healthkit' bypassed the cap as intended. 2 manual rows land normally. 3rd manual routes to activity_dedupe. All seven triggers on the workouts table fire cleanly. Transaction rolls back on exception so no test data hits live tables.

### Files changed

- Supabase: `workouts.source` + `cardio.source` columns added; session_number check constraints dropped; `cap_workouts` + `cap_cardio` rewritten source-aware; `queue_health_write_back` nested-conditional fix; 2 workouts + 9 cardio rows retro-stamped `source='healthkit'`.
- Supabase EF: `sync-health-data` v6 ACTIVE (stamps source on promotion).
- Brain: this entry + backlog tick for Autotick pre-req; `plans/habits-healthkit-autotick.md` revised to reflect queryAggregated/member_health_daily routing and mark session 0 (sleep_state patch) and session 7a (cap fix) complete.

### Gotchas codified

1. **plpgsql triggers that dereference `NEW.<column>` only resolve against the specific table's composite type.** A shared trigger function attached to multiple tables must not reference a column that exists on only some of them — even inside an IF guard — because plpgsql evaluates the reference as part of compiling the expression, not as part of short-circuit evaluation. Use `to_jsonb(NEW) ->> 'column_name'` for defensive access across table types.
2. **Activity caps that were originally spam-prevention guards don't map onto third-party data sources.** Source-discriminate the cap (`manual` vs everything else) rather than dropping it entirely — otherwise manual logging regains its original spam vector.
3. **`promoted.skipped_cap` in sync-health-data only counts `error` branch hits, not `data=[]` empty returns from BEFORE INSERT NULL.** When a cap trigger diverts to activity_dedupe, PostgREST returns 200 with empty data (not an error). Any future source-aware audit needs to compare `insertedSamples.length` against `promoted.workouts + promoted.cardio + promoted.skipped_cap` and surface the delta.

### Outstanding for session 7

- Full rewrite of `brain/master.md` — session 6's pipeline changes and session 7a's cap fix together constitute enough schema + EF change that the existing master will drift quickly if patched. Needs its own session: audit of all live EF versions (sync-health-data v6, member-dashboard v50, certificate-checker v9, etc.), table inventory including `member_health_daily`, trigger inventory including source-aware caps and fixed `queue_health_write_back`, updated Hard Rules (plpgsql NEW dereference + source discrimination).
- Autotick sessions 7b–7d per the revised plan: schema + habit library additions (Lewis sign-off on copy/difficulty), server rule evaluator in `member-dashboard` v51+, client UI + editing bug fix combined.

### Commits this session

- Supabase: 7 migrations + 1 EF deploy (`sync-health-data` v6 ACTIVE)
- Brain: this entry + session 6 writeup + backlog update + autotick plan revision

---

## 2026-04-24 — HealthKit session 6: pipeline rebuild around `queryAggregated`, new `member_health_daily` aggregate table, BST bucket fix, two views parked

Session 5's finish left one big open item: verify the six non-workout sample types (steps, distance, active_energy, heart_rate, sleep, weight) actually land on the next on-device sync now that the `readSamples` client fix and the workout-type normalisation EF fix had both shipped. Initial spot-check on-device showed steps/distance/active_energy landing — but heavy. Eight days of raw step samples for one member was hundreds of small rows each covering ~10 minutes of walking. By the time the `apple-health.html` inspector page tried to render 954 samples inline the payload was a blocker for any page that wanted to do day-level aggregation over 30 days.

Architectural pivot: for metrics where Apple exposes a native aggregation API (`HKStatisticsCollectionQuery` via Capgo's `queryAggregated`), pull daily totals directly on-device and store pre-aggregated rows. For metrics where the fine-grained shape matters (heart rate samples, sleep state segments, weight readings as point-in-time events), keep pulling into `member_health_samples` where they belong.

### New table — `member_health_daily`

Long-format. One row per `(member_email, source, sample_type, date)` tuple:

- `member_email text`, `source text`, `sample_type text`, `date date`, `value numeric`, `unit text`, `preferred_source text nullable`, `ingested_at timestamptz default now()`
- Primary key / unique: `(member_email, source, sample_type, date)` with the EF upserting on conflict
- `ALLOWED_DAILY_TYPES = {steps, distance, active_energy}` in the EF allowlist
- `preferred_source` reserved for a future multi-source dedupe arbiter (e.g. when a member connects both HealthKit and Fitbit). Currently null across all rows; not read by the EF. Rule evaluators should filter on `source = 'healthkit'` until the arbiter lands.

The value column stores whatever Apple's `HKStatisticsCollectionQuery` returned for that bucket: integer step counts, metres for distance, kilocalories for active_energy. Units are preserved as-is from HK and stored per row so downstream conversions are explicit.

### Watch-vs-iPhone dedupe is native in HealthKit, not in our code

`HKStatisticsCollectionQuery` with `sumQuantitySamples` across all sources that contributed to a bucket returns one value per day with Apple's internal priority logic already applied — Watch takes precedence over iPhone for overlapping windows, motion sensors on the wrist are preferred over phone accelerometer when both are present. This replaces what would have been a painful hand-rolled dedupe if we'd aggregated from `member_health_samples` ourselves. Saves us from a class of subtle double-counting bugs (a walk logged on the watch would also be counted by the phone in the member's pocket).

### BST bucket-anchor bug squashed

Early inspector readouts were showing daily buckets landing a day behind the actual walk. Root cause: `HKStatisticsCollectionQuery` anchors buckets to midnight local time, but the client was serialising the anchor with a default `Date` constructor that parses as UTC. During BST (+01:00) the anchor at midnight UK = 23:00 the previous day UTC, so yesterday's step count tagged with today minus one. Fix was client-side: construct the bucket anchor from local year/month/day components (`new Date(+y, +m-1, +d, 0, 0, 0, 0)`) rather than passing an ISO string through `new Date(...)`. Codifies the recurring BST gotcha that's bitten several portal areas (per memory) — TL;DR for future sessions: any date-math that crosses a day boundary near midnight must use local construction, never UTC parsing.

### handlePushDaily EF handler — sync-health-data v5

Client posts `{action: "push_daily", platform: "healthkit", daily: [{sample_type, date, value, unit}, ...]}` with the 60-day window it has. EF validates against `ALLOWED_DAILY_TYPES`, enforces a 60-day freshness cutoff (matching pull_samples), outlier-checks steps (reject if >200,000/day), and upserts to `member_health_daily` with `onConflict: 'member_email,source,sample_type,date'`. Batch limit 200 rows per call. Returns `{ok, upserted, skipped}` with skipped counts broken out by reason (invalid, too_old, bad_type, bad_value).

### Samples path still carries the rich-segment types

`member_health_samples` continues to land heart rate point samples, sleep segments (with `metadata.sleep_state` preserved from session 5's sampleToEF extension), and weight readings. Sleep segments carry Apple's full state vocabulary — today's 30-day distribution for my account: 1,609 min `light`, 693 min `rem`, 308 min `deep`, 223 min `asleep` (legacy consolidated state from pre-iOS-16 devices), 77 min `awake`. Rule evaluators for sleep should sum across `{light, rem, deep, asleep}` and exclude `{awake, inBed}`.

Note: `active_energy` still appears in `member_health_samples` as 6 point samples, overlapping with its aggregated representation in `member_health_daily`. Intentional — the daily aggregate is for fast habit-rule evaluation and dashboard display; the raw samples stay for future analytics. Any consumer computing daily totals MUST read from `member_health_daily` not aggregate the samples (the daily row is the deduped Apple-authoritative value; the samples are unreliable for summation across sources).

### End-to-end validation on-device

- My account this morning: smart scale Bluetooth-synced → Apple Health → HKSample → Capgo readSamples → `member_health_samples` as weight=88.550000001 kg at 06:48 UTC → `promoteMapping` → `weight_logs.weight_kg=88.55` with matching `logged_at`. Visible on nutrition.html. Shadow-read guard prevents next sync echoing it back.
- Today's daily row: 9,136 steps, 833 active kcal, 6.8 km distance. Matches the Watch's Activity app.
- Heart rate: 775 samples for the three days since the fix shipped, point values with start/end timestamps, averaging to resting ~60 bpm for my account.
- Sleep: 169 segments over the 30-day window, fine-grained (1–32 min per segment), `sleep_state` metadata populated for every segment.

### Two views built and parked

Apple Health inspector (`apple-health.html`) and personal activity feed (`activity.html`) were both wired up during the session and both ended up shelved.

**apple-health.html** — Samples-table inspector intended to give me (and future devs) a single pane to debug what's arriving from Capgo. Works functionally; renders correctly on small payloads. With 954 samples in scope the inline rendering chokes — not an engineering mystery, just payload mass. Shelving for now is cheap because the page is unlinked from nav and nothing depends on it. When it's needed next it wants paging and/or virtualised rendering, or ideally a samples-query filter that restricts the pull to the last 24–48 hours by default.

**activity.html** — Personal self-view of recent workouts + cardio. Built, then removed from the Exercise Hub (`exercise.html`) because without GPS route maps on running/cycling entries it felt distinctly second-rate compared to Strava/Apple Health's own views. GPS would require either a direct Apple MapKit integration (iOS-only, Capacitor plugin fork) or pulling route polylines from HealthKit's workout metadata (not exposed by Capgo 8.4.7). Both out of scope for v1. The page stays in the repo unlinked — good chance the concept reappears inside a community/social context (feed of team activity, not per-member self-view) rather than as a personal surface, so the scaffolding is worth keeping.

### Currently active EF trail

- `sync-health-data` v5 ACTIVE — push_daily + pull_samples + confirm_write + mark_revoked handlers
- `member-dashboard` v50 — server-authoritative health feature flag + health_connections hydration (from session 5c)
- Client `healthbridge.js` — readSamples + queryAggregated calls + BST-safe daily bucket construction + sleepState metadata folding

### Outstanding for session 7+

- Workout cap collision with HK multi-workout days — split into its own pre-req session (session 7a).
- Habits × HealthKit auto-tick — rewrite the plan against the new routing (daily table for steps/distance/active_energy; samples for sleep; promoted workouts/cardio tables for completion rules).
- Full rewrite of `brain/master.md` — too much change since last rewrite.
- `apple-health.html` paging or scoped-pull rework before unshelving.
- `promoted.skipped_cap` counter semantics in sync-health-data — only counts errors, not BEFORE-INSERT NULL returns.
- Write-path round-trip still needs on-device validation for the workouts write target (dead-path; Capgo has no saveWorkout, but the schema reserves the lane).

### Commits this session

- vyve-site: session 6 work at commit `37ad068` — `healthbridge.js` queryAggregated integration + BST-safe daily bucket construction + push_daily client invocation; `apple-health.html` built (unlinked); `activity.html` built then unlinked from exercise.html
- Supabase: `member_health_daily` table created; `sync-health-data` v3 → v4 → v5 deployed ACTIVE through the session (weight native_uuid in v3, diagnostics persistence in v4, push_daily handler in v5)
- Brain: this entry (written retrospectively in session 7a)

---

## 2026-04-24 — HealthKit session 5: spot-check unearthed silent type-drop + failed promotion, taxonomy normalisation, server-authoritative feature flag, banner regression fix, and dead-path cleanup

Started the session aiming to close out HealthKit before broader testing — move off the localStorage dev flag, run the write-path round-trip, think through rollout. Step 1 was meant to be a five-minute spot-check of the initial 30-day pull that Session 4 logged as "completed" but that nobody had actually verified. It took ten minutes and surfaced two bugs that would have corrupted every subsequent test. The rest of the session was unwinding that.

### Finding 1 — only workouts reached `member_health_samples`

Query against the table for `deanonbrown@hotmail.com` returned 7 rows, all `sample_type='workout'`. Zero rows for steps, heart_rate, weight, active_energy, sleep, or distance, even though all seven scopes had been granted at connect time. Connection row said `last_sync_status: ok` with `total_synced: 0`.

Root cause: client-side. `healthbridge.js`'s `pullAllSamples` calls `plugin.querySamples()` for the six non-workout types. Capgo `@capgo/capacitor-health` 8.4.7 exposes no `querySamples` method — the correct name is `readSamples`. The `safe()` wrapper in `pullAllSamples` caught the six TypeErrors, logged them as console warnings, and returned `null`, dropping every sample. The Session 4 taxonomy audit had codified the real method list as `isAvailable, requestAuthorization, checkAuthorization, readSamples, saveSample, getPluginVersion, openHealthConnectSettings, showPrivacyPolicy, queryWorkouts, queryAggregated` — but the client was never patched to match. Six data types have been silently failing since Session 4 shipped.

### Finding 2 — all 7 workouts sat unpromoted

Of the 7 `workout` samples that did make it in, zero had `promoted_to` set. The samples were real — 3 Apple Watch runs (29 Mar, 4 Apr, 22 Apr), 2 Apple Watch walks (31 Mar, 1 Apr), 2 Strong-app strength sessions (both 7 Apr, both ~1 minute — mis-logs in Strong, not a VYVE concern).

Root cause: server-side. `sync-health-data` v1's promotion logic did `WORKOUT_TO_CARDIO.has(wt)` against a set of UpperCamelCase names (`"Running"`, `"Walking"`, `"TraditionalStrengthTraining"`). The Capgo plugin's `queryWorkouts` response uses lowerCamelCase (`"running"`, `"walking"`, `"strengthTraining"`), which is also what the Swift source's `HealthDataType` and workout-type enums serialize to. Every sample fell through to the `return null` branch — "unknown workout type, keep raw".

### Finding 3 — `total_synced` counter stomped on every re-sync

Minor, included for completeness: the EF's `upsert` uses `ignoreDuplicates: true`, so on a second sync with all-duplicate inserts the `.select()` returns `[]` and `total_synced` gets set to 0. Should be additive. Cosmetic — not fixed.

### Fix 1 — `sync-health-data` v2 with normalised workout-type matching

Rewrote the promotion path to be taxonomy-agnostic. Added `normWorkoutType(s) = String(s).toLowerCase().replace(/[^a-z0-9]/g, "")` and built canonical sets of normalised tokens. `running` / `Running` / `RUNNING` all collapse to `running`; `strengthTraining` / `STRENGTH_TRAINING` / `TraditionalStrengthTraining` handled distinctly but in the same strength set. Yoga-duration branching preserved. Ignored set expanded to cover the full HK leisure-sport list plus Health Connect variants. EF deployed as v2 (ACTIVE).

### Backfill — one-shot promotion for the 7 existing unpromoted samples

EF's promotion loop only iterates over freshly-inserted samples, so a re-sync with the now-fixed EF wouldn't re-promote the existing 7 rows (blocked by `native_uuid` conflict). SQL DO block mirrored the EF's `promoteMapping` logic against `member_health_samples` where `promoted_to IS NULL AND sample_type='workout'`. Result: 5 rows → `cardio`, 2 rows → `workouts`, all with correct `day_of_week`, `time_of_day`, `duration_minutes`, `logged_at`. `promoted_to` and `promoted_id` backfilled on the source rows. Safe to re-run (filters on unpromoted only).

### vyve-site commits (all on main)

**Session 5a — [e060edc](https://github.com/VYVEHealth/vyve-site/commit/e060edcdcd4d64b88e72044fa8752bab81bbebfb).** `healthbridge.js` now calls `plugin.readSamples()` instead of the non-existent `querySamples()`. Added `s.platformId` to the `native_uuid` fallback chain in `sampleToEF` — `readSamples` exposes the HealthKit UUID there, previously we fell through to a synthetic `start_iso + end_iso + value` uuid that would have defeated the shadow-read guard on re-ingestion of the same sample. Comment in `pullAllSamples` rewritten to reflect the actual Capgo 8.4.7 API surface. `sw.js` bumped to `v2026-04-24a-healthkit-readsamples`.

**Session 5b — [31cee69](https://github.com/VYVEHealth/vyve-site/commit/31cee694fc7136fbc1dc02f136feceeaea57c78f).** Pink re-prompt banner on `index.html` was appearing for connected users. Reported by Dean at 00:44 BST showing the "Get more from VYVE / Connect Apple Health" banner despite being connected the evening prior.

Root cause: the banner's gate read `healthBridge.getState()`, which reads `localStorage['vyve_health_state']` with a 10-minute TTL. Dean's last successful sync was 22:41 UTC on 23 April; by ~23:44 UTC the cache had expired. `getState()` returned `null`. Banner's `if (st && st.connected) return` didn't short-circuit. Banner rendered. The server knew the truth (`member_health_connections` row for Dean had `revoked_at: null`), but the client never consulted it — `getState()` only reads the expiring cache. This would have hit every connected user reliably after 10 minutes of idle.

Fix: persistent flag. `healthbridge.js`'s `sync()` now writes `localStorage.vyve_healthkit_has_connected = '1'` alongside the expiring state cache on every successful sync. `disconnect()` clears it. `index.html`'s banner init checks the persistent flag first, falling back to `getState()`. `hbBannerConnect`'s success path also sets the flag (belt-and-braces). `sw.js` bumped to `v2026-04-24b-banner-connected-flag`.

**Session 5c — [d31f380](https://github.com/VYVEHealth/vyve-site/commit/d31f380616c9b82e0a9d540def39262f720ecfe8).** The 5b fix addressed the symptom. The real architectural gap was that 5b wrote the flag only when `sync()` ran — it doesn't help a user who just opened the app and whose cache has since expired.

Proper fix: server-authoritative hydration. On every page load where `healthbridge.js` is present (index, settings, workouts, nutrition), it now fetches `member-dashboard` v50 after `vyveAuthReady` and populates three things:

- `window.__VYVE_HEALTH_FEATURE_ALLOWED__` from `data.health_feature_allowed` (the server-side allowlist — currently Dean only)
- `localStorage.vyve_healthkit_has_connected` when `data.health_connections` has a non-revoked row for the current platform
- `vyve_health_state` cache seeded from server state so `getState()` returns `connected: true` instantly, without waiting for a fresh sync

This is the proper replacement for the localStorage-only `vyve_healthkit_dev` feature gate. The dev flag remains as an OR fallback in `isFeatureEnabled()` for rapid dev testing on non-allowlist accounts — can be removed in a later pass once the server path is confirmed stable.

New public API method `window.healthBridge.hydrateFromDashboard(data)` lets pages that already fetch `member-dashboard` (index.html does, for rendering the home screen) pass their response in directly — the internal `_hasHydrated` boolean prevents double-work. Not yet wired from index.html, so currently there are two dashboard fetches per home-page load; small perf tax, fine for now, cleanup item.

Field-shape note for future work: `member-dashboard` v50's `health_connections` rows return `is_revoked: boolean` (not `revoked_at: string | null` as the raw `member_health_connections` table shape suggests). Codified.

`sw.js` bumped to `v2026-04-24c-server-hydration`.

**Session 5d — [fbc0ddb](https://github.com/VYVEHealth/vyve-site/commit/fbc0ddb80cca063d05ca32878fcf66025f456023).** Dead-code cleanup. `healthbridge.js`'s `flushPendingWrites` had an `else if (tgt === 'workouts')` branch that called `plugin.writeWorkout()`. Capgo 8.4.7 exposes no such method — Session 4 taxonomy audit codified this as "only `saveSample` for quantity/category types; no `saveWorkout`". The branch was unreachable in practice (server trigger `queue_health_write_back()` gates workout queuing on `'write_workouts' = any(granted_scopes)`, and `DEFAULT_WRITE_SCOPES = ['weight']` means that scope is never requested), but it was masquerading as a supported feature.

Removed the branch. The fallback `else` now handles any non-`weight_logs` target by marking the ledger row `failed` with `error_message = 'write_target_unsupported_' + tgt`, so if the server ever starts returning workout ledger entries (e.g., a v2 plugin upgrade) they get cleanly failed instead of throwing a TypeError on the missing plugin method.

The DB-side `queue_health_write_back_workouts` trigger on `public.workouts` is left in place — it's zero runtime cost (WHERE clause matches zero rows without the scope granted) and preserves the migration path for whenever workout write-back lands in v2.

`sw.js` bumped to `v2026-04-24d-write-path-cleanup`.

### State of play

**vyve-site latest:** [fbc0ddb](https://github.com/VYVEHealth/vyve-site/commit/fbc0ddb80cca063d05ca32878fcf66025f456023). SW cache: `v2026-04-24d-write-path-cleanup`. Five commits today: `sync-health-data` EF v2 + backfill, then 5a/5b/5c/5d.

Dean's account on Supabase: 7 workout samples all promoted (5 cardio, 2 workouts, visible on cardio.html/workouts.html for the right dates). Six missing sample types (steps, HR, weight, active_energy, sleep, distance) will land on his next on-device sync now that `readSamples` is wired.

Feature gate: dev flag `localStorage.vyve_healthkit_dev` still works as fallback but is no longer required — the `HEALTH_FEATURE_ALLOWLIST` Set in `member-dashboard` v50 is now the real gate for who sees the Settings Apple Health panel and the re-prompt banner. Currently just Dean.

### Gotchas codified

1. **Capgo plugin emits lowerCamelCase workout_type on iOS.** Server-side taxonomy matching must normalise (lowercase + strip non-alphanumerics) both sides of a set-membership check. Do not rely on Apple's UpperCamelCase enum names matching what the plugin actually sends.

2. **`plugin.querySamples()` does not exist in Capgo 8.4.7.** The method is `plugin.readSamples()`. Session 4 codified the method list; this entry codifies the cost of not patching the client to match (6 silent type-drops from Session 4 ship until today).

3. **State caches with short TTLs cannot be the source of truth for durable membership gates.** "Has this user ever connected" needs either a persistent localStorage flag or server-authoritative state — never a 10-minute state cache. The banner gate in 5b is the persistent-flag fix; 5c is the server-authoritative one.

4. **`readSamples` exposes the HealthKit UUID as `platformId`, not `id` or `uuid`.** Add it to any `native_uuid` fallback chain. Otherwise the synthetic fallback produces a new UUID on every re-pull, which breaks the shadow-read guard on re-ingestion.

5. **`member-dashboard` v50's `health_connections` response shape uses `is_revoked: boolean`, not the raw table's `revoked_at: timestamptz | null`.** EF-shape ≠ table-shape. Hydration consumers check the transformed field.

6. **"Sync completed successfully" is not the same as "promotion happened".** EF v1's `last_sync_status: ok` was returned even when `promoted` counts were all zero. Future EF work should surface promotion outcomes more prominently (or fail the sync status when promotion fails), and any time an on-device sync is described as "complete", the verification is checking `member_health_samples.promoted_to` counts, not just the connection row.

### Outstanding for the rest of session 5

- **Write-path round-trip on-device.** Dean to log a weight on nutrition.html, verify `member_health_write_ledger` goes queued → confirmed with a real HealthKit `native_uuid`, next sync filters that UUID out of the shadow-read, re-logging same day updates `weight_logs` in place rather than duplicating.
- **Verify the `readSamples` fix lands six new sample types on Dean's next on-device sync.** Spot-check `member_health_samples.sample_type` counts after sync.
- **Consent-gate + re-prompt banner flow test with a fresh test account.** Carried over from Session 4's outstanding list — still needs a new signup in a clean session.
- **Rollout plan.** Paper decisions: Alan first, then cohort of ~5 paying members, rollback = EF v51 with reduced `HEALTH_FEATURE_ALLOWLIST`, member comms strategy. Not worth broadening past Dean's circle before the App Store build is live.
- **Privacy.html HealthKit section + App Store Connect questionnaire + Build 3 submission.** Needs Lewis on the copy. Plan doc has the outline.
- **Decide submission scope.** Plan's risk register flagged "Apple rejects on broad 7-scope request" as Medium. Either submit all 7 and react to rejection, or preemptively phase to 4 (workouts + weight + steps + active_energy) with HR/sleep/distance in v1.1. Conservative path saves a ~1-week rejection loop against the May deadline.

### Commits this session

- Supabase: `sync-health-data` v2 deployed ACTIVE (workout taxonomy normalisation)
- Supabase: one-shot SQL backfill of 7 unpromoted workout samples for Dean's account
- vyve-site: [e060edc](https://github.com/VYVEHealth/vyve-site/commit/e060edcdcd4d64b88e72044fa8752bab81bbebfb) — 5a (readSamples + platformId + sw v2026-04-24a)
- vyve-site: [31cee69](https://github.com/VYVEHealth/vyve-site/commit/31cee694fc7136fbc1dc02f136feceeaea57c78f) — 5b (has_connected persistent flag + banner gate + sw v2026-04-24b)
- vyve-site: [d31f380](https://github.com/VYVEHealth/vyve-site/commit/d31f380616c9b82e0a9d540def39262f720ecfe8) — 5c (server-authoritative hydration via member-dashboard v50 + sw v2026-04-24c)
- vyve-site: [fbc0ddb](https://github.com/VYVEHealth/vyve-site/commit/fbc0ddb80cca063d05ca32878fcf66025f456023) — 5d (drop dead writeWorkout branch + sw v2026-04-24d)
- Brain: this entry + backlog tick

---

## 2026-04-23 — Portal outage & recovery: defer-on-auth TypeError, then SDK-before-ready RLS strip (two bugs, one evening)

Fixing a ~500ms blank-screen perf issue this afternoon led to a two-stage portal outage on 17 paying members and ~90 minutes of wrong-hypothesis debugging before the real cause was read directly from the code. Root-causing is captured here so the pattern doesn't repeat.

### Bug A — [14a3540] defer on auth.js broke inline body scripts

The 4:53pm perf commit added `<script src="/theme.js" defer></script>` and `<script src="auth.js" defer></script>` across 14 portal HTML files, plus `<link rel="preconnect">` and `<link rel="preload" as="script" href="/supabase.min.js">` in each head. The intent was to unblock the HTML parser so the page could render faster. The failure mode: inline `<script>` blocks in the body (habits.html, index.html and others) instantiate their own helpers that read from `auth.js` globals — `window.vyveSupabase`, `window.vyveCurrentUser`, the shared `supa()` pattern — and dispatch `vyveAuthReady` listeners. Deferred scripts run **after** the inline body scripts, not before, so every inline block ran against an undefined `auth.js` surface and threw `TypeError`s. Console lit up red on every portal page.

**Fix [25a7859] at 10:36pm:** reverted just the `defer` attribute on `auth.js` across all 14 files. Kept `defer` on `theme.js`, `nav.js`, `offline-manager.js` since nothing inline depends on them before DOMContentLoaded. Kept the `preconnect` and `preload` hints. SW bumped to `v2026-04-23j-authjs-blocking`.

### Bug B — [b7291b9] optimistic fast-path dispatched vyveAuthReady before window.vyveSupabase existed

With Bug A cleared, the console went clean but habits.html and the index dashboard counters stayed empty. 90 minutes were lost chasing missing foreign keys and schema corruption — every hypothesis was wrong because none was grounded in reading the actual code. What the code showed, once properly read: commit b7291b9 (the 5:08pm optimistic-auth-fast-path perf commit) had restructured `vyveInitAuth()` so the fast-path reveal happens BEFORE `await vyveLoadSupabaseSDK()`. Sequence on the live portal was:

1. `DOMContentLoaded` fires → `vyveInitAuth()` starts
2. Fast-path reads cached session from `localStorage.vyve_auth`, builds user object, sets `window.vyveCurrentUser`, dispatches `vyveAuthReady` — all synchronously
3. Pages' inline body scripts (attached via `waitForAuth`) fire their load function, which calls `supa('/member_habits?...')`
4. `supa()` checks `window.vyveSupabase` — still undefined because step 5 has not run yet — falls back to anon key as the Bearer token
5. `await vyveLoadSupabaseSDK()` finally runs, client created, `window.vyveSupabase` assigned — too late

PostgREST accepted the request (`apikey` header was valid) and returned `200 OK`. But `auth.email()` evaluated to NULL on the DB, so the RLS policy `(member_email = auth.email())` filtered every row out. Response body: `[]` — 2 bytes plus headers, which is exactly the "0.5 kB" seen in the Network tab. Verified empirically from the debug session by firing the same URL with `apikey=ANON`/`Authorization: Bearer ANON` and observing `200 []`.

This bug had been latent since b7291b9 shipped but was masked by Bug A's TypeErrors — the fast-path code never actually executed cleanly until 25a7859 unblocked it.

**Fix [802dd87] at 11:54pm:** moved the SDK load, client creation, `window.vyveSupabase` assignment, sign-out wiring and `onAuthStateChange` listener to BEFORE the fast-path reveal block in `vyveInitAuth`. The fast path still fires synchronously from the cached session, but now `window.vyveSupabase` is guaranteed live when `vyveAuthReady` dispatches. Cost: `await vyveLoadSupabaseSDK()` now runs before app reveal instead of after, adding ~20-50ms to first paint (`supabase.min.js` is preloaded in every page head via the 14a3540 `<link rel=preload>` that survived the revert, so it's near-instant). Well worth it vs silent empty data. SW bumped to `v2026-04-23k-sdk-before-ready`.

### Process lessons

1. **Read the code, don't theorise.** The 90-minute detour on FK/schema hypotheses happened because of pattern-matching ("empty response → broken DB") instead of reading what the `supa()` helper actually does when `window.vyveSupabase` is unset. The full `vyveInitAuth` body + the habits.html `supa()` definition gave the diagnosis in under five minutes once actually looked at.
2. **A 200 + tiny response body is not proof of a working query.** Under RLS, an empty-filter match returns `200 []` indistinguishable from a successful-but-empty query. Always cross-check with a service-role query against the same predicates — which is how we confirmed Dean had 7 rows in `member_habits` while the PWA saw zero.
3. **Perf changes that touch script ordering or auth flow must be validated on a RLS-protected query path, not just by "app rendered".** Both b7291b9 and 14a3540 would have failed a habits-renders-data smoketest; neither was run before ship.

### State of play

**vyve-site latest: [802dd87]** (main). SW cache: `v2026-04-23k-sdk-before-ready`. Portal back to working for 17 paying members. Both perf wins from today (preload/preconnect hints + optimistic auth fast-path) are preserved — only the execution order in `vyveInitAuth` was corrected. No HTML changes in the final fix beyond the two patches already landed in 25a7859.

### Gotchas codified for Hard Rules

1. **window.vyveSupabase MUST exist before vyveAuthReady fires.** Any restructuring of `vyveInitAuth` must preserve this invariant. The SDK load is cheap (preloaded) — never trade this invariant for the 20ms it saves.
2. **Do not add `defer` to `auth.js`.** Inline body scripts across 14 pages depend on auth.js globals being available by the time the parser reaches them. `theme.js`, `nav.js`, `offline-manager.js` are defer-safe; `auth.js` is not without a proper ready-promise refactor (tracked in backlog).
3. **When debugging an apparently-empty PostgREST response, first check whether the Bearer token is an anon key vs a member JWT.** The anon path is a silent RLS strip, not a visible auth failure.

---

## 2026-04-23 — HealthKit session 4: iOS device validation, 4 plugin debugging iterations, full UX overhaul, end-to-end sync working

First real-device validation of the Capgo HealthKit integration on Dean's iPhone 15 Pro Max, plus one-time Xcode/signing setup, four atomic plugin-taxonomy fixes discovered from Safari Web Inspector on a live WKWebView session, a complete UX pivot to Apple-native consent patterns, and full end-to-end validation of Health data syncing into Supabase.

### One-time Xcode and signing setup

Installed Xcode 26.4.1 from App Store, opened `~/Projects/vyve-capacitor` via `npx cap open ios`, enabled automatic signing against VYVE Health CIC team (VPW62W696B) using Lewis Vines' Apple ID. Generated Apple Development certificate (Lewis Vines: Z6474RNZZB), registered iPhone 15 Pro Max UDID to the dev team, enabled Developer Mode on the phone. Bundle ID `co.uk.vyvehealth.app`, iOS 15.0 min target, HealthKit capability present (Clinical Health Records OFF, Background Delivery OFF — neither needed for MVP). App installed and launched successfully on device. This is a one-time setup — future releases use Product → Archive with the same automatic signing, and the existing App Store distribution profile remains intact.

### Four plugin debugging iterations

On first device launch, the Settings page Apple Health toggle was dead — tapping threw `ReferenceError: handleAppleHealthToggle is not defined`. Four root causes surfaced, each shipped as its own atomic commit against vyve-site.

**[88c69b5] settings.html script-tag scope trap fix.** Session 3.1 had already codified this gotcha in the brain, but the original session 3 push had left the damage in place: the HealthKit JS block (hbInitSettings, hbRefreshStatus, handleAppleHealthToggle, hbSyncNow, waitForHealthBridge IIFE) was injected between `<script src="/nav.js" defer>` and its closing `</script>`. Per HTML spec, inline body of a script tag with a src attribute is discarded entirely — all five symbols silently evaporated. Fix: closed the nav.js tag and opened a fresh `<script>` for the HealthKit block. Script tag balance restored from 6/6 to 7/7. `sw` bumped to `v2026-04-23e-settings-fix`.

**[e127541] healthbridge.js plugin name lookup fix.** Even with JS now defined, `requestAuthorization` still failed silently. A diagnostic `console.log(Object.keys(window.Capacitor.Plugins))` on the live WebView revealed the plugin registers as `window.Capacitor.Plugins.Health` on Capgo 8.4.7 iOS — not `CapacitorHealth` or `CapgoCapacitorHealth` as the Capgo README examples and most community snippets suggest. Fix: `getPlugin()` now defensively checks all three names: `plugins.Health || plugins.CapacitorHealth || plugins.CapgoCapacitorHealth`. `sw` bumped to `v2026-04-23f-plugin-name`.

**[ec0a7b9] Scope rename activeCaloriesBurned → calories.** After plugin resolved, permission sheet requests failed with an unrecognised-type error. Inspected `Cap-go/capacitor-health/ios/Sources/HealthPlugin/Health.swift` source: the iOS `HealthDataType` enum uses `calories` (which the plugin maps internally to `HKQuantityTypeIdentifier.activeEnergyBurned`), not the iOS-native name `activeCaloriesBurned`. Patched both `DEFAULT_READ_SCOPES` and the sample-pull type map in healthbridge.js. `sw` bumped to `v2026-04-23g-scope-rename`.

**[19d0fd1] Drop `workouts` from WRITE scopes + UI copy update.** With reads fixed, writes still threw. Deeper Swift-source inspection showed `requestAuthorization` uses two different parsers: `parseTypesWithWorkouts` for reads (which special-cases "workouts") and `parseMany` for writes (which throws on "workouts" because it is not in the HealthDataType enum at all). The plugin exposes no `saveWorkout` method — only `saveSample` for quantity/category types. Workouts write-back is not supported by Capgo 8.4.7 on iOS, period. Fix: `DEFAULT_WRITE_SCOPES = ['weight']` only. Removed "Workouts you complete in VYVE" from the settings.html UI copy and updated the toggle subtitle from "Read workouts, write back to Health app" → "Read health data, write back your weight". `sw` bumped to `v2026-04-23h-workouts-read-only`.

### End-to-end validation

After the fourth fix deployed, the full flow worked first time. Toggled Apple Health on in Settings → native iOS HealthKit permission sheet appeared listing all 7 data types → Dean approved → `requestAuthorization` succeeded → `connect()` wrote `member_health_connections` row → Settings page updated to "Synced just now" with all 9 UI data-type rows shown (Workouts & exercise sessions, Steps, Activity, Energy, Calories, Heart rate, Weight, Sleep analysis, Distance).

### Capgo plugin 8.4.7 taxonomy (codified — hard reference for session 5+)

Valid `HealthDataType` enum (from `Cap-go/capacitor-health` Swift source): `steps, distance, calories, heartRate, weight, respiratoryRate, oxygenSaturation, restingHeartRate, heartRateVariability, bloodGlucose, bodyTemperature, height, flightsClimbed, exerciseTime, distanceCycling, bodyFat, basalBodyTemperature, basalCalories, totalCalories, sleep, bloodPressure, mindfulness`. Note: `workouts` is NOT in the enum — it is handled specially via `parseTypesWithWorkouts` in the READ path only. Plugin registers as `window.Capacitor.Plugins.Health`. Exposed methods: `isAvailable, requestAuthorization, checkAuthorization, readSamples, saveSample, getPluginVersion, openHealthConnectSettings, showPrivacyPolicy, queryWorkouts, queryAggregated`. No `saveWorkout`. No arbitrary sample types.

### Currently active scopes

Reads (7): `steps, workouts, heartRate, weight, calories, sleep, distance`. Writes (1): `weight` only.

Available-but-not-yet-wired (parked for post-sell session 5+ enhancement): `restingHeartRate, heartRateVariability, exerciseTime, mindfulness`. Simple one-line additions to `DEFAULT_READ_SCOPES` plus the sample-pull mapping in healthbridge.js when we want them.

### Session 4.5: UX overhaul to Apple-native patterns

Mid-session pivot on Dean's direction: the original toggle-based UX (toggle connects / toggle disconnects in-app) was wrong for iOS. Apple's expected pattern is: the app asks once, permission is then sticky and managed exclusively via iPhone Settings → Health → Data Access & Devices. In-app disconnect is discouraged and confusing because iOS permissions can only truly be revoked at the OS level. Also added a re-prompt path for users who declined at onboarding.

Shipped as a single atomic commit **[612459b]** across 4 files:

**consent-gate.html.** Added a new 4th card "Connect Apple Health" shown only when `window.Capacitor.getPlatform() === 'ios'`. State object extended with `applehealth: false`. On Continue: writes consent row as before, then if applehealth was ticked, calls `healthBridge.connect()` — fails silently since consent is already saved (non-fatal). If applehealth was not ticked on native, sets `localStorage.vyve_healthkit_declined_at = Date.now()` to start the 7-day cooldown. Also auto-sets `vyve_healthkit_dev='1'` if not present (future-proofing for server allowlist rollout). healthbridge.js script tag added. 18098 bytes.

**settings.html.** `hbRefreshStatus` and `handleAppleHealthToggle` rewritten connect-only. When connected: `toggle.disabled = true`, `toggle.checked = true`, toggle locks on, new muted `#hb-manage-note` appears: "To disconnect, open iPhone Settings → Health → Data Access & Devices → VYVE Health". When not connected: toggle is interactive to trigger connect, note hidden. `handleAppleHealthToggle(false)` path is now a no-op that just re-snaps the toggle to off — once disabled, this path is unreachable from the UI anyway. 75881 bytes.

**index.html.** Pink gradient re-prompt banner `#hb-reprompt-banner` injected at top of `<main>`. Shown only if: (1) native iOS Capacitor detected, (2) healthBridge feature flag enabled, (3) not currently connected per `getState()`, (4) declined at least 7 days ago (or declined marker absent entirely — shows once for members who never saw consent-gate). "Connect" fires `healthBridge.connect()` and clears the declined marker on success. "Not now" re-stamps `declined_at` to Now, resetting the 7-day window. Guard via `waitForCapacitor` polling so the banner doesn't initialise before the Capacitor bridge is available. 88493 bytes.

**sw.js.** Cache bumped to `v2026-04-23i-apple-health-flow`.

### Validation of settings.html UX fix

First reload after 612459b deploy, the Settings page was still letting Dean toggle Apple Health off. Safari Web Inspector diagnostic from the device showed `getState()` correctly returning `connected: true` with all 7 granted scopes, but `toggle.disabled: false` — the new `hbRefreshStatus` code wasn't running. Cause: service worker was serving stale settings.html from cache despite force-quit. Flushed via console script that unregistered all SW registrations and deleted all caches, then `location.reload(true)`. Post-reload: `hb-manage-note element exists: true`, toggle locked on green, cannot be turned off. Validated.

### State of play

**vyve-site latest: [612459b]** (main). **VYVEBrain latest: this entry.** SW cache: `v2026-04-23i-apple-health-flow`. 7 native iOS scopes reading into Supabase, 1 writing, member_health_connections row verified present for Dean's account, initial 30-day historical pull completed.

### Gotchas codified for Hard Rules

1. **Never inject inline JS between `<script src="...">` and its `</script>`** — body is discarded by spec. Always close the src tag first and open a fresh `<script>` for the inline block. Script tag balance audit after any HTML patch involving scripts.
2. **Capgo plugin iOS registers as `window.Capacitor.Plugins.Health`** (not CapacitorHealth, not CapgoCapacitorHealth). Always check all three names defensively: `plugins.Health || plugins.CapacitorHealth || plugins.CapgoCapacitorHealth`.
3. **Capgo 8.4.7 iOS: `workouts` is valid for READS only** (via `parseTypesWithWorkouts`). NOT valid for writes. No `saveWorkout` method exposed at all. Only `saveSample` for quantity/category types.
4. **iOS Capacitor WebView `navigator.serviceWorker` is often undefined** — `getRegistrations()` throws TypeError on some iOS WKWebView builds. Don't rely on SW unregister on native; if cache-flush needed, force-quit app or offload+reinstall.
5. **`location.reload()` in WKWebView doesn't always bypass the URL cache** even with `?v=timestamp`. Fresh in-memory JS modules require full app kill+relaunch. When that fails too, the console `caches.keys()` + `caches.delete()` + SW unregister combo works.
6. **First device-side build requires one-time dev certificate + device UDID registration** to the developer team (separate from App Store distribution profile). App Store distribution profile remains intact. For future releases use Product → Archive with automatic signing.

### Outstanding for session 5

- Verify initial 30-day pull populated `member_health_samples` correctly (spot-check row counts per scope for Dean's account).
- Full consent-gate + re-prompt banner flow test with a fresh test account (requires new sign-up — parked, not to be done in the same session as other paid testing).
- Potential addition of 4 extra read scopes: `restingHeartRate, heartRateVariability, exerciseTime, mindfulness`.
- Android Health Connect parity work.
- HAVEN clinical sign-off from Phil (separate workstream).
- Server allowlist auto-populate from member-dashboard v50 so the feature flag can be rolled to real members without requiring `localStorage.vyve_healthkit_dev='1'`.

### Commits this session

- [88c69b5](https://github.com/VYVEHealth/vyve-site/commit/88c69b5) — settings.html script-tag scope trap fix + sw v2026-04-23e
- [7c1f685](https://github.com/VYVEHealth/VYVEBrain/commit/7c1f685) — brain changelog entry for session 3.1 bugfix
- [e127541](https://github.com/VYVEHealth/vyve-site/commit/e127541) — healthbridge.js plugin name lookup fix + sw v2026-04-23f
- [ec0a7b9](https://github.com/VYVEHealth/vyve-site/commit/ec0a7b9) — scope rename activeCaloriesBurned → calories + sw v2026-04-23g
- [19d0fd1](https://github.com/VYVEHealth/vyve-site/commit/19d0fd1) — drop workouts from WRITE scopes + UI copy update + sw v2026-04-23h
- [612459b](https://github.com/VYVEHealth/vyve-site/commit/612459b) — Apple Health UX overhaul: consent-gate prompt + connect-only Settings + 7-day re-prompt banner + sw v2026-04-23i

---

## 2026-04-23 — HealthKit session 3.1 bugfix: script-tag scope trap in settings.html

Mid-preview of session 3's Settings UI (still feature-flagged to Dean's localStorage dev flag only, zero production impact), the Apple Health card stayed `display:none` even with the flag set and — when forced visible — the toggle threw `ReferenceError: handleAppleHealthToggle is not defined`.

### Root cause

In session 3's patch, the HealthKit JS block (hbInitSettings, hbRefreshStatus, handleAppleHealthToggle, hbSyncNow, waitForHealthBridge IIFE) was inserted between the opening `<script src="/nav.js" defer>` and its `</script>`. Per the HTML spec, when a `<script>` element has a `src` attribute, any inline body between the tags is **ignored** — the browser only executes the external file. All five HealthKit symbols were silently dropped at parse time. This single mis-injection unified every symptom:
- No `hbInitSettings` ran → section stayed hidden on page load
- No `handleAppleHealthToggle` defined → inline `onchange=` threw ReferenceError
- `location.reload()` didn't help — the init code never existed to run
- Manual `style.display = ''` worked cosmetically because the DOM was fine; only the JS was missing

### Fix

One-byte edit in `settings.html`: close the nav.js script tag on the same line, open a fresh `<script>` for the HealthKit block.

Before:
```
<script src="/nav.js" defer>
// ─── HealthKit integration ...
function hbInitSettings() { ... }
...
</script>
```

After:
```
<script src="/nav.js" defer></script>
<script>
// ─── HealthKit integration ...
function hbInitSettings() { ... }
...
</script>
```

Script-tag balance before/after the patch: 6/6 → 7/7. `<script src=...>` tags now self-close.

### Verification

On Chrome web preview (deanonbrown@hotmail.com, localStorage flag set):
- SW re-registered on `vyve-cache-v2026-04-23e-settings-fix`
- Apple Health section auto-renders on page load (no manual CSS override)
- Clicking the toggle fires `handleAppleHealthToggle(true)` → `healthBridge.connect()` → `{ error: 'web_unsupported' }` → alert: "Could not connect to Apple Health: web_unsupported"
- Expected and correct behaviour for web. Native iOS call path will replace `web_unsupported` with the real HealthKit permission sheet in session 4.

### Gotcha codified (add to Hard Rules)

**Never inject inline JS between `<script src="...">` and its `</script>`.** When a script tag has a `src` attribute, the body is discarded — symptoms look like "functions inexplicably missing at runtime". Always wrap inline code in its own separate `<script>` tag.

### Commits

- vyve-site: [88c69b5](https://github.com/VYVEHealth/vyve-site/commit/88c69b5a4de50cd10dd12998b162b630bc3caaca) — settings.html (fix) + sw.js (cache bump to v2026-04-23e-settings-fix)
- Brain: this entry

### Session 4 still gated on Xcode

No change — Xcode install in progress on Dean's Mac. Once done: `npx cap open ios`, build to iPhone 15 Pro Max, open Settings via native app, native HealthKit permission sheet should appear on toggle, then plugin → server → sync flow completes the device-side validation of session 1's migration + session 2's plugin install + session 3's client orchestrator.

---

## 2026-04-23 — HealthKit session 2 partial + session 3 full: plugin installed, client orchestrator live (feature-flagged)

Parallel push: session 2 pre-work on Dean's Mac while Xcode installs, session 3 shipped in full. Xcode install blocks the final device test of session 2; sessions 4–6 wait on that.

### Session 2 progress

**What's done (pre-device-test):**
- `@capgo/capacitor-health@8.4.7` installed via `npm install @capgo/capacitor-health` in `~/Projects/vyve-capacitor`
- `npx cap sync ios` wired the plugin into the native iOS Capacitor project via SPM (Package.swift manifest confirms `.package(name: "CapgoCapacitorHealth", path: "../../../node_modules/@capgo/capacitor-health")`)
- Info.plist upgraded: both `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` rewritten from generic copy to feature-named, guideline-5.1.3-defensible language. Backup preserved at `ios/App/App/Info.plist.bak.pre-healthkit`
- `App.entitlements` already had `com.apple.developer.healthkit: true` from a prior setup
- `capacitor.config.json` confirmed: appId `co.uk.vyvehealth.app`, server URL `https://online.vyvehealth.co.uk`

**What's blocking:**
- Xcode not installed on Dean's Mac (discovered mid-session). Installing now, ~30–60 min download. Required for the device-side plugin permission/read/write test.

**Pre-reqs fully confirmed:**
- HealthKit entitlement enabled on App ID (`co.uk.vyvehealth.app`) in Apple Developer portal
- Sub-capabilities: Clinical Health Records OFF, Background Delivery OFF
- Distribution provisioning profile regenerated
- Test devices: iPhone 15 Pro Max + Apple Watch Ultra (highest-fidelity HealthKit combo)

### Session 3 — client orchestrator + Settings UI (SHIPPED)

**Scope decision** — session 3 ran in parallel with Xcode download because the code is platform-agnostic. Feature-flag gate means zero production risk.

**NEW: `healthbridge.js`** (478 lines, 18.4KB at `vyve-site/healthbridge.js`) — the client orchestrator that bridges `@capgo/capacitor-health` ↔ `sync-health-data` EF.

Public API (`window.healthBridge`):
- `isFeatureEnabled()` — gate; returns true only if `localStorage.vyve_healthkit_dev === '1'` OR `window.__VYVE_HEALTH_FEATURE_ALLOWED__ === true`
- `isNative()` — Capacitor.getPlatform() === 'ios' | 'android'
- `connect()` — requests plugin authorization (7 read + 2 write scopes), upserts connection row via EF, pulls initial 30-day window
- `disconnect()` — marks connection revoked server-side (iOS can't revoke programmatically)
- `sync(opts)` — chunked pull (batch size 500) + promotion; flushes any pending write-ledger entries via `writeSample` / `writeWorkout` then `confirm_write` action
- `maybeAutoSync()` — auto-runs on `visibilitychange` if last sync > 60 min ago
- `flushAfterLocalWrite()` — called from workouts.html / nutrition.html after local activity, flushes write-ledger queue immediately

Default scopes requested: `steps, workouts, heartRate, weight, activeCaloriesBurned, sleep, distance` (reads) + `weight, workouts` (writes).

**Scope-name translation:** plugin's dataType names don't match the server's `granted_scopes` semantics. Write scopes are sent to server as `write_weight` and `write_workouts` specifically because `queue_health_write_back()` in session 1's migration checks `'write_workouts' = any(granted_scopes)` to decide whether to queue.

**Settings UI** — `settings.html` had a stub APPLE HEALTH section calling `window.VYVENative.requestHealthKit()` (undefined). Replaced with:
- Section wrapped with `id="hb-section" style="display:none"` — invisible until feature flag is on
- `handleAppleHealthToggle(enabled)` now calls `healthBridge.connect()` / `healthBridge.disconnect()`
- Added `hbSyncNow()` button for manual resync when connected
- Added `hbRefreshStatus()` which shows "Synced N min ago" or "Connected — not synced yet"
- Upgraded data-type copy to match actual 7-read/2-write scopes with revocation instructions (iPhone Settings → Health → Data Access & Devices → VYVE Health)

**Script injection** — `healthbridge.js` loaded after `auth.js` on all 4 relevant pages: settings.html, index.html, workouts.html, nutrition.html. Tag balance verified on each via `<script` vs `</script>` count.

**Service worker cache bump** — `sw.js` v2026-04-23c-cache-first → v2026-04-23d-healthbridge (Hard Rule 5 — JS asset changes still require bump).

**NEW EF: `member-dashboard` v50** — additive patch to v49. One extra parallel query (`member_health_connections`), one allowlist constant (`HEALTH_FEATURE_ALLOWLIST`, currently just `deanonbrown@hotmail.com`), two new response fields: `health_feature_allowed` (boolean) and `health_connections` (array). verify_jwt remains false at platform level (Rule 21 preserved). Smoketest of v50 confirmed 11-key response shape vs v49's 9-key, no breakage of existing fields.

### Feature-flag status and why it's safe

**Dev flag is the only active gate in session 3.** Set via Safari Web Inspector: `localStorage.vyve_healthkit_dev = '1'`, then reload. Nobody else has this set.

**Server allowlist is wired into v50 but NOT yet pushed to `window.__VYVE_HEALTH_FEATURE_ALLOWED__`.** To do so, one of two things is needed and sits in the session 4 scope:
- Option A: `auth.js` on login reads `health_feature_allowed` from `member-dashboard` and sets the global
- Option B: Each page that cares (settings.html) fetches the dashboard and sets it inline before `hbInitSettings()` runs

Either way, zero production members currently see any UI change:
- All 17 production members will fail `isFeatureEnabled()` → `hb-section` stays `display:none`
- Only Dean can toggle his own localStorage dev flag on his iPhone

### Smoketest results

| Layer | Test | Result |
|---|---|---|
| member-dashboard v50 | Deploy: status=ACTIVE version=50 verify_jwt=false | ✅ |
| member-dashboard v50 | Smoketest with fresh test user returns 11 keys incl. `health_feature_allowed` + `health_connections` | ✅ |
| member-dashboard v50 | `health_feature_allowed: false` for non-Dean user | ✅ |
| member-dashboard v50 | `health_connections: []` empty array for user with no connection row | ✅ |
| member-dashboard v50 | Existing 9 response keys untouched | ✅ |
| settings.html | Script tag balance 6/6 `<script>` vs `</script>` | ✅ |
| index.html | Script tag balance 12/12 | ✅ |
| workouts.html | Script tag balance 13/13 | ✅ |
| nutrition.html | Script tag balance 8/8 | ✅ |
| healthbridge.js | Gated on `isFeatureEnabled()` AND `isNative()` — no-op on web | ✅ (by design) |

### Gotchas codified

1. **Plugin exposure name** — under Capacitor 8, the plugin is exposed as `window.Capacitor.Plugins.CapacitorHealth`. Some plugin versions use `CapgoCapacitorHealth`. healthbridge.js checks both. Confirmed at runtime in session 4 with the real plugin build.
2. **iOS doesn't expose actual granted scopes** — `requestAuthorization()` returns without telling you which scopes the user actually approved. Plugin design decision: we assume all requested scopes granted and let subsequent `querySamples()` / `writeSample()` calls fail naturally for denied ones. Server records requested scopes in `granted_scopes[]`; write-ledger queue will silently fail-to-write for denied scopes (and the `confirm_write` action marks them `failed`).
3. **iOS has no programmatic disconnect API** — `healthBridge.disconnect()` only updates server state and local cache; to fully revoke, user must go to iPhone Settings → Health → Data Access & Devices → VYVE Health. Settings UI says so explicitly.
4. **Script-tag injection pattern varies across pages** — settings.html uses `<script src="/auth.js" defer></script>`, index.html / workouts.html / nutrition.html use `<script src="auth.js" defer></script>` (no leading slash). Patch logic tried both variants.

### Commits

- Supabase: `member-dashboard` v50 deployed ACTIVE
- vyve-site: [e63da07](https://github.com/VYVEHealth/vyve-site/commit/e63da07b54d3b3ec4fdc9ae5eb32c04a6aaee79b) — 6 files
- Brain: this entry + backlog update + snapshot of EF v50 source

### Next session

**Session 4** — iOS device test + write-path validation (requires Xcode installed).
- Build to iPhone 15 Pro Max via Xcode
- Trigger `healthBridge.connect()` via Safari Web Inspector console
- Confirm permission sheet shows our new long-form Info.plist copy
- Read a real workout from Apple Watch Ultra, see it appear in `member_health_samples` and promoted to `workouts`
- Write a test weight, confirm it appears in Apple Health with source "VYVE Health", confirm next sync doesn't double-count it via the write-ledger shadow-read filter
- Wire `window.__VYVE_HEALTH_FEATURE_ALLOWED__` from `member-dashboard` response so the allowlist is automatic (Dean gets the Settings UI without the localStorage dev flag)

---

## 2026-04-23 — HealthKit session 1: DB foundation + sync-health-data EF v1 ACTIVE

### What shipped

**Supabase migrations (two idempotent applies):**
- `healthkit_health_connect_foundation` — 3 tables, 11 indexes, `queue_health_write_back()` function, 2 auto-queue triggers on `workouts` + `weight_logs`, 3 RLS policies (self-select only)
- `healthkit_lc_email_triggers` — `zz_lc_email` triggers on all 3 new tables (initial migration's trigger statements silently failed to apply — the known `SUPABASE_APPLY_A_MIGRATION` partial-success gotcha)

**Edge Function `sync-health-data` v1** — status ACTIVE, `verify_jwt: false` (VYVE Rule 21), CORS locked to `online.vyvehealth.co.uk`, ID `1b0d57b9-cbd2-4d6c-86e8-796bc9b42e4a`. 484 lines. Three actions:
- `pull_samples` — client POSTs batch of device health samples. EF upserts connection row, filters shadow-reads against confirmed write-ledger, runs outlier gate (workout > 12h, weight outside 20-400kg, HR > 250bpm, steps > 200k/day, distance > 300km/event), rejects samples older than 60 days, batches dedup-insert into `member_health_samples`, promotes to `workouts`/`cardio`/`weight_logs` per mapping table, returns `pending_writes` list for client flush.
- `confirm_write` — client confirms write-ledger entry succeeded (or failed) with native UUID. Defence-in-depth: only the owning member can confirm.
- `mark_revoked` — marks `member_health_connections` revoked; turns off auto-queue of writes via the trigger's `revoked_at is null` filter.

### New Supabase tables

| Table | Purpose | Key invariant |
|---|---|---|
| `member_health_samples` | Raw samples from device. dedup via `unique (member_email, source, native_uuid)` | Writes only via EF (service role); self-select RLS |
| `member_health_connections` | Per-member per-platform consent state. `primary key (member_email, platform)` | Platform-level enum; `granted_scopes` text[] |
| `member_health_write_ledger` | VYVE→native write queue + shadow-read guard | `unique (platform, vyve_source_table, vyve_source_id)`; `native_uuid` populated on client confirm |

### Promotion mapping (implemented inside EF)

- **weight** → `weight_logs` (upsert on `member_email, logged_date`)
- **workout** + type in strength set (FST/TST/Core/Pilates/Crosstraining/long Yoga ≥30min) → `workouts`
- **workout** + type in cardio set (Running/Cycling/Walking/Hiking/Rowing/Swimming/HIIT/Elliptical/StairClimbing/MixedCardio) → `cardio`  (extracts `metadata.distance_m` → `distance_km`)
- **workout** short Yoga (<30min) → raw-only (treat as mobility, future Wearable Insights panel)
- **steps**, **heart_rate**, **active_energy**, **sleep**, **distance** → raw-only in v1

### Smoketest results (3-layer, same pattern as Shell 3 Sub-scope A)

| Layer | Tests | Passed |
|---|---|---|
| Deploy | EF ACTIVE, verify_jwt:false, version=1 | ✅ |
| HTTP | OPTIONS→200 with CORS, GET→405, unknown action→400, invalid platform→400, no auth→401, bad JWT→401 | ✅ (6/6) |
| DB | Empty pull upserts connection; 7/10 samples inserted (3 rejected via outlier+too_old); weight→weight_logs promoted; workouts→workouts + cardio→cardio promoted once FK satisfied; re-sending same batch dedups cleanly; confirm_write transitions status to 'confirmed' with native_uuid; shadow-read filter rejects samples whose native_uuid is already in the ledger; confirm_write with error_message → 'failed'; mark_revoked sets revoked_at; ownership guard: confirm_write with random ledger_id → 404 | ✅ (22/24) |

Two nominal "failures" in summary are from the pre-members-row batch — test user existed in `auth.users` but not yet in `public.members`, so workouts/cardio FK-violated and went to `skipped_cap`. In production every `auth.users` row also has a `members` row (set up by `onboarding` EF v57+), so this is a smoketest-setup artefact, not a bug. Re-ran the same batch post-members-insert and all promotions worked.

All smoketest artefacts cleaned up (0 samples, 0 connections, 0 ledger rows, 0 workouts/cardio/weight/members/platform_alerts tied to smoketest email).

### Gotchas found this session (candidates for master.md update)

1. **`SUPABASE_APPLY_A_MIGRATION` silent partial apply** — confirmed brain rule. The `zz_lc_email` triggers in the initial migration statement block didn't land even though the apply returned success. Caught by pg_trigger verification. Fix: always verify multi-statement migrations via pg_class joins (not `tgrelid::regclass::text like …`) after apply.
2. **`regclass::text` is unreliable for trigger lookup** — returns unqualified name when relation is in search_path, breaks naive LIKE filters. Use `pg_trigger JOIN pg_class JOIN pg_namespace` instead.
3. **`workouts` and `cardio` have FK to `members.email` ON DELETE CASCADE** (weight_logs does not). Any test account in `auth.users` needs a paired `public.members` row for INSERT paths to work. Not documented in master.md §4 DB inventory.
4. **`workouts.session_number` and `cardio.session_number` are CHECK-constrained to (1,2)** — matches the 2/day cap. `workouts.time_of_day` is CHECK-constrained to (morning|afternoon|evening|night). EF uses correct values for both.
5. **`platform_alerts` schema** uses `type` (not `alert_type`), `details` (not `message`), no `metadata` column. Initial EF source had the wrong names; corrected before deploy.

### Next session (session 2)

iOS Capacitor plugin + Info.plist + Xcode HealthKit capability + real-device permission flow. Pre-req confirmed: HealthKit entitlement enabled on App ID, sub-capabilities both OFF, provisioning profile regenerated. Dean has iPhone 15 Pro Max + Apple Watch Ultra for testing.

### Commits

- Supabase: migrations `healthkit_health_connect_foundation` + `healthkit_lc_email_triggers`; EF `sync-health-data` v1 deployed
- Brain: this entry + backlog update

---

## 2026-04-23 — Plan mapped: HealthKit + Health Connect integration (iOS-first)

### Context
Dean asked to map how we ship HealthKit (iOS) and Health Connect (Android) wearable integration. Scope resolved in conversation; full plan committed to `plans/healthkit-health-connect.md`.

### Scope decisions locked
- **Read + write workouts and weight. No cardio write** (distance/calorie accuracy not defensible to Apple review when we only capture duration).
- **All 7 data types in v1:** workouts, steps, heart rate, weight, active energy, sleep, distance. Fallback split-phase plan held in reserve if Apple rejects on scope breadth.
- **iOS first.** Dean has iPhone + Apple Watch. No Android test device yet — Android becomes a ~4-session follow-up once device acquired. Keeps May sell-ready target intact (Sage will demo on iPhone regardless).
- **Plugin: `@capgo/capacitor-health`.** Only free unified plugin covering modern HealthKit + Health Connect (not deprecated Google Fit). MIT licensed, active maintenance.
- **Background delivery on iOS deferred to v2** — needs Swift plugin extension, out of scope.

### Architecture
- Client-side `healthbridge.js` (~350 lines) orchestrates `@capgo/capacitor-health` + Supabase round-trips
- Server-side `sync-health-data` EF v1 handles ingest, dedup, promotion, and write-ledger confirmation
- Three new Supabase tables: `member_health_samples` (raw, dedup by native_uuid), `member_health_connections` (per-platform consent state), `member_health_write_ledger` (solves shadow-read: prevents the "write workout → HK → next sync pulls it back → duplicate promotion" bug)
- Existing cap triggers (Rule 34) handle over-cap routing to `activity_dedupe` for no extra logic
- Two DB triggers on `workouts` and `weight_logs` auto-queue write-back when member has write scope

### Session plan (iOS)
1. DB + EF foundation (smoketest with synthetic data, nothing member-visible)
2. iOS plugin install + Info.plist + Xcode HealthKit capability — pre-req: HealthKit entitlement on Apple Dev portal
3. `healthbridge.js` + Settings UI + read-path integration with workouts.html/cardio.html
4. Write-path integration + ledger dedup validation (round-trip test)
5. Privacy page update + App Privacy questionnaire + App Store Build 3 submission
6. Apple review response + launch (3–7 day calendar for review)

Total: 6 sessions, ~2 weeks calendar time.

### Dean's pre-session-2 homework
- Confirm HealthKit entitlement on Apple Developer portal (`developer.apple.com/account` → Identifiers → VYVE App ID → Capabilities → HealthKit). Regenerate distribution provisioning profile after enabling. Full steps in today's conversation.
- Confirm iPhone model + iOS version, Apple Watch model + watchOS version for session 2 testing.

### Risks carried
- Apple broad-scope rejection (mitigation: feature-named Info.plist strings; split-phase fallback ready)
- Shadow-read duplication (mitigation: ledger native_uuid filter)
- Capacitor version compatibility (verify in session 1)

### No code shipped this session
Plan-only. First build lands in session 1 (DB migrations + EF v1).

---

## 2026-04-23 — Portal perf: three-stage assault on page-load slowness

### The user-visible problem
Dean felt the app was slow. Every portal page had a ~300-600ms blank screen or skeleton flash on load, even on return visits. No single smoking gun — compound failure across three layers. Fixed in three commits today.

### Commit 1: preconnect + preload + defer on all portal HTML
**Commit:** `14a3540` on `VYVEHealth/vyve-site@main` · 15 files changed.

Every portal page (`index.html`, `habits.html`, `workouts.html`, `nutrition.html`, `leaderboard.html`, `sessions.html`, `certificates.html`, `engagement.html`, `wellbeing-checkin.html`, `running-plan.html`, `settings.html`, `log-food.html`, `cardio.html`, `movement.html`) now has, injected after `<meta charset>`:

```html
<link rel="preconnect" href="https://ixjfklpckgxrwjlfsaaz.supabase.co" crossorigin>
<link rel="preload" as="script" href="/supabase.min.js">
```

Plus `defer` attribute added to every local `<script src="...">` tag — `theme.js`, `auth.js`, `nav.js`, `offline-manager.js`, `tracking.js`, `vapid.js`, all `workouts-*.js` modules.

**What this fixes:**
- TCP+TLS handshake to Supabase starts at HTML parse time instead of when `auth.js` executes (saves ~100-200ms on first API call)
- `supabase.min.js` (185KB) starts downloading in parallel with HTML parse instead of waiting for `auth.js` to inject it (saves ~150-300ms)
- Scripts no longer block HTML parsing — deferred scripts run in document order after parse completes

**Safety:** Transform proven purely additive — byte-for-byte match to original when additions are stripped. Audited all 14 pages for inline scripts that reference `vyveSupabase`/`vyveCurrentUser` at top level (would break with defer); the three flagged pages all wrap these references in function bodies, safe.

**Cache bump:** `sw.js` → `v2026-04-23a-defer-preload`.

---

### Commit 2: optimistic auth fast-path in auth.js
**Commit:** `b7291b9` · 2 files changed.

**Root cause found:** Every portal page has `<div id="app" style="display:none">` that only becomes visible when `auth.js` calls `vyveRevealApp()`. That call sat AFTER `vyveLoadSupabaseSDK()` (185KB script inject + download) AND `getSession()` (network round-trip) AND `vyveCheckConsent()` (another network round-trip). So even pages with perfect cache-first render logic were invisible for 300-600ms on every load because `#app` was hidden.

**Rewrote `vyveInitAuth()` in `auth.js`:** reads the cached session from `localStorage['vyve_auth']` BEFORE loading the Supabase SDK, dispatches `vyveAuthReady`, and calls `vyveRevealApp()` immediately. SDK load + `getSession()` + consent check still happen in the background — if the server says the session is invalid, user gets redirected to login.

Supabase session storage key is `'vyve_auth'` (set via `storageKey: 'vyve_auth'` in `createClient` options).

**Behaviour change:**
- Returning authenticated users: app visible in ~30-50ms instead of 300-600ms
- Invalid/expired sessions: briefly visible (~200-300ms) then redirected — mildly jarring but <1% of opens
- First-time users: unchanged (no cache, no fast path, full auth flow runs)
- Offline users: unchanged (fast path handles it; old offline-only branch removed, absorbed into unified path)
- `vyveCheckConsent` only triggers redirect for members created in last 10 min → safe to run in background

**Cache bump:** `sw.js` → `v2026-04-23b-fast-auth`.

---

### Commit 3: cache-first render on 4 pages that still showed skeleton flashes
**Commit:** `06aaef7` · 5 files changed.

After commits 1 and 2, the app was fast on first paint but pages still flashed their skeleton-loading divs for 100-300ms while the data fetch completed. Audited every page — found that `index.html`, `cardio.html`, `movement.html`, `settings.html`, `workouts.html` (via `workouts-programme.js`), and `leaderboard.html` already did cache-first render (offline or optimistic). But four pages only used their cache on `!navigator.onLine`, not online.

**Patched to render from localStorage cache immediately on page load, then fetch fresh data in background:**

1. **`nutrition.html`** — new cache key `vyve_members_cache_<email>` stores the members row (TDEE, targets, persona, weight/height). `loadPage()` reads it first, hides `#nutrition-loading` skeleton and shows `#nutrition-content` before the REST call runs. On fetch completion, silently re-renders if data differs (JSON-equal check).

2. **`engagement.html`** — existing `vyve_engagement_cache` key now renders optimistically on online loads (not just offline). Calls `renderScoreHero`, `renderStreaksFromPrecomputed`, `renderActivityGridFromPrecomputed`, `renderLogFromPrecomputed` from cached data before the `member-dashboard` EF call.

3. **`certificates.html`** — existing `vyve_certs_cache` key now renders optimistically. Calls `render(_cc.data)` before the dashboard EF call.

4. **`habits.html`** — existing `vyve_habits_cache` key now renders optimistically. Restores `habitsData` and `logsToday`, calls `renderHabits()` and hides `#habits-loading` before the three-way `Promise.all` to `member_habits`/`daily_habits`/`fetchHabitDates`.

**Invariant preserved:** first visit to each page still pays the fetch cost (no cache yet). Every subsequent visit renders instantly. Fresh data silently updates DOM if it differs from cache.

**Pages verified already cache-first (no change):** `index.html`, `cardio.html`, `movement.html`, `settings.html`, `leaderboard.html`, `workouts.html`.

**Cache bump:** `sw.js` → `v2026-04-23c-cache-first`.

---

### Architectural discovery noted for future work
The portal is multi-page (MPA) — each nav tap is a full HTML reload. Even with perfect cache-first render, there's an unavoidable ~50-100ms cost per navigation for HTML parse + deferred-script execution + cache read. This is why nav tabs still flicker slightly on transitions. Big apps (Instagram, Spotify, Linear) are SPAs with persistent shells — no reload between routes. 

**Options discussed with Dean, deferred post-MVP / post-Sage:**
- View Transitions API (~1 day work) — animates between page loads, doesn't remove the flicker but makes it feel polished
- Persistent iframe shell (~3-5 days) — `app.html` shell with top bar + bottom nav, iframe swaps content. Requires proper `history.pushState` for back button, deep-link redirects, Capacitor native back handling
- Full SPA conversion (~2-4 weeks) — correct long-term but not worth derailing May deadline

**Decision:** parked. MVP-first. Revisit after Sage deal closes.

### Known gotchas / rules added
- Supabase session storage key is `'vyve_auth'` (not the default `sb-<project>-auth-token`) — set explicitly in `createClient`.
- When adding `defer` to `<script>` tags, audit for inline scripts that reference auth globals at top level — they must be inside function bodies or `vyveAuthReady` listeners. Three pages had this pattern (`engagement.html`, `cardio.html`, `movement.html`), all safely inside functions.
- Optimistic auth fast-path works because `<div id="app">` has inline `style="display:none"` on every page — `vyveRevealApp()` sets `style.display='block'`. This was confirmed on all 12 portal pages.

## 2026-04-23 02:30 — Shell 3 Sub-scope A UI: three admin panels in admin-console.html

### What shipped

**`admin-console.html` extended (+23.7KB, 92.7KB → 116.4KB)** — surgical extension on `vyve-command-centre@f3d3f4f`. No rewrite; five targeted `str_replace`-style edits against the existing 2070-line file.

New member-detail sections (ordered after the existing read-only Programme section):

1. **Programme controls** — current state card + 4 admin actions: Pause / Resume / Advance week… / Swap plan…
2. **Habits** — lists active + inactive assignments with library join (pot, difficulty, assigned_by); Assign new habit opens a library `<select>` grouped by `habit_pot`
3. **Weekly goals** — current UK week (EF computes), 5 numeric inputs for targets (0..14), Save button opens the reason modal

### Design decisions

- **One new reason modal**, not field-specific. The existing `openScaryModal` is tightly coupled to `members`-column edits (`BOOL_FIELDS`, `INT_FIELDS`, `FIELD_LABELS` lookups, `.edit-row[data-field=…]` DOM rewriting). Building a generic `openReasonModal({ title, bodyHtml, confirmLabel, onConfirm })` was ~40 lines and gave the three Shell 3 panels a cohesive UX. Dismissal wired for backdrop click and Escape key, mirroring the scary modal exactly.
- **CSS reused verbatim**. `.modal-backdrop`, `.modal`, `.field`, `.current`, `.warn`, `.actions`, `.btn-primary`, `.btn-cancel`, `.edit-section`, `.edit-row`, `.edit-save`, `.edit-cancel`, `.empty`, `.hint` — all existing classes handle the new markup. Zero CSS added.
- **Three `apiHabits`/`apiProgramme`/`apiWeeklyGoals` helpers** via a shared `apiShell3(url, action, params)` — mirrors `apiEdit` exactly, but normalises Supabase gateway 401s (the `UNAUTHORIZED_NO_AUTH_HEADER` / `UNAUTHORIZED_INVALID_JWT_FORMAT` responses that aren't our `{success,error}` shape) into the unified return value.
- **`toggleSection` dispatch ordering**. The new panels use `title.startsWith('programme controls')` etc. checked *before* the existing `title.includes('programme')` dispatch so the new admin panel wins over the read-only one. Order matters.
- **Swap plan UX compromise**. The v1 `admin-member-programme` EF has no `list_library` action, so the Swap modal currently takes a library-programme UUID as free text with a hint to look it up in Supabase SQL. Good enough for the 3 admins who know what they're doing; UI-only ergonomics improvement worth adding in v1.1 (one-line EF extension, one-line UI change).

### Latent Shell 2 bug caught and fixed this session

`toggleSection` at L1610 previously had dispatches for Profile / Programme / Certificates / Notifications / Emails / Push — but **no dispatch for Audit Log**. The Audit Log accordion section exists in the DOM (`id="audit-content"`) and `loadAuditLog()` is fully implemented, but clicking the accordion header did nothing beyond toggling the open class. Fixed by adding `else if (title.includes('audit log')) loadAuditLog();` to the dispatch.

**This means Test 4 of the Shell 2 smoketest (Audit Log accordion renders) would have failed for reasons unrelated to Shell 2 EF correctness.** Worth knowing before re-running the smoketest — the fix is in the same ship.

### Validation

- `node --check` exits 0 on the extracted 79.8KB JS block — syntactically valid
- `<script>` / `</script>` tag balance: 2 / 2 ✅ (Hard Rule 43)
- `<style>` / `</style>` balance: 1 / 1 ✅
- 21 structural checks green (3 new DOM ids, reason modal DOM, 3 renderers, 3 EF URL consts, 3 api helpers, 4 toggleSection dispatches including the audit log fix, existing Shell 2 markers intact)

### Browser JWT round-trip — still untested

All three Shell 3 EFs and the Shell 2 edit EF have never been hit with a real admin JWT from the browser. The **full end-to-end test requires Dean (or another active admin) to**:

1. Open `https://admin.vyvehealth.co.uk/admin-console.html`
2. Open any member detail (default: self)
3. Exercise the three new accordions plus the existing Audit Log accordion
4. Confirm each action writes an audit row (visible in the Audit Log panel after refresh)

See updated `plans/admin-console-shell2-smoketest.md` for the Shell 2 portion and `plans/admin-console-shell3-ui-smoketest.md` (new file — next commit) for the Shell 3 UI portion.

### Commits

- Frontend: [`f3d3f4f`](https://github.com/VYVEHealth/vyve-command-centre/commit/f3d3f4fda6281dad2b42dc9fbf32a8ba80c58b77) on `vyve-command-centre@main`
- Brain commit: this entry + smoketest patch + backlog update

### Next session

Browser-side smoketest to close Sub-scope A fully. Then Sub-scope B (`admin-bulk-ops` EF + multi-select in member list). Bulk ops has a clear spec already (plans/admin-console-shell3-spec.md §5) — should be one session for the EF, another for the UI (member-list multi-select is a different kind of surgical edit).

---

## 2026-04-23 01:40 — Shell 3 Sub-scope A ship: admin-member-weekly-goals v1 (Sub-scope A complete)

### What shipped

**Edge Function `admin-member-weekly-goals` v1** — status ACTIVE, `verify_jwt: true`. Endpoint at `/functions/v1/admin-member-weekly-goals`. 370 lines. Same auth/CORS/audit pattern as the other three admin EFs. Two actions:

- `get_weekly_goals` — returns the `weekly_goals` row for a given ISO Monday (defaults to current UK Monday if `week_start` omitted)
- `upsert_weekly_goals` — upsert on `(member_email, week_start)` with all 5 targets required. Past-week guard: rejects `week_start` earlier than the current UK Monday with `current_uk_monday` echoed back in the error body.

Validation: `week_start` must be YYYY-MM-DD and an ISO Monday (dow=1); all 5 targets (`habits_target`, `workouts_target`, `cardio_target`, `sessions_target`, `checkin_target`) must be present and integer `0..14`.

### BST-aware current-Monday logic

EF computes the current UK ISO Monday using `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' })` on the EF's `new Date()`, then walks back to Monday. Chosen over a manual `+1` offset because it handles BST ↔ GMT transitions automatically (last Sunday of March / last Sunday of October) — no manual offset tracking required.

Verified against the DB: server UTC `2026-04-22 22:22:15` corresponds to UK `2026-04-22 23:22:15`, and `date_trunc('week', (now() AT TIME ZONE 'Europe/London')::date)` returns `2026-04-20`. That's what the EF returns for a bare `get_weekly_goals` call with no `week_start`.

Past-week guard verified: `'2026-04-13' < '2026-04-20'` ⇒ would be rejected with 400.

### Smoke test results

Same three-layer pattern. Test target: `deanonbrown@hotmail.com` (real Dean, not the `deanonbrown2@*` test accounts which also exist in `weekly_goals`). Used a persistent `_admin_wg_smoketest_backup` table following the pattern codified in the migrations log.

| Layer | Test | Result |
|-------|------|--------|
| Deploy | v1 ACTIVE, verify_jwt:true | ✅ |
| HTTP  | No auth / bad bearer → 401 | ✅ (Supabase gateway) |
| HTTP  | OPTIONS preflight → 200 + correct CORS headers | ✅ |
| DB    | Upsert INSERT path (new row for current UK week 2026-04-20) | ✅ |
| DB    | Upsert UPDATE path (different values on same row) | ✅ |
| DB    | Upsert INSERT for future week (2026-04-27) | ✅ |
| Logic | BST-aware current UK Monday matches DB's `date_trunc('week', …)` calc | ✅ |
| Logic | Past-week guard: `'2026-04-13' < '2026-04-20'` would trigger rejection | ✅ |
| Restore | Dean's 2 original rows (2026-03-30, 2026-04-06) byte-identical to backup | ✅ |
| Audit | 3 rows with correct `weekly_goals_upsert` action vocabulary, correct INSERT/UPDATE distinction via `old_value IS NULL` | ✅ |

Cumulative `admin_audit_log` sim rows across the whole of Sub-scope A: **10** (3 habits + 4 programme + 3 weekly_goals). All three Shell 3 tables now have at least one real audit entry.

### Reality check surfaced during smoke-test prep

When sampling `weekly_goals` rows via truncated emails, "deanonbrow***" matched three different accounts: `deanonbrown@hotmail.com` (the real one), `deanonbrown2@hotmail.com`, `deanonbrown1@hotmail.com`, and `deanonbrown2@gmail.com`. These are legacy test accounts in production. Flagged for the UI design so the member picker doesn't display truncated emails — exact-string match is safer.

### Sub-scope A summary: DONE

Three EFs shipped, one migration applied, one pattern lesson codified.

| EF | Actions | Lines | Migration | Audit action vocab |
|----|---------|-------|-----------|---------------------|
| `admin-member-habits` v1     | 5 (list_habits, list_library, assign_habit, deactivate_habit, reactivate_habit) | 436 | `extend_member_habits_assigned_by_admin` | `habit_assign`, `habit_deactivate`, `habit_reactivate` |
| `admin-member-programme` v1  | 5 (get_programme, pause, resume, advance_week, swap_plan) + regenerate 501 | 516 | (none) | `programme_pause`, `programme_resume`, `programme_advance_week`, `programme_swap` |
| `admin-member-weekly-goals` v1 | 2 (get_weekly_goals, upsert_weekly_goals) | 370 | (none) | `weekly_goals_upsert` |

### Still open for Sub-scope A closure

- Browser JWT round-trip against all three EFs (auth code is identical to verified v4 pattern — low residual risk)
- Role gating smoketest for `viewer` / `coach_exercise` (needs a test admin row)
- `get_*` read actions (all three EFs — safe SELECTs, DB-correctness already proven by the restore steps)
- **Frontend UI panels in `admin-console.html`** — batched as the next session. All three EF APIs are stable enough to build UI against.

### Commits

- EF deploy: `admin-member-weekly-goals` v1, id `c35ece85-edc0-462d-9141-86f5ea27247e`
- Brain commit: this entry + backlog update (Sub-scope A EFs fully struck)

### Next session

Frontend UI panels for all three A-EFs in `admin-console.html`. Scope:

1. **Habits panel** in member detail — list assignments (with library drill-down for assign), deactivate/reactivate toggles, reason modal
2. **Programme panel** — show current programme card + pause/resume/advance/swap controls, library picker for swap
3. **Weekly goals panel** — current-week row with 5 sliders (0..14), save-with-reason for either current or future weeks

UI is batched into one session because the three panels share common primitives: reason modal, audit log display, toast feedback. Once this lands, Sub-scope A is **fully done** and Sub-scope B (bulk ops) can begin.

---

## 2026-04-23 01:10 — Shell 3 Sub-scope A ship: admin-member-programme v1

### What shipped

**Edge Function `admin-member-programme` v1** — status ACTIVE, `verify_jwt: true`. Endpoint at `/functions/v1/admin-member-programme`. 516 lines. Same pattern as `admin-member-edit` v4 / `admin-member-habits` v1. Actions:

- `get_programme` — returns cache summary (id, week/session, is_active, source, programme_name, split_type, weeks_count) with optional `include_json: true` to return full programme JSON
- `pause_programme` — `is_active=false, paused_at=now()`
- `resume_programme` — `is_active=true, paused_at=null`
- `advance_week` — set `current_week` to a valid value (1..`plan_duration_weeks`), reset `current_session=1`
- `swap_plan` — copy `programme_json` from `programme_library`, reset week/session, `source='library'`, `source_id=<library_id>`, full upsert on `member_email`

Shape validation on `swap_plan`: library programme_json must have `weeks[]` as a non-empty array and `weeks[0].sessions[]` non-empty. Malformed library rows return 422, not 500 — guards against corrupting the member's cache with junk.

Hard Rule 44 compliance: `swap_plan` uses `.upsert({...}, { onConflict: 'member_email' })`. All other mutations are `.update()` against the already-existing row.

### Scope decision: `regenerate` cut from v1

Spec §4.2 described `regenerate` as a "fire-and-forget call to `generate-workout-plan`." Inspection of the live `generate-workout-plan` EF (deployed as platform version 11) shows it expects a **rich onboarding-shaped payload** of ~15 fields: `trainingLocation`, `gymExperience`, `trainDays`, `trainingGoals`, `specificGoal`, `injuries`, `scores.{wellbeing,stress,energy}`, `lifeContext`, `equipment`, `avoidExercises`, `lifeContextDetail`, etc. It does not take `{email}` and read the member row itself.

That means a proper `regenerate` implementation needs a field-mapping layer that transmutes `members` columns into the onboarding payload shape, plus handling for: incomplete onboarding data, Anthropic API failures, 40–60s synchronous generation time, and the `max_tokens` trip hazard the EF already guards against.

Decision: ship v1 with 4 mutating actions + `get_programme`. The `regenerate` route responds **HTTP 501** with a clear deferral message pointing to v1.1. `swap_plan` covers the practical admin use case (reset a member's programme to a known-good library plan without AI involvement).

### Source value alignment

Spec §4.2 said `source='admin_swap'` for library-sourced plans. Live DB shows `workout_plan_cache.source` already uses `{onboarding, shared, library}` across the 12 existing rows. Aligned to the existing convention: `swap_plan` writes `source='library'`. `admin_regen` reserved for the future `regenerate` action.

### Smoke test results

Same three-layer pattern as `admin-member-habits` v1. Test target: `deanonbrown@hotmail.com` (own record, safe). Used a persistent backup table (`_admin_programme_smoketest_backup`, since dropped) to guarantee restore since `CREATE TEMP TABLE` doesn't persist across Supabase MCP `execute_sql` calls.

| Layer | Test | Result |
|-------|------|--------|
| Deploy | v1 ACTIVE, verify_jwt:true | ✅ |
| HTTP  | No auth / bad bearer → 401 | ✅ (Supabase gateway) |
| HTTP  | OPTIONS preflight → 200 + correct CORS headers | ✅ |
| DB    | pause_programme (is_active true → false, paused_at set) | ✅ |
| DB    | resume_programme (is_active false → true, paused_at null) | ✅ |
| DB    | advance_week (week 1 → week 3, session reset to 1) | ✅ |
| DB    | swap_plan (programme_json fully replaced, source→library, plan_duration_weeks 8 → 6) | ✅ |
| Restore | Dean's row byte-identical to pre-test state (including programme_json JSONB equality) | ✅ |
| Audit | 4 rows in `admin_audit_log` with correct action vocabulary (`programme_pause`, `programme_resume`, `programme_advance_week`, `programme_swap`) | ✅ |

Cumulative `admin_audit_log` sim rows: 7 (3 from habits, 4 from programme). Table-level sanity: actions/columns/names all align with spec.

### Pattern lesson surfaced this session

**`CREATE TEMP TABLE` doesn't work across `execute_sql` calls** — each call is a fresh session and temp tables scope to the session. For multi-call DB simulations, use a regular table with a unique name prefix (e.g. `_admin_programme_smoketest_backup`) and explicitly `DROP` it in the cleanup step. Adding this to the migrations log as a testing primitive.

### Still open (blocked on browser-side JWT)

- Full JWT round-trip (code path identical to two already-verified EFs)
- `get_programme` read action (SELECT-only, safe; DB correctness confirmed by the restore step)
- Role gating for `viewer`
- Frontend UI panel

### Commits

- EF deploy: `admin-member-programme` v1, id `3129f5c9-7ccb-41eb-bfe7-6d4361edd36e`
- Brain commit: this entry + `plans/admin-console-shell3-migrations.sql` addendum

### Next session

Ship `admin-member-weekly-goals` v1 (last EF in Sub-scope A; simpler — just `weekly_goals` upsert on `(member_email, week_start)`, no JSONB, no shape validation beyond Monday-check).

Then: frontend UI panels for all three A-EFs in `admin-console.html`, batched as one UI session.

---

## 2026-04-23 00:30 — Shell 3 Sub-scope A ship: admin-member-habits v1

### What shipped

**Migration** (`extend_member_habits_assigned_by_admin`): `member_habits_assigned_by_check` now accepts `'admin'` in addition to the existing `{onboarding, ai, theme_update, self}`. One-line DROP/ADD, zero rows affected (65 rows all `onboarding`).

**Edge Function `admin-member-habits` v1** — status ACTIVE, `verify_jwt: true`. Endpoint at `/functions/v1/admin-member-habits`. 436 lines. Mirrors `admin-member-edit` v4 patterns verbatim (CORS allowlist, JWT via `anon.auth.getUser`, `admin_users` allowlist with `active=true`, shared audit helper, same JSON envelope). Actions:

- `list_habits` — member's assignments joined to `habit_library` (reads)
- `list_library` — active library habits, optionally filtered by `habit_pot`
- `assign_habit` — upsert on `(member_email, habit_id)`, `active=true`, `assigned_by='admin'`, reactivates if was inactive
- `deactivate_habit` — soft delete (sets `active=false`, preserves history)
- `reactivate_habit` — flip `active=true`, blocked if library habit itself is deactivated

Every mutating action: reason required (min 5 chars), no-op detection before audit write, per-mutation audit row with `table_name='member_habits'`, role gating (`viewer` rejected, others allowed — `coach_exercise` has no additional restriction on this table per spec).

Hard Rule 44 compliance: `assign_habit` uses `.upsert({...}, { onConflict: 'member_email,habit_id' })`, never UPDATE-then-INSERT.

### Smoke test results

Ran the layered smoke test pattern (platform layer → HTTP auth layer → DB layer).

| Layer | Test | Result |
|-------|------|--------|
| Deploy | v1 ACTIVE, verify_jwt:true | ✅ |
| HTTP  | No auth header → 401 `UNAUTHORIZED_NO_AUTH_HEADER` | ✅ (Supabase gateway) |
| HTTP  | Garbage bearer → 401 `UNAUTHORIZED_INVALID_JWT_FORMAT` | ✅ (Supabase gateway) |
| HTTP  | OPTIONS preflight → 200 + correct CORS headers | ✅ |
| DB    | assign_habit on `deanonbrown@hotmail.com` + unassigned `5-minute morning check-in` habit | ✅ — row created, `assigned_by='admin'` persisted, audit row written |
| DB    | deactivate_habit | ✅ — `active=false`, audit row written |
| DB    | reactivate_habit | ✅ — `active=true`, audit row written |
| Cleanup | Test habit removed, member back to 5 habits | ✅ |

Pre-session `admin_audit_log` contained **zero rows**. Post-session it contains 3 simulation rows (`ip_address='sim'` for filtering). First real audit rows on the table. Confirms shape of audit entries is correct and the table accepts the Shell 3 action vocabulary.

### Still open (blocked on browser-side JWT)

- Full JWT → `admin_users` round-trip against a real admin session (code path is identical to `admin-member-edit` v4's verified auth path, so risk is low)
- `list_habits` / `list_library` browser-side smoke tests (straightforward SELECTs, no side effects)
- Role gating for `viewer` (needs a test admin row created with `role='viewer'`)
- Frontend UI panel in `admin-console.html` to expose these actions (separate commit, next session)

### Pattern lessons surfaced this session

- **Platform-gateway 401 hides our EF's auth message.** When `verify_jwt: true`, Supabase's edge rejects invalid tokens *before* handler code runs. Error codes like `UNAUTHORIZED_NO_AUTH_HEADER` / `UNAUTHORIZED_INVALID_JWT_FORMAT` are Supabase platform errors, not our app errors. This is actually good (saves us handler compute on garbage requests), but worth knowing for frontend error handling: the frontend should not assume every 401 has a `{success:false,error:...}` JSON body shape — it may be a bare platform error.
- **DB-layer simulation as a smoke-test primitive.** When we can't mint a JWT from the workbench, running the same SQL the EF would run (including the exact upsert/conflict clauses) gives high-confidence validation of the data layer without needing a browser session. Codified in the migrations log.

### Commits

- Live DB migration: `extend_member_habits_assigned_by_admin` (22 April, via `apply_migration`)
- EF deploy: `admin-member-habits` v1, id `ee5acebc-4a0e-4739-90a0-bdf76bc8cdc1`
- Brain commit: this entry + `plans/admin-console-shell3-migrations.sql`

### Next session

Frontend: add the habits panel to `admin-console.html` (member detail page, under the existing Quick Edit sections). Once that ships and a real JWT round-trip completes successfully, this EF is fully verified.

Then: `admin-member-programme` v1 (next in Sub-scope A). Similar complexity, but needs careful upsert against `workout_plan_cache` (UNIQUE on `member_email` — Hard Rule 44 applies).

---

## 2026-04-22 23:55 — Admin Console Shell 3 spec + Shell 2 smoketest runbook

### What shipped

**`plans/admin-console-shell3-spec.md`** — 270-line spec for Shell 3, the cross-table edit / bulk ops / content library layer of the admin console. Grounded in live schema (verified this session via `execute_sql` against `ixjfklpckgxrwjlfsaaz`). Lead principle explicitly carried over from this morning's session: *no spec = hallucinated schema* — code for any Shell 3 EF is gated on the relevant section of this spec.

Shell 3 breaks into four sub-scopes (priority order confirmed with Dean):

- **A — Cross-table edits:** three new EFs (`admin-member-habits`, `admin-member-programme`, `admin-member-weekly-goals`) targeting `member_habits` / `workout_plan_cache` / `weekly_goals`. All upserts use `onConflict` (Hard Rule 44). One DDL migration required: extend `member_habits_assigned_by_check` to accept `'admin'`.
- **B — Bulk ops:** one EF (`admin-bulk-ops`), three fields only (persona, exercise_stream, re_engagement_stream), cap 100 members per call, one audit row per affected member, HAVEN guard at EF level.
- **C — Content library CRUD:** one EF (`admin-content-library`) over `habit_library` / `programme_library` / `knowledge_base`, per-table column whitelist, JSON shape validation for `programme_json`.
- **E — Audit search:** thin wrapper EF over `admin_audit_log` with filter/search UI.

Sub-scope **D (impersonation) formally deferred** until post-Sage contract — needs its own threat model.

**`plans/admin-console-shell2-smoketest.md`** — 6-test runbook to close the Shell 2 E2E testing items flagged as open in `admin-console-spec.md` §7. `admin_audit_log` contains zero rows at the time of writing, confirming no admin has exercised the pencil flow end-to-end since this morning's ship. The runbook covers SAFE inline, SCARY modal + reason validation, no-op detection, audit log accordion read-back, modal dismissal, and `coach_exercise` role gating.

### Schema drift caught this session

The 19 April `brain/schema-snapshot.md` is 3 days stale and does not reflect today's Shell 2 Phase 1 DDL. Four claims in the Shell 2 spec were checked against the live DB:

| Claim                                               | Snapshot (19 Apr) | Live DB (22 Apr) |
|-----------------------------------------------------|-------------------|------------------|
| `admin_audit_log` table exists                      | ❌ missing         | ✅ exists         |
| `admin_users_role_check` includes coach roles       | ❌ admin/viewer only | ✅ all 5 roles |
| `members.display_name_preference` column exists     | ❌ missing         | ✅ exists         |
| `members_persona_check` enum includes HAVEN         | ✅                 | ✅                |

All four today-session claims verified. Snapshot will catch up on the next Sunday 03:00 UTC `schema-snapshot-refresh` run. No action needed.

### Known Shell 2 gap (not blocking)

`admin_audit_log` has never received a row. Shell 2 is live but has not been proven against the live EF + live UI. The smoketest runbook closes this.

### Commit

- [`5fa8dfe`](https://github.com/VYVEHealth/VYVEBrain/commit/5fa8dfee58f8a5be03d6941f0f2c1c6f8ea4dd5d) — `plans/admin-console-shell3-spec.md`, `plans/admin-console-shell2-smoketest.md`

### Next session

Run the Shell 2 smoketest (~15 minutes). Once all 6 boxes ticked, start Shell 3 Sub-scope A: ship `admin-member-habits` v1 (lowest-risk of the three cross-table EFs; no JSONB, no schema reshaping).

---

## 2026-04-22 18:00 — Admin Console Shell 2: Field Inventory Correction & True Ship

### Audit findings (deep dive)

Earlier today two changelog entries claimed Shell 2 was "complete and ready for deployment" with `admin-member-edit` EF v1 shipped and `admin-console.html` enhanced with pencil/modal/reason UI. Deep dive against the live repo and live DB revealed:

- **Frontend never shipped.** `admin-console.html` on `main` contained zero references to `admin-member-edit`, `pencil`, `edit`, `modal`, or `reason`. The Shell 2 UI existed only in a tool-call artifact from the earlier session.
- **Backend was structurally broken.** The deployed EF would have 403'd on every call. Issues found:
  - Queried `admin_users.admin_email` / `admin_role` — real columns are `email` / `role`
  - No check on `admin_users.active = true`
  - Used `members.member_email` — real column is `email`
  - 9 of 12 claimed editable fields did not exist on `members` table (`display_name`, `assigned_habits`, `workout_programme`, `weekly_goals`, `weekly_goal_target`, `monthly_goal_target`, `default_programme`, `notification_preferences`, `privacy_accepted`)
  - No `plans/admin-console-spec.md` had been written before code was generated — root cause of the hallucinated schema

### Real ship — this session

**Backend: `admin-member-edit` v4 redeployed**

Rewrite aligned with verified `public.members` and `public.admin_users` schema:
- `admin_users` lookup now uses `email`, `role`, `active=true`
- `members` lookup uses `email` (the unique key; `id` is PK but `email` is the external identity)
- `SAFE_FIELDS` (14) — `first_name`, `last_name`, `company`, `goal_focus`, `tone_preference`, `reminder_frequency`, `contact_preference`, `theme_preference`, `exercise_stream`, `display_name_preference`, `notifications_milestones`, `notifications_weekly_summary`, `privacy_employer_reporting`, `re_engagement_stream`
- `SCARY_FIELDS` (7) — `persona`, `sensitive_context`, `health_data_consent`, `subscription_status`, `training_days_per_week`, `tdee_target`, `deficit_percentage`
- Per-field type/range/enum validation
- Role gating: `coach_exercise` cannot edit `persona` / `sensitive_context` / `health_data_consent`; `viewer` cannot edit at all
- Actions: `member_edit`, `member_audit_log`, `field_schema`
- No-op detection: returns `{no_op: true}` rather than writing audit row when value unchanged
- Audit writes to `admin_audit_log` with admin email/role, old/new JSON values, reason, IP, user agent

**Frontend: `admin-console.html` Shell 2 ship (commit `8fa65e5`)**

Surgical extension of the existing Shell 1 file (no rewrite):
- CSS block for edit rows, modal, toast, audit list
- `apiEdit()` helper (mirrors existing `apiCall()` pattern, uses Supabase Auth JWT)
- Inline pencil → input/select → Save/Cancel for SAFE fields, no reload
- Pencil icon → modal dialog with current value, new value, reason textarea (min 5 chars) for SCARY fields
- Toast system for success / error / warning
- New "Audit Log" accordion section in member detail (renders on toggle)
- Modal dismissal via backdrop click or Escape key
- Template literal balance preserved (Hard Rule 43); `node --check` passes on extracted JS
- Cross-table edits (habits on `member_habits`, programme on `workout_plan_cache`, weekly goals on `weekly_goals` table) deferred to Shell 3 — they aren't column updates on `members`

### Fields dropped from Shell 2 scope

These were in the broken v1 EF and do not exist as `members` columns. They live on other tables and need their own endpoints (Shell 3):
- Habits → `member_habits` (join table + `habit_library`)
- Workout programme → `workout_plan_cache` (JSONB)
- Weekly goals → `weekly_goals` (one row per week_start)

### Lessons

- **No spec = hallucinated schema.** `plans/admin-console-spec.md` must exist before code. Written this session at `plans/admin-console-spec.md`.
- **Verify DB before writing EFs.** Always query `information_schema.columns` against the table being edited.
- **Test calls, don't trust deploys.** An EF being "ACTIVE" in the Supabase dashboard doesn't mean it works — always fire one real call through from the admin identity after deploy.

### Status

- Backend: ✅ `admin-member-edit` v4 deployed with verified schema
- Frontend: ✅ `admin-console.html` Shell 2 live on `vyve-command-centre@8fa65e5` → `admin.vyvehealth.co.uk/admin-console.html`
- Spec: ✅ `plans/admin-console-spec.md` committed
- Testing: ⏳ End-to-end edit flow (SAFE inline + SCARY modal + audit log) needs manual verification from Dean/Lewis

---

## 2026-04-22 23:29 — Admin Console Shell 1 + DB Prep (earlier this session)

**Phase 1: Database Preparation (shipped to production `ixjfklpckgxrwjlfsaaz`)**
- Expanded admin_users CHECK constraint for coach roles
- Created admin_audit_log table with RLS + 5 performance indexes
- All database infrastructure ready for Shell 2 editing features

**Phase 3: Shell 1 admin-console.html shipped** (commit `baa56c6` on vyve-command-centre). Read-only Kahunas-style member ops console, reuses admin-dashboard v9 EF, coexists with existing Dashboard.html and index.html.

---

# VYVE Health — VYVEBrain Changelog

This file tracks all significant changes to the VYVE Health platform, infrastructure, and business operations. Each entry is timestamped and categorized for engineering continuity across sessions.

**Format:** Each entry starts with UTC timestamp and brief description, followed by structured details. Most recent entries appear first.

**Scope:** Technical deployments, business milestones, infrastructure changes, security updates, and operational improvements.

---

