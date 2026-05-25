-- PM-322 Achievements v2 schema delta (D1 — extend existing tables)
-- Author: Dean (via Claude)
-- Date: 25 May 2026 PM
-- Apply order: ALTER → UPDATE existing 32 rows → INSERT new v2 rows → (Lewis copy pass for tiers)
--
-- This migration ONLY adds columns. It does NOT touch:
--   - achievement_tiers (existing 327 rows preserved as-is)
--   - member_achievements (existing 345 earns preserved as-is)
-- That guarantees zero data loss on apply.
--
-- After apply:
--   - SELECT * FROM achievement_metrics WHERE pillar IS NOT NULL   → v2 active catalog (16 rows after UPDATE block)
--   - SELECT * FROM achievement_metrics WHERE is_cross_cutting     → tenure/streak_overall (Hero/header surface)
--   - SELECT * FROM achievement_metrics WHERE pillar IS NULL AND NOT is_cross_cutting → legacy v1 rows (16 retired metrics)

BEGIN;

-- ============================================
-- 1. Schema delta
-- ============================================

ALTER TABLE achievement_metrics
  ADD COLUMN IF NOT EXISTS pillar text,
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS icon_slug text,
  ADD COLUMN IF NOT EXISTS is_cross_cutting boolean NOT NULL DEFAULT false;

-- Enforce pillar enum
ALTER TABLE achievement_metrics
  DROP CONSTRAINT IF EXISTS achievement_metrics_pillar_check;

ALTER TABLE achievement_metrics
  ADD CONSTRAINT achievement_metrics_pillar_check
  CHECK (pillar IS NULL OR pillar IN ('body','habits','mind','connect','checkins','focus'));

-- Index for the v2 grid filter
CREATE INDEX IF NOT EXISTS idx_achievement_metrics_pillar
  ON achievement_metrics(pillar) WHERE pillar IS NOT NULL;

-- ============================================
-- 2. Update existing v1 rows that survive into v2
-- ============================================
-- Per migration map: 9 KEEP, 3 RENAME (display unchanged), 4 EXTEND.
-- All get pillar + icon_slug populated. Retired rows left untouched.

-- KEEP (Body)
UPDATE achievement_metrics SET pillar='body', icon_slug='dumbbell'    WHERE slug='workouts_logged';
UPDATE achievement_metrics SET pillar='body', icon_slug='footprints'  WHERE slug='cardio_logged';
UPDATE achievement_metrics SET pillar='body', icon_slug='dumbbell'    WHERE slug='volume_lifted_total';
UPDATE achievement_metrics SET pillar='body', icon_slug='timer'       WHERE slug='workout_minutes_total';
UPDATE achievement_metrics SET pillar='body', icon_slug='timer'       WHERE slug='cardio_minutes_total';
UPDATE achievement_metrics SET pillar='body', icon_slug='dumbbell'    WHERE slug='streak_workouts';
UPDATE achievement_metrics SET pillar='body', icon_slug='footprints'  WHERE slug='streak_cardio';

-- KEEP (Habits)
UPDATE achievement_metrics SET pillar='habits', icon_slug='check-circle' WHERE slug='habits_logged';
UPDATE achievement_metrics SET pillar='habits', icon_slug='check-circle' WHERE slug='streak_habits';

-- KEEP (Check-ins)
UPDATE achievement_metrics SET pillar='checkins', icon_slug='calendar-days'  WHERE slug='checkins_completed';
UPDATE achievement_metrics SET pillar='checkins', icon_slug='calendar-range' WHERE slug='monthly_checkins_completed';
UPDATE achievement_metrics SET pillar='checkins', icon_slug='calendar-days'  WHERE slug='streak_checkin_weeks';

-- KEEP (Connect)
UPDATE achievement_metrics SET pillar='connect', icon_slug='video'       WHERE slug='sessions_watched';
UPDATE achievement_metrics SET pillar='connect', icon_slug='play-circle' WHERE slug='replays_watched';
UPDATE achievement_metrics SET pillar='connect', icon_slug='video'       WHERE slug='streak_sessions';

-- Cross-cutting (no pillar, surface in Hero only)
UPDATE achievement_metrics SET is_cross_cutting=true, icon_slug='calendar' WHERE slug='member_days';
UPDATE achievement_metrics SET is_cross_cutting=true, icon_slug='flame'    WHERE slug='streak_overall';

-- ============================================
-- 3. Retire-legacy rows: explicit no-op
-- ============================================
-- These 12 v1 metrics stay in the table with pillar=NULL by default.
-- Comment block documents the intent for future readers; no UPDATE needed.
--
-- Retired (pillar stays NULL, earns preserved as legacy badges):
--   exercises_logged          (32 earns, collapsed into B6 reps + B7 sets)
--   meals_logged              (3 earns, nutrition deprioritised in v2)
--   weights_logged            (18 earns, body comp not a v2 pillar)
--   custom_workouts_created   (4 earns, conceptually replaced by v2 B19 first_custom_workout)
--   workouts_shared           (11 earns, replaced by v2 C11 with new ladder; see open Q1 in migration map)
--   lifetime_steps            (0 earns, replaced by v2 B21 lifetime_steps_v2)
--   lifetime_distance_hk      (0 earns, retired entirely)
--   lifetime_active_energy    (0 earns, replaced by v2 B22 lifetime_active_energy_v2)
--   nights_slept_7h           (0 earns, sleep data quality too inconsistent)
--   tour_complete             (0 earns, blocked on In-App Tour build)
--   healthkit_connected       (0 earns, may salvage in v2 — open Q2)
--   persona_switched          (0 earns, retire)
--   full_five_weeks           (0 earns, replaced by v2 F4 focus_from_every_pillar_week)
--   charity_tips              (0 earns, replaced by v2 C15 with 3-tier ladder)
--   personal_charity_contribution (0 earns, replaced by v2 C14 with 3-tier ladder)

-- ============================================
-- 4. Insert new v2 metric rows (catalog headers only; tiers come from Lewis copy pass)
-- ============================================
-- 13 net-new metrics across Mind (most of them), Focus, plus a handful of Body/Habits/Connect/Check-in extensions.
-- copy_status on tiers will be 'placeholder' until Lewis approves.
-- This block can be expanded if more metrics are added during item A.

-- Body (net-new)
INSERT INTO achievement_metrics (slug, category, display_name, source, hidden_without_hk, is_recurring, pillar, icon_slug, sort_order) VALUES
  ('movement_sessions_logged', 'counts',       'Movement Sessions',       'inline', false, false, 'body', 'wind',       100),
  ('reps_lifted_total',         'counts',       'Total Reps Lifted',       'inline', false, false, 'body', 'activity',   101),
  ('sets_completed_total',      'counts',       'Total Sets Completed',    'inline', false, false, 'body', 'activity',   102),
  ('distance_total',            'counts',       'Total Distance Covered',  'inline', false, false, 'body', 'route',      103),
  ('workout_before_7am',        'counts',       'Early Bird Workouts',     'inline', false, false, 'body', 'sunrise',    104),
  ('workout_days_in_a_row',     'streaks',      'Consecutive Workout Days','inline', false, false, 'body', 'dumbbell',   105),
  ('muscle_groups_week',        'variety',      'All Muscle Groups Week',  'sweep',  false, true,  'body', 'activity',   106),
  ('programme_week_complete',   'counts',       'Programme Weeks',         'inline', false, false, 'body', 'trophy',     107),
  ('streak_movement',           'streaks',      'Movement Streak',         'inline', false, false, 'body', 'wind',       108),
  ('first_workout',             'one_shot',     'First Workout',           'inline', false, false, 'body', 'dumbbell',   109),
  ('first_cardio',              'one_shot',     'First Cardio Session',    'inline', false, false, 'body', 'footprints', 110),
  ('first_custom_workout',      'one_shot',     'First Custom Workout',    'inline', false, false, 'body', 'dumbbell',   111),
  ('programme_complete_8wk',    'one_shot',     'Programme Completed',     'inline', false, false, 'body', 'trophy',     112),
  ('lifetime_steps_v2',         'hk',           'Lifetime Steps',          'sweep',  true,  false, 'body', 'footprints', 113),
  ('lifetime_active_energy_v2', 'hk',           'Lifetime Active Energy',  'sweep',  true,  false, 'body', 'activity',   114);

-- Habits (net-new)
INSERT INTO achievement_metrics (slug, category, display_name, source, hidden_without_hk, is_recurring, pillar, icon_slug, sort_order) VALUES
  ('distinct_habit_types',         'variety',  'Distinct Habit Types',      'sweep',  false, false, 'habits', 'check-circle',  200),
  ('same_habit_repeats',           'counts',   'Habit Devotion',            'sweep',  false, false, 'habits', 'repeat',        201),
  ('three_habits_day',             'one_shot', 'Three Habits in a Day',     'inline', false, false, 'habits', 'check-circle',  202),
  ('five_habits_day',              'one_shot', 'Five Habits in a Day',      'inline', false, false, 'habits', 'check-circle',  203),
  ('all_assigned_habits_day',      'counts',   'Full Habit Days',           'inline', false, false, 'habits', 'calendar-check',204),
  ('seven_day_including_weekend',  'counts',   'Weekend-Inclusive Weeks',   'sweep',  false, false, 'habits', 'calendar-check',205),
  ('habits_before_9am',            'counts',   'Morning Habits',            'inline', false, false, 'habits', 'sunrise',       206),
  ('first_habit',                  'one_shot', 'First Habit Logged',        'inline', false, false, 'habits', 'check-circle',  207),
  ('weekly_habits_total',          'counts',   'Weekly Habit Total',        'sweep',  false, true,  'habits', 'check-circle',  208);

-- Mind (entirely net-new pillar)
INSERT INTO achievement_metrics (slug, category, display_name, source, hidden_without_hk, is_recurring, pillar, icon_slug, sort_order) VALUES
  ('mind_sessions_logged',     'counts',     'Mind Sessions',          'inline', false, false, 'mind', 'brain',     300),
  ('breathwork_sessions',      'counts',     'Breathwork Sessions',    'inline', false, false, 'mind', 'wind',      301),
  ('journal_entries',          'counts',     'Journal Entries',        'inline', false, false, 'mind', 'book-open', 302),
  ('meditation_sessions',      'counts',     'Meditation Sessions',    'inline', false, false, 'mind', 'flame',     303),
  ('mind_minutes_total',       'time_totals','Mind Minutes',           'inline', false, false, 'mind', 'brain',     304),
  ('distinct_mind_types',      'variety',    'Distinct Mind Types',    'sweep',  false, false, 'mind', 'brain',     305),
  ('affirmations_saved',       'counts',     'Affirmations Saved',     'inline', false, false, 'mind', 'heart',     306),
  ('streak_mind',              'streaks',    'Mind Streak',            'inline', false, false, 'mind', 'brain',     307),
  ('meditation_streak',        'streaks',    'Meditation Streak',      'inline', false, false, 'mind', 'flame',     308),
  ('mind_before_8am',          'counts',     'Morning Mind',           'inline', false, false, 'mind', 'sunrise',   309),
  ('visualisation_logged',     'counts',     'Visualisation Practice', 'inline', false, false, 'mind', 'eye',       310),
  ('first_mind_session',       'one_shot',   'First Mind Session',     'inline', false, false, 'mind', 'brain',     311),
  ('long_meditation',          'counts',     'Long Meditations',       'inline', false, false, 'mind', 'timer',     312);

-- Connect (net-new — sessions_watched/replays_watched already updated above)
INSERT INTO achievement_metrics (slug, category, display_name, source, hidden_without_hk, is_recurring, pillar, icon_slug, sort_order) VALUES
  ('session_minutes_yoga',         'time_totals','Yoga Session Minutes',          'inline', false, false, 'connect', 'video',          400),
  ('session_minutes_mindfulness',  'time_totals','Mindfulness Session Minutes',   'inline', false, false, 'connect', 'video',          401),
  ('session_minutes_therapy',      'time_totals','Therapy Session Minutes',       'inline', false, false, 'connect', 'video',          402),
  ('session_minutes_education',    'time_totals','Education Session Minutes',     'inline', false, false, 'connect', 'video',          403),
  ('reactions_given',              'counts',     'Reactions Given',               'inline', false, false, 'connect', 'heart',          404),
  ('reactions_received',           'counts',     'Reactions Received',            'sweep',  false, false, 'connect', 'heart',          405),
  ('checkins_with_reactions',      'counts',     'Check-Ins That Got Love',       'sweep',  false, false, 'connect', 'heart',          406),
  ('chat_messages_posted',         'counts',     'Live Chat Messages',            'inline', false, false, 'connect', 'message-circle', 407),
  ('workouts_shared_v2',           'counts',     'Workouts Shared',               'inline', false, false, 'connect', 'share',          408),
  ('distinct_session_categories',  'variety',    'Distinct Session Categories',   'sweep',  false, false, 'connect', 'video',          409),
  ('personal_charity_contribution_v2','counts', 'Charity Months You Triggered',  'sweep',  false, false, 'connect', 'gift',           410),
  ('charity_tips_v2',              'counts',     'Charity Milestones Witnessed',  'sweep',  false, true,  'connect', 'gift',           411),
  ('first_session_watched',        'one_shot',   'First Live Session',            'inline', false, false, 'connect', 'video',          412),
  ('first_replay_watched',         'counts',     'Replay Pioneer',                'inline', false, false, 'connect', 'play-circle',    413);

-- Check-ins (net-new — checkins_completed/monthly_checkins_completed/streak_checkin_weeks already updated above)
INSERT INTO achievement_metrics (slug, category, display_name, source, hidden_without_hk, is_recurring, pillar, icon_slug, sort_order) VALUES
  ('daily_mood_checkins',     'counts',   'Daily Mood Logs',         'inline', false, false, 'checkins', 'smile',        500),
  ('checkin_text_responses',  'counts',   'Reflective Check-Ins',    'inline', false, false, 'checkins', 'pencil',       501),
  ('daily_mood_streak',       'streaks',  'Daily Mood Streak',       'inline', false, false, 'checkins', 'smile',        502),
  ('weekly_score_climb',      'streaks',  'Weekly Climb',            'sweep',  false, false, 'checkins', 'trending-up',  503),
  ('monthly_avg_improved',    'counts',   'Monthly Improvement',     'sweep',  false, false, 'checkins', 'trending-up',  504),
  ('first_checkin',           'counts',   'First Check-Ins',         'inline', false, false, 'checkins', 'calendar-days',505);

-- Focus (entirely net-new pillar)
INSERT INTO achievement_metrics (slug, category, display_name, source, hidden_without_hk, is_recurring, pillar, icon_slug, sort_order) VALUES
  ('focus_cards_completed',          'counts',   'Focus Cards Completed',       'inline', false, false, 'focus', 'check-square', 600),
  ('daily_focus_all_complete',       'counts',   'Daily Focus Days',            'sweep',  false, false, 'focus', 'target',       601),
  ('same_focus_completed_10x',       'counts',   'Focus Devotion',              'sweep',  false, false, 'focus', 'repeat',       602),
  ('focus_from_every_pillar_week',   'variety',  'Cross-Pillar Focus Weeks',    'sweep',  false, true,  'focus', 'layers',       603),
  ('distinct_focuses_tried',         'variety',  'Distinct Focuses',            'sweep',  false, false, 'focus', 'target',       604),
  ('streak_focus',                   'streaks',  'Focus Streak',                'inline', false, false, 'focus', 'target',       605),
  ('weekly_focus_completion',        'counts',   'Full Focus Weeks',            'sweep',  false, false, 'focus', 'target',       606),
  ('first_focus_complete',           'counts',   'Focus Beginnings',            'inline', false, false, 'focus', 'target',       607);

-- Hidden (cross-pillar, all one-shots with hidden=true)
INSERT INTO achievement_metrics (slug, category, display_name, source, hidden_without_hk, is_recurring, pillar, icon_slug, hidden, sort_order) VALUES
  ('honest_checkin_tier5', 'one_shot', 'Hidden Achievement', 'sweep',  false, false, NULL, 'clipboard-check', true, 700),
  ('came_back',            'one_shot', 'Hidden Achievement', 'inline', false, false, NULL, 'sunrise',         true, 701),
  ('full_house',           'one_shot', 'Hidden Achievement', 'sweep',  false, false, NULL, 'layers',          true, 702),
  ('first_light',          'one_shot', 'Hidden Achievement', 'inline', false, false, NULL, 'sunrise',         true, 703),
  ('owl',                  'one_shot', 'Hidden Achievement', 'inline', false, false, NULL, 'moon',            true, 704),
  ('reciprocity',          'one_shot', 'Hidden Achievement', 'sweep',  false, false, NULL, 'heart',           true, 705),
  ('streak_saver',         'one_shot', 'Hidden Achievement', 'sweep',  false, false, NULL, 'flame',           true, 706),
  ('anniversary',          'one_shot', 'Hidden Achievement', 'sweep',  false, false, NULL, 'gift',            true, 707),
  ('quiet_wins',           'one_shot', 'Hidden Achievement', 'sweep',  false, false, NULL, 'layers',          true, 708),
  ('comeback_PB',          'one_shot', 'Hidden Achievement', 'inline', false, false, NULL, 'trophy',          true, 709);

-- ============================================
-- 5. Post-apply verification
-- ============================================
-- Run these manually after COMMIT to confirm. (Not in the transaction — RAISE NOTICE
-- is the cleanest way but kept out of the body to keep the migration idempotent and
-- readable.)
--
--   SELECT pillar, count(*) FROM achievement_metrics WHERE pillar IS NOT NULL GROUP BY pillar ORDER BY pillar;
--   -- expect: body=22, habits=11, mind=13, connect=17, checkins=9, focus=8  → total 80
--   --   (the +10 to get to 90 are hidden cross-pillar rows where pillar IS NULL AND hidden=true)
--
--   SELECT count(*) FROM achievement_metrics WHERE hidden = true;  -- expect 10
--   SELECT count(*) FROM achievement_metrics WHERE is_cross_cutting = true;  -- expect 2
--   SELECT count(*) FROM achievement_metrics WHERE pillar IS NULL AND NOT is_cross_cutting AND NOT hidden;  -- expect 12 (retired v1)
--   SELECT count(*) FROM member_achievements;  -- expect unchanged (345)

COMMIT;
