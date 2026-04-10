# VYVE Health — Master Brain Document

> This document gives any AI everything it needs to understand and operate on the VYVE Health platform.
> Last verified: 10 April 2026 against live Supabase project ixjfklpckgxrwjlfsaaz.

---

## 1. What Is VYVE Health?

VYVE Health CIC is a UK-based Community Interest Company building a proactive wellbeing platform for individuals and employers. Three pillars: Physical, Mental, Social health. AI coaching personas personalise the member experience.

**Stage:** Pre-revenue, MVP, validation.
**Members:** 7 active (verified 10 April 2026). New members auto-created on onboarding.
**Legal:** ICO registered (00013608608). CIC = 6-8 point advantage in public sector procurement.

### Team
| Role | Person | Email | Scope |
|------|--------|-------|-------|
| CEO / Founder | Lewis Vines | lewisvines@hotmail.com | Commercial, sales, content, AI ops |
| CTO / Co-Founder | Dean Brown | deanonbrown@hotmail.com | Technical, part-time until 6K/month revenue |

Business email: team@vyvehealth.co.uk (never use personal emails for business).

---

## 2. Product Overview

### What Members Get
- 5 AI coaching personas (NOVA, RIVER, SPARK, SAGE, HAVEN)
- 8-week personalised workout programmes
- Daily habit tracking with monthly themes
- Weekly and monthly wellbeing check-ins with AI reports
- AI-generated running plans
- Nutrition logging (TDEE, macros, food diary)
- Live sessions with real-time chat
- Certificate system with charity donation mechanic
- Leaderboards and engagement scoring

### Pricing
- B2C: 20/month individual
- B2B: 10/user/month (advertised at 20, discount applied). Volume tiers TBD for 200+ seats.
- Stripe: buy.stripe.com/00wfZicla1Em0NnaIB93y00. Coupons: VYVE15, VYVE10.

### Priority #1
Capacitor wrap for iOS App Store + Android Play Store. PWA ready. Blockers: health disclaimer (Lewis) + push notification permission.

---

## 3. Architecture

### Hosting
| Component | Where |
|-----------|-------|
| Member portal (PWA) | GitHub Pages -> online.vyvehealth.co.uk — repo: VYVEHealth/vyve-site (PRIVATE) |
| Marketing site | GitHub Pages -> www.vyvehealth.co.uk — repo: VYVEHealth/Test-Site-Finalv3 |
| Backend / DB | Supabase Pro (West EU/Ireland) — project ixjfklpckgxrwjlfsaaz |
| AI | Anthropic API (Claude Sonnet 4 + Haiku 4.5) — server-side Edge Functions ONLY |
| Email | Brevo (free tier, 300/day) |
| Payments | Stripe |
| Analytics | PostHog (EU endpoint, identity wired to Supabase Auth) |
| CRM | HubSpot (Hub ID: 148106724) |
| Automation | Make (Lewis only — social media) |

### Authentication
Supabase Auth with auth.js v2.2. All portal pages gated. Auth0 is FULLY RETIRED.

### Repo Structure (vyve-site)
Single-file HTML pages. Self-contained inline CSS/JS. No build process, no bundler.

Key files: index.html (dashboard), habits.html, workouts.html, nutrition.html, log-food.html, wellbeing-checkin.html, monthly-checkin.html, sessions.html, running-plan.html, settings.html, certificates.html, engagement.html, leaderboard.html, login.html, set-password.html, strategy.html (password: vyve2026), sw.js, auth.js, theme.js, nav.js.

### Edge Functions (24 live, 6 stubs pending deletion)
| Function | Version | Purpose |
|----------|---------|---------|
| onboarding | v45 | Two-phase: fast return + background 8-week programme |
| member-dashboard | v25 | Full dashboard data, JWT-preferred auth |
| wellbeing-checkin | v22 | Weekly check-in + AI recommendations |
| monthly-checkin | v5 | Monthly 8-pillar check-in, Haiku model, AI report |
| log-activity | v8 | PWA activity logging |
| employer-dashboard | v20 | Aggregate data, API key auth, no PII |
| anthropic-proxy | v5 | AI proxy for running plans |
| send-email | v11 | Brevo transactional |
| re-engagement-scheduler | v11 | Cron 8:00 UTC |
| daily-report | v16 | Cron 8:05 UTC — includes full activity detail table |
| weekly-report | v7 | Weekly summary |
| monthly-report | v7 | Monthly summary |
| certificate-checker | v10 | Cron 9:00 UTC, HTML certs |
| certificate-serve | v8 | Serves certificate HTML |
| github-proxy | v11 | GET + PUT to vyve-site |
| github-proxy-marketing | v2 | Marketing site proxy |
| off-proxy | v9 | Open Food Facts API proxy |
| send-session-recap | v4 | Session recap emails |
| send-journey-recap | v4 | Journey recap emails |
| ops-brief | v2 | Ops brief generation |
| storage-cleanup | v2 | Storage cleanup |
| re-engagement-test-sender | v8 | Test emails |
| send-test-welcome | v2 | Test welcome emails |

---

## 4. Database (Supabase — 36 Tables)

All RLS enabled. Email = primary key across all member tables. Full schema in brain/schema-snapshot.md.

Core: members (8), daily_habits (42), workouts (54), cardio (19), session_views (20), replay_views (13), kahunas_checkins (14), weekly_scores (11), wellbeing_checkins (11), monthly_checkins (0), ai_interactions (7), activity_dedupe (494), session_chat (3)

Workout: workout_plans (244), workout_plan_cache (3), exercise_logs (94), exercise_swaps (3), exercise_notes (1), custom_workouts (3)

AI: personas (5), persona_switches (0), running_plan_cache (3), weekly_goals (5), knowledge_base (15)

Habit/Nutrition: habit_themes (5), habit_library (30), member_habits (4), nutrition_logs (3), nutrition_my_foods (0), nutrition_common_foods (125), weight_logs (3)

Other: service_catalogue (21), certificates (0), employer_members (0), engagement_emails (22), qa_submissions (3)

15 SQL Functions. Activity caps: habits 1/day, workouts/cardio/sessions 2/day, checkins 1/week. Over-cap -> activity_dedupe.

---

## 5. AI Personas

| Persona | Character |
|---------|-----------|
| NOVA | High-performance coach. Data-led. |
| RIVER | Mindful guide. Calm, empathetic. |
| SPARK | Motivational powerhouse. Energetic. |
| SAGE | Knowledge-first mentor. Evidence-based. |
| HAVEN | Mental health companion. NOT LIVE — needs professional review. |

NEVER assign NOVA or SPARK if serious life context in Section G.

---

## 6. Hard Rules (NEVER BREAK)

1. API keys NEVER in HTML or GitHub. Server-side EFs only. Stored as ANTHROPIC_API_KEY.
2. Auth0 is dead. Never reference it.
3. Kahunas/PAD are dead. Product is "VYVE Health app".
4. Never say "Corporate Wellness" as tagline.
5. sw.js cache must be bumped after every portal push. Pattern: vyve-cache-v2026-04-0[letter].
6. EF deploys require full index.ts.
7. Dual dark/light CSS blocks. theme.js before </head>.
8. Employer dashboard = aggregate only. No PII.
9. HAVEN must signpost professional help if crisis.
10. Password reset emails route to `set-password.html` — Supabase Site URL must stay as `https://online.vyvehealth.co.uk/set-password.html`.
11. GitHub writes via github-proxy EF PUT. MCP is READ-ONLY (403).
11. workouts.html uses MutationObserver on #app. Never revert to waitForAuth.
12. Business email: team@vyvehealth.co.uk.
13. Google Sheets retired for portal data. Business docs only.
14. Dean does not use Make. Lewis only.

---

## 7. Onboarding Flow

Stripe payment -> onboarding_v8.html (10 sections) -> onboarding EF v45
Phase 1 (fast): persona + habits + programme overview + DB writes + Brevo welcome email
Phase 2 (background via waitUntil): full 8-week workout JSON -> workout_plan_cache
-> Supabase Auth user created -> member logs in

---

## 8. Key URLs

| Reference | Value |
|-----------|-------|
| Supabase Project | ixjfklpckgxrwjlfsaaz |
| PostHog Key | phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl |
| HubSpot Hub ID | 148106724 |
| Sage Deal | 495586118853 |
| Strategy Dashboard | online.vyvehealth.co.uk/strategy.html (password: vyve2026) |
| Demo Reset | online.vyvehealth.co.uk/index.html?reset=checkin |
| github-proxy PUT | https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/github-proxy?path=filename.html |

---

## 9. What NOT to Do

- Do NOT create tables that already exist
- Do NOT reference Auth0, Kahunas, PAD, or Google Sheets for portal data
- Do NOT put API keys in HTML files
- Do NOT modify EFs without complete index.ts
- Do NOT forget to bump sw.js
- Do NOT create monthly_summaries, activity_patterns, charity_totals, audit_log, or milestone_messages tables — they were planned but never built
