# VYVE Health — Task Backlog

> Prioritised list of outstanding work. Updated 13 April 2026.

## 🟡 In Progress

- **Capacitor wrap — Android submitted ✅, iOS submitted ✅**
  - Android: `app-release.aab` built + submitted to Google Play (12 Apr). Awaiting review (1-3 days).
  - iOS: Submitted to App Store 13 April 2026. Awaiting review (24-48 hours).
  - Build 2 (correct VYVE icon) uploaded and ready — swap on approval or rejection.
  - Key ID: `4WSJ4XSZ58` | Team ID: `VPW62W696B` | Project: `C:\Users\DeanO\vyve-capacitor\`
  - Keystore: `vyve-release-key.jks` on Dean's Desktop (OneDrive)
  - Old Kahunas app (`com.kahunas.io.VYVE`) still on Play Store — deprecate after new app approved

---

## 🔴 Do Now

- **Improve dashboard skeleton loading screen** — slim skeleton + instant name from auth + cache
- Weekly check-in slider questions — Lewis to confirm wording
- Add VYVE logo image to all Brevo email templates (currently text-only "VYVE" header)

---

## 🟡 This Week

- `certificate-checker` — add `certificate_earned` notification write + push
- Load `vapid.js` on other portal pages (currently index.html only)
- Re-engagement automations x3 — blocked on Lewis email copy
- Live viewer count on session pages (20+ viewers)
- AI weekly goals system — blocked on Lewis copy approval
- Suppress portrait lock overlay during active workout session (iOS only)
- **Dashboard widget customisation** — members choose which widgets appear on their home screen and in what order. DB: `dashboard_widgets JSONB` on members table. Settings: toggle on/off + reorder. No new EF needed — member-dashboard already returns all data. ~4-5 hrs.

---

## 🟢 Post App Store Approval (Next Release)

- **Add `capacitor-plugins.js` to portal** — native bridge exposing `window.VYVENative`. Required before any Apple Health features. Instant deploy, no resubmission.
- **Apple Health — Workout Feed** — read workout type, duration, calories, heart rate from Apple Health and display in a feed on the dashboard. Auto-logs into `workouts`/`cardio` tables with `source: apple_health`. High value, works for most members.
- **Apple Health — Auto-tick habits** — when Apple Health data matches a member's active habit (e.g. sleep 8hrs matches "Sleep 7+ hours" habit), auto-tick it in `daily_habits`. Requires `health_trigger` column on `habit_library` (tag-based matching — e.g. `sleep_hours_gte_7`, `steps_gte_10000`). Dedup handled by existing unique constraint. ~3-4 hrs once `capacitor-plugins.js` in place.
- **Apple Health — Nutrition sync** — read dietary data (calories, protein, carbs, fat, water) from Apple Health where member uses a food tracking app (MyFitnessPal, Cronometer etc.) that writes to Health. Also write VYVE food log entries back to Apple Health (two-way sync). Medium value — depends on member using a compatible app. Bundle with workout feed.

---

## 🔵 Later

- Aggregate member-dashboard server-side (won't scale past ~100 active members)
- Add retry/circuit-breaker logic to AI calls in Edge Functions
- Add Content-Security-Policy headers to portal pages
- Add session timeout to Supabase Auth
- Exercise page redesign — umbrella page (product decision pending)
- Build process / bundler
- ARIA labels
- Sentry, PostHog events, TypeScript
- HAVEN professional review
- Google Workspace migration
- External DPO service (required before 500 members)
- Grant applications (National Lottery, The Fore — June/July 2026)
- WHISPA research partnership — monitor May 2026 launch
- Document PostHog as data processor in privacy policy
- Brevo logo removal (~$12/month) — before enterprise demo
- **React Native evaluation** — revisit when: 500+ active members, enterprise client makes it a contract requirement, or dedicated mobile developer hired. No action until then.
- **Command Centre — Supabase data connection** — replace localStorage with Supabase (same DB `ixjfklpckgxrwjlfsaaz`, tables prefixed `cc_`). Separate auth accounts for Dean and Lewis.
- **Command Centre — Native AI features** — wire Claude API key field in Settings to actual on-demand AI calls (Morning Brief summarisation, OKR coaching, competitor analysis). Server-side via Edge Function.

---

## 🔒 Security — Deferred

- A4: Service-role-key refactor for member-scoped EF queries (~1 hr)
- A5: XSS audit on `.innerHTML` rendering of AI content (~30 min)
- C2: Onboarding race condition ordering (~1 hr)
- C4: PostHog raw email PII — hash before sending (~30 min)
- B1: 13 one-shot migration EFs still to delete
- Make `vyve-command-centre` repo private once Supabase data connection is live

---

## ✅ Completed

- ~~Monthly check-in link added to portal nav~~ ✅ — 13 April 2026
- ~~Weekly check-in habit count fixed (max 1/day, max 7/week)~~ ✅ — 13 April 2026
- ~~VYVE Command Centre: live at admin.vyvehealth.co.uk~~ ✅ — 13 April 2026
- ~~Command Centre: Supabase Auth (replaced hard-coded login)~~ ✅ — 13 April 2026
- ~~Command Centre: 11 JS corruptions fixed~~ ✅ — 13 April 2026
- ~~Command Centre: duplicate headings removed~~ ✅ — 13 April 2026
- ~~Health disclaimer~~ ✅ — Lewis signed off 12 April 2026
- ~~Android app submitted to Google Play~~ ✅ — 12 April 2026
- ~~Delete 89 dead Edge Functions~~ ✅ — 12 April 2026
- ~~Security remediation (all 8 audit fixes)~~ ✅ — 11 April 2026
- ~~Push notification permission request (Layer 1 + Layer 2)~~ ✅
- ~~Layer 2 VAPID Web Push~~ ✅
- ~~Settings: persona selector, habit manager, goals, units~~ ✅
- ~~Leaderboard: live data, Sage/team tabs~~ ✅
- ~~workouts.html: multiple fixes~~ ✅
- ~~Modularise workouts.html~~ ✅
- ~~Full system audit~~ ✅ — 11 April 2026
