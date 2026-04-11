# VYVE Health — Task Backlog

> Prioritised list of outstanding work. Updated 10 April 2026 (late — settings page session).

## Do Now

- ~~Delete `results-preview.html` from Test-Site-Finalv3~~ — deleted ✅
- Push notification permission request (Capacitor blocker) — Layer 1 in-app notifications ✅ done; Layer 2 VAPID push ready to wire
- Health disclaimer — Lewis sign-off needed (Capacitor blocker)
- ~~Settings: persona selector, habit manager, goals, units — ai_decisions table~~ ✅
- Add monthly-checkin link to portal nav / dashboard
- Weekly check-in slider questions — Lewis to confirm wording
- Send Stuart Watts (`stuwatts09@gmail.com`) a fresh password reset email — plan + videos now live ✅
- Set `EMPLOYER_DASHBOARD_API_KEY` secret in Supabase (from security audit)
- Delete 89 dead Edge Functions (deletion script in security audit doc)

## This Week

- ~~Layer 2 push notifications (VAPID)~~ ✅ — vapid.js + sw.js push handler + habit-reminder v2 + streak-reminder v2 live. **Dean: set `VAPID_PRIVATE_KEY` secret in Supabase to activate.**
- `certificate-checker` — add `certificate_earned` notification write (currently only cron-based certs don't notify)
- ~~Leaderboard: remove Sage/My team tabs, wire to live data~~ ✅ — done 10 Apr, EF leaderboard v1, commit 7691280

- Brevo logo removal (~$12/month)
- Facebook Make connection refresh — EXPIRES 22 MAY 2026
- Re-engagement automations x3 — blocked on Lewis email copy
- Live viewer count on session pages (20+ viewers)
- AI weekly goals system — blocked on Lewis copy approval
- B2B volume discount tiers — define before first contract
- Fix Make social publisher (Scenario 4950386) — 133 posts stuck
- Consolidate duplicate RLS policies
- Stuart Watts old account (`swatts@geoffreyrobinson.co.uk`) — decide whether to migrate 12 legacy workout logs to new Gmail account
- Suppress portrait lock overlay during active workout session (iOS only — currently shows if rotated mid-set)
- ~~Running plan truncation on long plans~~ — fixed, max_tokens raised to 16000 ✅
- ~~workouts.html: reorder wipes in-progress sets~~ — fixed ✅
- ~~workouts.html: PR/history scroll locked + content under nav~~ — fixed ✅
- ~~workouts.html: navigating away mid-workout resets session~~ — fixed, session persisted to localStorage ✅
- ~~settings.html: Contact support mailto broken (iOS Mail)~~ — fixed ✅
- ~~settings.html: Privacy Policy link 404~~ — fixed ✅
- ~~how-to-videos.html / how-to-pdfs.html: missing nav, auth gate, back button~~ — replaced with clean placeholders ✅

## Later

- Capacitor wrap for iOS + Android
- Exercise page redesign — umbrella page with gym / cardio / walking plans (product decision pending)
- ~~Modularise workouts.html~~ ✅ — done 10 Apr, commit b28c2b79
- Build process / bundler
- ARIA labels
- Sentry, PostHog events, TypeScript
- Move pg_net to extensions schema
- HAVEN professional review
- Google Workspace migration
- External DPO service
- Grant applications (National Lottery, The Fore)
- WHISPA research partnership

## Onboarding QA — Deferred (needs Lewis)

- Section H title "Routine & motivation" — add context e.g. "with life in general". Question "What would help you most right now?" needs clearer framing (Alan feedback #6)
- Questionnaire tone — make it feel more accessible for people who aren't self-aware about their health habits (Alan feedback #7)
- Intro video on welcome screen — still needed to contextualise skip behaviour and optional answers (Alan feedback #8, #2)
- Section J / "Specific goal for the week ahead" — decide how to handle nonsense free-text input in AI prompt (Alan feedback #9)
