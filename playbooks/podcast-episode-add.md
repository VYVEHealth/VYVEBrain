# Adding a new podcast episode

**Audience:** Lewis (and any future operator). Not Claude.
**Last updated:** 23 May 2026 (PM-212).
**Time required:** ~3 minutes per episode.

Adding a new episode to The VYVE Podcast hub in the app is a single Supabase dashboard INSERT. No deploy, no code changes, no Claude needed. Members pick up the new episode automatically on their next 5-minute catalogue sync (or immediately if they hard-refresh the app).

---

## Step-by-step

### 1. Record + publish on Riverside / your podcast host

Same as normal. Get the episode live on Spotify, Apple Podcasts, and Amazon Music. (The portal uses the show-level URLs for now, so the podcast appears in the listener's app and they navigate to the episode there. When PM-212 v2 ships the in-app player, episodes will be per-episode-linked.)

### 2. Pick a thumbnail (optional but recommended)

Either: (a) upload the episode artwork to your VYVE Drive folder, copy the file's Drive ID from the share URL, paste it into the SQL below as `https://drive.google.com/thumbnail?id=YOUR_ID&sz=w400`. Or: (b) skip the thumbnail entirely (use `NULL`) — the card will show the VYVE logo on a teal gradient as the fallback, which looks deliberate.

### 3. Run this in Supabase SQL editor

Open `ixjfklpckgxrwjlfsaaz` → SQL Editor → paste, edit the fields in CAPS, and run:

```sql
INSERT INTO public.podcast_episodes
  (id, title, description, thumbnail_url, section, spotify_url, apple_url, amazon_url, display_order, active)
VALUES (
  'ep_GUEST_SLUG_HERE',                                  -- short unique id (e.g. 'ep_sarah_jones')
  'Episode Title — With Guest Name',                      -- shown as the card title
  'Two-to-three-sentence summary of the episode.',        -- shown below the title, clamped to 3 lines on the card
  'https://drive.google.com/thumbnail?id=DRIVE_ID&sz=w400',  -- or NULL for VYVE-logo fallback
  'latest',                                               -- 'latest' for new releases (top section); 'archive' for Everyman legacy
  'https://open.spotify.com/show/1IytZMMcWBVlyTzfTxBfnq',
  'https://podcasts.apple.com/us/podcast/the-everyman/id1673004879',
  'https://music.amazon.co.uk/podcasts/the-everyman',
  0,                                                      -- display_order: lower = earlier in section. Set to 0 to land at top.
  true
);
```

### 4. Bump display_order so the new episode lands first

Optional but usually wanted. After inserting with `display_order = 0`, the rest of the Latest section still has 1, 2, 3, 4... so the new episode does sit at the top. If you want a more deliberate ordering, you can shuffle:

```sql
-- Push everything in 'latest' one place down, then your new ep at 1.
UPDATE public.podcast_episodes
SET display_order = display_order + 1
WHERE section = 'latest' AND id != 'ep_GUEST_SLUG_HERE';

UPDATE public.podcast_episodes
SET display_order = 1
WHERE id = 'ep_GUEST_SLUG_HERE';
```

### 5. (Optional) Move an old "latest" to "archive"

When you've published a few new episodes and one of the older "latest" rows has rolled off the front, flip it:

```sql
UPDATE public.podcast_episodes
SET section = 'archive', display_order = 8  -- pick a sensible archive position
WHERE id = 'ep_OLDER_EPISODE';
```

### 6. Verify

Open `online.vyvehealth.co.uk/podcast.html` in a browser (or pull-to-refresh the app). Within ~5 minutes the new episode appears. If it doesn't show:

- Check the row is `active = true` (default).
- Check `section` is exactly `'latest'` or `'archive'` (the CHECK constraint enforces this — a typo gives an error).
- Hard-refresh the page (Cmd+Shift+R on desktop; or kill + reopen the app on mobile).

---

## What the columns do

| Column | Purpose |
|---|---|
| `id` | Stable string PK. Pattern: `ep_<short_slug>`. Once set, don't change it. |
| `title` | Card title. Card clamps to 2 lines, so keep it tight. |
| `description` | Card body. Card clamps to 3 lines. Two clean sentences is the sweet spot. |
| `thumbnail_url` | Image URL or NULL. NULL → VYVE logo over teal gradient. Drive URL works; Supabase Storage URL works; anything publicly fetchable works. |
| `section` | `'latest'` puts it in the top "Latest Episodes" group. `'archive'` puts it in "The Everyman Archive" below. |
| `spotify_url` / `apple_url` / `amazon_url` | External listen-on links. Tap on the card opens the platform's app or web player. Per-episode URLs would be better than show-level — currently all three point to the show level because the page doesn't have an in-app player yet. |
| `display_order` | Sort within section, ascending. Lower number = earlier. Reorder by UPDATE — see step 4 above. |
| `active` | Set to `false` to hide an episode without deleting it (e.g. if a guest asks for takedown). |

---

## When the in-app player ships (v2, post-trial)

A future build will add an `audio_url` column to this table. New episodes will need that field filled with a public MP3/AAC URL (probably hosted in a `podcast-episodes` Supabase Storage bucket). Existing rows will pick up audio progressively as masters are uploaded. The external-link buttons stay regardless — members may still prefer Spotify-on-Carplay or Apple Watch listening.

When that ships, this playbook gets a step 0 ("upload audio to Storage") and the SQL gains an `audio_url` field.

---

## Bulk edits

If you want to edit multiple episodes at once (e.g. rebrand pass, fixing thumbnails for the 12 archive episodes that don't have them), it's still a single SQL statement:

```sql
UPDATE public.podcast_episodes
SET thumbnail_url = CASE id
  WHEN 'ep_dionne_slater'   THEN 'https://drive.google.com/thumbnail?id=NEW_ID_1&sz=w400'
  WHEN 'ep_male_friendships' THEN 'https://drive.google.com/thumbnail?id=NEW_ID_2&sz=w400'
  -- ...
END
WHERE id IN ('ep_dionne_slater','ep_male_friendships', ...);
```

---

## Why this works without a deploy

The portal pulls episode rows from Supabase via the Dexie catalogue sync layer. Every member's app re-fetches `podcast_episodes` every 5 minutes when they're using the app, and immediately on page-load if it's been more than 5 minutes since the last fetch. So Supabase is the live editor surface — the app's HTML/CSS/JS doesn't change, only the data does.

This is the same pattern Calendar uses (calendar_occurrences table). Same pattern Mind catalogues use (breathwork_patterns, affirmations_library). Same pattern your service_catalogue uses for live sessions.

It's not magic — it's deliberately the simplest possible content workflow until we have time to build a proper Portal Admin editor surface (post-launch).
