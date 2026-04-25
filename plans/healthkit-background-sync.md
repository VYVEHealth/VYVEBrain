# HealthKit background sync — Investigation + parked future vision

> **Status:** 🅿️ **PARKED 25 April 2026 as future vision.** Scoped in depth. Not building now.
> **Reason for parking:** Dean's call after reviewing the detailed plan — scope is ≈4–5 Claude-assisted build sessions + 1 week real-time device soak + App Store review cycle (≈2–3 weeks calendar), which is disproportionate for a v2 improvement on a v1 feature whose parent (the Capacitor wrap itself) isn't on the App Store yet. See §0 below for the full parking rationale.
> **Purpose of this document:** Preserve the investigation so we don't redo it when/if we come back. The technical findings in §2 (Capgo 8.4.7 API surface) and the architecture choice in §3 (companion Swift plugin, not a fork) will still be correct against the same Capgo version; if Capgo changes, re-verify §2 only.
> **Owner when unparked:** Dean (technical build). Lewis (privacy-policy microcopy + App Store review notes before submission).
> **Related:** `plans/healthkit-health-connect.md` (v1 HK integration — shipped). `plans/habits-healthkit-autotick.md` (autotick on `member-dashboard` v51 — shipped). `plans/healthkit-views.md` (inspector + feed — shipped).

---

## 0. Why this is parked

- **Wrong order.** The Capacitor wrap itself isn't on the App Store yet — that's `PRIORITY #1` in §21 of master. Building a v2 improvement on an unshipped v1 is out of sequence.
- **Disproportionate cost.** 4–5 build sessions + 1 week real-calendar device soak + full App Store review cycle (Apple scrutinises HealthKit background delivery more closely than standard reviews) is a 2–3 week calendar commitment for a feature whose win is "members who never open VYVE on workout days get their data synced anyway" — a real benefit, but a second-order one.
- **Foreground path is respectable.** The shipped autotick (sessions 1 + 2 + 3 + 3a) handles most of the member journey already: anyone who opens VYVE weekly gets their data, their habits pre-tick, and the experience feels like magic. Background sync is a tail-case improvement, not a core gap.
- **No strong external signal yet.** No enterprise pilot has named this as a blocker. No individual member has complained. We'd be building on hypothesis.

**Signals to unpark.** (a) Capacitor iOS and Android both on stores and stable for a month-plus; (b) real member feedback (support tickets, enterprise ask, retention data) naming background sync specifically; (c) a "workout-then-ghost" engagement cohort large enough in PostHog that fixing it would move the number meaningfully. None of these are true today.

---

## 1. The blunt reality of iOS background delivery

*(This section is the member-facing expectations framing — if we come back to build, this copy flows into Lewis's settings.html disclaimer and App Store Review Notes.)*

Apple's HealthKit background delivery is **opportunistic, not scheduled**. `HKHealthStore.enableBackgroundDelivery(for:frequency:.immediate)` tells iOS "wake me as soon as there's new data for this type", but iOS reserves the right to:

- Batch multiple samples into a single wake.
- Delay wake-ups under battery pressure, Low Power Mode, or thermal throttling.
- Skip wake-ups entirely if the device is locked with a passcode and this is the first unlock since boot (Apple's per-user-data encryption means HealthKit data is unreadable until first unlock).
- Stop wake-ups permanently if the member **force-quits** VYVE from the app switcher. Only a fresh manual launch re-arms delivery.

Real-world latency (Apple forums, StackOverflow, as of 2026):
- **Typical:** 2–15 minutes from sample write to wake-up on an unlocked active device.
- **Common:** 30 minutes to a few hours when the device is idle / locked / charging overnight.
- **Occasional:** 24 hours or more, especially after OS updates or when Low Power Mode has been on for the batch window.

We pair this with **BGAppRefreshTask** as a daily safety net — iOS gives our task identifier ~1 opportunity per day (sometimes less), which catches anything the observer missed.

**Member-facing honest copy:** "Your Watch data usually flows in within a few minutes of finishing a workout, but can take longer if your phone's been locked or in battery-saver. Open VYVE to force a refresh any time." Lewis owns the final wording — draft above is a baseline.

---

## 2. What Capgo 8.4.7 exposes, and what's missing

*(Definitive — verified 25 April 2026 by reading `Cap-go/capacitor-health` main branch. If Capgo has shipped a new version by the time we come back, re-verify **this section only**. Everything else in this plan is architecture-level and version-agnostic.)*

| What Capgo 8.4.7 exposes | Verified |
|---|---|
| `isAvailable`, `requestAuthorization`, `checkAuthorization` | TS + @objc |
| `readSamples(dataType, startDate, endDate, limit, ascending)` | TS + @objc |
| `queryWorkouts(workoutType?, startDate, endDate, limit, anchor?)` | TS + @objc |
| `queryAggregated(dataType, bucket, aggregation, startDate, endDate)` | TS + @objc |
| `saveSample` (iOS: weight only — no `saveWorkout`) | TS + @objc |
| `getPluginVersion`, `openHealthConnectSettings` (Android no-op on iOS), `showPrivacyPolicy` (Android no-op on iOS) | TS + @objc |

**What it does NOT expose** — greps of `ios/Sources/HealthPlugin/Health.swift` (59.6 K chars) and `HealthPlugin.swift` (7.8 K chars) for `observer`, `Observer`, `background`, `Background`, `enableBackground`, `BGAppRefresh`, `BGTask`, `listener`, `notifyListeners`, `HKObserverQuery`, `subscribe` all return **zero matches**. The plugin is a purely pull-based foreground accessor with no background surface of any kind.

The public API is the 10 methods above and nothing else — `HealthPlugin.swift` `pluginMethods` array and `definitions.ts` agree exactly. No private scaffolding to extend.

**Implication.** Background delivery requires native Swift code that we own, not Capgo extensions. The clean way to add it is a small **companion Capacitor plugin** that sits alongside Capgo in the iOS project — not a fork of Capgo. Capgo continues handling the foreground path unchanged.

---

## 3. Architecture options (assessed)

| Option | Description | Verdict |
|---|---|---|
| **A1. Companion plugin, full background sync** | New `VyveHealthBackground` Swift-only Capacitor plugin. Registers `HKObserverQuery` + `enableBackgroundDelivery` on authorisation. On wake, fetches new samples natively and POSTs to `sync-health-data` via URLSession using a refresh-token-derived JWT from Keychain. `BGAppRefreshTask` as daily floor. | **Recommended if we build.** |
| **A2. Companion plugin, flag-and-defer** | Same observer + BGAppRefreshTask wiring, but on wake just stores a "pending sync" flag in UserDefaults. Actual sync happens on next app open via the existing `healthbridge.js` path. | Rejected. Doesn't satisfy the goal ("data flows in without member opening VYVE"). Only advantage is simplicity. |
| **B. Fork Capgo** | Fork `Cap-go/capacitor-health`, add observer queries + background delivery to both TS and Swift, maintain the fork. | Rejected. `Health.swift` is 60 K chars; every Capgo upgrade (new data types, Health Connect parity fixes) becomes merge-conflict work. Not worth owning the whole plugin for a small background surface. |
| **C. Upstream PR to Capgo** | Raise a PR on `Cap-go/capacitor-health` adding background delivery. | Rejected as a timeline. Fine as a side track if Dean wants to open an exploratory PR, but no merge visibility and the API additions aren't trivial to review upstream. |

**Why A1 wins.** (1) Zero risk to Capgo upgradability — we touch nothing in the Capgo surface. (2) The background code path is genuinely small (~400 lines Swift including Keychain + URLSession + BGTask boilerplate) because `sync-health-data` v7 is idempotent on `native_uuid` and the JSON payload shape is already shipped. (3) No server-side changes. (4) Keeps Capgo's `queryAggregated` dedupe logic (Watch vs iPhone double-counting) — we just call the same Apple APIs from background.

---

## 4. The A1 design in detail

### 4.1 New Swift plugin: `VyveHealthBackground`

Lives in the Capacitor iOS project at `ios/App/App/plugins/VyveHealthBackground/`. Two files, both new, both owned by us:

```
ios/App/App/plugins/VyveHealthBackground/
  VyveHealthBackground.swift        // @objc Capacitor plugin surface — called from JS
  VyveHealthBackgroundCore.swift    // Observer registration, fetch, POST, Keychain
```

**JS-facing @objc methods** (registered with `CAPBridgedPlugin.pluginMethods`):

| Method | Purpose |
|---|---|
| `enableBackgroundSync({ refreshToken, supabaseUrl, anonKey, memberEmail })` | Called from `healthbridge.js` immediately after `Health.requestAuthorization` succeeds. Stashes refresh token + config in Keychain. Registers `HKObserverQuery` for each tracked data type. Enables background delivery at `.immediate` frequency. Schedules the first `BGAppRefreshTask`. |
| `disableBackgroundSync()` | Called on disconnect. Calls `HKHealthStore.disableAllBackgroundDelivery`, cancels scheduled BGTasks, wipes Keychain items. |
| `getBackgroundSyncStatus()` | Returns `{ enabled, lastBgWakeAt, lastBgSyncAt, lastBgError, bgWakeCountLast7d }` for the settings page. Diagnostic only. |

The plugin does **not** expose anything that triggers a foreground sync — that stays in `healthbridge.js` via Capgo. Clean separation.

### 4.2 Observer queries + background delivery

On `enableBackgroundSync`, for each of `workouts`, `steps`, `distance`, `activeEnergyBurned`, `bodyMass`:

```swift
let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, completionHandler, error in
  self?.handleBackgroundWake(for: type, completion: completionHandler)
}
healthStore.execute(query)
healthStore.enableBackgroundDelivery(for: type, frequency: .immediate) { success, error in … }
```

Heart rate and sleep are **not** in the observer list v1 — they fire very frequently and we don't autotick from heart rate; sleep is a single batch at morning wake. Adding them means Watch battery drain with no product win.

`handleBackgroundWake` must call `completionHandler()` within ~30 seconds or iOS stops trusting us. The sync path needs to complete in that window or defer.

### 4.3 The background sync path

1. Observer fires. We have a ~30-second budget.
2. Fetch a valid Supabase access token: read refresh token from Keychain, hit `POST {supabaseUrl}/auth/v1/token?grant_type=refresh_token` with `apikey: anonKey` + `{ refresh_token }`. Rotate the new refresh token back into Keychain (Supabase rotates on every refresh). Cache access token in memory for the call.
3. Pull the relevant samples for a rolling 24h window using native HealthKit APIs (`HKSampleQuery` for workouts, `HKStatisticsCollectionQuery` for steps/distance/energy to match Capgo's dedupe behaviour, `HKSampleQuery` for bodyMass).
4. Serialise to the exact EF payload shape `healthbridge.js` uses: `{ action: 'pull_samples', platform: 'healthkit', granted_scopes: [...], samples: [...] }` and `{ action: 'push_daily', platform: 'healthkit', daily: [...] }`. The `native_uuid` / dedupe machinery on the server handles any overlap with the foreground path — zero special-casing on the EF side.
5. POST to `{supabaseUrl}/functions/v1/sync-health-data` with `Authorization: Bearer {accessToken}`.
6. Call `completionHandler()` regardless of HTTP result. Log errors to a small rolling log in UserDefaults for the settings diagnostic page.
7. Schedule the next `BGAppRefreshTask` with `earliestBeginDate: Date().addingTimeInterval(12 * 3600)`.

**`HKAnchoredObjectQuery` as an optimisation — deferred to v2.1.** We'd use anchored queries to only fetch *new* samples per wake, storing the anchor in UserDefaults. v1 can re-fetch the rolling 24h window on each wake; EF idempotency handles the overlap. Anchored queries are a perf nicety, not a correctness requirement.

### 4.4 Token lifecycle (the one non-obvious bit)

Supabase user sessions expire in ~1 hour (access token) / ~30 days with automatic rotation (refresh token). Background wake-ups happen hours-to-days after the member was last in the app. The refresh token must be stashed plugin-accessibly.

**Design.** On `enableBackgroundSync`, `healthbridge.js` reads `vyveSupabase.auth.getSession()` and passes `session.refresh_token` + `session.user.email` + the anon key + supabase URL to the plugin. The plugin stores them in iOS Keychain under an app-scoped service (`co.uk.vyvehealth.app.bgsync`) with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`. This access level matters:

- **After first unlock** — background wake-ups following a device lock still get Keychain access.
- **This device only** — token doesn't migrate via iCloud Keychain backup. Per-device lifecycle, matches Supabase's session-per-device model.

On every successful foreground sync we refresh the stored refresh token (in case Supabase rotated it). If a background sync hits a refresh-token failure (member logged out on another device, token revoked, password changed), the plugin wipes the Keychain entry and sets a flag read on next app open telling JS "background sync was disconnected because your session expired — reconnect in Settings". No re-auth prompts surfaced to someone who isn't holding their phone.

**Gotcha flagged.** If Lewis ever adds a "log out on all devices" feature server-side, background sync will silently stop on every device. That's the correct behaviour but we need a diagnostic on `settings.html` so members understand why.

### 4.5 `BGAppRefreshTask` — the daily floor

Belt-and-braces against HKObserverQuery throttling / locked-device skips / Low Power Mode. Registered under identifier `co.uk.vyvehealth.app.healthsync`.

On launch, AppDelegate:
```swift
BGTaskScheduler.shared.register(forTaskWithIdentifier: "co.uk.vyvehealth.app.healthsync",
                                using: nil) { task in
    VyveHealthBackgroundCore.shared.handleBGRefresh(task: task as! BGAppRefreshTask)
}
```

On enable-background-sync, schedule the first task with `earliestBeginDate: Date().addingTimeInterval(6 * 3600)`. After each run, schedule the next. iOS may honour the `earliestBeginDate` hint or delay it; 6h spacing gives iOS room to actually run us.

The BGRefresh handler does the same work as the observer handler (same 24h pull, same EF POST). Running twice for the same samples is a no-op — EF deduplicates on `native_uuid`.

---

## 5. iOS project changes required

**Prerequisite flagged at scoping time:** the `vyve-capacitor` repo on `main` has **no `ios/` directory committed** — only Android, www, resources, docs, capacitor.config.json, package.json. `.gitignore` only excludes iOS build artefacts (`ios/App/build/`, `ios/App/Pods/`, etc.), not `ios/` itself. The iOS native project (AppDelegate, Info.plist, App.entitlements, the Xcode project, Capgo's SPM Package.resolved) lives only on Dean's Mac. Before any of the below diffs can be applied to a real file in git, that folder needs to be committed. Hygiene item in its own right, independent of this plan.

### 5.1 Info.plist additions

```xml
<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>          <!-- enables BGAppRefreshTask -->
  <string>remote-notification</string>  <!-- already there if push wired -->
</array>
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
  <string>co.uk.vyvehealth.app.healthsync</string>
</array>
```

**No `"healthkit"` UIBackgroundMode exists.** HealthKit background delivery is gated by the entitlement alone, not by UIBackgroundModes. This trips up a lot of third-party guides; getting it wrong means App Store Review questions.

Purpose strings from v1 need a tweak:
- `NSHealthShareUsageDescription` — update to cover background access explicitly.
- `NSHealthUpdateUsageDescription` — unchanged.

Draft for Lewis to edit: *"VYVE reads your workouts, activity, sleep, and weight so it can keep your progress up to date and tick off your daily habits automatically — even when you haven't opened the app. Your data is encrypted in transit and only you can see it."*

### 5.2 App.entitlements additions

```xml
<key>com.apple.developer.healthkit</key>
<true/>                  <!-- already set for v1 -->
<key>com.apple.developer.healthkit.background-delivery</key>
<true/>                  <!-- NEW -->
```

The background-delivery entitlement requires an updated provisioning profile — Xcode handles this automatically if the team is signed into Automatic Signing, but the App ID in the developer portal needs the capability enabled first.

### 5.3 AppDelegate.swift wiring

Two additions:
1. Register the BGTask identifier at `application(_:didFinishLaunchingWithOptions:)`.
2. On cold launch after a background wake, avoid re-registering the observer (it's persistent — re-executing it leaks). Guard with a launched-from-background check.

### 5.4 New plugin files

`VyveHealthBackground.swift` and `VyveHealthBackgroundCore.swift` as described in §4.1. Added to the Xcode project target. No CocoaPods / SPM change needed — they're first-party app source files.

---

## 6. Server / Edge Function changes

**None required for v1 sync mechanics.** `sync-health-data` v7 already handles:
- JWT-authenticated calls. ✓
- Idempotent inserts via `native_uuid`. ✓ Background + foreground collisions are no-ops.
- `action: 'pull_samples'` and `action: 'push_daily'` payload shapes. ✓
- Promotion path into `workouts`, `cardio`, `weight_logs` with `source: 'healthkit'` stamping. ✓

**Small additions worth making at session time** — not blockers:
- **Diagnostic field.** Add an optional `origin: 'foreground' | 'background'` string to the `pull_samples` payload and log it on `member_health_connections.last_sync_origin`. Zero business logic change; purely useful for debugging when members ask "why didn't my data sync?"
- **`member-dashboard` response.** Add `health_last_bg_sync_at` alongside existing `health_last_sync_at` so the UI can show separate foreground vs background timestamps on `settings.html`. One column read, no aggregation change.

Both live inside existing EFs — no new EFs, no new tables.

---

## 7. Member-facing UI changes (`vyve-site`)

**Minimal surface.** The feature is successful exactly when the member notices nothing new — their data is just there.

Additions:

1. **`settings.html` — HealthKit block.** Add below the existing Connect / Disconnect controls:
   - "Background sync: on | off" toggle (mirrors plugin state).
   - "Last background update: 14 min ago" / "yesterday at 8:30 am" / "never (you haven't opened VYVE since enabling)".
   - Small info icon tooltip with the latency copy from §1.
2. **`index.html` — stale-data banner.** If `health_last_sync_at` (either path) is older than 48 hours AND the member has background sync enabled, show a one-line hint: *"Health data hasn't synced in a while — this can happen in battery-saver mode. Tap to refresh."* Tap triggers a manual `healthBridge.sync()` call. Banner auto-dismisses on success.
3. **`healthbridge.js` additions.**
   - After `connect()` succeeds, call `VyveHealthBackground.enableBackgroundSync(...)` with the session refresh token + anon key + URL. Silent failure if the plugin isn't present (graceful degrade to foreground-only).
   - After `disconnect()`, call `VyveHealthBackground.disableBackgroundSync()`.
   - New `getBackgroundStatus()` helper that `settings.html` calls for the diagnostic display.

---

## 8. Member UX for failure modes

| Failure | Detection | What the member sees |
|---|---|---|
| **Force-quit from app switcher** | iOS silently stops delivering. No server-side detection — the sync just stops. | The 48h stale banner on `index.html` eventually catches it. Settings shows "Last background update: 3 days ago" in amber. Next manual app open re-arms observer (automatic). |
| **Low Power Mode** | `ProcessInfo.processInfo.isLowPowerModeEnabled` is readable from the plugin but only while the app is running. Server-side undetectable. | Same 48h banner. Plugin logs "LPM on" in its rolling diagnostic for support triage. |
| **Revoked HealthKit permissions** | Next foreground `Health.checkAuthorization` returns `readDenied: [...]` | Settings page shows amber "HealthKit permissions revoked — reconnect" with one-tap re-auth. Same pattern v1 uses. |
| **Expired refresh token** | Background plugin tries to refresh, gets 401 from Supabase auth. | Plugin wipes Keychain, sets a flag. On next app open, `healthbridge.js` reads the flag, shows settings-page nudge: "Background sync was paused because you were signed out — reconnect." |
| **iOS simply didn't wake us** | Nothing to detect; iOS doesn't tell us what it skipped. | 48h banner + on-open foreground sync safety net. |
| **Device locked since last boot** | Observer fires but HealthKit read throws. | Catch and defer. Next successful read completes the sync. Usually invisible. |

The common thread: we never surface background-sync failures as errors to a member who isn't actively looking. Errors live in the settings diagnostic; banners only trigger on the 48h stale floor (well past the 15-min typical latency).

---

## 9. App Store review preparation

Apple reviews for HealthKit background delivery are stricter than standard. Anticipated review points:

1. **Why background.** Reviewers ask "why can't you just sync when the user opens the app?" Our answer must appear in App Store Review Notes before submission: *"Members use VYVE to track daily progress across workouts, sleep, and movement, with auto-populated habit completions. Many do their workouts via Apple Watch and may not open VYVE on active days. Background delivery ensures their dashboard is accurate and their progress is tracked automatically, which is core to the preventative-wellbeing value proposition."*
2. **Purpose strings match behaviour.** If we ask for `workouts` read, we should actually read workouts. We do. No change from v1.
3. **Entitlement justification.** Enable `com.apple.developer.healthkit.background-delivery` in App Store Connect → App → Capabilities before first build-with-entitlement submission. Apple auto-approves for most wellbeing apps but occasionally asks for justification.
4. **Data minimisation.** Reviewers sometimes ask why we need all the data types. Same reasoning as v1 — no change.
5. **Network usage in background.** Reviewers have flagged apps doing large uploads in background as misuse. Our payload is small (≤100 samples typical, 500-cap chunks). Not expected to be an issue.

**Pre-submission checklist** (Lewis + Dean):
- [ ] Privacy policy updated to mention "background health data sync" explicitly (Lewis).
- [ ] App Store Review Notes include the §9.1 justification (Lewis drafts, Dean reviews technical accuracy).
- [ ] TestFlight build with background delivery working end-to-end for at least 7 days on Dean's phone before submitting to review.
- [ ] Screenshots of settings page showing the background sync toggle + last-synced timestamp — reviewers look for this.

---

## 10. Android Health Connect parity (outline only, deferred further)

Health Connect's background model is materially different from HealthKit:

- **No observer queries.** Health Connect doesn't push. You poll.
- **`WorkManager PeriodicWorkRequest`** with a 15-minute minimum interval is the supported pattern.
- **Permissions.** `android.permission.health.READ_EXERCISE` etc. already required for foreground v1.
- **Background Health Connect permission.** `android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND` (Android 14+) — a separate runtime permission beyond the read scopes. Denied by default.
- **Dozing / App Standby Buckets.** Aggressive OEMs (Samsung, Xiaomi) restrict background workers beyond vanilla Android. No workaround; user has to whitelist the app in OEM settings. Document in support material.

Future Android shape if/when we build: one session to scope, one session to build a companion Android plugin mirroring the iOS one (WorkManager registers a periodic worker that calls Capgo's `queryAggregated` / `queryWorkouts` and POSTs to the same EF), one session to device-validate. Blocked on Dean acquiring an Android test device.

Included here only to avoid designing ourselves into an iOS-specific corner. The companion-plugin architecture maps cleanly to Android: same shape, different native backend.

---

## 11. Session breakdown (if/when we unpark)

Claude-assisted build time, not solo-dev equivalent.

| Session | Work | Notes |
|---|---|---|
| **0 (hygiene — may already be done by then)** | Commit current `ios/` folder to `vyve-capacitor` from Dean's Mac. Scrub secrets first. | Prerequisite. Separate from this workstream if still outstanding when we unpark. |
| **1** | Companion plugin scaffolding: create `VyveHealthBackground.swift` + `Core.swift`. Implement `enableBackgroundSync` / `disableBackgroundSync` / `getBackgroundSyncStatus`. Keychain wrapper + Supabase refresh-token call. JS bridge declaration. Unit tests for Keychain round-trip. No HealthKit wiring yet. | Deliverable: plugin compiles, can be called from JS, does nothing yet. |
| **2** | HKObserverQuery + enableBackgroundDelivery wiring. Native HealthKit fetch for the 5 tracked types. Payload serialisation matching `sync-health-data` v7 shape. URLSession POST. Error-path logging to UserDefaults. | Deliverable: manual trigger (dev-only JS call) POSTs real samples to EF and they appear in Supabase. |
| **3** | BGAppRefreshTask registration in AppDelegate + scheduling from the plugin. `member-dashboard` + `sync-health-data` additions (origin field, last_bg_sync_at). `healthbridge.js` wiring (pass refresh token, disable on disconnect, getBackgroundStatus). | Deliverable: full wake-to-sync path works for observer + BGRefresh both. |
| **4** | `settings.html` background sync block + diagnostic. `index.html` 48h stale banner. Failure-mode UX (revoked perms, expired refresh token flag). | Deliverable: member-facing UI complete. Feature-flag gated. |
| **5 (device validation — real calendar time)** | 7-day soak on Dean's iPhone 15 Pro Max. Workouts on Watch on days VYVE isn't opened. Measure wake latency distribution. Low Power Mode test. Force-quit test. Locked-device test. Write up observed latency for the App Store Review Notes. | Deliverable: empirical latency table + submission-ready evidence. Can't be collapsed. |
| **6 (submission)** | App Store Review Notes draft (Dean writes, Lewis edits). Privacy policy update (Lewis). Submit. Respond to review. | Deliverable: shipped. |

**Total ≈ 4–5 build sessions + 1 week real-time device validation + 1 submission/review cycle.** Realistic calendar 2–3 weeks from start to App Store approval.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| **Apple rejects the entitlement request or asks for changes** | Most wellbeing apps approved. If rejected, fall back to BGAppRefreshTask-only path (daily sync, no observer). Still better than v1. |
| **Latency worse than promised** (observer skips for days) | BGAppRefreshTask floor. 48h stale banner nudges member to open. Settings diagnostic shows real numbers. |
| **Refresh token lifecycle issues** (Supabase rotates aggressively, plugin gets stuck on expired token) | Wipe-and-reconnect path in §8. Foreground sync refreshes the stored token on every run, so any member opening the app weekly resets the clock. |
| **iOS plugin + Capgo collision** (both accessing HKHealthStore) | HKHealthStore is thread-safe and reference-counted by iOS. No practical conflict. The observer uses a separate HKHealthStore instance in our plugin. |
| **Battery impact complaints** | Observer with `.immediate` frequency is documented as low-overhead. BGAppRefreshTask is ~30s once/day. Should be well below noise. If members complain, swap observer `.immediate` → `.hourly`. |
| **iOS folder never committed, future planning stays local-only** | Address via Session 0 hygiene item. |
| **Upstream Capgo ships background delivery while we're mid-build** | Unlikely on our timeline. If it happens, our companion plugin still works; we can migrate later without changing the EF or UI. No regret. |

---

## 13. Open decisions (to resolve when unparked)

1. **iOS folder hygiene timing** (Dean). Session 0 before unpark, as part of Session 1 kickoff, or as a standalone cleanup session?
2. **Refresh-token architecture sign-off** (Dean). Keychain-stored refresh token + Supabase refresh call is the idiomatic mobile pattern. Alternative — a dedicated `issue-bg-sync-token` EF minting long-lived member-scoped tokens — is more complex and less Supabase-idiomatic. Plan assumes Keychain.
3. **Observer data-type selection** (Dean). Plan picks `workouts`, `steps`, `distance`, `activeEnergyBurned`, `bodyMass` — the five driving autotick rules today. Sleep and heart rate excluded for battery. Revisit at unpark time in case autotick rules have grown.
4. **Latency copy for `settings.html`** (Lewis). Draft in §1.
5. **Privacy-policy update** (Lewis). Mentions background HealthKit data sync explicitly. Drafted in Session 6.
6. **Android timeline** (Dean + Lewis). Acquire a Pixel before unparking iOS, or wait?

---

## 14. Out of scope / non-goals

- Real-time (sub-minute) sync. iOS doesn't offer this contract for HealthKit.
- Writing data back to HealthKit from background. Write path stays foreground (v1), keeps the "member explicitly pressed save" property.
- Heart rate / sleep in the observer set (future increment).
- `HKAnchoredObjectQuery` optimisation (future perf tweak; current 24h window is fine given EF idempotency).
- Silent push as an alternative wake mechanism (no server-side signal to trigger it).
- Android Health Connect (see §10).
- Background sync for non-HealthKit sources (Strava direct, Garmin direct) — separate product decision.
- A custom-built "VYVE for Apple Watch" companion watchOS app.
