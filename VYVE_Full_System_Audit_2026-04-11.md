# VYVE Health — Full System Audit Report

**Date:** 11 April 2026
**Auditor:** Claude (Principal Engineer / Security Auditor)
**Scope:** All layers — architecture, Supabase, Edge Functions, frontend, security, performance
**Evidence basis:** Live code inspection via GitHub Composio + Supabase SQL queries + Edge Function source review

---

## 1. EXECUTIVE SUMMARY

**Production ready?** CONDITIONAL YES — for current scale (~10 active members). NOT ready for enterprise deployment without addressing the critical items below.

**Biggest hidden risk:** The `member-dashboard` Edge Function has `verify_jwt: false` AND still accepts a raw `?email=` query parameter. Any unauthenticated user who knows a member's email can pull their complete dashboard data — activity history, persona, company, wellbeing scores, certificates. This is a GDPR data breach vector. The same pattern exists in the `onboarding` function (accepts any email from the public internet, creates auth users, and writes to the database with no verification that the person submitting is who they claim to be).

**Overall assessment:** The platform works. The core product loop (onboard → track → check-in → AI recommendations) is functional. The Brain repo is well-structured and genuinely useful for continuity. But the system has accumulated security shortcuts during rapid iteration that are now structural risks. The gap between "MVP that works for 10 friends" and "platform an enterprise client trusts with employee health data" is real and addressable, but requires focused effort on auth enforcement, input validation, and CORS tightening.

---

## 2. WHAT IS GOOD

**Architecture decisions that should be kept:**

- **Brain repo (VYVEBrain):** Excellent continuity system. master.md is accurate, changelog is maintained, backlog is prioritised. Any engineer or AI can pick this up cold. This is genuinely better than what most startups at this stage have.

- **RLS coverage:** All 39 tables have RLS enabled. Member-scoped tables use `auth.email() = member_email`. Public-read tables (habit_library, personas, service_catalogue etc.) correctly use `SELECT` only with `qual = true`. This is solid.

- **Edge Function architecture:** Separating AI calls server-side is correct. The Anthropic key never touches client code. The two-phase onboarding (fast return + `waitUntil` for workout generation) is a good pattern for perceived performance.

- **Onboarding sophistication:** v48 is genuinely well-built. Hard persona rules with AI fallback, stress scale awareness, FK race condition fix, decision logging to `ai_decisions` table, proper error handling with retry on the frontend. This has clearly been battle-tested.

- **Database schema quality:** Good use of unique constraints (member_email + activity_date, member_email + week_start, etc.), proper FK relationships to members table, activity capping via application logic. The `activity_dedupe` table for over-cap inserts rather than silent discards is thoughtful.

- **Index coverage:** Composite indexes exist on the key query paths (member_email + activity_date, member_email + exercise_name). Unique constraints double as indexes. No obvious missing indexes for current query patterns.

- **Service worker:** Stale-while-revalidate strategy for portal pages is appropriate. Cache versioning is disciplined. Push notification handler is clean.

- **Consent gate:** auth.js checks `terms_accepted_at` before revealing any page, with proper fail-open logic to avoid lockouts. Good GDPR compliance pattern.

---

## 3. CRITICAL ISSUES (Must Fix Before Enterprise)

### C1. member-dashboard: Unauthenticated Data Access via ?email= Parameter

**File:** `member-dashboard` Edge Function v25
**verify_jwt:** `false`
**Impact:** HIGH — full member data exposure

The function accepts JWT auth but falls back to a raw `?email=` query parameter:

```
if (!email) {
  const url = new URL(req.url);
  email = url.searchParams.get('email')?.toLowerCase() ?? null;
}
```

Anyone can call `https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/member-dashboard?email=victim@example.com` and receive that member's complete data: name, persona, company, all activity dates, wellbeing scores, certificates.

**The function uses `SUPABASE_SERVICE_ROLE_KEY` for all queries** — it bypasses RLS entirely. The RLS policies on the database are irrelevant here because the Edge Function itself is the auth boundary, and it has none.

**Fix:** Remove `?email=` fallback entirely. Set `verify_jwt: true`. Derive email solely from the JWT.

### C2. onboarding: Public Endpoint Creates Auth Users and Writes to DB

**File:** `onboarding` Edge Function v48
**verify_jwt:** `false`
**CORS:** `Access-Control-Allow-Origin: '*'`

This function accepts POST from anywhere on the internet, takes an email address from the request body, creates a Supabase Auth user for that email, writes a full member record, assigns habits, fires a Make webhook, and sends a welcome email with a password reset link. There is zero verification that the submitter is the person who owns that email or has paid via Stripe.

**Attack scenario:** An attacker POSTs `{"email":"ceo@sage.com","firstName":"Fake"}` to the onboarding endpoint. This creates an auth account for that email, sends them a confusing welcome email from VYVE, and pollutes the members table.

**Fix:** Add Stripe payment verification (check for a valid Stripe session/customer before onboarding). Alternatively, add a shared secret or CAPTCHA. At minimum, restrict CORS to `www.vyvehealth.co.uk`.

### C3. github-proxy: Unrestricted Public Access to GitHub PAT

**File:** `github-proxy` Edge Function v11
**verify_jwt:** `false`
**CORS:** None (no CORS headers at all — defaults to open)

This function exposes full GET and PUT access to the `vyve-site` repository using the `GITHUB_PAT` secret. There is zero authentication. Anyone who knows the endpoint URL can:
- Read any file in the private repo
- Write/overwrite any file in the repo (including injecting malicious JavaScript into portal pages)

**This is the highest-severity vulnerability in the system.** An attacker could inject a keylogger into `auth.js` and capture every member's credentials.

**Fix:** Add authentication immediately. Either `verify_jwt: true` with admin-only logic, or a separate API key. Also add CORS headers restricting to trusted origins.

### C4. send-email: Open Email Relay

**File:** `send-email` Edge Function v2
**verify_jwt:** `false`
**CORS:** `Access-Control-Allow-Origin: '*'`

Anyone can POST to this endpoint and send emails from `team@vyvehealth.co.uk` to any address with any content. This is an open relay that could be used for phishing, spam, or brand impersonation.

**Fix:** Add authentication. This should only be callable by other Edge Functions (using the service role key) or authenticated admin users.

### C5. employer-dashboard: API Key Not Yet Configured

**File:** `employer-dashboard` Edge Function v19

The auth check correctly validates an API key, but the fallback when `EMPLOYER_DASHBOARD_API_KEY` is not set is to allow unauthenticated access:

```
if (!EMPLOYER_API_KEY) {
  console.warn('EMPLOYER_DASHBOARD_API_KEY not configured - allowing unauthenticated access');
  return { valid: true, identifier: 'no-auth-configured' };
}
```

Since the secret hasn't been set (per backlog), this endpoint is currently wide open. The function queries ALL member emails, company names, and activity data using the service role key.

**Fix:** Set the `EMPLOYER_DASHBOARD_API_KEY` secret. Remove the fallback that allows unauthenticated access.

### C6. Duplicate/Redundant RLS Policies

Multiple tables have overlapping RLS policies. For example, `cardio` has:
- `cardio_own_data` (ALL, `member_email = auth.email()`)
- `cardio_select_own` (SELECT, `auth.email() = member_email`)
- `cardio_insert_own` (INSERT, `auth.email() = member_email`)
- `cardio_update_own` (UPDATE, `auth.email() = member_email`)
- `cardio_delete_own` (DELETE, `auth.email() = member_email`)

The `ALL` policy already covers SELECT, INSERT, UPDATE, DELETE. The per-operation policies are redundant and were added during the security audit debugging. Same pattern on: `daily_habits`, `workouts`, `session_views`, `replay_views`, `weekly_scores`, `wellbeing_checkins`, `members`.

**Impact:** Not a security risk (PERMISSIVE policies are additive), but increases policy evaluation overhead and creates maintenance confusion.

**Fix:** Remove the per-operation duplicate policies, keeping only the `_own_data` ALL policy per table.

---

## 4. SUPABASE-SPECIFIC RISKS

### S1. Service Role Key Used in Edge Functions for All Queries

Every Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` for database queries. This bypasses RLS entirely. This is a valid pattern IF the Edge Function itself properly authenticates the caller and scopes queries. But combined with `verify_jwt: false` on `member-dashboard`, it means RLS is effectively decorative for the primary data access path.

**Recommendation:** For functions that serve member data (member-dashboard, wellbeing-checkin, log-activity), create a Supabase client using the user's JWT rather than the service role key. This enables RLS to act as a second line of defense.

### S2. ai_decisions Table: INSERT with `with_check = true`

The `ai_decisions` table has an INSERT policy with `with_check: true`, meaning any authenticated user (or anon if the function doesn't enforce auth) can insert arbitrary rows. Since the onboarding function writes to this table using the service role key anyway, the RLS policy should be restricted.

### S3. session_chat: INSERT Open to All

`session_chat` has `INSERT with_check: true` — any authenticated user can insert chat messages with any `member_email` (impersonation). Should be `auth.email() = member_email`.

### S4. running_plan_cache: Public Read

Running plans are cached with `SELECT qual: true`. These contain AI-generated personalised running plans. While not strictly PII, they could reveal member fitness levels and goals if the cache key is guessable.

---

## 5. EDGE FUNCTION RISKS

### E1. All Critical Functions Have verify_jwt: false

| Function | verify_jwt | Auth Method | Risk |
|----------|-----------|-------------|------|
| member-dashboard | false | JWT preferred, ?email= fallback | **CRITICAL** — unauthenticated data access |
| wellbeing-checkin | false | JWT required in code | Medium — properly enforces JWT in handler |
| log-activity | false | JWT required in code | Medium — properly enforces JWT in handler |
| onboarding | false | None | **CRITICAL** — public write access |
| github-proxy | false | None | **CRITICAL** — full repo access |
| send-email | false | None | **HIGH** — open email relay |
| employer-dashboard | false | API key (unconfigured) | **HIGH** — open data access |
| off-proxy | false | None | Low — only proxies Open Food Facts |

`wellbeing-checkin` and `log-activity` properly implement JWT validation in code via `getAuthUser()`, which is acceptable. But `verify_jwt: false` at the Supabase level means the platform's security boundary is entirely in application code, with no infrastructure-level protection.

### E2. Onboarding Makes 5+ Anthropic API Calls Per Submission

Each onboarding submission makes:
1. `selectPersona()` — 1-2 AI calls (hard rule reasoning + potential AI decision)
2. `generateProgrammeOverview()` — 1 AI call
3. `selectHabits()` — 1 AI call
4. `generateRecommendations()` — 1 AI call
5. Background: `generate-workout-plan` — likely 1+ AI calls

That's 5-6 Anthropic API calls per new member. At the current Sonnet 4 pricing, this is fine for 10 members but becomes a cost concern at scale. The `~£50/month` spend limit could be hit with ~100 onboardings/month.

### E3. send-email Uses Invalid Model Name

```javascript
model: "claude-sonnet-4-5"
```

This should be `claude-sonnet-4-20250514` (the actual model string). This will cause API failures when `generatePersonaLine()` is called by the re-engagement scheduler.

### E4. No Retry Logic or Circuit Breaking

None of the Edge Functions implement retry logic for Anthropic API calls or Supabase writes. If the Anthropic API is down during onboarding, the member gets no persona, no habits, and a broken experience. The `wellbeing-checkin` function will return a 500 error if the AI call fails.

### E5. 89 Dead Edge Functions Still Deployed

As documented in the backlog, 89 one-shot patcher functions remain deployed. While they don't pose a direct security risk (most just read/write files), they clutter the dashboard and some may have unrestricted access patterns.

---

## 6. API & DATA FLOW ISSUES

### D1. member-dashboard Fetches Too Much Data

The function fetches ALL activity records for a member (every habit date, every workout date, every cardio date, etc.) then returns them to the client. For a member with a year of daily activity, this is 365+ rows per table × 5 tables = 1,800+ rows per dashboard load. This should be aggregated server-side.

### D2. Onboarding Race Condition Potential

`createAuthUser` and `writeMember` run in parallel:
```javascript
const [passwordLink] = await Promise.all([
  createAuthUser(email, firstName, lastName),
  writeMember(data, persona, ...),
]);
```

If `writeMember` fails but `createAuthUser` succeeds, the member has an auth account with no member row. The next stage (`writeHabits`) will fail with an FK violation on `member_email`. This was partially fixed in v44 (two-stage Promise.all), but the `createAuthUser`/`writeMember` parallel still has this potential.

### D3. PostHog Identity Sends Email in Clear Text

In `auth.js`:
```javascript
posthog.identify(user.email, { email: user.email, name: user.name });
```

This sends member email addresses to PostHog's EU endpoint. While PostHog EU is GDPR-compliant, it should be documented in the privacy policy as a data processor.

---

## 7. SECURITY VULNERABILITIES (Ranked)

| # | Severity | Issue | Vector |
|---|----------|-------|--------|
| 1 | **CRITICAL** | github-proxy: unauthenticated repo write access | Attacker injects malicious JS into portal pages |
| 2 | **CRITICAL** | member-dashboard: ?email= exposes member data | Enumeration attack on known email addresses |
| 3 | **CRITICAL** | onboarding: unauthenticated user/data creation | Spam, data pollution, impersonation |
| 4 | **HIGH** | send-email: open email relay | Phishing from VYVE's domain |
| 5 | **HIGH** | employer-dashboard: API key not set | Full member/company data exposure |
| 6 | **HIGH** | CORS: * on onboarding, send-email, employer-dashboard | Enables cross-site attacks |
| 7 | **MEDIUM** | session_chat: INSERT with_check = true | Chat message impersonation |
| 8 | **MEDIUM** | No rate limiting on auth-less endpoints | DoS, API cost exhaustion |
| 9 | **LOW** | Supabase anon key in client-side auth.js | Expected for Supabase, but key is visible |
| 10 | **LOW** | PostHog key hardcoded in auth.js | Expected, but allows event injection |

---

## 8. PERFORMANCE BOTTLENECKS

- **member-dashboard:** Returns raw activity rows instead of aggregated counts. Will degrade with member activity growth.
- **employer-dashboard:** Fetches ALL members and ALL activity across ALL tables on every call. No caching. Will not scale past ~100 members without pagination or caching.
- **Onboarding:** 5-6 sequential/parallel AI calls. Total latency likely 8-15 seconds. The 90s timeout on welcome.html handles this, but it's a poor first impression.
- **Service worker cache-first:** Portal pages may show stale data until the background revalidation completes. Not a bug, but members may see outdated dashboard data briefly after cache-busting issues.

---

## 9. MEDIUM PRIORITY ISSUES

- **No input sanitisation:** Edge Functions accept JSON bodies and pass values directly into database queries (via REST API, not raw SQL, so SQL injection is mitigated by the Supabase client — but XSS is possible if AI-generated content is rendered without escaping).
- **No Content-Security-Policy headers:** Portal pages load inline scripts and styles. Adding CSP would harden against XSS.
- **Password reset link in welcome email:** The `createAuthUser` function generates a recovery link and embeds it in the welcome email. This link has a default expiry. If the member doesn't click it in time, they need to use "Forgot Password" — this isn't communicated.
- **No session timeout:** Supabase Auth persists sessions in localStorage indefinitely. A stolen device gives permanent access.
- **Duplicate indexes:** `weekly_scores` has two identical unique indexes (`weekly_scores_member_email_iso_week_iso_year_key` and `weekly_scores_member_week_unique`). One should be dropped.
- **exercise_notes has 3 indexes on member_email:** `exercise_notes_exercise_idx`, `exercise_notes_member_idx`, and `idx_exercise_notes_member`. The last two are redundant.

---

## 10. LOW PRIORITY IMPROVEMENTS

- TypeScript: Portal is vanilla JS with no type checking. TypeScript would catch bugs earlier.
- Build process: Single-file HTML pages work but make code sharing between pages difficult (each page re-implements auth patterns).
- Error tracking: No Sentry or equivalent. Console errors in production are invisible.
- ARIA labels: Missing across the portal. Required for accessibility compliance.
- Automated testing: No test suite exists.
- `pg_net` extension: Still in public schema (per backlog — should be in extensions).

---

## 11. RISK REGISTER

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | github-proxy exploited to inject malicious code | Medium | Critical | Add auth immediately |
| 2 | Member data accessed via ?email= enumeration | High | High | Remove fallback, enforce JWT |
| 3 | Onboarding spammed with fake accounts | High | Medium | Add Stripe verification or CAPTCHA |
| 4 | VYVE domain used for phishing via send-email | Medium | High | Restrict to internal callers |
| 5 | Anthropic API costs spike from abuse | Medium | Medium | Rate limiting on public endpoints |
| 6 | Enterprise prospect discovers open endpoints | Medium | Critical | Fix before demo |
| 7 | GDPR complaint from member data exposure | Low | High | Fix C1, C5 |
| 8 | Service worker serves stale content after deploy | Medium | Low | Already mitigated by cache version bumping |
| 9 | Brevo free tier limits hit during onboarding spike | Low | Medium | Upgrade plan ($12/month) |
| 10 | Make Facebook connection expires (22 May) | High | Medium | Lewis to renew |

---

## 12. TECHNICAL DEBT SUMMARY

| Debt | Where | Cost of Not Fixing |
|------|-------|-------------------|
| verify_jwt: false on critical functions | member-dashboard, onboarding, github-proxy, send-email | Data breach, repo compromise |
| ?email= fallback in member-dashboard | Edge Function code | Member data exposure |
| 89 dead Edge Functions | Supabase dashboard | Confusion, potential accidental execution |
| Duplicate RLS policies (6+ tables) | Supabase policies | Performance overhead, maintenance confusion |
| No build process | vyve-site repo | Code duplication across HTML files |
| No automated tests | Entire codebase | Regressions on every change |
| Hardcoded CORS: * | onboarding, send-email, employer-dashboard | Cross-site attack surface |
| Invalid model name in send-email | `claude-sonnet-4-5` | Re-engagement emails will fail |
| Raw activity rows in dashboard API | member-dashboard | Performance degradation at scale |
| No retry/circuit-breaker on AI calls | All AI-using EFs | Silent failures during API outages |

---

## 13. TOP 10 FIXES (Prioritised)

**1. Secure github-proxy** — Add authentication (API key or JWT). This is the single most dangerous vulnerability. Can be exploited to compromise the entire portal.

**2. Fix member-dashboard auth** — Remove `?email=` fallback. Set `verify_jwt: true` OR enforce JWT in code (like wellbeing-checkin does). Update all portal pages to send JWT headers (auth.js already exposes the session).

**3. Secure onboarding endpoint** — Add Stripe session validation OR restrict CORS to `www.vyvehealth.co.uk` + add rate limiting. Consider CAPTCHA.

**4. Secure send-email** — Remove public HTTP handler or add authentication. Export functions only for internal use by other Edge Functions.

**5. Set EMPLOYER_DASHBOARD_API_KEY** — Run `openssl rand -hex 32` and set the secret. Remove the unauthenticated fallback code path.

**6. Fix send-email model name** — Change `claude-sonnet-4-5` to `claude-sonnet-4-20250514`.

**7. Fix session_chat INSERT policy** — Change `with_check: true` to `with_check: auth.email() = member_email`.

**8. Tighten CORS** — Replace `*` with specific origins (`https://online.vyvehealth.co.uk`, `https://www.vyvehealth.co.uk`) on all Edge Functions that serve member data.

**9. Clean up duplicate RLS policies** — Remove the per-operation policies on tables that already have an ALL policy (cardio, daily_habits, workouts, session_views, replay_views, weekly_scores, wellbeing_checkins, members).

**10. Delete 89 dead Edge Functions** — Run the deletion script from the April 9 security audit document.

---

## 14. BRAIN SYSTEM AUDIT

The VYVEBrain repo is well-structured:

**Strengths:**
- master.md is accurate against live state (verified against Supabase schema and Edge Function code)
- Changelog is maintained with dated entries
- Hard rules section prevents common mistakes (stress scale, assigned_by constraint, etc.)
- Playbooks provide repeatable workflows

**Gaps:**
- No documentation of the security vulnerabilities identified above
- No runbook for incident response
- No documentation of the CORS configuration per function
- The "Tables That Do NOT Exist" section references `monthly_summaries`, `activity_patterns`, etc. — but the Master Briefing v9 still lists these as live tables. The brain is correct; the briefing doc is stale.
- Brain says 24 live Edge Functions; actual count from Supabase appears higher (including the 89 dead ones). The "24 live" is a curated list, not a complete inventory.

**Can another AI take over instantly?** Yes — the brain provides enough context. The main risk is that the briefing documents (v9 etc.) are stale in places and could mislead an AI that reads them instead of the brain.

---

## Closing Questions

1. **Should I create a full remediation plan with step-by-step implementation for each fix?**
2. **Should I implement the fixes directly** — starting with github-proxy auth and member-dashboard JWT enforcement?
3. **Should I update `tasks/backlog.md` in VYVEBrain with these findings?**

---

*Audit completed 11 April 2026. Platform security requires immediate attention on items 1-5 before any enterprise demo or Sage engagement.*
