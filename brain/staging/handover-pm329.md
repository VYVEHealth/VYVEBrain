Load VYVE brain.

Continuing PM-328 Achievements v2 build. Data layer is shipped to live Supabase — I'm picking up where the previous session compacted. The build is ~60% data, ~40% UI + evaluator wiring. Everything below is the locked state.

WHAT'S ALREADY SHIPPED TO LIVE DB (project ixjfklpckgxrwjlfsaaz, applied via Supabase migrations pm328_achievements_v2_schema_delta and pm328_achievements_v2_gate_columns):

1. achievement_metrics extended with 6 new columns: pillar (enum body/habits/mind/connect/checkins/focus, NULL = retired or hidden), hidden boolean, icon_slug text (Lucide names), is_cross_cutting boolean, phil_approved boolean DEFAULT true, wired boolean DEFAULT false.

2. 107 total metric rows: 80 v2 active pillar rows (body 22 / habits 11 / mind 13 / connect 17 / checkins 9 / focus 8), 10 hidden cross-pillar, 2 cross-cutting (member_days + streak_overall), 15 retire-legacy v1 rows.

3. 538 total tier rows: 327 v1 approved (untouched, all `copy_status='approved'`) + 211 new v2 placeholder rows (`copy_status='placeholder'`).

4. 345 member_achievements earns preserved completely. Zero data loss.

5. Gate flags applied: 22 metrics marked wired=true (all v1 metrics that fire today + cross-cutting), 18 marked phil_approved=false (all Mind pillar + 2 sensitive checkin metrics + 3 sensitive hidden achievements). 65 v2 metrics await evaluator wiring.

WHAT'S LEFT TO BUILD THIS SESSION:

A. Evaluator wiring — `supabase/functions/_shared/achievements.ts`. Currently fires only for v1 inline metrics. Need to extend evaluateInline + achievements-sweep with handlers for the 65 unwired v2 metrics. Source tables vary per metric — confirm shape before wiring:
- Movement: movement_activities (confirm PM-307 schema), used by movement_sessions_logged, streak_movement, distance_total (cardio_logs.distance_km + movement_activities.distance_km)
- Mind pillar: mind_activities (kind column: 'breathwork'|'journal'|'meditation'|'visualisation'|'affirmation'), used by mind_sessions_logged, breathwork_sessions, journal_entries, meditation_sessions, mind_minutes_total (sum watch_seconds/60), distinct_mind_types, streak_mind, meditation_streak, mind_before_8am, visualisation_logged, first_mind_session, long_meditation (watch_seconds >= 600|1200|2700)
- Focus pillar: confirm focus card schema exists — was the focus_cards / focus_completions table shipped or still spec? Check master.md §6 + git log on focus*.html. If unshipped, mark Focus achievements as wired=false and skip evaluator wiring this session — they only fire once focus card data layer exists.
- Connect new: session_minutes_yoga/mindfulness/therapy/education from session_views + service_catalogue category join; reactions_given/received from a reactions table (confirm exists); chat_messages_posted from session_chat; checkins_with_reactions from wellbeing_checkins joined to reactions.
- Body behavioural: workout_before_7am (workouts.completed_at < 07:00 in member tz), workout_days_in_a_row (distinct date sequence on workouts table), muscle_groups_week (workouts joined to workout_plans joined to exercise muscle_group taxonomy — may need new column), programme_week_complete (workout_plan_cache progression), reps_lifted_total + sets_completed_total (sum from exercise_logs with sanity caps reps_completed<=100 AND weight_kg<=500 — corrupt rows on Dean's account need zeroing first per §11A).
- Habits behavioural: habits_before_9am, three_habits_day, five_habits_day, all_assigned_habits_day, seven_day_including_weekend, distinct_habit_types, same_habit_repeats — all from daily_habits + member_habits assignment table.
- Checkins: daily_mood_checkins from daily_mood_checkins table (PM-173 era?), checkin_text_responses from wellbeing_checkins WHERE response_text IS NOT NULL, daily_mood_streak similar, weekly_score_climb + monthly_avg_improved from wellbeing_checkins window functions.

Wire what has confirmed data sources; flag the rest as wired=false in DB and document in brain.

B. member-achievements EF update (currently v2). Add filters/buckets for the new metric shape:
- Pillar grid: WHERE pillar IS NOT NULL AND wired = true AND (phil_approved = true OR member is admin)
- Hero/header surface: WHERE is_cross_cutting = true
- Legacy badges drawer: member's earned rows on WHERE pillar IS NULL AND NOT is_cross_cutting AND NOT hidden (preserves the 24 legacy earns)
- Hidden cards: WHERE hidden = true AND (already earned OR show as placeholder slot)
- Return payload shape: { hero: {memberDays, streakOverall}, pillars: { body: [...], habits: [...], ... }, hidden: [...], legacy: [...] }
- For each metric row: include icon_slug, current_tier_earned, next_tier, progress.pct, all earned tier_indices, is_recurring, wired, phil_approved

C. UI rewrite — Direction C + Path B on engagement.html. The mockup `/achievements-mockup-pathb.html` in vyve-site is the visual reference (Pattern 3 levels-up rows, icon-in-tier-frame badges, gold dots underneath for earned tiers, dashed frame for locked). Replace the current trophy-cabinet structure (the three-section "Recently earned / Up next / Trophy cabinet" layout that shipped 29 April PM-3) with:
1. Hero: Latest unlock card + Next-to-unlock card + member_days/streak_overall cross-cutting badges, side by side or stacked on mobile.
2. Pillar Map: 6 collapsed pillar cards (Body, Habits, Mind, Connect, Check-ins, Focus), tap to expand, expanded card shows the Pattern-3 metric rows for that pillar with Path B badges.
3. Hidden drawer: separate "Hidden achievements" section, shows placeholder slot + count of how many are still hidden.
4. Legacy drawer (member's all-time): collapsed by default, shows pillar=NULL earned badges.

Toast/notification batch logic stays as PM-322 spec: "You've earned 5 achievements — tap to see" rather than 5 separate toasts. send-push v13 + achievement-earned-push v2 already wired (§11A).

Lucide icons: import via the same pattern as existing pages — confirm whether vyve-site is using lucide-static SVGs inline or the lucide JS module. If unclear, check how the existing engagement-v2.html or mind.html does it.

D. Path B tier-frame styling. CSS variables for the 10 gemstone colours (bronze #cd7f32, silver #c0c0c0, gold #ffd700, sapphire #0f52ba, ruby #e0115f, emerald #50c878, amethyst #9966cc, pearl #eae0c8, obsidian #3d3635, diamond #b9f2ff — adjust to VYVE palette if these clash with brand). Locked = dashed frame (--vyve-teal at 30% opacity), faded icon (40% opacity), no tier-number pip.

E. Reset mockups to deletable. After UI ships, mark `/achievements-mockup-c.html` and `/achievements-mockup-pathb.html` for removal in a follow-up commit.

F. Brain close — atomic commit:
- changelog: PM-329 (or next available) — "Achievements v2 build shipped — D1 schema applied, 75 new metric rows wired, 211 placeholder tier copy, Direction C + Path B UI live"
- master.md §11A: append v2 build state, supersede the "Phase 3 UI (LIVE — trophy-cabinet redesign 29 April PM-3)" subsection
- backlog: replace the PM-328 "items A+B still open" section with "Lewis copy pass open; Phil sign-off open; everything else shipped"
- staging files: PM-322-achievements-v2-schema.sql can stay as historical record. achievements-migration-map.md stays as reference. achievements-catalog-v1.md stays as reference.

G. vyve-site commit discipline (mandatory):
- Bump sw.js CACHE_NAME suffix
- Bump vbb-marker in index.html (`<span id="vbb-marker">` value, e.g. "Update 23" → next)
- Bump settings-vbb-marker in settings.html (`<span id="settings-vbb-marker">`)
- All in same commit per §23.41 memory rule

OPEN MAPPING QUESTIONS DEAN HASN'T ANSWERED (recommendations exist; defaults are safe):

1. workouts_shared 11 existing earns on a 10-tier ladder; v2 collapses to 2-tier workouts_shared_v2. Recommendation: preserve v1 ladder as legacy, fire v2 ladder fresh. Dean default if no answer: take the recommendation.

2. healthkit_connected one-shot — salvage as v2 body behavioural or retire? Recommendation: salvage, costs nothing. Dean default: take the recommendation.

3. volume_lifted_total has 21 earns despite §11A saying "not yet wired". Confirm by inspecting `_shared/achievements.ts` evaluator code. If wired, document it. If unwired, the 21 earns were a backfill — leave them, no action needed. Recommendation: investigate during evaluator pass A.

WHAT TO DO FIRST IN THE NEW SESSION:

1. Load brain (master.md, changelog.md, backlog.md) per usual protocol.
2. Read `brain/staging/achievements-catalog-v1.md`, `brain/staging/achievements-migration-map.md`, and `brain/staging/PM-322-achievements-v2-schema.sql` for context.
3. Read `_shared/achievements.ts` to see current evaluator shape before extending it. Read `supabase/functions/member-achievements/index.ts` to see what the EF currently returns. Read `engagement.html`'s achievements tab section.
4. Read both mockups in vyve-site: `/achievements-mockup-c.html` and `/achievements-mockup-pathb.html`.
5. Confirm Focus pillar data layer status — does focus_cards or focus_completions table exist? If not, mark Focus 8 metrics as wired=false in DB and skip Focus evaluator work this session.
6. Start with evaluator wiring (item A). Easiest wins first: movement_sessions_logged, workout_before_7am, distinct_habit_types, three_habits_day, five_habits_day, reps_lifted_total + sets_completed_total. Mind pillar last if Phil sign-off is still pending (build evaluator but UI will gate via phil_approved=false).
7. Then member-achievements EF update (item B).
8. Then UI rewrite (item C). Use the mockup as paste-in starting point.
9. Brain close + commit + sw.js + markers all in one atomic vyve-site commit and one atomic brain commit.

VYVEBrain HEAD at handover: d8942703d198a2e42e66f93d29e8008183a72d94 (PM-328 staging artefacts + schema delta committed). Live Supabase already has all the schema changes applied via the two migrations named above — DO NOT re-apply.

PM number to claim: re-fetch live commits at commit time per §23.70. Latest PM before this session was 327; this session shipped data layer under PM-328; UI build will be PM-329 or later depending on what's landed by then.

References:
- brain/staging/achievements-catalog-v1.md (full 90-achievement catalog, Lucide icon assignments)
- brain/staging/achievements-migration-map.md (32-metric v1→v2 mapping table)
- brain/staging/PM-322-achievements-v2-schema.sql (historical record of the schema delta — already applied)
- vyve-site /achievements-mockup-c.html (Direction C layout reference)
- vyve-site /achievements-mockup-pathb.html (Path B badge reference)

Dean's directives still apply: 1-line summaries for surgical patches, single recommendations not menus, no padding, mockup-first on any UI surface, atomic commits with §23.41 + §23.70 discipline, vbb-marker mandatory on every vyve-site commit.

Go.
