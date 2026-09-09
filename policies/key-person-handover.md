# Key-Person Risk and Technical Handover Runbook — VYVE Health CIC

**Status:** DRAFT · Drafted 9 September 2026 (PM-1139) · Owner: Dean
**Closes:** scorecard E3 · Vendor management asks for this. "What happens if your CTO is unavailable?" is a standard question and silence is a finding.

> The honest mitigation for key-person risk at our size is documentation, not pretending the risk is absent. This document exists so that a competent engineer who has never seen VYVE could keep it running.

## 1. The risk, stated plainly

Dean Brown is the sole person with production access to the technical estate. There is no second engineer, no on-call rota, and no one else who has operated the platform. If Dean were unavailable, the platform would continue running unattended — it is substantially automated — but nothing could be fixed, deployed or restored.

**What continues without intervention:** the app and portal serve normally; 67 scheduled jobs continue; billing, emails and notifications continue; backups continue.

**What stops:** all fixes, all deploys, incident response, restores, and any request needing production data access — including a subject-access or erasure request that fails automatically.

**Realistic unattended survival: weeks, not days, and not months.** The first thing to fail would be an expiring credential or a third-party change, not the platform itself.

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

## 3. The single point of failure that matters most

**If nobody can log into the Supabase organisation, nothing else in this document is actionable** — Vault is inside it, and Vault holds the runner SSH key and the service credentials.

**ACTION, and the highest-value item in this document:** ensure a second person (Lewis, as CEO and co-founder) holds organisation-owner access to Supabase, GitHub, Apple, Google Play, Stripe and the domain registrar, and that account recovery does not depend solely on Dean's devices or personal email. **This is a £0, one-hour task that removes the sharpest edge of the risk and is not yet done.** It does not require Lewis to be technical; it requires him to be able to grant access to someone who is.

## 4. Where an incoming engineer starts

1. **Read `VYVEBrain`** — `brain/master.md` for architecture and the §23 hard rules, `brain/changelog.md` for what happened and why, `tasks/backlog.md` for what was next. This is unusually complete and is the genuine mitigation here.
2. **`brain/schema-snapshot.md`** for the database shape.
3. **`brain/security_questionnaire.md`** for the security posture and its stated gaps.
4. **`playbooks/`** for operational procedures.
5. Deployment: member app is static hosting from `vyve-site` plus OTA bundles; server logic is Supabase Edge Functions; there is no build server and no container orchestration to learn.

## 5. Contingency statement for vendor management

VYVE is a small supplier and does not claim otherwise. Key-person risk is real, is documented rather than denied, and is mitigated by: comprehensive written architecture and decision history maintained continuously rather than retrospectively; a platform built on managed services that continue operating unattended; no bespoke infrastructure requiring specialist knowledge; and — once §3 is actioned — a second director able to grant access to a replacement engineer. Restoring active development would take a competent engineer days rather than months, because the system is documented and conventional.

## 6. Review

Reviewed at each enterprise contract signature and at least annually. Any new system added to the estate is added to §2 in the same session it is introduced.
