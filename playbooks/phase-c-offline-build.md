# VYVE Phase C + Offline Mode — Combined Build Prompt

## Session initialisation

Load the VYVE External Brain before doing anything else:

1. Read from repo `VYVEHealth/VYVEBrain` (main branch) via Composio GitHub:
   - `brain/master.md`
   - `brain/changelog.md`
   - `tasks/backlog.md`
2. Confirm tools available: Composio GitHub (read/write), Supabase read query.
3. Confirm: "Brain loaded: yes. Tools available: yes."

---

## Talk first, then build — Dean's rule

Before writing a single line of code:
- Confirm you've read the brain files
- Summarise your understanding of the current sw.js state, the current portal page structure, and the auth pattern (vyveAuthReady event from auth.js)
- Walk through the build plan for both Phase C and Offline below
- Flag anything you'd do differently
- Wait for green light

---

## Context — what you're working with

**Repo:** `VYVEHealth/vyve-site` — GitHub Pages → `online.vyvehealth.co.uk`
**Auth:** `auth.js` v2.2. All pages gate on the `vyveAuthReady` custom DOM event dispatched by auth.js. Do NOT use the old `waitForAuth()` polling pattern anywhere.
**SW:** `sw.js` current version `vyve-cache-v2026-04-15l`. Cache-first for static assets and HTML pages. No EF call caching currently — this is the root cause of blank screens offline.
**Theme:** `theme.css` loaded on all pages. All new files must use `var(--token)` CSS custom properties, not hardcoded hex values.
**No build process.** GitHub Pages only. No bundler, no Node, no templating engine. Everything is plain HTML/CSS/JS.
**Commits:** Use `GITHUB_COMMIT_MULTIPLE_FILES` for all multi-file changes. One atomic commit per phase. Fetch fresh repo SHA before each separate commit — do not chain commits without re-fetching.
**Cache bump:** After EVERY commit that changes portal files, bump the sw.js cache version letter (e.g. `l` → `m`). Pattern: `vyve-cache-v2026-04-15[letter]`. The sw.js bump goes in the same atomic commit as the portal changes.

---

## Phase C — Session Page Consolidation

### The problem
14 near-identical session pages exist:
`yoga-live.html`, `mindfulness-live.html`, `therapy-live.html`, `workouts-live.html`, `podcast-live.html`, `checkin-live.html`, `education-live.html` (7 live pages)
`yoga-rp.html`, `mindfulness-rp.html`, `therapy-rp.html`, `workouts-rp.html`, `podcast-rp.html`, `checkin-rp.html`, `education-rp.html` (7 replay pages)

Each live page is 409 lines. Only 6 lines differ between any two live pages. Same pattern for replay pages (257 lines, 5 lines different). 5,500+ lines of duplicated code.

### What the diff actually found
**Between live pages — only these 6 lines differ:**
1. `<title>` — session name
2. `<span class="session-name">` — session name
3. `<iframe src="...">` — YouTube video ID (embed URL)
4. `<div class="info-text">` — description paragraph
5. `<a href="[x]-rp.html">` — link to the replay page
6. `const CHAT_SESSION_TYPE = '[x]';` — chat session type string

**Between replay pages — only these 5 lines differ:**
1. `<title>` — session name
2. `<span class="session-name">` — session name
3. `<div class="info-text">` — description paragraph
4. `<a href="[x]-live.html">` — link to the live page
5. `var PLAYLIST_ID = '...';` — YouTube playlist ID

### The approach
The 14 filenames stay exactly as they are — `yoga-live.html` remains `yoga-live.html`. No URL changes. No broken links in sessions.html or anywhere else.

Four new shared files are created:
- `session-live.css` — all shared CSS for live pages (extracted from the `<style>` block)
- `session-rp.css` — all shared CSS for replay pages
- `session-live.js` — builds the full DOM into `#session-app` and runs all live page logic
- `session-rp.js` — builds the full DOM into `#session-app` and runs all replay page logic

Each of the 14 HTML files becomes a ~25-line stub:

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content"/>
  <meta name="theme-color" content="#1B7878"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
  <link rel="manifest" href="/manifest.json"/>
  <link rel="stylesheet" href="/theme.css"/>
  <link rel="stylesheet" href="/session-live.css"/>
  <title>VYVE — [Session Name] (Live)</title>
  <script>
    window.VYVE_SESSION = {
      name: '[Session Name]',
      videoId: '[YouTube Video ID]',
      chatType: '[chat_type]',
      rpLink: '[x]-rp.html',
      description: '[Description text]'
    };
  </script>
</head>
<body>
  <div id="session-app"></div>
  <script src="/auth.js"></script>
  <script src="/theme.js"></script>
  <script src="/nav.js"></script>
  <script src="/session-live.js" defer></script>
</body>
</html>
```

### Config values for each page
Before building, read ALL 14 current pages to extract exact config values. Do not guess or approximate — use the actual values from the live files. The config for each page is:

**Live pages:**
| Page | name | videoId | chatType | rpLink | description |
|------|------|---------|----------|--------|-------------|
| yoga-live.html | Read from file | Read from file | Read from file | Read from file | Read from file |
| mindfulness-live.html | Read from file | Read from file | Read from file | Read from file | Read from file |
| therapy-live.html | Read from file | Read from file | Read from file | Read from file | Read from file |
| workouts-live.html | Read from file | Read from file | Read from file | Read from file | Read from file |
| podcast-live.html | Read from file | Read from file | Read from file | Read from file | Read from file |
| checkin-live.html | Read from file | Read from file | Read from file | Read from file | Read from file |
| education-live.html | Read from file | Read from file | Read from file | Read from file | Read from file |

**Replay pages:**
| Page | name | playlistId | liveLink | description |
|------|------|------------|----------|-------------|
| yoga-rp.html | Read from file | Read from file | Read from file | Read from file |
| [remaining 6] | Read from file | Read from file | Read from file | Read from file |

### session-live.js — requirements
- Reads `window.VYVE_SESSION` at execution time
- Waits for `vyveAuthReady` event from auth.js before building DOM (do NOT build before auth resolves)
- Builds the complete DOM into `#session-app` — this is the full HTML structure currently inside the live page body
- Sets `document.title` from config
- Sets session name in the DOM from config
- Sets iframe src from `videoId`: `https://www.youtube.com/embed/{videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`
- Sets info-text from config
- Sets replay link href from config
- Sets `CHAT_SESSION_TYPE` from config (for the live chat system)
- All existing JS logic (wake lock, chat polling, Supabase chat integration) stays intact — just moved from inline to this file
- Uses `var(--token)` CSS references, not hardcoded hex

### session-rp.js — requirements
- Same pattern as session-live.js
- Reads `window.VYVE_SESSION` for name, playlistId, liveLink, description
- Sets `PLAYLIST_ID` from config
- All existing JS logic (playlist loading, video switching, Supabase integration) stays intact

### session-live.css / session-rp.css — requirements
- Exact copy of the `<style>` block from yoga-live.html / yoga-rp.html respectively
- Replace any hardcoded brand hex values with CSS custom property tokens from theme.css:
  - `#4DAAAA` → `var(--teal-lt)` or `var(--track-habits)` as contextually appropriate
  - `#1B7878` → `var(--teal)`
  - `#7AC8C8` or `#7ab8b8` → `var(--teal-xl)`
  - Any `--muted` reference now resolves correctly (Phase A fixed this)
- Do NOT duplicate any tokens already defined in theme.css

### sw.js update for Phase C
Add all 4 new shared files to `PRECACHE_ASSETS`:
```js
'/session-live.js', '/session-rp.js', '/session-live.css', '/session-rp.css'
```
Also add all 14 session HTML filenames to `PORTAL_PAGES` if not already present.
Bump cache version letter.

### Verification for Phase C
After commit, check:
1. yoga-live.html loads correctly — player, chat, session name all correct
2. mindfulness-live.html loads correctly — different video, different chat type
3. yoga-rp.html loads correctly — playlist, correct live link
4. Both themes (dark + light) render correctly
5. Auth gate still works (unauthenticated users redirected to login)
6. Hard refresh (Cmd+Shift+R) to bypass cached SW

---

## Offline Mode

### Root cause of blank screen on train
The current sw.js caches HTML pages (cache-first) so the HTML loads fine offline. But every portal page then makes POST calls to Supabase Edge Functions (member-dashboard, log-activity, etc.). These calls are not intercepted by the SW and not cached. When offline they fail silently, leaving the page with no data → blank/broken UI.

Additionally, `auth.js` calls `supabase.auth.getUser()` which makes a network request to validate the JWT. If offline, this may fail, causing the auth gate to break.

### What good looks like
A member on a train with no signal opens VYVE. They see:
- Their dashboard with last cached data, a subtle "You're offline — last updated 2 hours ago" banner
- Their habit page with yesterday's habits visible (read-only)
- Their workout programme visible (already cached in workout_plan_cache)
- A clear indicator on write actions ("Tap when back online")
- No blank screens, no infinite spinners, no silent failures

When connection returns: banner disappears, data refreshes automatically in background.

### Layer 1: auth.js offline fix
**Problem:** `auth.js` calls `supabase.auth.getUser()` or similar to validate the session. This network call fails offline.
**Fix:** In `auth.js`, detect `navigator.onLine`. If offline AND a Supabase session exists in localStorage (`sb-ixjfklpckgxrwjlfsaaz-auth-token`), skip the network validation and use the cached session to dispatch `vyveAuthReady`. Do not redirect to login when offline with a valid cached session.
**Rule:** This is the highest-priority offline fix. Blank screens because auth fails offline is the worst user experience.

### Layer 2: offline-manager.js (new shared file)
Create `/offline-manager.js`. This file:
- Is loaded on ALL portal pages (add `<script src="/offline-manager.js"></script>` before closing `</body>`)
- Exports a global `VYVEOffline` object with:
  - `isOffline()` → boolean
  - `showBanner(lastUpdated)` → shows the offline banner with time
  - `hideBanner()` → hides banner when back online
  - `disableWriteActions()` → adds `data-offline-disabled` attribute to all `[data-write-action]` buttons
  - `enableWriteActions()` → removes the attribute
- Automatically:
  - Detects `offline` / `online` events on `window`
  - On `offline`: shows banner, disables write actions
  - On `online`: hides banner, enables write actions, triggers `window.dispatchEvent(new CustomEvent('vyve-back-online'))`
- The offline banner:
  - Fixed position, top of viewport, z-index 10002 (above nav)
  - Teal background (`var(--teal)`), white text
  - Text: "You're offline — showing your last saved data" + last updated time if available
  - Animated slide-in from top
  - Does NOT use theme.css tokens that require the portal theme — it needs to work standalone
- Write action buttons across all pages that need disabling:
  - Add `data-write-action` attribute to: log habit buttons, log workout buttons, log cardio buttons, check-in submit button, log food button, log weight button
  - When `data-offline-disabled` is set: show pointer-events: none, reduced opacity, tooltip "Available when online"
- Add `offline-manager.js` to `PRECACHE_ASSETS` in sw.js

### Layer 3: localStorage data cache per page
For each portal page that calls an Edge Function, implement this pattern:

**Cache key convention:** `vyve_[page]_cache` (e.g. `vyve_habits_cache`, `vyve_nutrition_cache`)
**Cache structure:**
```js
{
  data: { /* the EF response */ },
  ts: Date.now(),        // timestamp for "last updated X ago"
  email: memberEmail     // to invalidate if user changes
}
```
**TTL:** 24 hours — show cache up to 24h old with the banner, beyond that show a "data may be outdated" warning
**Pattern for each page:**

```js
// On successful EF response:
localStorage.setItem('vyve_[page]_cache', JSON.stringify({ data: responseData, ts: Date.now(), email: memberEmail }));

// On page load (before EF call):
const cached = localStorage.getItem('vyve_[page]_cache');
if (cached) {
  const { data, ts, email } = JSON.parse(cached);
  if (email === memberEmail) {
    renderPage(data);                    // render immediately from cache
    VYVEOffline.showBanner(ts);         // show "last updated X ago"
  }
}

// If online, fetch fresh data and update cache:
if (navigator.onLine) {
  fetchFromEF().then(fresh => {
    renderPage(fresh);
    VYVEOffline.hideBanner();
    localStorage.setItem('vyve_[page]_cache', JSON.stringify({ data: fresh, ts: Date.now(), email: memberEmail }));
  }).catch(() => {
    // Already showing cached data — no action needed
  });
}
```

**Pages that need this pattern added:**
- `habits.html` → cache key `vyve_habits_cache`, data = habits + today's logs
- `nutrition.html` → cache key `vyve_nutrition_cache`, data = TDEE + macros + weight log
- `sessions.html` → cache key `vyve_sessions_cache`, data = service catalogue
- `certificates.html` → cache key `vyve_certs_cache`
- `engagement.html` → cache key `vyve_engagement_cache`
- `leaderboard.html` → cache key `vyve_leaderboard_cache`
- `index.html` → already has `vyve_dashboard_cache` — verify it handles the offline case (shows cache + banner) and if not, fix it to match this pattern
- `settings.html` → already has `vyve_settings_cache` — same verification
- `workouts.html` → workout_plan_cache already exists in localStorage. Verify offline render works. Add offline banner if data is from cache.

**Do NOT add caching to:** `login.html`, `set-password.html`, `running-plan.html` (AI-generated, stale cache is misleading), `wellbeing-checkin.html` (check-in is a write action, show "submit when back online" state instead), `log-food.html` (same — write-action-heavy)

### Layer 4: wellbeing-checkin.html offline state
When offline, `wellbeing-checkin.html` should:
- Show the slider UI (so the member can fill it in)
- Replace the submit button with "You're offline — your response will submit when you reconnect"
- On `vyve-back-online` event: re-enable submit
- Do NOT cache the check-in data as "readable" content — showing a stale wellbeing score as if it's current is misleading

### Layer 5: sw.js improvements
Update sw.js to:
1. Add `offline-manager.js` to PRECACHE_ASSETS
2. Add all 4 session shared files to PRECACHE_ASSETS (from Phase C)
3. Add all 14 session HTML pages to PORTAL_PAGES if not already listed
4. Add `offline.html` to PRECACHE_ASSETS so it's always available
5. Improve the offline fallback: when a portal page fetch fails AND cache is empty, serve offline.html rather than a network error

### Layer 6: offline.html improvement
Replace current offline.html with a better version:
- Same VYVE branding, dark theme by default
- Message: "You're offline" + "The app needs a connection to load for the first time. Once you've visited a page, it works offline automatically."
- "Go to dashboard" link → `/index.html`
- Do NOT try to show cached data here (too complex, wrong layer)
- Must use theme.css tokens (link to /theme.css and /theme.js so dark/light mode works)

---

## Commit strategy

**Commit 1 — Phase C (vyve-site):**
Files: `session-live.css`, `session-rp.css`, `session-live.js`, `session-rp.js`, all 14 session HTML stubs, `sw.js` (PRECACHE + PORTAL_PAGES updated + cache bump)

**Commit 2 — Offline Mode (vyve-site):**
Files: `offline-manager.js` (new), `auth.js` (offline fix), `index.html`, `habits.html`, `nutrition.html`, `sessions.html`, `certificates.html`, `engagement.html`, `leaderboard.html`, `workouts.html`, `wellbeing-checkin.html`, `settings.html`, `offline.html` (improved), `sw.js` (PRECACHE + cache bump again)

**Commit 3 — VYVEBrain update:**
Files: `brain/changelog.md` (prepend Phase C + Offline entries), `tasks/backlog.md` (mark both done), `brain/master.md` (add offline architecture section documenting the cache pattern, offline-manager.js, auth offline fix)

Do commits sequentially — never chain without fetching fresh SHA between commits.

---

## Hard rules (from VYVEBrain — never break)

1. API keys NEVER in HTML. Server-side Edge Functions only.
2. Auth pattern: `vyveAuthReady` custom DOM event. Never use the old `waitForAuth()` polling.
3. sw.js cache version MUST be bumped after every portal file change.
4. EF deploys always require full index.ts — no partial updates.
5. Dual dark/light CSS block. theme.js before `</head>`.
6. All new CSS uses `var(--token)` from theme.css. Never hardcode `#1B7878` etc.
7. No API keys, no Anthropic key, no Supabase service key in any HTML or JS file.
8. `offline-manager.js` must work without the theme system loaded (it fires early, before theme.js may have run) — use safe fallback colours for the banner rather than CSS vars that might not resolve.
9. The auth offline fix must ONLY use cached sessions — never create a fake/anonymous session. If there's no cached Supabase session, redirect to login as normal even when offline.
10. GitHub writes via `GITHUB_COMMIT_MULTIPLE_FILES`. Composio GitHub MCP is READ-ONLY for fetches.

---

## Verification checklist

**Phase C:**
- [ ] yoga-live.html loads: correct player, correct session name, correct chat type
- [ ] mindfulness-live.html loads: different video ID, different chat room
- [ ] yoga-rp.html loads: playlist loads, correct live link
- [ ] education-live.html loads: verify edge case (podcast/education may have different structure)
- [ ] All 14 pages pass auth gate (redirect to login if not authenticated)
- [ ] Both dark and light themes render correctly on all 14 pages
- [ ] No console errors on any session page
- [ ] sw.js PRECACHE_ASSETS includes all 4 new shared files

**Offline Mode:**
- [ ] On iOS/Android: turn on airplane mode, open app → dashboard shows last cached data + offline banner (not blank screen)
- [ ] Habits page shows cached habits + offline banner
- [ ] Write action buttons (log habit, log workout) show disabled state
- [ ] Turn off airplane mode → banner disappears, data refreshes
- [ ] Fresh install (no cache) + offline → offline.html shown (not blank screen)
- [ ] Auth offline fix: user with valid cached session + no network → sees app (not login page)
- [ ] Auth online: no regression — normal login flow still works

---

## If anything blocks

- Session page has significantly different structure than yoga-live.html → read that page fully before templating, flag differences to Dean before proceeding
- auth.js offline fix is unclear → read the full current auth.js first, flag the exact approach to Dean
- Any EF call uses POST with a body that varies per-user → cache by user email key, not just page name
- offline-manager.js banner conflicts with nav.js header → use `top: 56px` on mobile per the VYVEBrain nav overlap rule
- Composio commit hits file size limit for large JS files → use `github-proxy` EF PUT endpoint (see VYVEBrain)

---

Once loaded, start with: "Brain loaded: yes. Tools available: yes. Here's my understanding and plan…" and wait for Dean's green light before writing any code.
