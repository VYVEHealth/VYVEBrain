# Live Sessions — End-to-End Operations Playbook

**Owner:** Lewis (commercial / scheduling) + Dean (technical / cron infra) · **Last updated:** 24 May 2026 (PM-279.2) · **Status:** Phase 1 manual / Phase 2 autonomous (PM-215 cron pending). Privacy locked to `unlisted` per Lewis decision 24 May.

---

## The model in one paragraph

A live session is a row in `calendar_occurrences` with `type='live_session'`, a `category` (Yoga / Mindfulness / Workouts / Weekly Check-In / Group Therapy / Events & Run Club / Education & Experts / Podcast), a `starts_at` / `ends_at` timestamp, and — once a broadcast is created — a `youtube_broadcast_id`. The member-facing live page (`/yoga-live.html`, `/mindfulness-live.html` etc.) reads this row from Dexie, looks at the clock, and renders the right state: countdown card 10+ min out, pre-roll iframe ≤10 min out, live iframe inside the window, just-ended replay banner ≤30 min after, latest replay card otherwise. **All the live page needs to go live is `youtube_broadcast_id IS NOT NULL` on the right row at the right time.** The whole operational question is: how does that ID get there.

---

## The 9 reusable streams (canonical reference)

Each YouTube channel has a **persistent reusable stream key** — one per category, configured once in Riverside as that studio's RTMP destination, never touched again. New broadcasts bind to the same stream key each time. This is the architecture that solved the historical "use the same YouTube link" problem.

| Category (matches `service_catalogue.category`) | Stream title | `youtube_stream_id` | Riverside studio (paired) |
|---|---|---|---|
| Yoga, Pilates & Stretch | VYVE Yoga, Pilates & Stretch | `uptZFgSk0ZmNnE2IbYBdtg1773787341014499` | Yoga studio |
| Mindfulness & Mindset | VYVE Mindfulness & Mindset | `uptZFgSk0ZmNnE2IbYBdtg1773787428540514` | Mindfulness studio |
| Workouts | VYVE Workouts | `uptZFgSk0ZmNnE2IbYBdtg1773787528049051` | Workouts studio |
| Weekly Check-In | VYVE Weekly Check-In | `uptZFgSk0ZmNnE2IbYBdtg1773787612302221` | Check-in studio |
| Group Therapy | VYVE Group Therapy | `uptZFgSk0ZmNnE2IbYBdtg1773787742902658` | Therapy studio |
| Events & Run Club | VYVE Events | `uptZFgSk0ZmNnE2IbYBdtg1773787842061692` | Events studio |
| Podcast | VYVE Podcast | `uptZFgSk0ZmNnE2IbYBdtg1773787932659198` | Podcast studio |
| Education & Experts | VYVE Education and Experts | `uptZFgSk0ZmNnE2IbYBdtg1773786554581556` | Education studio |
| _(spare)_ | Default stream key | `uptZFgSk0ZmNnE2IbYBdtg1773786332742438` | unmapped — ad-hoc use |

All 9 verified `isReusable=true` on 24 May 2026 via the `yt-stream-diag` EF. None will ever need rotating unless a Riverside studio is rebuilt.

---

## What you do, weekly — the human steps

1. **Build / approve the timetable.** Decide what's airing in the coming 1–4 weeks. Most categories recur weekly at the same slot (Yoga Mon/Wed/Fri 06:00, Workouts Tue/Thu 07:30, etc.); a few are ad-hoc (Events, Education guest spots, Podcast drops).
2. **Make sure rows exist in `calendar_occurrences` for each session.** Lewis adds these via Supabase dashboard SQL editor today (see "Add a session manually" below). Once Portal Admin ships (backlog), this becomes a UI.
3. **Be at the right Riverside studio at the scheduled time, press Go Live.** That's it. No link creation, no copy-paste of stream keys, no per-session Riverside config — every studio is already paired to its category's persistent stream.

Once PM-215 cron is live (next build session), step 2 stays the same but you stop having to think about step 4 below — broadcasts auto-create themselves 6 min before each `starts_at`. Until then, see "Phase 1" below.

---

## Phase 1 — Manual broadcast creation (today, before PM-215 cron ships)

Until the hourly cron is live, broadcasts have to be created on demand. Two ways:

### Path A — Ask Claude in a session (recommended)

Once a week, paste your timetable into a Claude chat:

> _"Create YouTube broadcasts for this week's live sessions:_
> _Monday 06:00 — Yoga — Morning Flow with Emma_
> _Monday 12:00 — Mindfulness — Midday Reset with James_
> _Tuesday 07:30 — Workouts — Full Body Strength with Calum_
> _… etc"_

Claude will:
1. For each session, INSERT (or UPDATE) the row in `calendar_occurrences` with `starts_at`, `ends_at`, `category`, `session_title`, `host_name` (defaults to "Lewis Vines" if not specified — see `default_host_name` on `service_catalogue`).
2. Call YouTube `liveBroadcasts.insert` for each row, with privacy=`unlisted` — **canonical, locked by Lewis 24 May**. Members reach the broadcast only via the embedded iframe in the live page; nothing is discoverable on YouTube search or via the channel page. Public is never used.
3. Call `liveBroadcasts.bind` to wire the new broadcast to the matching category's persistent `youtube_stream_id`.
4. UPDATE `calendar_occurrences.youtube_broadcast_id` with the returned broadcast ID.
5. Report back what got scheduled and what didn't.

You can ask Claude to do it for a week, a month, or a single ad-hoc session.

### Path B — Manual SQL only (rows but no broadcast IDs)

If you just want to schedule the calendar but not create the YouTube broadcasts yet (e.g. timetable is provisional, broadcasts will be created closer to the date), insert the rows with `youtube_broadcast_id = NULL`. The live page will sit in the QUIET state and show the latest replay until you (or PM-215 cron) populates the broadcast ID.

This is the right shape when you're sketching a month ahead but don't want 30 unused YouTube broadcasts cluttering the channel.

---

## Phase 2 — Autonomous (after PM-215 cron ships)

Once the cron is built, the loop becomes:

1. Lewis (or Portal Admin UI) adds `calendar_occurrences` rows for the upcoming month with `youtube_broadcast_id = NULL`.
2. **Hourly cron** walks `calendar_occurrences WHERE starts_at BETWEEN now() AND now() + interval '1 hour' AND youtube_broadcast_id IS NULL AND active=true AND type='live_session'`. For each match: creates the broadcast, binds to the stream, writes the ID back.
3. Members see the page transition QUIET → UPCOMING (10–60 min before) → PRE_ROLL (≤10 min) → LIVE (when Riverside starts pushing RTMP) → JUST_ENDED (≤30 min after) → QUIET.
4. Lewis turns up at the studio and presses Go Live. End of operational involvement.

No per-session Claude prompt. No manual API calls. The schedule is the only input.

---

## Session intake spec — what we need from Lewis per session

For every session — recurring or one-off — we need this row. Most rows are recurring (same category, host, slot week-to-week) so per-row entry collapses to whatever's actually changing.

| Field | Required? | Example | Notes |
|---|---|---|---|
| **Category** | Yes | `Yoga, Pilates & Stretch` | Must match one of the 8 canonical strings exactly. Drives stream binding + replay playlist. |
| **Start** | Yes | `2026-05-26 06:00` | Local time (BST/GMT auto-handled). Stored as UTC in `starts_at`. |
| **Duration (mins)** | Yes | `45` | Used to compute `ends_at = starts_at + duration`. |
| **Session title** | Yes | `Morning Flow` | The episode/session name; what members see on the card and live page. Max ~60 chars. |
| **Description** | Yes | `A grounding flow to start the day strong.` | 1–2 sentences, max ~140 chars. Shown under title on live page. |
| **Host name** | Yes | `Emma Clarke` | Person leading the session. |
| **Host role** | Optional | `Yoga Lead` | Defaults to `service_catalogue.default_host_role` if blank. |
| **Host photo URL** | Optional | `https://.../emma.jpg` | Bucket URL. Lewis curates 4–5 instructor photos once; thereafter it inherits from catalogue. |

### Preferred handover format

A pasted block in chat, one line per session, pipe-delimited:

```
Mon 26 May 06:00 · 45min · Yoga · "Morning Flow" · Emma Clarke · A grounding flow to start the day strong.
Wed 28 May 06:00 · 45min · Yoga · "Power Flow" · Emma Clarke · A stronger flow to build heat and capacity.
Tue 27 May 07:30 · 60min · Workouts · "Full Body Strength" · Calum Denham · Compound lifts and accessories.
Thu 29 May 12:00 · 30min · Mindfulness · "Midday Reset" · James Reid · Five-minute breathwork plus seated meditation.
Wed 28 May 09:00 · 30min · Weekly Check-In · "Monday Check-In" · Lewis Vines · Five-minute reflection on last week and intent for this week.
```

Claude parses, validates the category against the 8 canonical strings, computes `ends_at`, inserts/updates `calendar_occurrences` rows in one turn. A Google Sheet or CSV with the same columns also works — just paste it.

### Cadence

**Monthly batches.** End of each month, Lewis and Dean agree the next month's timetable, paste it into a chat, Claude populates the rows. Ad-hoc sessions (guest spots, special events) added as they come up. Once PM-215 cron is live, broadcast creation is autonomous — you never touch the YouTube API or stream keys.

### Host photo bucket

A small set of instructor photos (4–5 people, square crop, ~400×400px) lives in Supabase Storage. Lewis curates these once, gets the bucket URLs, sets them as `service_catalogue.default_host_photo_url` per category. After that, the photo just inherits — only set the per-row `host_photo_url` override if the session has a guest instructor for that week.

### What goes in the host name field today

Until per-category hosts are confirmed and instructor photos are uploaded, `default_host_name='Lewis Vines'` is the universal fallback. Lewis to confirm with Emma / Calum / James / Phil over the coming weeks, then we backfill `service_catalogue.default_host_*` per category once. After that, per-row `host_name` is only needed for guest spots.

---

## What goes on the air — the data model

Each `calendar_occurrences` row carries the data the live page renders. Field resolution chain: **per-occurrence override → catalogue default → literal fallback**.

| Field | Per-occurrence override | Catalogue default | Notes |
|---|---|---|---|
| Title | `session_title` | `service_catalogue.session_title` | e.g. "Morning Flow", "Midday Reset" |
| Description | `session_description` | `service_catalogue.session_description` | 1–2 sentences shown under title |
| Host name | `host_name` | `service_catalogue.default_host_name` | Backfilled to "Lewis Vines" universally; Lewis edits per category once instructors confirmed (Emma / Calum / James / Phil) |
| Host role | `host_role` | `service_catalogue.default_host_role` | e.g. "Yoga Lead", "Performance Coach" |
| Host photo | `host_photo_url` | `service_catalogue.default_host_photo_url` | Bucket-served, square crop |
| Image | `image_url` | `service_catalogue.image_url` | Card thumbnail, gradient fallback if null |
| Category | `category` | _(required)_ | Drives stream binding + replay playlist |
| Window | `starts_at` / `ends_at` | _(required)_ | UTC stored, local rendered |
| Broadcast | `youtube_broadcast_id` | _(populated by cron / Claude)_ | NULL = QUIET state on page |

**Per-occurrence overrides exist for the cases where the session is a one-off** — a guest yoga teacher one week, a special podcast episode topic, etc. Most sessions inherit the catalogue default cleanly.

---

## Add a session manually (Supabase SQL editor)

```sql
INSERT INTO calendar_occurrences (
  type, category, starts_at, ends_at,
  session_title, session_description,
  host_name, host_role,
  active
) VALUES (
  'live_session',
  'Yoga, Pilates & Stretch',
  '2026-05-26 06:00:00+01',  -- BST
  '2026-05-26 06:45:00+01',
  'Morning Flow',
  'A grounding flow to start the day strong.',
  'Emma Clarke',
  'Yoga Lead',
  true
);
```

Once PM-215 cron is live, the row above is everything you need. The cron picks it up 6 min before `starts_at`, creates the broadcast, and the live page goes live the moment Riverside starts pushing RTMP.

Today (Phase 1), follow up with Path A or Path B above to create the broadcast.

---

## At-the-studio checklist (the only thing that's truly manual, ever)

1. Be in the right Riverside studio 5 min before the session starts. _(Riverside studios are 1:1 with categories — Yoga studio for Yoga sessions, Workouts studio for Workouts, etc.)_
2. Riverside's RTMP destination is already set to the category's persistent stream key. **Do not touch it.** It's correct.
3. At `starts_at` or just after, click Go Live in Riverside.
4. Riverside pushes RTMP to YouTube. YouTube's `livestream` resource transitions to `streamStatus=active`.
5. The bound `liveBroadcast` auto-transitions to `lifeCycleStatus=live` (if `selfDeclaredMadeForKids=false`, `enableAutoStart=true`, which we set at insert).
6. The member's live page iframe (already loaded in PRE_ROLL state ≤10 min before) starts playing the live video.
7. Run the session.
8. Click End Broadcast in Riverside when finished. YouTube auto-archives the recording to the category's replay playlist within ~minutes.
9. The replay surfaces in `replay_playlists` cache via PM-235b hourly refresh — no manual step.

Total operational involvement per session: be in the studio, click two buttons.

---

## If something goes wrong

### Members report "the live page just shows the replay, not the live video"

`youtube_broadcast_id` is missing on the active `calendar_occurrences` row. Either:
- The cron hasn't run yet (check `cron.job_run_details` for the cron name).
- The row wasn't inserted for this slot.
- The row was inserted but the broadcast-creation API call failed (check EF logs for the cron).

Quick fix: ask Claude in a session "create the broadcast for the current/next Yoga session" — Claude will populate `youtube_broadcast_id` manually and the page will pick it up on the next 5-min Dexie sync (or immediately via the fallback REST GET that fires inside the pre-roll/live window when broadcast_id is null).

### Riverside studio went live but the YouTube broadcast didn't transition to LIVE

Either the broadcast was created with `enableAutoStart=false` (shouldn't happen — our cron defaults it to true), OR the studio is pushing RTMP to the wrong stream key. Check Riverside's destination matches the category's `youtube_stream_id` from the table above.

### Wrong host / wrong title showing on the live page

Edit the `calendar_occurrences` row's per-occurrence override fields (`session_title`, `host_name`, `host_role`, `host_photo_url`). The page repaints from Dexie within 5 min, or instantly with a pull-to-refresh.

### Need to cancel a session

Set `active = false` on the row. Page returns to QUIET state for that category until the next active row's window opens. If a broadcast was already created, it'll sit unused on YouTube — harmless but worth deleting via `liveBroadcasts.delete` if it'll cause member confusion.

---

## What we **never** do

- **Never create broadcasts from YouTube Studio UI.** The UI defaults to per-broadcast unique streams, which breaks the reusable-stream pattern. Always go through the API path (Claude or PM-215 cron).
- **Never touch the persistent stream keys in Riverside.** Each studio's RTMP destination is locked-in correct. Re-pairing them is unnecessary work and risks breaking the binding.
- **Never edit `calendar_occurrences` after a broadcast goes live** (i.e. while `starts_at` ≤ now ≤ `ends_at`). The state machine reads the row continuously; mid-session edits can cause flicker. Edit before or after the window.
- **Never delete past `calendar_occurrences` rows.** They're our record of what aired and when. Set `active=false` if needed, but keep the history.

---

## The manual-add backend — Portal Admin UI

The intake spec above describes the **data we need**. The Portal Admin UI is the **interface for entering it without writing SQL or pasting into a Claude chat**. It exists so Lewis (or anyone running ops) can add, edit, and cancel sessions through a web form, not a SQL editor or a chat handover.

### What it is, at MVP

A new page in the existing `VYVEHealth/vyve-command-centre` admin app, at `admin.vyvehealth.co.uk/calendar` (or `/sessions`). Same magic-link auth pattern Command Centre already uses for Lewis. Same Supabase client setup. **No new infrastructure, no new repo, no new domain — it's a page added to a thing that already exists.**

### Pages

1. **List view (default).** Chronological list of upcoming `calendar_occurrences` rows where `active=true` and `starts_at > now()`. Each row shows: date, time, category, session title, host name, status (UPCOMING / LIVE NOW / past), and edit + cancel buttons.
2. **Add new session.** Form with the 8 intake fields above. Category is a dropdown of the 8 canonical strings (no free text — prevents typos that would break stream binding). Date is a calendar picker, time + duration are number inputs, the rest are text fields. Submit POSTs to `calendar_occurrences` via Supabase client with service-role bypass (admin app only).
3. **Edit existing session.** Same form, pre-filled from the row. Editable up until `starts_at` ≤ now. After that the row is read-only (mid-session edits are forbidden per the playbook do-not list).
4. **Cancel a session.** Sets `active=false`, returns the page to QUIET. If `youtube_broadcast_id` already exists (cron has run or someone created it manually), shows a warning: "Broadcast already created — also delete from YouTube?" with a button that calls `liveBroadcasts.delete`. Default behaviour: leave the broadcast (harmless).

### Phase 2 add (post-MVP)

5. **Bulk add (recurring).** A second form for "every Monday at 06:00 for 4 weeks, this session". Generates 4 rows in one transaction. Most of Lewis's data entry is recurring patterns — this is the high-leverage feature. Skipped for MVP because pasting a block into Claude works fine in the meantime.

### Auth + permissions

- Magic-link auth via Supabase Auth (Command Centre pattern). Same `admin_users` allowlist.
- All writes from the admin app go through service-role; never through the member-facing portal client.
- RLS on `calendar_occurrences` already prevents members from writing — admin reads/writes via service-role bypass.

### What it does NOT do

- **No YouTube broadcast management UI.** PM-215 cron handles all broadcast creation hourly. Lewis never sees a broadcast ID, never copies a stream key, never touches Riverside config from the UI. Broadcasts are a side effect of `calendar_occurrences` rows, fully automated.
- **No Riverside integration.** Riverside studios are pre-configured with persistent stream keys (the 9 reusable streams above) and never touched again. The admin UI knows nothing about Riverside.
- **No host photo upload.** Phase 1 ships with a static set of instructor photos uploaded once to Supabase Storage; the admin UI lets Lewis paste a URL but doesn't upload files. Phase 2 can add direct upload if photo rotation becomes frequent.

### Build estimate

Claude-assisted: **~1 session for MVP** (list + add + edit + cancel), **~half a session for Phase 2 bulk-add**. The auth, the Supabase client, the form patterns — all already exist in Command Centre. This is mostly composing existing primitives, not new infrastructure.

### Order of operations recommendation

**PM-215 cron FIRST**, Portal Admin UI second. Reason: the cron is the high-value piece that removes per-session manual work entirely. The UI is convenience for batch-adding — pasting blocks into Claude works fine in the meantime, and after running a month of sessions through the manual-paste path we'll know exactly what UI affordances actually matter. Building the UI before the cron means we'd be building it without operational learnings, and the cron is the thing that fundamentally changes the day-to-day workflow.

**Sequence:**

1. PM-215 cron build (~1 session) → autonomous broadcast creation
2. 1 month of operations via pasted timetable + Claude (lets us learn what Lewis actually does day-to-day)
3. Portal Admin UI MVP (~1 session) with that month's learnings in hand
4. Bulk-add (~half a session) once MVP has been used for a few weeks

---

## The build state today (24 May 2026)

✅ **8 live page shells** (`/yoga-live.html` + 7 siblings) — PM-251, complete state machine
✅ **`calendar_occurrences` table** with override columns — PM-251 migration
✅ **`service_catalogue` defaults** for host + description — PM-251 migration
✅ **5-state engine** in `session-live.js` — UPCOMING / PRE_ROLL / LIVE / JUST_ENDED / QUIET
✅ **Iframe embed** wired — auto-renders when `youtube_broadcast_id` populates
✅ **9 reusable streams verified** — PM-279 diagnostic
✅ **`replay_playlists` + PM-235b cron** — recordings surface to replay tiles automatically
⏳ **PM-215 cron** — next build session (the autonomous broadcast-creation loop)
⏳ **Portal Admin UI** — backlog, post PM-215 (the no-SQL editor for `calendar_occurrences`; MVP shape captured above)

✅ **Privacy policy locked** — all sessions `unlisted` per Lewis 24 May (PM-279.2)
✅ **Intake spec documented** — 8 fields per session, pasted-block format preferred

Until PM-215 ships, you and Claude are the cron. After it ships, the schedule is the only thing you ever touch. After Portal Admin UI ships, you don't even paste — Lewis types directly into a form.
