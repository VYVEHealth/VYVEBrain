**PM-1219 (2026-09-13, 01:30): RMP IMPORT TORN DOWN EXCEPT THE STRETCHES — migration `pm1219_rmp_teardown_keep_stretches`. No repo change.**

Dean, reviewing the coach library against Rehab My Patient's browse UI: the ~5,000 imported RMP rows go, the stretches stay. Live before: 4,876 `rmp:%` rows on the rehab shelf on Dean's partner `a23478c8` (S&C 949, General 497, Senior 454, Knee 255, Hip 243, Shoulder 232, Advice 175 …), all with `video_url`. **Deleted 4,398** (everything where `subcategory IS DISTINCT FROM 'Stretching'`). **Kept 478** tagged Stretching (PM-1216's keyword tag — 57 of them are Nerve Glides, which the tagger classed as stretching) and promoted them to stock: `partner_id NULL`, `library 'strength'`, `category 'Stretching'`, the body region moved into `subcategory` so `exSubChips` paints the region chips under it with no code change. `source_slug 'rmp:%'` kept on purpose — one DELETE removes them when VYVE's own recordings exist. Coach library now = 977 VYVE stock + 478 stretches (+ own). `rehab_plan_items.exercise_id` is `ON DELETE SET NULL` and items snapshot by value, so the test rehab plan `9c1e6a2b…` still renders; three of its items now point at nothing.

**Consequence for the physio demo:** `physio-portal.html` Library drops from 4,876 to 478 and loses RMP's body-region categories, diagnosis-led browse and the subcategory chips' demo data. The prospective-PT demo library is gone; if that demo is still wanted it is a re-import (PM-1207 recipe) — Dean's call.

**Flagged and accepted:** the 478 are embeds of RMP's public YouTube channel with their watermark, now stock content every coach sees (§23.331 was holding stock back for our own videos). Dean heard the exposure — embedding can be switched off or the channel pulled at any time, and it is their brand inside our clients' app — and kept them as a placeholder shelf. **Lewis should know.** VYVE-video-first stays the resolver rule.

**Open:** Dean said "go back to our sort of 200 exercises for now" — the coaching stock is the 977 VYVE rows (PM-958/985), which were not touched; if he means a curated ~200 (the Workout Engine v2 pack was 270), that is a separate trim. Library browse redesign (RMP-style left rail with counts, search, card grid with Add · info · play, favourites, My exercises) is now the centre of Calum Batch 2 — mockup first.

---

