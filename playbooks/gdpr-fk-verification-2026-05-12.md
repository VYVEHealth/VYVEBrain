# GDPR erasure pipeline — live FK + RPC verification (12 May 2026)

**Drafted:** 12 May 2026, PM-66 staging session (while Dean away).
**Author:** Claude.
**Purpose:** Verify the gdpr_erasure_purge RPC handles ALL NO-ACTION FKs on members.email. This was on the backlog as "5 NO-ACTION FKs should be standardised to CASCADE" with implied risk that erasure might fail. Live verification shows it doesn't.

---

## Live state, 12 May 2026 ~09:30 UTC

**24 foreign keys reference `members.email` in production:**

- **19 use CASCADE delete:** ai_interactions, cardio, certificates, daily_habits, employer_members, engagement_emails, member_habits, member_home_state, member_running_plans, member_stats, nutrition_logs, nutrition_my_foods, persona_switches, push_subscriptions_native, qa_submissions, replay_views, session_views, wellbeing_checkins, workouts
- **5 use NO ACTION:** custom_workouts, exercise_logs, exercise_swaps, shared_workouts (via shared_by), workout_plan_cache

**The gdpr_erasure_purge(p_email) RPC explicitly deletes from all 5 NO-ACTION children** before deleting from members. Verified by reading the function definition live:
- `custom_workouts`, `exercise_logs`, `exercise_swaps`, `workout_plan_cache` are listed at the top of `v_member_email_tables` with a comment "NO-ACTION FK tables (must be deleted explicitly before members)"
- `shared_workouts` (via `shared_by` column, different name from `member_email`) is deleted in its own block immediately after the array loop
- The final `DELETE FROM public.members WHERE email = p_email` therefore never encounters an FK violation

**Plus 20 additional tables with NO FK to members** are also cleaned by the RPC explicitly. All 20 verified to have a `member_email` column (the DELETE statements will work).

---

## Conclusion

GDPR Article 17 erasure is provably safe today. The "5 NO-ACTION FKs should be standardised to CASCADE" backlog item is **schema-hygiene only**, not a launch blocker.

Down-tier:
- Was: "P1 — standardise 5 NO-ACTION FKs to CASCADE"
- Should be: "P3 — schema hygiene: standardise 5 NO-ACTION FKs to CASCADE for cleaner schema. Erasure is already correct; this is cosmetic + future-proofing."

---

## Additional check: daily_habits.habit_id → habit_library.id is also NO ACTION

This FK is unrelated to GDPR erasure (different parent table). It's a different concern: it blocks deletion of rows from `habit_library` if any member has logged the habit. Worth flagging but a different kind of risk — operational, not member-facing.

Backlog item: "audit habit_library cleanup path — verify is_active=false toggle is the canonical way to retire a habit, not DELETE."

---

*End of GDPR verification. No code changes. Brain entry only.*
