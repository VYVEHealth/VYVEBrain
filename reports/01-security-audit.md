# VYVE Health - Security Audit Report
> Report 1 of 11 | 14 April 2026 | 35 findings across 8 categories
> Based on: 61 tables, 68 RLS policies, 30 triggers, 20 core EF code reviews

## Executive Summary
**No critical vulnerabilities found.** All 61 tables have RLS. All member data scoped to auth.email(). Secrets server-side only. JWT auth on critical EFs. The findings are enterprise-readiness improvements, not emergencies.

## RLS Security (8 findings)
- **PASS:** All 61 tables have RLS enabled
- **SEC-002 MEDIUM:** platform_alerts has RLS but ZERO policies - table is inaccessible. 31 error records invisible. ADD: SELECT policy for team@vyvehealth.co.uk
- **SEC-003 MEDIUM:** running_plan_cache has public INSERT + UPDATE (any authenticated user can write any row). CHANGE to member_email = auth.email()
- **SEC-004 LOW:** members table has 3 overlapping policies (ALL + SELECT + UPDATE). DROP redundant 2
- **SEC-005 LOW:** ai_decisions INSERT policy is 'true' (any user can insert). Consider restricting
- **PASS:** All 18 cc_* tables correctly scoped to team@vyvehealth.co.uk
- **PASS:** All 27 member-scoped tables correctly use member_email = auth.email()
- **PASS:** Public-read tables are appropriately read-only

## Edge Function Auth (7 findings)
- **PASS:** member-dashboard (v37) - JWT-only, anon key rejected, CORS restricted
- **PASS:** onboarding (v74) - CORS restricted to www.vyvehealth.co.uk, error alerting, answers backup
- **SEC-011 HIGH:** check-cron (v18) OVERWRITTEN - does NOT check crons. Just queries for 'Stuart'. Entire monitoring non-functional
- **SEC-012 MEDIUM:** re-engagement-scheduler - no Anthropic rate limiting on AI calls
- **SEC-013 MEDIUM:** daily-report - no system health checks, only member activity
- **PASS:** All EFs use service-role key server-side only
- **INFO:** verify_jwt:false on most EFs is by design (internal auth handling)

## Client-Side Security (6 findings)
- **SEC-016 HIGH:** XSS via innerHTML rendering of AI content. Need DOMPurify. ~1 hr fix
- **SEC-017 HIGH:** No CSP headers on any portal page. Need meta tags. ~2-3 hrs
- **SEC-018 MEDIUM:** PostHog receives raw emails (PII). Need SHA-256 hash. ~1 hr
- **SEC-019 MEDIUM:** No client-side error tracking visible (platform_alerts exists but no RLS)
- **SEC-020 LOW:** localStorage stores sensitive session data without encryption (acceptable with XSS fix)
- **PASS:** Auth pattern consistent across all portal pages (window.vyveSupabase)

## Data Protection (5 findings)
- **SEC-022 HIGH:** No GDPR Article 20 data portability. Need data-export EF. 4-5 hrs
- **SEC-023 HIGH:** No automated right to erasure. Need delete-member EF. 5-6 hrs
- **SEC-024 MEDIUM:** Health data classification unclear for Article 9 special category
- **PASS:** Employer dashboard correctly anonymises all data
- **SEC-026 MEDIUM:** No data processor register document

## Secrets, Triggers, Input Validation (9 findings)
- **PASS:** No API keys in GitHub repos
- **LOW:** vyve-command-centre repo is public (anon key visible, acceptable)
- **PASS:** github-proxy secured with GITHUB_PROXY_SECRET
- **PASS:** Activity cap triggers working on all 4 tables
- **PASS:** Counter increment triggers active
- **PASS:** Time field triggers correct
- **MEDIUM:** No input payload size limits on EFs
- **PASS:** Supabase REST API prevents SQL injection by design
- **LOW:** Onboarding accepts unconstrained free-text fields

## Priority Actions
1. **This week:** XSS sanitisation + CSP headers (3-4 hrs)
2. **This week:** PostHog PII hash + check-cron rebuild (3-4 hrs)
3. **Before enterprise:** GDPR data export + deletion (9-11 hrs)
4. **Before enterprise:** running_plan_cache policies + processor register (4-5 hrs)
