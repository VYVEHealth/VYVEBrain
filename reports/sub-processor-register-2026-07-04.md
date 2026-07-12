# VYVE Health CIC — Sub-Processor Register

**Version:** 1.0 draft · 4 July 2026 · Prepared for the DPA schedule (risk-register finding H)
**Controller:** VYVE Health CIC (ICO 00013608608) · **Contact:** team@vyvehealth.co.uk
**Owner:** Lewis Vines (DPA execution) · **Technical maintainer:** Dean Brown

This register lists every third party that processes personal data on VYVE's behalf, what they see, where it is processed, and the lawful transfer mechanism. It is written to drop directly into an enterprise DPA as the sub-processor schedule. Items marked **ACTION** need closing before the schedule is signed.

---

## 1. Core sub-processors (process member personal data)

| # | Processor | Service | Personal data processed | Special category? | Hosting region | Transfer mechanism | DPA status |
|---|-----------|---------|------------------------|-------------------|----------------|--------------------|------------|
| 1 | **Supabase Inc** (on AWS) | Primary datastore, authentication, edge compute, file storage | All member records: identity (name, email, DOB, phone), auth credentials, activity/engagement logs, health and wellbeing data, AI interaction history | **Yes** — wellbeing scores, mental-health check-ins, HAVEN conversations, health questionnaire answers | **EU (AWS eu-central-1, Frankfurt)** — verified live 12 Jul 2026 via management API (register v1 previously misstated Ireland) | Primary data: none required (EU processing). Supabase operational layer (support access, service logs, telemetry) can touch US/Singapore entities — covered by DPA-incorporated SCCs (Module 2) + Supabase TIA on file (their declaration, not ours to sign) | Supabase DPA available via dashboard — **ACTION: Lewis to countersign and file**; AWS is Supabase's listed sub-processor |
| 2 | **Anthropic PBC** | AI coaching (personas, onboarding recommendations, check-in responses, workout/running plan generation) | Member first name, goals, questionnaire-derived context, wellbeing/stress/energy scores, life-context flags, check-in free text | **Yes** — mental-health-adjacent free text and sensitive life-context flags are sent in prompts | **US** | UK IDTA / EU SCCs via Anthropic's commercial terms; API data not used for model training under commercial terms | **ACTION: confirm signed commercial terms + DPA on file** — highest-sensitivity flow in the stack |
| 3 | **Stripe Payments Europe Ltd** | Subscription billing | Name, email, tokenised card details, subscription status, coupon usage | No | EU entity; global infrastructure | Stripe DPA incl. SCCs (standard, auto-incorporated in Stripe SSA) | In place via Stripe account terms; PCI-DSS Level 1 |
| 4 | **Brevo (Sendinblue SAS)** | Transactional and re-engagement email | Name, email, engagement metadata; welcome emails carry persona name, programme name, habit titles | Borderline — email content is health-adjacent but not clinical | **EU (France)** | None required (EU processing) | Brevo DPA available in account settings — **ACTION: Lewis to file a copy** |
| 5 | **PostHog Inc (EU Cloud)** | Product analytics and session replay | Pseudonymous usage events, device/browser data, session replays (10% sample, all inputs and email masked as of PM-695) | Mitigated — replays of health screens are possible but identifiers are masked | **EU (Frankfurt)** — project 138491 on EU cloud | None required (EU processing) | **ACTION: Lewis to confirm the PostHog EU DPA is signed** — open item from finding G |
| 6 | **Apple Inc (APNs)** | iOS push notification delivery | Device push tokens, notification payloads (session names, engagement nudges — no health content in payloads by policy) | No | US/global | Apple developer terms; APNs payloads are transient | Covered by Apple Developer Program License Agreement |
| 7 | **Google LLC (FCM)** | Android push notification delivery | Device push tokens, notification payloads (same payload policy as APNs) | No | US/global | Google Cloud DPA + SCCs (auto-incorporated in Firebase terms) | Covered by Firebase/Google Cloud terms |
| 8 | **Capawesome (Capawesome Cloud)** | Over-the-air app bundle delivery | Device/app identifiers at update check; no member profile data | No | EU (Germany) | None required (EU processing) | **ACTION: confirm terms/DPA on file** (app f9961f66) |

## 2. Supporting processors (limited or no member data)

| # | Processor | Service | Personal data processed | Notes |
|---|-----------|---------|------------------------|-------|
| 9 | **HubSpot (EU data centre)** | CRM for B2B pipeline | Business contact details of prospects/leads (not members) | EU-hosted hub (app-eu1); standard HubSpot DPA applies |
| 10 | **Google LLC (YouTube)** | Live session streaming and replay hosting | Instructor audio/video only; no member data enters the pipeline. Members viewing embedded players expose IP/device data to Google client-side | **ACTION: privacy policy should disclose YouTube embeds** (client-side collection, not a sub-processing relationship) |
| 11 | **Riverside.fm** | Instructor streaming studio | Instructor audio/video only | No member data |
| 12 | **GitHub (Microsoft)** | Source code hosting | None by policy — code and config only; secrets live in Supabase Vault; no member data in repos | Confirmed by PM-688 secret-scan discipline |
| 13 | **Make.com (Celonis)** | Social media automation (Lewis) | Social content and page analytics; no member data | — |
| 14 | **Open Food Facts** | Food barcode lookup (via off-proxy EF) | Barcode/search terms only; no identifiers forwarded | Proxy strips member context |

## 3. Email hosting — flagged risk

**Current state:** team@vyvehealth.co.uk runs on consumer-grade hosting (personal Google account / GoDaddy Exchange — finding U). This inbox receives **crisis alerts and manual-onboard alerts containing member email addresses and, for crisis flags, disclosure context** — special-category content in a mailbox outside a managed tenant with no BAA/DPA posture.

**Register treatment:** listed here honestly rather than hidden. **ACTION (finding U, Tier 3 but DPA-relevant):** migrate to a managed Google Workspace or M365 tenant before first enterprise contract; until then, this is the weakest link in the processing chain and should be acknowledged in the DPIA rather than the DPA schedule.

## 4. What VYVE can truthfully state in a questionnaire

- All primary member data, including all special-category health data, is stored and processed in the EU (Frankfurt, Germany), with RLS enforced on every member-scoped table. Supabase’s own operational access (support, service logs) is covered by the SCCs incorporated in their DPA plus their published TIA, both on file.
- The only special-category data leaving the EU goes to Anthropic (US) for AI coaching, under commercial terms that exclude training use; transfer mechanism is IDTA/SCCs. This is the single flow to scrutinise, and we say so proactively.
- Session replay is sampled at 10% with all inputs and email identifiers masked; analytics hosting is EU.
- Payment card data never touches VYVE infrastructure (Stripe-tokenised).
- No member data is stored in source control; secrets are vaulted.

## 5. Open actions before DPA signature

1. **Lewis:** countersign/file Supabase DPA, Brevo DPA, PostHog EU DPA (finding G carry-over), Capawesome terms.
2. **Lewis:** confirm Anthropic commercial terms + DPA on file — this is the line an enterprise DPO will ask about first.
3. **Lewis:** add YouTube-embed disclosure to the privacy policy.
4. **Dean + Lewis:** email tenant migration (finding U) — schedule pre-contract.
5. **Both:** re-review this register whenever a new processor is added; adding one is a DPA notification event under most enterprise schedules (typically 30 days' notice).
