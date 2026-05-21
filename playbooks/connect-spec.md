# Connect — Phase 2 Spec (locked PM-186, 21 May 2026)

> Bundle-Ready Campaign Phase 2. Locked decisions only — open questions resolve to the documented default. Mirrors mind.html shape (hub) and breathwork.html / journal.html / affirmations.html shape (sub-pages). Inherits all §3 commitments + §23 hard rules.

**Status:** Design lock. Tables migrated to Supabase 21 May (PM-186). 30 prompts seeded. Build-ready.

**Build order for a fresh session:**

1. connect.html (hub) — most independent, lifts mind.html shape directly.
2. connect-checkin.html — single write surface, uses §23.39 verbatim.
3. connect-feed.html — adds reactions (second write surface).
4. connect-challenge.html — read-only, reuses leaderboard.html visual idioms.
5. EFs: `connect-challenge-summary`, `connect-feed-counts`.
6. Sub-page audit pass on sessions.html + leaderboard.html (§23.10 carve-outs).

Estimated 4-6 sessions in Dean's working rhythm.

---

## 1. Page inventory

| Page | Status | Purpose |
|---|---|---|
| `connect.html` | NEW (hub) | Today's check-in CTA + momentum + live this week + weekly challenge + recent check-ins preview + latest from VYVE |
| `connect-checkin.html` | NEW | Daily Check-In write surface (prompt + textarea + focus tag + post) |
| `connect-feed.html` | NEW | Community Feed (Workplace / Elite / Following tabs, chronological, reactions only) |
| `connect-challenge.html` | NEW | Active weekly challenge detail (community ring + personal progress + leaderboard tab) |
| `sessions.html` | EXISTS | Live This Week carousel deep-links here for full schedule |
| `leaderboard.html` | EXISTS | §23.10 carve-out, deep-linked from challenge + momentum card |

Session detail (live session → join flow) and Latest from VYVE replays use the existing live/replay shells (`yoga-live.html`, `mindfulness-rp.html` etc.) — no new pages.

---

## 2. Data model

Five new tables, all RLS-enabled. Live in Supabase as of PM-186 (verified, indices + triggers + policies in place).

### 2.1 `connect_checkins`

```sql
create table public.connect_checkins (
  id              uuid primary key default gen_random_uuid(),
  member_email    text not null references public.members(email) on delete cascade,
  client_id       uuid not null,
  checkin_date    date not null,
  body            text not null check (length(body) between 1 and 60),
  focus_tag       text check (focus_tag in ('move','mind','fuel','rest','growth')),
  posted_at       timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (member_email, checkin_date),
  unique (member_email, client_id)
);
```

Indices: `(posted_at desc)` for feed reads, `(member_email, checkin_date desc)` for own-streak reads.
Trigger: `set_updated_at()` BEFORE UPDATE.
RLS: read-all (public feed), write/update own.
Constraint hardline: one check-in per member per day. No edits after post.

### 2.2 `checkin_reactions`

```sql
create table public.checkin_reactions (
  checkin_id      uuid not null references public.connect_checkins(id) on delete cascade,
  member_email    text not null references public.members(email) on delete cascade,
  reaction        text not null check (reaction in ('heart','muscle','fire','hands','star','clap')),
  client_id       uuid not null,
  created_at      timestamptz not null default now(),
  primary key (checkin_id, member_email),
  unique (member_email, client_id)
);
```

PK = `(checkin_id, member_email)` — one reaction per member per check-in. Tap same = delete row. Tap different = update reaction column. No "X reacted to your check-in" notifications.

### 2.3 `weekly_challenges`

```sql
create table public.weekly_challenges (
  id              uuid primary key default gen_random_uuid(),
  week_start      date not null unique,
  title           text not null,
  body_md         text not null,
  metric          text not null check (metric in ('check_ins','workouts','mind_sessions','steps_self_report','hydration_self_report','any_activity')),
  community_goal  integer not null check (community_goal > 0),
  scope           text not null check (scope in ('all','workplace','elite')),
  created_at      timestamptz not null default now()
);
```

Author-curated. RLS = read-all, writes via service role only (admin console). One challenge per week (`week_start` = Monday, unique).

### 2.4 `weekly_challenge_participation`

```sql
create table public.weekly_challenge_participation (
  challenge_id    uuid not null references public.weekly_challenges(id) on delete cascade,
  member_email    text not null references public.members(email) on delete cascade,
  joined_at       timestamptz not null default now(),
  personal_count  integer not null default 0,
  updated_at      timestamptz not null default now(),
  primary key (challenge_id, member_email)
);
```

`personal_count` is denormalised. Refreshed by the `connect-challenge-summary` EF on each call (60s cache). No triggers needed v1 — EF reads the underlying activity tables, computes count, updates row.

### 2.5 `daily_checkin_prompts`

```sql
create table public.daily_checkin_prompts (
  id              uuid primary key default gen_random_uuid(),
  prompt          text not null check (length(prompt) between 5 and 200),
  active_from     date,
  active_until    date,
  tag             text,
  weight          integer not null default 1 check (weight >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

30 prompts seeded at PM-186 across 11 tags (general, self-care, momentum, priorities, movement, mind, habits, reflection, gratitude, connection, nutrition). Rotation: `djb2(member_email + today's_date) mod count(active_prompts)` — deterministic per member per day, identical algorithm to mind.html Today's Focus.

`active_from` / `active_until` enable seasonal prompts ("January reset", summer-only). `weight` enables A/B-style biasing post-launch. Lewis edits via admin console (added in Phase 6).

### 2.6 What we explicitly DO NOT add

- No `follows` table. Following tab in feed = coming-soon pill v1.
- No `comments` / `replies` / `threads` tables. Ever. Check-in IS the post.
- No `posts` table — `connect_checkins` is the only "post" surface.
- No social-loop notifications (likes / reactions). Only operational pushes (challenge ends in 24h, streak at risk).

---

## 3. The Hub — connect.html

### 3.1 Visual structure (top to bottom)

```
┌─────────────────────────────────────────┐
│  Connect                          🔔     │  header
│  Together we build better habits.       │  subtitle
├─────────────────────────────────────────┤
│  TODAY'S CHECK-IN                       │  .hero-card
│  [prompt from daily_checkin_prompts]    │  hero-name
│  What will you commit to?               │  hero-meta
│  [ Check In Now ]                       │  CTA (or "View today's" if posted)
├─────────────────────────────────────────┤
│  YOUR MOMENTUM                          │  .progress-row
│  [N day streak ring]  You're on a roll! │  streak-ring + body
│  M more to unlock Elite Community       │  elite-unlock-meta
│  [progress bar N/30]                    │
├─────────────────────────────────────────┤
│  LIVE THIS WEEK            View all →   │
│  [card] [card] [card] [card →]          │  horizontal scroll
├─────────────────────────────────────────┤
│  THIS WEEK'S CHALLENGE                  │
│  [title] • [N] days left                │
│  [ring] X / Y community goal            │
│  Your progress: P/W days                │
│  [ Open challenge → ]                   │
├─────────────────────────────────────────┤
│  RECENT CHECK-INS          See all →    │
│  Up to 3 cards (avatar, name, time,     │
│   body, ♥ count, focus tag pill)        │
├─────────────────────────────────────────┤
│  LATEST FROM VYVE                       │
│  [card] [card] [card →]  podcasts+replays│
└─────────────────────────────────────────┘
```

### 3.2 Data wiring

**Script stack** (canonical per §23.44):
```html
<script src="auth.js" defer></script>
<script src="dexie.min.js" defer></script>
<script src="bus.js" defer></script>
<script src="db.js" defer></script>
<script src="vyve-offline.js" defer></script>
<script src="sync.js" defer></script>
```

**Paint pattern** (per §23.46 — no skeletons):

Default markup at HTML parse:
- streak ring: `0`
- today's posted state: not-posted (CTA = "Check In Now")
- challenge personal progress: `0/W`
- community count banner: hidden unless last-known value cached in `_kv`
- challenge community ring: hidden unless last-known value cached in `_kv`
- recent check-ins list: empty
- latest-from-vyve carousel: empty

Boot sequence:
1. HTML paints with `0`s. Imperceptibly brief — same frame as JS init.
2. `boot()` runs synchronously. `window.vyveCurrentUser.email` from auth.js fast-path → proceed immediately.
3. Dexie reads fire via `VYVELocalDB.*` — promises resolve in same microtask (DB already open from eager IIFE bootstrap in db.js).
4. `render()` paints real values from Dexie. Total time paint(0) → paint(real): ~5-15ms.

Cold/first-install path:
1. Markup paints with `0`s.
2. Dexie reads return empty (genuinely empty). Counters stay at `0` — this is honest.
3. sync.js fans out hydration. As each table lands, sync.js publishes the corresponding bus event.
4. Page subscribes, re-reads, paints real values. Counters tick from `0` to real value as data arrives.

**NO `paintFromSnapshot()` from localStorage. NO `vyve_connect_hub_snapshot` key.** The mind.html PM-183.4 snapshot pattern is retroactively obsolete (see §23.46) — connect.html does not propagate it.

**Reads:**
- **Streak + posted_today**: Dexie `connect_checkins` filtered by member, last 30 days. djb2-style consecutive-day algorithm with one-day grace (same as affirmations + mind).
- **Elite progress**: Client-side union across `connect_checkins`, `mind_activities`, `body_activities` (when it exists), `daily_habits`. Count distinct `activity_date` in last 30 days. Threshold = 30.
- **Live This Week**: Dexie `service_catalogue` filtered by current ISO week, `is_live=true` first then upcoming.
- **Weekly challenge**: Dexie `weekly_challenges` (current week by `week_start = current_monday()`) + Dexie `weekly_challenge_participation` (own row). Community count: REST to `connect-challenge-summary` EF, cached 60s in `_kv` table.
- **Recent check-ins**: Dexie `connect_checkins` top 3 by `posted_at desc`. Server delta-pull via sync.js fan-out-on-focus.
- **Latest from VYVE**: Dexie `service_catalogue` filtered to `kind in ('podcast','replay','clip')`, top 6 by `published_at desc`.

**Writes:** None on the hub. CTA navigates to `connect-checkin.html`. Reaction taps deep-link to `connect-feed.html`. Challenge button to `connect-challenge.html`.

**Bus subscriptions** (cross-page repaint without reload):
- `connect:checkin:logged` → repaint hero (CTA → "View today's check-in"), repaint Recent list head, increment streak if midnight crossed.
- `connect:checkin:failed` → re-read (Dexie reverted by §23.39 path).
- `connect:reaction:logged` / `connect:reaction:cleared` → repaint Recent list reaction state.
- `connect:challenge:progress` → repaint Weekly Challenge ring.
- `connect:hydrated` → re-read everything (post-hydration sweep).
- `mind:logged` / `body:logged` → IF active challenge metric matches, repaint Weekly Challenge personal_count.

**Bus publishes**: none. Hub is read-only.

**visibilitychange + pageshow**: re-read all sections (cheap, Dexie-only).

### 3.3 Elite Community unlock

**Threshold:** 30 distinct activity days across all four pillar tables (`connect_checkins`, `mind_activities`, `body_activities`, `daily_habits`) in last 30 days.

Implementation: client-side union in JavaScript, computed off Dexie rows synchronously during render. No materialised table v1.

```js
function computeEliteProgress(email) {
  return Promise.all([
    VYVELocalDB.connect_checkins.allFor(email),
    VYVELocalDB.mind_activities.allFor(email),
    VYVELocalDB.body_activities ? VYVELocalDB.body_activities.allFor(email) : Promise.resolve([]),
    VYVELocalDB.daily_habits.allFor(email)
  ]).then(([c, m, b, h]) => {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);
    const days = new Set();
    [...c, ...m, ...b, ...h].forEach(r => {
      const d = r.activity_date || r.checkin_date;
      if (d && d >= cutoff) days.add(d);
    });
    return Math.min(days.size, 30);
  });
}
```

Until unlocked, Elite tab in `connect-feed.html` shows 🔒 + tooltip "M more days to unlock". Once unlocked, tab is interactive. **No backend gating** — Elite is a UI-only privilege v1.

If perf becomes a problem post-launch, materialise as `member_activity_days` (one row per member per date with `did_anything=true`), populated by triggers on the four pillar tables.

---

## 4. Sub-pages

### 4.1 connect-checkin.html

Single-purpose write surface. Modal-style (back arrow top-left, "Daily Check-In" title centred).

**Structure:**
- Prompt (read from Dexie `daily_checkin_prompts`, djb2 rotation, hub fallback if none)
- Textarea, max 60 chars, char counter, autofocus
- Focus picker — 5 chips: Move / Mind / Fuel / Rest / Growth (optional, maps to `focus_tag`)
- Post button — disabled until ≥3 chars typed
- Footer: "One check-in per day. Edits aren't allowed after posting." (lock icon)
- Privacy: "Your check-in will be visible to your community."

**Write pattern (§23.39 verbatim):**

```js
async function postCheckin(body, focusTag) {
  const clientId = crypto.randomUUID();
  const today = todayStr();
  const row = {
    id: clientId,                  // optimistic id = client_id v1 (server may issue new id; sync reconciles)
    member_email: memberEmail,
    client_id: clientId,
    checkin_date: today,
    body,
    focus_tag: focusTag || null,
    posted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // 1. Dexie upsert sync
  await VYVELocalDB.connect_checkins.upsert(row);
  
  // 2. Bus publish
  VYVEBus.publish('connect:checkin:logged', { client_id: clientId, source: 'checkin_page' });
  
  // 3. Un-awaited POST
  fetch(SUPA_URL + '/rest/v1/connect_checkins', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(row)
  }).then(r => {
    if (!r.ok && r.status < 500) {
      // 4. 4xx revert
      VYVELocalDB.connect_checkins.delete(clientId);
      VYVEBus.publish('connect:checkin:failed', { client_id: clientId, status: r.status });
    }
  }).catch(() => {
    // 5. Network throw — enqueue
    VYVELocalDB._sync_queue.upsert({ table: 'connect_checkins', op: 'insert', row, client_id: clientId });
  });
  
  // 6. Navigate back
  history.back();
}
```

**Already-posted-today guard:** Boot reads Dexie for any row with `checkin_date = today`. If exists, render read-only view ("You've checked in today" + body + reactions + "Check back tomorrow" CTA → hub).

### 4.2 connect-feed.html

**Tabs:** Workplace | Elite (🔒 if not unlocked) | Following (coming-soon pill, disabled).

**Workplace label:** Members with `employer` set see employer name ("Sage"). Members without see "VYVE Community". Same backend filter (employer IS NULL union employer = member's employer), label-only difference.

**Top banner:** "X members checked in today" — `connect-feed-counts` EF, cached 60s in `_kv`. Falls back to last-known on offline. Skeleton-less per §23.46: hidden until first fetch.

**Feed list:**
- Card: avatar (initials), first name, time ago, body, focus tag pill, reactions row.
- Reactions row: 6 emojis (♥ 💪 🔥 🙌 ⭐ 👏). Own reaction highlighted. Total count next to ♥ only (mockup convention).

**Reaction write (§23.39):**

```js
async function toggleReaction(checkinId, reaction) {
  const existing = await VYVELocalDB.checkin_reactions.get([checkinId, memberEmail]);
  
  if (existing && existing.reaction === reaction) {
    // Same reaction = remove
    await VYVELocalDB.checkin_reactions.delete([checkinId, memberEmail]);
    VYVEBus.publish('connect:reaction:cleared', { checkin_id: checkinId });
    fetch(SUPA_URL + '/rest/v1/checkin_reactions?checkin_id=eq.' + checkinId + '&member_email=eq.' + encodeURIComponent(memberEmail), {
      method: 'DELETE',
      headers: authHeaders
    });
  } else {
    // New or swap
    const clientId = crypto.randomUUID();
    const row = { checkin_id: checkinId, member_email: memberEmail, reaction, client_id: clientId, created_at: new Date().toISOString() };
    await VYVELocalDB.checkin_reactions.upsert(row);
    VYVEBus.publish('connect:reaction:logged', { checkin_id: checkinId, reaction });
    fetch(SUPA_URL + '/rest/v1/checkin_reactions', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(row)
    });
  }
}
```

**Reads:** Dexie `connect_checkins` ordered by `posted_at desc`, paginated 30/page. Scope filter per tab.

**End-of-feed footer:** "🌅 End of today's feed — Come back tomorrow for a fresh start." Anti-doomscroll signal.

**Day boundaries:** Explicit "Yesterday" / "2 days ago" separator labels. No infinite load past visible day boundaries — pagination only goes 30 rows further.

### 4.3 connect-challenge.html

Read-only.

- Hero card: icon, title, body_md (rendered), days left.
- Community ring: big circular ring (e.g. 630 / 2000).
- Personal progress: count + 7-day strip (M T W T F S S with green / empty / star — same shape as habits.html week strip).
- About this challenge: body_md.
- Leaderboard tab: workplace-scoped, top 10 by `personal_count`. Same anonymity rules as leaderboard.html.

**Joining:** auto-on first relevant activity (check-in / workout etc.) — no explicit "Join" button v1. EF `connect-challenge-summary` writes the `weekly_challenge_participation` row on first qualifying activity.

---

## 5. Edge Functions (v1)

| EF | Purpose | verify_jwt | Cache |
|---|---|---|---|
| `connect-challenge-summary` | Computes community count + member's personal count for active challenge. Updates `weekly_challenge_participation.personal_count`. | true | 60s in client `_kv` |
| `connect-feed-counts` | Computes "X members checked in today" workplace + elite scopes. | true | 60s in client `_kv` |

Both deployed in their own session after table writes are flowing through the optimistic-first skeleton. Direct PostgREST writes for check-ins + reactions — no server-side validator EF v1.

**Deferred to post-launch:**
- `seed-weekly-challenge` cron (Sunday 23:00 UTC, picks from `weekly_challenges_library`). v1: Lewis seeds manually via admin console or direct SQL.

---

## 6. Sync + offline

**Catalogue tables** (client read-only): `weekly_challenges`, `service_catalogue`, `daily_checkin_prompts` — hydrated by sync.js on auth-ready + fan-out-on-focus.

**Member-data tables:** `connect_checkins`, `checkin_reactions`, `weekly_challenge_participation` — same hydration path as `mind_activities`, using §23.43 merge-not-wipe.

**Honestly-network-bound surfaces** (§23.10 carve-outs):
- "X members checked in today" banner
- Challenge community total ring
- Latest-from-VYVE freshness check

Pattern: hidden if no last-known value, last-known value with subtle "Last updated Nm ago" footer on offline, real value on next successful fetch.

**Realtime:** None v1. Feed freshness via fan-out-on-focus delta-pull (visibilitychange → REST). Feed is "as of when you opened the app", not live-updating. Consistent with anti-doomscroll philosophy. Add Realtime post-launch only if Cole reports the gap hurts engagement.

---

## 7. Engagement score interaction (interim, pre-Phase 3)

Until Phase 3 pillar realignment ships, Connect activities count toward existing engagement.html Variety component:

- `connect_checkins` insert → adds "Connect" as the 6th Variety type (existing 5: Habits, Workouts, Cardio, Sessions, Check-ins).
- Reactions → do NOT count. Too micro, distorts scoring.
- Challenge joins → do NOT count. Underlying activity is the credit.

Phase 3 will rewrite the Variety component as Mind/Body/Connect at 4.17 points each. Connect spec doesn't need to do that work — just visible in the existing system.

---

## 8. What ships v1 vs deferred

**v1 (Phase 2 ship):**
- 4 new pages: connect.html, connect-checkin.html, connect-feed.html, connect-challenge.html
- 5 tables (migrated PM-186)
- 30 daily prompts (seeded PM-186)
- 2 EFs (`connect-challenge-summary`, `connect-feed-counts`)
- 4 new bus events (`connect:checkin:logged|failed`, `connect:reaction:logged|cleared`)
- Following tab as coming-soon pill

**Deferred (P1 post-launch):**
- Following tab (needs `follows` table)
- Realtime feed updates
- Auto-curated weekly challenge cron (`weekly_challenges_library` + `seed-weekly-challenge` EF)
- Admin console UI for prompt curation (v1: direct SQL or Supabase Table Editor)
- Avatar uploads (v1: initials only, matches leaderboard.html)
- Profanity filter / report flow (v1: manual moderation via Supabase)
- Push notifications for challenge milestones / streak-at-risk

---

## 9. Open decisions resolved at PM-186

| Decision | Locked value |
|---|---|
| Elite threshold | 30 distinct activity days in last 30 days, any of 4 pillar tables |
| Check-in body max | 60 chars |
| Reaction set | ♥ 💪 🔥 🙌 ⭐ 👏 (heart/muscle/fire/hands/star/clap) |
| Workplace filter when employer null | Show "VYVE Community" feed (all + same-no-employer scope) |
| Daily prompts | Library of 30 seeded PM-186; djb2 rotation; interchangeable via admin console post-launch |
| Following tab v1 | Coming-soon pill (disabled) |
| Paint pattern | No skeletons. Counters default to 0. §23.46. |
| localStorage snapshot pattern | Forbidden on Connect. Mind.html PM-183.4 snapshot retroactively obsolete (Phase 4 strip). |

---

## 10. References

- mind.html (shape mirror) — main vyve-site
- breathwork.html / journal.html / affirmations.html (sub-page shape mirror) — main vyve-site
- §23.39 (optimistic-first writes) — master.md
- §23.43 (merge-not-wipe Dexie hydrate) — master.md
- §23.44 (Dexie stack required on every Dexie-reading page) — master.md
- §23.46 (counters render truth not skeletons) — master.md, new at PM-186
- §23.10 (offline-equivalent operation as contract) — master.md
- §3.1 (iOS-specific mitigations) — active.md

---

*End of spec. Build-ready as of PM-186, 21 May 2026.*
