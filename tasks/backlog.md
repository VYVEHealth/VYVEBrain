# VYVE Health — Task Backlog

> Updated: 17 April 2026 (Phase B design system shipped)

---

## Active Priorities (This Weekend)

1. **Android icon fix** — resubmitted 15 April, awaiting Google review
2. **iOS icon fix** — app live but icon wrong, Build 2 uploaded
3. **Exercise restructure** — Option A (Exercise Hub). Plan at VYVEBrain/plans/exercise-restructure.md. Includes welcome.html onboarding questionnaire update.
4. **Polish and bug-fix pass** — test all flows, fix on-the-fly issues
5. **Target: sell-ready by May 2026**

---

## This Week

- **HealthKit / Health Connect integration** — Capacitor plugin, habits linking with activity, weight from smart scales. Needs scoping session.
- **Calendar integration** — connect Google/Apple calendar, show VYVE sessions and workout schedule
- **Calendar page in portal** — dedicated schedule view

---

## Security Quick Wins (from 16 April audit)

- Add indexes on workouts(member_email), cardio(member_email), certificates(member_email), shared_workouts(shared_by), running_plan_cache(member_email)
- Fix XSS: escape firstName before innerHTML rendering
- Fix running_plan_cache RLS: change public_update to member_email = auth.email()
- Fix INSERT policies on session_chat, shared_workouts, monthly_checkins
- Remove 3 redundant RLS policies on members table
- Delete 89 dead Edge Functions

---

---

## Design System — Phase Roadmap

- ~~**Phase B: Semantic colour migration**~~ ✅ Done 17 April 2026
- **Phase C: Session-page template consolidation** (~1 day) — 14 `-live.html` and `-rp.html` pages → 3 shared component files. Eliminates per-page `--*` custom property redeclarations.
- **Phase D: Component primitives** (~2 days) — Shared `.btn`, `.card`, `.input`, `.modal-sheet` classes. Removes 72 unique button class names, 90 unique card class names.
- **Phase E: Typography + spacing scale migration** (~1 day) — Replace 118 unique font-size values and 264 unique padding values with `--text-*`, `--space-*` tokens.
- **Future: VYVE_Health_Hub.html redesign + PWA linking** — Out of scope for Phases A-E. Planned for later.


## Soon

- **In-app onboarding fallback** — simplified questionnaire inside portal for members with no workout plan (~3-4 hrs)
- **Onboarding resilience: save-answers-first** — progressive answer saving + error screen (~2-3 hrs)
- **Load vapid.js on other portal pages** — currently only index.html has push subscription
- **certificate-checker push notification** — send push when cert earned
- **HAVEN clinical sign-off** — formally decide: approve as-is or gate pending professional review
- **Dashboard data date-range filter** — member-dashboard EF fetches ALL historical data, needs 90-day limit
- **Add foreign keys** to core relationships (daily_habits.member_email -> members.email, etc.)
- **Hash emails before sending to PostHog**

---

## Later

- Social activity feed (spec at VYVEBrain, pending Lewis sign-off on 7 product decisions)
- Dashboard widget customisation
- Persona context modifier system
- AI weekly goals Phase 2 (behavioural goals from check-in data)
- Weekly progress summary email (blocked on Lewis copy)
- PostHog / Supabase Auth identity wiring
- Milestone message system
- Today's Progress dot strip (blocked on Lewis copy)
- Re-engagement automations x3 (blocked on Lewis email copy)
- Live viewer count on sessions (only display when 20+ viewers)

---

## Grants & Partnerships

- National Lottery Awards for All application
- The Fore grant — register June/July 2026
- WHISPA research partnership — monitor May 2026 launch

---

## Lewis Actions (Business)

- Facebook Make connection — EXPIRES 22 MAY 2026 (CRITICAL)
- Make social publisher fix — 133 posts stuck since 23 March
- B2B volume discount tiers — define before first contract
- Brevo logo removal (~$12/month)
- Annual pricing discount % decision
- 5 disabled Make tasks — keep or remove

---

## Completed (Recent)

- Full brain reconciliation (16 April 2026)
- Android resubmitted with correct icon (15 April)
- iOS submitted to App Store (13 April)
- engagement.html critical fix — double async syntax error (15 April)
- Exercise search overlay CSS fix (15 April)
- Nav.js bottom bar height reduction (15 April)
- Skeleton timeout monitors on 10 pages (15 April)
- Onboarding v67 — inline workout plan generation (13 April)
- Monthly wellbeing check-in shipped (13 April)
- Workout library Phase 2 — 30 programmes (12 April)
- Workout sharing Phase 1 — shared-workout.html (12 April)
- Pause/resume programme switching (12 April)
- Custom habits in settings (12 April)
- In-app notifications + web push (10-11 April)
- Platform monitoring system (11 April)
- Security audit + remediation (11 April)
- Nutrition setup page (11 April)
- Onboarding field audit — 7 new columns (11 April)
- VAPID web push (11 April)
- Brevo email logo update (13 April)
