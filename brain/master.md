# VYVE Health — Master Brain Document

> Single source of truth for the VYVE Health platform. Any AI session starts here.
> Last full reconciliation: 17 April 2026 (desktop nav parity, script injection fixes, SW cache fix).

---

## 1. What Is VYVE Health?

VYVE Health CIC is a UK-based Community Interest Company building a proactive wellbeing platform for individuals and employers. Three pillars: Physical, Mental, Social health. AI coaching personas personalise the member experience.

**Stage:** Pre-revenue, MVP, validation.
**Members:** 16 in DB. ~6 active (verified 16 April 2026). 5 legacy accounts (pre-April, no persona/habits).
**Legal:** ICO registered (00013608608). CIC = 6-8 point advantage in public sector procurement.

### Team
| Role | Person | Email | Scope |
|------|--------|-------|-------|
| CEO / Founder | Lewis Vines | lewisvines@hotmail.com | Commercial, sales, content, AI ops |
| CTO / Co-Founder | Dean Brown | deanonbrown@hotmail.com | Technical, part-time until 6K/month revenue |
| COO | Alan Bird | alanbird1@gmail.com | QA feedback |
| Fitness Content | Calum Denham | calumdenham@gmail.com | Programme review |

Business email: team@vyvehealth.co.uk (never use personal emails for business).

---

## 2. Product Overview

### What Members Get
- 5 AI coaching personas (NOVA, RIVER, SPARK, SAGE, HAVEN)
- 8-week personalised workout programmes (generated at onboarding)
- Browse library of 30 pre-built programmes with pause/resume switching
- Single session sharing (public preview page for non-members)
- Daily habit tracking with monthly themes + custom habit creation
- Weekly and monthly wellbeing check-ins with AI reports
- AI-generated running plans
- Nutrition logging (TDEE, macros, food diary) + standalone nutrition setup
- Live sessions with real-time chat
- Certificate system with charity donation mechanic
- Leaderboards and engagement scoring
- In-app notifications (bell badge, slide-up sheet, streak milestones)
- Web push notifications (VAPID, habit reminders 20:00 UTC, streak reminders 18:00 UTC)
- Platform monitoring with email alerts

### Pricing
- B2C: 20/month individual
- B2B: 10/user/month. Volume tiers TBD for 200+ seats.
- Stripe: buy.stripe.com/00wfZicla1Em0NnaIB93y00. Coupons: VYVE15, VYVE10.

### Current Priority Order (April 2026)
1. Get Android approved (icon rejection fix resubmitted 15 April)
2. iOS icon fix (app is on App Store but icon needs correcting)
3. Exercise restructure + onboarding questionnaire update
4. Test and fix on-the-fly issues — make platform as polished as possible
5. Target: ready to sell from May 2026

---

## 3. Architecture

### Hosting
| Component | Where |
|-----------|-------|
| Member portal (PWA) | GitHub Pages -> online.vyvehealth.co.uk — repo: VYVEHealth/vyve-site (PRIVATE) |
| Marketing site | GitHub Pages -> www.vyvehealth.co.uk — repo: VYVEHealth/Test-Site-Finalv3 |
| Admin dashboard | GitHub Pages -> admin.vyvehealth.co.uk — repo: VYVEHealth/vyve-command-centre (Lewis) |
| Backend / DB | Supabase Pro (West EU/Ireland) — project ixjfklpckgxrwjlfsaaz |
| AI | Anthropic API (Claude Sonnet 4 + Haiku 4.5) — server-side Edge Functions ONLY |
| Email | Brevo (free tier, 300/day) |
| Payments | Stripe |
| Analytics | PostHog (EU endpoint) — sends raw email PII (deferred fix) |
| CRM | HubSpot (Hub ID: 148106724) |
| Automation | Make (Lewis only — social media) |

### Authentication
Supabase Auth with auth.js v2.3. All portal pages gated. Auth0 is FULLY RETIRED.

### Repo Structure (vyve-site)
Single-file HTML pages. Self-contained inline CSS/JS. No build process, no bundler.

**Core files:** index.html (dashboard, 81KB), habits.html, workouts.html (51KB), nutrition.html (74KB), nutrition-setup.html, log-food.html, wellbeing-checkin.html, monthly-checkin.html, sessions.html, running-plan.html, settings.html (66KB), certificates.html, engagement.html, leaderboard.html, shared-workout.html, login.html, set-password.html, consent-gate.html, strategy.html (password: vyve2026)

**Shared JS:** auth.js (17KB), nav.js (18KB), theme.js (4.4KB), theme.css (4.5KB), sw.js (4KB), vapid.js (2.6KB), tracking.js (8.5KB), supabase.min.js

**Workout JS modules** (loaded by workouts.html): workouts-config.js, workouts-programme.js, workouts-session.js, workouts-builder.js, workouts-exercise-menu.js, workouts-notes-prs.js, workouts-library.js

**Session pages:** yoga-live.html, workouts-live.html, mindfulness-live.html, etc. + matching *-rp.html replay pages

**Other:** VYVE_Health_Hub.html (182KB, standalone demo page — no auth, not part of portal), offline.html, manifest.json, icons

### nav.js Injection Heights (mobile <=768px)
- Mobile top header: position:sticky; top:0; height:56px
- Bottom nav: position:fixed; bottom:0; z-index:9999; ~62px + safe-area
- Body gets padding-bottom: calc(62px + env(safe-area-inset-bottom,0px)) !important
- Any page-level sticky element must use top:56px on mobile, not top:0
- Modals must use z-index:10001 minimum to render above the bottom nav

### nav.js Desktop Nav (>768px)
Desktop shows a "More ▾" dropdown in the nav links bar and a profile dropdown on the avatar. Mobile (≤768px) is unchanged — still bottom nav + More bottom sheet.

**More dropdown** — three grouped sections:
- Check-Ins: Weekly Check-In, Monthly Check-In
- Progress: My Certificates, Leaderboard, Activity Score
- Tools: Running Plan, Guides & PDFs, How-to Videos, Catch-Up Replays

**Avatar panel** — shows member full name + email. Links: Settings, Sign Out. (Replaces the old bare "Sign out" button.)

**Globals:** `vyveToggleNavMore(e)`, `vyveToggleAvatarMenu(e)`, `vyveCloseAllDesktop()`

**Desktop overlay:** `#navDesktopOverlay` (invisible fixed div, z-index:99) closes both panels on outside click. Only one panel can be open at a time. Escape key closes both.

**CSS rule:** `@media(max-width:768px)` hides all desktop dropdown CSS so mobile is unaffected.

### PWA Meta Tags
All portal pages include `<meta name="apple-mobile-web-app-capable" content="yes"/>` for iOS Safari PWA behaviour. Three pages (`engagement.html`, `certificates.html`, `index.html`) also have `<meta name="mobile-web-app-capable" content="yes"/>` (added 17 April). Remaining portal pages still need this second tag — tracked in backlog.

### Onboarding Form
www.vyvehealth.co.uk/welcome = welcome.html in Test-Site-Finalv3 repo. 150s timeout, 45s slow timer. Calls onboarding Edge Function.

### sw.js Cache Version
`vyve-cache-v2026-04-17u` (bump letter after every portal push — read current version first)

### Web Push (VAPID) — Live
- vapid.js loaded on index.html — subscribes on bell tap, saves to push_subscriptions table
- sw.js — push event listener + notificationclick listener live
- habit-reminder v4 + streak-reminder v4 — full RFC 8291 AES-GCM encryption via Deno Web Crypto
- send-test-push v4 — test tool (Supabase Dashboard -> Edge Functions -> Test)
- VAPID_PRIVATE_KEY secret set in Supabase
- VAPID public key: BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4
- Rule: Apple push requires RFC 8291 encryption. esm.sh imports fail in Supabase EFs — always use Deno Web Crypto only.
- Rule: iOS push only works from home screen installed PWA (Safari 16.4+)

---

## 4. Database (Supabase — 61 Tables)

All RLS enabled. Email = primary key across all member tables.
No foreign keys. No triggers. Activity caps enforced by application code only (log-activity EF).

### Core Member & Activity (13 tables)
members (16 rows), daily_habits (76), workouts (61), cardio (19), session_views (33), replay_views (15), kahunas_checkins (14), weekly_scores (13), wellbeing_checkins (13), monthly_checkins (0), ai_interactions (20), activity_dedupe (512), session_chat (3)

### Workout & Exercise (7 tables)
workout_plans (297 rows), workout_plan_cache (11 — has is_active/paused_at/source cols for pause/resume), exercise_logs (185), exercise_swaps (4), exercise_notes (6), custom_workouts (2), programme_library (30 — browse library of pre-built programmes)

### AI & Persona (6 tables)
personas (5), persona_switches (0), running_plan_cache (4), weekly_goals (15), knowledge_base (15), ai_decisions (18 — logs persona assignment reasoning)

### Habit & Nutrition (7 tables)
habit_themes (5), habit_library (30 — includes created_by column for custom habits), member_habits (60), nutrition_logs (5), nutrition_my_foods (0), nutrition_common_foods (125), weight_logs (11)

### Notifications & Push (3 tables)
member_notifications (13), push_subscriptions (10), push_subscriptions_native (0 — for Capacitor)

### Sharing (1 table)
shared_workouts (54 — session sharing with public preview)

### Monitoring (1 table)
platform_alerts (51 — client-side error/timeout tracking. RLS enabled but NO policies — locked out via client, EFs use service role)

### Other (5 tables)
service_catalogue (21), certificates (0), employer_members (0), engagement_emails (34), qa_submissions (3)

### Command Centre (18 tables — all empty, not yet wired)
cc_clients, cc_decisions, cc_documents, cc_episodes, cc_finance, cc_grants, cc_intel, cc_investors, cc_invoices, cc_knowledge, cc_leads, cc_okrs, cc_partners, cc_posts, cc_revenue, cc_sessions, cc_swot, cc_tasks

### Activity Caps (Application-Level — No DB Triggers)
daily_habits: 10/day (per habit per day via unique constraint). workouts/cardio/sessions: 2/day. Check-ins: 1/ISO week.
Over-cap -> activity_dedupe (not discarded).

### Key Constraints
- member_habits.assigned_by: only 'onboarding', 'ai', 'theme_update', 'self' allowed
- daily_habits unique: (member_email, activity_date, habit_id)
- workout_plan_cache unique: (member_email) — upsert pattern
- members.persona: NOVA, RIVER, SPARK, SAGE, HAVEN

---

## 5. Edge Functions (24+ Live)

| Function | Version (approx) | Purpose | Auth |
|----------|---------|---------|------|
| onboarding | v67 | Persona + habits + inline workout plan + welcome email | CORS (public) |
| member-dashboard | v37 | Full dashboard data | JWT (internal) |
| wellbeing-checkin | v26+ | Weekly check-in + AI | JWT (internal) |
| monthly-checkin | v5+ | Monthly check-in | JWT (internal) |
| log-activity | v18 | PWA activity logging + streak notifications | JWT (internal) |
| notifications | v1+ | Fetch/mark-read in-app notifications | JWT (internal) |
| employer-dashboard | v26 | Aggregate, API key auth, no PII | API key |
| anthropic-proxy | v14 | Running plans | JWT (internal) |
| send-email | v20 | Brevo transactional (VYVE logo in header) | Auth + CORS |
| re-engagement-scheduler | v20 | Cron 8:00 UTC | Cron |
| daily-report | v16 | Cron 8:05 UTC | Cron |
| certificate-checker | v18 | Cron 9:00 UTC (VYVE logo in emails) | Cron |
| certificate-serve | v7+ | Certificate serving | Public |
| github-proxy | v15 | GET + PUT to vyve-site (x-proxy-key auth) | Header key |
| off-proxy | v9 | Open Food Facts API | Public |
| habit-reminder | v4 | Cron 20:00 UTC + VAPID push | Cron |
| streak-reminder | v4 | Cron 18:00 UTC + VAPID push | Cron |
| platform-alert | v1+ | Client error reporting + email alerts | CORS |
| generate-workout-plan | v5 | Standalone plan gen (RETIRED — logic now inline in onboarding v67) | N/A |
| workout-library | v1+ | Browse/activate/pause library programmes | JWT |
| share-workout | v1+ | Create + read shared workout sessions | JWT/Public |
| + others | various | reports, certs, test utilities | various |

All EFs use verify_jwt: false with internal JWT validation. Never set verify_jwt: true without updating all calling pages.

---

## 6. AI Personas

### Score Scales (CRITICAL)
| Slider | 1 = | 10 = | Direction |
|--------|-----|------|-----------|
| Wellbeing | Struggling | Thriving | High = good |
| Energy | Exhausted | Full of energy | High = good |
| **Stress** | **Very stressed** | **Very calm** | **High = good (INVERTED from intuition)** |

### Persona Assignment (Hard Rules — in order)
1. HAVEN — life context includes Bereavement or Struggling with mental health
2. RIVER — stress <= 3 (actually stressed) OR wellbeing <= 4 OR energy <= 3
3. NOVA — wellbeing >= 7 AND energy >= 7 AND stress >= 7 (calm) AND 1-2 goals max where strength/performance/muscle is dominant
4. AI decides — everything else. SPARK is default for mixed goals.

NEVER assign NOVA or SPARK if serious life context in Section G.

### HAVEN Status
HAVEN is live in the onboarding EF and IS being assigned (Conor Warren received it 15 April 2026). Professional clinical review still documented as required but has not been completed. A few members have been given it. This needs a decision from Dean/Lewis on whether to formally approve or gate it.

---

## 7. Onboarding Flow

**URL:** www.vyvehealth.co.uk/welcome (welcome.html in Test-Site-Finalv3)
**EF:** onboarding v67

### What fires on submit
1. selectPersona() — hard rules then AI fallback (correct stress scale)
2. generateProgrammeOverview() — AI names the 8-week programme
3. selectHabits() — AI selects 5 habits from library
4. generateRecommendations() — AI writes 3 first-week recs
5. generateWorkoutPlan() — inline (no more waitUntil), weeks 1-4 and 5-8 in parallel
6. Stage 1: writeMember() + createAuthUser() in parallel
7. Stage 2: writeHabits() + writeWorkoutPlan() + writeAiInteraction() + writeWeeklyGoals()
8. sendWelcomeEmail() via Brevo (VYVE logo in header)

### Client behaviour (welcome.html)
- 150s timeout via AbortController
- At 45s: loading text updates to warn it's still running
- On failure: error screen with retry button (stores form data)
- Up to 3 retries before showing support email

---

## 8. Habit System

- 5 habits per member assigned at onboarding
- assigned_by constraint: 'onboarding', 'ai', 'theme_update', 'self'
- Custom habits: members create via settings.html, stored in habit_library with created_by = email
- daily_habits: one row per habit per day (unique constraint)
- Habit count for dashboard/streaks = distinct DATES, not raw rows

---

## 9. App Store Status (as of 16 April 2026)

| Platform | Status |
|----------|--------|
| iOS | On App Store but icon needs fixing (shows placeholder). Build 2 with correct icon uploaded. |
| Android | Resubmitted 15 April with correct VYVE icon. Awaiting Google Play review. |
| Capacitor project | C:\Users\DeanO\vyve-capacitor\ (Windows), also set up on Mac |
| Keystore | vyve-release-key.jks on Dean's Desktop (OneDrive) |
| Apple Team ID | VPW62W696B |
| APNs Key ID | 4WSJ4XSZ58 |
| Bundle ID | co.uk.vyvehealth.app |

---

## 10. Hard Rules (NEVER BREAK)

1. API keys NEVER in HTML or GitHub. Server-side EFs only.
2. Auth0 is dead. Never reference it.
3. Kahunas/PAD are dead. Product is "VYVE Health app".
4. Never say "Corporate Wellness" as tagline.
5. sw.js cache must be bumped after every portal push. Pattern: vyve-cache-v2026-04-[date][letter].
6. EF deploys require full index.ts — no partial updates.
7. Dual dark/light CSS blocks. theme.js before </head>.
8. Employer dashboard = aggregate only. No PII.
9. HAVEN must signpost professional help if crisis.
10. Password reset emails route to set-password.html.
11. GitHub writes via github-proxy EF PUT (x-proxy-key auth). Composio MCP is READ-ONLY.
12. workouts.html uses MutationObserver on #app. Never revert to waitForAuth.
13. Business email: team@vyvehealth.co.uk.
14. Dean does not use Make. Lewis only.
15. Stress scale: 1=very stressed, 10=very calm. NEVER treat high stress as negative.
16. member_habits.assigned_by: only 'onboarding', 'ai', 'theme_update', 'self' allowed.
17. Nav overlap: sticky elements use top:56px (not top:0) on mobile. Bottom nav is z-index:9999. Modals z-index:10001+.
18. Modal sheets must stopPropagation on the sheet element.
19. Settings cache: vyve_settings_cache in localStorage, 10-min TTL, keyed to user email.
20. Habit count = distinct activity_date values, not raw rows. Cap 10/day.
21. verify_jwt: false is the VYVE pattern. All EFs use internal JWT validation.
22. AI stays server-side: all Anthropic API calls via Edge Functions only, never in HTML.
23. Lewis dislikes emojis: strip all emoji from content/copy before final commit.
24. Talk first, build second: work through options before writing code.
25. Large HTML files (>50KB): use github-proxy PUT endpoint, not inline Composio commits.
26. Never pass file content via inline COMPOSIO_MULTI_EXECUTE_TOOL parameters — use workbench.
27. Dean does not run SQL manually — deploy DDL via one-shot EFs using postgres Deno driver.
28. Build speed: "1 week" = 1-2 focused days, "2-3 weeks" = 3-5 days.
29. GDPR/UK compliance by default: RLS on all user/employer data, anonymisation for workforce insights.
30. For Supabase EF deploys of large files (>10KB): always read from GitHub, store in variable, pass to deploy. Never inline 46KB files in tool calls.
31. **SW activate: NO page migration.** The activate handler deletes old caches only — it MUST NOT copy pages from old caches into new ones. Migration causes stale/broken pages to persist even after a cache version bump. Users then need a hard reset to get the fix. Removed 17 April 2026.
32. **Never inject `<script>` tags via naive string search.** Injecting `<script src="..."></script>` into HTML using blind text matching can land inside a JS `<script>` block. The browser's HTML parser terminates the block at `</script>`, breaking all JS after that point. Always use targeted `str_replace` with unique surrounding context.

---

## 11. What NOT to Do

- Do NOT create tables that already exist (check the 61-table list above)
- Do NOT reference Auth0, Kahunas, PAD, or Google Sheets for portal data
- Do NOT put API keys in HTML files
- Do NOT modify EFs without complete index.ts
- Do NOT forget to bump sw.js after portal changes
- Do NOT use assigned_by: 'onboarding_ai' — check constraint violation
- Do NOT treat high stress score as bad — 10 = very calm
- Do NOT assign NOVA just because a member ticked strength among many goals
- Do NOT use exec_sql RPC — it doesn't work on this project. Use postgres Deno driver.
- Do NOT add page migration logic to the sw.js activate handler — causes stale broken files to persist after version bumps.
- Do NOT use naive string injection to add `<script>` tags to HTML — the `</script>` in the injected tag will terminate any `<script>` block it lands inside, breaking JS execution silently.

---

## 12. Security Audit Summary (11 April 2026)

### Completed Fixes
| Fix | What Changed |
|-----|-------------|
| github-proxy v15 | x-proxy-key auth + CORS restriction |
| member-dashboard v30+ | JWT-only auth, email fallback removed |
| onboarding v57+ | CORS restricted to www.vyvehealth.co.uk |
| send-email v16+ | Auth + CORS + model name fix |
| employer-dashboard v26 | Unauthenticated fallback removed |
| session_chat RLS | SELECT restricted to authenticated users |
| Duplicate RLS policies | 20 redundant policies dropped |

### Known Issues (from 16 April deep audit)
- platform_alerts: RLS enabled but NO policies (locked out via client, EFs bypass with service role)
- running_plan_cache: public_update policy lets any auth user UPDATE any row (security hole)
- 5 tables missing index on member_email: workouts, cardio, certificates, shared_workouts, running_plan_cache
- Zero foreign keys across all 61 tables
- Zero database triggers (activity caps are application-level only)
- XSS risk: index.html renders firstName via innerHTML without escaping
- PostHog sends raw email PII (deferred fix)
- 89 dead Edge Functions still not deleted

### Portal Page Corruption Fixed (17 April 2026)
Three portal pages had `<script src="/offline-manager.js"></script>` injected mid-JavaScript inside their `<script>` blocks by an old patch Edge Function (from the `patch-*` series, now deleted). The `</script>` terminated the block early:

| Page | Where | Effect |
|------|-------|--------|
| `engagement.html` | Inside `const avatarEl` variable declaration | Auth trigger (loadPage call) at line 36098 — never fired. Data never loaded. |
| `certificates.html` | Inside `'/login.html'` string in fetch handler | Entire fetch chain broken. Page showed eternal loading state. |
| `index.html` | Inside `'Content-Type'` header string in platform-alert | Inside try/catch — silent fail. Dashboard unaffected. |

**Fix:** Removed the bad `<script>` tags, restored correct JS, added `<script src="/offline-manager.js"></script>` before `</body>`. All three pages now load correctly.

**Root cause lesson:** Rule 32 above.

### Pre-Sage / Business Actions (Lewis)
- Brevo logo removal (~$12/month) — Lewis
- B2B volume discount tiers — define before first contract
- Facebook Make connection refresh — EXPIRES 22 MAY 2026 (CRITICAL)
- Make social publisher fix — 133 posts stuck since 23 March

---

## 13. On the Horizon

- Exercise restructure (Option A — Exercise Hub): replaces Exercise tab with hub showing AI-assigned primary plan + cards for Movement, Workouts, Cardio, Classes. Plan saved to VYVEBrain/plans/exercise-restructure.md.
- welcome.html onboarding questionnaire update (part of exercise restructure)
- HealthKit/Health Connect integration via Capacitor (habits linking with activity, weight from smart scales)
- Social activity feed: spec produced (VYVEBrain), back-burnered pending Lewis sign-off
- Wearables: Tier 1 (HealthKit/Health Connect) mapped out. Recommended against custom GPS.

---

## 14. Key URLs

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
| VAPID public key | BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4 |

---

*Last full reconciliation: 17 April 2026*
*Source: VYVEHealth/VYVEBrain repo (main branch)*

---

## 12. Design System (Current State — April 2026)

### Status
Phase A shipped 17 April 2026. Tokens are defined in `theme.css` (additive only). No page migrations performed yet — Phases B-E will migrate pages.

`VYVE_Health_Hub.html` is out of scope for Phase A-E migrations. Planned for future redesign + PWA linking.

### Tokens now in theme.css

**Brand accents (`:root`):** `--teal`, `--teal-lt`, `--teal-xl`, `--teal-dark`, `--green`, `--amber`, `--coral`, `--font-head`, `--font-body`

**Semantic aliases:** `--success` (#2D9E4A), `--success-soft`, `--success-strong`, `--warning` (#E09B3D), `--warning-soft`, `--warning-strong`, `--danger` (#E06060), `--danger-soft`, `--danger-strong`, `--gold` (#C9A84C), `--gold-soft`

**Activity track colours (5-way, each maps 1:1 to an activity):**
| Token | Hex | Activity |
|-------|-----|---------|
| `--track-habits` | #4DAAAA | Daily Habits |
| `--track-workouts` | #E09B3D | Workouts |
| `--track-cardio` | #E06060 | Cardio |
| `--track-sessions` | #9B7AE0 | Sessions |
| `--track-nutrition` | #2D9E4A | Nutrition |

**Habit pot colours (5-way, each maps 1:1 to a theme):**
| Token | Hex | Theme | Note |
|-------|-----|-------|------|
| `--pot-movement` | #4DAAAA | Movement | Shares with --track-habits (intentional) |
| `--pot-nutrition` | #2D9E4A | Nutrition | Shares with --track-nutrition (intentional) |
| `--pot-mindfulness` | #5BA8D9 | Mindfulness | NEW — was wrongly #E09B3D (amber) |
| `--pot-social` | #E879A3 | Social | NEW — was wrongly #E06060 (coral) |
| `--pot-sleep` | #6366B8 | Sleep | NEW — was wrongly #9B7AE0 (purple) |

**habits.html POT_CONFIG migration (Phase B):**
- `mindfulness: '#E09B3D'` → `var(--pot-mindfulness)` = #5BA8D9
- `social: '#E06060'` → `var(--pot-social)` = #E879A3
- `sleep: '#9B7AE0'` → `var(--pot-sleep)` = #6366B8
- `movement` and `nutrition` stay same hex, just point to tokens

**Spacing scale:** `--space-0` (0) through `--space-16` (64px)

**Typography scale:** `--text-2xs` (11px) through `--text-4xl` (40px), `--leading-tight/normal/relaxed`, `--weight-regular/medium/semibold/bold`

**Radius scale:** `--radius-sm` (6px), `--radius` (10px), `--radius-lg` (14px), `--radius-xl` (20px), `--radius-pill` (999px), `--radius-circle` (50%)

**Shadow scale:** `--shadow-sm/md/lg`, `--shadow-glow-teal`

**Per-theme aliases (in both dark + light blocks):** `--muted: var(--text-muted)`, `--on-accent: var(--white)`

### Phase sequencing
- **A** ✅ Token foundation (additive) — shipped 17 April
- **B** Semantic colour migration — index, settings, workouts, nutrition, habits
- **C** Session-page template consolidation — 14 pages → 3 files
- **D** Component primitives — btn/card/input/modal-sheet
- **E** Typography + spacing scale migration

---

## 12. Offline Architecture

### Root cause of blank screen (fixed 17 April 2026)
`vyveInitAuth()` called `await vyveSupabase.auth.getSession()` which attempts a token-refresh network call. With no signal this hangs, `vyveAuthReady` never fires, pages never render — even though the data cache already exists.

### Layer 5 — auth.js offline fast-path (v2.4)
Inserted after `window.vyveSupabase = vyveSupabase;`, before `getSession()`:
- If `!navigator.onLine`: read `localStorage.getItem('vyve_auth')` (storageKey used by Supabase client)
- If valid session found (has `user.email` + `access_token`): build user, `vyveRevealApp()`, dispatch `vyveAuthReady` — no network call
- If no valid cached session offline: redirect to login as normal
- Online flow: unchanged — `getSession()` runs as before

### Layer 2 — offline-manager.js
Stable shared file, in `PRECACHE_ASSETS`. Exports `window.VYVEOffline`:
- `showBanner(ts)` — fixed banner, z-index 10002, #1B7878, top:0 desktop / top:56px mobile (clears nav header)
- `hideBanner()`, `disableWriteActions()`, `enableWriteActions()`
- Write-action targeting: `[data-write-action]` attribute on buttons
- Auto-inits; listens to `window 'online'`/`'offline'`; dispatches `vyve-back-online` CustomEvent

### Layer 1 — page data caches
Pattern: `vyve_[page]_cache` → `{ data, ts: Date.now(), email }`. TTL 24h. **Always verify `cached.email === memberEmail`.**

| Page | Cache key | Coverage |
|------|-----------|----------|
| index.html | `vyve_home_v2_[email]` | Pre-existing — banner wired |
| habits.html | `vyve_habits_cache` | Full: read + write + write-action |
| engagement.html | `vyve_engagement_cache` | Full |
| certificates.html | `vyve_certs_cache` | Full |
| leaderboard.html | `vyve_leaderboard_cache` | Full |
| workouts.html | — (JS modules) | Banner + write-action only |
| nutrition.html | `vyve_wt_cache_*` (weight only) | Banner + write-action only |
| sessions.html | — (static data) | Banner only |
| wellbeing-checkin.html | — (write-heavy) | Disable submit offline |
| settings.html | `vyve_settings_cache` | Pre-existing |

### Layer 3 — wellbeing-checkin.html
Sliders shown offline (member fills in). Submit disabled: "Submit when back online". Re-enables on `vyve-back-online`.

