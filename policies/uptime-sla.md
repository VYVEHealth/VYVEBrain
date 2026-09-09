# Uptime Service Level Agreement — VYVE Health CIC

**Status:** DRAFT for Lewis's commercial sign-off · Drafted 9 September 2026 (PM-1139) · Owner: Lewis (commitment), Dean (measurement)
**Closes:** scorecard D4 · Applies to: B2B/enterprise agreements. B2C members are covered by the Terms of Service, not this document.

> **Lewis decides two numbers in this document: the uptime target and the service-credit schedule.** Everything else is drafting. Do not issue to a prospect until both are confirmed — a service credit is a contractual liability, not a marketing figure.

## 1. Commitment

VYVE commits to **99.5% monthly availability** of the member application and employer dashboard.

**Why 99.5% and not 99.9%.** 99.9% permits 43 minutes of downtime a month; 99.5% permits 3 hours 39 minutes. We can neither evidence 99.9% today (we have no historical uptime measurement to point at) nor absorb the service credits that missing it would trigger. Our infrastructure provider's own commitment does not exceed what we would be promising, which would leave us liable for their outages with no recourse. A commitment we can meet is worth more in a review than a better-sounding one we cannot.

**This figure should rise once measurement exists.** It is a floor set from a position of no data, not a ceiling on the platform's real behaviour.

## 2. Scope

**In scope:** the member application (iOS, Android, web portal), the employer dashboard, authentication, and the APIs behind them.

**Out of scope, and stated plainly rather than buried:**
- Third-party dependencies outside our control — the database and authentication provider, app stores, email delivery, payment processing, live-streaming platforms. Their outages are excluded, and we will say which provider failed rather than absorb it silently.
- AI coaching features, which depend on an external model provider. These degrade gracefully: the app remains usable without them.
- Live streamed sessions, which depend on third-party streaming infrastructure.
- Scheduled maintenance (see §4).
- Beta or explicitly labelled preview features.

## 3. Measurement

**As at drafting we do not have external uptime monitoring in place, and this document should not be issued until we do.** It is a small piece of work and it must precede any signature — committing to a number nobody measures is worse than committing to nothing.

Once in place: availability measured monthly as successful responses over total requests to a health endpoint, sampled externally at no less than one-minute intervals, calculated per calendar month in UTC, reported to the customer on request.

## 4. Maintenance

Planned maintenance is excluded from the calculation where we give **5 working days' notice** and schedule it outside 07:00–20:00 UK time. Emergency maintenance to address a security issue may occur without notice; we will notify affected customers within 24 hours with a description of what was done and why.

## 5. Service credits — **LEWIS DECISION**

Recommended schedule, credited against the following month's fees on customer request within 30 days:

| Monthly availability | Credit |
|---|---|
| 99.5% or above | None |
| 99.0% – 99.49% | 5% |
| 95.0% – 98.99% | 10% |
| Below 95.0% | 25% |

Credits are capped at the monthly fee for the affected month and are the sole remedy for availability failures. **Lewis: confirm you are comfortable with these percentages before this goes to anyone.** A common alternative is to offer no credits at pilot stage and introduce them at contract stage; that is a legitimate position and easier to hold as a small supplier.

## 6. What we say when asked "have you met this?"

Honestly: we have no historical uptime record because external monitoring is not yet in place, and this commitment is forward-looking from the date of the agreement. An enterprise reviewer will accept that from a company our size far more readily than a number we cannot substantiate.
