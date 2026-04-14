# VYVE Health - Performance & Scalability Report
> Report 4 of 11 | 14 April 2026 | 61 tables, 20 MB, 15 auth users, 6 connections
> Data: pg_stat_user_tables, pg_stat_user_indexes, pg_stat_activity

## Executive Summary
Platform performs well at 15 members. 10 tables missing member_email indexes (workouts has 3,654 seq scans). Quick win: 2-minute migration adds all indexes + VACUUM ANALYZE for 30-50% dashboard improvement.

## Missing Indexes (10 tables)
| Table | Seq Scans | Rows | Impact |
|-------|-----------|------|--------|
| workouts | 3,654 | 59 | #1 bottleneck candidate |
| cardio | 3,101 | 19 | Dashboard query |
| kahunas_checkins | 1,438 | 14 | Re-engagement |
| certificates | 1,175 | 0 | Dashboard load |
| custom_workouts | 620 | 1 | Low priority |
| activity_dedupe | 5 | 511 | Largest member table |
| ai_interactions | 93 | 19 | Reporting |
| persona_switches | 40 | 0 | Low priority |
| qa_submissions | 30 | 3 | Low priority |
| session_chat | 4 | 3 | Low priority |

## Quick Win Migration (2 mins, zero risk)
```sql
CREATE INDEX IF NOT EXISTS idx_workouts_member_email ON workouts(member_email);
CREATE INDEX IF NOT EXISTS idx_cardio_member_email ON cardio(member_email);
CREATE INDEX IF NOT EXISTS idx_kahunas_member_email ON kahunas_checkins(member_email);
CREATE INDEX IF NOT EXISTS idx_certificates_member_email ON certificates(member_email);
CREATE INDEX IF NOT EXISTS idx_custom_workouts_member_email ON custom_workouts(member_email);
CREATE INDEX IF NOT EXISTS idx_activity_dedupe_member_email ON activity_dedupe(member_email);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_member_email ON ai_interactions(member_email);
CREATE INDEX IF NOT EXISTS idx_persona_switches_member_email ON persona_switches(member_email);
CREATE INDEX IF NOT EXISTS idx_qa_submissions_member_email ON qa_submissions(member_email);
CREATE INDEX IF NOT EXISTS idx_session_chat_member_email ON session_chat(member_email);
VACUUM ANALYZE;
```

## Table Bloat
- workout_plan_cache: 280% dead tuples (28 dead, 10 live)
- kahunas_checkins: 193%, workouts: 81%, daily_habits: 81%
- 12 tables never autovacuumed. VACUUM ANALYZE cleans this up

## Scaling Projections
- **100 members:** Add indexes (done). Re-engagement scheduler needs batching. Brevo quota monitoring
- **500 members (Sage):** Pre-computed dashboard stats needed (member-dashboard does 11 queries per load). Connection pooling. 12-15 hrs work
- **1,000+ members:** Data retention policy. Table partitioning. Anthropic spend management
