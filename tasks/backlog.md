# VYVE Health — Task Backlog

> Updated: 18 April 2026 (Session: Admin dashboard + aggregation layer reconciliation)

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
- **Deploy admin.html to a hosting target** — recommend `admin.vyvehealth.co.uk` (GitHub Pages from vyve-command-centre repo, or new sub-repo). File committed at `apps/admin-dashboard/admin.html`.

---

## Security Quick Wins (from 16 April audit — status after 18 April)

- ~~Add indexes on workouts(member_email), cardio(member_email), certificates(member_email), ai_interactions(member_email)~~ **DONE 18 April**
- ~~Add `logged_at DESC` indexes across activity tables~~ **DONE 18 April**
- Fix XSS: escape firstName before innerHTML rendering
- Fix running_plan_cache RLS: change public_update to member_email = auth.email()
- Fix INSERT policies on session_chat, shared_workouts, monthly_checkins
- Remove 3 redundant RLS policies on members table
- Delete 89 dead Edge Functions
- Add `<meta name="mobile-web-app-capable" content="yes"/>` to remaining portal pages (13 pages still need it)

---

## Brain Reconciliation (from 18 April)

- master.md §4: correct the "No triggers" / "No foreign keys" claims (14 triggers + 24 FKs live)
- master.md §4: document the aggregation layer (5 tables + 1 view + 6 functions + 4 cron jobs)
- master.md §10: add Rule 33 — aggregation tables are EF-service-role only

---

## Offline Mode — SHIPPED 17 April 2026 ✅

Auth fast-path (vyve_auth cached session) + localStorage data caches on all EF-calling pages +
offline-manager.js banner + write-action disabling. Full coverage: index, habits, engagement,
certificates, leaderboard (full cache), workouts, nutrition, sessions, wellbeing-checkin.

## Admin Dashboard — SHIPPED 18 April 2026 ✅

Single-file HTML dashboard (`apps/admin-dashboard/admin.html`), `admin-dashboard` Edge Function
(v2), aggregation layer extended, source-table indexes added. See plans/admin-dashboard.md.

## Design System — Phase Roadmap

- ~~**Phase B: Semantic colour migration**~~ ✅ Done 17 April 2026
- ~~**Phase C: Session-page template consolidation**~~ ✅ Done 17 April 2026 — 14 stubs + 4 shared files. See changelog.
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
- Add Dean + Lewis to admin_users table for admin.html access (already seeded — just needs to test login)

---

## Completed (Recent)

- Admin dashboard + aggregation layer reconciliation (18 April 2026)
- Desktop nav More dropdown + avatar profile panel (17 April 2026)
- engagement.html, certificates.html, index.html script injection corruption fix (17 April 2026)
- sw.js cache migration removed from activate handler (17 April 2026)
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
