# Hot-path audit — auth.js + bus.js + vyve-home-state.js + vyve-offline.js + theme.js + perf.js

**Drafted:** 12 May 2026, ~11:00 UTC (Dean away-from-Mac session continuation).
**Author:** Claude.
**Source refs:** All six files read live at vyve-site HEAD `6225d504` (PM-65 baseline).
**Purpose:** Audit the six scripts that run on every inner-page load to identify module-init cost. The 8 May full-platform audit was breadth-first and explicitly deferred deep auth.js inspection to "Layer 5 data tells us where it hurts." This audit doesn't wait — Dean's standing instruction is "as close to perfect as possible," so the hot path gets a deep static read now and Layer 5 confirms rather than discovers.

---

## TL;DR — what runs on every page load

| File | Size | Lines | Top-level work |
|---|---|---|---|
| auth.js | 49,364 B | 1,016 | PostHog init + Supabase config + 17-bridge config object + DOMContentLoaded hook |
| bus.js | 31,305 B | 696 | Single IIFE; defines bus + 11 Realtime channels (subscribe on auth-ready) |
| vyve-offline.js | 33,258 B | 727 | Single IIFE; defines VYVEData + outbox flush registered on 30s interval |
| vyve-home-state.js | 8,799 B | 201 | Single IIFE; defines window.VYVEHome helpers; no top-level side effects |
| perf.js | 8,605 B | 230 | Gated IIFE — exits early if `vyve_perf_enabled` flag off (production default) |
| theme.js | 5,439 B | 127 | IIFE applies `data-theme` synchronously (justified blocker); 1-hour throttled Supabase sync at +200ms |
| **TOTAL** | **136,770 B** | **2,997** | All run on every inner page |

After gzip ~40-45KB over the wire. After parse, ~3,000 lines of JS runs synchronously during the critical paint path on every page.

---

## Findings, ranked by impact

### F1. PostHog snippet is render-blocking on EVERY page (HIGH priority)

**auth.js L7-11.**

```javascript
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,...}(document,window.posthog||[]);
posthog.init('phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl', {
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30'
});
```

The PostHog snippet is the standard injection pattern. It:
1. Injects a `<script async>` for `eu-assets.i.posthog.com/static/array.js` (~30-50KB).
2. Stubs every `posthog.*` method so queued events are buffered until the real lib loads.
3. The `.init()` call queues a configuration event with the project key.

**Cost:**
- The snippet itself blocks parser execution for ~2-5ms (small but non-zero).
- The async-loaded `array.js` fetches feature flags (`/decide/` endpoint round-trip) and starts autocapture/session-recording.
- Every page-view event triggers an outbound POST to `eu.i.posthog.com/e/`.
- No `preconnect` or `dns-prefetch` directive for `eu-assets.i.posthog.com` or `eu.i.posthog.com` in any inner page (verified against 8 May audit headers section).

**This is a third-party render-blocking script with no preconnect.** Worst combination for premium-feel cold load. The memory says PostHog identity wiring is "pending" — meaning identification calls aren't even firing the user-tagging path the autocapture is designed for. We're paying full PostHog cost for partial PostHog value.

**Three options, ranked:**

1. **Defer PostHog init entirely until idle.** Move the entire L7-11 block inside `requestIdleCallback` or after `vyveAuthReady`. Trade-off: page-view events for the first 200-500ms get dropped (autocapture won't fire because window.posthog isn't installed yet). Acceptable for premium-feel; the first-page-view loss is per-session, not per-page.
2. **Add preconnect.** Add `<link rel="preconnect" href="https://eu-assets.i.posthog.com">` and `<link rel="dns-prefetch" href="https://eu.i.posthog.com">` to every inner page's head. Reduces TCP/TLS round-trip cost. Small win compared to defer.
3. **Defer + preconnect (combined).** Both wins. Adds 1 line per page (preconnect) + relocates 5 lines in auth.js (defer init).

**Recommendation:** combined option. Defer the init, also add preconnect so the async snippet load is fast when it does fire.

### F2. `vyveSignalAuthReady()` registers 17 Realtime bridges → 11 WebSocket channels on EVERY page (HIGH priority)

**auth.js L33-446 (414 lines).** Called once per page when auth resolves.

The function does five things on every page:
1. Resolve the `VYVE_AUTH_READY` promise.
2. Dispatch the `vyveAuthReady` CustomEvent.
3. Call `vyvePrefetchAfterAuth()` — fan-out 4 helpers (verified optimal at PM-18).
4. **Call `VYVEBus.installTableBridges(supabase, [...17 entries])`.** This is the heavy one.
5. Register signed-out and re-auth handlers.

`installTableBridges()` groups 17 bridge entries by table and opens **11 distinct Realtime channels** (verified by `Object.keys(byTable)` reading of the 17 entries):

| Channel | Bridges | When the page actually needs it |
|---|---|---|
| `vyve_bridge_daily_habits` | INSERT → habit:logged | index, habits, engagement |
| `vyve_bridge_workouts` | INSERT → workout:logged | index, workouts, engagement |
| `vyve_bridge_cardio` | INSERT → cardio:logged | index, cardio, engagement |
| `vyve_bridge_exercise_logs` | INSERT → set:logged | workouts-session, workouts |
| `vyve_bridge_nutrition_logs` | INSERT + DELETE → food:logged/food:deleted | log-food, nutrition |
| `vyve_bridge_weight_logs` | INSERT + UPDATE → weight:logged | nutrition |
| `vyve_bridge_wellbeing_checkins` | INSERT + UPDATE → wellbeing:logged | index, wellbeing-checkin, engagement |
| `vyve_bridge_monthly_checkins` | INSERT + UPDATE → monthly_checkin:submitted | monthly-checkin, index |
| `vyve_bridge_session_views` | INSERT → session:viewed | sessions, index |
| `vyve_bridge_replay_views` | INSERT → session:viewed | sessions |
| `vyve_bridge_certificates` | INSERT → certificate:earned | certificates, index |

**Cost:**
- Each channel `subscribe()` triggers a Realtime handshake over the shared WebSocket (one TCP/TLS connection shared, but each channel sends a `phx_join` message and awaits ack).
- Each handshake is ~5-50ms of network round-trip plus Supabase's auth check per subscription.
- **For a page that only cares about 1-2 channels, the other 9-10 are pure overhead.**
- The 414-line bridge config object is parsed on every page load even when most bridges won't be used.

**Three options, ranked:**

1. **Per-page bridge registration.** Each inner page declares which channels it needs (via a `<meta>` tag or window variable), and `installTableBridges()` only registers those. Trade-off: pages that haven't been updated lose Realtime echo for tables they query — but they could fall back to the bus.js local-publish path which is what they used before PM-46. Big architectural win for premium-feel cold load: certificates.html opens 1 channel instead of 11.
2. **Lazy bridge registration.** Move `installTableBridges()` into `requestIdleCallback` after first paint. Trade-off: ~500-1000ms window where a Realtime echo from another device wouldn't fan out. Acceptable for an app where most writes are local-only.
3. **Bridge entries to external JSON.** Move the 414-line config object to `bridges.json` loaded async after first paint. Reduces parse time on critical path. Modest win compared to options 1 or 2.

**Recommendation:** option 2 (lazy registration) for v1 — minimal architecture change, biggest cold-load win. Option 1 (per-page) is the right long-term answer but needs the meta-tag pattern designed and rolled across 14 pages.

### F3. theme.js Supabase sync polls every 200ms for auth (LOW priority)

**theme.js L84.**

```javascript
setTimeout(trySyncFromSupabase, 200);
```

`trySyncFromSupabase()` polls every 200ms (re-armed via `setTimeout`) until `window.vyveCurrentUser` is populated, up to 30 attempts (6s timeout). Per page, this typically fires 1-5 times before auth lands.

**Cost:** negligible — each poll is a property check, not a network call. The actual fetch is then 1-hour throttled (`vyve_theme_synced_at` stamp at L60-62), so the cross-device theme sync only hits the network once per hour per device.

**Fix:** replace the poll with an event listener on `vyveAuthReady`. ~5 lines. Saves 1-5 microtask scheduling per page. Trivial win, but it's the right pattern.

```javascript
// Instead of polling, listen for the event
window.addEventListener('vyveAuthReady', function(e) {
  if (e.detail && e.detail.user && e.detail.user.email) trySyncFromSupabase();
}, { once: true });
// Plus a fallback for pages where auth is already resolved before theme.js runs:
if (window.vyveCurrentUser && window.vyveCurrentUser.email) trySyncFromSupabase();
```

### F4. vyve-offline.js outbox flush on 30s interval (MEDIUM priority — but probably correct as-is)

**vyve-offline.js L52.** `FLUSH_INTERVAL_MS = 30000` — a 30s setInterval is registered to flush queued writes.

**Cost:** one `localStorage.getItem('vyve_outbox_<email>')` every 30s, plus network flush if outbox is non-empty. localStorage read is sub-millisecond; flush is bounded by outbox depth.

**The cost isn't the interval itself — it's that the interval runs forever on every page.** Even if the user opens habits.html and never logs anything offline, the interval keeps firing.

**Three options:**
1. **Only register the interval if outbox is non-empty.** Check at boot; register interval only if there are queued rows. Re-register when a queued row is added.
2. **Move flush to `visibilitychange`.** Flush when the page becomes visible (re-foregrounded) and on `online` event. Drop the interval entirely.
3. **Leave as-is.** 30s setInterval is genuinely cheap.

**Recommendation:** option 3 (leave alone) UNLESS Layer 5 numbers show INP regressions on the 30s mark. The cost is real but tiny; the bigger fish are F1 and F2.

### F5. auth.js DOMContentLoaded init starts the Supabase SDK load (HIGH priority — but already optimal)

**auth.js L899.** `document.addEventListener('DOMContentLoaded', vyveInitAuth);`

`vyveInitAuth()` dynamically injects the Supabase SDK `<script>` tag at L454 (per existing brain notes). This is **the right pattern** — the `<link rel="preload">` for `supabase.min.js` in every inner page's head allows the browser to pre-warm the network without blocking parse, and `vyveInitAuth` then promotes the preloaded resource to an executable script after DOMContentLoaded.

No action needed here. Verified in 8 May audit; reverified here.

### F6. PortraitLock + Monitor IIFEs (LOW priority — already lightweight)

**auth.js L906 `(function vyvePortraitLock()`** and **L944 `(function vyveMonitor()`**.

Both are small (sub-50 lines each) and fire after init. PortraitLock is a screen-orientation hint; Monitor is auth state logging. Negligible cost. No action.

### F7. perf.js is gated correctly (NO ACTION)

**perf.js L29-37.** Exits the IIFE within 5 lines if `?perf=1` not set and `vyve_perf_enabled` localStorage flag not set. In production with the flag off, perf.js parses to a 5-line no-op. This is correct.

---

## Synthesis: total premium-feel cost from this audit

If F1+F2+F3 ship together as a "hot-path defer bundle":

- **F1 (PostHog defer + preconnect):** ~5-15ms saved on cold paint per page, ~30-50KB JS parse moved off critical path.
- **F2 (lazy bridge registration):** ~50-200ms saved on warm paint when auth resolves; 9-10 fewer WebSocket subscriptions on most pages.
- **F3 (theme sync event listener):** ~0-1ms saved per page. Cosmetic but correct.

Plausible aggregate: **first paint 10-30ms faster, time-to-interactive 100-300ms faster** on the average inner page. The bigger win is qualitative — the network panel on a cold load shows 10 fewer subscription messages, the JS parse is shorter, the perceived "settling" of the page is faster.

These wins compound with the staged PM-67a bundle (defer offline.js + vyvePaintDone wiring). PM-67a improves what the perf signal measures; this bundle improves what the perf signal records.

---

## Proposed PM-67c — hot-path defer bundle (4-7 files)

| File | Change | LOC |
|---|---|---|
| auth.js | Move PostHog init from module-load (L7-11) into a `requestIdleCallback`-gated function called after `vyveAuthReady` fires. Snippet stub stays at module-load (so `posthog.*` calls don't throw before init); only `posthog.init(...)` defers. | ~10 |
| auth.js | Move `VYVEBus.installTableBridges(...)` call out of `vyveSignalAuthReady` into a separate `requestIdleCallback`-gated handler that fires after vyveAuthReady. | ~5 |
| theme.js | Replace `setTimeout(trySyncFromSupabase, 200)` polling with `vyveAuthReady` event listener + immediate-call fallback. | ~7 |
| index.html, certificates.html, leaderboard.html, engagement.html, habits.html, workouts.html, nutrition.html, wellbeing-checkin.html, sessions.html, monthly-checkin.html, settings.html, log-food.html, running-plan.html, movement.html, cardio.html | Add `<link rel="preconnect" href="https://eu-assets.i.posthog.com">` and `<link rel="dns-prefetch" href="https://eu.i.posthog.com">` after existing `<head>` preconnects. ~2 lines each, ~15 pages. | +30 lines total |
| sw.js | Cache key bump (any change to head requires sw.js bump per §23). | -2 |

**Estimated win:** F1 + F2 + F3 stacked, per above synthesis.
**Risk:** PostHog autocapture loses the first ~200ms of clicks per session (one-time, not per-page). bridge fan-out delayed by ~200ms on auth-ready (acceptable — Realtime echo is for cross-device, not local).
**Verification path:** Layer 5 captures pre-PM-67c FCP/paint_done as baseline; PM-67c ships; Layer 5 captures post; compare deltas.

---

## What this audit did NOT touch

- **Capacitor cold-launch** (separate audit needed — WKWebView init, localStorage rehydrate, native bridge handshake).
- **Inline body JS extraction** (the 41-56KB inline blocks in 8 pages — deferred to post-Layer-5 prioritisation per audit playbook).
- **Inline head CSS extraction** (same).
- **Image weight on top-of-page critical path** (the 1MB of thumb-*.jpg files).
- **Font loading** (Playfair Display + DM Sans + Inter).
- **Service worker caching strategy review** (sw.js is small but its cache strategy matters per surface).

These are next on the audit queue if Dean wants them before 20:00.

---

## §23 hard rule candidate proposed (FIFTH, building on Appendix C's four)

> **Hard rule (PM-67c): Render-critical hot-path files (auth.js, bus.js, theme.js, vyve-offline.js, vyve-home-state.js) defer all network-touching and third-party-loading work until `vyveAuthReady` or `requestIdleCallback`.** Module-load synchronous work in these files is limited to: pure JS definitions, in-memory state initialization, localStorage reads (synchronous and bounded), `data-theme` setting (theme.js exception). Anything that opens a WebSocket, fires a network request, or injects a third-party script is gated on `vyveAuthReady` or `requestIdleCallback`. The cost of every line at module-load in these files is paid on every page-view across every member; the discipline must reflect that.

Pairs with PM-67a (head-script defer default) and PM-20 (defer audits check inline consumers). All three are head/early-execution discipline rules — together they make module-load weight inspectable as a discipline rather than a recurring audit.

---

*End of hot-path audit. Static evidence only — no production code or DB writes performed. Findings staged for Dean's 20:00 review.*
