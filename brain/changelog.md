## PM-557 session close — bundled iOS 1.5 + Android 1.0.6 submitted; portal removals (2026-06-07)

### Portal (vyve-site)
- **PM-555** `9dc40fb0` vbb 442 — nutrition.html: food log coming-soon removed. connect.html: this week's challenge section removed.
- **PM-556** `a2c8501d` vbb 443 — session-live.css: `.sl-pill-live` + `.sl-cta-primary.sl-cta-live` switched red→green (#22c55e).

### Native apps
- **iOS 1.5 Build 1** — bundled mode (server.url removed from capacitor.config.json). Fresh vyve-site clone into www via PAT. Archived + exported via xcodebuild CLI. Uploaded via Xcode Organizer. In review.
- **Android 1.0.6 versionCode 51** — fresh vyve-site clone into www. Built via `./gradlew bundleRelease` with Java 21 (temurin@21). AAB at `android/app/build/outputs/bundle/release/app-release.aab`. Submitted to Play Console. Quick checks running → Send for review pending.

### Key state
- All members still on server.url live web shell until 1.5 approved + installed by members
- Capawesome: app `f9961f66`, prod channel `89e12796` — ready for first OTA
- www folder workflow: `git clone --depth 1 https://VYVEHealth:<PAT>@github.com/VYVEHealth/vyve-site.git www` before every bundle build
- Java 21 (temurin@21) required for Android CLI builds; `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` before gradlew
- App Store Connect API key setup pending next session (saves Organizer step forever)
- GITHUB_PAT_CLAUDE expires 20 June 2026 — rotate urgently

### §23 rules
- §23.94 (NEW): Every Android CLI bundle build requires `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` before `./gradlew bundleRelease`. Java 21 = temurin@21 installed via brew. Java 17/26 both fail.
- §23.95 (NEW): www folder is NOT auto-synced from GitHub. Before every bundle build: `rm -rf www && git clone --depth 1 https://VYVEHealth:<GITHUB_PAT_CLAUDE>@github.com/VYVEHealth/vyve-site.git www` (PAT from Supabase Vault). Never assume www is current.

## PM-554 session close — PF-23 v1 stabilised + per-page tours shipped (2026-06-07)

### Final state
- **firstrun.js** reverted to last working version (e2be18d4) + VYVE logo on slides only. No other changes.
- **Per-page independent tours** live on index, mind, exercise, connect, wellbeing-checkin, monthly-checkin.
- **achievements.js** — toasts suppressed during home tour; retry 3s after `vyve_seen_home` set.
- **settings.html** — Reset tour clears all 8 localStorage keys + writes `tour_completed_at: null` to server + Dexie + navigates to index.html.
- **10s auto-release safety timer** on `lockBody()` — page can never be permanently frozen.
- **No early lock scripts** — all removed. Body lock is JS-only inside firstrun.js.

### Gates (simple)
- `vyve_firstrun_done` — full tour done, nothing ever shows again
- `vyve_firstrun_slides_done` — intro slides seen
- `vyve_seen_home/mind/body/connect/checkin/monthly` — per-page tour seen

### vyve-site HEAD: commit `a48a417b`, vbb 439

### §23 rules
- §23.97: Achievement toasts must not fire while `vyve_seen_home` is unset. `showNext()` is the single chokepoint.
- §23.98: firstrun.js lockBody() must always have a 10s auto-release timer. Never lock without it.

## PM-554 stabilisation — first-run tour fixed to 4-step home-only (2026-06-07)

Multiple fix commits (fix2–fix8) through session. Root causes resolved:
- **fix5:** `_started` guard + single `vyveAuthReady` trigger prevented double-init race between 1500ms setTimeout and auth event.
- **fix6:** sessions.html was retired (PM-555 redirect) — tour destination corrected to connect-calendar.html.
- **fix8 (final):** Eliminated all cross-page hops entirely. Tour is now 4 steps, all on index.html — mood, focus, habits, rings. No resume cursor, no page navigation, no race conditions. Completes reliably and sets `vyve_firstrun_done` on Done.

**Final state:** intro slides (4) + home spotlight (4 steps). Copy is DRAFT in `COPY` object top of firstrun.js — Lewis edits in place.
**vyve-site commit `a47b5f84`, vbb 431, cache `vyve-cache-v2026-06-07-pm554-fr-homeonly`.**

## PM-554 — PF-23 v1 first-run experience shipped (2026-06-07)

### What shipped
- **`firstrun.js`** — full first-run engine: 4 swipeable intro slides (Part 1) + 7-step in-context spotlight tour (Part 2). Gate: `localStorage.vyve_firstrun_done` short-circuit → Dexie members row `tour_completed_at` check (~800ms cold-boot wait) → run. Resume cursor (`vyve_tour_active` + `vyve_tour_step`) persists across the two page hops (index→mind, mind→sessions). Dismissal (skip or done): sets `vyve_firstrun_done=1`, clears cursor, fires un-awaited `members.update({tour_completed_at})` via member-scoped RLS (§23.31). All copy in a single `COPY` object at top of file — Lewis edits that, never the logic.
- **`firstrun.css`** — scrim + box-shadow cutout overlay + tooltip card + slide dot strip + safe-area insets (§23.58) + web-tells suppression (§23.59). z-index 10000–10002 (above nav 9000).
- **`index.html`, `mind.html`, `sessions.html`** — load `firstrun.css` + `firstrun.js`. Haptics.js confirmed present on all three (§23.44). mind/sessions inert unless tour active.
- **`settings.html`** — vbb-marker bumped to 424.
- **`sw.js`** — CACHE_NAME `vyve-cache-v2026-06-07-pm554-firstrun`; `firstrun.js` + `firstrun.css` added to precache (§23.76).
- **`member-dashboard` EF v78** — adds `tour_completed_at` to member snapshot payload (column already in `members` table via migration this session).
- **DB migration** — `ALTER TABLE members ADD COLUMN IF NOT EXISTS tour_completed_at TIMESTAMPTZ` applied and verified.

### Commit
vyve-site `a5a4cadc` · vbb 424

### Key decisions
- Explanatory v1 only (no per-step achievements, decoupled from Achievements overhaul). Action-tutorial is a later iteration.
- Multi-page in-context spotlight: home→mind→sessions. Viable because snapshot-first paint renders hops <200ms.
- Dismissal writes `tour_completed_at` server-side (reinstall-safe, cross-device) via member-scoped RLS — no EF needed.
- Anchor-ready guard: rAF poll ~1.5s, timeout→container fallback — never spotlights an empty skeleton (§23.36/§23.47).
- `vyve:auth:ready` event also triggers init as an earlier path alongside the 1.5s DOMContentLoaded delay.

### §23 rules confirmed
§23.31 optimistic-first dismissal write · §23.36/§23.47 anchor-ready guard · §23.44 haptics.js dependency · §23.58 safe-area · §23.59 web-tells suppression · §23.76 precache new files · §23.72 vbb-marker both pages.
