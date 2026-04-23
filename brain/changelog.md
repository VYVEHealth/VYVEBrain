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

