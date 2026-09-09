# Access Control, MFA and Offboarding Policy — VYVE Health CIC

**Status:** DRAFT · Drafted 9 September 2026 (PM-1139) · Owner: Dean (technical), Lewis (people)
**Closes:** scorecard H2

## 1. Scope

All systems processing VYVE member data or holding credentials, and everyone with access to them: directors, contractors, coaches and partners with portal access.

## 2. Access model

**Principle of least privilege.** Access is granted by role, not by person, and roles map to enforced database policies rather than to convention.

| Role | Held by | Grants |
|---|---|---|
| `admin` | Directors | Full internal console, member administration, partner approval |
| `team` | Staff and contractors | Internal console, member administration, no billing or partner approval |
| `partner` | Coaches, creators, ambassadors | Own tenancy only, enforced at the database layer |
| Member | End users | Own records only, enforced by row-level security |
| `service_role` | Automated systems | Server-side only, never in client code |

**13 active privileged accounts** across admin, team and partner roles at drafting.

Enforcement is technical, not procedural: row-level security on every member-scoped table, verified by cross-account testing, and a daily automated posture check that alerts on any change to the enforcement surface.

## 3. Multi-factor authentication

**Required** on every account that can reach member data or credentials: Supabase, GitHub, Apple Developer, Google Play, Stripe, Brevo, PostHog, HubSpot, Cloudflare, and the email tenant.

**Current state, stated honestly.** All administrative accounts are registered to the shared business account `team@vyvehealth.co.uk`, a Google account, and most third-party systems are accessed via *Sign in with Google*. Second factor is a Google prompt approved on a signed-in device — a strong mechanism, resistant to phishing in ways SMS and emailed codes are not. Both directors reach the account, giving full access continuity (see the handover runbook §3).

**The residual risks are concentration and recovery, not factor strength.** Because *Sign in with Google* fronts most of the estate, that one account is effectively our identity provider. **Two actions follow.** (1) **Device coverage — confirmed:** both directors' devices are signed in and can approve prompts, so either can complete a login independently. Remaining: backup codes held outside Google, since device approval fails if devices are unavailable together or the account is flagged. (2) **Administrative recovery:** a consumer Google account has no administrator, so a lock-out, compromise or automated flag has no human remedy and the account can be lost permanently. A managed tenant provides administrative reset, enforced two-step verification, hardware-key support and audit logging. **This makes the tenant migration (scorecard C6) a continuity and security priority, not the data-protection housekeeping it has been carried as.**

There is also **no periodic evidence check** that MFA remains enabled everywhere; enforcement relies on each provider's settings rather than a central identity provider. **ACTION: one-off audit of every account in the estate inventory recording MFA state and method, then an annual re-check.** £0, one session.

Member accounts do not currently require MFA. This is a deliberate product decision for a consumer wellbeing app; it is stated rather than implied, and would be revisited if an employer required it.

## 4. Granting access

Access is granted by a director, recorded in the admin users table with role and active flag, and is auditable. Partner and coach access is granted only after the onboarding gates are satisfied. No shared accounts, and no shared credentials — where a shared key previously existed it was removed and replaced with per-identity authentication.

## 5. Offboarding

On departure of a director, contractor, coach or partner, **on the last working day**:

1. Set `active = false` in the admin users table — this revokes application-layer access immediately, since every role check reads it live.
2. Remove from GitHub organisation, Supabase organisation, and any third-party account.
3. Revoke personal access tokens and SSH keys issued to them.
4. **Rotate any shared credential they had sight of**, including the service role key and any vault secret they could read.
5. Remove from email distribution and the support inbox.
6. Record completion, with date and who performed it, in the audit log.

**Coaches and partners:** setting the partner record inactive removes portal access and stops member-facing visibility. Member data they could previously see was never exportable in bulk by design.

**Known gap:** no offboarding has yet been performed, so this procedure is untested. It is written before it is needed rather than after, and the step most likely to be skipped under pressure is step 4 — credential rotation — which is also the step that matters most.

## 6. Access reviews

**Quarterly:** review every account in the estate inventory and every row in the admin users table. Confirm each still needs the access it has, remove what is stale, and record the review date and outcome.

**At drafting no formal review has been conducted.** The first is due within 30 days of this policy being approved, and the record of it is the evidence a reviewer will ask for — not the policy itself.
