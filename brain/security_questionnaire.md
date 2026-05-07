# Security Questionnaire — VYVE Health CIC

> Pre-canned answers for enterprise procurement reviewers. Anchored against `brain/master.md` §16 (GDPR/compliance) and §23 (architecture rules). Updated as the security posture evolves.

> Audience: Sage / BT / Barclays / Balfour Beatty procurement teams and any subsequent enterprise security questionnaire.
> Last updated: 07 May 2026 (post security commit 1).

---

## 1. Why do some Edge Functions run with `verify_jwt: false`?

This is a deliberate architectural pattern, not an oversight. The affected EFs (`member-dashboard`, `wellbeing-checkin`, `log-activity`, `onboarding`, `monthly-checkin`, `register-push-token`, the admin EFs) implement **custom JWT validation** inside the handler via `supabase.auth.getUser()`. The Supabase Auth user is resolved server-side from the `Authorization: Bearer <token>` header before any business logic runs; if the user is unauthenticated or the token is invalid, the EF returns 401.

The `verify_jwt:true` platform flag rejects requests *at the gateway* before the handler runs, which is faster but inflexible — it can't differentiate between "no JWT" and "valid JWT but missing required claim" and produces an opaque error. The `verify_jwt:false` + custom-`getUser()` pattern lets each EF return a clean, scoped error message and lets us layer additional auth (admin role checks, service-role bypass for cron-invoked EFs) without fighting the platform.

**Functions that ARE platform-`verify_jwt:true`:** `anthropic-proxy`, `send-push`, `habit-reminder`, `streak-reminder`, `achievement-earned-push`. These either have no business reason to differentiate auth states or sit behind cron+service-role guards.

**Service-role bypass:** When an EF needs to invoke another EF (e.g. `log-activity` calling `achievement-earned-push`), it does so with the `LEGACY_SERVICE_ROLE_JWT` secret. The downstream EF performs a manual service-role guard on its handler. No EF is anonymously invokable in production.

## 2. The Supabase anon key ships in HTML — isn't that a credential leak?

Supabase anon keys are **public by design** when paired with Row-Level Security (RLS). They are documented as such in Supabase's official docs. The anon key is an unauthenticated client identifier, not a credential — it's the equivalent of a Google Maps embed key or a Stripe publishable key. Authentication is performed by the JWT carried in the `Authorization` header for every request, and authorization is enforced by RLS policies on every table.

All public tables in our project have RLS enabled (verified 9 April 2026 audit, re-verified 07 May 2026). Member-scoped tables (`daily_habits`, `workouts`, `cardio`, `wellbeing_checkins`, `weight_logs`, etc.) carry `auth.email() = member_email` quals on their policies. Reference data (`workout_plans`, `habit_library`, `habit_themes`, `personas`, `service_catalogue`, etc.) is `public.read` — these are read-only catalogues with no PII. Writes to all member-scoped tables are gated by `WITH CHECK` clauses requiring an authenticated `auth.email()` match.

**Anon-key rotation** is on the backlog (admin console roadmap). Rotation is a defence-in-depth measure, not a vulnerability remediation, since the key itself is not a credential.

## 3. Some RLS policies are assigned to the `public` role — is that anonymous access?

No. The `public` role assignment is cosmetic legacy from earlier migrations and does NOT grant anonymous write access. Five INSERT policies and several SELECT policies still carry the `public` role label: `monthly_checkins_member_insert`, `scheduled_pushes_self_insert`, `members can insert chat` (`session_chat`), `Members can insert own shares` (`shared_workouts`), `members_insert_own_custom_habits` (`habit_library`).

All five have `WITH CHECK (auth.email() = member_email)` (or `created_by`/`shared_by` equivalent). On an anonymous request, `auth.email()` returns null, the `WITH CHECK` fails, and Postgres rejects the insert with `42501 new row violates row-level security policy`. The policies are semantically authenticated-only.

The cosmetic re-role to the `authenticated` role is on the security backlog (commit 1B) for hygiene. The previous open `public` policies on `running_plan_cache` (which had `qual=true` with no auth check) were **closed in commit 1 on 07 May 2026** and replaced with `authenticated`-only policies.

## 4. The portal stores a `VYVE_RETURN_TO_KEY` value in `localStorage` — what is it and is it sensitive?

`VYVE_RETURN_TO_KEY` is the post-login redirect target. When a member hits a gated portal page while unauthenticated, the page path is written to `localStorage` under that key, the user is redirected to `login.html`, and on successful auth they are redirected back to the original page. This is a standard SPA pattern.

The value contains no PII — it's a relative URL fragment like `/workouts.html` or `/wellbeing-checkin.html`. It does not contain JWTs, credentials, or any member data. The DPIA covers `localStorage` use as an in-browser navigation cache.

JWTs themselves are managed by the Supabase JS SDK in `localStorage` under `sb-<project>-auth-token` (Supabase's standard storage key). This is the SDK's documented default behaviour and matches every production Supabase consumer in the wild. Token refresh is handled by the SDK; tokens expire after 1 hour and refresh tokens after 7 days.

## 5. Where is member data stored, and what regions does data transit through?

All member data lives in a single Supabase Postgres instance (project `ixjfklpckgxrwjlfsaaz`) hosted in **West EU / Ireland** (eu-west-1). No data leaves the EU under our control.

Anthropic's API (used for AI personas, weekly check-in recommendations, running plans) is called server-side from EU-hosted Edge Functions. Anthropic's API endpoint geographies are managed by Anthropic per their own infrastructure; we do not transit member PII to Anthropic — only the prompt content, which is generated from member activity data and contains the member's first name where relevant. Anthropic's data processing terms apply.

Brevo (transactional email) processes outbound message data only; account region is configured for EU. PostHog (product analytics) processes event data with EU hosting selected.

GoDaddy/Microsoft Exchange currently hosts `team@vyvehealth.co.uk` on a personal Exchange tenant; migration to a properly-licensed Workspace tenant is on the post-first-enterprise-contract roadmap. Standard Contractual Clauses (SCCs) will be put in place for any subprocessor we add that requires non-EU data transit.

## 6. How are GDPR Subject Access Requests (Article 15) and Right-to-Erasure (Article 17) handled today?

**As of 07 May 2026:** SARs and erasure requests are handled manually through `team@vyvehealth.co.uk` per the published Privacy Policy. ICO Registration No. 00013608608.

**Programmatic GDPR EFs are scheduled for security commits 3 and 4** (current security hardening pass):
- `gdpr-export` will produce a single signed-URL JSON download covering all 28 member-relevant tables. Receipt logged to `admin_audit_log`. 7-day URL expiry. Self-service for members; admin-invokable on member request.
- `gdpr-erase-request` + `gdpr-erase-execute` will implement two-phase erasure with a 30-day grace period (industry standard, recovery from accidental requests). Both phases write receipts to `admin_audit_log`.

Both EFs are mockup-first per our internal change-control process and will be live within the current security hardening pass.

## 7. What's logged for audit?

`admin_audit_log` table — immutable, service-role only (no RLS policies, write-only via service-role-gated EFs). Every admin write action through the admin console logs an entry: action type, target member, before/after diff, admin email, timestamp. Used for regulatory traceability and internal review.

`ai_interactions` table — logs every Anthropic API call from the platform: prompt summary, response, model, persona, member email, decision_log JSONB. Currently logging `triggered_by='onboarding'` only; commit 1B extends coverage to `wellbeing-checkin`, `running-plan` (anthropic-proxy), and `re-engagement-scheduler` so every AI surface produces an audit trail.

`engagement_emails` — every transactional and re-engagement email sent via Brevo, indexed by member, stream, and email_key. Includes the Brevo message ID for delivery traceability.

Push notifications — every notification sent via APNs (iOS native) or VAPID (web) writes a row to `member_notifications` with type, route, deep-link payload, and timestamp. Auto-revocation of failed device tokens (410/400 BadDeviceToken) is logged.

## 8. RLS posture — what's actually enforced?

- **Member-scoped tables** (`members`, `daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `wellbeing_checkins`, `weekly_scores`, `weekly_goals`, `monthly_checkins`, `nutrition_logs`, `nutrition_my_foods`, `weight_logs`, `exercise_logs`, `exercise_notes`, `custom_workouts`, `member_habits`, `persona_switches`, `member_health_connections`, `member_health_daily`, `member_health_samples`, `member_running_plans`, `member_achievements`, `certificates`, `notifications`, `member_notifications`, `engagement_emails`): RLS enabled, qualified `auth.email() = member_email`. Members can only read/write their own rows.
- **Reference data** (`workout_plans`, `habit_library`, `habit_themes`, `nutrition_common_foods`, `personas`, `service_catalogue`, `knowledge_base`): RLS enabled with `public` SELECT-only. No PII; read-only catalogues.
- **Shared parametric caches** (`running_plan_cache`): RLS enabled, `authenticated`-only read/write since 07 May 2026. Anonymous access blocked. Service-role exempt.
- **Aggregation/derived tables** (`member_home_state`, `member_stats`, `member_activity_daily`): RLS enabled, member-scoped.
- **Service-role-only tables** (`admin_audit_log`, `admin_users`, `ai_interactions`, `ai_decisions`): RLS enabled with no policies — only service-role can read or write.
- **Live-content tables** (`session_chat`): RLS enabled with member INSERT (with check) + authenticated SELECT for the live chat surface.

Audit trail: 9 April 2026 RLS audit, 27 April 2026 verification through achievements ship, 07 May 2026 verification through security commit 1.

## 9. CORS posture

Every public-facing Edge Function emits `Access-Control-Allow-Origin: <ALLOWED_ORIGIN>` where the allowed origins are `https://online.vyvehealth.co.uk` (member portal) and `https://www.vyvehealth.co.uk` (marketing site). For unrecognised origins the response defaults to `https://online.vyvehealth.co.uk`. **No EF emits `Access-Control-Allow-Origin: *`** since the 07 May 2026 hardening pass on `member-dashboard` v59 (commits 1B will extend the same pattern to `wellbeing-checkin` and `log-activity`).

`Access-Control-Allow-Credentials: true` is emitted for all responses. `Access-Control-Allow-Headers` is scoped to `authorization, x-client-info, apikey, content-type` (plus `x-vyve-deferred` for `wellbeing-checkin`). Methods are scoped per EF (GET+OPTIONS for read-only, POST+OPTIONS for write).

## 10. Payment, banking, identity data

VYVE does not store payment card data, bank account numbers, or government identity numbers. Payments are processed entirely through Stripe via the published payment link; Stripe is the data controller for payment instrument data. We hold the Stripe customer ID and subscription metadata only. ICO registration covers the data we hold; Stripe's processing falls under Stripe's own ICO registration.

---

*This document is the source of truth for procurement security questionnaires. Update whenever the posture changes. Do not paste live API keys, tokens, or environment secrets into any procurement response.*
