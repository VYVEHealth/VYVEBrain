# Support Model — VYVE Health CIC

**Status:** DRAFT for Lewis's commercial sign-off · Drafted 9 September 2026 (PM-1139) · Owner: Lewis
**Closes:** scorecard D5

> **The response times below are a contractual commitment. Lewis confirms them.** They are drafted deliberately conservatively, because the honest constraint is that VYVE currently has one part-time technical person and one full-time commercial one.

## 1. Channels

| Channel | Audience | Availability |
|---|---|---|
| team@vyvehealth.co.uk | Members and employer contacts | Monitored working days |
| In-app help and complaints flow | Members | Routed to the same inbox, tracked in `member_complaints` |
| Named contact (enterprise) | Employer administrators | Assigned at contract signature |

**Working hours:** 09:00–17:30 UK time, Monday to Friday, excluding English public holidays. We do not offer 24/7 support and should not imply we do.

> **Dependency:** the support inbox currently runs on consumer-grade email hosting (scorecard C6), which also receives crisis alerts containing special-category data. That must be migrated to a managed tenant before this document is issued to an enterprise customer, or the support model documents a data-protection weakness.

## 2. Severity definitions and response targets — **LEWIS CONFIRMS**

| Severity | Definition | Response | Target resolution |
|---|---|---|---|
| **P1 — Critical** | Platform unavailable to all users, data-loss event, or an active security incident | 4 working hours | Continuous effort until resolved or worked around |
| **P2 — High** | Major feature unusable for many users, no workaround | 1 working day | 5 working days |
| **P3 — Medium** | Feature impaired, workaround exists | 2 working days | Next release cycle |
| **P4 — Low** | Cosmetic issue, question, or feature request | 5 working days | Backlog, no commitment |

**Safeguarding and crisis escalation is not a support severity and does not follow this table.** Disclosure alerts route immediately to the internal alerting path regardless of hours. That path is documented separately and its limitations (single-person, consumer mailbox) are stated in the clinical governance position.

Response means a human acknowledgement with an assessment, not an automated receipt.

## 3. Escalation

1. **First line** — team@vyvehealth.co.uk
2. **Second line** — Lewis Vines, CEO (commercial, service, account issues)
3. **Third line** — Dean Brown, CTO (technical, security, data)

For enterprise customers, second and third line direct contact details are provided at signature. There is no out-of-hours rota; a P1 raised outside working hours is picked up at the start of the next working day unless it is also a security incident, which follows the incident response procedure.

## 4. What we are honest about

We are a small supplier. Our advantages are that an enterprise customer's issue reaches the CTO directly rather than a ticket queue, and that fixes ship in hours rather than quarters. Our limitation is that we have no 24/7 coverage and no support team, and the key-person risk that follows from that is documented in the business continuity position rather than hidden. Stating this is not a weakness in a review; discovering it later is.
