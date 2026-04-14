# VYVE Health - Master Action Plan
> Report 11 of 11 | 14 April 2026 | 34 actions, 82-114 hrs total
> Synthesised from all 10 reports. Deduplicated, prioritised, sequenced.

## Phase 1: Do NOW (5-7 hrs)
| ID | Action | Source | Effort |
|----|--------|--------|--------|
| A01 | Fix push notification crons | Report 3 | 30 mins |
| A02 | Add platform_alerts RLS policy | Reports 1,3 | 15 mins |
| A03 | Back up all 20 core EFs to VYVEBrain | Report 2 | 1 hr |
| A04 | Create encrypted secrets backup | Report 2 | 30 mins |
| A05 | XSS sanitisation on AI innerHTML | Report 1 | 1 hr |
| A06 | Fix 4 active JS bugs | Reports 3,10 | 2-3 hrs |
| A07 | Trigger Calum's workout plan | Report 6 | 15 mins |

## Phase 2: This Week (12-17 hrs)
| ID | Action | Source | Effort |
|----|--------|--------|--------|
| A08 | Build health-monitor EF | Report 3 | 4-5 hrs |
| A09 | Apply missing indexes migration | Report 4 | 10 mins |
| A10 | Add platform_alerts to daily-report | Report 3 | 1 hr |
| A11 | Build global 401 interceptor | Reports 1,3 | 3 hrs |
| A12 | Hash PostHog emails + privacy policy | Reports 1,5 | 1 hr |
| A13 | CSP meta tags on all pages | Report 1 | 2-3 hrs |
| A14 | Document DNS records + domain renewal | Report 2 | 30 mins |
| A15 | Workout plan status tracking | Report 6 | 1-2 hrs |

## Phase 3: Before Sage (35-45 hrs)
| ID | Action | Source | Effort |
|----|--------|--------|--------|
| A16 | Per-employer dashboard auth | Reports 1,9 | 6-8 hrs |
| A17 | GDPR data export EF | Reports 5,9 | 4-5 hrs |
| A18 | GDPR delete-member EF | Reports 5,9 | 5-6 hrs |
| A19 | Security questionnaire template | Report 9 | 3-4 hrs |
| A20 | Data processor register | Reports 5,9 | 2-3 hrs |
| A21 | Stripe webhook | Reports 6,8 | 3-4 hrs |
| A22 | First-activity nudge (24hr) | Reports 6,7 | 2-3 hrs |
| A23 | SLA definition | Report 9 | 1-2 hrs |
| A24 | Anthropic token tracking | Report 8 | 1-2 hrs |

## Lewis Actions (non-technical)
| ID | Action | Source |
|----|--------|--------|
| L01 | Re-engage with platform daily | Reports 7,9 |
| L02 | Remove Brevo logo ($12 or Starter) | Reports 8,9 |
| L03 | Define B2B volume tiers | Reports 8,9 |
| L04 | Fix Make publisher + renew Facebook (EXPIRES 22 MAY) | Reports 3,9 |
| L05 | Legal review Article 9 consent | Report 5 |
| L06 | Draft pilot success criteria | Report 9 |
| L07 | Update presentation deck | Report 9 |
| L08 | Document subscription costs | Report 8 |

## Phase 5: Post-Launch (30-45 hrs)
| ID | Action | Source | Effort |
|----|--------|--------|--------|
| A25 | Automated weekly EF backup | Report 2 | 2-3 hrs |
| A26 | Weekly pg_dump to external storage | Report 2 | 3-4 hrs |
| A27 | Brevo open/click webhooks | Report 7 | 2-3 hrs |
| A28 | PostHog funnel events | Report 6 | 2-3 hrs |
| A29 | Pre-computed dashboard stats | Report 4 | 6-8 hrs |
| A30 | Consolidate 16 live/replay pages | Report 10 | 4-5 hrs |
| A31 | EF integration test suite | Report 10 | 6-8 hrs |
| A32 | NPS in monthly check-in | Report 7 | 2 hrs |
| A33 | Enterprise onboarding flow | Report 9 | 8-10 hrs |
| A34 | Revenue dashboard in CC | Report 8 | 4-5 hrs |

## Effort Summary
| Phase | Hours | Timeline |
|-------|-------|----------|
| NOW | 5-7 | 1 session |
| This Week | 12-17 | Week 1 |
| Before Sage | 35-45 | Weeks 2-5 |
| Lewis Actions | - | Ongoing |
| Post-Launch | 30-45 | Months 2-3 |
| **Total** | **82-114** | **~8 weeks at part-time** |

---
*All actions grounded in live database queries, Edge Function code review, and platform error data.*
*Produced by CTO session (Claude) - 14 April 2026*
