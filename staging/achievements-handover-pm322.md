# PM-309 Achievements Design — Handover Prompt for Next Chat

> Paste the block below verbatim into a new chat to resume from where PM-322 closed.
> Last session shipped the design lock + Path B mockup + brain close (this commit).
> Next session opens with item D (data-model decision) and runs C and A in parallel.

---

```
Load VYVE brain.

Continuing the PM-309 Achievements design session from a previous chat that compacted. Here's the locked state, ready to build:

DESIGN DECISIONS — all locked, do not re-open:

1. Catalog: ~90 achievements, ~282 tiers across 6 pillars (Body 22 / Habits 11 / Mind 13 / Connect 17 / Check-ins 9 / Focus 8) + 10 hidden cross-pillar. Full catalog draft committed to brain/staging/achievements-catalog-v1.md.

2. Layout: Direction C — Hero (latest unlock + next-to-unlock + recent) over a collapsed pillar-grouped map. Six pillar cards, tap to expand. Mockup live at /achievements-mockup-c.html in vyve-site.

3. Tier pattern: Pattern 3 — one row per metric that climbs through tiers. Not one row per tier. Earned tiers remembered via gold dots underneath the row, plus the badge itself changing as the member climbs.

4. Badge visual: PATH B (chosen over plain Pattern 3 numerals). Each metric has a Lucide icon (dumbbell for workouts, footprints for cardio, wind for movement, activity/pulse for reps, route for distance, trophy for session bests, timer for longest workout, sunrise for early-morning behavioural, etc.). The icon sits inside a tier-coloured frame. The icon stays the same as the member climbs; the FRAME evolves: bronze → silver → gold → sapphire → ruby → emerald → amethyst → pearl → obsidian → diamond. Tier number lives in a small corner pip. Locked = dashed-outline frame, faded icon, no pip. Full design spec at brain/staging/achievements-tier-design.md. Mockup live at /achievements-mockup-pathb.html in vyve-site.

5. Tier naming: "Sapphire · The Warrior" pattern — universal gemstone language + Lewis-approved VYVE name. v1 cert names (Warrior, Architect, Relentless, Elite, Explorer) are preserved where they fit and extended to fill up to 10 tiers across each metric. Most metrics top out between 4 and 7 tiers — only the most ambitious reach diamond.

6. PBs: OUT of the achievements catalog entirely. Surfaced inline post-set on the workout page ("New PB on Deadlift: 142.5kg"). Different feature, different ticket. Strava-style — the activity is the home, not the achievements page.

7. Notifications: batched when multiple earn at once ("You've earned 5 achievements — tap to see"). Not 5 separate toasts. Spam-defence assumption holds: cadence hardens naturally as the easy tiers fall.

8. Hidden achievements: 10 sprinkled across the catalog for delight. Confirmed list (honest_checkin_tier5, came_back, full_house, first_light, owl, reciprocity, streak_saver, anniversary, quiet_wins, comeback_PB). Visible-as-placeholder treatment ("Hidden achievement · Keep showing up honestly") — the slot exists but the reward isn't spoiled.

DATA STATE — confirmed live in Supabase project ixjfklpckgxrwjlfsaaz:
- achievement_metrics: 32 rows (v1 catalog intact)
- achievement_tiers: 327 rows, all copy_status='approved' (Lewis-signed-off across two sessions 27 April)
- member_achievements: 344 earned tiers across 20 members
- Migration policy needed: how the existing 344 earns map onto the new ~282-tier shape so members don't lose history.

WHAT'S LEFT BEFORE BUILD CAN START:

A. Lewis copy pass — extending the v1 327-tier copy to the new ~282-tier shape, picking which v1 tier names survive into which v2 metric ladders, and writing new copy for the ~13 NEW metrics (Mind/Connect/Focus pillars + behavioural+hidden achievements that didn't exist in v1).

B. Phil sign-off on HAVEN-related framing — any achievement in Mind/Check-ins where HAVEN persona language matters. The honest_checkin hidden achievement especially.

C. Migration map — explicit table of which v1 metric_slug + tier_index maps to which v2 metric_slug + tier_index, plus what happens to v1 earns that have no v2 home (carry as legacy? collapse into the closest v2 metric? drop?).

D. Data model decision — extend the existing achievement_metrics / achievement_tiers / member_achievements tables (preserves 344 earns naturally, dirtier schema) versus new tables + migration (cleaner schema, more work, more risk to existing earns).

WHAT I WANT FROM THE NEXT SESSION:

Start with item D — make the data-model call. If we extend existing tables, scope the schema delta (new columns? new rows only?). If we create new tables, scope the migration script.

Then attack items C and A in parallel — Claude does C (the migration mapping table) while we tee A up as a Lewis-owned ticket once the structure is locked.

Build only starts AFTER items A/B/C/D are settled. No code yet.

Reference artefacts in this repo:
- brain/staging/achievements-catalog-v1.md — full catalog with tier counts per pillar
- brain/staging/achievements-tier-design.md — 10-tier visual spec, badge treatment per tier
- brain/staging/achievements-handover-pm322.md — this prompt
- vyve-site /achievements-mockup-c.html — Direction C structure mockup
- vyve-site /achievements-mockup-pathb.html — Path B icon+tier-frame mockup

Both mockups can be deleted from vyve-site whenever the build ships.
```
