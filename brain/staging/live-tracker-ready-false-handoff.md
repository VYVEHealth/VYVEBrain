# PM-328+ — Live tracker `ready:false` full-diagnosis handoff

**Paste this prompt into a fresh session after "Load VYVE brain".**

---

Last session shipped 4 patches trying to fix `ready: false` on the live tracker (PM-315 / PM-320 / PM-323 / PM-326 / PM-327). Each one diagnosed something real but `onReady` still never fires in the Capacitor WKWebView. I'm planning to ship the iOS + Android bundle tomorrow with this feature wanted-but-not-blocking; I'd rather have it working but I'm done patching in the dark.

Read the PM-327 changelog entry (top of `brain/changelog.md`) for the full picture before responding. The short version: YT IFrame API loads, `window.YT.Player()` constructs without throwing, the video plays in the iframe, but `onReady` / `onStateChange` / `onError` callbacks are silent and zero rows have ever landed in `session_live_views`.

I want a **full diagnosis pass**, not another patch. The on-page debug strip is exhausted — we need to see what's actually happening at the WKWebView ↔ YouTube boundary. Specifically:

1. Read `player-tracker.js`, `session-live.js`, and all 8 `*-live.html` shells at current main HEAD. Walk the data flow from `state === 'LIVE'` resolving in the picker, through `syncPlayerTracker` calling `T.init(...)`, through `loadYTApi() → new YT.Player()`, all the way to where `onReady` is supposed to fire. Map every assumption that could be wrong.

2. Look at `capacitor.config.json` in `~/Projects/vyve-capacitor` (not a git repo, on my Mac — give me the exact paths to inspect) and identify any WKWebView config that could be blocking cross-frame postMessage from `youtube.com` to the app origin. Candidates flagged in the PM-327 entry: `server.url`, `iosScheme`, `limitsNavigationsToAppBoundDomains`, content blockers, App Transport Security exceptions.

3. Tell me how to attach Safari Web Inspector to the Capacitor WKWebView running on my physical iPhone so I can see the actual console, network panel, and run live JS against the page. I've never done this before in this project. Walk me through it.

4. Once I have devtools attached, give me the specific diagnostic commands to run:
   - Confirm `window.location.origin` value
   - Confirm the YT iframe element is in the DOM and inspect its `contentWindow`
   - Listen for postMessage events: `window.addEventListener('message', e => console.log('MSG', e.origin, e.data))` — does anything land?
   - Inspect `session.player` object structure and try calling methods directly (`getPlayerState()`, `getDuration()`)
   - Force-call `session.player.addEventListener('onReady', () => console.log('LATE READY'))` post-construction

5. Once we know what's broken, **before any patch, talk me through the options.** This is not a one-shot fix problem. Options on the table I want considered:
   - Fix the postMessage handshake at the Capacitor config level
   - Switch attribution to a different mechanism (Visibility API + interval, no IFrame API needed)
   - Server-side attribution from YouTube Live concurrent viewers API (separate worker watching the broadcast)
   - Accept the manual "Mark as complete" CTA in the state machine as the only attribution and remove the IFrame API path entirely

The trial cohort soft-launch is 15-20 people. If watch-time attribution costs another 2-3 sessions of work, the manual CTA may be the right call for the trial and the IFrame API path becomes a v2 deferred item. Tell me what you think.

**Constraints:**
- No more patches without devtools attached. If we can't get Safari Web Inspector working against the device, the answer is "ship without auto-attribution for trial, use manual CTA."
- The bundle ships TOMORROW (today, depending on when you read this). If the fix isn't 30 minutes of work after diagnosis, defer.
- The 5 patches from tonight (PM-315/320/323/326/327) are all kept in place — none get reverted as part of this diagnosis. The bug is upstream of them.

Look at the brain changelog PM-327 entry now. Then tell me your diagnostic plan before touching any code.

