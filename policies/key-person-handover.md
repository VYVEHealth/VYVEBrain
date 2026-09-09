# Key-Person Risk and Technical Handover Runbook — VYVE Health CIC

**Status:** DRAFT · Drafted 9 September 2026 (PM-1139) · Owner: Dean
**Closes:** scorecard E3 · Vendor management asks for this. "What happens if your CTO is unavailable?" is a standard question and silence is a finding.

> The honest mitigation for key-person risk at our size is documentation, not pretending the risk is absent. This document exists so that a competent engineer who has never seen VYVE could keep it running.

## 1. The risk, stated plainly

Dean Brown is the only person who **operates** the technical estate. There is no second engineer and no on-call rota. Access, however, is not the constraint: all accounts sit under the shared business email and Lewis Vines can reach them (see §3). If Dean were unavailable the platform would continue running — it is substantially automated — but nothing would be fixed, deployed or restored until a technical replacement was brought in, which Lewis is in a position to do.

**What continues without intervention:** the app and portal serve normally; 67 scheduled jobs continue; billing, emails and notifications continue; backups continue.

**What stops:** all fixes, all deploys, incident response, restores, and any request needing production data access — including a subject-access or erasure request that fails automatically.

**Realistic unattended survival: weeks, not days, and not months.** The first thing to fail would be an expiring credential or a third-party change, not the platform itself. The practical window for bringing in a replacement is therefore comfortable rather than tight.

## 2. Estate inventory

| System | What it is | Access route |
|---|---|---|
| **Supabase** (project `ixjfklpckgxrwjlfsaaz`, EU/Ireland, Pro) | Database (232 tables), authentication, Edge Functions, 21 storage buckets, 67 cron jobs. **The single most important system — everything else is peripheral.** | Dashboard, organisation owner |
| **GitHub** (VYVEHealth org) | `vyve-site` member app, `vyve-command-centre` internal + coach/partner portals, `Test-Site-Finalv3` marketing, `VYVEBrain` documentation, `vyve-capacitor` native builds | Org owner |
| **Capawesome** | Over-the-air app bundle delivery (app `f9961f66`, production channel) | Account |
| **Apple Developer / Google Play** | App Store and Play Store listings and releases | Accounts |
| **Stripe** | Subscriptions, partner revenue share | Account |
| **Brevo** | Transactional and re-engagement email | Account |
| **PostHog** (EU) | Analytics and session replay | Account |
| **HubSpot** (EU) | B2B CRM | Account |
| **Hetzner** (`159.69.95.90`, Nuremberg) | Live-session runner daemon | SSH key in Supabase Vault |
| **Cloudflare** | DNS for vyvehealth.co.uk | Account |
| **YouTube / Riverside** | Live session streaming and replay hosting | Accounts |

**Credentials:** 18 secrets in Supabase Vault. Vault access requires Supabase dashboard access, so **Supabase organisation access is the master key to most of the estate.**

## 3. Access continuity — corrected 9 September 2026

**An earlier draft of this document assumed Dean was the only holder of account access. That was wrong and the correction improves the position materially.**

Every account in the estate is registered to the **shared business email, team@vyvehealth.co.uk**, to which both directors have access. Lewis Vines therefore already holds a route into Supabase, GitHub, the store accounts, Stripe and the rest — not as a courtesy grant that could be forgotten, but structurally, because the accounts were never personal in the first place. Lewis also has repository access and an AI assistant linked to the same documentation repository, so the written architecture and decision history are reachable by him today without any preparation.

**What this means for the risk rating:** key-person risk here is a **capability** risk, not an **access** risk. Lewis can get in; what he cannot do is operate the platform, because that is not his role. That is a materially better position than the one most single-technical-founder companies are in, and it should be stated to vendor management in those terms.

**Confirmed 9 September 2026: second factor and account recovery for every account also resolve to `team@vyvehealth.co.uk`.** Continuity is therefore complete — Lewis can reach every system independently, without Dean's devices, today.

**That resolution creates a single, concentrated dependency, and it should be named rather than celebrated.** The shared mailbox is no longer just an inbox: it is the second factor and the recovery path for the entire estate. Anyone who reaches it reaches Supabase, GitHub, the store accounts and Stripe together, with nothing else in the way.

Two things follow, and both are decisions rather than defects:

1. **Email-delivered codes are the weakest widely-used form of MFA** — phishable and interceptable in ways an authenticator app or hardware key is not. For a two-person company this is a defensible trade: continuity bought at some cost in credential strength. It is recorded here so that it is a decision we know we have made rather than a default we drifted into, and so that a reviewer hears it from us first.
2. **The mailbox itself is the one door where email-based recovery cannot be the answer**, because it *is* the email. It must therefore carry the strongest second factor its provider offers — an authenticator app or a hardware key, never SMS — and both directors must be able to satisfy it. **This is the highest-value security action open to us and it is not large.**

**Scorecard C6 re-rated.** The email tenant migration has been carried as a data-protection item (special-category crisis alerts arriving in consumer-grade hosting). It is now also the **single highest-value security item in the estate**, because that mailbox is the master key to everything else. "Consumer-grade hosting protects our support inbox" and "consumer-grade hosting is the root of trust for our entire production environment" are very different sentences in a security questionnaire, and only the second one is true.

**Recommended: a dry run.** Lewis signs into Supabase, GitHub and one store account from his own device, without Dean's help, and records what worked and what he could not complete. Fifteen minutes, and it converts an assumption into evidence — which is also exactly what a vendor-management reviewer is asking for when they ask this question.

## 3A. Emergency continuity prompt

`policies/emergency-continuity-prompt.md` is written for Lewis to paste into his AI assistant if Dean is unavailable. It orients the assistant, points it at the documentation repository, and walks through triage in priority order. It is deliberately written to be usable by someone non-technical under pressure, and it should be **tested once while nothing is wrong**, because a contingency nobody has ever run is a hope rather than a plan.

## 4. Where an incoming engineer starts

1. **Read `VYVEBrain`** — `brain/master.md` for architecture and the §23 hard rules, `brain/changelog.md` for what happened and why, `tasks/backlog.md` for what was next. This is unusually complete and is the genuine mitigation here.
2. **`brain/schema-snapshot.md`** for the database shape.
3. **`brain/security_questionnaire.md`** for the security posture and its stated gaps.
4. **`playbooks/`** for operational procedures.
5. Deployment: member app is static hosting from `vyve-site` plus OTA bundles; server logic is Supabase Edge Functions; there is no build server and no container orchestration to learn.

## 5. Contingency statement for vendor management

VYVE is a small supplier and does not claim otherwise. Key-person risk is real, is documented rather than denied, and is mitigated by: comprehensive written architecture and decision history maintained continuously rather than retrospectively; a platform built on managed services that continue operating unattended; no bespoke infrastructure requiring specialist knowledge; and a second director who already holds account access through the shared business email and can therefore bring in and enable a replacement engineer without waiting on anyone. Restoring active development would take a competent engineer days rather than months, because the system is documented, conventional, and built on managed services. A written emergency continuity procedure exists (`policies/emergency-continuity-prompt.md`).

## 6. Review

Reviewed at each enterprise contract signature and at least annually. Any new system added to the estate is added to §2 in the same session it is introduced.
