# VYVE Health — Audit Updates Log

*Tracks all changes made as a result of the 2026-04-11 Full System Audit.*

---

## Security Remediation — 11 April 2026

### Status: ✅ Complete

All 8 fixes from the security audit remediation plan have been executed.

---

### Fix 1 — github-proxy ✅
**Risk:** Zero authentication — anyone with the function URL could read or write the private `vyve-site` repo.  
**Fix:** Deployed `github-proxy` v15 with `x-proxy-key` header authentication (backed by `GITHUB_PROXY_SECRET` Supabase secret). CORS restricted to `https://online.vyvehealth.co.uk`. Returns 500 if secret not configured, 401 if key is wrong.  
**Files changed:** Edge Function `github-proxy` (v14 → v15)

---

### Fix 2 — member-dashboard ✅
**Risk:** `?email=` query param fallback allowed any caller to retrieve any member's dashboard data without a valid JWT. Also contained hardcoded `deanonbrown@hotmail.com` as a fallback email.  
**Fix:** Deployed `member-dashboard` v29 — JWT-only auth, `?email=` fallback removed entirely. Returns 401 if no valid Bearer token. Updated `index.html` to send JWT only (no `?email=` param, no hardcoded fallback).  
**Files changed:** Edge Function `member-dashboard` (v28 → v29), `vyve-site/index.html`, `vyve-site/sw.js` (cache bump to `vyve-cache-v2026-04-11a`)

---

### Fix 3 — onboarding ✅
**Risk:** CORS set to `*`, allowing any domain to submit onboarding data.  
**Fix (Option A):** Deployed `onboarding` v57 — CORS restricted to `https://www.vyvehealth.co.uk`. `ONBOARDING_SECRET` header check was considered and rejected: `welcome.html` is a static GitHub Pages file, so any secret embedded in it is publicly readable in source. CORS restriction is sufficient for static site onboarding at current scale. Removed `ONBOARDING_KEY` declaration and `x-onboarding-key` header from `welcome.html`.  
**Files changed:** Edge Function `onboarding` (v52 → v57), `Test-Site-Finalv3/welcome.html`

---

### Fix 4 — send-email ✅
**Risk:** CORS `*`, no auth on HTTP handler, invalid model name `claude-sonnet-4-5`.  
**Fix:** Deployed `send-email` v16 — CORS restricted to portal origins, service-role-key required on HTTP handler, model corrected to `claude-sonnet-4-20250514`.  
**Files changed:** Edge Function `send-email` (v14 → v16)  
**Note:** This fix was completed in a prior session; confirmed deployed before this session began.

---

### Fix 5 — employer-dashboard ✅
**Risk:** Unauthenticated fallback code path — if `EMPLOYER_DASHBOARD_API_KEY` was not set in Supabase secrets, the function silently allowed all requests through.  
**Fix:** Deployed `employer-dashboard` v26 — fallback removed, hard fail (500) if key not configured, 401 if wrong key provided. CORS restricted to `https://www.vyvehealth.co.uk`.  
**Files changed:** Edge Function `employer-dashboard` (v23 → v26)  
**Action required:** Set `EMPLOYER_DASHBOARD_API_KEY` in Supabase Dashboard → Settings → Edge Functions → Secrets. ✅ Done.

---

### Fix 6 — session_chat INSERT policy ✅
**Risk:** `with_check: true` on INSERT would allow members to post chat messages attributed to any email.  
**Finding:** Policy already had `with_check: auth.email() = member_email` — correctly configured. No change needed.  
**Files changed:** None

---

### Fix 7 — Duplicate RLS policies ✅
**Risk:** 20 redundant per-operation RLS policies sitting alongside the correct `ALL` policies on 7 tables, creating confusion and unnecessary overhead.  
**Fix:** Dropped all per-operation duplicates. Each of the 7 tables now has exactly 1 policy (the `_own_data` ALL policy).  
**Tables cleaned:** `cardio`, `daily_habits`, `workouts`, `session_views`, `replay_views`, `weekly_scores`, `wellbeing_checkins`  
**Policies dropped:** 20 total (`_select_own`, `_insert_own`, `_update_own`, `_delete_own` variants across tables)  
**Files changed:** SQL migration `drop_duplicate_rls_policies`

---

### Fix 8 — Duplicate indexes ✅
**Risk:** Two identical non-unique indexes on `exercise_notes.member_email` wasting storage and write overhead.  
**Finding:** `weekly_scores_member_week_unique` is a real unique constraint — retained. Only the two `exercise_notes` duplicates were dropped.  
**Indexes dropped:** `exercise_notes_member_idx`, `idx_exercise_notes_member`  
**Indexes retained:** `weekly_scores_member_week_unique` (unique constraint — required for deduplication)  
**Files changed:** SQL migration `drop_duplicate_indexes`

---

## Architecture Decisions Made During Remediation

### ONBOARDING_SECRET — Option A chosen
Static GitHub Pages files cannot safely hold secrets — they are publicly readable in source. The `x-onboarding-key` pattern only works for server-rendered pages. For VYVE's public onboarding form, CORS origin restriction (`https://www.vyvehealth.co.uk`) is the correct and sufficient protection. The `ONBOARDING_SECRET` remains set in Supabase (harmless) but is not checked by the Edge Function.

### weekly_scores_member_week_unique retained
The audit initially flagged this as a duplicate index. On inspection it is a unique constraint (type `u`), not a plain index. It enforces the one-check-in-per-member-per-week deduplication rule. Retained.

---

## Secrets Configured (11 April 2026)

All set in Supabase Dashboard → Project `ixjfklpckgxrwjlfsaaz` → Settings → Edge Functions → Secrets:

| Secret | Used by | Status |
|--------|---------|--------|
| `GITHUB_PROXY_SECRET` | `github-proxy` | ✅ Set |
| `ONBOARDING_SECRET` | `onboarding` (unused — Option A) | ✅ Set |
| `EMPLOYER_DASHBOARD_API_KEY` | `employer-dashboard` | ✅ Set |

---

## Edge Function Version Summary (post-remediation)

| Function | Version Before | Version After | Change |
|----------|---------------|---------------|--------|
| `github-proxy` | v14 | v15 | Auth + CORS |
| `member-dashboard` | v28 | v29 | JWT-only |
| `onboarding` | v52 | v57 | CORS restricted |
| `send-email` | v14 | v16 | Auth + CORS + model fix |
| `employer-dashboard` | v23 | v26 | Fallback removed |

---

*Last updated: 11 April 2026*
---

## Post-Review Functional Fixes — 11 April 2026

### Fix A — employer-dashboard frontend ✅
**Issue:** `vyve-dashboard-live.html` was calling the employer-dashboard Edge Function with no API key after Fix 5 removed the unauthenticated fallback. Every request returned 401.
**Fix:** Patched `fetchDashboard()` to use a `sessionStorage`-based key pattern — no secret in source code. On first 401, the page prompts for the key and stores it in `sessionStorage`. Subsequent calls send `x-api-key` header automatically. Bad keys are cleared on 401 retry.
**One-time setup for Lewis:** In browser console on the dashboard page, run:
`sessionStorage.setItem('vyve_emp_key','YOUR_KEY')`
Replace `YOUR_KEY` with the value of `EMPLOYER_DASHBOARD_API_KEY` from Supabase → Settings → Edge Functions → Secrets.
**Files changed:** `Test-Site-Finalv3/vyve-dashboard-live.html` (commit 45f583ad)
**Pre-Sage action required:** Before enterprise demo, replace with a proper employer auth flow — hardcoded key in sessionStorage is not production-grade for a client-facing tool.

---

### Fix B — re-engagement-scheduler model name ✅
**Issue:** `re-engagement-scheduler` v5 used model `claude-sonnet-4-5` (invalid name). Anthropic API returned errors, causing AI-personalised email segments to silently fall back to static copy for all members.
**Fix:** Deployed `re-engagement-scheduler` v6 — model updated to `claude-sonnet-4-20250514`. Also improved error logging: now logs full Anthropic error text on failure rather than just status code.
**Files changed:** Edge Function `re-engagement-scheduler` (v5 → v6 / Supabase version 18)

---

## Additional Findings (No Fix Required)

- **`member_notifications` table:** Confirmed exists in live DB. `wellbeing-checkin` v23 writes will not fail. ✅
- **`ai_decisions` table:** Confirmed exists. `onboarding` v57 writes will not fail. ✅
- **`exercise_notes` table:** Confirmed exists. ✅
- **Email senders independent of `send-email` EF:** `onboarding`, `re-engagement-scheduler`, and `certificate-checker` all call Brevo directly — Fix 4 had zero downstream impact on email sending. ✅
- **`onboarding` v57 model name:** Already correct (`claude-sonnet-4-20250514`). ✅

---

*Last updated: 11 April 2026 (post-review fixes)*
