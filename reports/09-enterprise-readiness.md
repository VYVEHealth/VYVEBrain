# VYVE Health - Enterprise Readiness Report
> Report 9 of 11 | 14 April 2026 | 26 items, 12 security Q&As, 6 pilot metrics
> Target: Sage (HubSpot deal 495586118853)

## Executive Summary
Not yet enterprise-ready. 8 ready, 7 partial, 11 not ready. Top blockers: per-employer auth (6-8 hrs), GDPR tools (9-11 hrs), volume tiers (Lewis decision). Timeline: Sage demo possible by late May with 35-45 hrs development.

## Readiness Checklist
### Technical (7 items)
- READY: Member portal, employer dashboard, health disclaimer, iOS+Android submitted
- NOT READY: Per-employer auth (shared API key), enterprise onboarding (no batch flow), push notifications (broken)
- UNTESTED: 200 concurrent users

### Legal & Compliance (6 items)
- READY: DPA template, privacy policy
- NOT READY: Data export (Art. 20), deletion (Art. 17), processor register
- REVIEW: Article 9 consent wording

### Commercial (5 items)
- READY: £10/user/month confirmed
- NOT READY: Volume tiers, Stripe B2B config, pilot success criteria, contract template

### Sales & Demo (6 items)
- READY: Sales intelligence infrastructure
- NOT READY: Security questionnaire, SLA definition, Brevo logo
- NEEDS UPDATE: Presentation deck
- PARTIAL: Demo environment (Lewis inactive)

### Operational (4 items)
- NOT READY: System health monitoring, Lewis/Kelly re-engagement
- CRITICAL: Facebook Make connection expires 22 May

## Security Questionnaire (12 pre-completed answers)
1. Data hosted: Supabase Pro, West EU (Ireland)
2. Encrypted at rest: AES-256 via AWS
3. Encrypted in transit: TLS 1.2+
4. Access control: RLS on 61 tables, JWT auth, service-role server-side only
5. Authentication: Supabase Auth, individual credentials, no shared accounts
6. Backup: Daily + PITR (7-day retention), WAL archiving active
7. Uptime: Target 99.5% (Supabase 99.9% SLA)
8. Breach procedure: 72-hour ICO notification documented
9. Cross-border: Anthropic (US) via SCCs. PostHog EU endpoint
10. Certifications: ICO registered, DPIA complete, DPA ready
11. Data subject rights: Export and deletion being implemented
12. Employer dashboard: API key auth, aggregate only, no PII

## Pilot Success Criteria (proposed)
| Metric | Target |
|--------|--------|
| Activation Rate | >60% |
| Weekly Engagement | >40% |
| Check-in Completion | >25% |
| Feature Breadth | >3 features/member |
| NPS | >7 |
| Dashboard Usage | Weekly login |

## Timeline (6 weeks to Sage demo)
- Week 1: Fix push crons, indexes, health-monitor, Brevo logo
- Week 2: Per-employer auth, data export, volume tiers
- Week 3: Delete-member EF, security questionnaire, SLA
- Week 4: Pilot criteria, contract, enterprise onboarding, load test
- Week 5-6: Demo + negotiate + begin pilot
