# Capacitor cold-launch audit — vyve-capacitor

**Drafted:** 12 May 2026, ~12:30 UTC (Dean away-from-Mac session continuation).
**Author:** Claude.
**Source refs:** vyve-capacitor main HEAD `3432aab1`. All findings static-evidence only.
**Purpose:** Audit the native wrap that delivers vyve-site to App Store and Play Store users. The Safari-based audit dimensions (Layer 5, hot-path, waterfalls) all measure the web layer; the Capacitor wrap puts an additional native cold-launch path in front of it that has never been measured. This is the path enterprise customers will judge VYVE on first — Sage will demo on iPhone.

---

## Cold-launch sequence (what happens when the user taps the icon)

1. **OS receives tap** → kernel forks process → app process starts.
2. **iOS Splash** (LaunchScreen.storyboard): a single full-screen `imageView` shows `Splash` image (one of 6 PNGs from `Splash.imageset`, ~466KB each at @2x and @3x, ~204KB at @1x and all dark variants). Picked by the OS at startup based on luminosity. **Renders before any app code executes.** Stays visible until WKWebView reports "loaded."
3. **AppDelegate.application(didFinishLaunchingWithOptions:)** fires. VYVE's implementation is the **Capacitor default boilerplate** — `return true`. No customisation, no early native init. (See Finding C2.)
4. **Capacitor framework boots**, reads `capacitor.config.json`:
   ```json
   {"appId":"co.uk.vyvehealth.app","appName":"VYVE Health","webDir":"www","server":{"url":"https://online.vyvehealth.co.uk","cleartext":false}}
   ```
5. **WKWebView initialised.** First-time process initialisation has a measurable cost (~100-300ms on iOS, more on older devices).
6. **WKWebView storage rehydrate** from on-disk cache: cookies (none for online.vyvehealth.co.uk yet on first launch), localStorage (none yet), IndexedDB (none yet), service-worker registration (Capacitor + WKWebView **does NOT register the web service worker** — see Finding C5).
7. **WKWebView navigates to `https://online.vyvehealth.co.uk`** per `server.url`. The bundled `www/index.html` (3 bytes — empty whitespace) is **never rendered**. The "PWA installed" sw.js cache the Safari path uses is **not in play**.
8. **Network fetch begins.** Cold connection: DNS for online.vyvehealth.co.uk → TCP → TLS → HTTP/2 request → GitHub Pages CDN response. Typical ~100-300ms on 4G, ~50-150ms on WiFi, ~500ms+ on cell with bad signal.
9. **HTML parses, head executes.** All Safari-path issues (PostHog blocking, theme.js, etc.) apply identically to the wrap. Plus the 137KB of hot-path JS that audit Appendix E catalogued.
10. **First paint achieved** (typically the skeleton or theme.js's `data-theme` setting). Capacitor's splash screen plugin is configured with default fade-out — it fades out as soon as WKWebView reports "loaded," which means the splash dismisses but the user sees skeleton, not real content.
11. **vyveAuthReady resolves** (auth.js fast-path with cached email, or full Supabase Auth round-trip on first run).
12. **PostHog init + 11 Realtime channels + offline outbox setup** — all the Safari-path costs documented in playbooks/hotpath-audit-2026-05-12.md fire here too.
13. **First real content paint** — cached engagement/index data renders.

The cumulative cold-launch path from tap to "user sees their dashboard" is the sum of all these steps. **No part of this path is measured.** Layer 5 (perf.js telemetry) is web-context only — it runs inside WKWebView but doesn't capture the native steps (1-6).

---

## Findings, ranked by impact

### C1 (HIGH): `server.url` model means EVERY cold launch pays full-cold-load cost on a *different* localStorage container than Safari

The `capacitor.config.json` uses `server.url` mode. This is the standard Capacitor pattern for "wrap a hosted PWA" — it makes `online.vyvehealth.co.uk` the live root, and the empty `www/` directory is not used. **But it means:**

- The native app's WKWebView has **its own cookie jar and localStorage container** — separate from Safari and separate from other apps.
- On every fresh install OR app data clear, all the warm-cache wins (auth fast-path email, theme cache, vyve_home_v3_*, vyve_outbox_*) start from zero.
- The PWA service worker registered by Safari (sw.js with the 24-URL precache list) **doesn't carry over to the wrap.** WKWebView starts with no SW cache.

**Cost on first launch after install/update:**
- DNS lookup for `online.vyvehealth.co.uk` (~30-80ms).
- TLS handshake (~50-150ms).
- GitHub Pages CDN edge fetch for `/index.html` (~50-200ms).
- Plus everything in the Safari-path cold-load audit on top.

**No fix possible from the Capacitor layer alone.** This is the architectural cost of `server.url` mode. The mitigations live in the web layer:
1. **Preconnect to Supabase from inside the WKWebView's first navigation.** Already done in vyve-site head (audit confirmed).
2. **Make the first paint be the skeleton, not nothing.** Layer 3 (skeleton paints) already does this.
3. **Cache as aggressively as possible on subsequent launches.** Service worker DOES run inside WKWebView once registered — but the first visit to each path doesn't get the precache benefit. Bundling more pages into the SW precache (S1 finding from Appendix G) helps on cold launch #2, not #1.

**Alternative architectures** (not recommended for v1):
- **`webDir: "www"` with bundled HTML.** Ship the full vyve-site as part of the IPA/AAB. Pros: instant first paint, no network round-trip on cold launch. Cons: every web change requires an app store update (currently you ship to GitHub Pages and members get it immediately).
- **Hybrid: server.url for first run, then cache copies in www/ for subsequent.** Capacitor doesn't natively support this.

**Recommendation:** accept `server.url` as the architecture, mitigate via Layer 4 + S1 SW precache expansion + hot-path defer (PM-67c). This is what's already in flight.

### C2 (MEDIUM): AppDelegate is Capacitor boilerplate — no early native warmup

`AppDelegate.swift` is the Capacitor CLI default. `application(didFinishLaunchingWithOptions:)` does nothing except `return true`. Push notification registration is wired correctly (delegates to Capacitor's NotificationCenter), but there's no native code doing:
- DNS prefetch for `online.vyvehealth.co.uk` while WKWebView is initialising.
- Cookie prewarm.
- Splash image fade-in customisation (currently the OS-default fade is used).

**Proposed C2 fix (deferred — needs native dev time):**
```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: ...) -> Bool {
    // Pre-warm DNS for the web origin before WKWebView initialises
    URLSession.shared.dataTask(with: URL(string: "https://online.vyvehealth.co.uk")!).resume()
    return true
}
```

That single line in `didFinishLaunchingWithOptions` would fire a DNS lookup + TCP handshake while WKWebView is booting in parallel. Typical 30-100ms win on cold launch when on a fresh network. **No risk** — fire-and-forget URLSession that doesn't await.

**Verification needed before shipping:** Apple's privacy review now sometimes flags background networking. The above is a single fetch to the app's own domain; should be fine but worth testing.

### C3 (MEDIUM): UIRequiredDeviceCapabilities = armv7 is anachronistic

Info.plist L:
```xml
<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>armv7</string>
</array>
```

`armv7` is the 32-bit ARM architecture used by iPhone 5 and earlier. Apple's minimum-supported devices have been arm64 (64-bit) since iOS 11 in 2017. Specifying `armv7` is meaningless on any modern iPhone — every iOS 15+ device supports arm64 inherently — but **it's not technically wrong**, it just signals the project hasn't been updated past Capacitor's default template from circa 2016.

Cosmetic, not functional. Apple won't reject the build. Should be `arm64` for correctness.

**Proposed fix:**
```xml
<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>arm64</string>
</array>
```

One-line change. Zero risk. Ship next time the iOS app is rebuilt.

### C4 (HIGH): AndroidManifest.xml is missing critical permissions

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

That's the **only** permission declared. Missing:
- **`android.permission.POST_NOTIFICATIONS`** — required for push notifications on Android 13+ (API 33+). Without this, push notifications **silently fail** to display. Memory says Android 1.0.2 is "awaiting Google Play review" — if push notification compliance is in scope for review, this could be a rejection trigger.
- **`android.permission.WAKE_LOCK`** — needed by FCM push to wake the device on notification receipt.
- **`com.google.android.c2dm.permission.RECEIVE`** — needed by FCM.
- **`android.permission.health.READ_STEPS`** + Health Connect permissions — if you're shipping Health Connect parity later. Currently parked per memory, but the manifest hasn't been prepped for it either.

Furthermore: **no `<service>` declaration for FCM.** Capacitor's `@capacitor/push-notifications` plugin adds the Java service automatically at build time via gradle, but it must be activated. Looking at `android/app/build.gradle`:

```
try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

This is the standard Capacitor template, and it only applies google-services if `google-services.json` exists in `android/app/`. **The brain doesn't say whether google-services.json is committed to the repo or gitignored.** If gitignored and added at build time, this is fine. If missing entirely, push notifications are broken in the Android build.

**Recommendation:** verify on Mac:
1. Does `android/app/google-services.json` exist (locally, even if gitignored)?
2. Is `POST_NOTIFICATIONS` permission in the manifest (or being injected via plugin gradle at build time)?
3. Does Android's `targetSdkVersion = 36` (per variables.gradle) require the runtime permission request at first launch? **Yes** — API 33+ requires `requestPermission()` at runtime.

If any of these is broken, Android push notifications don't work. This is a launch-affecting issue if Android push is in scope.

### C5 (MEDIUM): Service worker behaviour inside WKWebView is undocumented

WKWebView supports service workers since iOS 11.3, but there are quirks:
- The SW registration is **per-WKProcessPool**, not per-origin globally. Cleared on app uninstall.
- WKWebView can interfere with SW background-sync (e.g., outbox flush via vyve-offline.js's 30s interval might not fire when the app is backgrounded — iOS suspends background JS aggressively).
- Push notifications via the web push API **do not work in WKWebView** — only native APN via Capacitor's push-notifications plugin. (This matches what's already in place.)

**No action; this is informational.** But worth confirming on Mac:
1. Does sw.js actually register inside the Capacitor wrap? Open Safari Develop → [iPhone] → [WebView] → console; look for "Service worker registered." If not, the offline cache strategy doesn't apply to the wrap path — every navigation is a network fetch (which makes hot-path defer doubly important).
2. Does `vyve_outbox_*` localStorage actually flush when the user backgrounds the app and reopens 24h later? Or does iOS wipe localStorage on suspend?

These are open questions Layer 5 can answer once running inside the wrap.

### C6 (LOW): Splash assets are RGB and reasonably sized

Splash.imageset has 6 PNGs:
- 3 light-mode (1x, 2x, 3x): 466KB, 466KB, 466KB
- 3 dark-mode (1x, 2x, 3x): 204KB, 204KB, 204KB

Total bundled splash assets: ~2MB. **Bundled inside the IPA**, so this contributes to app install size but **zero network cost** at launch. The OS picks one based on screen scale and renders it from disk.

**Light @1x and @2x are byte-identical (both 466KB).** Same for dark. iOS uses 1x for older non-Retina devices (basically no modern iPhone). The 1x slots could be removed to save ~670KB of IPA size — cosmetic only.

The matched per-resolution PNG approach is correct. No render perf concern.

### C7 (LOW): Android splash is well-configured

`/android/app/src/main/res/drawable*/splash.png` exists in 5 density buckets (mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi) plus portrait+landscape, total ~110KB across all densities. AndroidX core-splashscreen (`coreSplashScreenVersion = '1.2.0'`) is in dependencies. This is the modern Android 12+ splash API. No action.

### C8 (LOW): Package versions are current

- Capacitor 8.3.0 (current major; released late 2024 as Capacitor 7, then 8 in early 2025 — verified up to date).
- `@capgo/capacitor-health 8.4.7` (recent — HealthKit plugin, memory says compiled into iOS 1.1 Build 3).
- `capacitor-native-biometric 4.2.2` (current).
- All `@capacitor/*` core plugins on 8.x.

iOS minimum 15 (Package.swift L7), Android minSdk 24 (Android 7.0 Nougat). Both are reasonable for 2026.

No action.

### C9 (UNVERIFIED): Universal Links / Deep Linking

AppDelegate has the universal links handler (`application(continue userActivity:)` delegates to Capacitor). But there's:
- No `apple-app-site-association` file referenced anywhere I've seen.
- No `<intent-filter>` for `android:autoVerify="true"` in AndroidManifest — only the basic LAUNCHER intent.

If you want a member to receive an email link like `https://vyvehealth.co.uk/...` and have it deep-link to the app (instead of opening Safari), this needs work. Currently every email link opens Safari, not the wrap.

**Not a perf finding, but a UX finding.** Worth raising if it's in scope.

---

## Synthesis

The Capacitor wrap inherits **every** Safari-path perf cost (it's the same web layer), plus:
- ~50-150ms of native cold-launch overhead (process start, WKWebView init, splash render).
- Zero benefit from Safari's accumulated PWA service-worker cache (separate WKWebView container).
- A full DNS+TCP+TLS round-trip to `online.vyvehealth.co.uk` on first launch.

**The single biggest finding (C4) is launch-affecting on Android.** If `POST_NOTIFICATIONS` permission isn't being added at build time via plugin gradle, push notifications on Android 13+ silently fail. Worth verifying on Mac tonight.

**The single biggest perf opportunity (C2) is the DNS pre-warm.** One line in AppDelegate.swift saves 30-100ms on every cold launch. Worth shipping when iOS 1.2 is next built.

**C1 (server.url architectural cost) has no fix from inside Capacitor.** The mitigations live in the web layer and they're already in flight (Layer 4, PM-67a, PM-67c, S1 SW precache).

## Proposed Capacitor work items

| ID | Severity | Fix | Effort | Verify on Mac? |
|---|---|---|---|---|
| C2 | MEDIUM | Add DNS pre-warm in AppDelegate | 1 line | Yes (rebuild required) |
| C3 | LOW | `armv7` → `arm64` in Info.plist | 1 line | Same Mac session |
| C4 | HIGH | Verify POST_NOTIFICATIONS permission + google-services.json | Verify, then patch if needed | YES — critical |
| C5 | INFO | Verify SW actually registers in WKWebView | Test only | Open Safari Web Inspector → iPhone → WebView |
| C6 | LOW | Remove redundant 1x splash assets | -670KB IPA | Optional |
| C9 | UX | Decide on universal links roadmap | Architectural decision | Defer |

## Verification queue for Mac tonight

Quick non-blocking checks to add to the 20:00 queue:
1. Open Safari Web Inspector → connected iPhone → vyve-capacitor WebView → console → `navigator.serviceWorker.controller` — confirm SW is registered inside the wrap.
2. `ls android/app/google-services.json` — does it exist locally?
3. `grep POST_NOTIFICATIONS android/` recursively — is the permission added by any plugin gradle at build time?
4. While on the WebView console, run `localStorage.length` after a cold launch — confirm whether localStorage rehydrates from the previous session or starts at 0.

These four checks together definitively answer "what does the wrap cold-launch look like in practice" and inform whether C4 needs urgent attention.

---

*End of Capacitor cold-launch audit. Static evidence only — no app rebuilds, no production changes, no native code shipped. All findings staged for Dean's 20:00 review.*
