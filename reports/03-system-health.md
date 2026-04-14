# VYVE Health - System Health & Monitoring Report
> Report 3 of 11 | 14 April 2026 | 3 active incidents, 8 cron jobs, 31 platform_alerts
> Data: cron.job_run_details (449 runs/7d), platform_alerts, pg_stat_activity

## ACTIVE INCIDENTS

### 1. Push notifications broken since 11 April
- habit-reminder (20:00 UTC) + streak-reminder (18:00 UTC) both FAILING
- 6 consecutive failures. Error: invalid JSON syntax in cron SQL
- Root cause: app.service_role_key not configured, Bearer token concatenation produces malformed JSON
- Members receiving ZERO push notifications for 3+ days
- **FIX: 30 mins.** Rewrite cron SQL to remove Authorization header (let EF handle auth)

### 2. 4 client-side JS bugs active
- workouts-library.js:40 - SyntaxError
- yoga-live.html:142 - switchTab not defined
- index.html:853 - getTimeGreeting not defined  
- workouts.html - showToast not defined
- **FIX: 2-3 hrs total**

### 3. 10 auth 401 errors in 7 days
- JWT expiring mid-session across 6 endpoints
- **FIX: Build global 401 interceptor in auth.js. 3 hrs**

## Cron Job Status (7 days)
| Job | Schedule | Status | Runs | Fails |
|-----|----------|--------|------|-------|
| re-engagement-scheduler | 08:00 daily | HEALTHY | 7 | 0 |
| daily-report | 08:05 daily | HEALTHY | 7 | 0 |
| weekly-report | 08:10 Mon | HEALTHY | 1 | 0 |
| monthly-report | 08:15 1st | NO RUNS | 0 | 0 |
| certificate-checker | 09:00 daily | HEALTHY | 7 | 0 |
| habit-reminder | 20:00 daily | FAILING | 0 | 3 |
| streak-reminder | 18:00 daily | FAILING | 0 | 3 |
| warm-ping | Every 5 min | HEALTHY | 424 | 0 |

## Key Discovery
**platform_alerts table EXISTS and is capturing real errors (31 records)** but has ZERO RLS policies - nobody can read it. Monitoring data exists but is invisible.

## Error Summary (7 days)
- js_error: 15 (high)
- auth_401_*: 10 (critical)
- network_error_*: 4 (critical)
- promise_rejection: 2 (high)

## Infrastructure Health
- Connections: 6/60 (1 active, 3 idle, 0 idle-in-tx) - HEALTHY
- Database: 20 MB / 8 GB limit - HEALTHY
- WAL archiving: ON - HEALTHY
- Onboarding: 8 new members in 7 days, 100% success - HEALTHY

## Proposed: health-monitor EF
Schedule: 10:00 UTC daily. 8 checks: crons, platform_alerts, onboarding, Anthropic, Brevo, DB resources, push subs, stuck plans. Traffic-light email. **Build: 4-5 hrs**
