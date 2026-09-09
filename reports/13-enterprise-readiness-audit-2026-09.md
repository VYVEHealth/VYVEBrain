# VYVE Health CIC — Enterprise Contract Readiness Audit

**Date:** 9 September 2026
**Prepared by:** Dean Brown (CTO) with Claude
**Target:** Sage (HubSpot deal 495586118853) and any subsequent enterprise contract
**Supersedes:** `reports/09-enterprise-readiness.md` (14 April 2026), which is now materially out of date

---

## At a glance

### Verdict

| Question | Answer |
|---|---|
| Could we run a Sage pilot? | **Yes — in about 4–6 weeks**, for £1–2k of spend |
| Could we sign a full enterprise contract today? | **No** |
| What stops us signing? | Insurance, contract paper, pen test, accessibility, SSO |
| Is anything unfixable? | No. Nothing here is structural except company size |
| Biggest risk right now | An unauthenticated database surface we introduced since June |
| Biggest surprise | The blockers are mostly commercial and legal, not technical |

### The nine domains

| Domain | Rating | One-line summary |
|---|---|---|
| Certification | 🔴 Red | Nothing certified. Cyber Essentials still unbought at £300 |
| Technical security | 🟠 Amber | Strong foundations, one live regression, unproven at scale |
| Data protection | 🟢 Green | Our best gate. Ahead of our size class |
| Commercial | 🔴 Red | No tiers, no contract, no SLA, no support model |
| Supplier viability | 🔴 Red | No insurance, pre-revenue, single point of failure in me |
| Enterprise features | 🔴 Red | No SSO, no bulk onboarding, shared employer API key |
| Clinical & safeguarding | 🔴 Red | HAVEN live unsigned-off, crisis path via consumer mailbox |
| Accessibility | 🔴 Red | Never assessed. No answer at all if asked |
| Change management | 🟢 Green | Audit-grade already. Better than many certified firms |

### Top 10 blockers, ranked

| # | Blocker | Cost | Time | Owner |
|---|---|---|---|---|
| 1 | Anon-callable SECURITY DEFINER functions | £0 | 1–2 sessions | Dean |
| 2 | Crisis alerts landing in consumer mailbox | ~£12/user/mo | 1 week | Dean + Lewis |
| 3 | HAVEN live without clinical sign-off | £0 | Phil-dependent | Lewis → Phil |
| 4 | No insurance (PI + cyber) | £1.5–4k/yr | 2–4 weeks | Lewis |
| 5 | No contract template | £2–5k | 3–4 weeks | Lewis |
| 6 | B2B volume tiers undefined | £0 | Days | Lewis |
| 7 | No external pen test | £4–8k | 6–8 weeks | Dean books |
| 8 | Accessibility never assessed | £2–5k | 4–6 weeks | Dean |
| 9 | Shared employer API key | £0 | 2–3 sessions | Dean |
| 10 | Cyber Essentials unbought | £300–400 | 3–10 days | Lewis |

### Money

| Scenario | Spend | Buys us |
|---|---|---|
| Run a pilot | **£1–2k** | Cyber Essentials, email tenant, PITR, insurance quotes |
| Sign a contract | **£10–20k** | Pen test, contract paper, legal review, accessibility, insurance |
| Full certified posture | **£25–45k/yr 1** | Adds ISO 27001 and compliance tooling. Only once revenue justifies it |

### Split of the work

| Who | Items | Notes |
|---|---|---|
| **Dean** | 14 | Almost all £0 — my time, not our money |
| **Lewis** | 11 | Every item needing a signature, decision or spend |
| **External** | 6 | Pen test, legal, accessibility, insurance, cert body, Phil |
| **Structural** | 2 | Company size and key-person risk — mitigate, can't remove |

**The single most important line in this document:** every item that has been sitting still for months is on Lewis's side of that table.

---

## 0. How to read this

An enterprise buyer of a health and wellbeing platform runs four gates, usually in parallel and usually with different people behind each one:

1. **Commercial** — price, term, tiers, contract paper. Owned by procurement.
2. **Security** — supplier security questionnaire, then a technical review, then evidence. Owned by InfoSec, and this is the gate that kills deals silently.
3. **Data protection and legal** — DPA, sub-processor schedule, DPIA, transfer mechanisms. Owned by the DPO or legal counsel.
4. **Supplier viability and operational** — can this company still exist in three years, who do we call at 2am, what happens if the CTO is hit by a bus. Owned by vendor management.

We are strong on gate 3, mixed on gate 2, thin on gates 1 and 4. The pattern that matters: **the things that sink deals here are not the things we've been building.** Every hour spent on product goes to gates nobody is failing us on.

A note on posture throughout. Sage is a software company. Their InfoSec team writes this kind of software for a living, which means two things: they will ask sharper questions than a generic corporate, and they will be more forgiving of an honest, dated gap than a generic corporate would. Owned gaps with a remediation date pass. Claims that don't survive five minutes of probing do not.

---

## 1. Scorecard

| # | Domain | Status | Cost to close | Lead time | Blocks pilot? | Blocks full contract? |
|---|--------|--------|---------------|-----------|---------------|----------------------|
| A1 | Cyber Essentials | **Not started** | £300–400 | 3–10 days | Probably not | Likely yes |
| A2 | ISO 27001 | Not started | £6–10k cert + £5–15k/yr tooling | 4–9 months | No | Contractual commitment usually sufficient |
| A3 | SOC 2 Type II | Not started | £20–40k + tooling | 6–12 months | No | Only if a US-shaped buyer insists |
| A4 | External penetration test | Not started | £4–8k (CREST/CHECK) | 6–8 weeks end to end | Possibly | **Yes** |
| B1 | SECURITY DEFINER exposure | **Regressed** | £0 — internal | 1–2 sessions | **Yes if found** | **Yes** |
| B2 | RLS posture | Strong | £0 | Documentation only | No | No |
| B3 | Credential rotation (service_role, anon) | Open debt | £0 | 1 session | No | Yes |
| B4 | PITR / backup restore test | Not enabled, never tested | ~£80–150/mo | 1 day | No | **Yes** |
| B5 | CSP / client-side hardening | Absent | £0 | 1–2 sessions | No | Yes |
| B6 | Monitoring, alerting, on-call | Partial, single-person | £0–50/mo | 1–2 sessions | No | Yes |
| B7 | Load / concurrency testing | Never done | £0–500 | 2–3 days | Possibly | **Yes** |
| C1 | ICO registration, DPIA, DPA | **Complete** | — | — | No | No |
| C2 | Sub-processor register | v1 drafted | £0 | Lewis countersignatures | No | No |
| C3 | GDPR Art. 15 / 17 pipelines | **Live and programmatic** | — | — | No | No |
| C4 | Article 9 consent wording | Needs legal review | £500–1.5k | 2–3 weeks | No | Yes |
| C5 | Records retention schedule | Not written | £0 | 1 session | No | Yes |
| C6 | Email tenant (finding U) | **Special-category data on consumer hosting** | ~£12/user/mo | 1 week | **Yes** | **Yes** |
| D1 | B2B volume tiers | Undefined | £0 — Lewis decision | Days | **Yes** | **Yes** |
| D2 | MSA / contract template | Not drafted | £2–5k legal | 3–4 weeks | **Yes** | **Yes** |
| D3 | Pilot success criteria | Proposed, not agreed | £0 | Days | **Yes** | No |
| D4 | Uptime SLA + service credits | Not defined | £0 | 1 session | Possibly | **Yes** |
| D5 | Support model and response times | Not defined | £0 | 1 session | Possibly | **Yes** |
| E1 | Professional indemnity + cyber insurance | Unknown / likely absent | £1.5–4k/yr | 2–4 weeks | Possibly | **Yes** |
| E2 | Supplier financial viability | Pre-revenue CIC | Structural | — | No | **Material risk** |
| E3 | Business continuity / key person | DR note exists, key-person risk unmitigated | £0 | Documentation | No | Yes |
| E4 | External DPO | Not appointed | £2–5k/yr | 2–4 weeks | No | At scale |
| F1 | SSO (SAML / Okta) for employer admins | Not built | £0 + Supabase plan | 2–4 sessions | Possibly | **Yes** |
| F2 | SCIM / directory provisioning | Not built | £0 | 3–5 sessions | No | Likely |
| F3 | Per-employer authenticated portal | Shared API key | £0 | 2–3 sessions | **Yes** | **Yes** |
| F4 | Bulk enterprise onboarding | Not built | £0 | 2–3 sessions | **Yes** | **Yes** |
| F5 | Employer admin roles and audit | Partial | £0 | 2 sessions | No | Yes |
| G1 | Clinical governance / HAVEN sign-off | **Blocked on Phil** | £0–2k | Weeks — external dependency | **Yes** | **Yes** |
| G2 | Crisis escalation path | Runs through consumer mailbox | See C6 | 1 week | **Yes** | **Yes** |
| G3 | Safeguarding policy | Not written | £0 | 1 session | Possibly | **Yes** |
| H1 | Accessibility (WCAG 2.2 AA) | Never assessed | £2–5k audit | 4–6 weeks | No | **Yes** |
| H2 | Access reviews, MFA policy, offboarding | Not written | £0 | 1 session | No | **Yes** |
| H3 | Change management evidence | **Genuinely strong** | — | — | No | No |

---

## 2. Where we actually are — evidence, not assertion

Live figures pulled from the production database on 9 September 2026, not from cached documentation:

- **231 public tables**, every one with RLS enabled. Zero tables with RLS off.
- 21 tables have RLS enabled with **zero policies** — a deliberate deny-all, service-role-only posture. Defensible, but currently undocumented.
- **107 members**, 112 auth users, 12 new members in the last 30 days, 23 employer-member links.
- **197 platform alerts** in the last 30 days — we have error telemetry, which is more than most companies our size.
- 50 rows in `admin_audit_log`.

Two things in that list are worth naming honestly. First, 107 members is small, and an enterprise reviewer will read it as "this platform has never run at our scale" — because it hasn't. Second, we have never load-tested. Sage's likely pilot cohort alone could be several hundred users; a full rollout is five figures. **Concurrency is an unproven claim and they will ask.**

---

## 3. Domain-by-domain

### A. Certification

**What enterprise expects.** A recognised security certification, or a credible, dated commitment to obtain one. In the UK the ladder is Cyber Essentials → Cyber Essentials Plus → ISO 27001. SOC 2 is the American equivalent of the top rung.

**Where we are.** Nothing certified. We hold an ICO registration, which is a legal requirement rather than a security credential, and reviewers know the difference.

**The gap and what it costs.**

- *Cyber Essentials* — IASME self-assessment, roughly £300–400, certificate inside a fortnight. Our stack passes comfortably. This has been sitting agreed-but-unbought since June. It is the cheapest credibility available to us and there is no argument for delaying it further.
- *Cyber Essentials Plus* — the audited version, £1,500–2,500, adds a hands-on technical verification. Some public sector tenders mandate it. Worth doing only if asked.
- *ISO 27001* — £6–10k to the certification body at our size, plus £5–15k a year for a compliance platform if we want the evidence collection automated, plus significant founder time. Four to nine months depending on tooling. **Crucially, this does not have to precede signature** — the standard mechanism is a contractual commitment to certify within twelve months of go-live, with compensating controls accepted in the interim.
- *SOC 2* — £20–40k and a 3–12 month observation window. Not proportionate. Only revisit if a specific buyer refuses ISO as an equivalent.
- *DSPT* — free NHS/social care self-assessment, relevant only on the public sector track. Our GDPR posture already covers most of it.

**Recommendation.** Cyber Essentials immediately. ISO 27001 committed contractually, started only once a deal has shape.

---

### B. Technical security posture

**B1 — SECURITY DEFINER exposure. This is the most serious open item and it is a regression.**

The June audit (§23.104, PM-564–567) closed with four member-callable SECURITY DEFINER functions and zero open violations. As of today the live database has **51 SECURITY DEFINER functions executable by `anon` or `authenticated`**. Twenty-five of those are non-trigger functions callable by **`anon`** — reachable with the public anon key and no login whatsoever. Twelve of those twenty-five contain no `auth.email()`, `auth.uid()` or `auth.role()` guard anywhere in the body.

The ones that would draw a tester's eye:

| Function | Concern |
|---|---|
| `coach_client_health_status` | Reads client health state, takes a partner argument, no auth guard |
| `partner_referral_stats` | Partner revenue figures, no auth guard |
| `coach_challenge_go_live` | Unauthenticated write path |
| `gdpr_member_scoped_tables` | Exposes the data map itself |
| `is_coach_of`, `challenge_partner`, `thread_partner` | RLS predicates other policies depend on — leverage, not leakage, but worse if they can be steered |
| `check_rate_limit`, `prune_ef_rate_limits`, `expire_booking_holds` | Anon-callable writes that can reset our own abuse controls |

Not all of these will return data to an anon caller — several will fail on a null identity or return empty. **That distinction is exactly what a pen tester resolves in an afternoon and bills us for.** We should resolve it first: enumerate, call each as anon, REVOKE everything not deliberately public, self-scope what remains. Same shape as the June migration. Cost: zero pounds, one to two sessions.

The deeper lesson is process, not code. Between June and September we shipped the entire coaching and partner stack and the security posture drifted without anyone noticing, because nothing re-checks it. **A recurring automated posture check belongs in the platform** — a scheduled query that reports RLS-off tables, policy-less tables and anon-executable SECURITY DEFINER functions, alerting on change. That single control is also the thing that turns "we audited once" into "we have continuous monitoring", which is what a certification auditor actually wants to hear.

**B2 — RLS.** Genuinely strong. 231 tables, all enabled, cross-account isolation verified in June. Document the 21 deny-all tables and their rationale so it can be handed over rather than derived live.

**B3 — Credentials.** The service_role key has an additional consumer on the Hetzner box since PM-714, and anon-key rotation has been on the backlog for months. Rotation with no documented schedule is itself a finding. Write the schedule, then execute it.

**B4 — PITR and restore testing.** Two problems. First, PITR is still not enabled, so our real RPO is 24 hours against a stated 4-hour RTO — those numbers don't reconcile and a reviewer will spot it. Second, and worse, **the April readiness report claims "Daily + PITR (7-day retention), WAL archiving active"**, which is not true and has been sitting in a document intended for prospects. Enable PITR (small monthly add-on), correct every document that repeats the old claim, and then **perform and minute an actual restore test** — "when did you last test a restore?" is a standard question and "never" is a bad answer.

**B5 — Client-side hardening.** JWTs in localStorage is standard and defensible; we have an answer for it. What we don't have is a Content Security Policy on the portal, which is the mitigation a tester asks for immediately after probing for XSS. Add CSP headers, document the localStorage contents.

**B6 — Monitoring and on-call.** We have `platform_alerts` and the App Health dashboard, which is real. We have no defined on-call, no status page, no documented incident response runbook distinct from the breach procedure. For a pilot, a named contact and a stated response window is enough. For a full contract it isn't.

**B7 — Load testing.** Never performed. Run a scripted concurrency test at realistic pilot load and again at projected full-rollout load, capture the numbers, fix what breaks. Cheap and it converts an unproven claim into an evidenced one.

---

### C. Data protection

**This is our strongest gate and we should lead with it.**

In place and genuinely good: ICO registration current; DPIA complete with a September 2026 review now due; DPA template ready; sub-processor register drafted to schedule standard; **Article 15 export and Article 17 erasure both programmatic and live**, which is well ahead of most startups and many incumbents; data resident in Ireland; the only special-category flow leaving the EU is Anthropic under IDTA/SCCs with training excluded, and we disclose that proactively rather than burying it.

Open items:

- **C4 — Article 9 consent wording** needs a solicitor's eye. We process health data; the lawful basis and the consent language are the first thing a DPO reads. £500–1,500 for a review is cheap insurance.
- **C5 — Records retention schedule.** Not written. Every enterprise DPA schedule asks for retention periods per data category. One session of work.
- **C6 — the email tenant.** `team@vyvehealth.co.uk` runs on consumer-grade hosting and **receives crisis alerts containing special-category disclosure context**. This is the single worst item in the entire audit relative to how cheap it is to fix. It is a DPA-relevant finding, a clinical-governance finding and a security finding simultaneously. Migrate to a managed Google Workspace or M365 tenant with MFA enforced. About £12 per user per month and a week of faff.
- **C2** — Lewis needs to countersign and file the Supabase, Brevo, PostHog and Capawesome DPAs, confirm Anthropic's commercial terms are on file, and add the YouTube-embed disclosure to the privacy policy. All were flagged in the register draft in July and none are done. **A DPO will ask for these by name.**

---

### D. Commercial

Almost nothing here is built, and it blocks earlier than the technical work does.

- **D1 — Volume tiers.** Still undefined after five months. We cannot quote Sage without them. Lewis decision, days of work, blocking.
- **D2 — Contract paper.** No MSA, no order form, no schedules. Sage will likely push their own paper, which is worse for us — their standard terms will carry liability caps, indemnities, audit rights, and possibly a parent-guarantee requirement that a pre-revenue CIC cannot meet. **Have our own template drafted first**, £2–5k with a solicitor who knows SaaS.
- **D3 — Pilot success criteria.** Proposed in April, never agreed with the customer. Agreeing these *before* the pilot starts is what converts a pilot into a contract; without them the pilot ends in a subjective conversation we will lose.
- **D4 — Uptime SLA.** We inherit Supabase's 99.9% but have never stated our own. Offer 99.5% with modest service credits; do not offer 99.9% — we cannot evidence it and cannot absorb the credits.
- **D5 — Support model.** Define tiers, response times, escalation path, named contact, business hours vs out-of-hours. One session.

---

### E. Supplier viability — the gate nobody prepares for

**This is where I think we are most exposed, and it isn't technical.**

Sage's vendor management will run a financial check on VYVE Health CIC. They will find a pre-revenue company with two working directors, no filed revenue, and a founder-dependency profile. The standard outcomes are: a capped contract value, a parent-company guarantee we cannot provide, an escrow requirement for source code, an insistence on a shorter initial term, or a request for audited accounts we don't have.

Mitigations that actually work:

- **Insurance.** Professional indemnity and cyber liability, typically £1–5m cover demanded. Expect £1,500–4,000 a year for our profile. Employer's liability if we have any employees. **Enterprise contracts routinely specify minimum cover levels as a condition of signature** — this is a hard gate, not a nice-to-have, and we should get quotes now because it's cheap and it takes weeks.
- **Source code escrow.** A standard answer to "what if you go under" — a few hundred to low thousands a year through an escrow provider. Offer it proactively; it's disarming.
- **Key person risk.** I am the single point of failure for the entire technical estate. There is no documented handover, no second person with production access, no runbook that would let anyone else operate the platform. This is true, it is visible, and it will be asked about. The honest mitigation is documentation and a named technical contingency, not pretending otherwise. Alan being COO helps the org chart look less like two people.
- **CIC status** is a genuine asset here, especially on the public sector track and in social-value scoring. It also raises a question a commercial buyer may not have met before — the asset lock, the CIC36, what happens to the platform in a wind-up. Have the answer ready rather than improvising it.

---

### F. Enterprise product capability

The platform is built for individual members. Enterprise buyers need administrative infrastructure we largely don't have.

- **F1 — SSO.** Sage runs a corporate identity provider. For employer admin access they will very likely require SAML or OIDC federation; some will want it for member login too. Supabase supports SAML SSO on higher plans. This is real build work and a real plan-cost increase, and it's the kind of requirement that appears late and blows a timeline.
- **F2 — SCIM provisioning.** Automated joiner/mover/leaver sync from their directory. Expected at large scale. If we don't have it we need a defensible manual process with a stated SLA — because when an employee leaves Sage, their access to a health platform must be revoked promptly, and that's a data protection obligation as much as a feature.
- **F3 — Per-employer authenticated portal.** Still a shared API key on the employer dashboard. This was flagged in April and hasn't moved. A shared static key across employers is exactly the kind of thing that ends a security review badly.
- **F4 — Bulk onboarding.** No batch flow. Onboarding several hundred members one at a time is not viable.
- **F5 — Employer admin roles and audit.** Partial. Enterprises expect role separation, and an audit trail of what their own admins did.

**The PII boundary policy — aggregate-only, no individual member identities exposed to employers — is a genuine competitive strength.** It is also the single most reassuring thing we can say to an employer's works council or union, and it should be stated early and prominently rather than treated as a technical footnote.

---

### G. Clinical and safeguarding — the category-specific gate

A wellbeing platform sold to an employer carries duty-of-care exposure that generic SaaS does not. This is where a bad outcome doesn't just lose the contract, it ends the company.

- **G1 — HAVEN.** The mental-health persona is live for a small number of members **without Phil's clinical sign-off**. That is a live, known, unmitigated risk, and it is not something to carry into an enterprise contract. Either the sign-off lands or HAVEN comes down before Sage sees a demo. This is an external dependency on Phil's time and therefore needs starting now, not when the contract is close.
- **G2 — Crisis escalation.** The path currently terminates in a consumer mailbox. Fixing C6 fixes most of this, but the escalation procedure itself also needs writing down: who is notified, in what window, what the member sees, when a professional service is signposted, and what is logged.
- **G3 — Safeguarding policy.** Not written. An employer's HR and legal function will ask for it, and for a health product they are right to.
- **Clinical governance more broadly.** Who is the clinical accountable person? What evidence base sits behind the content? What is the AI's stated scope and its refusal boundaries? We have good answers technically; none of them are written down in the form a reviewer expects.

---

### H. Organisational

- **H1 — Accessibility.** Never assessed. WCAG 2.2 AA is increasingly a contractual requirement in enterprise procurement, and mandatory on the public sector track. A large employer rolling a wellbeing app to its whole workforce has disability-inclusion obligations that flow straight to us. An audit runs £2–5k; remediation depends on findings. **This one is genuinely likely to appear and we have no answer at all.**
- **H2 — Access reviews, MFA policy, offboarding.** Nothing written. Every admin path runs through accounts held by me and Lewis. A page of policy plus enforced MFA closes most of it.
- **H3 — Change management.** Our commit discipline, PM numbering, verified commits and changelog are **stronger evidence than most certified companies produce**. Say so, and show it — it maps directly onto ISO 27001 Annex A change-management controls and it's already running.

---

## 4. What we do genuinely well

Worth stating plainly, because the list above is unbalanced by design:

1. **GDPR execution beats our size class.** Programmatic Article 15 and 17, immutable audit logging, EU residency, a written sub-processor register. Most Series A companies cannot do this.
2. **RLS coverage is comprehensive and verified**, not aspirational.
3. **No secrets in source control.** Vaulted, with a secret-scan discipline behind it.
4. **Honest transfer disclosure.** We name the Anthropic US flow proactively instead of hoping nobody asks. Reviewers reward this.
5. **The aggregate-only PII boundary** is a product decision that happens to be a compliance asset.
6. **Error telemetry and an App Health dashboard** already exist.
7. **Change and release discipline** is audit-grade.
8. **CIC status** delivers real procurement advantage, especially public sector.

---

## 5. Critical path

**Tier 0 — do now, costs almost nothing, blocks everything (2–3 weeks)**

1. SECURITY DEFINER sweep and REVOKE pass. Internal, one to two sessions. *Do this before any further product work.*
2. Buy Cyber Essentials. £300–400.
3. Migrate the email tenant off consumer hosting. ~£12/user/mo.
4. Enable PITR, run and minute a restore test.
5. Correct the false PITR claim in every prospect-facing document.
6. Lewis: file the outstanding DPAs and confirm Anthropic terms.
7. Lewis: fix volume tiers.
8. Get insurance quotes — PI and cyber.

**Tier 1 — before Sage sees anything technical (4–6 weeks)**

9. Per-employer authenticated portal, retire the shared API key.
10. Bulk enterprise onboarding.
11. Automated recurring security-posture check.
12. Credential rotation, executed and scheduled.
13. CSP and client-side hardening.
14. Load test at pilot and rollout scale.
15. HAVEN: clinical sign-off or take it down.
16. Write the safeguarding policy, crisis escalation procedure, retention schedule, access/MFA/offboarding policy, SLA and support model. Mostly a documentation sprint.

**Tier 2 — before signature (6–10 weeks, overlapping)**

17. External pen test, CREST or CHECK accredited, with retest. £4–8k, book 6–8 weeks ahead.
18. Contract template drafted. £2–5k.
19. Article 9 consent wording reviewed. £500–1.5k.
20. Accessibility audit. £2–5k.
21. Insurance bound.
22. Pilot success criteria agreed *with Sage*, in writing.
23. Source code escrow offered.

**Tier 3 — committed contractually, delivered post-signature**

24. ISO 27001. £6–10k plus tooling, 4–9 months.
25. SSO / SCIM as scoped by their requirements.
26. External DPO before 500 members. £2–5k/yr.

---

## 6. Money

| Scenario | Spend | Notes |
|---|---|---|
| **Minimum to run a credible pilot** | **£1,000–2,000** | Cyber Essentials, email tenant, PITR, insurance quotes. Everything else in Tier 0/1 is our own time. |
| **Minimum to sign an enterprise contract** | **£10,000–20,000** | Adds pen test, contract paper, Article 9 review, accessibility audit, insurance premiums, escrow. |
| **Full certified posture** | **£25,000–45,000 in year one** | Adds ISO 27001 and compliance tooling. Only after a deal justifies it. |

The shape of this matters more than the totals. **The pilot is reachable for roughly the cost of a decent laptop.** The expensive tier only becomes necessary once there is revenue attached to it, and most of it can be sequenced after signature under contractual commitment.

---

## 7. What actually kills this deal

Ranked by probability multiplied by damage:

1. **A security reviewer finds the anon-callable SECURITY DEFINER surface before we do.** Highest probability, highest damage, zero cost to fix, entirely within our control. Fix it this week.
2. **A crisis alert containing special-category data is traced to a personal mailbox.** Regulatory and reputational, not just contractual.
3. **HAVEN causes a bad member outcome while unsigned-off.** Low probability, existential damage.
4. **We are asked for accessibility compliance and have never looked at it.** Moderate probability, hard timeline damage — an audit plus remediation is not a two-week job.
5. **SSO is required and appears in week ten of a twelve-week procurement.** Classic late-stage timeline killer.
6. **A false claim in our own documentation is caught.** The PITR line is a live example. One caught inaccuracy taints every other answer we've given.
7. **Financial viability review caps or blocks the contract.** Structural, partially mitigable through insurance, escrow and honest framing.

Items 1 through 6 are all within our control and five of the six cost nothing but time.

---

## 8. The one-line version for Lewis

We are further ahead on data protection than almost anyone our size, and further behind on the commercial, insurance and organisational paperwork than he probably assumes. The technical gaps are real but they are ours to fix for free. **The things that need his signature, his decision or his money are, without exception, the ones that have been sitting still the longest.**
