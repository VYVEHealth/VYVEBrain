# VYVE Health — Task Backlog

> Prioritised list of outstanding work. Updated 12 April 2026.

## 🟡 In Progress

- **Capacitor wrap — Android submitted ✅, iOS pending Mac**
  - Android: `app-release.aab` built + submitted to Google Play (12 Apr). Awaiting review (1-3 days).
  - iOS: Pre-requisites all done. Waiting for Mac. ~2.5 hours once Xcode installed.
  - Key ID: `4WSJ4XSZ58` | Team ID: `VPW62W696B` | Project: `C:\Users\DeanO\vyve-capacitor\`
  - Keystore: `vyve-release-key.jks` on Dean's Desktop (OneDrive)
  - Next: `capacitor-plugins.js` → add to portal; iOS build on Mac
  - Old Kahunas app (`com.kahunas.io.VYVE`) still on Play Store — deprecate after new app approved

---

## 🔴 Do Now

- ~~Health disclaimer~~ ✅ — Lewis signed off
- **Improve dashboard skeleton loading screen** — slim skeleton + instant name from auth + cache
- Add monthly-checkin link to portal nav / dashboard
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

---

## 🔒 Security — Deferred

- A4: Service-role-key refactor for member-scoped EF queries (~1 hr)
- A5: XSS audit on `.innerHTML` rendering of AI content (~30 min)
- C2: Onboarding race condition ordering (~1 hr)
- C4: PostHog raw email PII — hash before sending (~30 min)
- B1: 13 one-shot migration EFs still to delete

---

## ✅ Completed

- ~~Health disclaimer — Lewis sign-off~~ ✅ — 12 April 2026
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
