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

Audited June 2026 (PM-564–567), re-audited September 2026 (PM-1132), remediated and placed under continuous monitoring 9 September 2026 (PM-1133).

**Current state:** zero SECURITY DEFINER functions in the `public` schema are executable by the `anon` role, other than trigger functions — which execute as the trigger owner regardless of who holds EXECUTE and are not invocable over the API. 34 remain executable by `authenticated`; each either self-scopes to the caller's own `auth.email()` / `get_my_partner_id()` or raises `42501`. Verified by invoking every function as `anon` after the change: 24 of 24 blocked.

**We state the September drift openly, because the process finding matters more than the functions did.** The June audit closed at zero open violations. Three months of coaching and partner development later, a re-audit found 25 non-trigger definer functions executable by an unauthenticated caller. None had been deliberately granted: Supabase's default privileges grant EXECUTE on every new function to PUBLIC, anon and authenticated at creation, so exposure was the default state and each new RPC silently re-opened the surface. Nothing re-checked posture between audits, so the drift was silent by construction. That control gap is now closed (see §4).

**What an unauthenticated caller could actually do** — established by invoking each function, not by reading its source: five had real effect. One returned a schema map of member-scoped tables and their erasure policies; three were rate-limit and booking-hold maintenance routines that an anonymous caller could trigger; one inserted stock automation messages into a partner tenancy identified by id. The remaining twenty returned empty, false, or raised. **No member personal data was reachable through any of them**, and there is no evidence of exploitation in the logs. All 25 were closed in a single migration on 9 September 2026.

**One guard failed for a reason worth naming.** A function tested `if not (… or auth.role() = 'service_role' or …)`. With no JWT `auth.role()` is NULL, the disjunction evaluates NULL, and `IF NULL` does not fire — so a guard that reads as correct admitted anonymous callers. Every identity guard is now NULL-safe by `coalesce`, and guards are proved by calling with no identity rather than by inspection.

**§23.104:** every SECURITY DEFINER function must REVOKE EXECUTE from PUBLIC, anon and authenticated unless deliberately member-callable; member-callable functions self-scope with service_role bypass.
**§23.280:** revoking from `anon` alone is ineffective while the default PUBLIC grant stands — revoke from PUBLIC too, and re-grant `service_role` explicitly.

---

## 4. RLS posture — what's actually enforced?

**Member-scoped tables** (62 tables carrying `member_email` column): RLS enabled, qualified `auth.email() = member_email`. Members can only read and write their own rows. Examples: `daily_habits`, `workouts`, `cardio`, `wellbeing_checkins`, `monthly_checkins`, `weight_logs`, `member_health_daily`, `member_health_samples`, `mind_activities`, `movement_activities`, `member_achievements`, `push_subscriptions`, `push_subscriptions_native`.

**Reference data tables** (`workout_plans`, `habit_library`, `habit_themes`, `nutrition_common_foods`, `personas`, `service_catalogue`, `knowledge_base`): RLS enabled, SELECT-only for authenticated users. No PII; read-only catalogues.

**Service-role-only tables** (`admin_audit_log`, `admin_users`, `platform_metrics_daily`, `broadcast_schedules`, `admin_broadcast_log`): No RLS policies — service-role access only. PostgREST blocks all direct client access.

**Audit table** (`ai_interactions`, `ai_decisions`): Members can SELECT their own rows (member-scoped); INSERT is service-role only (Edge Functions write, not clients).

**Tables with RLS enabled and zero policies — deliberate deny-all (22 tables, verified 9 September 2026).** RLS is on and no policy grants access, so PostgREST returns nothing to any client role; only `service_role` (Edge Functions and cron) can read or write. This is intentional for data that no client should ever reach directly:

| Class | Tables | Why deny-all |
|---|---|---|
| Operational telemetry | `watchdog_alerts`, `broadcast_watch_alerts`, `vyve_job_runs`, `runner_commands`, `runner_heartbeat`, `transcribe_heartbeat`, `ef_rate_limits`, `coach_help_cache`, `food_lookup_misses`, `security_posture_snapshots` | Infrastructure state and abuse controls. No member data. Client visibility would expose internals and, for the rate-limit table, the controls themselves. |
| Subject-rights and compliance | `gdpr_erasure_requests`, `gdpr_export_requests`, `gdpr_table_policy`, `health_alerts`, `stripe_events` | Requests and events are actioned by staff and Edge Functions; the erasure catalogue is a data map. Members exercise these rights through the request flow, never by reading the tables. |
| Employer aggregate | `employer_admins`, `employer_metrics_weekly` | Employer-facing data is served exclusively through the aggregate-only dashboard function, which is the mechanism enforcing the no-individual-PII boundary. |
| Reference and config | `trial_campaigns`, `workstyle_orgs` | Server-side configuration. Read through functions with their own guards. |
| Internal queues | `exercise_name_misses`, `member_home_state_dirty`, `workstyle_responses` | Write-only work queues drained by scheduled jobs. |

**Continuous posture monitoring (PM-1133).** A scheduled job runs daily at 03:15 UTC and records: tables with RLS disabled, tables with RLS enabled and zero policies, SECURITY DEFINER functions executable by `anon` (non-trigger and total), definer functions executable by `authenticated`, and the count of policies targeting the `public` role. Each run is diffed against the previous snapshot and any change raises an internal alert — high severity if exposure increased, naming the specific functions newly exposed. The control was validated on installation by deliberately re-granting a function to `anon`, confirming the alert fired and identified it by name, then reverting. Current baseline: 0 RLS-off tables, 22 deny-all tables, 0 anon-executable non-trigger definer functions.

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

## 5A. Content Security Policy

All portal pages ship a Content Security Policy via meta tag, restricting script, style, font, image, media, frame and connection origins to an explicit allow-list, with `object-src 'none'`, `base-uri 'self'` and `form-action 'self'`. Coverage was completed on 9 September 2026: 30 pages built after the policy was first introduced had been shipping without it, which we found and closed rather than discovered in review.

**Stated limitation:** `script-src` currently permits `'unsafe-inline'`. The portal carries roughly 200 inline script blocks and 880 inline event handlers, so removing it is a scoped refactor to nonce-based execution rather than a configuration change. We state this plainly because a CSP with `unsafe-inline` provides meaningfully weaker XSS mitigation than one without, and an accurate description of a partial control is more useful to a reviewer than an overstated one. Report-only mode is not available to us: browsers honour it only as an HTTP header and the portal is served from static hosting that cannot set headers.

**Compensating controls:** no third-party origin is allowed that the application does not actually use (an unused allow-list entry is a widened attack surface, so the email and Google API origins inherited from the earlier policy were removed); all database access is behind RLS with per-row member scoping; and API credentials are never present in client code.

---

## 5B. Administrative access, MFA and continuity

Privileged access is role-based and enforced technically rather than by convention: 13 active privileged accounts across admin, team and partner roles, with row-level security on every member-scoped table and a daily automated check that alerts on any change to the enforcement surface.

All administrative accounts across the estate are federated to a single shared company Google account, with most systems accessed via *Sign in with Google*. Multi-factor authentication is a device-approved Google prompt — phishing-resistant, and stronger than SMS or email-delivered codes. Both directors hold access and both have devices able to approve prompts, so either can administer any system independently; this is verified rather than assumed.

We state the residual exposure rather than leave it to be found. Federating the estate to one account concentrates risk in that account, and because it is currently a consumer rather than a managed tenant there is no administrative recovery path if it were locked or compromised. Mitigations in place: dual director access with independent device approval, and documented continuity procedures. Mitigation scheduled: migration to a managed tenant, which adds administrative recovery, enforced two-step verification, hardware-key support and audit logging.

Business continuity is documented in a key-person handover runbook covering every system, its access route, and what an incoming engineer would need. A written emergency continuity procedure exists for the non-technical director. Full architecture, decision history and operational state are maintained continuously in a documentation repository both directors can read.

---

## 5C. Performance and load testing

Load tested 9 September 2026 against production using k6, at two levels.

**Pilot load (30 concurrent users, 4 minutes, 2,520 requests):** zero failed requests, 100% of functional checks passed, median response 107ms. This is the level relevant to a typical departmental pilot.

**Projected full-rollout load (200 concurrent users, 7 minutes, 4,856 requests):** 93.6% success. All failures were concentrated in a single endpoint — the member dashboard aggregation — which timed out under sustained load. **Direct authenticated data reads sustained 200 concurrent users with a 100% success rate and a 95th-percentile response under 90ms**, so the database and authorisation layers were not the constraint.

**Identified constraint and remediation.** The dashboard endpoint aggregates a member's full home view and currently issues a large number of sequential internal queries per request, which both slows the response and multiplies load under concurrency. Remediation is understood and scoped: reduce the query count per request and cache the aggregate. We state the limit rather than the headline figure because the useful answer to "will it scale" is knowing precisely what fails first and what the fix is.

**Scaling levers, in order:** the identified endpoint fix; a database compute tier increase (connection ceiling is currently 60, with 21 held at idle by platform services); and provider-side function scaling. Re-testing is scheduled to follow the endpoint remediation rather than at fixed intervals.

---

## 6. Where is member data stored, and what regions does data transit through?

All member data rests in a single Supabase Postgres instance (project `ixjfklpckgxrwjlfsaaz`) in **EU Central / Frankfurt, Germany (eu-central-1)**, verified against the provider management API. No member data leaves the EU under our control. *(Corrected 9 Sep 2026, PM-1149: this section had said Ireland/eu-west-1. The region was verified and corrected everywhere else at PM-767 in July; this document — the prospect-facing one — was missed.)*

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

Covered in full in the separate Disaster Recovery & Business Continuity Note (available on request). Summary, accurate as at 9 September 2026:

- **Backups:** Supabase Pro daily automated backups, 7-day retention. WAL archiving is active at instance level (verified: 1,439 segments archived, most recent 9 September 2026).
- **Point-in-time recovery: not currently enabled.** It is a purchasable add-on we have not yet taken. We say so plainly because an earlier internal report inferred PITR from Postgres configuration flags and that inference was wrong; the affected documents carry dated corrections (§23.283).
- **RPO: 24 hours. RTO: 4 hours (target, not yet evidenced).** These two figures do not currently reconcile, and we would rather state that than quote a number we cannot demonstrate. Enabling PITR takes RPO under one hour; a timed restore test will replace the RTO target with a measured figure. Both are scheduled remediation, not open-ended intentions.
- **Restore testing:** no full restore has yet been performed and minuted. This is the single weakest point in our continuity position and it is scheduled.
- All code in private GitHub repositories; all secrets in Supabase Vault; database and all special-category data in the EU (Frankfurt, Germany — eu-central-1).
- ICO breach notification procedure documented; 72-hour notification window.

---

*This document is the source of truth for procurement security questionnaires. Update whenever the security posture changes. Do not paste live API keys, tokens, or environment secrets into any procurement response.*
