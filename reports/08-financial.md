# VYVE Health - Financial & Unit Economics Report
> Report 8 of 11 | 14 April 2026 | Pre-revenue, £0 MRR
> Based on: ai_interactions (19), engagement_emails (27 AI), infrastructure costs

## Executive Summary
Excellent unit economics. Variable cost per member: ~£0.45/month (AI + infra). Contribution margin: 97.5% at B2C (£20), 95.5% at B2B (£10). Cost structure almost entirely fixed until ~500 members. Break-even: 4-5 paying members.

## Current Monthly Costs (~£81)
| Item | Monthly | Notes |
|------|---------|-------|
| Supabase Pro | ~£20 | DB + auth + storage + EFs |
| Anthropic API | ~£40 | Spend limit £50. Actual lower |
| Domain | ~£1.50 | GoDaddy |
| ICO Registration | ~£4.33 | Annual £52 |
| Make (Lewis) | ~£15 | Social automation |
| Brevo | £0 | Free tier (300/day) |
| GitHub, PostHog, HubSpot, Cloudflare | £0 | All free tiers |

## AI Cost Per Member
| Feature | Cost/Call | Frequency | Monthly/Member |
|---------|----------|-----------|----------------|
| Onboarding (6 calls) | £0.22 total | Once | ~£0.07 (amortised) |
| Weekly Check-in | £0.008 | Weekly | ~£0.03 |
| Re-engagement | £0.004 | Per email | ~£0.01 |
| Running Plan | £0.01 | Cached | ~£0.005 |
| Monthly Check-in | £0.015 | Monthly | £0.015 |
| **Total** | | | **~£0.13/member/month** |

## Revenue Scenarios
| Scenario | Members | MRR | Profit | Margin |
|----------|---------|-----|--------|--------|
| 100 B2C | 100 @ £20 | £2,000 | ~£1,930 | 96.5% |
| Sage 200 | 200 @ £10 | £2,000 | ~£1,850 | 92.5% |
| Mixed (Sage + 50 B2C) | 250 | £3,000 | ~£2,840 | 94.7% |
| Target (Dean FT) | ~300+ | £6,000 | ~£5,700 | 95% |
| Series A (£1.5M ARR) | ~6,250 | £125,000 | ~£119,000 | 95.2% |

## Scaling Cost Thresholds
- **80 members:** Brevo upgrade needed (~£19/month)
- **100 members:** Anthropic spend monitoring needed
- **200 members:** Supabase connection pooling
- **500 members:** Pre-computed dashboard stats (dev time)
- **1,000+:** Architecture review, data retention

## Priority Actions
1. Add Anthropic token tracking (1-2 hrs)
2. Upgrade Brevo before Sage (Lewis - £19/month)
3. Build Stripe subscription webhook (3-4 hrs)
4. Define B2B volume tiers in Stripe (Lewis + 1 hr)
