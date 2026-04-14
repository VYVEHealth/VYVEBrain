# VYVE Health - Onboarding Pipeline Report
> Report 6 of 11 | 14 April 2026 | 14 members profiled, 10-stage funnel, 8 plan timings
> Based on: members, workout_plan_cache, member_habits, ai_decisions, daily_habits, workouts

## Executive Summary
8 new members in 7 days. 100% EF success rate. BUT: 45% activation failure (5 of 11 never logged activity). 1 member (Calum) has no workout plan. Plan generation times vary from 4 seconds to NEVER.

## Active Issues
1. **Calum Denham has NO workout plan** - background generation failed silently. Actively engaging without it
2. **45% of members never activate** after onboarding. Owen Barrett and Alan Bird: 4-5 days, zero activity
3. **Workout plan timing varies wildly** - 4 seconds to 24 hours to NEVER

## Member Onboarding Status
| Member | Persona | Method | Plan | Day-1 Active | Status |
|--------|---------|--------|------|-------------|--------|
| Paige Coult | SPARK | AI | Yes (80 min) | Yes (5 habits) | Active |
| Calum Denham | HAVEN | Hard rule | **MISSING** | Yes (habits+workout) | Active (no plan) |
| Callum Budzinski | SPARK | AI | Yes | Yes (legacy) | Quiet (9d) |
| Stuart Watts | NOVA | Hard rule | Yes (117 min) | Yes (1 workout) | Quiet (3d) |
| Alan Bird | SPARK | Corrected | Yes (1 min) | No | Never active |
| Owen Barrett | SPARK | AI | Yes (24 hrs!) | No | Never active |
| Kelly Bestford | SPARK | AI | Yes (1 min) | Yes (legacy) | Quiet (11d) |
| Lewis Vines | NOVA | AI | Yes (shared) | Yes (legacy) | Quiet (10d) |

## Onboarding Funnel
| Stage | Count | Tracked? |
|-------|-------|----------|
| Stripe Payment | Unknown | NO - no webhook |
| welcome.html Load | Unknown | NO - no PostHog event |
| Questionnaire Submit | 11 | YES |
| EF Success | 11 (100%) | YES |
| Auth Account Created | 15 | YES |
| Welcome Email Sent | Unknown | NO - not tracked per member |
| Workout Plan Generated | 10/11 (Calum missing) | YES |
| First Portal Login | Unknown | NO - no first_login_at column |
| First Activity | 5/11 (45%) | YES |
| First Week Active | 4/11 (36%) | YES |

## Workout Plan Generation Timing
| Member | Time | Status |
|--------|------|--------|
| DE N (test) | 4 seconds | Fast |
| Alan Bird | 1 minute | Fast |
| Kelly Bestford | 1 minute | Fast |
| dean brown (test) | 63 seconds | Normal |
| Paige Coult | 80 minutes | Slow |
| Stuart Watts | 117 minutes | Slow |
| Owen Barrett | ~24 hours | Critical |
| Calum Denham | NEVER | Failed |

## Priority Actions
1. **NOW:** Trigger Calum's workout plan (15 mins)
2. **NOW:** Add workout_plan_cache status tracking (1-2 hrs)
3. **This week:** Build first-activity nudge at 24 hours (2-3 hrs)
4. **This week:** Stripe webhook for payment reconciliation (3-4 hrs)
5. **This week:** PostHog funnel events on welcome.html (2-3 hrs)
