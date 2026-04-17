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
**SW:** `sw.js` current version `vyve-cache-v2026-04-15l`. Cache-first for static assets and HTML pages. No EF call caching — this is the root cause of blank screens offline.
**Theme:** `theme.css` loaded on all pages. All new files must use `var(--token)` CSS custom properties, not hardcoded hex values.
**No build process.** GitHub Pages only. No bundler, no Node, no templating engine. Everything is plain HTML/CSS/JS.
**Commits:** Use `GITHUB_COMMIT_MULTIPLE_FILES` for all multi-file changes. One atomic commit per phase. Fetch fresh repo SHA before each separate commit — do not chain commits without re-fetching.
**Cache bump:** After EVERY commit that changes portal files, bump the sw.js cache version letter (e.g. `l` → `m`). Pattern: `vyve-cache-v2026-04-15[letter]`. The sw.js bump goes in the same atomic commit as the portal changes.

---

## Root cause — confirmed

The offline blank screen issue was diagnosed and confirmed. The sequence on the train:

1. auth.js resolved fine — Supabase reads the JWT from localStorage without a network call. Auth was NOT the problem. The user was NOT redirected to login.
2. The portal HTML page loaded from service worker cache — sw.js was doing its job.
3. The page then made a POST call to the `member-dashboard` Edge Function over the network.
4. That call failed silently with no connection.
5. The JS has no fallback — it renders nothing where the dashboard data should be.
6. Result: authenticated user, HTML loaded, but blank data area.

**The fix is entirely in the data layer, not the auth layer.** The highest-priority offline work is adding localStorage fallback caching to every page that calls an Edge Function.

The auth offline fix (Layer 5 below) is still included as a precautionary measure — some browsers/devices can behave differently — but it is NOT the cause of the blank screen and is lower priority than the data cache layers.

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
Before building, read ALL 14 current pages to extract exact config values. Do not guess or approximate — use the actual values from the live files. Build a table like this before writing any stub files:

| Page | name | videoId / playlistId | chatType / liveLink | rpLink / liveLink | description |
|------|------|---------------------|--------------------|--------------------|-------------|

Extract every value from the live files. Flag any page where the structure differs from yoga-live.html before proceeding.

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
  - `#4DAAAA` → `var(--teal-lt)`
  - `#1B7878` → `var(--teal)`
  - `#7AC8C8` or `#7ab8b8` → `var(--teal-xl)`
  - Any `--muted` reference now resolves correctly (Phase A fixed this)
- Do NOT duplicate any tokens already defined in theme.css

### sw.js update for Phase C
Add all 4 new shared files to `PRECACHE_ASSETS`:
```js
'/session-live.js', '/session-rp.js', '/session-live.css', '/session-rp.css'
```
Also confirm all 14 session HTML filenames are in `PORTAL_PAGES`.
Bump cache version letter.

### Verification for Phase C
- yoga-live.html loads: correct player, correct session name, correct chat type
- mindfulness-live.html loads: different video ID, different chat room
- yoga-rp.html loads: playlist loads, correct live link
- All 14 pages pass auth gate
- Both dark and light themes render correctly on all 14 pages
- No console errors on any session page
- Hard refresh (Cmd+Shift+R) to bypass cached SW

---

## Offline Mode

### What good looks like
A member on a train with no signal opens VYVE. They see:
- Their dashboard with last cached data, a subtle "You're offline — last updated 2 hours ago" banner
- Their habit page with habits visible (read-only)
- Their workout programme visible (already cached in workout_plan_cache)
- A clear indicator on write actions ("Available when online")
- No blank screens, no infinite spinners, no silent failures

When connection returns: banner disappears, data refreshes automatically in background.

---

### Layer 1 (HIGHEST PRIORITY) — localStorage data cache per page

This is the direct fix for the blank screen. Implement first.

**Cache key convention:** `vyve_[page]_cache`
**Cache structure:**
```js
{
  data: { /* the EF response */ },
  ts: Date.now(),
  email: memberEmail
}
```
**TTL:** 24 hours — show cache up to 24h old with the offline banner.

**Pattern for every page that calls an EF:**
```js
// On successful EF response — save to cache:
localStorage.setItem('vyve_[page]_cache', JSON.stringify({
  data: responseData, ts: Date.now(), email: memberEmail
}));

// On page load — show cache immediately if available:
const cached = localStorage.getItem('vyve_[page]_cache');
if (cached) {
  const { data, ts, email } = JSON.parse(cached);
  if (email === memberEmail) {
    renderPage(data);
    VYVEOffline.showBanner(ts); // show "last updated X ago"
  }
}

// If online, fetch fresh and update:
if (navigator.onLine) {
  fetchFromEF().then(fresh => {
    renderPage(fresh);
    VYVEOffline.hideBanner();
    localStorage.setItem('vyve_[page]_cache', JSON.stringify({
      data: fresh, ts: Date.now(), email: memberEmail
    }));
  }).catch(() => { /* already showing cached data */ });
}
```

**Pages that need this pattern:**
- `index.html` — already has `vyve_dashboard_cache`. Verify it handles offline render + banner correctly. Fix if not.
- `habits.html` → `vyve_habits_cache` (habits list + today's logs)
- `nutrition.html` → `vyve_nutrition_cache` (TDEE, macros, weight log)
- `sessions.html` → `vyve_sessions_cache` (service catalogue)
- `certificates.html` → `vyve_certs_cache`
- `engagement.html` → `vyve_engagement_cache`
- `leaderboard.html` → `vyve_leaderboard_cache`
- `workouts.html` → `workout_plan_cache` already exists. Verify offline render works. Add offline banner if data is from cache.
- `settings.html` → `vyve_settings_cache` already exists. Same verification.

**Do NOT add data caching to:**
- `login.html`, `set-password.html` — auth pages, no data to cache
- `running-plan.html` — AI-generated, stale cache is misleading
- `wellbeing-checkin.html` — write-action-heavy, handle separately (see Layer 3)
- `log-food.html` — same

---

### Layer 2 — offline-manager.js (new shared file)

Create `/offline-manager.js`. Loaded on ALL portal pages via `<script src="/offline-manager.js"></script>` before `</body>`.

This file must work even if theme.js has not yet run — use safe inline colours for the banner, not CSS vars that might not resolve. Use `#1B7878` directly for the banner background in this file only (exception to the no-hardcoded-hex rule, justified here because this file runs before theme is guaranteed).

Exports global `VYVEOffline` object:
- `isOffline()` → `!navigator.onLine`
- `showBanner(ts)` → shows fixed banner at top with "You're offline — last updated [time ago]"
- `hideBanner()` → hides banner
- `disableWriteActions()` → sets `data-offline-disabled` on all `[data-write-action]` elements
- `enableWriteActions()` → removes it

Auto-behaviours:
- On `window 'offline'` event: `showBanner()`, `disableWriteActions()`
- On `window 'online'` event: `hideBanner()`, `enableWriteActions()`, dispatch `new CustomEvent('vyve-back-online')`
- On init: if `!navigator.onLine` already, call both immediately

Banner spec:
- `position: fixed; top: 0; left: 0; right: 0; z-index: 10002`
- Background `#1B7878`, white text, 44px tall, centered text
- Slide-in animation from top (200ms ease)
- Text: "You're offline — last updated [relative time]" or "You're offline" if no timestamp

Write action buttons: add `data-write-action` attribute to all buttons that POST to Supabase — log habit, start/log workout, log cardio, submit check-in, log food, log weight. When `data-offline-disabled` is set: `opacity: 0.45; pointer-events: none; cursor: not-allowed`. Tooltip via `title` attribute: "Available when online".

Add `offline-manager.js` to `PRECACHE_ASSETS` in sw.js.

---

### Layer 3 — wellbeing-checkin.html offline state

When offline:
- Show the slider UI (member can fill it in and think about it)
- Replace the submit button with a disabled state: "Submit when back online"
- Listen for `vyve-back-online` event → re-enable submit
- Do NOT show a stale wellbeing score as if it's current data

---

### Layer 4 — sw.js improvements

1. Add `offline-manager.js` to `PRECACHE_ASSETS`
2. Add all 4 session shared files (from Phase C) to `PRECACHE_ASSETS`
3. Add `offline.html` to `PRECACHE_ASSETS` so it's always available even on first load
4. Confirm all 14 session HTML pages are in `PORTAL_PAGES`
5. Improve offline fallback: if a PORTAL_PAGE fetch fails AND no cache exists, serve `offline.html`

---

### Layer 5 (PRECAUTIONARY) — auth.js offline fix

**Not the cause of the blank screen**, but worth fixing for edge cases on certain browsers.

`supabase.auth.getUser()` makes a network call. On some devices/browsers, if this times out offline, it may resolve null and redirect to login despite a valid cached session.

Fix: before the network auth call, check `navigator.onLine`. If offline AND `localStorage.getItem('sb-ixjfklpckgxrwjlfsaaz-auth-token')` exists and is not expired, use the cached session to dispatch `vyveAuthReady` without the network call.

Rules:
- ONLY use a cached session — never create a fake/anonymous session
- If there is no cached token, redirect to login as normal even when offline
- If online: always do the full network validation as before — no change to normal flow
- Read the full current auth.js before touching it. Flag the exact approach to Dean before implementing.

---

## Commit strategy

**Commit 1 — Phase C (vyve-site):**
Files: `session-live.css`, `session-rp.css`, `session-live.js`, `session-rp.js`, all 14 session HTML stubs, `sw.js` (PRECACHE + PORTAL_PAGES + cache bump)

**Commit 2 — Offline Mode (vyve-site):**
Files: `offline-manager.js` (new), `index.html`, `habits.html`, `nutrition.html`, `sessions.html`, `certificates.html`, `engagement.html`, `leaderboard.html`, `workouts.html`, `wellbeing-checkin.html`, `settings.html`, `offline.html` (improved), `auth.js` (precautionary offline fix), `sw.js` (PRECACHE additions + cache bump again)

**Commit 3 — VYVEBrain update:**
Files: `brain/changelog.md` (prepend Phase C + Offline entries), `tasks/backlog.md` (mark both done), `brain/master.md` (add offline architecture section)

Sequential commits — never chain without fetching fresh SHA.

---

## Hard rules (from VYVEBrain — never break)

1. API keys NEVER in HTML. Server-side Edge Functions only.
2. Auth pattern: `vyveAuthReady` custom DOM event. Never use the old `waitForAuth()` polling.
3. sw.js cache version MUST be bumped after every portal file change.
4. EF deploys always require full index.ts — no partial updates.
5. Dual dark/light CSS block. theme.js before `</head>`.
6. All new CSS uses `var(--token)` from theme.css. Never hardcode hex EXCEPT in offline-manager.js banner (justified: runs before theme).
7. No API keys, no Anthropic key, no Supabase service key in any HTML or JS file.
8. offline-manager.js banner must use `top: 0` on desktop. On mobile (`max-width: 768px`) the nav.js header is `position:sticky; top:0; height:56px` — the offline banner at `top:0` will overlap it. Use `top: 56px` on mobile, `top: 0` on desktop, OR push the banner above the nav at `z-index: 10002` (higher than nav's 9999). Confirm which approach is cleaner before implementing.
9. The auth offline fix must ONLY use cached sessions — never create a fake/anonymous session.
10. GitHub writes via `GITHUB_COMMIT_MULTIPLE_FILES`. Composio GitHub MCP is READ-ONLY for fetches.

---

## Verification checklist

**Phase C:**
- [ ] yoga-live.html: correct player, session name, chat type
- [ ] mindfulness-live.html: different video ID, different chat room
- [ ] yoga-rp.html: playlist loads, correct live link
- [ ] All 14 pages pass auth gate
- [ ] Both themes render correctly
- [ ] No console errors
- [ ] sw.js PRECACHE_ASSETS includes all 4 new shared files

**Offline Mode:**
- [ ] Airplane mode on → dashboard shows cached data + offline banner (NOT blank screen)
- [ ] Habits page shows cached habits
- [ ] Write action buttons show disabled state with tooltip
- [ ] Airplane mode off → banner disappears, data refreshes
- [ ] Fresh install + offline → offline.html shown (not blank screen or error)
- [ ] Normal online flow unchanged — no regression on login or data loading

---

## If anything blocks

- Session page has significantly different structure → read that page fully, flag to Dean before proceeding
- auth.js offline fix approach is unclear → read full current auth.js, flag exact approach to Dean
- offline-manager.js banner z-index conflicts with nav → confirm approach per Rule 8 above before committing
- Composio commit hits file size limit for large JS files → use `github-proxy` EF PUT endpoint (see VYVEBrain)
- Any page's EF call uses a non-standard response shape → adapt the cache pattern to that page's actual data structure

---

Once loaded, start with: "Brain loaded: yes. Tools available: yes. Here's my understanding and plan…" and wait for Dean's green light before writing any code.
