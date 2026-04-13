# VYVE Health — Task Backlog

> Prioritised list of outstanding work. Updated 13 April 2026 (Apple Health extended vision added).

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


---

## 🟡 This Week

- `certificate-checker` — add `certificate_earned` notification write + push
- Load `vapid.js` on other portal pages (currently index.html only)
- Re-engagement automations x3 — blocked on Lewis email copy
- Live viewer count on session pages (20+ viewers)
- AI weekly goals system — blocked on Lewis copy approval
- Suppress portrait lock overlay during active workout session (iOS only)
- **Onboarding resilience: save-answers-first** - lightweight `save-answers` EF + `onboarding_answers` table. Saves form data per section so failed onboarding can be re-run from saved answers. Friendly error screen instead of crash. ~2-3 hrs.
- **In-app onboarding fallback** - if a member has no `workout_plan_cache` row (or `is_active = false` and no plan), show a simplified questionnaire inside the portal (training goals, experience, days/week, location, equipment, injuries). Submits to `generate-workout-plan` EF directly. Covers: failed onboarding, plan expired, plan deleted, member wants fresh plan. ~3-4 hrs.
- **Dashboard widget customisation** — members choose which widgets appear on their home screen and in what order. DB: `dashboard_widgets JSONB` on members table. Settings: toggle on/off + reorder. No new EF needed — member-dashboard already returns all data. ~4-5 hrs.

---

## 🟢 Post App Store Approval (Next Release)

- **Add `capacitor-plugins.js` to portal** — native bridge exposing `window.VYVENative`. Required before any Apple Health features. Instant deploy, no resubmission.
- **Apple Health — Workout Feed** — read workout type, duration, calories, heart rate from Apple Health and display in a feed on the dashboard. Auto-logs into `workouts`/`cardio` tables with `source: apple_health`. High value, works for most members.
- **Apple Health — Auto-tick habits** — when Apple Health data matches a member's active habit (e.g. sleep 8hrs matches "Sleep 7+ hours" habit), auto-tick it in `daily_habits`. Requires `health_trigger` column on `habit_library` (tag-based matching — e.g. `sleep_hours_gte_7`, `steps_gte_10000`). Dedup handled by existing unique constraint. ~3-4 hrs once `capacitor-plugins.js` in place.
- **Apple Health — Nutrition sync** — read dietary data (calories, protein, carbs, fat, water) from Apple Health where member uses a food tracking app (MyFitnessPal, Cronometer etc.) that writes to Health. Also write VYVE food log entries back to Apple Health (two-way sync). Medium value — depends on member using a compatible app. Bundle with workout feed.

---


## 🍎 Apple Health — Extended Vision (pick from these)

> These are identified opportunities from Apple Health integration. Not all will be built — select based on member value and enterprise story. All depend on `capacitor-plugins.js` being live first.

- **AI-Scaled Weight Training** — read actual weights lifted from Apple Health, compare to previous sessions, AI suggests progressive overload specific to the member. "Last week 60kg x 3 sets of 8 — this week aim for 62.5kg." Replaces generic programmes with truly adaptive ones.
- **Recovery Scoring via HRV** — Heart Rate Variability read each morning, workout intensity auto-adjusted. "Your HRV is down 18% — today's session has been switched to a recovery workout." High impact, differentiated.
- **Resting Heart Rate Trend** — surface as a fitness progress metric. Declining RHR = improving cardio fitness. Compelling evidence for members and enterprise ROI.
- **Sleep Stage Analysis** — deep sleep, REM, light sleep from compatible devices. Weekly sleep quality score feeds into monthly check-in context.
- **Sleep + Performance Correlation** — cross-reference sleep quality with workout performance and wellbeing scores. "On weeks under 6.5hrs sleep your wellbeing score averages 4.2. Over 7.5hrs it averages 7.1." Unique and genuinely powerful.
- **VO2 Max Tracking** — Apple Watch estimates VO2 Max. Track over time, show as fitness age. Strong enterprise ROI metric.
- **Mindful Minutes Auto-tick** — read mindfulness data from Headspace, Calm, Apple Breathe. Auto-tick mindfulness habits.
- **Dynamic TDEE** — use actual Active Energy burned (not static onboarding estimate) to adjust daily calorie target in real time. "You burned 2,847 kcal today — your target adjusts to 3,047."
- **Weight Trend Prediction** — combine weight logs + calories + activity. AI projects goal weight arrival date. "At your current pace you'll reach your goal in ~11 weeks."
- **Personal Records from Apple Health** — pull longest run, fastest 5k, most active day automatically rather than relying on manual logging.
- **Workforce Wellbeing Index (Enterprise)** — aggregate anonymised Apple Health trends across an employer's workforce (avg RHR, sleep, activity). Shown in employer dashboard. No individual data. Differentiating enterprise feature.
- **Absence Prediction (Enterprise — ambitious)** — declining HRV + poor sleep + low activity + dropping wellbeing scores = early burnout signal. Anonymised aggregate risk flag for HR. Wins enterprise contracts.
- **Nutrition Sync** — two-way: read dietary data from MyFitnessPal/Cronometer etc., write VYVE food logs back to Apple Health. Medium priority — depends on member using a compatible food app.

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

- ~~Onboarding EF recovered from Composio wipe (5 fixes)~~ ✅ — 13 April 2026
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
