# VYVE Health — Enterprise Due-Diligence Technical Audit
**Date:** 3 July 2026 · **Auditor:** Claude (CTO session, read-only) · **Project:** ixjfklpckgxrwjlfsaaz
**Frame:** Assessed as a large corporate buyer's InfoSec / DPO / procurement team would assess us before signing. Read-only: no writes except this report's brain changelog entry. Live Supabase + all four repos queried at HEAD; brain used as context, live state as truth.

---

## Executive summary (for Lewis)

VYVE is in materially better shape than a pre-revenue startup usually is at this stage: every database table has row-level security switched on, health data lives in the EU, we have working data-export and data-deletion machinery, native push and HealthKit are live, and the platform genuinely runs. A buyer's first impression of the engineering will be "small team, punching well above its weight."

That said, **there are three things that would stall or endanger an enterprise contract, and they need to be fixed before Sage's security questionnaire lands, not after.**

1. **Our "delete my data" function misses 31 of the tables that hold personal data — including the entire mental-health section** (mood check-ins, journaling, burnout data). Two members have already been through a "completed" erasure that silently left this data behind. For a health company selling to an employer, this is the single finding most likely to fail a data-protection review, and it's the one a regulator would care about most.

2. **The partner video-upload service is protected only by a password that is written in plain text inside a public code repository, and it doesn't check that a partner owns the content they're editing.** Anyone who reads our public code can act as any partner. Low real-world damage today (7 partners, no member data exposed), but it's exactly the class of flaw a penetration test is built to find, and "shared password in public repo" reads very badly in a questionnaire.

3. **HAVEN, our mental-health AI companion, is live to real members without the clinical sign-off we ourselves said was mandatory.** 14 real members are assigned it. An employer buying a wellbeing product will ask "who clinically approved the mental-health content?" and today the honest answer is "no-one yet." This is a known blocker; it now has a number attached: 14.

Beyond those, the picture is "good bones, startup housekeeping owed": ~90 dead/debug functions are still switched on and publicly reachable (attack surface a pen-tester will enumerate), the live-session system depends on Dean's personal laptop being awake and a Google token that expires weekly, our only proven way to push an app update is a full App Store resubmission, and we have none of the formal artefacts (pen-test certificate, Cyber Essentials, SSO, a signed DPA process) that enterprise procurement treats as table stakes. None of those are hard blockers on their own, but together they're the difference between "sail through" and "death by a thousand follow-up questions."

**Bottom line for a buyer:** the product and data architecture are credible and the team clearly moves fast. The gaps are in governance and hardening, not in the core build — which is the good kind of gap, because they're fixable in weeks, not quarters. My remediation roadmap at the end sequences them by "what unblocks a signature soonest."

---

## Scope & method

Queried live: `pg_policies` (all tables), `pg_proc` (74 SECURITY DEFINER functions), `cron.job` (44 jobs), `vault.secrets`, `storage.buckets`, `members`, the GDPR erasure function body, and the full deployed Edge Function inventory (165 functions). Read from repos at HEAD: `auth.js`, the three password gates, `partner-content-upload`, plus full file-tree secret sweeps across `vyve-site`, `vyve-command-centre`, `Test-Site-Finalv3`, `VYVEBrain`. Not exhaustively read: every one of 165 EF bodies — I sampled the highest-risk auth shapes and inferred the rest from the `verify_jwt` flag + naming.

Severity is rated against enterprise procurement specifically: **CRITICAL** = can kill or stall a contract / regulator-relevant; **HIGH** = comes up in the security questionnaire and we need a real answer; **MEDIUM** = fix before scale; **LOW** = hygiene.

Note on prior work: `VYVEBrain/reports/01–11` and `brain/security_questionnaire.md` already exist from the April 2026 audit cycle. This report supersedes the security/GDPR/enterprise-readiness slices of those against current live state (the estate has grown from 35 tables / 15 EFs to 133 tables / 165 EFs since).

---

## 1. Data protection & GDPR

### 1.1 — CRITICAL — Erasure function skips 31 member-identifiable tables, including all of the Mind pillar
`gdpr_erase_purge_subject()` deletes from ~44 tables across 10 rounds. There are **96 tables carrying a member email / author / shared_by column**; **31 of them are never touched**:

`mind_activities` (97 live rows), `daily_mood_checkins` (150), `connect_checkins` (45), `movement_activities` (44), `mind_moods`, `mind_burnout_checks`, `mind_fitness_log`, `mind_trackers`, `mind_recovery_actions`, `mind_recovery_log`, `live_checkin_submissions`, `member_prompt_responses`, `member_prompt_dismissals`, `checkin_reactions`, `affirmation_favourites`, `weekly_challenge_participation`, `manual_step_estimates`, `replay_video_views`, `session_live_views`, `comms_send_log`, `health_alerts`, `session_reminders`, `member_home_state_dirty`, `exercise_name_misses`, `partner_memberships`, `partner_community_posts`, `stripe_events`, plus the two `gdpr_*_requests` tables (receipt-retention — correct to keep) and `admin_audit_log` (arguably correct to keep for audit integrity).

Stripping the two intentional receipt tables and the audit log, **~27 tables holding real personal data are silently retained after a "completed" erasure.** The Mind cluster is the worst of it — mood, burnout, journaling and mental-fitness data is the most sensitive category we hold, and it's entirely absent from the delete path.

`gdpr_erasure_requests` shows **2 erasures already executed** — both returned "complete" while leaving this data live. That converts this from a latent bug into a **standing Article 17 compliance failure with named affected data subjects.**

This confirms and sharpens the brain's own note that "the newer mind fitness tables were shipped without erasure wiring" — the reality is broader than the mind-fitness tables; it's the whole Mind pillar plus a long tail of newer activity/connect tables. Root cause is structural: erasure coverage is a hand-maintained list that new-feature ships don't update.

**Fix:** rewrite the purge to be self-maintaining — enumerate every table with a `member_email`/author column from catalog at runtime and delete generically, or add a CI check that fails when a new member-scoped table isn't in the purge list. Re-run erasure for the 2 already-processed subjects. ~1 session.

### 1.2 — HIGH — PostHog session replay records member sessions at 100% with the email field deliberately unmasked
`auth.js` runs `posthog.init` with `disable_session_recording: false`, 100% capture, `maskAllInputs:true` **but `email:false`** (email explicitly unmasked). Session replays of a *health app*, captured to a US-parented processor (PostHog, EU instance) at full rate, with the member's email visible in the recording. The in-code comment acknowledges it's deliberate for attribution during soft-launch. For enterprise/health this is a DPIA line-item: replay of health-context screens is special-category-adjacent, and unmasked email makes each replay directly identifying. Also the comment's plan to "drop to 10% after hard-launch" hasn't happened.

**Fix:** mask email, drop sampling, and confirm PostHog is on an EU data-residency contract with a signed DPA before any enterprise pilot. ~30 min code, plus a commercial/DPA action for Lewis.

### 1.3 — HIGH — Sub-processor list an enterprise DPA will demand
Personal / health data flows to: **Anthropic** (AI recs — prompts include member context), **Stripe** (payment + email), **Brevo** (email + name), **PostHog** (EU, but see 1.2), **Google/YouTube** (live-session identity is not member PII, but the OAuth app is ours), **Supabase/AWS eu-west-1** (primary store), **GitHub Pages** (static hosting), **Capawesome** (OTA payloads). A buyer's DPA schedule needs all of these named with locations and safeguards. We have no maintained sub-processor register today. **Data residency is good** — Supabase project confirmed West EU/Ireland. The gap is documentation, not architecture. ~half session to draft the register; Lewis owns the DPA.

### 1.4 — MEDIUM — `ai_interactions` stores prompt/recommendation content keyed to member email
Confirmed columns: `member_email`, `prompt_summary`, `recommendation`, `persona`, `decision_log`. This is member health-context text retained indefinitely with no retention cap. It *is* in the erasure path (good), and RLS is correct (`member_email = auth.email()`). But there's no TTL and the content can be sensitive (wellbeing check-in debriefs). A buyer will ask about AI-data retention specifically. Add a retention policy + cron purge. ~1 session.

### 1.5 — LOW — Consent versioning exists but is thinly populated
`members` carries `privacy_version` / `health_consent_version`, with pre-versioning consenters stamped `'pre-versioning'`. Good that it exists; a buyer may push on whether re-consent is needed for existing members on new terms. Commercial/legal call for Lewis, not a technical defect.

---

## 2. Security posture

### 2.1 — CRITICAL — `partner-content-upload` EF: public password in a public repo + no ownership check (broken access control)
The function is `verify_jwt:false`, authorised solely by `x-portal-key: "vyve2026"` — and that exact string is committed in `vyve-command-centre/partner-portal.html` (a public GitHub Pages repo). It runs on the **service-role** client and takes `partner_id` **directly from the request body with no verification that the caller owns it**. Anyone who reads our public code can `list`, `sign` (upload), `commit`, and `update` content for *any* partner by supplying that partner's UUID.

Real-world blast radius today is low (7 live partners, content only, no member PII reachable through this path) — which is why I rate the *exploit impact* moderate. But the *finding class* is severe: hardcoded shared secret in public source + missing object-level authorisation is the textbook OWASP "Broken Access Control," and it will be found by any automated pen test and flagged red in any questionnaire. The brain tracks the fix (§23.132/133: "replace shared password + DEMO_PARTNER_ID with real JWT logins") but files it as a *productionisation task*; it should be reclassified as a **security defect** and pulled forward.

**Fix:** flip to `verify_jwt:true`, derive `partner_id` server-side from `get_my_partner_id()` under the caller's JWT (the RLS helper already exists), delete the shared key. This is the PM-684 "partner-portal login folded into onboarding" work — it's now the security-critical path, not a nicety. ~1–2 sessions.

### 2.2 — HIGH — ~90 dead / debug / one-shot Edge Functions still deployed and mostly open
Of 165 deployed functions, well over half are patchers, seeders, per-member one-shots and debug endpoints still `ACTIVE` and `verify_jwt:false`. Named examples that read badly in a pen-test report: `debug-show-file`, `inspect-members-schema`, `test-html-render`, `create-test-member`, `create-test-user`, `set-member-password`, `ban-user-anthony`, `trigger-owen-workout`, `generate-stuart-plan`, `debug-exercise-search`, `debug-cert-content`, `replay-inventory-tmp`, `replay-archive-tmp`, `replay-ghost-cleanup-tmp`, `posthog-test`, `model-compare-*`, `run-migration-*`. Each open endpoint is enumerable attack surface; some (`set-member-password`, `create-test-user`, `inspect-members-schema`) are dangerous *shapes* even if their bodies turn out to be guarded. The April audit already listed ~89 for deletion and cleanup was only partial — the count hasn't meaningfully dropped.

**Fix:** batch-delete everything not in the ~70-function operational set (the brain's dead-EF inventory + this live list gives the delete list directly). A CI/naming discipline (`tmp-`/`debug-` prefix auto-flagged) prevents re-accumulation. ~1 session, high questionnaire value per hour spent.

### 2.3 — HIGH — Payment webhook integrity needs confirming under load
`stripe-webhook` is `verify_jwt:false` (correct — Stripe can't send a Supabase JWT) and `STRIPE_WEBHOOK_SECRET` is in Vault (good — signature verification is possible and presumably implemented). I did not fully read the body this session, so I'm flagging it as **verify, don't assume**: confirm the handler rejects unsigned/badly-signed payloads and is idempotent on `stripe_events` (only 3 rows today, so untested at volume). A buyer won't probe this, but it's the one open endpoint where a flaw = financial/access integrity. ~30 min to confirm.

### 2.4 — MEDIUM — Three client-side `vyve2026` password gates over RLS-protected data
`internal-dashboard` (vyve-site), `strategy.html` (Test-Site), and the partner portal all gate on a hardcoded `vyve2026` in public HTML. **Downgraded from my initial read of critical:** the internal-dashboard fetches Supabase REST using a `sb_publishable_` key, so RLS still applies and an attacker who bypasses the JS gate sees only what anon can see (nothing member-scoped). So these are *weak convenience locks over already-protected data*, not data-exposure holes — **except** where the same string is trusted server-side (that's 2.1, which is the real problem). Still: one shared password, in public source, reused across admin surfaces, will be flagged. Move admin surfaces behind real Supabase Auth + `is_admin()` (the RPC exists and is already used elsewhere). ~1 session.

### 2.5 — MEDIUM — 15 tables have RLS enabled but zero policies; confirm intent
RLS-on + zero-policies = deny-all to non-service-role, which is *safe by default*. The list is all service-role-only tables (`platform_alerts`, `stripe_events`, `admin_audit_log`, `gdpr_*_requests`, `runner_heartbeat`, `vyve_job_runs`, etc.), so this is almost certainly deliberate. Flagging only so a questionnaire answer ("why do these tables have no policies?") is pre-written: "service-role-only, deny-all to clients by design." No fix, just document.

### 2.6 — LOW — A handful of RLS policies still use bare `auth.email()` (perf, not security)
~20 policies use unwrapped `auth.email()`/`auth.role()` in `qual`/`with_check` instead of `(SELECT auth.email())` (§23.67). This is a per-row re-evaluation performance bug, not an exposure — but at enterprise row counts it degrades query plans. Tables include `certificates`, `member_stats`, `member_activity_daily`, `connect_checkins`, `daily_mood_checkins`, `session_live_views`, `cc_posts`, `cc_app_health` and others. Wrap them. ~1 session, matters more for §4 (scale) than security.

### 2.7 — PASS — no dangerous secrets in any repo
Full sweep across all four repos for `sk_live_`, `sb_secret_`, service-role JWTs, `whsec_`, Brevo `xkeysib-`: **none found.** The only exposed keys are the Supabase **anon/publishable** keys (by design, safe to ship) and the `vyve2026` gate string (2.1/2.4). Vault holds the real secrets. This is a genuine strength and worth stating affirmatively in a questionnaire. One note: `YOUTUBE_ACCESS_TOKEN_TEMP` and `YOUTUBE_STREAM_KEYS_CACHE` in Vault confirm the OAuth-token workaround (see §3.2).

### 2.8 — LOW — Storage buckets correctly split public/private
`partner-docs`, `partner-content`, `cc-documents`, `cc-task-docs`, `gdpr-exports` are all **private** (signed-URL only) — correct. Public buckets (`certificates`, `member-avatars`, `exercise-videos`, `session-thumbnails`, `partner-thumbnails`, breathwork assets) hold non-sensitive content. `member-avatars` public is a minor consideration (member-uploaded images at a guessable path) but standard practice. No action beyond noting `partner-content` (2GB limit, private) is the sensitive one and its only access path is the flawed EF in 2.1.

---

## 3. Reliability & single points of failure

### 3.1 — HIGH — Live-session runner is a launchd agent on Dean's personal Mac
`vyve-live-runner.py` drives every simulated-live broadcast from Dean's laptop. Laptop asleep / offline / reinstalled = no live sessions, and live sessions are a core member-facing feature and a demo centrepiece. Known (backlog + PM-658), no redundancy. A buyer doing DD on service continuity will treat "core feature depends on a named individual's personal laptop being awake" as material. `broadcast-watchdog` (cron 50) gives *detection*, not *failover*. **Fix:** move to an always-on VPS/cloud worker. ~1–2 sessions incl. migration + TCC/py3.9 constraints (§23.88/89).

### 3.2 — HIGH — Google OAuth app stuck in "Testing" → ~7-day token expiry
The YouTube OAuth consent screen is unverified/Testing, so the refresh token expires roughly weekly; `youtube-token-keepalive` (cron 25) + `YOUTUBE_ACCESS_TOKEN_TEMP` are papering over it. Recurring silent-death vector for the entire live/replay pipeline. **Fix:** push the consent screen through Google verification (or publish the app) for a non-expiring token. Lead time is external (Google review), so **start now** — it's the kind of thing that's a 3-week calendar dependency. Owner: Dean to initiate, Lewis if brand/verification docs needed.

### 3.3 — HIGH — OTA update path never verified end-to-end
Whole cohort is frozen on the bundled web-shell SHA in iOS 1.8 / Android 1.0.7; the only proven way to ship a member-facing fix is a full store resubmission (days of review). Capawesome OTA wiring is in the binaries but no canary has ever landed on a real non-dev device (§23.106). This is both a reliability finding (we can't hotfix a production incident quickly) and an enterprise-readiness one (a buyer expects a controlled release channel). **Fix:** run and verify one `--rollout 0.1` canary. TOP native priority. ~1 session once a real device is on 1.8+.

### 3.4 — MEDIUM — Cron / watchdog coverage is good but uneven
44 cron jobs, all active; watchdogs exist for email (16), broadcasts (50), YouTube token health (35), onboarding (46). Genuine strength. Gaps: no watchdog on the runner heartbeat *itself* beyond broadcast detection, and `warm-ping` keeps 10 EFs warm but cold-start on the other ~60 operational functions is unmeasured. Document the monitoring story for the questionnaire; add a runner-heartbeat staleness alert. ~half session.

### 3.5 — MEDIUM — `team@vyvehealth.co.uk` is GoDaddy Exchange, portal infra on personal Google account
Business email is a GoDaddy-hosted Exchange mailbox (not a managed enterprise tenant); some infra history ties to a personal Google account. Both flagged in the brain for post-first-contract migration. A buyer will want business-critical email/identity on a managed tenant with admin controls. Lewis-owned, pre-contract.

---

## 4. Scalability & architecture quality

### 4.1 — Overall: sound for now, two things to watch
We have 51 members (43 trial-active, 7 comp, 1 paid; ex-test). An enterprise deal could 100× that overnight. The good news: the heavy read paths are already built for scale — `leaderboard` is a Postgres window-function RPC over `member_home_state` (top-100 slice server-side, no wire bloat), and `member_home_state` is a same-write-fresh aggregate maintained by triggers + a 5-min dirty-drain, so dashboards don't recompute per request. That's a genuinely good design for the member count going up.

### 4.2 — MEDIUM — Synchronous per-row triggers on 8+ source tables
`member_home_state` is refreshed by `AFTER INSERT/UPDATE/DELETE` triggers firing `refresh_member_home_state()` synchronously on `cardio`, `daily_habits`, `workouts`, `session_views`, `wellbeing_checkins`, `weekly_goals`, `weekly_scores`, `members` (+ mind/movement/connect dirty-marks). At 47 members this is invisible; at enterprise write volume, a synchronous full-member-state recompute on every activity insert is the first thing that will bottleneck. The dirty-queue pattern already exists — lean on it (mark dirty, drain async) rather than recomputing inline. Design review before first big pilot. ~1 session to shift the hot triggers to dirty-mark-only.

### 4.3 — MEDIUM — No automated tests, no build step, no framework
Vanilla JS, Dexie-first, hand-rolled, zero test suite. This is *fine and even fast* at current size and the brain's §23 hard-rules are effectively a manual regression suite encoded as discipline. But an enterprise CTO doing technical DD will raise it, and the place it bites first is exactly the kind of silent breakage the brain keeps logging (ported IIFEs calling missing functions §23.80, wrong Dexie accessors §23.87, re-keyed stores §23.83). A minimal smoke-test harness over the critical member paths (login, log activity, checkout, erasure) would both reduce those incidents and give a DD-satisfying answer. Not urgent; raise proactively rather than be caught by it. ~2–3 sessions for a meaningful smoke suite.

### 4.4 — LOW — 165 deployed functions is itself a scale/ops smell
Covered operationally in 2.2; noting here that the sheer count also inflates cold-start surface, deploy confusion, and the "which version is live" problem the brain already manages via source-header versions. Cleanup helps scale-readiness, not just security.

---

## 5. Clinical governance

### 5.1 — CRITICAL (enterprise-blocking) — HAVEN live without clinical sign-off; 14 real members assigned
HAVEN (mental-health companion persona) is in production with **14 non-test members** carrying it as their assigned persona. The clinical gate we ourselves defined as mandatory has not been passed. The brain records the interaction history as small (≈3 real members + Phil actually conversed, ~9 interactions) — so *assignment* exposure (14) exceeds *interaction* exposure, but both are non-zero and both are un-signed-off. Any employer buying a wellbeing product will ask "who clinically governs your mental-health content and AI?" — today there is no signed answer. This is the highest-priority *commercial* blocker even though its live blast radius is contained.

**Interim mitigation** (until Phil signs off): either (a) stop assigning HAVEN to new members and re-route the 14 to RIVER with a supervised transition, or (b) get an explicit interim clinical review on record. Lewis + Phil decision; Dean can enact the routing change same-session. This should be briefed to Lewis this week per the brain's own front-matter.

### 5.2 — HIGH — Mental Fitness shipped with placeholder crisis thresholds and copy
`mental-fitness.html` / burnout zones shipped with placeholder thresholds and crisis copy pending Phil (PM-651, "CLINICAL GATE OPEN"). `mind_burnout_checks` has 0 rows so far (no member has hit it), which caps current risk — but the moment a member does, they get un-reviewed burnout/crisis messaging. Gate the burnout-zone surfacing behind Phil sign-off, or hold the feature, before it's promoted. Lewis/Phil + ~half session to gate.

### 5.3 — MEDIUM — `crisis-scan` EF exists; confirm it's wired and signposting is universal
A `crisis-scan` function is deployed (invoked from onboarding v83+). Good that crisis detection exists. Verify: (a) it runs on all free-text member inputs (check-in debriefs, journaling, HAVEN chat), not just onboarding; (b) every mental-health surface carries visible crisis-support signposting (helpline on-asset), per §23.84. I didn't fully trace coverage this session — flag as verify. ~1 session to audit coverage.

### 5.4 — PASS — §23.84 sensitive-video gate is documented and the acute asset is held
"Suicide and Men" is correctly gated out of rotation pending Phil + on-asset signposting; the July calendar regen (PM-686/687) explicitly excludes it. The gate is honoured in the live calendar data, not just documented. Good.

---

## 6. Enterprise readiness gaps (procurement day-one asks)

None of these are defects; they're the artefacts/capabilities a corporate buyer expects to exist. Rated by how early they surface.

- **HIGH — SSO / SAML:** none. Sage-scale employers will expect SAML/OIDC SSO for their employees. Not built; `is_admin()`/role scaffolding exists but no enterprise IdP integration. Scope it now — it's a common contract precondition.
- **HIGH — Per-employer tenancy isolation unproven:** `employer_members` is empty; the employer dashboard is aggregate-only behind an API key. The model (aggregate, no PII to employer) is *privacy-correct* but has never run with a real tenant, and there's no per-employer data isolation boundary tested. A buyer will probe "how is our data separated from other clients'." Design + prove before first pilot.
- **HIGH — No SCIM / user provisioning story:** enterprises want automated joiner/leaver provisioning. Absent.
- **MEDIUM — No pen-test, no Cyber Essentials, no ISO 27001:** all three are routine questionnaire line-items; we have none. Cyber Essentials is cheap and fast and would answer a whole column of questions — worth doing before Sage. ISO 27001 is a longer play.
- **MEDIUM — Audit logging partial:** `admin_audit_log` exists and is service-role-only (good), but coverage across admin actions is incomplete and there's no member-facing access log. Buyers ask for audit trails.
- **MEDIUM — No uptime/SLA measurement:** we have watchdogs but no published uptime metric or status page. Enterprise contracts often require an SLA; we can't currently evidence one.
- **MEDIUM — DPA process not productised:** template exists (swap client name), but no repeatable DPA + sub-processor register + DPIA-per-feature process. Lewis-owned.
- **LOW — Email/identity on non-managed infra:** see §3.5.

---

## 7. Prioritised remediation roadmap (sequenced to unblock an enterprise signature soonest)

**Tier 0 — do before any security questionnaire or Sage technical call (this + next week):**
1. **Fix the GDPR erasure gap** (§1.1) — self-maintaining purge + re-run for the 2 affected subjects. *Regulator-relevant, and the most defensible single fix.* ~1 session.
2. **Close partner-content-upload** (§2.1) — JWT + server-derived `partner_id`, kill the shared key. ~1–2 sessions.
3. **HAVEN interim mitigation** (§5.1) — Lewis+Phil decision + Dean enacts routing; brief Lewis this week. ~same-session once decided.
4. **Delete the ~90 dead/debug EFs** (§2.2). ~1 session, big questionnaire ROI.
5. **Mask PostHog email + drop sampling** (§1.2). ~30 min.

**Tier 1 — start now because they have external lead time or unblock the release story:**
6. **Google OAuth verification** (§3.2) — external review clock, start immediately.
7. **Verify OTA canary end-to-end** (§3.3) — restores our ability to hotfix.
8. **Move live-runner off Dean's Mac** (§3.1).
9. **Cyber Essentials** (§6) — fast, cheap, answers a column of questions. Lewis to initiate.
10. **Confirm stripe-webhook signature + idempotency** (§2.3). ~30 min.

**Tier 2 — before first enterprise pilot goes live:**
11. Sub-processor register + productised DPA/DPIA process (§1.3, §6) — Lewis.
12. Per-employer tenancy isolation designed + proven (§6).
13. SSO/SAML scoping (§6).
14. Shift hot `member_home_state` triggers to dirty-mark-only (§4.2).
15. Gate Mental Fitness crisis copy behind Phil (§5.2); audit crisis-scan + signposting coverage (§5.3).
16. Move admin surfaces off `vyve2026` onto real auth (§2.4).

**Tier 3 — scale hardening / hygiene:**
17. AI-data retention policy + purge (§1.4).
18. Wrap bare-`auth` RLS policies (§2.6).
19. Minimal smoke-test harness over critical paths (§4.3).
20. Runner-heartbeat alert + cold-start measurement (§3.4); enterprise email/identity migration (§3.5).

---

## What's genuinely strong (say this in the questionnaire)
RLS on 100% of tables; EU data residency; no live secrets in any repo; working Article-15 export and Article-17 erasure machinery (coverage gap aside); native APNs push live; HealthKit integrated and device-validated; a scale-ready leaderboard + aggregate-state design; broad cron watchdog coverage; and a documented engineering-discipline system (the brain's §23 hard rules) that functions as institutional memory most startups this size lack. The story to a buyer is "fast small team with unusually good instincts, owed some governance housekeeping" — which is true, and fixable on the timelines above.
