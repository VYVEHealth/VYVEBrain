# VYVE Health — Task Backlog

> Prioritised list of outstanding work. Updated 12 April 2026.

## ~~🔴 Security — Do Immediately (Before Enterprise Demo)~~ ✅ Complete

- ~~Secure `github-proxy`~~ ✅ — v15, `x-proxy-key` header auth
- ~~Fix `member-dashboard` auth~~ ✅ — v34, JWT-only, `?email=` removed
- ~~Secure `onboarding` endpoint~~ ✅ — v57, CORS restricted (Option A)
- ~~Secure `send-email`~~ ✅ — v16, service-role-key auth + model fix
- ~~Set `EMPLOYER_DASHBOARD_API_KEY`~~ ✅ — v26, fallback removed

## Do Now

- Health disclaimer — Lewis sign-off needed (Capacitor blocker)
- Add monthly-checkin link to portal nav / dashboard
- Weekly check-in slider questions — Lewis to confirm wording
- ~~Fix `send-email` model name~~ ✅ — fixed to `claude-sonnet-4-20250514`
- ~~Fix `session_chat` INSERT policy~~ ✅ — already correct (confirmed in audit)
- ~~Tighten CORS~~ ✅ — all EFs CORS-restricted
- ~~Delete 89 dead Edge Functions~~ ✅ — 12 April 2026
- ~~VAPID_PRIVATE_KEY secret set in Supabase~~ ✅ — Dean set this session
- **Improve dashboard skeleton loading screen** — current skeleton shows large grey blocks that fill the viewport and push real content below the fold. Options: slim down skeleton to subtle placeholders, show member name instantly from auth data (`window.vyveCurrentUser`), use home cache for instant repeat loads (now working after email scope fix). Recommended: Option C (slim skeleton + instant name + cache).

## This Week

- `certificate-checker` — add `certificate_earned` notification write + push
- Load `vapid.js` on other portal pages (currently index.html only)
- ~~Consolidate duplicate RLS policies~~ ✅ — 20 per-operation policies dropped across 7 tables
- ~~Drop duplicate indexes~~ ✅ — `exercise_notes_member_idx` + `idx_exercise_notes_member` dropped, `weekly_scores_member_week_unique` retained (unique constraint)
- Brevo logo removal (~$12/month)
- Facebook Make connection refresh — EXPIRES 22 MAY 2026
- Re-engagement automations x3 — blocked on Lewis email copy
- Live viewer count on session pages (20+ viewers)
- AI weekly goals system — blocked on Lewis copy approval
- B2B volume discount tiers — define before first contract
- Fix Make social publisher (Scenario 4950386) — 133 posts stuck
- Stuart Watts old account (`swatts@geoffreyrobinson.co.uk`) — decide whether to migrate 12 legacy workout logs
- Suppress portrait lock overlay during active workout session (iOS only)

## Later

- Capacitor wrap for iOS + Android
- Aggregate member-dashboard response server-side (currently returns raw activity rows — won't scale past ~100 active members)
- Add retry/circuit-breaker logic to AI calls in Edge Functions (onboarding, wellbeing-checkin)
- Add Content-Security-Policy headers to portal pages
- Add session timeout to Supabase Auth (currently persists indefinitely)
- Exercise page redesign — umbrella page with gym / cardio / walking plans (product decision pending)
- Build process / bundler
- ARIA labels
- Sentry, PostHog events, TypeScript
- Move pg_net to extensions schema
- HAVEN professional review
- Google Workspace migration
- External DPO service
- Grant applications (National Lottery, The Fore)
- WHISPA research partnership — monitor May 2026 launch
- Document PostHog as data processor in privacy policy (sends member emails)

## Completed This Week
- ~~Delete 89 dead Edge Functions~~ ✅ — 12 April 2026


- ~~Security remediation (all 8 audit fixes)~~ ✅ — 11 April 2026
- ~~Fix dashboard stats not rendering~~ ✅ — email scoping bug in `index.html` `loadDashboard()` (writeHomeCache used undefined `email` const)
- ~~Fix certificates.html auth~~ ✅ — added `getJWT()`, JWT auth header to member-dashboard call
- ~~Fix engagement.html auth~~ ✅ — same fix as certificates
- ~~Fix leaderboard.html auth~~ ✅ — `window._supabase` → `window.vyveSupabase` in `getJWT()`
- ~~SW cache bumped to `vyve-cache-v2026-04-11i`~~ ✅

- ~~Delete `results-preview.html` from Test-Site-Finalv3~~ ✅
- ~~Push notification permission request (Layer 1 + Layer 2)~~ ✅ — both layers fully live
- ~~Layer 2 VAPID Web Push~~ ✅ — vapid.js, sw.js push handler, habit-reminder v4, streak-reminder v4, confirmed on iOS
- ~~Notifications full-screen page~~ ✅ — back arrow, clear-all bell, bottom nav, themed background
- ~~Settings: persona selector, habit manager, goals, units~~ ✅
- ~~Leaderboard: live data, Sage/team tabs~~ ✅
- ~~Running plan truncation fix~~ ✅
- ~~workouts.html: multiple fixes~~ ✅
- ~~settings.html: mailto + privacy link fixes~~ ✅
- ~~how-to pages: auth gate + nav~~ ✅
- ~~Modularise workouts.html~~ ✅
- ~~Full system audit~~ ✅ — 11 April 2026. Audit report + remediation plan produced.
