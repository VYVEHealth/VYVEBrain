# Partner attribution & in-app onboarding — spec v2

**7 Aug 2026.** Supersedes v1. Decisions taken since v1: **7-day trial for everyone**, **no one-time PIN**, join page collects **email + confirm email + password**, onboarding sits **in the app**.

**LIVE** = verified in code/DB, **BUILD** = doesn't exist yet.

---

## 1. The flow, told as Michael and Sarah

1. **Sarah shares her link** — `vyvehealth.co.uk/join/sarah` — from the share card in her partner portal (§5).
2. **Michael opens it.** One short page: *email*, *confirm email*, *password*. No payment. No questionnaire. No price shown.
3. **Account created server-side** with `signup_campaign_code = 'sarah'` and `attribution_source = 'link'`. **Michael is now attributed to Sarah, permanently, before the App Store is involved.**
4. **Same page** then shows the two store buttons — App Store and Google Play — plus "sign in with the email and password you just created". Same message repeats in a confirmation email (the drift-off nudge).
5. **Michael installs, opens the app, signs in.** His phone offers the password he just saved (§4).
6. **App sees `onboarding_complete = false`** → runs the questionnaire **in the app**. Persona reveal → tour → home.
7. **Trial clock starts at onboarding complete** — 7 days, everyone, no partner variation.
8. **Day 7:** `trial-end-email` reads his `signup_campaign_code`, names Sarah in the copy, and links to a checkout with **her discount already applied**.
9. **Michael pays £10.** Not £20 — Sarah's tier coupon is pre-applied and he types nothing.
10. **Sarah earns £5/month** — 50% of net paid (£10 × 50%), for as long as he stays.

Michael never types a code, never remembers a code, and never sees a price inside the app.

---

## 2. Why this shape (the constraints that forced it)

- **iOS passes no referrer through the App Store to a fresh install.** Any "install first, attribute after" design needs probabilistic fingerprinting (Branch et al.) — degraded post-ATT, paid, and a guess. We'd be paying rev share on a guess. **Rejected.** Attribution therefore happens on the web, before install.
- **Payment Links cannot pre-apply a coupon** (§23.127). Any pre-applied discount must be an EF-minted **Checkout Session**.
- **Apple:** no price, no buy button, no steer to payment inside the app. Conversion is email → web. Signup is free, so it's IAP-safe.
- **No PIN/verification step.** It only became necessary in the discarded email-only variant. Collecting a password on the web means the account is fully formed and the app is a plain sign-in. Confirm-email catches the typo, which is what verification was really guarding against.

---

## 3. The app's front door — three states, one question (BUILD)

The friction Dean identified: Michael set a password two minutes ago and genuinely doesn't know whether he's "sign up" or "sign in". **Remove the fork.** One field — *enter your email* — and the server decides:

| State | Who | App says |
|---|---|---|
| No account | Cold install | "Let's get you set up" → create password |
| Account **with** password | **Michael (Sarah's link)** — the normal case | "Welcome back" → sign in |
| Account **without** password | B2B invitees, admin-provisioned partners | "Check your email to finish setting up" → branded set-password email |

The third state is **resilience, not a designed path** — nobody from a partner link lands there. It reuses the existing PM-830 set-password email + interstitial (the human-tap gate that stops corporate mail scanners consuming single-use tokens). No new machinery.

---

## 4. Password autofill — Dean's ask, and the honest cost

**Goal:** the password Michael's phone saved on `vyvehealth.co.uk` is offered to him inside the VYVE app, so there's no "forgot password → reset → all the other bullshit".

**This does not work by default**, because the credential is saved against the marketing domain and the app is a Capacitor binary serving bundled pages. Phones only share saved credentials across a web domain and an app when the two are formally associated. Requirements:

**iOS**
- `apple-app-site-association` file served at `https://www.vyvehealth.co.uk/.well-known/apple-app-site-association` with a `webcredentials` section naming the app's team+bundle id.
- `Associated Domains` entitlement in the Xcode project: `webcredentials:www.vyvehealth.co.uk`.
- **Requires a native release.** Cannot be done via Capawesome OTA — entitlements are compiled in.

**Android**
- `assetlinks.json` at `https://www.vyvehealth.co.uk/.well-known/assetlinks.json` with the app's package name and signing-cert SHA-256.
- Also a native release.

**Both, and available today with no release:**
- Correct input semantics on the join page *and* the app sign-in: `type="email"` + `autocomplete="username"`, `type="password"` + `autocomplete="new-password"` (join) / `"current-password"` (sign-in), inside a real `<form>`. Without these, password managers won't reliably offer to save or fill **anywhere** — this is the cheap prerequisite and should ship first regardless.

**Recommendation:** ship the input semantics now; add the association files + entitlements to the next native release that's happening anyway. Until then the fallback is honest and low-friction: the confirmation page and email both restate the email address used, and "forgot password" works.

---

## 5. Partner portal — share kit (BUILD)

Nothing currently shows a partner their link. On **Profile**:
- **Link** `vyvehealth.co.uk/join/<slug>` — one-tap copy + **QR code** (classes, print, events).
- **Code** — short and readable from `human_promo_code` (`SARAH`), for word of mouth. Currently **NULL for all 12 partners**; the only accepted code today is the raw slug (`calum-denham-performance` — unusable in speech).
- **Share text** — paste-ready for WhatsApp/Instagram. [LEWIS COPY PASS]
- **Live joins count**, split by `attribution_source` (link / code / self-declared).
- One plain line on earnings, matching the agreement.

---

## 6. Routes in, and why self-declared is safe

| Route | Attribution | Status |
|---|---|---|
| Link | Certain — slug stamped server-side | LIVE (needs §7 Piece 3 change) |
| Code typed at signup | Near-certain | Partly LIVE (slug only) |
| "Did someone invite you?" picker in onboarding | Self-declared | BUILD |

**The anti-abuse spine: the price is identical on every route.** Naming a partner never saves the member money, so there is no incentive to lie for personal gain. Residual risk is collusion (~£5/month per false claim), controlled by: `attribution_source` tracking, self-declared allowed **once and only before conversion**, the source split visible to the partner and to us in CC. **Do not add a partner-confirmation step at launch** — friction against an unobserved problem.

---

## 7. Work breakdown

**Piece 1 — Codes & share kit (~1 session)**
`human_promo_code` generation + unique index + backfill 12 partners; CC edit field; `validate_code` accepts code **or** slug, case-insensitive, live-only; portal share card (link, QR, code, share text, joins count); `attribution_source` column written on every path.

**Piece 2 — Conversion checkout (~0.5 session)**
`continue.html` → EF-minted Checkout Session (partner coupon applied, `metadata.partner_slug` stamped, bound to member id) instead of the fixed Payment Link. Explicit attribution at the moment money moves; unlocks per-partner rates later. Verify with a real £10 conversion.

**Piece 3 — Join page becomes account creation (~0.5 session)** ← *the friction fix*
`/join/<slug>` currently goes **straight to Stripe checkout**. Change to: email + confirm email + password → account created with slug + `attribution_source='link'` → store buttons + confirmation email. Correct autocomplete semantics (§4).

**Piece 4 — Three-state front door (~0.5 session)**
Email-first app sign-in; server resolves state; passwordless accounts get the existing PM-830 set-password email.

**Piece 5 — Recognition & late attribution (~1 session)**
"Did someone invite you?" searchable live-partner picker in onboarding; Settings equivalent, one-shot, pre-conversion only; source split surfaced in portal + CC.

**Piece 6 — Autofill association (rides the next native release)**
AASA + assetlinks + entitlements.

**Order:** 3 → 4 → 1 → 2 → 5, with 6 whenever the next binary ships. (3 and 4 together are the friction fix and should go first; 1 is what lets Lewis actually recruit.)

---

## 8. Decisions

| # | Decision | Status |
|---|---|---|
| 1 | Trial length | **SETTLED — 7 days for everyone** |
| 2 | PIN / email verification at signup | **SETTLED — none; confirm-email field instead** |
| 3 | Join page creates account rather than going to checkout | **SETTLED — yes** |
| 4 | Per-partner member rates (£10 vs £15 tiers) | Lewis — Piece 2 enables either |
| 5 | Agreement wording: rev share paid on *attributed* members + how attribution works | Lewis |
| 6 | Self-declared attribution payable at launch | Recommend yes, tracked separately — Dean + Lewis |
| 7 | Partner bio/why/feel limits — 60 / 400 / 200 / 160 | Dean, agreed in principle |

---

## 9. Hard constraints

- No price, buy button, or payment steer inside the app.
- Pre-applied discounts require an EF-minted Checkout Session, never a Payment Link.
- Never design attribution that depends on knowing the referrer after a fresh iOS install.
- Codes/links validate for **live** partners only.
- B2B/employer signups never carry partner attribution (already enforced in `app-signup`).
- Shell accounts (created on web, never activated) must be flagged so they don't pollute member counts or trigger engagement emails — and are the natural "you never finished" nudge list, still carrying attribution.
