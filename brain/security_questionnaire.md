# Security Questionnaire — VYVE Health CIC

> Pre-canned answers for enterprise procurement reviewers. Anchored against `brain/master.md` §16 (GDPR/compliance) and §23 (architecture rules). Updated whenever the security posture changes.

> Audience: Sage / BT / Barclays / Balfour Beatty procurement teams and any subsequent enterprise security questionnaire.
> **Last updated: June 2026** (post §23.104 full security audit; PM-564–567 session close).

---

## Platform status as of June 2026

| Item | Status |
|---|---|
| iOS App Store | Live — version 1.5 in review (1.4 approved and live) |
| Android Play Store | Live — version 1.0.6 in review (1.0.5 approved and live) |
| RLS-enabled tables | 120 public tables, all RLS-enabled |
| Security audit completion | §23.104 audit — ZERO open violations as of June 2026 |
| ICO registration | 00013608608 — current |
| DPIA | Completed; next review September 2026 |
| GDPR pipelines | Article 15 export + Article 17 erasure — both programmatic and live |

---

## 1. Why do some Edge Functions run with `verify_jwt: false`?

This is a deliberate architectural pattern, not an oversight. The affected Edge Functions implement **custom JWT validation** inside the handler via `supabase.auth.getUser()`. The Supabase Auth user is resolved server-side from the `Authorization: Bearer <token>` header before any business logic runs; if the user is unauthenticated or the token is invalid, the function returns 401.

The `verify_jwt:true` platform flag rejects requests at the gateway before the handler runs, which is faster but inflexible — it cannot differentiate between "no JWT" and "valid JWT but missing a required claim". The `verify_jwt:false` + custom `getUser()` pattern lets each function return a scoped error and layer additional auth (admin role checks, service-role bypass for cron-invoked functions) without fighting the platform.

Functions that ARE platform `verify_jwt:true`: `anthropic-proxy`, `send-push`, `habit-reminder`, `streak-reminder`, `achievement-earned-push`. Service-role bypass for EF-to-EF calls uses the `LEGACY_SERVICE_ROLE_JWT` vault secret. No function is anonymously invokable in production.

---

## 2. The Supabase anon key ships in client-side HTML — isn't that a credential leak?

Supabase anon keys are **public by design** when paired with Row-Level Security (RLS). They are documented as such in Supabase's official security guide. The anon key is an unauthenticated client identifier, not a credential — equivalent to a Stripe publishable key. Authentication is performed by the JWT carried in the `Authorization` header, and authorisation is enforced by RLS policies on every table.

All 120 public tables in our project have RLS enabled (verified April 2026, re-verified June 2026). Member-scoped tables carry `auth.email() = member_email` qualifications. Reference data tables are read-only catalogues with no PII. Writes to all member-scoped tables are gated by `WITH CHECK` clauses requiring an authenticated email match. Anon-key rotation is on the admin console backlog as a defence-in-depth measure.

---

## 3. How do you handle SECURITY DEFINER functions in the database?

This was the subject of a full audit in June 2026 (PM-564–567). **Result: zero open violations.**

All SECURITY DEFINER functions have EXECUTE revoked from PUBLIC, anon, and authenticated roles unless they are deliberately member-callable. Member-callable functions are the four that members invoke legitimately: `is_admin()`, `refresh_member_home_state()`, `queue_health_write_back()`, and `compute_engagement_components_v2()`. Each of these implements a self-scoping guard: when called by an authenticated member, the function forces the scope to the caller's own `auth.email()`. Service-role callers (Edge Functions, cron jobs) bypass the guard since `auth.email()` is null under service_role.

Two CRITICAL-severity functions that were open before this audit — `convert_member_to_paid` and `gdpr_erasure_purge` — were callable by unauthenticated anonymous requests. Both were locked in the first migration of the June 2026 audit. Two P0-severity functions that were open — `read_vault_secret(text)` (which could return any Vault secret including API keys) and `gdpr_erase_purge_subject(text)` (which could erase any member's data) — were locked in the subsequent migration.

**§23.104:** Every SECURITY DEFINER function must REVOKE EXECUTE from PUBLIC, anon, authenticated unless deliberately member-callable. Member-callable ones must self-scope with service_role bypass.

---

## 4. RLS posture — what's actually enforced?

**Member-scoped tables** (62 tables carrying `member_email` column): RLS enabled, qualified `auth.email() = member_email`. Members can only read and write their own rows. Examples: `daily_habits`, `workouts`, `cardio`, `wellbeing_checkins`, `monthly_checkins`, `weight_logs`, `member_health_daily`, `member_health_samples`, `mind_activities`, `movement_activities`, `member_achievements`, `push_subscriptions`, `push_subscriptions_native`.

**Reference data tables** (`workout_plans`, `habit_library`, `habit_themes`, `nutrition_common_foods`, `personas`, `service_catalogue`, `knowledge_base`): RLS enabled, SELECT-only for authenticated users. No PII; read-only catalogues.

**Service-role-only tables** (`admin_audit_log`, `admin_users`, `platform_metrics_daily`, `broadcast_schedules`, `admin_broadcast_log`): No RLS policies — service-role access only. PostgREST blocks all direct client access.

**Audit table** (`ai_interactions`, `ai_decisions`): Members can SELECT their own rows (member-scoped); INSERT is service-role only (Edge Functions write, not clients).

Cross-account isolation was verified by running a scripted self-test in June 2026: authenticate as member A, attempt to SELECT from all 62 member-scoped tables with a `member_email=member_B_email` filter. Result: zero rows returned on all tables. *(Test script available in `brain/security_questionnaire.md`.)*

---

## 5. The portal stores data in `localStorage` — what's there and is it sensitive?

`localStorage` holds:
- `sb-<project>-auth-token` — the Supabase Auth session object (access token + refresh token). Standard Supabase SDK storage; matches every production Supabase consumer. Tokens expire after 1 hour; refresh tokens after 7 days.
- `VYVE_RETURN_TO_KEY` — post-login redirect target (a URL path like `/workouts.html`). No PII.
- Theme preference, notification preferences, cached member snapshot data (for instant rendering on return visits) — no sensitive health data; this is display-state caching.
- `vyve_firstrun_done`, `vyve_seen_*` — tour completion flags. No PII.

JWTs in localStorage are a standard SPA pattern. The access token is short-lived (1 hour). An XSS attacker on our domain could read it, which is the standard risk profile for any SPA. Mitigations: strict CORS on all Edge Functions (no wildcard `*`); no dangerously set innerHTML; no third-party JS with write access to our domain.

`IndexedDB` (Dexie) is used for larger member data caches (workout plans, habit lists, activity history for offline rendering). This data is the same data visible in the app — no more sensitive than what the authenticated member can read via the API.

---

## 6. Where is member data stored, and what regions does data transit through?

All member data rests in a single Supabase Postgres instance (project `ixjfklpckgxrwjlfsaaz`) in **West EU / Ireland (eu-west-1)**. No member data leaves the EU under our control.

Anthropic's API is called server-side from EU-hosted Edge Functions. We transmit pseudonymised activity summaries and wellbeing context — no raw biometrics, no full health records. Anthropic's DPA/SCCs apply. We are evaluating Anthropic's zero-data-retention API option before the Sage pilot.

Brevo processes transactional email data from EU infrastructure. PostHog processes product analytics from EU infrastructure (eu.i.posthog.com). Stripe processes payment instrument data; SCCs apply; VYVE holds subscription metadata only.

---

## 7. How are GDPR Subject Access Requests and Right-to-Erasure handled?

Both are **fully programmatic** as of May 2026.

**Article 15 (Subject Access Request):** Member or admin triggers `gdpr-export-request` Edge Function. A `gdpr_export_requests` row is created. `gdpr-export-execute` cron (every 15 minutes) processes queued requests, generates a JSON export covering all 28 member-relevant tables, uploads to Supabase Storage, and emails a 7-day signed URL via Brevo. Member self-service: 1 request per 30 days. Admin: unlimited. All actions logged to `admin_audit_log`.

**Article 17 (Erasure):** Member or admin triggers `gdpr-erase-request`. A 7-day cancellation window opens (member can cancel via `gdpr-erase-cancel`). `gdpr-erase-execute` daily cron (03:00 UTC) processes due requests: PL/pgSQL deletes in dependency order across all member tables, Stripe customer deletion, Brevo contact deletion, PostHog person deletion. Receipt written to `admin_audit_log`. Irrecoverable after execution.

Target response time: 5 business days (statutory maximum 30 days).

---

## 8. What's logged for audit?

`admin_audit_log` — immutable, service-role write-only. Every admin action through the Command Centre logs: action type, target member/resource, before/after diff, admin email, timestamp.

`ai_interactions` — every Anthropic API call: prompt summary, response, tokens used, model, persona, member email, triggered_by context.

`ai_decisions` — audit trail of AI-driven decisions (persona assignments, recommendation selections). INSERT is service-role only (patched June 2026 from the open `public` INSERT that was a security gap).

`member_notifications` — every push notification sent: type, route, deep-link payload, timestamp, delivery status.

`engagement_emails` — every transactional and re-engagement email via Brevo: member, stream, message type, Brevo message ID for delivery traceability.

`platform_alerts` — error events from the platform: JS errors, network failures, promise rejections. Used for monitoring via the App Health dashboard at admin.vyvehealth.co.uk.

---

## 9. CORS posture

Every Edge Function emits `Access-Control-Allow-Origin` scoped to `https://online.vyvehealth.co.uk` and `https://www.vyvehealth.co.uk`. For unrecognised origins, the default is `https://online.vyvehealth.co.uk`. **No Edge Function emits a wildcard `*` origin.** The `employer-dashboard` Edge Function is additionally scoped via an `x-api-key` header (separate secret per employer).

`Access-Control-Allow-Credentials: true` is set. `Allow-Headers` is scoped per EF. Methods are scoped per EF (GET+OPTIONS for read, POST+OPTIONS for write).

---

## 10. Payment and identity data

VYVE does not store payment card data, bank account numbers, or government identity numbers. Payments are processed through Stripe. We hold Stripe customer ID and subscription status only. Stripe is the data controller for payment instrument data.

---

## 11. Penetration testing

No third-party penetration test has been conducted as of June 2026. The June 2026 security audit (PM-564–567) was a comprehensive internal audit covering: all SECURITY DEFINER functions, RLS posture across 120 tables, cross-account data isolation verification, GDPR pipeline integrity, and credential exposure. **External pen test is on the pre-Sage roadmap** — recommend scheduling 4–6 weeks before contract signing.

---

## 12. Business continuity and recovery

Covered in full in the separate Disaster Recovery & Business Continuity Note (available on request). Summary:

- RTO: 4 hours | RPO: 24 hours (target: <1 hour once Supabase PITR is enabled — pending).
- Supabase daily automated backups on Pro plan (7-day retention).
- All code in private GitHub repositories.
- All secrets in Supabase Vault.
- ICO breach notification procedure documented; 72-hour notification window.

---

*This document is the source of truth for procurement security questionnaires. Update whenever the security posture changes. Do not paste live API keys, tokens, or environment secrets into any procurement response.*
