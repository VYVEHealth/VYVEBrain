# VYVE Health — Database Schema Snapshot

> Auto-generated from live Supabase project ixjfklpckgxrwjlfsaaz
> Date: 10 April 2026
> Tables: 36 | All RLS enabled

---

## members (8 rows) — PK: id, UNIQUE: email
Core member profiles. Email connects to all other tables via FK.

Key columns: id (uuid PK), email (text UNIQUE), first_name, last_name, phone, created_at, persona (CHECK: NOVA/RIVER/SPARK/SAGE/HAVEN), persona_reason, baseline scores (wellbeing/sleep/energy/stress/physical/diet/social/motivation — int 1-10), training_location, equipment, injuries, exercises_to_avoid, experience_level, training_days_per_week, sleep fields, activity_level, height_cm, weight_kg, tdee fields, life_context (text[]), sensitive_context (bool), goal fields, notification prefs, cert counts, stripe_customer_id, subscription_status, onboarding_complete, age, gender, company, company_slug, welcome_rec 1/2/3, consent fields, theme_preference.

## daily_habits (42 rows) — FK: member_email, habit_id
id, member_email, activity_date, day_of_week, time_of_day (morning/afternoon/evening/night), logged_at, notes, habit_id (FK habit_library), habit_completed.

## workouts (54 rows) — FK: member_email
id, member_email, activity_date, day_of_week, time_of_day, session_number (1 or 2), plan_name, workout_name, duration_minutes, logged_at.

## cardio (19 rows) — FK: member_email
Same as workouts + cardio_type, distance_km.

## session_views (20 rows) — FK: member_email
id, member_email, activity_date, day_of_week, time_of_day, session_number, category, session_name, youtube_url, minutes_watched.

## replay_views (13 rows)
Same structure as session_views.

## wellbeing_checkins (11 rows) — FK: member_email
8 score columns (1-10), composite_score, ai_recommendation, ai_persona, flow_type (active/quiet), engagement_score.

## monthly_checkins (0 rows) — UNIQUE: (member_email, iso_month)
8 score columns (smallint 1-10) + 8 note columns. goal_progress_score (1-10), goal_progress_note. avg_score, ai_report.

## weekly_scores (11 rows) — UNIQUE: (member_email, iso_week, iso_year)
wellbeing_score (1-10), engagement_score (0-100).

## weekly_goals (5 rows) — UNIQUE: (member_email, week_start)
habits_target (3), workouts_target (2), cardio_target (1), sessions_target (1), checkin_target (1).

## workout_plans (244 rows) — exercise library
plan_name, plan_type (PPL/Upper_Lower/Full_Body/Home/Movement_Wellbeing), day_name, day_number, exercise_order, exercise_name, sets, reps, tempo, rest_seconds, notes, video_url, equipment_needed, muscle_group, difficulty, thumbnail_url.

## workout_plan_cache (3 rows) — UNIQUE: member_email
programme_json (jsonb), plan_duration_weeks, current_week, current_session.

## exercise_logs (94 rows)
member_email, exercise_name, activity_date, sets_completed, reps_completed, weight_kg, notes.

## exercise_swaps (3 rows)
member_email, original_exercise, replacement_exercise.

## exercise_notes (1 row)
member_email, exercise_name, note.

## custom_workouts (3 rows)
member_email, workout_name, exercises (jsonb).

## personas (5 rows) — UNIQUE: name
name (NOVA/RIVER/SPARK/SAGE/HAVEN), display_name, tagline, description, suitable_for, never_assign_if, system_prompt, requires_professional_review.

## persona_switches (0 rows)
member_email, from_persona, to_persona, reason.

## running_plan_cache (3 rows) — UNIQUE: cache_key
goal, level, days_per_week, timeframe_weeks, long_run_day, plan_json (jsonb), use_count.

## knowledge_base (15 rows)
topic, subtopic, content, source, permit_general_advice, active.

## habit_themes (5 rows)
theme (sleep/movement/nutrition/mindfulness/social), display_name, description, active, month_label.

## habit_library (30 rows)
habit_pot, habit_title, habit_description, habit_prompt, difficulty (easy/medium/hard).

## member_habits (4 rows)
member_email, habit_id (FK habit_library), assigned_by (onboarding/ai/theme_update/self), active.

## nutrition_logs (3 rows)
member_email, activity_date, meal_type (breakfast/lunch/dinner/snacks), food_name, brand, barcode, off_id, calories_kcal, protein_g, carbs_g, fat_g, fibre_g, serving_size_g, serving_unit, servings.

## nutrition_my_foods (0 rows)
Same nutrition columns minus activity_date/meal_type/servings.

## nutrition_common_foods (125 rows)
food_name, category, brand, nutrition columns, search_terms, source.

## weight_logs (3 rows) — UPSERT: (member_email, logged_date)
member_email, logged_date, weight_kg.

## service_catalogue (21 rows)
type (live_session/replay/workout_plan/running_plan), category, name, description, youtube_url, riverside_url, duration_minutes, schedule_day/time, difficulty, active.

## certificates (0 rows)
member_email, activity_type (habits/workouts/cardio/checkins/sessions), milestone_count, charity_moment_triggered, certificate_url, global_cert_number.

## employer_members (0 rows)
member_email, employer_name, department, job_title, enrolled_at.

## engagement_emails (22 rows)
member_email, stream (A/B/C1/C2/C3), email_key, sent_at, brevo_message_id, open_count, click_count, suppressed.

## session_chat (3 rows)
session_type, member_email, display_name, message.

## ai_interactions (7 rows)
member_email, triggered_by (weekly_checkin/onboarding/running_plan/milestone/manual), persona, prompt_summary, recommendation, acted_on, decision_log (jsonb).

## activity_dedupe (494 rows)
source_table, member_email, activity_date, iso_week, iso_year, raw_payload (jsonb).

## qa_submissions (3 rows)
member_email, submitted_at.

---

## SQL Functions (15)
set_activity_time_fields, get_charity_total, get_capped_activity_count, next_certificate_number, set_checkin_iso_week, cap_cardio, cap_daily_habits, cap_kahunas_checkins, cap_session_views, cap_workouts, increment_cardio_counter, increment_checkin_counter, increment_habit_counter, increment_session_counter, increment_workout_counter.

All 15 have search_path = public (fixed 10 April 2026).
