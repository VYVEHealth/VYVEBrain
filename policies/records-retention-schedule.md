# Records Retention Schedule — VYVE Health CIC

**Status:** DRAFT · Drafted 9 September 2026 (PM-1139) · Owner: Dean (technical implementation), Lewis (legal-basis confirmation)
**Closes:** scorecard C5 · ICO registration 00013608608 · Feeds the DPA schedule and every enterprise DPO questionnaire

> Every enterprise DPA schedule asks for this document. It must describe what we actually do, so where our practice is "retained indefinitely" it says so rather than inventing a period we do not enforce.

## 1. Principle

Personal data is retained only as long as necessary for the purpose it was collected for, or as long as a legal obligation requires. Where a period below is marked **NOT YET ENFORCED**, the retention rule is policy but no automated deletion implements it — that gap is stated rather than papered over, and closing it is tracked.

## 2. Schedule

| Category | Examples | Retention | Basis | Enforced? |
|---|---|---|---|---|
| **Member account and identity** | Name, email, DOB, auth credentials | Life of account + 30 days | Contract | Erasure pipeline is live and programmatic |
| **Health and wellbeing data** (special category) | Check-ins, wellbeing scores, mental-fitness data, journal entries, health-app samples | Life of account + 30 days | Explicit consent (Art. 9(2)(a)) | Live via the erasure pipeline |
| **Activity and engagement** | Workouts, cardio, habits, sessions, achievements | Life of account + 30 days | Contract | Live |
| **AI interaction history** | Prompts, responses, token counts | Life of account + 30 days | Consent / legitimate interest | Live |
| **Crisis and safeguarding records** | Disclosure alerts, escalation records | **Retain — see §3** | Legal obligation / vital interests | Deliberately excluded from erasure |
| **Payment records** | Stripe events, subscription status, invoices | **7 years** from transaction | Legal obligation (UK tax) | Deliberately excluded from erasure |
| **Admin audit log** | Staff actions on member records | **7 years** | Legal obligation / accountability | Deliberately excluded from erasure |
| **Subject-rights requests** | Erasure and export request records | **3 years** from completion | Accountability (Art. 5(2)) | Deliberately excluded |
| **Partner applications — unsuccessful** | Declined or abandoned drafts | 30 days (abandoned, automated); **declined: NOT YET ENFORCED** | Legitimate interest | Abandoned purge is on cron; declined has no policy — **open Dean/Lewis decision** |
| **Partner records — live** | Contracts, agreements, payouts | Life of relationship + 7 years | Contract / legal obligation | Manual |
| **B2B prospect data** | CRM contacts, pipeline | 3 years from last contact | Legitimate interest | **NOT YET ENFORCED** — CRM has no retention rule |
| **Email engagement** | Transactional and re-engagement records | Life of account + 30 days | Contract | Live |
| **Product analytics** | Pseudonymous usage events, session replays | 12 months (provider default — **verify**) | Legitimate interest | Provider-side |
| **Operational telemetry** | Watchdog alerts, job runs, rate limits | 90 days | Legitimate interest | Partially — some tables have no ageing |
| **Application logs** | Platform and function logs | Provider retention (7 days at current plan) | Legitimate interest | Provider-side |
| **Employer aggregate metrics** | Weekly employer figures | Life of contract + 12 months | Contract | Manual |

## 3. Deliberate exclusions from erasure, and why

A right-to-erasure request does **not** delete: payment records (UK tax law), the admin audit log (accountability), erasure-request records themselves (proving we honoured it), or crisis and safeguarding records. The last is the one to be able to defend in conversation: where a disclosure indicated risk to life, retention rests on vital interests and safeguarding obligation rather than convenience, and the records are minimal and access-restricted. This position is stated to members in the privacy policy — **Lewis to confirm the current wording covers it.**

## 4. Known gaps at drafting

1. Declined partner drafts have no retention rule and sit indefinitely — Dean/Lewis decision, previously raised.
2. CRM prospect data has no enforced retention.
3. Some operational telemetry tables have no automated ageing.
4. Analytics provider retention period stated from documentation, not verified in the account.
5. Three tables (`bookings`, `booking_events`, `coach_leads`) are absent from the erasure catalogue — previously raised, still open.

**None of these involve special-category member data, which is the category a reviewer probes first.** They are stated here so the document is honest, and each is small.
