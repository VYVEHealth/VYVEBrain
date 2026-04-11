# VYVE Health — Master Brain Document

> This document gives any AI everything it needs to understand and operate on the VYVE Health platform.
> Last verified: 11 April 2026 (full audit + collateral fixes applied) against live Supabase project ixjfklpckgxrwjlfsaaz.

---

## 1. What Is VYVE Health?

VYVE Health CIC is a UK-based Community Interest Company building a proactive wellbeing platform for individuals and employers. Three pillars: Physical, Mental, Social health. AI coaching personas personalise the member experience.

**Stage:** Pre-revenue, MVP, validation.
**Members:** 11 (verified 11 April 2026). New members auto-created on onboarding.
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
Capacitor wrap for iOS App Store + Android Play Store. PWA ready. Blocker: health disclaimer (Lewis sign-off needed).

### Web Push (VAPID) — Live
- `vapid.js` loaded on `index.html` — subscribes on bell tap (iOS requires user gesture), saves to `push_subscriptions` table
- `sw.js` — `push` event listener + `notificationclick` listener live
- `habit-reminder` v4 + `streak-reminder` v4 — full RFC 8291 AES-GCM encryption via Deno Web Crypto
- `send-test-push` v4 — test tool (Supabase Dashboard → Edge Functions → Test)
- `VAPID_PRIVATE_KEY` secret set in Supabase ✅
- VAPID public key: `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`
- **Rule:** Apple push requires RFC 8291 encryption. `esm.sh` imports fail in Supabase EFs — always use Deno Web Crypto only.
- **Rule:** iOS push only works from home screen installed PWA (Safari 16.4+)

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
Supabase Auth with auth.js v2.3. All portal pages gated. Auth0 is FULLY RETIRED.

### Repo Structure (vyve-site)
Single-file HTML pages. Self-contained inline CSS/JS. No build process, no bundler.

Key files: index.html (dashboard), habits.html, workouts.html, nutrition.html, log-food.html, wellbeing-checkin.html, monthly-checkin.html, sessions.html, running-plan.html, settings.html, certificates.html, engagement.html, leaderboard.html, login.html, set-password.html, strategy.html (password: vyve2026), sw.js, auth.js, theme.js, nav.js.

**nav.js injection heights (mobile ≤768px):**
- Mobile top header: `position:sticky; top:0; height:56px`
- Bottom nav: `position:fixed; bottom:0; z-index:9999; ~80px tall`
- Body gets `padding-bottom: calc(80px + env(safe-area-inset-bottom,0px)) !important`
- Any page-level sticky element must use `top:56px` on mobile, not `top:0`
- Modals must use `z-index:10001` minimum to render above the bottom nav

**sw.js cache version:** `vyve-cache-v2026-04-11i` (bump letter after every portal push)

**settings.html:** Cache-first load via `vyve_settings_cache` (localStorage, 10-min TTL). UI populates instantly from cache; Supabase refreshes in background. Both modals (coach, habits) use `z-index:10001`, `stopPropagation` on sheet, sticky CTA footer.

### Onboarding Form
`www.vyvehealth.co.uk/welcome` = `welcome.html` in `Test-Site-Finalv3` repo. This calls the onboarding Edge Function. NOT onboarding_v8.html (old name).

### Edge Functions (44 deployed — 20 core, 24 utilities/one-off)

#### Core Functions
| Function | Supabase Ver | Purpose | Auth |
|----------|-------------|---------|------|
| onboarding | v58 | Persona + habits + programme overview + 8-week workout (background) | CORS www.vyvehealth.co.uk |
| member-dashboard | v34 | Full dashboard data — JWT-only, no ?email= fallback | JWT required |
| wellbeing-checkin | v32 | Weekly check-in + AI | JWT |
| monthly-checkin | v12 | Monthly check-in | JWT |
| log-activity | v18 | PWA activity logging | JWT |
| employer-dashboard | v29 | Aggregate, API key auth, no PII | EMPLOYER_DASHBOARD_API_KEY |
| leaderboard | v7 | Leaderboard rankings — all members, current month | JWT |
| notifications | v7 | In-app notification feed + badge count | JWT |
| anthropic-proxy | v13 | Running plans | verify_jwt: true |
| send-email | v19 | Brevo transactional | service-role-key |
| re-engagement-scheduler | v19 | Cron 8:00 UTC | Cron/service-role |
| daily-report | v21 | Cron 8:05 UTC | Cron/service-role |
| certificate-checker | v17 | Cron 9:00 UTC | Cron/service-role |
| certificate-serve | v15 | Serve cert PDFs from storage | Public |
| github-proxy | v19 | GET + PUT to vyve-site | GITHUB_PROXY_SECRET |
| off-proxy | v16 | Open Food Facts API | JWT |
| generate-workout-plan | v9 | 8-week AI workout plan (called by onboarding) | service-role |
| habit-reminder | v8 | Push + in-app habit reminders (VAPID) | Cron/service-role |
| streak-reminder | v8 | Push + in-app streak alerts (VAPID) | Cron/service-role |
| check-cron | v18 | Verify cron schedule is running | Service-role |

#### Utility / One-Off Functions (24)
weekly-report, monthly-report, ops-brief, send-test-push, send-test-welcome, resend-welcome, send-session-recap, send-journey-recap, send-stuart-reset, re-engagement-test-sender, github-proxy-marketing, internal-dashboard, storage-cleanup, delete-housekeeping, thumbnail-audit, thumbnail-upload, thumbnail-batch-upload, generate-stuart-plan, trigger-owen-workout, trigger-callum-workout, create-ai-decisions-table, setup-ai-decisions, setup-member-units, run-monthly-checkins-migration, run-migration-monthly-checkins, monthly-checkin-test.

> **Backlog:** Delete ~24 dead/one-off utility functions (deletion script in audit doc).

---

## 4. Database (Supabase — 39 Tables)

All RLS enabled. Email = primary key across all member tables.

Core: members, daily_habits, workouts, cardio, session_views, replay_views, kahunas_checkins, weekly_scores, wellbeing_checkins, monthly_checkins, ai_interactions, activity_dedupe, session_chat

Workout: workout_plans (244 rows), workout_plan_cache, exercise_logs, exercise_swaps, exercise_notes, custom_workouts

AI: personas (5), persona_switches, running_plan_cache, weekly_goals, knowledge_base

Habit/Nutrition: habit_themes (5), habit_library (30), member_habits, nutrition_logs, nutrition_my_foods, nutrition_common_foods (125), weight_logs

Notifications/Push: member_notifications, push_subscriptions

AI Decisions: ai_decisions (logs persona + habit assignment reasoning)

Other: service_catalogue (21), certificates, employer_members, engagement_emails, session_chat, qa_submissions

**Activity caps:** habits 1/day, workouts/cardio/sessions 2/day, check-ins 1/ISO week. Over-cap -> activity_dedupe.

**New columns added 11 April 2026:** `dob` (date), `training_goals`, `barriers`, `sleep_hours_range`, `sleep_help`, `social_help`, `nutrition_guidance`, `location` — all onboarding questionnaire fields now fully persisted.

**DOB / Age:** `dob date` is stored. Age is computed live using `member_age(dob)` SQL function — never stored statically. `age integer` column kept for legacy fallback only.

**member_habits.assigned_by constraint:** Only allows: `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`. Never use `'onboarding_ai'` — constraint violation.

**daily_habits unique constraint:** `(member_email, activity_date, habit_id)` — one row per habit per day. Cap is 10/day (raised from 1).

---

## 5. AI Personas

### Score Scales (CRITICAL)
| Slider | 1 = | 10 = | Direction |
|--------|-----|------|-----------|
| Wellbeing | Struggling | Thriving | High = good |
| Energy | Exhausted | Full of energy | High = good |
| **Stress** | **Very stressed** | **Very calm** | **High = good (INVERTED from intuition)** |

**This caused a major bug until v45.** All persona and habit logic was backwards for stress. High stress score = calm, positive. Low stress score = person is struggling.

### Persona Assignment (Hard Rules — in order)
1. **HAVEN** — life context includes Bereavement or Struggling with mental health
2. **RIVER** — stress <= 3 (actually stressed) OR wellbeing <= 4 OR energy <= 3
3. **NOVA** — wellbeing >= 7 AND energy >= 7 AND stress >= 7 (calm) AND **1-2 goals max where strength/performance/muscle is dominant**. Members with 3+ mixed goals always go to AI path, even if scores qualify.
4. **AI decides** — everything else. SPARK is default for mixed goals, lifestyle/consistency focus, or demanding life context.

### Persona Characters
| Persona | Character |
|---------|-----------|
| NOVA | High-performance coach. Data-led. Precision. For people where performance is the primary focus. |
| RIVER | Mindful guide. Calm, empathetic. For people who are stressed (low stress score), low energy, or struggling. |
| SPARK | Motivational powerhouse. Energetic accountability. For mixed goals, consistency focus, busy lifestyles. |
| SAGE | Knowledge-first mentor. Evidence-based. |
| HAVEN | Mental health companion. NOT LIVE — needs professional review. |

NEVER assign NOVA or SPARK if serious life context in Section G.

### Corrected Persona Assignments (10 Apr 2026)
Previously wrong due to inverted stress scale:
- Stuart Watts: RIVER -> **NOVA** (stress 7, wellbeing 8, energy 8, gym 4x, holiday goal)
- Alan Bird: RIVER -> **SPARK** (stress 10/very calm, but energy 5 and mixed lifestyle goals)
- Dean Brown: NOVA -> **SPARK** (stress 8/calm but 5 mixed goals — strength one of many, 1-2 days/week, demanding work)

---

## 6. Onboarding Flow

**URL:** `www.vyvehealth.co.uk/welcome` (welcome.html in Test-Site-Finalv3)
**EF:** onboarding v58 (code comment says v54)

### What fires on submit
1. `selectPersona()` — hard rules then AI fallback (correct stress scale v45+)
2. `generateProgrammeOverview()` — AI names the 8-week programme
3. `selectHabits()` — AI selects 5 habits from library (stress scale reminder in prompt)
4. `generateRecommendations()` — AI writes 3 first-week recs in persona voice
5. Stage 1: `writeMember()` + `createAuthUser()` in parallel (member row MUST commit first)
6. Stage 2: `writeHabits()` + `writeAiInteraction()` + `writeWeeklyGoals()` + Make webhook
7. `sendWelcomeEmail()` via Brevo
8. Background: `generate-workout-plan` EF via EdgeRuntime.waitUntil()

### Bugs fixed (10 Apr 2026)
| Bug | Impact | Fix |
|-----|--------|-----|
| FK race condition (v44) | writeHabits fired before member row committed → FK violation → no habits assigned | Two-stage Promise.all |
| `assigned_by: 'onboarding_ai'` (v46) | Check constraint violation on member_habits → no habits assigned | Changed to `'onboarding'` |
| Stress scale inverted (v45) | All persona + habit selections wrong for stress dimension | Corrected all logic + AI prompts |
| NOVA hard rule too broad (v47) | Any member ticking 'strength' among 5 goals got NOVA | Rule now requires 1-2 goals max, performance dominant |
| Silent catch with fake results (welcome.html) | EF timeout/failure showed fake RIVER results, member thought they'd onboarded | 90s AbortController + error screen + retry button |

### welcome.html submit behaviour (post-fix)
- 90s timeout via AbortController
- At 30s: loading text updates to warn it's still running
- On failure: shows error screen with retry button (stores form data for retry)
- Up to 3 retries before showing support email
- No more silent fake results

---

## 7. Habit System

### member_habits table
- 5 habits per member assigned at onboarding
- `assigned_by` constraint: `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`
- `(member_email, habit_id)` unique — no duplicate habits per member

### daily_habits table
- One row per habit per day per member (`member_email, activity_date, habit_id` unique)
- Cap: 10/day (generous — allows all 5 habits to log)
- Over-cap → activity_dedupe (not discarded)

### Habit selection logic
AI selects 5 habits from 30 in habit_library using member's profile:
- Stress scale is explicitly stated in prompt (1=stressed, 10=calm)
- Low stress score → prioritise sleep/mindfulness/recovery habits
- High stress score → member is calm, no need for stress-relief habits

---

## 8. Hard Rules (NEVER BREAK)

1. API keys NEVER in HTML or GitHub. Server-side EFs only.
2. Auth0 is dead. Never reference it.
3. Kahunas/PAD are dead. Product is "VYVE Health app".
4. Never say "Corporate Wellness" as tagline.
5. sw.js cache must be bumped after every portal push. Pattern: vyve-cache-v2026-04-[letter].
6. EF deploys require full index.ts.
7. Dual dark/light CSS blocks. theme.js before </head>.
8. Employer dashboard = aggregate only. No PII.
9. HAVEN must signpost professional help if crisis.
10. Password reset emails route to `set-password.html`.
11. GitHub writes via github-proxy EF PUT. Composio MCP is READ-ONLY.
12. workouts.html uses MutationObserver on #app. Never revert to waitForAuth.
13. Business email: team@vyvehealth.co.uk.
14. Dean does not use Make. Lewis only.
15. **Stress scale: 1=very stressed, 10=very calm. NEVER treat high stress as negative.**
16. **member_habits.assigned_by: only 'onboarding', 'ai', 'theme_update', 'self' allowed.**
17. **Nav overlap rule:** Sticky elements inside portal pages must use `top:56px` (not `top:0`) on mobile (`max-width:768px`) to clear the nav.js mobile header. The bottom nav is `z-index:9999`; modals must be `z-index:10001` or higher.
18. **Modal sheets must `stopPropagation`:** Add `onclick="event.stopPropagation()"` to `.modal-sheet` so tapping inside the modal never bubbles to the overlay and closes it.
19. **Settings cache:** `vyve_settings_cache` in localStorage, 10-min TTL, keyed to user email. `populateFromCache()` fills UI immediately; `loadProfile()` refreshes in background.
20. **member-dashboard is JWT-only.** No `?email=` fallback. All portal pages calling it MUST send `Authorization: Bearer <jwt>` header via `getJWT()`.
21. **github-proxy requires `GITHUB_PROXY_SECRET`** header (`x-proxy-key`). CORS restricted to `online.vyvehealth.co.uk`.
22. **employer-dashboard requires `EMPLOYER_DASHBOARD_API_KEY`** header. Hard fail if key not configured.
23. **send-email requires service-role-key** on HTTP handler. CORS restricted to portal origins.
24. **onboarding CORS restricted** to `https://www.vyvehealth.co.uk` (Option A — no secret in static site).
25. **Portal auth convention:** All portal pages must use `window.vyveSupabase` for Supabase client access. Never `_supabase`, `_sb`, or other aliases. `getJWT()` pattern: `const{data:{session}}=await window.vyveSupabase.auth.getSession(); return session?.access_token;`
26. **When changing Edge Function auth, grep ALL portal pages** that call that function. Every caller must be updated — not just the main dashboard.
27. **Variable scope rule:** When refactoring `var`/`let` → `const`, check ALL functions referencing the variable. `const` is block-scoped — functions at script level cannot access it from an inner function's scope.

---

## 9. Key URLs

| Reference | Value |
|-----------|-------|
| Supabase Project | ixjfklpckgxrwjlfsaaz |
| PostHog Key | phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl |
| HubSpot Hub ID | 148106724 |
| Sage Deal | 495586118853 |
| Strategy Dashboard | online.vyvehealth.co.uk/strategy.html (password: vyve2026) |
| Demo Reset | online.vyvehealth.co.uk/index.html?reset=checkin |
| Onboarding form | www.vyvehealth.co.uk/welcome |
| github-proxy PUT | https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/github-proxy?path=filename.html |

---

## 10. What NOT to Do

- Do NOT create tables that already exist
- Do NOT reference Auth0, Kahunas, PAD, or Google Sheets for portal data
- Do NOT put API keys in HTML files
- Do NOT modify EFs without complete index.ts
- Do NOT forget to bump sw.js after portal changes
- Do NOT use `assigned_by: 'onboarding_ai'` — check constraint violation
- Do NOT treat high stress score as bad — 10 = very calm
- Do NOT assign NOVA just because a member ticked strength among many goals
- Do NOT create monthly_summaries, activity_patterns, charity_totals, audit_log, milestone_messages — never built
