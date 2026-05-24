# Live Sessions — End-to-End Operations Playbook

**Owner:** Lewis (commercial / scheduling) + Dean (technical / cron infra) · **Last updated:** 24 May 2026 (PM-286) · **Status:** PM-215 cron LIVE. Castr trial pending. Content recording in progress.

---

## The model in one paragraph

A live session is a row in `calendar_occurrences` with `type='live_session'`, a `category` (one of the 8 canonical strings), `starts_at` / `ends_at` timestamps, and once a broadcast is created — a `youtube_broadcast_id`. The hourly `session-publish` cron walks future rows, creates the YouTube broadcast, binds it to the category's reusable RTMP stream key, adds it to the category's replay playlist, and writes the broadcast id back. The member-facing live page (PM-251 state machine) reads this row from Dexie, looks at the clock, and renders the right state: countdown card 10+ min out, pre-roll iframe ≤10 min out, live iframe inside the window, just-ended replay banner ≤30 min after, latest replay card otherwise. Lewis (or Castr scheduled stream) pushes RTMP to the right stream key at the scheduled time. Replays auto-archive to the category playlist. Members see them on the replay page within an hour via `refresh-replay-videos` cron. **Operationally fully automated end-to-end from `calendar_occurrences` row to member-visible live session and replay.**

---

## Channel + stream architecture (the corrected version, PM-286)

**One YouTube channel.** `UCuptZFgSk0ZmNnE2IbYBdtg` "VYVE". Every live session and every replay lives on this one channel. The OAuth principal `team@vyvehealth.co.uk` manages this channel. There are no other VYVE channels.

**Nine reusable RTMP stream keys, all on that one channel.** Each key routes RTMP traffic to a specific category's broadcasts. Configured once into the matching Riverside studio; never touched again. PM-279 verified all 9 keys are `isReusable=true`. They can be re-used across unlimited broadcasts over time.

**Eight playlists, all on that one channel.** One per category. PM-215 cron auto-adds each new broadcast video to its category's playlist via `playlistItems.insert`, so replays auto-categorise on the portal.

### The canonical stream + playlist routing (`session_categories` table — single source of truth)

| Category | Stream key (RTMP destination) | Playlist (replay destination) | Riverside studio |
|---|---|---|---|
| Yoga, Pilates & Stretch | `uptZFgSk0ZmNnE2IbYBdtg1773787341014499` | `PLyaCafiXVsshk0I0Z9ii4qeT7CSItwgU2` | Yoga, Pilates & Stretch |
| Mindfulness & Mindset | `uptZFgSk0ZmNnE2IbYBdtg1773787428540514` | `PLyaCafiXVssjw0wn0ECO8Rh6_kme91MLV` | Mindfulness & Mindset |
| Workouts | `uptZFgSk0ZmNnE2IbYBdtg1773787528049051` | `PLyaCafiXVsshhnwd6-Hfyxn1Z2OKNCLfM` | Workouts |
| Weekly Check-In | `uptZFgSk0ZmNnE2IbYBdtg1773787612302221` | `PLyaCafiXVssiL0asHJhhwTE-78PX7Ut4m` | Weekly Check-In |
| Group Therapy | `uptZFgSk0ZmNnE2IbYBdtg1773787742902658` | `PLyaCafiXVssjAUHO8SN5l9K1zqlNWVlTU` | Group Therapy |
| Events & Run Club | `uptZFgSk0ZmNnE2IbYBdtg1773787842061692` | `PLyaCafiXVssiPt5whqWDiK0EVTMYxbCyh` | Events |
| Podcast | `uptZFgSk0ZmNnE2IbYBdtg1773787932659198` | `PLyaCafiXVssjZdvH9iqA7A5-l5KQZUINU` | Podcast |
| Education & Experts | `uptZFgSk0ZmNnE2IbYBdtg1773786554581556` | `PLyaCafiXVssj7hcKLfbS32n0xf6prOysa` | Education & Experts |

A 9th stream key (`...1773786332742438` "Default") exists but is unmapped — spare for ad-hoc use.

To update: `UPDATE public.session_categories SET youtube_stream_id = '...' WHERE category = '...';` — no code change needed; cron picks up the new value on next hourly run.

---

## What you do, weekly — the human steps

1. **Build / approve the timetable.** Decide what's airing in the coming 1–4 weeks. Most categories recur weekly at the same slot (Yoga Mon/Wed/Fri 06:00, Workouts Tue/Thu 07:30, etc.); a few are ad-hoc (Events, guest spots, Podcast drops).
2. **Get `calendar_occurrences` rows populated.** Today via SQL handover; soon via Portal Admin UI.
3. **Get content into Castr** — upload MP4s, schedule against the category's stream key, point at the YouTube destination.
4. **(Optional, Phase 2)** Be in the matching Riverside studio at the scheduled time and press Go Live for genuinely-live sessions.

That's the entire weekly loop. Steps 1-3 are batch work, done once a week. Step 4 is per-session and only applies to live (not Castr-scheduled) sessions.

---

## Session intake spec — what we need per session

For every session — recurring or one-off — we need this row. Most rows are recurring (same category, host, slot week-to-week) so per-row entry collapses to whatever's actually changing.

| Field | Required? | Example | Notes |
|---|---|---|---|
| **Category** | Yes | `Yoga, Pilates & Stretch` | Must match one of the 8 canonical strings exactly. Drives stream binding + replay playlist. |
| **Start** | Yes | `2026-05-26 06:00` | Local time (BST/GMT auto-handled). Stored as UTC in `starts_at`. |
| **Duration (mins)** | Yes | `45` | Used to compute `ends_at = starts_at + duration`. Trial sessions typically 30-40 min. |
| **Session title** | Yes | `Morning Flow` | The episode/session name. Max ~60 chars (YouTube caps title at 100). |
| **Description** | Yes | `A grounding flow to start the day strong.` | 1–2 sentences, max ~140 chars. Shown under title on live page + on YouTube. |
| **Host name** | Yes | `Emma Clarke` | Person leading the session. |
| **Host role** | Optional | `Yoga Lead` | Defaults to `service_catalogue.default_host_role` if blank. |
| **Host photo URL** | Optional | `https://.../emma.jpg` | Bucket URL. Lewis curates 4–5 instructor photos once; thereafter inherits from catalogue. |

### Preferred handover format

A pasted block in chat, one line per session:

```
Mon 26 May 06:00 · 45min · Yoga · "Morning Flow" · Emma Clarke · A grounding flow to start the day strong.
Wed 28 May 06:00 · 45min · Yoga · "Power Flow" · Emma Clarke · A stronger flow to build heat and capacity.
Tue 27 May 07:30 · 40min · Workouts · "Full Body Strength" · Calum Denham · Compound lifts and accessories.
Thu 29 May 12:00 · 30min · Mindfulness · "Midday Reset" · James Reid · Breathwork plus seated meditation.
```

Claude parses, validates against the 8 canonical categories, computes `ends_at`, inserts/updates `calendar_occurrences` rows in one turn. **PM-215 cron then picks up the row at HH:05 in the hour before `starts_at` and creates the broadcast automatically.** Lewis never touches YouTube directly.

### Cadence

**Monthly batches.** End of each month, Lewis and Dean agree the next month's timetable, paste into chat, Claude populates rows. Ad-hoc sessions added as they come up.

---

## How content gets streamed (Castr, today's primary path)

**Castr Starter monthly $19.99/mo.** Chosen 24 May 2026 (PM-279.2). 7-day free trial available before paying. Monthly billing for trial flexibility — can cancel anytime as the model evolves toward genuinely-live sessions.

### One-time Castr setup

1. Sign up for Castr Starter (trial first, paid after validation).
2. Connect to YouTube Events for the VYVE channel (single one-time OAuth).
3. Confirm Castr can target individual RTMP stream keys (each session's Castr scheduled stream uses the matching category's stream key from the table above).

### Per-session (weekly batch in Castr)

1. In Castr dashboard → Pre-recorded Streams → New Pre-recorded Stream.
2. Upload the MP4 (or import from Google Drive/Dropbox).
3. Schedule for the matching `calendar_occurrences.starts_at` time.
4. Set destination = the category's RTMP stream key (from the table above) OR connect to the matching YouTube event (PM-215 cron will have created it by then if the session is within 60 min).
5. Save. Castr automatically pushes RTMP at the scheduled time.
6. YouTube receives RTMP, broadcast goes live (PM-215 has already created the broadcast and bound it to the stream).
7. Members see the live session at `online.vyvehealth.co.uk/{category}-live.html` via the iframe rendered by `session-live.js`.

### How PM-215 + Castr stack together

```
  Lewis adds calendar_occurrences row (Mon 09:00 Yoga, MP4 ready)
            │
   (at HH:05 in the hour before)
            ▼
  PM-215 cron (session-publish EF)
   ├─ Creates youtube broadcast (unlisted)
   ├─ Binds to Yoga stream key
   ├─ Adds to Yoga playlist
   └─ Writes broadcast_id back to row
            │
   (at scheduled starts_at)
            ▼
  Castr scheduled stream fires
   └─ Pushes RTMP to Yoga stream key
            │
            ▼
  YouTube broadcast goes LIVE
            │
            ▼
  Live page (yoga-live.html) renders iframe
   └─ Member watches live
            │
   (when stream ends)
            ▼
  YouTube auto-archives video
   └─ Already in Yoga playlist (PM-215 added it pre-broadcast)
            │
   (within 1 hour)
            ▼
  refresh-replay-videos cron picks up new video
   └─ Replay surface updates on portal
```

**No manual YouTube step. Ever.** Lewis only touches: the `calendar_occurrences` row (or Portal Admin UI), and Castr.

---

## Future path — genuinely live sessions via Riverside

When Lewis is ready to do genuinely-live sessions (e.g. June+ as instructors come on):

1. Set `calendar_occurrences.source_type = 'live_riverside'` (when this column ships).
2. Lewis at the matching Riverside studio at `starts_at` and presses Go Live.
3. Riverside pushes RTMP to the same stream key the cron already bound.
4. Member sees live broadcast just like Castr-scheduled.

**Zero code change required between Castr and Riverside modes.** Same stream keys, same broadcasts, same iframe, same replay flow. The only difference is what's pushing RTMP at the scheduled time.

---

## The manual-add backend — Portal Admin UI (NOT YET BUILT)

The intake spec above describes the **data we need**. The Portal Admin UI is the **interface for entering it without writing SQL or pasting into a Claude chat**.

**Status.** Spec defined here; build deferred until after ~1 month of operational learnings via the pasted-timetable path. Reason: build the UI with usage data, not without it.

**Where it lives.** New page in the existing `VYVEHealth/vyve-command-centre` admin app at `admin.vyvehealth.co.uk/calendar`. Same magic-link auth, same Supabase client. No new infrastructure.

### MVP scope (~1 session, Claude-assisted)

1. **List view** — chronological `calendar_occurrences WHERE active=true AND starts_at > now()`. Each row: date · time · category · title · host · state badge (UPCOMING / LIVE / past) · `youtube_broadcast_id` status (pending / created) · edit/cancel buttons.
2. **Add new session form** — 8 intake fields. Category is a dropdown (8 canonical strings, no free text). Date picker, time input, duration in mins. Submit POSTs to `calendar_occurrences` via service-role.
3. **Edit form** — same form pre-filled. Locked once `starts_at <= now()` (no mid-session edits per playbook do-not list).
4. **Cancel** — sets `active=false`. If `youtube_broadcast_id` already exists, optional "Delete broadcast from YouTube too?" with a one-click delete via `yt-broadcast-delete` EF.

### Phase 2 (~half session)

5. **Bulk add for recurring** — "every Mon/Wed/Fri at 06:00 for 4 weeks, this category, this host, this title". Generates N rows in one transaction.

### What it does NOT do

- No YouTube broadcast management UI. PM-215 cron handles all broadcast creation automatically. Lewis never sees a broadcast ID or stream key.
- No Riverside integration. Studios pre-paired to persistent streams; never touched.
- No host photo upload — paste URL only (Phase 3 if needed).
- No replay management. Replays auto-surface via `replay_playlists` + PM-235b cron.
- No Castr integration. Castr is a separate dashboard Lewis uses directly.

---

## At-the-Castr-dashboard checklist (weekly)

1. Open Castr → Pre-recorded Streams.
2. For each session in next week's timetable:
   - New Pre-recorded Stream
   - Upload MP4 (or pull from Google Drive)
   - Set scheduled date/time matching `calendar_occurrences.starts_at`
   - Set destination = matching category's RTMP stream key
   - Toggle on
3. Done — Castr handles everything else.

Total time per week: ~10-15 minutes for 7-10 sessions.

---

## If something goes wrong

### Members report "the live page just shows the replay, not the live video"

`youtube_broadcast_id` is missing on the active `calendar_occurrences` row. Either:
- The cron hasn't run yet (check `cron.job_run_details` for `session-publish-hourly`).
- The row wasn't inserted for this slot.
- The row was inserted but the broadcast-creation API call failed.

**Quick fix:** invoke `session-publish` EF manually:
```sql
SELECT net.http_post(
  url := 'https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/session-publish',
  body := '{}'::jsonb,
  timeout_milliseconds := 60000
);
```
Then check `net._http_response` for the result body.

### Castr pushed RTMP but YouTube didn't show live

Either the broadcast was created with `enableAutoStart=false` (shouldn't happen — cron defaults to true), OR Castr is pushing to the wrong stream key. Check Castr's destination matches the category's `youtube_stream_id` from the table above.

### Replay not appearing on portal after session ends

`refresh-replay-videos` cron runs hourly. Up to 1 hour delay is expected. If it's been longer:
- Check YouTube channel directly — is the video archived?
- Check `replay_playlists.last_refreshed_at` — when did the cron last run?
- Manually invoke `refresh-replay-videos` to force a refresh.

### Wrong host / wrong title showing on the live page

Edit the `calendar_occurrences` row's per-occurrence override fields (`session_title`, `host_name`, etc.). Live page repaints from Dexie within 5 min, or instantly with pull-to-refresh.

### Need to cancel a session

Set `active = false` on the row. Page returns to QUIET state. If a broadcast was already created, delete it via:
```sql
SELECT net.http_post(
  url := 'https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/yt-broadcast-delete',
  body := '{"broadcastId":"<the_id>"}'::jsonb,
  timeout_milliseconds := 15000
);
```

---

## What we never do

- **Never create broadcasts from YouTube Studio UI.** The UI defaults to per-broadcast unique streams, breaking the reusable-stream pattern. Always go through PM-215 cron OR ask Claude to call the API.
- **Never touch the persistent stream keys in Riverside or Castr destinations.** Set up once, locked-in correct.
- **Never edit `calendar_occurrences` after a broadcast goes live** (while `starts_at` ≤ now ≤ `ends_at`). State machine reads continuously; mid-session edits cause flicker.
- **Never delete past `calendar_occurrences` rows.** They're our record. Set `active=false` to hide.
- **Never set broadcast privacy to `public`** from `session-publish` cron — it's hard-coded to `unlisted`. To override (rare, for marketing surfaces), edit the broadcast in YouTube Studio after creation.

---

## The build state today (24 May 2026 PM-286)

✅ **8 live page shells** (`/yoga-live.html` + 7 siblings) — PM-251
✅ **`calendar_occurrences` table** with override columns — PM-251
✅ **`service_catalogue` defaults** for host + description — PM-251
✅ **5-state engine** in `session-live.js` — UPCOMING / PRE_ROLL / LIVE / JUST_ENDED / QUIET
✅ **Iframe embed** wired — auto-renders when `youtube_broadcast_id` populates
✅ **9 reusable streams verified** — PM-279
✅ **Replay infrastructure** — `replay_playlists` + `refresh-replay-videos` hourly cron
✅ **PM-215 `session-publish` cron LIVE** — hourly broadcast creation autonomous (PM-286)
✅ **`session_categories` routing table** — single source of truth for stream + playlist mapping
✅ **Privacy locked `unlisted`** — hard-coded in cron, cannot be overridden from automation
✅ **Architecture documented correctly** — one channel, 9 keys, 8 playlists
⏳ **Castr account + trial** — pending Lewis signup
⏳ **First trial content** — Calum/Emma/Phil to record
⏳ **June 1 launch** — first scheduled sessions
⏳ **Portal Admin UI** — backlog, post first-month of operational learnings

Until Portal Admin UI ships, Lewis adds rows via Claude handover. After that, Lewis types into a form. **The cron handles everything else autonomously, indefinitely.**
