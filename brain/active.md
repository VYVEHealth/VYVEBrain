# VYVE Brain — Active Working Set

> Session-scoped current state. Read this at session start. Do NOT read master.md / changelog.md / backlog.md unless this file points you to a specific section that's not in here.
>
> **Last §2-rebuild:** 16 May 2026 PM-153 (habits.html paint audit complete). §0/1/3/4/6/7/8 durable, last full rebuild PM-77/PM-84.
> **Target ceiling:** 35KB.
>
> If this file disagrees with master.md or changelog.md, this file is wrong and needs a rebuild. Tell Dean.

---

## 0. How to use this file

**Read order at session start (the new "Load VYVE brain" routine):**

1. This file (`brain/active.md`) — always, in full.
2. `playbooks/premium-feel-campaign.md` — currently the active campaign. Always while campaign is open.
3. Last 3 changelog entries via grep, NOT the full file: `grep -n "^## 2026-" brain/changelog.md | head -3` then read those entries via line-range view.
4. Only fetch master/changelog/backlog full files if a question explicitly needs history this file doesn't carry.

Total typical load: ~50-80KB. Versus the old 1.65MB. Stay within this budget.

**Operating mode for this campaign (LOCKED 13 May 2026 PM-77 — do not deviate without explicit Dean override):**

- **Claude leads, Dean drives.** When Claude faces a technical decision between options, Claude decides and moves forward. Dean retains veto by saying "no, do it differently" — but the default is forward motion, not menu presentation. Asking Dean "should we use X or Y" wastes his time. He has said clearly he is fully led by Claude.
- **Architectural commitment is immutable** (see §3). Future Claudes may not propose pivoting away from local-first without producing a specific measured problem this architecture can't solve.
- **It is not a PWA.** VYVE is a Capacitor-wrapped native iOS+Android app with web fallback at online.vyvehealth.co.uk. If any session references "PWA", correct it. The "PWA install prompt" code in index.html is legacy and slated for removal.
- **Single-device-per-user is the working assumption.** Conflict resolution = last-write-wins. No per-table conflict policy work. Multi-device edge cases triaged post-launch.
- **All existing member data wiped at launch (31 May 2026).** No data-migration concerns. Every member day-1 is a new member with empty local DB.
- **Session granularity matches Dean's reality.** He works in long evening sessions (3-6 hours), all-day Sundays, and small commute/lunch windows (15-90 minutes). Tasks in the campaign playbook are sliced so any window can pick up a task and ship it.
- **Brain is the contract.** Every session-end updates active.md (always) + the campaign playbook (if task progressed) + master/changelog/backlog (only on architectural changes or campaign closures). One atomic commit.
- **No more architectural surprises.** If a deviation must happen, it must be justified against §3 in the changelog and Dean must approve in chat.

---

## 1. Source-of-truth chain

Live > Brain > Chat history.

- **Live = Supabase + GitHub vyve-site + GitHub VYVEBrain main branches.** Always canonical for state.
- **Brain = this file + playbooks + master/changelog/backlog.** Canonical for narrative, decisions, history.
- **Chat history = transient.** May contain stale numbers, abandoned approaches, in-the-moment thinking. Trust brain over chat.

When the three disagree:
- Numbers (table counts, EF versions, member counts, SHAs) → fetch live via Supabase/GitHub tools, never trust cached values.
- Decisions and architecture → trust brain master/this file's §3.
- Open questions → check changelog tail first.

---

## 2. Live state snapshot (refreshed every session-end)

**SESSION HANDOFF — 2026-05-21 (PM-184: brain audit + Bundle-Ready campaign reframe).** Strategy-mode session in parallel with PM-183 build session. Dean opened the chat with "what started off as a few things to do to get the app to feel premium has quickly changed" — audit triggered.

Six files committed atomic to VYVEBrain main: master.md (§19 collapsed, §21 rewritten), active.md (§2 prepend / §3 reframe / §5 reorder — this file), changelog.md (PM-184 entry), backlog.md (Bundle-Ready six-phase reorder), playbooks/bundle-ready-campaign.md (NEW ~16KB), playbooks/offline-correctness-audit.md (NEW ~8KB).

**The Bundle-Ready Campaign — locked PM-184.** Six phases serving one goal: ship a bundled iOS + Android app that members can use offline. Phase 0 (Mind v1) SHIPPED. Phase 1 (Body section consolidation) next. Phase 2 (Connect section build), Phase 3 (Pillar realignment — home, engagement, weekly check-in, monthly check-in, certificates all reframe around Mind/Body/Connect), Phase 4 (offline-correctness sweep — PRE-BUNDLE GATE), Phase 5 (Bundle + OTA), Phase 6 (external-blocker items off the critical path). Full reference: `playbooks/bundle-ready-campaign.md`.

**Formal PF-40 closure.** Original 12-sub-item scope was the wrong scaffolding (PM-111 device walk diagnosed real bug as cache-writer/template shape mismatch, not structural Dexie issue). Mind section v1 (PM-173–183) demonstrated the §23.39 optimistic-first skeleton organically replacing what PF-40.4 (write API) would have been. Post-launch sub-items PF-40.3 through PF-40.12 closed as superseded; functionality re-absorbed into the Bundle-Ready phases above.

**§19 in master.md collapsed.** Had 23 stacked "current status" entries — that section is supposed to be current, singular. This file (§2) is the actual handoff document and works correctly. §19 in master.md now carries a single fresh PM-184 entry; historical session-by-session content remains in changelog.md.

**Architectural commitment unchanged.** §3 of this file restates the immutable PM-77/PM-106 commitment — Dexie source of truth, Capacitor wrapped native, single-device-per-user, Supabase as sync target. The Bundle-Ready campaign IS the Premium Feel campaign in its mature form; commitment isn't new, just the framing.

**§23.41 caught drift this session.** Initial audit load at 22:00 BST; SHA refresh at 22:30 BST showed all four brain files had drifted — PM-183 parallel session had landed in the gap. Re-fetched via git-blob-API at refreshed SHAs, confirmed parallel commit was downstream-of-audit (findings remained valid), no merge work needed. Worked as designed.

**Production state of vyve-site at this commit.** Production iOS 1.3 (2) + Android 1.0.3 (10) bundled-mode at SHA `83874dd5` (frozen since 15 May per PM-115/116). Main HEAD `f44c7104` (PM-183 mind.html hub) — does not reach members until next OTA bundle via Capawesome. Dean's dev iPhone via `server.url` sees main HEAD immediately.

**Next session pickup: Phase 1 — Body section consolidation.** Decide `body_activities` table shape (table vs view — default table per recent pattern), ship migration + body.html + sub-page audit. Estimated 2-3 sessions.

**Bug flagged for Phase 2 (PM-184.1, 21 May 2026 — Dean reported):** Live sessions page view not updating live sessions progress. `session_views` rows likely log correctly but downstream progress counters (Today's progress, Day streak, engagement-score Variety) don't reflect the view. Diagnose during Phase 2 sub-page audit. See `tasks/backlog.md` Phase 2 entry for full root-cause hypothesis.

**SESSION HANDOFF — 2026-05-21 (PM-183.6: mind.html missing script stack — the actual root cause).** PM-183.1 through PM-183.5a treated symptoms because the diagnosis was wrong. The PM-183.5a always-on diagnostic overlay (`?debug=mind` had been gated to Safari, which has separate IDB stores from the Capacitor app — useless) screenshot from Dean showed the answer:

```
[t=0] VYVELocalDB? false
[t=0] mind_activities? false
[t=1000ms] cannot query dexie — missing prereq
```

mind.html was authored without the Dexie stack. Page loaded only `theme.js`, `auth.js`, `sw.js` register, inline IIFE, `nav.js`. Missing: `dexie.min.js`, `bus.js`, `db.js`, `vyve-offline.js`, `sync.js`. Every Dexie call in the IIFE silently fell through the `if (window.VYVELocalDB && ...)` guard. From outside it looked like Dexie was returning empty; in reality Dexie was never instantiated on this page.

**Fix shipped: vyve-site `c234959a`.** mind.html: added the five missing `<script src>` tags in the canonical breathwork-style order, right after `auth.js`. Diagnostic overlay stripped. PM-183.1-4 scaffolding kept in place — each was architecturally correct in its own right (PM-183.3 merge-not-wipe is a real db.js improvement benefitting all 17 tables; PM-183.4 localStorage snapshot is genuine §23.38 work; PM-183.2 skeleton paint is UX hygiene). sw.js `pm183-5a-diag-on-a` → `pm183-6-scripts-a`. vbb-marker Update 50 → 51. Dean confirmed working.

**New §23 hard rule: §23.44 — A page that reads from Dexie must load the Dexie stack.** Codified in master.md after §23.43. Includes the canonical script order, audit signal (grep the page's `<script src>` declarations before shipping a Dexie-reading page), and the debugging signal (when Dexie reads return empty unexpectedly, falsify `window.VYVELocalDB === undefined` first, not "data missing from Dexie"). Process lesson appended: ship a diagnostic before the sixth treatment when the first five don't move the symptom.

**Audit pass needed.** Every existing portal page containing `VYVELocalDB`, `VYVEBus`, or `VYVESync` in inline JS needs its `<script src>` declarations cross-referenced. The mind.html case was a silent-degrade — same latent bug may exist elsewhere. Flag for Phase 4 (offline-correctness sweep) per PM-184 Bundle-Ready campaign. Affirmations.html already noted as a candidate (no Dexie stack loaded, but doesn't display activity counts so the degradation isn't user-visible).

**Open item flagged for next pass.** PM-183.5a diagnostic at t=4000ms showed snapshot wrote `todayCount:3` despite Supabase having only 2 of today's rows. Probable double-count between §23.39 optimistic write + REST re-read. Catch in the audit pass.

**The fix sequence in summary.**
- PM-183.1 (parallel REST) — chased ghost. Kept as fallback for first-ever-device-login.
- PM-183.2 (skeleton paint) — UX hygiene. Kept.
- PM-183.3 (merge-not-wipe in db.js) — REAL architectural win across all 17 tables. Kept. Earned §23.43.
- PM-183.4 (localStorage snapshot) — REAL UX win for instant cold-load. Kept. §23.38 applied.
- PM-183.5/5a (diagnostic overlay) — produced the answer. Stripped after PM-183.6.
- PM-183.6 (add five script tags) — THE ACTUAL FIX. One commit. Earned §23.44.

Process cost: ~7 commits, ~3 hours, ~2KB of brain churn. Could have been 1 commit + 30 minutes if PM-183.5 was PM-183.2.

**Dean confirmation (Update 51, 01:30 BST).** "Looks good." Hub now paints with real Dexie data on cold load. Snapshot kept in place (Dean specifically asked to confirm). Diagnostic overlay deliberately stripped per PM-183.6 — root cause was found, no reason to keep instrumentation on screen. Session closed.

**SESSION HANDOFF — 2026-05-21 (PM-183.4: localStorage snapshot for synchronous first paint).** PM-183.3 fixed Dexie's wipe-then-refill race so reads return correct data. But Dean reported the hub still had a visible ~1s delay before painting — even with merge-not-wipe, the cold-load path sits behind multiple awaits: getDB() opening IndexedDB (~200-500ms on iOS WKWebView), auth.js fast-path resolving vyveCurrentUser (~50-200ms), withEmail callback chaining behind that, then finally dexie.allFor() can run. Real data is there, but the door is locked behind serial awaits.

Fix: §23.38 pattern applied. Read localStorage snapshot synchronously at the very top of boot(), before any await. Paint streak + today count from snapshot on the first frame. Async refresh from Dexie/REST overwrites with real values when ready. renderProgress writes a fresh snapshot at the end of every successful paint, so the next cold load's instant paint is always current.

Snapshot shape: `{ day, streak, todayCount, written_at }` in `vyve_mind_hub_snapshot`. Stale-day guard: if snapshot.day !== today, todayCount resets to 0 for first paint (real value via async refresh in ~500ms); streak is durable across midnight rollover so used as-is.

First load after the fix still shows skeleton briefly (no snapshot exists yet). After the first paint completes and the snapshot is written, every subsequent cold load paints instantly. This is the §23.38 pattern verbatim — same approach used on lists pages already.

Shipped vyve-site `d9b47d75`. mind.html +2759 chars (snapshot helpers + paintFromSnapshot + writeSnapshot wired into renderProgress + paintFromSnapshot called at top of boot before any await). sw.js `pm183-3-merge-a` → `pm183-4-snap-a`. vbb-marker Update 47 → 48. node --check clean. §23.41 stable. No new §23 rule — direct application of §23.38 to aggregator hubs.

**Hub paint sequence now (cold load, snapshot exists):**
1. t=0: HTML markup paints with skeleton dots (· / ·).
2. t=~5-10ms (first JS tick): paintFromSnapshot reads localStorage, paints streak + today count, flips skeleton off. User sees real numbers on first visible frame.
3. t=~500-1500ms: Dexie/REST async resolves, renderProgress runs, paints same or updated values, writes fresh snapshot.

**Snapshot invalidation considerations.** Snapshot is per-device, per-browser. Cleared on Dexie crash-wipe (the §3.1 iOS scenario) only if the wipe also clears localStorage (it doesn't — IDB and localStorage are independent on iOS). So the snapshot can outlive a Dexie wipe — first paint shows old values, async refresh from empty Dexie + REST overwrites correctly. Acceptable trade — user sees a frozen-but-real value for ~1s instead of a flash of zero.

**Pattern reusable for Phase 1/2 hubs (body.html, connect.html).** Same shape: localStorage snapshot keyed per-hub, paintFromSnapshot before any await, writeSnapshot at end of renderProgress. Flag for the Bundle-Ready playbook.

**SESSION HANDOFF — 2026-05-21 (PM-183.3: replaceForMember merge-not-wipe — root-cause fix for the hub zero-flash).** Dean's question — "but the dexie table should be there so it should paint instantly?" — triggered the real diagnosis. PM-183.1 (parallel REST) and PM-183.2 (skeleton paint) were treating symptoms. **Root cause:** `db.js` `replaceForMember(email, rows)` did `delete WHERE member=X` THEN `bulkPut(rows)` inside one Dexie transaction. Atomic at commit, but operations are progressive — any parallel reader querying during sync.js's hydrate fan-out lands between the delete and the bulkPut and sees zero rows. The mind.html hub boots in exactly this window during sync.js's auth-ready hydrate; that's why it painted empty until REST or a delayed timer caught it.

**Fix (db.js, structural — affects all 17 member-scoped tables).** Reorder `replaceForMember` to merge: bulkPut new rows first (idempotent, .put = upsert by PK), then sweep stale rows (those keyed for this member but NOT in the new incoming set). At no point in the transaction is the member's row set empty. Local optimistic writes preserved if they have a new id; only explicit server-omissions get wiped. Empty hydrate (server has nothing) still wipes — matches old behaviour for the no-merge case.

**Scope.** mind_activities, daily_habits, workouts, exercise_logs, custom_workouts, exercise_swaps, workout_plan_cache, cardio, nutrition_logs, nutrition_my_foods, weight_logs, session_views, replay_views, wellbeing_checkins, monthly_checkins, weekly_goals, certificates, member_achievements, affirmation_favourites — every table that flows through `makeTable` uses the same `replaceForMember`. One change covers them all.

**Shipped vyve-site `a7c95c4e`.** db.js (+2278 chars, the bulk is doc comment explaining the why), sw.js `pm183-2-skel-a` → `pm183-3-merge-a`, index.html vbb-marker 46 → 47. mind.html unchanged — PM-183.1 belt-and-braces (parallel REST, 800ms/2500ms timers, visibilitychange) become no-ops on the happy path; left in place as fallback for first-ever-device-login or post-WKWebView-IDB-crash scenarios. node --check clean. §23.41 SHA refresh: all three stable. Post-commit byte-equal verified.

**New §23 hard rule earned: §23.43 — Dexie hydrate via merge, never wipe-then-refill.** Documented in master.md with the exact code shape, audit signal (first verb in transaction body must be bulkPut, never delete), and explanation of why this matters past Mind v1: Phase 1 body.html and Phase 2 connect.html (Bundle-Ready PM-184) introduce identical aggregator-hub shapes. Without this fix, every new hub repeats the same bug.

**Architectural note.** §3's "Every read goes to Dexie" contract is only honourable if Dexie reads are never transiently empty due to background sync activity. PM-183.3 makes that contract enforceable. The earlier "Dexie is source of truth" framing was correct but missing the operational underpinning; §23.43 is now the rule that backs it.

**PM-184 Phase 4 (offline-correctness sweep) has one less item to find.** Flagging in the Bundle-Ready playbook as a closed pre-Phase-4 win.

**SESSION HANDOFF — 2026-05-21 (PM-183.2: mind.html hub skeleton paint — no zero-flash on boot).** Dean reported on cold load: hub painted `0 day streak` + `0/2 sessions` for ~5s, then flipped to real numbers (2 / 2/2). PM-183.1's parallel Dexie+REST race is fast, but the **initial markup** had literal "0" + "0 / 2" hardcoded — so the brief window before first paint read as "you have nothing" instead of "loading". Fix: initial markup now shows a middle-dot `·` in the streak ring and `· / 2` in the today card, plus a blank (nbsp) sub-line. `.progress-row` gets `.is-loading` on boot, replaced with `.has-loaded` by `renderProgress` on first successful paint with a 0.3s opacity fade. Cosmetic-only — no data path changes. Shipped `311f29d3`. sw.js `pm183-1-mind-hub-fix-a` → `pm183-2-skel-a`. vbb-marker Update 45 → 46. node --check clean. §23.41 stable. No new §23 rule earned (paint-only). Pattern flagged for codification across other aggregator hubs in the Bundle-Ready Phase 1/2 work (Body + Connect): hardcoded zero in initial markup = false-empty signal during the hydrate race. Build with skeleton characters from the start.

**SESSION HANDOFF — 2026-05-21 (PM-183.1: mind.html hub data-read hotfix).** Dean reported same-day after PM-183 ship: hub's "0/2 mind sessions" wasn't incrementing after a journal entry + a breathwork session + a focus-video watch. Supabase scan confirmed server had the rows — journal + breathwork wrote successfully via §23.39 from their respective pages. Bug was on the hub READ path. Root cause: `readMindActivities()` was Dexie-first with REST-fallback-on-Dexie-error only. Dexie returning EMPTY (fresh page boot before `sync.js` hydrate has pulled mind_activities) is "success" — never falls back to REST. Hub painted zero rows even though server had them.

**Fix shipped: vyve-site `3925c582`.** Three files atomic, mind.html + sw.js + index.html. (1) `readMindActivities()` now Promise.all([dexie, REST]) in parallel, takes whichever has more rows — REST carries the 30-day server snapshot, Dexie carries optimistic local writes that may be ahead of any in-flight POST, idempotent merge by row count. (2) Bus subscribers (`mind:logged`/`mind:failed`/`mind:unlogged`) always repaint — dropped the own-source skip optimisation from PM-183 (wasn't safe across the Dexie-write-vs-bus-publish race). (3) `visibilitychange` + `pageshow` listeners added — re-pulls when Dean tabs back to the hub after a session elsewhere. (4) Boot adds two delayed repaints (800ms + 2500ms) to catch sync.js hydrate completion. `mind:unlogged` subscriber added (breathwork.html publishes this on cancel — was unhandled).

sw.js `pm183-mind-hub-wire-a` → `pm183-1-mind-hub-fix-a`. vbb-marker Update 44 → 45. node --check clean. §23.41 SHA refresh stable. Post-commit byte-equal verified at commit SHA. Dean confirmed working after force-quit + reopen (§23.29 cache clear).

**No new §23 rule earned.** General read-side hardening pattern applies to any future hub aggregating optimistic-first writes from sibling pages: never trust Dexie-empty as authoritative on a hub-paint, always parallel-fetch REST when reading aggregates the page didn't write itself. Pattern is implicit in §23.7 (Dexie hydrate) + §23.39 (optimistic-first writes) — the gap was that those rules govern *initiator* surfaces, not *aggregator* surfaces. If this bites again in Body or Connect hubs, codify.

**SESSION HANDOFF — 2026-05-20 (PM-183: mind.html hub real wiring + 30s engagement gate; Mind v1 user-visible COMPLETE).** Six files atomic to vyve-site main (`f44c7104`). mind.html: hardcoded `3` streak + `2/5` counter + "Calm Your Mind" placeholder hero replaced with real wiring. Today's focus = `djb2(memberEmail|todayStr) % 10` daily rotation across 5 meditation + 2 sleep + 3 visualisation tracks (ambient Rain + Ocean excluded). Day streak = distinct `mind_activities.activity_date` consecutive days with one-day grace (affirmations.html algorithm verbatim). Today's progress = today's row count, display capped 2/2 (foreshadows engagement-score Variety reframe around Body/Mind/Connect). PM-180 player IIFE copied into mind.html — deliberately not extracted to a shared module yet per Dean's call; Dexie/bus consolidation lands post Body+Connect content-complete. 30s engagement gate added to all four player IIFEs (mind.html + meditation + sleep + visualisation): setTimeout against per-modal client_id, cleared on close < 30s = no write, fresh timer on reopen = no double-fire, at 30s wall-clock fires the full §23.39 optimistic-first skeleton (Dexie sync + bus publish + un-awaited POST + 4xx revert + outbox enqueue on network throw). `duration_seconds=30` represents threshold-met, not measured play (iframe is autoplay=1, no API bridge — too heavy for a bridge that gets ripped out at ElevenLabs/Calum swap). `mind:logged`/`mind:failed` bus subscribers debounce-repaint at 150ms; own publish skipped via `source === 'mind_hub_focus'` guard. node --check clean on 12 inline JS blocks. sw.js `pm182-mind-thumbs-a` → `pm183-mind-hub-wire-a`. index.html vbb-marker Update 43 → Update 44. §23.41 pre-commit SHA refresh: all six stable (first clean refresh today — parallel-session storm has settled). Post-commit byte-equal verified via Contents API at commit SHA. No new §23 rule — textbook §23.39 application × 4. **Production reach gated on next OTA per §23.42.**

**SESSION HANDOFF — 2026-05-20 (PM-182: Mind v1 thumbnails — YouTube CDN images on meditation, sleep, visualisation pages).** Closed the visual gap from PM-180. Five files committed atomic to vyve-site main (`7be4eadd`): meditation.html, sleep.html, visualisation.html (12 card thumbnails 5+4+3 + 3 heroes), sw.js (`pm181-bw-countdown-a` → `pm182-mind-thumbs-a`), index.html (vbb-marker Update 42 → 43). Cards use `<img>` with mqdefault → hqdefault → hide fallback chain. Heroes use CSS background-image with maxresdefault + inline preloader probe that swaps to hqdefault if YouTube serves its 120×90 grey placeholder. Pre-build verification: all 12 videos have real HD thumbs (smallest 32KB). `.thumb-md.has-img::after{display:none}` hides the diagonal-stripe placeholder when image is present, returns on failure. referrerpolicy=no-referrer matches PM-180 nocookie posture. Second §23.41 catch today: parallel session had landed PM-181 between PM-180's commit and this session's start — cache key advanced through pm181 already, marker through Update 42, so PM-182 advanced past both. **Production reach gated on next OTA per §23.42.**

**SESSION HANDOFF — 2026-05-20 (PM-181: breathwork.html 3-2-1 countdown before session start).** Small UX enhancement. Tap Begin from breathwork intro now overlays a 3 → 2 → 1 → Start countdown (3.4s total, 800ms per element + 200ms hold on Start) on the session screen before the ring runs. First inhale tone fires as Start fades out. Music (if `vyve_breathwork_music_on === '1'`) starts at countdown begin with a 3400ms fade-duration override so it hits target volume in sync with Start. Tap-anywhere on the overlay skips. Restart from the in-session control bypasses the countdown (`startSession({skipCountdown:true})`). Shipped: vyve-site `00128001`, three files — breathwork.html (+4.4KB), sw.js (`pm180-mind-audio-a` → `pm181-bw-countdown-a`), index.html (vbb-marker Update 41 → 42). `startMusic` signature gained optional `fadeMs` arg. node --check clean; post-commit byte-equal verified. No new §23 rule earned (pure §23.41 application — HEAD had drifted from PM-177 through PM-178/178b/179/180 between session start and ship; structural-marker diff caught the live cache key + marker, monotonic renumber gave PM-181). **Production reach gated on next OTA per §23.42** — main now contains PM-178 affirmations v2 + PM-178b + PM-179 + PM-180 audio pages + PM-181 countdown + the underlying PM-176 affirmations + PM-177 breathwork music etc., none of which reach members until the deferred full-OTA push.

**SESSION HANDOFF — 2026-05-20 (PM-180: Mind v1 audio-content pages shipped — meditation, sleep, visualisation; YouTube embed bridge while real audio prepared).** Three new pages added to vyve-site main (commit `326b5606`). `meditation.html` (5 tracks: Calm Your Mind hero + Morning, Anxiety, Abundance, Sleep), `sleep.html` (4 tracks: 20min Sleep Meditation hero + NSDR, rain, ocean waves), `visualisation.html` (REWRITE from wireframe — 3 tracks: The Beach hero + Manifestation, Reprogramming). All three pages share the visualisation.html shape (`.vz-hero` + `.streams` list), driven by a per-page hardcoded JS catalogue const. Player is an inline fixed modal containing a YouTube nocookie iframe (`youtube-nocookie.com/embed/`) with `?rel=0&modestbranding=1&playsinline=1&autoplay=1` — playsinline prevents iOS full-screen hijack, rel=0 + modestbranding suppress recommendation grids that would surface non-VYVE content. `history.pushState` wired so phone back/swipe back closes the player without leaving the page. `frameWrap.innerHTML = ''` on close hard-stops audio. mind.html hub Meditation + Sleep tiles re-routed from `mind-library.html` → the new dedicated pages. sw.js cache key bumped pm179 → pm180-mind-audio-a. index.html vbb-marker Update 40 → 41 per §23. Catalogue is trivial to swap iframe → `<audio>` when ElevenLabs/Calum scripted audio lands — no page rewrite needed. **SESSION HANDOFF — 2026-05-20 (PM-178: programme_json shape bug diagnosed; hotfix branch ready; OTA push deferred).** Dean reported "Shannon has no workout" → Supabase scan found her row present and well-formed; bug was render-side. `programme_json.weeks[i]` is emitted by the generator as a raw array of session objects, but `exercise.html` `renderHero()` (Body hub) and `workouts-programme.js` `renderProgramme()` (Workouts → My Programme tab) both assume the wrapped shape `{week, sessions:[...]}`. Symptom: Body hub renders "— sessions per week" + "Next Session" placeholder, My Programme tab crashes silently and fails to render. Every onboarded member affected, not Shannon specifically.

**Hotfix branch ready, NOT yet pushed via OTA.** vyve-site `hotfix/programme-render-shape` at HEAD `b791fd51` (committed by parallel Claude session at 20:38 UTC, re-verified rather than re-shipped per §23.14 + §23.41). Branched from `83874dd5` — the SHA bundled into iOS 1.3 (2) + Android 1.0.3 per PM-115/116. Three files patched. `node --check` clean. Branch `ahead_by 1` vs production — surgical.

**Dean's call — OTA deferred.** Main has accumulated unsandboxed in-progress work over the past week; bundling `www/` from main isn't safe until that work is sweep-checked. Plan: ship a full OTA in a couple of days, port the hotfix forward into main as part of it, single OTA push not two.

**Production impact while deferred.** Every member's Body hub renders broken, every member's My Programme tab fails to render. Fix lands for everyone on the next OTA push, not before.

**Brain drift corrected in this commit.** §2 had inherited "PF-14b on backlog, ships AFTER bottom-nav restructure" through PM-172/174/175/176/177 handoffs despite PM-115/116 shipping bundled-mode iOS 1.3 (2) + Android 1.0.3 (10) + Capawesome OTA on 15 May. New §23.42 codifies the architectural implication: post-bundled, a vyve-site main push no longer reaches production users until an OTA bundle is built and pushed via Capawesome.

**Real-time §23.41 demonstration.** This session's brain commit was prepared, refreshed SHAs immediately before write per §23 hard rule, found all four files had drifted between session start and commit attempt — a third parallel session had landed PM-174.1 + PM-177 in the gap. Re-merged patches against live content, renumbered PM-177 → PM-178, dropped this session's planned §23.41 because the parallel session had already codified the identical rule under that number. Net new content from this session is just §23.42. §23.41 caught the drift before clobbering — working as designed.

**LAUNCH SEQUENCING — CORRECTED.** PF-14b is **SHIPPED**, not pending:
- iOS 1.3 (2) bundled-mode + Capawesome live-updates: submitted 15 May (PM-115). Status check in production channel + App Store Connect is a post-PM-178 follow-up.
- Android 1.0.3 (versionCode 10) bundled-mode + Capawesome: submitted to Google Play Production 15 May (PM-116).
- Capawesome 14-day trial expires 28 May 2026 — decision 27 May, default keep at £15/mo USD Starter.
- Bottom-nav restructure (PF-21) remains pending. **It now ships as an OTA bundle update**, not a native binary release. Same for all Mind v1 work (PM-174/174.1/175/176/177) and any other commits past `83874dd5` — wired on main, won't reach members until the next OTA bundle is pushed.

**What's ready for next session.**
- **Hotfix-port-to-main + first-ever full OTA push.** Dean's deferred work. Port the hotfix branch's two-file patch forward into main (the parallel session's `workouts-programme.js` shape is the better version — strictly more defensive than what PM-178 would have written). Sweep main for any in-progress work that isn't ship-ready. Then: `npx @capawesome/cli apps:bundles:create --app-id f9961f66-eb66-4102-b1c5-f9b2c7baeebf --channel 89e12796-aa41-4176-8d78-bc2ef6dfd5c2 --path www`. Consider `--rollout 0.1` for first-push safety.
- **affirmations / journal / breathwork copy review** — Lewis-side. Multiple `COPY_LEWIS_REVIEW`-flagged seeds from PM-173/174/175/176 still pending.
- **visualisation.html** — SHIPPED PM-180 with YouTube embed bridge. Swap to real audio once ElevenLabs/Calum assets land (catalogue is a hardcoded JS const, no page rewrite needed).

**Sessions still ahead (post next-OTA).**
- Apple Health page full redesign (replacing debug-surface layout).
- `auth_blocked` banner in member UI.
- B2B volume tier definition before first enterprise contract.
- Achievements system major overhaul (post-trial).
- In-App Tour build (PF-23 — V2 target, blocked on Lewis copy).


## 3. The active campaign — Bundle-Ready (Mind / Body / Connect → offline-correctness sweep → ship)

**Goal:** Ship a bundled iOS + Android app that members can use offline on the tube, on a flight, in a hospital basement. Bundled shell + Dexie data + Capawesome OTA = a wedge no UK workplace wellbeing competitor has.

**Target ship:** 31 May 2026, OR honest slip.

**Reference:** `playbooks/bundle-ready-campaign.md` (full phase breakdown + sub-tasks + exit criteria).

### Architectural commitment (IMMUTABLE — inherited from PM-77 / PM-106)

VYVE is a Capacitor-wrapped native iOS+Android app with web fallback at online.vyvehealth.co.uk.

- **Dexie is the source of truth for everything the app reads.** Network is for sync, for honestly-network-bound surfaces (§23.10), and for non-current-programme assets fetched on view.
- **First-login is the long load**, masked by the consent gate and persona-led walkthrough. Subsequent opens are instant from Dexie.
- **Writes go Dexie-first** via the §23.39 optimistic-first skeleton: Dexie upsert sync, bus publish, un-awaited POST, 4xx revert, network-throw enqueue to `_sync_queue`.
- **Single-device-per-user is the working assumption.** Last-write-wins for any conflicts. Multi-device cross-sync is post-launch.
- **Supabase remains** the sync target, cross-device propagation layer via Realtime, server-side compute for AI/cron/leaderboards/employer aggregates. **Not the rendering source.**

This commitment may not be revised without producing a specific measured problem this architecture can't solve.

### The six phases (status at PM-184)

- **Phase 0 — Mind section v1 user-visible.** SHIPPED 20 May 2026 (PM-173 → PM-183). All six pages (breathwork, journal, affirmations, meditation, sleep, visualisation) plus mind.html hub real-wired against §23.39. Outstanding: ElevenLabs/Calum real audio swap (post-launch); Lewis copy review pass.

- **Phase 1 — Body section consolidation.** NOT STARTED. body.html proper hub mirroring mind.html shape (Today's focus + Day streak + Today's progress for Workouts/Cardio/Movement). Probable new `body_activities` table. Sub-pages already Dexie-first — this phase is consolidation. **NEXT.**

- **Phase 2 — Connect section build.** NOT STARTED. connect.html (NEW) unifying leaderboard + sessions + charity impact + (optionally) social feed.

- **Phase 3 — Pillar realignment.** NOT STARTED. Home / Engagement / Weekly check-in / Monthly check-in / Certificates all reframe around Mind / Body / Connect. Variety component reframes per-pillar (foreshadowed PM-183). Certificates re-pillar (was deferred-post-launch in §22 — pulled into this campaign per Dean's call: ship consistent or don't ship). Heaviest phase.

- **Phase 4 — Offline-correctness sweep.** NOT STARTED. **PRE-BUNDLE GATE.** Static schema/idempotency audit + dynamic airplane-mode device walk. New playbook `playbooks/offline-correctness-audit.md` (PM-184). Anything broken offline = P0 fix before bundling.

- **Phase 5 — Bundle and OTA.** NOT STARTED. Three tasks queued from PM-178 (port hotfix to main, sweep main, first-ever Capawesome OTA push). Consider `--rollout 0.1` for first push.

- **Phase 6 — External-blocker items.** OPEN. HAVEN sign-off (Phil), weekly check-in nudge copy (Phil + Lewis), PF-13 hydration COPY_TABLE finalisation (Dean), Brevo logo removal (Lewis), Facebook Make connection refresh (Lewis — URGENT, expires 22 May), public launch comms (Lewis), B2B volume tiers (Lewis + Dean), Mind v1 Lewis copy review.

### What drops off the radar entirely

Confirmed deferred / dropped:
- Layer 6 SPA shell (dropped).
- PM-71 / PM-71b dashboard payload trim (obsolete post-bundle).
- PM-72 materialise achievement_progress (obsolete post-bundle).
- Backend EF perf work for home payload / §23.5.1 campaign (obsolete post-bundle — Dexie-first paint renders <200ms regardless of EF latency).
- PWA install prompt code in index.html (Phase 1 removal).
- In-App Tour PF-23 (V2, blocked on Lewis copy, post-launch).
- Achievements system major overhaul (post-trial, post-launch).

### Operating mode (unchanged from PM-77 / PM-106)

- **Claude leads, Dean drives.** Default for technical decisions: Claude decides and moves forward, Dean retains veto.
- **Single atomic commit per session** to VYVEBrain (master / active / changelog / backlog / playbooks move together).
- **§23.41 pre-commit SHA refresh** is mandatory.
- **§23.42 production reach** — main HEAD does not reach members until next OTA bundle via Capawesome.
- **§23.39 optimistic-first** is the canonical write pattern for all new feature work.

### 3.1 iOS-specific mitigations (from PM-77.1 research dive)

Added 13 May 2026 after web research dive on production reports of Dexie + Capacitor + Supabase. Three load-bearing risks identified, all mitigatable. Sync layer + page code must follow these patterns:

**A. WKWebView IndexedDB crash-wipe (WebKit bug 144875, recurred iOS 17.4).** Process kills (low-memory, force-quit) can lose in-flight Dexie writes; rare full-store wipe possible. Apple has not fixed. **Mitigation:** keep Dexie transactions short, force a flush on `visibilitychange` to hidden (via `db.close()` then reopen, or explicit transaction commit), detect "Connection to Indexed Database server lost" errors and recover by re-hydrating from Supabase. **For VYVE specifically:** Supabase is the canonical store; worst-case wipe = member sees "preparing your VYVE" hydration screen on next open. Not data loss.

**B. Capacitor origin pattern affects ITP exposure.** Apple ITP's 7-day script-writable-storage purge applies to **third-party (remote) origins** in WKWebView. Capacitor apps that bundle assets locally (`capacitor://localhost`) are first-party and **exempt**. Apps that load a remote origin (e.g., `https://online.vyvehealth.co.uk` inside the wrap) **may be subject** to the 7-day rule. **Action required:** PF-1 must verify which pattern the current iOS 1.1 build uses. If remote-origin, the campaign should migrate to local-bundle as part of PF-1 or PF-2, not after. Lock the scheme explicitly in `capacitor.config` to prevent reinstall/upgrade wipes (Capacitor 5→6→7 scheme migrations have wiped IndexedDB for users in the past).

**C. Supabase Realtime WebSocket dropped when iOS backgrounds the app.** Realtime events delivered during background window are missed; JS client does not auto-replay on reconnect. **Mitigation:** sync layer must run a delta-pull (`?since=last_sync_at`) on every `visibilitychange` returning to visible, regardless of whether Realtime claims it stayed connected. Belt-and-braces. This is the Layer 3 pattern from PM-57 carried forward into the new sync engine.

**Production evidence:** Multiple Capacitor + Dexie apps have shipped to the App Store and operated without systematic data loss when these patterns are followed (ParkManager, HandyCap, others). The pattern is well-trodden. The bugs are known. The mitigations are standard.

**Escape hatch if needed:** Capacitor SQLite plugin stores data in a native file outside the WebKit sandbox — immune to crash-wipe and ITP. Considered as a fallback if Dexie surfaces problems we can't mitigate, but adds SQL surface area and loses Dexie's query convenience. NOT planned. Only invoke if PF-1 spike fails for crash-wipe reasons specifically.

---

## 4. §23 hard rules — working-set subset (the 15 most load-bearing)

Full §23 lives in `master.md` (50+ rules). These are the ones that fire on most sessions. If a question doesn't match one of these, check master.md §23 before assuming no rule applies.

### Commit discipline

- **Pre-commit SHA refresh.** Always fetch fresh SHAs immediately before commit — drift is rare but catastrophic.
- **Post-commit byte-equal verify.** Re-fetch via Contents API (live ref, not raw — raw is CDN-cached and stale for several minutes). md5 every patched file against staged content.
- **Files over 50KB route through Composio workbench `GITHUB_COMMIT_MULTIPLE_FILES`** via `run_composio_tool`, NOT direct MCP — direct MCP corrupts large files.
- **Multi-file commits use `upserts` field (not `files`) and `message` field (not `commit_message`).** New files omit `sha`; existing files require fresh `sha`.
- **Plain UTF-8 in `upserts[].content` — NEVER pre-base64-encode** (PM-86.1, codified PM-93). The tool base64-encodes internally. Pre-encoding causes silent double-encoding: commit succeeds, blob SHAs look normal, content renders as garbage. The single-file `GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS` accepts either plain or base64 (auto-detected); the multi-file tool does NOT. Pass strings directly.
- **Post-commit byte-equal verification on every changed file.** Use Contents API base64-decode at commit-SHA ref, OR raw at commit-SHA (not branch — raw at branch is CDN-cached for several minutes). MD5 or head-100-chars equality against the staged content. Contents API returns `encoding=none` with empty content for files >1MB — switch to raw-at-commit-SHA or blob-by-SHA in that case.
- **One atomic commit per logical unit of work.** Don't dribble related changes across multiple commits.
- **`tool_search` does not surface Composio toolkits — route via `COMPOSIO_SEARCH_TOOLS` → `COMPOSIO_MULTI_EXECUTE_TOOL`** (PM-121, §23.25). If `tool_search` returns only first-party tools for an apparently-Composio-mediated toolkit (github, brevo, hubspot, etc.), call `tool_search(query="composio <toolkit>")` to load the meta-tools, then `COMPOSIO_SEARCH_TOOLS` for the plan + schemas, then `COMPOSIO_MULTI_EXECUTE_TOOL` for execution. Full rule + response-handling quirks (1MB Contents API limit, base64 newline stripping, raw-at-SHA workaround) in master.md §23.25.

### Audit method

- **Whole-tree audits use `GITHUB_GET_A_TREE` recursive + parallel-fetch all .html/.js blobs + local grep.** Never pre-select a subset — past sessions have produced false negatives by guessing which files to audit (3× undercounting on PM-58).
- **Verify Supabase triggers via `pg_trigger`, not `information_schema.triggers`** — the latter silently hides triggers from read-only users.
- **Edge function source: `Supabase:get_edge_function` returns readable source.** `SUPABASE_GET_FUNCTION_BODY` returns ESZIP binary — useless.

### Architecture (load-bearing for future sessions)

- **Auth state-change handler guards on event type, not session-null** (PM-74). `if (ev === 'SIGNED_OUT')` only. Supabase fires TOKEN_REFRESHED with null session when refresh fails — that is not a sign-out and must not redirect.
- **401 redirect must signOut-before-redirect** (PM-74). `await signOut() → set vyve_return_to → location.replace`. Naked `location.href = '/login.html'` creates auth loops on stale tokens.
- **RLS policies wrap auth functions in `(SELECT ...)`** (PM-8). Bare `auth.email()` causes per-row re-evaluation and 300-2000ms planning overhead. Always `(SELECT auth.email())`.
- **AFTER STATEMENT triggers + transition tables, never AFTER ROW for aggregation refresh** (PM-68). Inline-on-write aggregation refresh causes writer-contention cascades.
- **Cache-paint runs before auth, not inside `onAuthReady`** (PM-3). Pages must `paintCacheEarly()` as a synchronous IIFE at the top, before any auth-gated code.
- **Read SDK state-change listeners BEFORE wiring triggers that fire those events** (PM-74 §23.5.3). PM-67e shipped perf instrumentation that called getSession without auditing what would react — that caused the auth loop.

### Read me when about to make architectural changes

- **For Premium Feel Campaign work specifically:** §3 of this file is immutable. Dexie is the local source. Don't propose alternatives.
- **Spike-gate pattern (codified PF-1, May 2026):** When shipping new architecture onto main before all members are ready to use it, gate via `localStorage.vyve_lf_spike === '1'`. Inert otherwise — the new code is dead weight for everyone except spike testers, and the work can ship to main without a parallel deploy pipeline. Pattern used because `vyve-site` GitHub Pages only deploys from `main` (single-branch publish, no preview ref). Generalises to any future architectural slice that wants live-on-main testing. The inert path MUST install a no-op shim under the same window symbol (e.g. `window.VYVELocalDB`) so call-sites don't need to branch.

- **PF-40 is the active consolidation phase (locked PM-106).** When a session would otherwise propose a per-page Dexie wire / per-page write workaround / per-page hydrate patch, the answer is now "land it inside PF-40, not as a one-off." The campaign exists specifically to absorb those shapes. The new §23.11 / §23.12 / §23.13 rules are the contract; PF-40 is the implementation. See `tasks/backlog.md` PF-40 section for the 12 sub-items and dependency graph.
- **The Habits "undefined" canary (PM-106).** When a Dexie-wired page renders `undefined` for fields the UI expects, the bug is almost always that the hydrate pulled thin rows but the page reads denormalised joins. Don't patch the page; expand `pullOneTable(table)` to include the join columns. This is the §23.11 rule.

---

### Dexie flush + reconnect discipline (PM-77.1, load-bearing for the campaign)

- **On `visibilitychange` to hidden:** force-flush any open Dexie transactions (`db.close()` then auto-reopen on next access, OR ensure all transactions resolve before the event handler returns). Protects against WKWebView process-kill data loss.
- **On `visibilitychange` to visible:** run sync layer delta-pull (`since=last_sync_at`) against Supabase regardless of Realtime connection state. iOS suspends WebSockets on background; the JS client does not auto-replay missed events.
- **On "Connection to Indexed Database server lost" error:** trigger graceful re-hydration from Supabase, do not crash, do not silently lose writes. Use the existing offline outbox as the durable queue while DB is unreachable.
- **Capacitor config:** lock the WebView scheme (`capacitor://localhost`) explicitly in `capacitor.config.ts` and never change it across releases — scheme migrations between Capacitor major versions have wiped user IndexedDB stores in past versions.

---

## 5. Backlog top working set (P0/P1 only)

**P0 — must ship before 31 May launch (sequenced by Bundle-Ready phase):**

### Phase 1 — Body section consolidation (NEXT)
1. **Decide `body_activities` table shape.** Mirror of mind_activities (`kind` discriminator across workouts/cardio/movement, `ref_id`, `activity_date`, `client_id`, `duration_seconds`) vs view-over-existing-tables. Default = table (per recent pattern preference). Decision in next session.
2. **Migration:** `body_activities` table + RLS + indexes + `BEFORE INSERT/UPDATE` triggers.
3. **body.html hub build.** Today's focus + Day streak + Today's progress. djb2 daily rotation. Mirror mind.html shape.
4. **Sub-page audit pass.** Verify Dexie-first reads + §23.39 writes on workouts.html / cardio.html / movement.html / exercise.html. Earlier work (PF-7, PF-9, PM-154-170) shipped Dexie-first; this is verification + any gap-fills.

### Phase 2 — Connect section build
5. **connect.html hub build (NEW).** Charity impact hero + today's session + leaderboard preview + Day streak. Lifted from mind.html / body.html shape.
6. **Sub-page audit pass.** sessions.html (schedule = catalogue hydrate; chat = Realtime carve-out), leaderboard.html (§23.10 carve-out with designed offline state).

### Phase 3 — Pillar realignment
7. **Home page rewrite (index.html).** Pillar tiles replace certificate-track cards. Activity Score Ring retained but Variety reframes per-pillar.
8. **Engagement page rewrite (engagement.html).** Variety component reframes per-pillar (each pillar contributes up to 4.17 of 12.5 points). Activity Breakdown reorganises around pillars.
9. **Weekly check-in rewrite (wellbeing-checkin.html + EF v29).** Activity summary rolls up Mind + Body + Connect. AI prompt updated. Lewis-signoff on slider questions (open decision from §22 resolved here).
10. **Monthly check-in rewrite (monthly-checkin.html + EF v18).** Same as weekly.
11. **Certificates re-pillaring.** Three pillar certificates (Mind / Body / Connect) replace five activity certificates. `pillar` column added to `certificates` table. Old certs grandfather as `pillar='legacy'`. Lewis sign-off on three new pillar titles + tier copy.

### Phase 4 — Offline-correctness sweep (PRE-BUNDLE GATE)
12. **Schema audit:** every member-data Supabase table has `updated_at` + `BEFORE UPDATE` trigger. Catalogue tables too (delta-pull depends on it). SQL in `playbooks/offline-correctness-audit.md`.
13. **Idempotency audit:** every write surface has `client_id` UUID + server-side dedupe constraint.
14. **Airplane-mode device walk:** Dean's iPhone with `server.url` + network killed. Every page walked, write surfaces tested. Anything broken = P0 fix.
15. **Cold-start-no-network UX:** login screen detects no-connection, shows honest message.
16. **Fan-out-on-focus pattern:** Capacitor `App.addListener('appStateChange')` triggers incremental delta-pull. Per-table `last_sync_timestamp` in Dexie `_sync_meta`.
17. **`_sync_queue` drain hardening:** wakes on app launch, drains before new writes allowed, handles 2-week-offline queue cleanly.

### Phase 5 — Bundle and OTA
18. **Port PM-178 hotfix to main.** Two-file patch (exercise.html renderHero + workouts-programme.js renderProgramme) + sw.js cache bump. Use the parallel session's `workouts-programme.js` shape (strictly more defensive).
19. **Sweep main for unship-ready in-progress work.** Phase 1–4 work should have covered most of this; final gate.
20. **First-ever OTA push.** `npx @capawesome/cli apps:bundles:create --app-id f9961f66... --channel 89e12796... --path www`. Consider `--rollout 0.1` for safety; roll to 100% after 24h clean telemetry.

### Phase 6 — External-blocker items (off the critical path, tracked separately)
21. **HAVEN clinical sign-off** (Phil). Conor Warren on HAVEN since 15 April — Phil to review interactions.
22. **Weekly check-in nudge copy split** (Phil + Lewis). First-time activation vs continuity. Mental-health-adjacent.
23. **PF-13 hydration COPY_TABLE finalisation** (Dean writes, Lewis spot-check). 23 entries tagged `COPY_DEAN_FINAL`.
24. **Brevo logo removal** (~$12/month addon). Lewis — before any enterprise demo.
25. **Facebook Make connection refresh** — expires 22 May 2026. **URGENT — today/tomorrow.** Lewis.
26. **Public launch comms draft** (Lewis).
27. **B2B volume tier definition** (Lewis + Dean). Pre-first-enterprise-contract.
28. **Mind v1 Lewis copy review** — affirmations / journal / breathwork seed content. `COPY_LEWIS_REVIEW` tags throughout.

**P1 — desired before launch, acceptable to slip:**

- Skeleton screens and empty states pass (post-pillar-realignment polish).
- Haptic feedback wiring via Capacitor Haptics on writing surfaces.
- Error handling polish — warm/helpful error states.
- ElevenLabs/Calum real audio swap for Mind audio pages (replaces YouTube embed bridge).

**P1 — post-launch (do not work on before 31 May):**

- Achievements system major overhaul (PM-94). Post-trial — 2-3 sessions as own campaign.
- In-App Tour PF-23. V2 target, blocked on Lewis 5-persona copy.
- PM-71/72/73 — obsolete-ish post-bundle; revisit if data shows EF still hot.
- Realtime cross-device sync (PF-5b deferred). Pattern 3 from PM-184 strategy discussion.
- Apple Health page redesign.
- `auth_blocked` banner in member UI.
- HealthKit background sync (Capgo 8.4.7 has no primitives — needs Swift plugin ~400 LOC + 4-5 sessions + 1 week soak).
- Health Connect (Android) — parked until Dean has Pixel/Galaxy device.

## 6. Credentials, URLs & references (working-set only)

| What | Value |
|---|---|
| Supabase project ID | `ixjfklpckgxrwjlfsaaz` (West EU / Ireland, Pro plan) |
| vyve-site repo | `VYVEHealth/vyve-site` (private, main branch) |
| VYVEBrain repo | `VYVEHealth/VYVEBrain` (private, main branch) |
| Capacitor project | `~/Projects/vyve-capacitor` on Dean's Mac (NOT a git repo — backlog risk) |
| Portal URL | https://online.vyvehealth.co.uk |
| Marketing URL | https://www.vyvehealth.co.uk |
| Stripe payment link | buy.stripe.com/00wfZicla1Em0NnaIB93y00 |
| HubSpot | app-eu1.hubspot.com, Hub ID 148106724 |
| Brain commit pattern | `vyve-cache-v2026-MM-DD-pmNN-<slug>-<letter>` |

For full credentials, EF inventory, table inventory: fetch `master.md` §24 (renumbered to §25 post-PM-77).

---

## 7. What's NOT in this file — fetch on demand

| Question type | Where to look | When |
|---|---|---|
| Full §23 rule history (50+ rules) | `master.md` §23 | When §4 doesn't cover the case |
| Pre-PM-30 changelog entries | `changelog.md` (full) | Investigating pre-Layer-1c ship history |
| Edge Function inventory + cron job map | `master.md` §7 | Any EF-related work |
| Supabase table inventory + column shapes | `master.md` §6 + live `list_tables` | Any DB schema work |
| Onboarding flow detail (10-section questionnaire shape) | `master.md` §9 | Onboarding EF changes |
| AI persona system prompts (NOVA/RIVER/SPARK/SAGE/HAVEN) | `master.md` §10 + Supabase `personas` table | Persona work |
| GDPR pipeline (export, erase, retention) | `master.md` §16 + `playbooks/disaster-recovery.md` | GDPR work |
| Cache-bus taxonomy (PM-29..PM-44 era) | `playbooks/cache-bus-taxonomy.md` | Touching bus events |
| Disaster recovery procedures | `playbooks/disaster-recovery.md` | DR drill, real DR event |
| Brain commit/sync protocol details | `playbooks/brain-sync.md` | Editing brain files |
| Old Layer 1c migration template | `playbooks/1c-migration-template.md` | Legacy — likely never needed again |
| Layer 5 perf capture protocol | `playbooks/layer5-perf-capture-protocol.md` | Reading perf_telemetry data post-launch |
| **PREMIUM FEEL CAMPAIGN tasks** | `playbooks/premium-feel-campaign.md` | **EVERY session during this campaign** |

---

## 8. Editorial notes

- **Last full rebuild:** 13 May 2026 PM-77. Latest patches: PM-78 (PF-1/2/3 + spike-gate rule), PM-79 (PF-4/5 + delta-pull cursor semantics), PM-79.1 (PF-23..PF-27 added — interactive tutorial + 4 polish tasks), PM-79.2 (PF-28 added — in-progress session + form draft persistence), PM-79.3 (PF-6 + PF-7 SHIPPED — habits + workouts Dexie-first reads, including PM-77.3 thumbnail prefetch on workouts), PM-79.4 (PF-29 added — Android Health Connect autotick wiring; PF-14 scope expanded with Android two-device verification, Capacitor scheme check, Dexie source indicator), PM-82.5 (brain restore — PM-80/81/82 ship narratives spliced into changelog; §2/§3/§5 advanced to PF-8 SHIPPED state; PF-4b surfaced into §3; orphan-commit drift documented in changelog as a §23 hard-rule candidate). PM-83 (PF-13 scope expanded — persona-led welcome + safe goal echo from onboarding questionnaire; Dean owns copy directly, removed from Lewis blocker list; HAVEN-never-personalised hard rule documented). PM-87 (PF-10), PM-88 (PF-11a + PF-11 split), PM-89 (PF-11b — index.html Dexie-derived home-state computation via home-state-local.js). PM-90 (PF-30 SHIPPED — perf.js v3 telemetry redirect + PostHog session replay + new dexie/perf events; PostHog identity confirmed already wired in auth.js, memory note on "pending" was stale; Sentry deferred to PF-30b pending DSN). PM-91 (PF-12 SHIPPED — settings.html Dexie-first + 6 optimistic upsert sites; certificates/engagement carved out to PF-12b). PM-92 (PF-13 scaffolding SHIPPED — `/hydration.js` persona-led welcome overlay with HAVEN never-echo + SAFE_ECHO_GOALS whitelist + 1500ms min display; copy gate open, Dean to finalise 13 distinct COPY_TABLE entries). **PM-93 (verification-mode audit repair — brain drift caught: spike HEAD `707aa3af`→`11abad83`, SW cache key `pm90-pf30-telem-a`→`pm92-pf13-hydration-a`, two missing changelog entries (PM-91 + PM-92) re-spliced from live commit messages, playbook PF-12 + PF-13 statuses flipped SHIPPED, playbook PF-30 stale 'identity pending' language stripped, new §4 hard rule on plain-UTF-8 in upserts content codified)**. PM-94 (trial-phase placeholders consciously deferred — hydration COPY_TABLE finalisation + Achievements system overhaul both logged to backlog as P1 post-launch with Dean's explicit framing; memory entry #17 captures the trial-safe operating mode for both items). PM-106 (2026-05-14) — campaign reshape: Habits "undefined" canary on test1@test.com surfaced join-column hydrate gap; §3 contract strengthened; §23.11/12/13 added; PF-40 consolidation campaign scoped end-to-end (12 sub-items). PM-107 (2026-05-14) — PF-40.1 audit shipped; new artefacts `audit/pf-40-1-callsites.json` + `playbooks/pf-40-local-first-consolidation.md`; §2 + §5 + §8 patched. PM-174 (2026-05-20) — Mind v1 first user-visible: breathwork.html real wiring (vyve-site `0e59c180`); imagery via Supabase Storage (§23.40 codified). PM-175 (2026-05-20) — Mind v1 second user-visible: journal.html real wiring (vyve-site `79cbcf1e`); deterministic daily prompt rotation + calendar + edit/delete; no new §23 rule (textbook §23.39 application). PM-176 (2026-05-20) — affirmations.html shipped. PM-178 (2026-05-20) — programme_json shape bug diagnosis + hotfix branch. PM-179 (2026-05-20) — journal in-page history integration. PM-180 (2026-05-20) — Mind v1 audio-content pages (meditation + sleep + visualisation) shipped via YouTube embed bridge. PM-181 (2026-05-20) — breathwork.html 3-2-1 countdown overlay before session start; `startMusic` gains optional fadeMs arg; restart bypasses countdown. PM-182 (2026-05-20) — Mind v1 thumbnails: YouTube CDN images on meditation/sleep/visualisation cards + heroes; mqdefault → hqdefault → hide fallback; vbb-marker Update 42 → 43. PM-183 (2026-05-20) — mind.html hub real wiring (Today's focus daily rotation + Day streak + Today's progress 2/2 cap) + 30s engagement gate on Mind audio pages closes out Mind v1 user-visible scope; vbb-marker Update 43 → 44.
 **PM-174 (2026-05-20) — breathwork.html real wiring shipped (Mind v1 first user-visible). §23.40 imagery sourcing rule codified.** **PM-175 (2026-05-20) — journal.html real wiring shipped (Mind v1 second user-visible).** **PM-175.1 (2026-05-20, brain-only) — post-compaction recovery: resumed session staged a stale journal.html rebuild against the pre-PM-175 SHA; §23.41 SHA refresh caught the divergence (live `79cbcf1e` post-PM-175, plus PM-176/177/178 layered on top) before any commit. Zombie work product discarded, no vyve-site write occurred. Second real-world §23.41 demonstration this day — protocol works for both parallel sessions AND post-compaction resumes.** **PM-176 (2026-05-20) — affirmations.html real wiring shipped (Mind v1 third user-visible). `affirmation_favourites` join table created. Dexie SCHEMA_V6.** **PM-179 (2026-05-20) — journal.html in-page history integration shipped (vyve-site `139acbc2`). Bug: nav.js global mph-back button uses `history.back()`, which left journal.html entirely on calendar/entry-view back instead of returning to the previous in-page view. Fix: `showView()` now pushes history state on internal view changes (compose/calendar/entry), boot does an initial `replaceState`, `popstate` handler restores the popped view via `{fromPop:true}` guard, entry-back uses `history.back()` when there's a pop-target. Surgical 3-patch edit, `node --check` clean. No new §23 rule — standard in-page SPA history pattern, applies to any future page with internal view switching.** **PM-180 (2026-05-20) — Mind v1 audio-content pages shipped: meditation.html + sleep.html (NEW) + visualisation.html (REWRITE from wireframe) (vyve-site `326b5606`). Six files committed atomic. YouTube nocookie iframe in fixed modal as week-long bridge while ElevenLabs/Calum audio prepared. playsinline=1 + rel=0 + modestbranding=1 + history.pushState wired for native-feeling player. mind.html hub Meditation/Sleep tiles re-routed. sw.js pm180-mind-audio-a, vbb-marker → Update 41. No new §23 rule — standard inline-player pattern, generalises to any future media surface.**
- **Next rebuild trigger:** campaign close (Premium Feel migration ship), OR 3+ patches accumulated to this file, OR drift detected (live state disagrees with §2).
- **Commit discipline for active.md edits:** §2 SHA bumps are atomic with the session's main brain commit. §3 status flips when a campaign task ships. §4 only gains new rules when a rule earns working-set residency. §5 reorders on backlog grooming.
- **What does NOT belong here:** anything from §7's fetch-on-demand list. If a question keeps surfacing that requires fetching the same canonical section session after session, that's the rebuild signal — promote it into active.md on the next rebuild.
- **What DOES belong here:** the live state snapshot, the active campaign's status, the working-set §23 rules, the P0/P1 backlog top, the operating mode. Everything a fresh Claude needs to be productive on the next session without reading master/changelog/backlog.
