# VYVE Health - GDPR & Compliance Report
> Report 5 of 11 | 14 April 2026 | 10 data categories, 8 processors, 7 rights, 17 compliance items
> Based on: information_schema.columns PII scan, RLS policies, EF code review

## Key Finding
**4 of 10 data categories are GDPR Article 9 special category data.** life_context captures 'Bereavement' and 'Struggling with mental health'. This data is sent to Anthropic (US) for AI processing.

## Data Categories (PII Map)
| Category | Classification | Tables | Risk |
|----------|---------------|--------|------|
| Identity (email, name, DOB, phone) | Personal Data | members | Medium |
| Health & Wellbeing Scores | **Special Category (Art. 9)** | members, wellbeing_checkins, monthly_checkins | **High** |
| Physical Measurements (weight, height) | **Special Category (Art. 9)** | members, weight_logs, exercise_logs | **High** |
| Sleep Data | **Special Category (Art. 9)** | members | **High** |
| Injury & Medical | **Special Category (Art. 9)** | members | **High** |
| Fitness & Activity | Personal Data | daily_habits, workouts, cardio, etc. | Medium |
| Nutrition | Personal Data | nutrition_logs, nutrition_my_foods | Medium |
| AI Interaction | Personal Data | ai_interactions, ai_decisions | Medium |
| Communication | Personal Data | engagement_emails, session_chat | Low |
| Device/Technical | Personal Data | platform_alerts | Low |

## Third-Party Processors
| Processor | Location | Data | Risk |
|-----------|----------|------|------|
| Supabase | EU (Ireland) | ALL member data | Low |
| **Anthropic** | **US** | **Full profiles incl. health data** | **High** |
| Brevo | EU (France) | Email, name | Low |
| Stripe | US/EU (Ireland) | Payment data | Low |
| PostHog | US (EU endpoint) | Email (unhashed - issue) | Medium |
| GitHub | US | Source code only | Low |
| HubSpot | US | Prospect data | Low |
| Make | EU (Czech Republic) | Social content only | Low |

## GDPR Rights Readiness
| Right | Status |
|-------|--------|
| Access (Art. 15) | NOT READY - no export tool |
| Rectification (Art. 16) | PARTIAL - some fields editable |
| Erasure (Art. 17) | NOT READY - no deletion mechanism |
| Portability (Art. 20) | NOT READY - no export |
| Restriction (Art. 18) | NOT READY - no restrict flag |
| Object (Art. 21) | PARTIAL - email opt-out exists |
| Automated Decisions (Art. 22) | PARTIAL - persona changeable but not explained |

## Compliance Status
- COMPLETE: ICO registration, privacy policy, terms, DPA template, DPIA, consent gate, breach procedure, data retention policy
- NOT DONE: Data processor register, data flow diagram, SAR process, data export, automated deletion, PostHog PII hash, PostHog in privacy policy

## Priority Actions
1. **This week:** Hash PostHog emails + update privacy policy (1 hr)
2. **This week:** Legal review of Article 9 consent wording (Lewis)
3. **Before Sage:** Build data-export EF (4-5 hrs) + delete-member EF (5-6 hrs)
4. **Before Sage:** Create data processor register (3-4 hrs)
