# VYVE Health — Task Backlog

> Prioritised list of outstanding work. Updated 11 April 2026.

## Do Now

- Health disclaimer — Lewis sign-off needed (Capacitor blocker)
- Add monthly-checkin link to portal nav / dashboard
- Weekly check-in slider questions — Lewis to confirm wording
- Set `EMPLOYER_DASHBOARD_API_KEY` secret in Supabase (from security audit)
- Delete 89 dead Edge Functions (deletion script in security audit doc)
- ~~VAPID_PRIVATE_KEY secret set in Supabase~~ ✅ — Dean set this session

## This Week

- `certificate-checker` — add `certificate_earned` notification write + push
- Load `vapid.js` on other portal pages (currently index.html only)
- Brevo logo removal (~$12/month)
- Facebook Make connection refresh — EXPIRES 22 MAY 2026
- Re-engagement automations x3 — blocked on Lewis email copy
- Live viewer count on session pages (20+ viewers)
- AI weekly goals system — blocked on Lewis copy approval
- B2B volume discount tiers — define before first contract
- Fix Make social publisher (Scenario 4950386) — 133 posts stuck
- Consolidate duplicate RLS policies (6 unnecessary anon SELECT policies from security audit)
- Stuart Watts old account (`swatts@geoffreyrobinson.co.uk`) — decide whether to migrate 12 legacy workout logs
- Suppress portrait lock overlay during active workout session (iOS only)

## Later

- Capacitor wrap for iOS + Android
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

## Completed This Week

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
