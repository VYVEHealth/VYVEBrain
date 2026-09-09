# Playbook — Enterprise Contract Readiness

> Loaded on demand. Triggered by any of the phrases in the index below.
> Source analysis: `reports/13-enterprise-readiness-audit-2026-09.md` (9 September 2026).
> Target: Sage (HubSpot deal 495586118853) and any subsequent enterprise contract.

---

## Trigger index

| Dean says | Claude does |
|---|---|
| "enterprise status" | Read the wave status table below, run the posture query in Wave 1, report where we are. No building. |
| "start enterprise wave 1" | Database security remediation. See Wave 1. |
| "start enterprise wave 2" | Infrastructure, credentials, backup integrity. See Wave 2. |
| "start enterprise wave 3" | Enterprise platform features. See Wave 3. |
| "start enterprise wave 4" | Proof and documentation. See Wave 4. |
| "start enterprise wave 5" | External and paid engagements. See Wave 5. |
| "lewis enterprise chase" | Read the Lewis track, report what is still open, draft the chase message. |

Waves are ordered by risk, not by convenience. Wave 1 blocks everything else — do not open Wave 3 with Wave 1 outstanding, because shipping new RPCs onto an unswept definer surface makes the sweep bigger.

---

## Wave status

| Wave | Scope | Status | Owner |
|---|---|---|---|
| 1 | Database security remediation | **COMPLETE 2026-09-09 (PM-1133)** | Dean |
| 2 | Infrastructure, credentials, backup integrity | NOT STARTED | Dean |
| 3 | Enterprise platform features | **DEFERRED 2026-09-09 — blocked on L12** | Dean |
| 4 | Proof and documentation | NOT STARTED | Dean |
| 5 | External and paid engagements | NOT STARTED | Dean books, Lewis funds |
| L | Lewis track — 12 items | NOT STARTED | Lewis |

*Update this table at the close of every enterprise session. It is the fastest read of where we are.*

---

## WAVE 1 — Database security remediation

Right, this is the one that actually matters, so start here and don't get distracted by anything else in the enterprise list until it's closed.

Here's the situation. Back in June we ran the §23.104 audit and closed it with four member-callable SECURITY DEFINER functions and zero open violations. Since then we've shipped the whole coaching and partner stack and the posture has drifted badly without anyone noticing. As of 9 September there are 51 SECURITY DEFINER functions executable by `anon` or `authenticated`. Twenty-five of those are non-trigger functions callable by `anon` — meaning someone with nothing but the public anon key and no login at all can invoke them. Twelve of those twenty-five have no `auth.email()`, `auth.uid()` or `auth.role()` guard anywhere in the body.

The ones I care about most are `coach_client_health_status` (reads client health state, takes a partner argument, no guard), `partner_referral_stats` (partner revenue figures, no guard), `coach_challenge_go_live` (an unauthenticated write path), `gdpr_member_scoped_tables` (hands over the data map), and the RLS predicate helpers `is_coach_of`, `challenge_partner` and `thread_partner` — those last three aren't leaks in themselves but other policies lean on them, so they're leverage. Then there's `check_rate_limit`, `prune_ef_rate_limits` and `expire_booking_holds`, which are anon-callable writes that let an unauthenticated caller reset our own abuse controls.

What I want you to do, in order. First re-run the posture query, because the numbers above are from 9 September and parallel sessions may have moved things:

```sql
select p.proname,
       has_function_privilege('anon', p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as auth,
       (p.prosrc ~* 'auth\.(email|uid|role)') as has_auth_guard,
       exists (select 1 from pg_trigger tg where tg.tgfoid = p.oid) as is_trigger_fn
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and (has_function_privilege('anon', p.oid,'execute')
    or has_function_privilege('authenticated', p.oid,'execute'))
order by anon desc, has_auth_guard, is_trigger_fn, p.proname;
```

Then for each non-trigger function that anon can execute, actually call it as an unauthenticated client and record what comes back — empty, error, or real data. That distinction is the whole point. A tester resolves it in an afternoon and bills us for the privilege; I'd rather we knew first. Don't guess from reading the source, because several of these will fail on a null identity in ways that aren't obvious from the body.

Then write the migration. REVOKE EXECUTE from `anon` and `authenticated` on everything that isn't deliberately public, add self-scoping guards to whatever legitimately needs to stay callable, and leave trigger functions alone — they run as the trigger owner regardless of who holds execute, so revoking there is noise. Apply it through `Supabase:apply_migration`, then re-run the posture query and prove the number went to zero.

The last piece of Wave 1 is the bit that stops this happening again, and honestly it matters more than the sweep itself. Build a scheduled posture check — a cron that reports RLS-off tables, RLS-on-with-zero-policies tables, and anon-executable non-trigger definer functions, and alerts into `platform_alerts` when any count changes from the last run. The failure in June wasn't the functions, it was that nothing was watching for three months. It also converts "we audited once" into "we monitor continuously", which is the answer a certification auditor and a security questionnaire are both actually asking for.

While you're in there, document the 21 tables that have RLS enabled with zero policies. That's a deliberate deny-all, service-role-only posture and it's correct, but a reviewer will ask for the list and the reasoning and I don't want to be deriving it live on a call.

**Done when:** zero anon-executable non-trigger definer functions; every remaining `authenticated`-executable one self-scopes; the posture cron is running and has caught at least one deliberate test change; the deny-all table list is written into the security questionnaire.

**CLOSED 9 September 2026 (PM-1133).** Anon-executable non-trigger definer functions 25 → 0, probed as `anon` before and after. Migrations `enterprise_w1_definer_lockdown` and `enterprise_w1_security_posture_monitor`; cron 74 `security-posture-check` at 03:15 UTC, validated against a deliberate re-grant. Deny-all table register and an honest §3 rewrite are in `brain/security_questionnaire.md`. New §23.278–§23.282. Two things worth carrying into later waves: the audit's named worst-offenders were not the actual exposures (they guard indirectly through `get_my_partner_id()`), and the one genuine unauthenticated write was scored as *guarded* by the regex — so probe, never read. One item left open by choice: `ALTER DEFAULT PRIVILEGES … REVOKE EXECUTE … FROM public, anon, authenticated` is the structural fix for the root cause but changes the default for every parallel session's new RPC; cron 74 is the compensating control until Dean calls it.

**Then:** update `brain/security_questionnaire.md` §3 and §4, add a §23 hard rule about definer exposure being re-checked on every RPC ship, and close the session with the usual atomic brain commit.

---

## WAVE 2 — Infrastructure, credentials, backup integrity

This wave is smaller and mostly unglamorous, but two items in it are things we've actively told prospects that aren't true, so it carries more risk than it looks.

Start with PITR. It's still not enabled, which means our real RPO is 24 hours while we're quoting a 4-hour RTO — those two numbers don't reconcile and a reviewer will spot it in seconds. Enable it. Then, separately, do an actual restore into a scratch project, time it, and write the result down. "When did you last test a restore?" is a standard question and "never" is a bad answer. The restore also tells us whether the 4-hour RTO is real or aspirational, which I'd like to know before someone else asks.

The same day PITR goes on, hunt down the false claim. `reports/09-enterprise-readiness.md` tells prospects we have "Daily + PITR (7-day retention), WAL archiving active". We don't, and that line has been sitting in a document written for procurement reviewers since April. Grep the brain, check whatever Lewis has sent out, fix every instance. One caught inaccuracy taints every other answer we've given, so this is worth being thorough about.

Then credentials. The service_role key picked up an extra consumer on the Hetzner box at PM-714, and anon-key rotation has been on the backlog for months. Rotate both. More importantly, write the rotation schedule down — rotation with no documented cadence is itself an audit finding, and the schedule is a five-minute job that closes it.

Last, add a Content Security Policy to the portal pages and document what we hold in localStorage. JWTs in localStorage is standard and we have a defensible answer for it, but CSP is the mitigation a tester asks for immediately after probing for XSS, and not having it turns a fine answer into a follow-up finding.

**PROGRESS 9 September 2026.** Doc track done (PM-1134): the false backup claim is corrected in `reports/09-enterprise-readiness.md` **and in its actual origin `reports/02-backup-dr.md`**, which the playbook did not name — 09 was the copy. Questionnaire §12 rewritten honest. CSP done (PM-1135), and the item as written was stale: CSP was not missing, it was on 66 of 96 pages, with the 30 gaps being the newest surfaces including the Mind and Connect pillars. **BLOCKED: PITR is a paid dashboard add-on Dean must enable** (~$100/mo Pro, 7-day) — the restore test and any evidenced RTO sit behind it. **NOT STARTED: key rotation** — treat as its own session; service_role gained a consumer on the Hetzner box at PM-714 and a missed consumer fails hard, so build the full checklist before touching anything. **CSP follow-ups:** canonicalise the six policy variants on the other 66 pages; size the nonce migration off `'unsafe-inline'`; ship a CI coverage check (§23.285).

**Done when:** PITR on; one restore performed and minuted with a timestamp; no false backup claim anywhere in the brain or in Lewis's materials; both keys rotated with a documented cadence; CSP headers live.

---

## WAVE 3 — Enterprise platform features

**DEFERRED 9 September 2026 (PM-1137), pending L12.** Dean's read of the Sage arrangement — VYVE distributed to Sage's own customers, embedded in the Sage portal — would change the tenant model, the identity model and the privacy floor. Building this wave against the wrong assumption means building it twice, and none of it is load-bearing today: **there are no real employer accounts** (live check 9 Sep: 86 real members carry no company at all; the BT, Sage and Individual rows are test data). Resume when L12 is answered.

This is where the product actually has to change, and it's the wave most likely to be discovered late by someone else, so I'd rather we got ahead of it.

The employer dashboard still authenticates on a shared API key. One static secret across all employers is the sort of thing that ends a security review in a single sentence, and it was flagged back in April. Move to proper per-employer authentication with scoped access. Keep the aggregate-only PII boundary exactly as it is — that policy is a genuine competitive strength and it's the most reassuring thing we can say to an employer's works council, so it doesn't get relaxed for convenience.

Then bulk onboarding, because there isn't any. Provisioning a few hundred Sage employees one at a time isn't viable and this is exactly the kind of gap that surfaces at the worst possible moment. We need a CSV or directory-driven import, invitation emails, and a way to track activation so Lewis can report pilot activation rate against the agreed criteria.

Also in this wave: employer admin role separation, and an audit trail of what an employer's own admins did inside their tenancy. Enterprises expect both.

One thing to check before starting rather than after: whether Sage has come back on SSO. If they need SAML or OIDC federation for employer admins — and a company that size very likely will — that changes the shape of this wave substantially and affects our Supabase plan. If Lewis hasn't asked yet, that question goes out before we build, not after.

**Done when:** shared employer API key revoked; each employer authenticates independently; 200 test members provision in a single operation with trackable activation; admin roles separated and audited.

---

## WAVE 4 — Proof and documentation

Nothing here changes the product. All of it changes what we can evidence, and roughly six audit findings close in a single sitting, so it's better value than it sounds.

Load testing first, because it's the only item with a real unknown in it. We've never run it and 107 members proves nothing about concurrency. Script a test at realistic pilot load and again at projected full-rollout load, capture the numbers, fix whatever breaks. That converts "we believe we scale" into a figure we can put in a questionnaire.

Then the documentation sprint. Uptime SLA — offer 99.5%, not 99.9%, because we can neither evidence 99.9% nor absorb the service credits. Support tiers with response times, escalation path and a named contact. An incident response runbook, kept distinct from the ICO breach procedure, since they're different documents answering different questions. A records retention schedule per data category, which every enterprise DPA schedule asks for. Access review, MFA policy and an offboarding procedure — right now every admin path runs through accounts held by me and Lewis and there's no written answer to "what happens when someone leaves".

Then run an accessibility pre-assessment. Before we pay £2–5k for a formal audit I want to know how bad it is. Run automated tooling across the portal. If it's contrast and labels, remediation is cheap. If it's structural, we need to know now rather than in week ten of a procurement cycle. This is currently the gap where we have no answer at all, which is worse than having a bad one.

Finally, key-person handover documentation. I'm the single point of failure for the entire technical estate — no second person with production access, no runbook that would let anyone else operate the platform. Vendor management will ask about this. Write the runbook and name a technical contingency. The honest mitigation is documentation, not pretending the risk isn't there.

**Done when:** load figures documented at both levels; SLA, support model, incident runbook, retention schedule and access policy all written; accessibility pre-assessment complete with a remediation estimate; handover runbook exists.

---

## WAVE 5 — External and paid engagements

This wave is mostly coordination rather than building, and none of it should start before there's a real deal shape, because it's the expensive tier.

The pen test is the main item. CREST or CHECK accredited, external web and API scope, retest included. Budget £4–8k — and note the £1–2k figure that used to sit in the brain was wrong, it buys an automated scan that no enterprise reviewer will accept. The thing to plan around is lead time, not cost: six to eight weeks end to end once you count booking, testing, report, remediation and retest. That fits comfortably inside an enterprise procurement cycle, which is exactly why we don't pay for it speculatively.

Alongside it: the formal accessibility audit if the pre-assessment in Wave 4 says we need one, and ISO 27001 if and only if Sage comes back saying they require it. ISO is £6–10k to the certification body plus £5–15k a year for tooling, four to nine months. It does not have to precede signature — the normal mechanism is a contractual commitment to certify within twelve months of go-live with compensating controls accepted in the interim, and that's the position to argue for.

**Done when:** pen test complete with findings remediated and retested; accessibility position resolved; ISO either underway or formally deferred by contract.

---

## LEWIS TRACK — 12 items

Not ours to build, but ours to track, because every one of these has weeks of external lead time and they've all been sitting still longer than anything on my list.

| # | Item | Cost | Lead time | Status |
|---|---|---|---|---|
| L1 | Ask Sage what their security team actually requires | £0 | One email | OPEN |
| L2 | HAVEN in front of Phil, or agree we pull it | £0 | Phil-dependent | OPEN |
| L3 | Buy Cyber Essentials | £300–400 | 3–10 days | OPEN since June |
| L4 | Approve email tenant migration off consumer hosting | ~£12/user/mo | 1 week | OPEN |
| L5 | Insurance quotes — professional indemnity and cyber | £1.5–4k/yr | 2–4 weeks | OPEN |
| L6 | Decide B2B volume tiers | £0 | Days | OPEN since April |
| L7 | File outstanding DPAs, confirm Anthropic terms | £0 | An afternoon | OPEN since July |
| L8 | Commission contract template | £2–5k | 3–4 weeks | OPEN |
| L9 | Article 9 consent wording — legal review | £500–1.5k | 2–3 weeks | OPEN |
| L10 | Agree pilot success criteria with Sage in writing | £0 | One meeting | OPEN since April |
| L11 | YouTube-embed disclosure into privacy policy | £0 | 1 hour | OPEN since July |
| L12 | **Confirm the Sage commercial model — this re-shapes Wave 3** | £0 | One conversation | OPEN 2026-09-09 |

**L12 (added 9 September 2026, PM-1137) — ask Sage what the arrangement actually is, because Dean's current understanding changes Wave 3's design.** Dean's read is that VYVE would be offered to **Sage's customers** — small businesses using Sage — and would likely sit inside the Sage portal, with users signing in through Sage. If that is right, this is a **distribution channel, not an enterprise sale**, and three Wave 3 assumptions break:

- **The tenant is not Sage.** It is hundreds or thousands of small employers, each arriving on their own. Wave 3's bulk CSV import of 200 employees is the wrong shape; self-serve tenant creation at signup is the right one.
- **Identity is probably not SAML.** Users arriving already authenticated inside a host portal means Sage is the identity provider, and for an embedded app that is far more likely to be OAuth/OIDC via a developer programme. Supabase Auth handles SAML natively but not arbitrary OIDC providers, so that route means a token exchange in an Edge Function — real work, not huge, but a different build from SAML.
- **The aggregate-only PII boundary stops being sufficient.** It is genuinely strong at 200 employees. At a nine-person firm, "team wellbeing dropped this month" identifies a person. A minimum cohort floor below which the employer dashboard shows nothing is cheap to design in now and expensive to retrofit after a small employer complains.

**The question to put:** is this an app-marketplace listing, an embedded integration, or a reseller arrangement? Those are three different builds. Alan is the right person to help shape it — procurement background, and he will know how these arrangements get structured internally.

**Supabase note for whoever prices it:** end-user SSO is included on Pro for 50 monthly active SSO users, then roughly $0.015/MAU. Dashboard SSO (logging into Supabase itself) is Team/Enterprise — different thing, often conflated. Confirm on the live pricing page before anyone quotes it.

L1 comes first because it re-prices everything — until Sage tells us whether they want Cyber Essentials, ISO 27001 or SOC 2, we're guessing at a decision worth somewhere between £400 and £40,000. L2 comes next because HAVEN is live for real members without clinical sign-off and the downside there isn't a lost contract.

On "lewis enterprise chase": read this table, work out what's still open, and draft the message casually, first person from me, no emojis. Alan is the right person to help shape the Sage question — he has the procurement background and knows how these thresholds get applied internally rather than what the policy document says.

---

## Standing notes for any enterprise session

- The audit that produced all of this is `reports/13-enterprise-readiness-audit-2026-09.md`. It supersedes `reports/09-enterprise-readiness.md`, which is stale and contains a backup claim we cannot support.
- `brain/security_questionnaire.md` is the prospect-facing source of truth. Every wave that changes posture updates it in the same session, or the questionnaire goes stale the way report 09 did.
- Never put a claim in the questionnaire we cannot evidence on demand. An owned gap with a remediation date passes an enterprise review. A claim that fails five minutes of probing poisons every other answer in the document.
- Sage is a software company. Their reviewers will ask sharper questions than a generic corporate and be more forgiving of an honest dated gap. Write for that reader.
