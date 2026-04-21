# VYVE Health — Master Document

> **Single source of truth for the whole business.** One document, layered for different readers.
> **Last verified:** 21 April 2026 against live Supabase project `ixjfklpckgxrwjlfsaaz` and the `vyve-site` + `VYVEBrain` repos.
> **Primary audience:** Dean (CTO), Lewis (CEO), Alan (COO), Phil, Vicki, Cole, Calum. Secondary: investors, partners, enterprise prospects who sign an NDA.

---

## How to read this document

This document is **layered** — you don't have to read it all.

- **Part 1 (Executive Summary)** — 3-page snapshot. Read this first. Tells you who we are, where we are, what the next move is.
- **Part 2 (Commercial)** — business model, pricing, market, sales pipeline, charity mechanic, marketing. For Lewis, Vicki, Alan, investors.
- **Part 3 (Product)** — what the app does, the five pillars, AI personas, onboarding flow, content. For Lewis, Phil, Calum, Cole, enterprise demos.
- **Part 4 (Technical)** — architecture, databases, edge functions, security, known issues. For Dean and any engineer picking the product up.
- **Appendices** — team roles, glossary, compliance detail, known bugs, open decisions, useful URLs.

---

# PART 1 — Executive Summary

## 1.1 What VYVE Health is

VYVE Health is a UK-based Community Interest Company building a **proactive workplace wellbeing platform** for individuals and employers. We are a direct alternative to reactive EAPs and single-pillar wellbeing vendors. Our product spans three pillars — **Physical, Mental, and Social health** — unified by five AI coaching personas that personalise the member experience.

**Our tagline:** *Help yourself. Help others. Change the world.*

**The core idea in one sentence:** prevention over cure — build health before it breaks — and when people do build it, their engagement funds free access for people who can't afford it via our charity mechanic.

## 1.2 Where we are, today (21 April 2026)

| Dimension | State |
|---|---|
| **Legal** | VYVE Health CIC. Registered with Companies House. ICO registered (00013608608). |
| **Stage** | Pre-revenue · MVP live · Validation phase |
| **Members** | 17 on the platform (verified live from Supabase today). 9 have logged at least one activity. 13 joined in April 2026 — growth is accelerating off a small base. |
| **Revenue** | £0 MRR. No paying customers yet. |
| **Team** | 7 people (see section 1.6). Dean part-time until MRR hits £6K. |
| **Apps** | iOS live in the App Store. Android Build 1.0.2 awaiting Google confirmation. |
| **Pipeline** | Sage (warm, via Lewis's internal contact). HubSpot deal 495586118853 at Initial Contact. No second prospect currently. |
| **Top priority** | Ship a polished, sell-ready product by **end of May 2026**. |
| **Cash position** | Self-funded. No external capital. No grants yet. |

## 1.3 What we sell

**B2C — £20/month per individual.** Direct payment via Stripe.
**B2B — £10/user/month for employers.** Volume tiers above 200 seats still to be formally defined.
**Annual option:** 10–15% discount, pending Lewis sign-off.

The same platform serves both routes. Employers get a privacy-respecting aggregate dashboard of their members' engagement. Individual members never appear by name in employer-facing views.

## 1.4 What makes us different

1. **Proactive not reactive.** Most competitors (Unmind, Spectrum.Life, YuLife, Headspace for Work) are built around crisis support or single-discipline fitness. We build wellbeing *before* the crisis.
2. **Three pillars, one product.** Physical + Mental + Social in one membership. Most rivals are pillar-single.
3. **Community Interest Company (CIC).** In UK public-sector procurement, CIC status delivers 6–8 points of social-value scoring — real pipeline advantage for NHS, council, and government tenders.
4. **Charity mechanic.** Every 30 qualifying activities by a member or an employer's team funds one free month for someone who can't afford the platform. Your engagement has external impact. No competitor does this.
5. **Lewis Vines's story.** Authentic lived-experience founder — addiction recovery, now CEO. Built originally on top of The Everyman Podcast (35+ episodes, rebranding to The VYVE Podcast). This is a marketing moat many VCs would kill for.
6. **Economics.** 95%+ contribution margin. Break-even at around 4–5 paying members. At 100 B2C members, ~£1,930 profit/month.

## 1.5 Where we're going (next 6 weeks)

**Target: sell-ready by end of May 2026.**

Three parallel tracks:

- **Track A — Enterprise readiness.** Close the remaining gaps for Sage demo: per-employer dashboard auth, GDPR export/delete tooling, Brevo logo removal, finalised B2B pricing tiers. Lewis owns the commercial side; Dean owns the technical.
- **Track B — Platform polish.** Last readability, navigation, and performance issues being closed out (four shipped last night — see changelog for detail). Android icon fix. HAVEN clinical sign-off. Movement plan content. A push-notification cron needs a 30-minute fix.
- **Track C — Sales and content motion.** Lewis re-engaging existing enterprise warm leads. Vicki ramping outbound. Cole standing up community rituals for retention. Content queue restoration (133 social posts stuck since 23 March — Make scenario 4950386 broken).

If all three tracks hit, we enter June 2026 with a demo-ready product, Sage in active negotiation, and a content engine running again.

## 1.6 The team

Full details in Appendix A. Headline:

| Person | Role | Scope |
|---|---|---|
| **Lewis Vines** | CEO / Founder | Commercial, sales, content, AI ops, founder story |
| **Dean Brown** | CTO / Co-Founder | All technical, part-time until £6K MRR |
| **Alan Bird** | COO | Operations, governance, accessibility feedback |
| **Phil** | Mental Health Lead | HAVEN persona clinical review, mental-health content |
| **Vicki** | Sales | Outbound pipeline, enterprise prospecting |
| **Cole** | Community | Member engagement, community rituals |
| **Calum Denham** | Fitness Content | Exercise content, programme curation |

Business email: **team@vyvehealth.co.uk** — always use this for outbound business communications.

## 1.7 Top risks, worth knowing

- **Single-founder technical risk.** Dean is a lone CTO. No off-platform backup of most Edge Functions (fix in progress). The 13 April Composio wipe incident was a warning.
- **Pre-revenue runway.** Self-funded. No external capital. First contract matters.
- **Facebook Make connection expires 22 May 2026.** Lewis action item; social publisher dependency.
- **Push notifications broken since 11 April.** Known fix; 30-minute task; hasn't been prioritised.
- **HAVEN persona live but not clinically reviewed.** At least one member has been assigned HAVEN (from a serious life-context signal) without Phil's clinical sign-off yet.
- **Sage is our only live enterprise lead.** No second prospect to de-risk Sage timing.

## 1.8 The ask (implicit)

This document exists to make sure everyone on the team (and any AI we brief) can skim straight to what they need. If you're picking VYVE up for the first time, the next sensible read is **Part 2 (Commercial)** if you're revenue-facing, or **Part 4 (Technical)** if you're engineering-facing.

---

# PART 2 — Commercial

## 2.1 Mission, vision, values

**Mission.** Proactive workplace wellbeing across three pillars — Physical, Mental, Social — making measurable prevention accessible to anyone, at individual or employer level, backed by an evidence-based product and a charity mechanic that extends access to people priced out of wellbeing.

**Vision.** Become the default UK platform for proactive workplace wellbeing — the one every mid-to-large employer considers before Unmind, Spectrum.Life, YuLife, or Headspace for Work — and the one the NHS, councils, and government use to run preventative programmes at scale.

**Values (six).**

1. **Proactive, not reactive.** Act before the crisis.
2. **Evidence over assumption.** Claims backed by research. We cite Deloitte, RAND Europe, Gallup, The Lancet, University of Warwick, UCL, WHO, CIPD.
3. **People first, always.** Product and policies designed around the member, not the metric.
4. **Radical transparency.** Open communication, no hidden agendas.
5. **Long-term thinking.** Build sustainable practices, not quick wins.
6. **Health for everyone.** The charity mechanic is built-in, not bolted on.

## 2.2 Business model and pricing

### B2C — individuals
- **£20/month**, direct payment via Stripe.
- Coupons: `VYVE15` and `VYVE10` for promotional campaigns.
- Stripe payment link: `buy.stripe.com/00wfZicla1Em0NnaIB93y00` → redirects to `onboarding_v8.html` (now `welcome.html`).
- No free tier. 7-day-no-login, questionnaire-incomplete, and registered-no-activity re-engagement streams (A / B / C1 / C2 / C3) are live.

### B2B — employers
- **£10/user/month per seat.** Advertised as £20 with £10 discount so the employer's employees can see the headline price.
- **Volume tiers above 200 seats: TBD** (open decision — Lewis to finalise before the first enterprise contract). Indicative working model: 50–200 full rate, 201–500 negotiable, 500+ bespoke.
- Contact-first sales, not self-serve. HubSpot CRM tracks every prospect.
- Employer sees aggregate-only dashboard — no PII, ever.

### Annual option
- 10–15% discount under discussion. Lewis decision pending. Dean will add to Stripe once the number is confirmed.

### Revenue positioning
VYVE is positioned as a **performance investment, not a cost centre**. We use ROI framing backed by:
- **UK total cost of work-related ill health: £150 billion/year** (RAND Europe, CIPD).
- **9.4 days average sickness absence per employee, 2025** — 24-year high (CIPD).
- **41% of long-term absence driven by mental ill health** (CIPD).
- **2.8 million people economically inactive due to long-term health conditions** (ONS).
- **37% of UK employers are still purely reactive** — the TAM for proactive solutions is the remaining 63% waking up to the problem.
- **5–8% average EAP utilisation.** Even where employers already pay for wellbeing support, most staff never engage. VYVE's gamification and charity mechanic directly attack this engagement gap.
- **The Employment Rights Act SSP changes (effective 6 April 2026)** are the strongest current economic argument for preventative wellbeing.

### Series A targets (when we get there)
- £1–2 million ARR
- 10%+ month-on-month growth
- Under 8% churn
- Over 100% net revenue retention

## 2.3 Unit economics

| Line | Value |
|---|---|
| Variable cost per member | ~£0.45/month (Anthropic AI + infra share) |
| Fixed infrastructure | ~£81/month (Supabase, Anthropic cap, domain, ICO, Make, Brevo free tier) |
| B2C contribution margin | ~97.5% |
| B2B contribution margin | ~95.5% |
| Break-even | 4–5 paying members |
| 100 B2C members scenario | £2,000 MRR → ~£1,930 profit/month (96.5% margin) |
| Sage 200 members scenario | £2,000 MRR → ~£1,850 profit/month (92.5% margin) |
| Target (Dean full-time) | ~300 paying → £6,000 MRR |
| Series A (£1.5M ARR) | ~6,250 paying → £125,000 MRR, ~£119,000 profit/month |

**Scaling cost thresholds to know about.**
- **80 members:** Brevo upgrade needed (~£19/month) to cross the free-tier 300/day cap.
- **100 members:** Anthropic spend monitoring — current cap is £50/month, real usage is lower but trending up.
- **500 members:** Dedicated DPO service required (~£2–5K/year).
- **1,000 members:** Supabase compute tier upgrade likely.

All above figures from the 14 April financial report (Report 8 of 11 in `/reports/`).

## 2.4 Target market

### Three target segments

1. **Private sector enterprise.** Mid-to-large UK employers with visible wellbeing pain. Warmest targets: Sage (warm — internal contact), BT (members already on trial), Barclays, Balfour Beatty.
2. **Public sector.** NHS, local councils, government departments. CIC status is a structural advantage (6–8 extra points in social-value scoring). A full Public Sector Sales Playbook with five procurement routes is maintained in Lewis's workspace.
3. **Individuals (B2C).** Direct purchases at £20/month. Separate journey on the marketing site. Smaller revenue contribution per head, but valuable for validation, content traffic, and word-of-mouth.

### Enterprise pipeline (live state, 21 April 2026)

| Prospect | Status | Notes |
|---|---|---|
| **Sage** | Warm lead | Lewis has an internal contact (senior wellbeing lead). Most likely first enterprise client. HubSpot deal ID: 495586118853, Initial Contact stage. Two Sage members (Lewis, Kelly) are on the platform as pilot users — both currently quiet (10-11 days inactive). Lewis must re-engage both before any Sage demo. |
| **BT** | Target | Members already on trial (Callum Budzinski, Liam Carr, Logan Vines, Gary Vines, Colin White, Danielle Akin). |
| **Barclays, Balfour Beatty** | Identified | No active conversation yet. |
| **Public sector** | Ready | Playbook exists, no active tender being responded to. |

### The competitive landscape

| Category | Notable players |
|---|---|
| **Primary threats** | Unmind (£61M raised), Spectrum.Life (won AXA Health EAP, launching 'Cara' Q2 2026), YuLife (new CEO + Bupa partnership) |
| **Unstable** | Headspace for Work (15% layoffs — opportunity to approach their UK clients), Spring Health (£6–7B Alma acquisition — validates market size) |
| **Secondary** | Wellhub, BetterUp, Virgin Pulse, Champion Health, Heka, Vitality, Calm, Koa Health, Lyra Health, Thrive Global |

Lewis maintains weekly competitor deep-dive skills (one of 24 custom AI skills in his Claude workspace — see section 2.7). They produce a threat/opportunity matrix and countermeasure recommendations.

### Why we win vs the competitive set

- **Three-pillar breadth.** Most rivals are mental-only (Unmind, Headspace) or fitness-only (Wellhub, Virgin Pulse). We do both in one product.
- **CIC status.** Non-replicable procurement edge.
- **Charity mechanic.** No direct competitor has this.
- **Lewis's founder story.** Cuts through in a category dominated by clinical voices and venture-founder archetypes.
- **Economics.** Near-pure-margin business. Pricing flexibility most rivals don't have.
- **Engagement model.** Gamified five-track certificate system + leaderboards + monthly themes. Attacks the 5–8% EAP utilisation problem directly.

## 2.5 Charity mechanic

This is central to brand positioning and must not be diluted.

### Individual track
Every 30 completions of a specific activity type (30 workouts, 30 habits, 30 cardio sessions, 30 check-ins, 30 live sessions watched) unlocks one free month donated to a charity partner recipient.

### Enterprise track
Every 30 activities by a company's employees collectively funds one free month for someone in need.

### Framing
Collective impact — the team's effort funds access for someone priced out. Not a personal referral reward.

### Charity partners (five categories)
- Addiction recovery
- Homelessness and reintegration
- Mental health organisations
- Social mobility programmes
- Physical health access for underserved populations

**Status:** All five categories are documented and will take referrals. Specific named partners within each category are still to be nominated. Counters reset after each 30 activities — unlimited donations possible. Recipients pay £0. Partners pay £0 to refer.

### Why it matters commercially
- Public sector procurement advantage (social value scoring).
- Employer-side story for ESG reporting.
- Individual-member motivator that differentiates VYVE from pure fitness apps.
- Press and thought-leadership material.

## 2.6 Marketing and brand

### Brand identity

| Element | Value |
|---|---|
| Marketing site | `www.vyvehealth.co.uk` — GitHub Pages (`Test-Site-Finalv3` repo) |
| Portal | `online.vyvehealth.co.uk` — GitHub Pages (`vyve-site` repo) |
| Palette | `#0D2B2B` (dark), `#1B7878` (teal), `#4DAAAA` (teal-lt), `#C9A84C` (gold) |
| Fonts | Playfair Display (headings), DM Sans / Inter (body) |
| Tagline | Help yourself. Help others. Change the world. |
| Key message | Prevention over cure. Build health before it breaks. |

**Brand Brain** is a 16-section comprehensive brand knowledge base maintained in Lewis's Claude project. **Do not ship member-facing copy without stripping emojis first** (Lewis's hard rule). A Member Welcome Pack (8-page PowerPoint covering mission, features, app, live sessions, six monthly themes, podcast, charity, getting started) is used in enterprise pitches.

### The Everyman Podcast → The VYVE Podcast

Lewis's men's health podcast, launched February 2023, with one founding rule: no topic off limits. 35+ episodes, built around honest conversations about mental health, addiction, purpose, performance, and living well — the same territory the platform covers.

**Notable guests include:**
- Matthew Jarvis (England and Premier League footballer)
- Calum Denham (performance expert, now VYVE's fitness content lead)
- Luke Ambler (founder, Andy's Man Club — suicide prevention)
- Ray Winstone (actor, prostate cancer awareness advocate)
- Dr Tamara Russell (mindfulness researcher)
- David Wetherill (Paralympic champion)
- 3 Dads Walking (suicide prevention advocates)

Available on Spotify, Apple Podcasts, Amazon Music. Page live at `vyvehealth.co.uk/vyve-podcast.html` with a guest expression-of-interest form.

**Rebrand timing** is an open decision — full switch to "The VYVE Podcast" branding pending.

### Content production

- **Social queue:** 133 posts authored and queued.
- **Publishing pipeline:** Make scenario 4950386 is **broken since 23 March 2026.** 133 posts stuck. Lewis decision to fix has been deferred — Vicki's outbound effort partially compensates for this but the lost compounding of organic content is real.
- **Content target:** 10–14 posts/week.
- **Current output:** 6/week, below target because of the Make outage.
- **Content quality:** 4.4/5 internal average.
- **Pre-recorded sessions workflow:** Claude script → ElevenLabs → Audacity → stock footage → CapCut → Castr. Target 30 videos before hiring live instructors.

### Sales intelligence infrastructure (Lewis's 24 custom skills)

Lewis runs 24 custom AI skills in his Claude workspace, producing daily, weekly, and monthly intelligence. The most important:

- **Daily Intelligence** — 6-area scan, structured brief + top 3 actions, 7-day dedup cache.
- **Content Engine** — generates Lewis's voice across 6 platforms; one podcast becomes 5+ assets.
- **Sales Intelligence** — 8-step pre-call brief, ROI calculator, 20-competitor displacement table, objection handling.
- **Research Radar** — 4 credibility tiers, 20+ indexed studies, Stat Bank of copy-paste research lines.
- **Competitor Deep Dive** — weekly, 20+ competitors, threat/opportunity matrix, countermeasures.
- **Client Health Monitor** — green/amber/red scoring, 15+ early warning signals, tiered retention playbooks.
- **Investor & Growth Tracker** — UK health tech funding, monthly KPIs, 5 UK grants calendar, Series A prep.

Plus 17 more reusable frameworks (Personal Brand Architect, Partnership Finder, Regulatory Compliance Watch, Weekly Strategic Digest, Quality Monitor, etc).

### Other key marketing assets
- **Three Pillar Assessment Guide** — employer-facing prospect tool with scoring, maturity bands, VYVE package recommendations.
- **Public Sector Playbook** — 5 procurement routes, social value scoring, tender response template, 90-day action plan.
- **Research Library** — 20+ indexed studies + Stat Bank of copy-paste-ready statistics.

### Operational AI automations (live today)

| Cadence | Automation |
|---|---|
| Weekday mornings | Morning brief, 6-area intelligence scan, top 3 actions |
| Daily (3 posts) | LinkedIn, Instagram, Facebook (currently blocked on Make outage) |
| Weekday noon | Engagement ritual — structured community engagement playbook (30 min) |
| Daily | Publishing Monitor — error detection on Make.com publisher |
| Monday 8am | Strategic Digest — synthesis from 9 JSON data sources |
| Weekly | Competitor Deep Dive, Research Radar, Analytics Feedback, Content Intelligence |
| Month-end | Content Calendar — 25 pieces across 4 themed weeks |
| 1st of month | Thought Leadership — macro-trend synthesis report for external distribution |

### Make social analytics (Lewis-only)
- Scenario 4993944 — Instagram analytics collector (last 20 posts)
- Scenario 4993948 — Facebook analytics collector (last 20 posts)
- Scenario 4993949 — LinkedIn analytics collector (company page aggregates)
- All feed into Make Data Store 107716.

## 2.7 Founder story

Lewis Vines nearly lost his life to addiction. In a moment of crisis, standing on a train platform, he realised honest conversations — first with himself, then with the people who mattered to him — saved his life. That lived experience is the authentic foundation of VYVE's mission around mental health, proactive support, and the power of community. It powers the brand, the podcast, and the charity mechanic. It's also a PR and enterprise-pitch asset we use deliberately.

This isn't colour. It's the actual reason the product exists and why it's architected the way it is.

---

# PART 3 — Product

## 3.1 What members get

A single app — available as a Progressive Web App at `online.vyvehealth.co.uk` and as native iOS / Android apps (Capacitor-wrapped). Once onboarded, each member gets:

- **5 AI coaching personas** — NOVA, RIVER, SPARK, SAGE, HAVEN — one assigned automatically based on onboarding responses. Members can switch manually.
- **Personalised Exercise programme** — 8-week custom plan built by AI at onboarding, plus an Exercise Hub with sub-pages for Workouts (gym programmes), Movement (walking, stretching, gentle mobility), and Cardio (running, cycling, walking).
- **Daily habit tracking** — 5 habits assigned from a 30-habit library at onboarding, structured around monthly themes (April 2026 theme: "Move More").
- **Weekly wellbeing check-ins** — 1-to-10 sliders across wellbeing, energy, and stress, plus free-text. AI generates persona-voice recommendations based on the member's activity that week.
- **Monthly wellbeing check-in** — deeper 8-area assessment, AI-generated personalised monthly report.
- **AI running plan generator** — 5,376 cached combinations of goal × fitness level × days × timeframe.
- **Nutrition logging** — TDEE, macros, hydration, food diary, weight log.
- **Live sessions** — daily yoga, mindfulness, workouts; weekly check-ins and group therapy; monthly events and podcast.
- **Certificate + charity mechanic** — five tracks (Architect / Warrior / Relentless / Elite / Explorer), every 30 activities donates one free month to a charity partner recipient.
- **Community leaderboards** — privacy-protected (only members above you visible, no names or scores visible to others).

## 3.2 The five website pillars (member-facing)

The public website presents the product across **five pillars**, giving members more granular feature-level framing than the three-pillar investor/board model.

| Pillar | What it covers in the product |
|---|---|
| **Mental** | Group therapy sessions, stress management, sleep support, mental-health resources, AI coaching personas (especially RIVER, SAGE, HAVEN) |
| **Physical** | 40+ tailored workout plans, cardio, movement, wearable integration (planned), custom exercise creation |
| **Nutrition** | Evidence-based personalised guidance, no fad diets, meal planning, TDEE + macros, food diary |
| **Education** | Expert speakers, live podcast episodes, growing content library, CIPD research, Research Library, thought leadership |
| **Purpose** | Meaningful goals, lasting habits, accountability, charity mechanic, community leaderboards |

## 3.3 The three pillars (internal / investor / enterprise framing)

For board, investor, and enterprise conversations, we use the simpler three-pillar model because it maps cleanly to the Physical/Mental/Social health research canon:

| Pillar | In product terms |
|---|---|
| **Physical Health** | Exercise, Workouts, Movement, Cardio, Nutrition, wearable integration (planned) |
| **Mental Health** | Wellbeing check-ins, monthly check-ins, mindfulness, AI coaching personas, HAVEN for sensitive mental-health support |
| **Social Health** | Live sessions with chat, leaderboards, community engagement, charity mechanic, employer team features |

Both models are valid. The mapping is:
- **Nutrition** and **Physical** (website) → **Physical Health** (3-pillar)
- **Mental** (website) → **Mental Health** (3-pillar)
- **Education** and **Purpose** (website) → **Social Health** (3-pillar)

## 3.4 AI personas — the five coaches

Every member is assigned one of five AI personas during onboarding, which then sets the voice of all AI-generated content for that member (weekly check-in recommendations, monthly report, running plan AI, persona-aware weekly goals).

| Persona | Character | Typical member |
|---|---|---|
| **NOVA** | High-performance coach. Driven, data-led, precision-focused. Metrics and measurable progress. | Members with clear performance goals, high current fitness, calm baseline. |
| **RIVER** | Mindful wellness guide. Calm, empathetic, holistic. Stress, sleep, emotional balance. | Members who are stressed (low stress score), low energy, or struggling. |
| **SPARK** | Motivational powerhouse. Energetic, warm, challenge-driven. Accountability. | Mixed goals, lifestyle/consistency focus, busy lives. |
| **SAGE** | Knowledge-first mentor. Thoughtful, evidence-based. Understands the *why*. | Analytical members who want to understand the science. |
| **HAVEN** | Gentle mental-health companion. Non-judgmental, trauma-informed. | Members flagged via life-context signal (bereavement, mental-health struggle). |

### Persona assignment rules (hard rules, executed in order)
1. **HAVEN** — life-context includes "Bereavement" or "Struggling with mental health".
2. **RIVER** — stress ≤ 3 (actually stressed) OR wellbeing ≤ 4 OR energy ≤ 3.
3. **NOVA** — wellbeing ≥ 7 AND energy ≥ 7 AND stress ≥ 7 (calm) AND 1–2 goals maximum where strength/performance/muscle is dominant. Members with 3+ mixed goals always go to AI path even if scores qualify.
4. **AI decides** — everything else. SPARK is the default for mixed goals, lifestyle focus, or demanding life contexts.
5. **NEVER assign NOVA or SPARK if serious life context is flagged in Section G.**

### Critical note: the stress scale is inverted from intuition
- **1 = very stressed, 10 = very calm.** High stress score = calm, positive.
- This caused a major assignment bug (up to onboarding v45) where all persona and habit logic was backwards for stress.
- All prompts, hard rules, and reference docs now explicitly state the direction.

### Current persona distribution (live from Supabase, 21 April 2026)
Of 17 members:
- SPARK: 11
- NOVA: 3
- RIVER: 2
- HAVEN: 1 (Calum Denham — assigned by hard rule on a sensitive life-context signal; live despite the "not yet promoted" status because the rules hierarchy correctly routed it)
- SAGE: 0 yet

### HAVEN clinical status (IMPORTANT)
HAVEN is built, live, and currently assigned to one member. The persona is **not yet clinically reviewed for promotion**. Phil (Mental Health Lead) is the owner of this sign-off. Until Phil signs off, we do not promote HAVEN in marketing or enterprise pitches as a flagship capability — it's a real feature, used where the rules place it, but the copy and positioning around it is conservative.

## 3.5 Onboarding flow

The happy path end-to-end:

1. **Member pays via Stripe** (or hits the marketing site's signup link for individual paths not yet gated by payment).
2. **Redirected to `www.vyvehealth.co.uk/welcome`** (`welcome.html` in `Test-Site-Finalv3` repo). This is the 10-section questionnaire.
3. **On submit → `onboarding` Edge Function (currently v57+).** Two-phase execution:
   - **Phase 1 (fast return):** Persona assignment, habit selection (5 from library of 30), programme overview card, 3 first-week recommendations, member row written, auth user created, welcome email sent via Brevo with PWA install steps.
   - **Phase 2 (background via `EdgeRuntime.waitUntil`):** Full 8-week personalised workout JSON generated and written to `workout_plan_cache`. This can take anywhere from 4 seconds to 24 hours depending on AI path.
4. **Member logs into the portal** with the email + password they've just set.

### Known onboarding issues (from the 14 April engagement report)
- **45% activation failure rate.** Of 11 recent onboardees, 5 never logged any activity. Owen Barrett, Alan Bird — both 4–5 days post-onboarding with zero activity.
- **Workout plan generation timing is inconsistent.** Plans have been observed completing in 4 seconds, 1 minute, 80 minutes, 117 minutes, 24 hours, and (at least once, for Calum Denham) never — background generation failed silently. Plan-status tracking is on the backlog.
- **First-activity nudge (24-hour reminder) is on the backlog** — currently nothing happens if a new member doesn't log day-1.

### Onboarding error handling (shipped 10 April 2026)
The `welcome.html` form has a 90-second AbortController with an error screen and up to 3 retries — previous silent failures where timed-out submissions showed fake RIVER results (making the member think they'd onboarded when they hadn't) are resolved.

## 3.6 Habit system

- 30 habits in the library, grouped into monthly themes.
- **April 2026 theme: "Move More."**
- AI selects 5 habits per member at onboarding, weighted by persona, goals, stress score (remembering inverted scale), and life context.
- `member_habits.assigned_by` is constrained to: `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`. Any other value causes a check-constraint violation and habits fail to write. (This was a live bug in onboarding v46.)
- `daily_habits` table uses `(member_email, activity_date, habit_id)` uniqueness. Cap is 10/day, generous enough to let all 5 habits log plus margin. Over-cap inserts route to `activity_dedupe` — never discarded.

## 3.7 Exercise Hub (restructured 19 April 2026)

The "Workouts" tab was renamed "Exercise" and rebuilt as a **hub page** showing the member's active plan prominently, with cards linking to three sub-streams:

| Stream | Who it's for | Page |
|---|---|---|
| **Movement** | Low activity, returning from injury, desk workers, older adults, new to exercise. Walking, stretching, gentle mobility. | `movement.html` |
| **Workouts** | Active gym-goers, strength-focused. PPL, Upper/Lower, Full Body, Home programmes. Exercise logging, custom workouts. | `workouts.html` |
| **Cardio** | Running, cycling, walking-as-cardio. AI running plan generator lives here. | `cardio.html` |

### Status (21 April 2026)
- All five rounds of the restructure shipped (19 April).
- Movement and Cardio rebuilds shipped 20 April.
- Sub-page headers and back buttons shipped 20 April.
- All 17 current members are on `exercise_stream = 'workouts'` (default). **Movement and Cardio streams are live but no member has yet picked them** — onboarding questionnaire stream picker was added 19 April so new members will start adopting.

### Open on Exercise Hub
- **Movement plan content** — `programme_library` has no rows yet with `category='movement'`. Movement-stream members see a "no plan yet" quick-log state (with manual session logging of Walk/Stretch/Yoga/Mobility/Pilates) until content lands.
- **Backfill decision** — 18 existing members default to 'workouts'. No backfill plan yet.
- **Classes stream** on the hub — planned as cross-cutting, not yet built.

### Workout library
| Programme | Sessions |
|---|---|
| Push/Pull/Legs (PPL) | 11 workout days including Legs A + B variants |
| Upper/Lower | 8 workout days |
| Full Body | 7 workout days |
| Home Workouts | 7 workout days |
| Movement & Wellbeing | 7 content tabs |
| **Total in DB** | 244 rows across 39 workout plan days |

All 5 programmes are assigned to every member; AI recommends the weekly schedule, not the plan selection.

## 3.8 Wellbeing check-ins

### Weekly
- Accessed from the portal, typically encouraged for Monday 9am.
- Pulls the member's activity from the preceding 7 days plus their persona.
- 3 sliders (wellbeing, energy, stress — remember stress is inverted) + free-text field.
- AI generates 2–3 recommendations in the assigned persona's voice.
- Results lock on re-submit within the same week.

### Monthly
- Deeper 8-area assessment shipping end-to-end.
- AI generates a personalised monthly report.
- Shipped with `monthly-checkin.html`, `monthly_checkins` table, `monthly-checkin` Edge Function.
- Currently 0 monthly check-ins completed — expected, given cadence.

## 3.9 Certificates and charity

Five tracks, each linked to a colour and an achievement title:

| Track | Title | Colour | Milestone |
|---|---|---|---|
| Daily Habits | The Architect | `#3DB89F` | Every 30 habit completions |
| Workouts | The Warrior | `#3DB89F` | Every 30 workouts |
| Cardio | The Relentless | `#E8834A` | Every 30 cardio sessions |
| Weekly Check-ins | The Elite | `#C9A84C` | Every 30 check-ins |
| Live Sessions | The Explorer | `#3DB89F` | Every 30 sessions watched |

Each milestone:
1. Generates an HTML certificate with a **globally sequential number** (starting No. 0001) stored in Supabase Storage.
2. Triggers one free month donated to a charity partner recipient (the charity mechanic in section 2.5).
3. Sends a Brevo email to the member.

**Caps to prevent gaming:**
- Daily habits: 1 per day, per habit
- Workouts: 2 per day
- Cardio: 2 per day
- Live sessions: 2 per day
- Kahunas-style Q&A check-ins: 1 per ISO week

Over-cap inserts go to `activity_dedupe` — visible internally, not counted toward milestones.

## 3.10 Portal pages

All at `online.vyvehealth.co.uk`. Every page is gated behind Supabase Auth.

| Page | Purpose |
|---|---|
| `index.html` | Member dashboard — activity score, streaks, goals, live session, progress tracks, charity banner |
| `exercise.html` | Exercise Hub — active plan + stream cards |
| `movement.html` | Movement stream — quick-log, plan, content (content pending) |
| `workouts.html` | Gym workout programme, session logging, custom workouts, swipe-to-delete, 6 external JS modules |
| `cardio.html` | Cardio stream + running-plan hero |
| `running-plan.html` | AI running plan generator, saved plans |
| `nutrition.html` | TDEE + macros + hydration, weight log, link to food log |
| `log-food.html` | Food logging via Open Food Facts API |
| `nutrition-setup.html` | For members who skipped nutrition onboarding |
| `habits.html` | Daily habit logging, 7-day pill strip, streak + dot strip |
| `wellbeing-checkin.html` | Weekly check-in + AI recommendations |
| `monthly-checkin.html` | Monthly check-in + AI report |
| `sessions.html` | Live session listings and chat |
| `leaderboard.html` | Member leaderboard — scopes: all, company, team |
| `certificates.html` | Member certificate display and download |
| `engagement.html` | Activity score breakdown (0–100, four weighted components) |
| `settings.html` | Theme, persona change, goals, notifications, privacy |
| `login.html`, `set-password.html`, `consent-gate.html` | Auth flows |
| `strategy.html` | Internal strategy dashboard (password: `vyve2026`) |
| Live session pages | `yoga-live.html`, `mindfulness-live.html`, etc. with matching `*-rp.html` replays |

## 3.11 Live sessions

Eight session types, run via Riverside studios (7 permanent links) streamed to YouTube (8 channels) and replayed via Castr for scheduled pre-recorded content:

- Yoga, Pilates & Stretch — Daily 6:00 AM
- Mindfulness & Mindset — Daily 8:00 AM
- Workouts — Daily 7:30 AM
- Weekly Check-In — Mondays 9:00 AM
- Group Therapy — Wednesdays 12:00 PM
- Events & Run Club — Monthly (varies)
- Education & Experts — Monthly (varies)
- The VYVE Podcast — As scheduled

Cap: 2 session views per day (over-cap → `activity_dedupe`).

Live-viewer-count displays only trigger above 20 viewers (to avoid the awkward "2 people watching" state).

## 3.12 Engagement scoring

The activity score on the member dashboard (0–100) is made up of:
- Base 50 points
- **Activity** (max 12.5) — recency, full points within 24 hours, zero after 7 days
- **Consistency** (max 12.5) — distinct active days in last 30 (20+ days = full marks)
- **Variety** (max 12.5) — distinct activity types in last 7 days
- **Wellbeing** (max 12.5) — from weekly wellbeing score (1–10)

Everything is computed server-side and cached in `member_home_state` (shipped 20 April 2026). Members see their score, streaks, and personal bests; employer dashboards see only anonymised aggregates.

## 3.13 Employer dashboard

- **URL:** `www.vyvehealth.co.uk/vyve-dashboard-live.html`
- **Edge Function:** `employer-dashboard` (currently v26+)
- **Auth:** API key-based (`EMPLOYER_DASHBOARD_API_KEY` Supabase secret). Per-employer auth is on the backlog (6–8 hour task; required before Sage demo).
- **Data:** Aggregate only — no PII, ever. Active vs quiet vs inactive counts, engagement score aggregates, pillar adoption breakdowns.
- **Status definitions:** Active (0–7 days inactive), Quiet (8–30), Inactive (30+ or never).
- **Current data:** Trial/test data only — no live employer accounts yet.

Employer reporting policy is documented in `privacy.html` and the DPA template. Individual names are never visible.

## 3.14 Feature adoption today (live, 14 members of 17 with meaningful history)

Per the 14 April engagement report (most recent full audit):

| Feature | Adoption | Top user |
|---|---|---|
| Workouts | 64% (9/14) | Dean (19 sessions) |
| Daily Habits | 57% (8/14) | Dean (25 days) |
| Cardio | 43% (6/14) | Dean (9) |
| Weight Tracking | 43% (6/14) | Dean (4) |
| Sessions | 29% (4/14) | Dean (23) |
| Weekly Check-ins | 21% (3/14) | Dean (11) |
| Exercise Logging | 14% (2/14) | Dean (151 — prolific exercise-level detail) |
| Nutrition Logging | 14% (2/14) | Calum |
| Custom Workouts | 7% (1/14) | Calum |
| Running Plans | 0% | — |
| Persona Switches | 0% | — |

**What this tells us:** Dean is the single consistently active member (87 total activities). Feature breadth is being touched, but depth of engagement is low across the board. The 45% activation failure is the biggest engagement problem — members who never log Day 1 are unlikely to convert.

---

# PART 4 — Technical

## 4.1 Architecture overview

| Component | Where | Notes |
|---|---|---|
| Member portal (PWA) | GitHub Pages → `online.vyvehealth.co.uk` | Repo `VYVEHealth/vyve-site` (private) |
| Marketing site | GitHub Pages → `www.vyvehealth.co.uk` | Repo `VYVEHealth/Test-Site-Finalv3` |
| Admin dashboard | `admin.vyvehealth.co.uk` (target) | Repo `VYVEHealth/vyve-command-centre`, file committed, deployment pending |
| Backend / DB | Supabase Pro (West EU / Ireland) | Project `ixjfklpckgxrwjlfsaaz` |
| Authentication | Supabase Auth (Auth0 fully retired) | `auth.js` v2.4 with offline fast-path |
| AI | Anthropic API (Claude Sonnet 4 + Haiku 4.5) | Server-side Edge Functions ONLY |
| Email | Brevo | Free tier 300/day — ~£19/month upgrade needed at ~80 members |
| Payments | Stripe | Coupons `VYVE15`, `VYVE10` |
| Analytics | PostHog (EU endpoint) | Currently sends raw email PII — hash fix on backlog |
| CRM | HubSpot | Hub ID 148106724 |
| Automation | Make (Lewis only, social media) | Facebook connection expires 22 May 2026 — Lewis critical |
| Streaming | Riverside (7 studios) → YouTube (8 channels) | Castr for scheduled pre-recorded content |
| Podcast | Spotify, Apple, Amazon Music | `vyvehealth.co.uk/vyve-podcast.html` |

**Capacitor wrap.** The iOS and Android apps are Capacitor wrappers around the live PWA. Pushing to GitHub Pages deploys to native app users without App Store resubmission, because the app is a WebView into `online.vyvehealth.co.uk`. Capacitor handles native-only capabilities (push notifications, future HealthKit / Health Connect, orientation lock via `Info.plist` / `manifest.json`).

### Auth current state
- Supabase Auth, all portal pages gated.
- `VYVE_RETURN_TO_KEY` in localStorage for deep-link preservation.
- SSO / OAuth considered for the future, not implemented.
- Password reset routes through `set-password.html`.

### Service worker (shipped 21 April 2026)
Previously cache-first for everything. Now:
- `install` handler calls `self.skipWaiting()` after `cache.addAll` → new SW activates on the next page load, no tab-close required.
- `activate` handler calls `self.clients.claim()` alongside old-cache purging → existing open tabs immediately switch.
- **HTML navigations** (`req.mode === 'navigate'`, `.html`, or `/`) use network-first — every page reload fetches the latest HTML from GitHub Pages and falls back to cache only when offline.
- Static assets (JS, CSS, images) use cache-first with network fallback.
- Cross-origin and any `/functions/*` or `/auth/*` call bypass the SW entirely.

**Practical implication:** HTML changes reach users on the next reload without a cache bump. JS/CSS/asset changes still require a cache bump. Current cache version: `vyve-cache-v2026-04-21f-navjs-body-prepend`.

### Navigation injection rules (nav.js)
- Mobile top header: `position: sticky; top:0; height:56px; injected via document.body.prepend()` — **NOT** inside `#app` or `#skeleton`.
- Bottom nav: `position: fixed; bottom:0; z-index:9999; ~62px + safe-area-inset-bottom`. Injected via `document.body.appendChild()`.
- Body gets `padding-bottom: calc(62px + env(safe-area-inset-bottom, 0px)) !important`.
- Any page-level sticky element must use `top:56px` on mobile, not `top:0`.
- Modals must use `z-index:10001` minimum.
- **All nav chrome lives at document.body level** — nav visibility is independent of any page's `#app`/`#skeleton` loading state. Do not revert to `insertBefore(main, ...)` injection — it broke exercise/movement pages on 20 April 2026.

## 4.2 Database (Supabase — 70 tables live)

Project ID: `ixjfklpckgxrwjlfsaaz` (West EU / Ireland, Pro plan). Verified via live SQL, 21 April 2026.

**Email is the primary key across all member-scoped tables.** All RLS enabled.

### Core member and activity tables
`members`, `daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `kahunas_checkins`, `weekly_scores`, `wellbeing_checkins`, `monthly_checkins`, `ai_interactions`, `ai_decisions`, `activity_dedupe`, `session_chat`

### Exercise and workout tables
`workout_plans` (244 rows), `workout_plan_cache` (one row per member, JSONB), `exercise_logs`, `exercise_swaps`, `exercise_notes`, `custom_workouts`, `member_running_plans`

### AI and persona tables
`personas` (5 rows), `persona_switches`, `running_plan_cache` (5,376 cacheable combinations), `weekly_goals`, `knowledge_base`

### Habit and nutrition tables
`habit_themes` (5 rows), `habit_library` (30 rows), `member_habits`, `nutrition_logs`, `nutrition_my_foods`, `nutrition_common_foods` (125 rows), `weight_logs`

### Aggregation tables (EF service-role only, no client policies)
`member_stats`, `member_activity_daily`, `member_activity_log`, `member_home_state`, `member_notifications`, `company_summary`, `platform_metrics_daily`, `admin_users`, `vyve_job_runs`

Refreshed by:
- `refresh_member_home_state(p_email)` — member-triggered or EF-triggered
- `recompute_all_member_stats()` — every 15 min
- `rebuild_member_activity_daily()` — nightly 03:00 UTC

### Operational tables
`service_catalogue` (21 rows), `certificates`, `employer_members`, `engagement_emails` (A/B/C1/C2/C3 streams), `qa_submissions`, `platform_alerts`, `push_subscriptions`

### Activity caps (DB-level, not application-level)
`enforce_cap_*` triggers on `workouts`, `cardio`, `daily_habits`, `kahunas_checkins`, `session_views` block over-cap inserts and route them to `activity_dedupe`. Do not duplicate cap logic in the application layer.

### Email lowercasing (automatic)
`zz_lc_email` triggers on 42 tables lowercase `member_email` on every INSERT/UPDATE. Application code does not need to `.toLowerCase()` before writing.

### Live counts (21 April 2026)
| Table | Rows |
|---|---|
| members | 17 |
| workouts | 45 |
| cardio | 12 |
| daily_habits | 100 |
| wellbeing_checkins | 14 |
| monthly_checkins | 0 |
| session_views | 48 |
| workout_plan_cache | 15 |
| member_running_plans | 0 |

## 4.3 Edge Functions

~20 core operational Edge Functions in active use. Latest versions:

| Function | Version | Purpose |
|---|---|---|
| `onboarding` | v57+ | New member onboarding (two-phase, persona + habits + programme + welcome) |
| `member-dashboard` | v30+ | Member dashboard data API — JWT-only, no `?email=` fallback |
| `wellbeing-checkin` | v22+ | Weekly check-in + AI recommendations |
| `monthly-checkin` | v5+ | Monthly check-in + AI report |
| `log-activity` | v8+ | PWA activity logging — replaced Make for all activity writes |
| `employer-dashboard` | v26+ | Aggregate employer analytics, API-key auth |
| `anthropic-proxy` | v5+ | Running plan AI calls |
| `send-email` | v16+ | Brevo transactional sends |
| `re-engagement-scheduler` | v6+ | Daily cron 08:00 UTC — streams A/B/C1/C2/C3 |
| `daily-report` | v16+ | Daily cron 08:05 UTC |
| `weekly-report` | v6+ | Monday 08:10 UTC |
| `monthly-report` | v6+ | 1st of month 08:15 UTC |
| `certificate-checker` | v10+ | Daily cron 09:00 UTC — generates HTML certs with global sequential numbers |
| `certificate-serve` | v7+ | Serves certificate HTML |
| `github-proxy` | v15+ | GitHub read/write to `vyve-site` — requires `x-proxy-key` header |
| `off-proxy` | v9+ | Open Food Facts proxy for `log-food.html` |
| `send-session-recap` | — | Session recap emails |
| `send-journey-recap` | — | Journey recap emails |
| `backfill-auth-users` | — | Auth user creation utility |
| `internal-dashboard` | — | Internal metrics |
| `ops-brief` | — | Ops brief generation |
| `habit-reminder` | v4+ | Push notification cron (**currently failing since 11 April**, see section 4.7) |
| `streak-reminder` | v4+ | Push notification cron (**currently failing since 11 April**) |
| `send-test-push` | v4+ | Push notification test tool |
| `warm-ping` | — | Supabase warm-ping every 5 minutes |

### Deployment rules
- Full `index.ts` required — no partial updates.
- `verify_jwt: false` is the VYVE pattern; all EFs do internal JWT validation via `supabase.auth.getUser()` where needed.
- CORS restricted to `https://online.vyvehealth.co.uk` and `https://www.vyvehealth.co.uk` where applicable (since 11 April remediation).

### ~89 dead one-shot Edge Functions
Noted in the 9 April security audit. Not causing harm, but clutter. Deletion script exists in `vyve_security_audit_2026-04-09.md` and can be run when convenient.

## 4.4 Repo structure — `vyve-site`

Single-file HTML pages, self-contained inline CSS/JS. No build process, no bundler. Full list of active pages in Part 3 section 3.10.

**Shared client-side files:**
- `auth.js` (17KB, v2.4) — Supabase Auth client + offline fast-path
- `nav.js` (18KB) — desktop nav, mobile header, bottom nav, more-menu, avatar panel (all injected at `document.body` level)
- `theme.js` (4.4KB) — dark/light theme switching, persisted in `localStorage`, `data-theme` attribute on `<html>`
- `theme.css` (6.8KB) — token layer (see section 4.8 Design System)
- `sw.js` (4KB) — service worker (network-first HTML, cache-first assets)
- `vapid.js` (2.6KB) — Web Push VAPID subscribe on user gesture
- `tracking.js` (8.5KB) — PostHog wiring
- `offline-manager.js` — offline state / retry orchestration
- `supabase.min.js` (185KB) — Supabase JS client

**Workout modules** (loaded by `workouts.html`): `workouts-config.js`, `workouts-programme.js`, `workouts-session.js`, `workouts-builder.js`, `workouts-exercise-menu.js`, `workouts-notes-prs.js`, `workouts-library.js`.

**Legacy:** `VYVE_Health_Hub.html` (183KB standalone demo, not part of portal — candidate for deletion, confirmed unused).

## 4.5 Brain repo structure — `VYVEBrain`

```
├── README.md
├── brain/
│   ├── master.md              ← this document
│   ├── changelog.md           ← dated session entries
│   ├── schema-snapshot.md     ← live DB schema (refreshed periodically)
│   ├── audit_updates.md       ← post-audit remediation log
│   ├── how-to-use.md          ← human operator guide
│   ├── startup-prompt.md      ← canonical AI startup prompt
│   └── sessions/              ← long-form session notes
├── audits/                     ← 11 April full audit + remediation plan
├── reports/                    ← 14 April 11-report audit series
├── plans/                      ← exercise-restructure, admin-dashboard, accessibility, etc
├── playbooks/                  ← architect, brain-sync, bug-fix, build, debug, execution,
│                                 feature-build, github-operator, optimise, phase-c-offline-build,
│                                 refactor, repo-audit, research, review
├── prompts/                    ← cold-start prompt
├── staging/                    ← EF source backups (currently only onboarding_v67.ts — not enough)
└── tasks/
    ├── backlog.md
    ├── task-template.md
    ├── open/, blocked/, completed/
```

### How the brain is used
Any AI (Claude, ChatGPT, Gemini, whatever is available) can load this repo and immediately operate on VYVE. Dean pastes `prompts/cold-start.md` as the first message of a new session, or attaches `brain/master.md` if the tool supports file upload. This makes Dean's technical productivity resilient to any single AI tool going down or changing.

## 4.6 Security state (live, 21 April 2026)

Based on the 11 April remediation, the 14 April audit series, and subsequent fixes. All 8 remediation plan fixes are complete.

### What's locked down
- `github-proxy` v15 — `x-proxy-key` header auth + CORS restricted to `online.vyvehealth.co.uk`.
- `member-dashboard` v30 — JWT-only, no `?email=` fallback, no hardcoded dev emails.
- `onboarding` v57+ — CORS restricted to `www.vyvehealth.co.uk`, error alerting, answers backup.
- `send-email` v16 — auth + CORS + model name fix.
- `employer-dashboard` v26 — unauthenticated fallback removed, API-key required.
- `session_chat` RLS — SELECT restricted to authenticated users.
- 20 duplicate RLS policies dropped from 7 tables.
- 2 duplicate indexes dropped from `exercise_notes`.
- `re-engagement-scheduler` v6 — invalid model name fixed.

### What still has open risk
- **PostHog raw email PII** — emails sent to PostHog unhashed. Should hash client-side before send.
- **Service-role key refactor** — some member-scoped EF queries use `SUPABASE_SERVICE_ROLE_KEY` where a user JWT would be cleaner (A4 from master action plan, ~1 hour).
- **XSS audit on AI `innerHTML` rendering** — AI-generated content is rendered via `innerHTML` in places; should be audited for safety (A5, ~30 min).
- **Onboarding race condition ordering** — documented edge case (C2, ~1 hour).
- **Dashboard over-fetching** — some dashboards fetch more than they need client-side; server-side aggregation would be cleaner at scale (C3, ~2 hours).
- **B1** — 13 one-shot migration EFs still to delete.

### Known issue (post-security-audit)
After the audit shipped, the `member-dashboard` EF now requires a valid user JWT. If the auth session hasn't initialised before the dashboard fetch fires, some users see a blank/error state. Dean investigating as of 11 April — the subsequent home-state wire-up (20 April) should also help.

## 4.7 Current active incidents

From the 14 April system-health report + today's verification:

### 1. Push notifications broken since 11 April (HIGH)
- `habit-reminder` (20:00 UTC) + `streak-reminder` (18:00 UTC) both failing
- Root cause: `app.service_role_key` not configured; Bearer token concatenation produces malformed JSON
- **Fix effort: 30 minutes.** Rewrite cron SQL to remove Authorization header and let the EF handle auth.
- Impact: members receive zero push notifications for 10+ days.

### 2. Make social publisher broken since 23 March (MEDIUM)
- Make scenario 4950386 has failed
- 133 social posts stuck and un-published
- Lewis decision has deferred the fix
- **Action:** Lewis to either fix Make or migrate publishing to an alternate path.

### 3. Facebook Make connection expires 22 May 2026 (CRITICAL, time-bound)
- Lewis action item
- Hard cutoff — if missed, Facebook posting breaks

### 4. Four client-side JS bugs (LOW-MEDIUM)
- `workouts-library.js:40` — SyntaxError: Invalid token
- `yoga-live.html:142` — `switchTab` not defined
- `index.html:853` — `getTimeGreeting` not defined
- `workouts.html` — `showToast` not defined
- **Fix effort: 2–3 hours total.**

## 4.8 Design System

Phase A (tokens) and Phase B (semantic colour migration) shipped 17 April 2026. Phase C (session-page template consolidation — 14 stubs + 4 shared files) also 17 April. **Phase B refinement shipped 21 April 2026** — semantic token layer (`--label-*`, `--fill-*`, `--line-*`) for proper light-mode readability across 12 portal pages. Phases D (components) and E (typography/spacing) are open backlog items.

### Tokens in `theme.css`

**Brand accents** (`:root`):
`--teal`, `--teal-lt`, `--teal-xl`, `--teal-dark`, `--green`, `--amber`, `--coral`, `--font-head`, `--font-body`

**Semantic aliases:**
`--success`, `--success-soft`, `--success-strong`, `--warning`, `--warning-soft`, `--warning-strong`, `--danger`, `--danger-soft`, `--danger-strong`, `--gold`, `--gold-soft`

**Activity track colours:**
| Token | Hex | Activity |
|---|---|---|
| `--track-habits` | `#4DAAAA` | Daily Habits |
| `--track-workouts` | `#E09B3D` | Workouts |
| `--track-cardio` | `#E06060` | Cardio |
| `--track-sessions` | `#9B7AE0` | Sessions |
| `--track-nutrition` | `#2D9E4A` | Nutrition |

**Habit pot colours:**
| Token | Hex | Theme |
|---|---|---|
| `--pot-movement` | `#4DAAAA` | Movement (shared with `--track-habits`, intentional) |
| `--pot-nutrition` | `#2D9E4A` | Nutrition (shared with `--track-nutrition`, intentional) |
| `--pot-mindfulness` | `#5BA8D9` | Mindfulness |
| `--pot-social` | `#E879A3` | Social |
| `--pot-sleep` | `#6366B8` | Sleep |

**Scales:**
- Spacing: `--space-0` through `--space-16`
- Typography: `--text-2xs` through `--text-4xl` + weights
- Radius: `--radius-sm` / `--radius` / `--radius-lg` / `--radius-xl` / `--radius-pill` / `--radius-circle`
- Shadow: `--shadow-sm/md/lg` + `--shadow-glow-teal`

### Semantic Token Layer (shipped 21 April 2026)

Three families of theme-aware tokens. Values differ for `[data-theme="dark"]` (default) and `[data-theme="light"]`. All legacy tokens (`--text`, `--surface`, `--border`, `--muted`, `--on-accent`, `--white`, `--surface-hover`, `--surface-teal`, `--border-teal`) are kept as back-compat aliases pointing into this layer.

- **Text tokens:** `--label-strong`, `--label-medium`, `--label-weak`, `--label-accent`, `--label-accent-strong`, `--label-eyebrow`, `--label-heading-em`, `--label-on-accent`, `--label-success`, `--label-warning`, `--label-danger`
- **Fill tokens:** `--fill-subtle`, `--fill-subtle-hover`, `--fill-accent`, `--fill-accent-hover`, `--fill-accent-strong`, `--fill-success`, `--fill-warning`, `--fill-danger`
- **Line tokens:** `--line-subtle`, `--line-accent`, `--line-accent-strong`, `--line-success`, `--line-warning`, `--line-danger`

**Usage rules:**
- New CSS rules MUST use semantic tokens. Do not reach for `--teal-lt` or `--teal-xl` as text colours — those are graphical accents only and fail WCAG AA contrast on light backgrounds.
- For filled accent backgrounds (teal/green buttons), text must use `--label-on-accent` (always white).
- Nav chrome (desktop nav, mobile header, bottom nav, more-menu, avatar panel) is **locked dark** in both themes — it does not flip with `[data-theme="light"]`. `theme.css` has a scoped override block that pins nav containers to dark token values regardless of active theme.
- All contrast verified WCAG AA compliant on both themes before 21 April ship.

## 4.9 Offline architecture (shipped 17 April 2026)

- `offline-manager.js` handles retry queues and connection state.
- Service worker caches static assets.
- Indexed DB holds pending writes while offline.
- On reconnect, queued writes flush through.
- Only critical activity writes (habit completion, workout log, weight log) are queued — analytics and non-essential writes are dropped.

## 4.10 Capacitor mobile apps

- iOS: **Live in App Store.** Icon issue resolved (Build 2 uploaded).
- Android: **Build 1.0.2 submitted, awaiting Google review confirmation.**
- Both wrap the live PWA via WebView.
- GitHub Pages push → native app users see the change on next launch (no App Store resubmission needed unless Capacitor config changes).
- Capacitor handles: push notifications (Web Push VAPID + iOS APNS where native enabled), orientation lock, safe-area handling, icon / splash.
- HealthKit / Health Connect integration is scoped but not built.

### Web Push (VAPID) — live
- `vapid.js` loaded on `index.html` — subscribes on bell tap (iOS requires user gesture), saves to `push_subscriptions` table.
- `sw.js` — `push` event listener + `notificationclick` listener live.
- `habit-reminder` v4 + `streak-reminder` v4 — full RFC 8291 AES-GCM encryption via Deno Web Crypto.
- VAPID public key: `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`.
- `VAPID_PRIVATE_KEY` secret set in Supabase.
- **Rule:** Apple push requires RFC 8291 encryption. `esm.sh` imports fail in Supabase EFs — always use Deno Web Crypto only.
- **Rule:** iOS push only works from home-screen-installed PWA or the native Capacitor build (Safari 16.4+).

## 4.11 Hard rules (NEVER BREAK)

These rules have been earned through shipped bugs. Any AI or engineer working on VYVE must observe them.

1. **API keys NEVER in HTML or GitHub.** Server-side Edge Functions only.
2. **Auth0 is dead.** Never reference it in docs or code.
3. **Kahunas / PAD are dead.** Product is "VYVE Health app" in all member-facing copy.
4. **Never say "Corporate Wellness"** as tagline or descriptor.
5. **`sw.js` cache must be bumped after every portal asset push.** Pattern: `vyve-cache-v2026-04-[date][letter]`. HTML-only changes do not require a bump since network-first was shipped 21 April.
6. **EF deploys require full `index.ts`** — no partial updates.
7. **Dual dark/light CSS blocks.** `theme.js` must load before `</head>`.
8. **Employer dashboard = aggregate only.** No PII, ever.
9. **HAVEN must signpost professional help** if a member is in crisis. Clinical sign-off required before promotion.
10. **Password reset emails route to `set-password.html`.**
11. **GitHub writes via `github-proxy` EF PUT** (requires `x-proxy-key` auth). Composio MCP is READ-ONLY for `vyve-site`.
12. **`workouts.html` uses MutationObserver on `#app`.** Never revert to `waitForAuth`.
13. **Business email: `team@vyvehealth.co.uk`.** Never Dean's or Lewis's personal email.
14. **Dean does not use Make.** Lewis only.
15. **Stress scale: 1 = very stressed, 10 = very calm.** Never treat high stress as negative.
16. **`member_habits.assigned_by`** only allows `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`.
17. **Nav overlap:** sticky elements use `top:56px` on mobile (not `top:0`). Bottom nav `z-index:9999`. Modals `z-index:10001+`.
18. **Modal sheets must `stopPropagation`** on the sheet element.
19. **Settings cache:** `vyve_settings_cache` in localStorage, 10-min TTL, keyed to user email.
20. **Habit count = distinct `activity_date` values**, not raw rows. Cap 10/day.
21. **`verify_jwt: false` is the VYVE pattern.** All EFs do internal JWT validation.
22. **AI stays server-side:** all Anthropic calls via Edge Functions only.
23. **Lewis dislikes emojis.** Strip all emoji from member-facing content and marketing copy before commit.
24. **Talk first, build second.** Dean prefers to discuss architecture/product decisions before implementation. Once confirmed, execute fully and autonomously.
25. **Large HTML files (>50KB):** use `github-proxy` PUT, not inline Composio commits.
26. **Never pass file content via inline `COMPOSIO_MULTI_EXECUTE_TOOL`** — use the workbench.
27. **Dean does not run SQL manually.** DDL deploys via one-shot EFs using the `postgres` Deno driver.
28. **Build speed translation:** "1 week" = 1–2 focused days. "2–3 weeks" = 3–5 days.
29. **GDPR / UK compliance by default.** RLS on all user / employer data. Anonymisation for workforce insights.
30. **Large-file EF deploys (>10KB):** always read from GitHub, store in variable, pass to deploy. Never inline.
31. **`sw.js` activate: NO page migration.** The activate handler deletes old caches only. Migration causes stale/broken pages to persist.
32. **Never inject `<script>` tags via naive string search.** The `</script>` in the injected tag will terminate any `<script>` block it lands inside.
33. **Most aggregation tables are service-role only.** `member_stats`, `member_activity_daily`, `member_activity_log`, `company_summary`, `platform_metrics_daily`, `admin_users`, `vyve_job_runs` have RLS enabled with NO policies — readable only from EFs. `member_home_state` is the exception: RLS-enabled with a policy allowing `auth.email() = member_email` read, so members can read their own aggregate row directly. All writes still go through `refresh_member_home_state(p_email)` only.
34. **Activity caps are DB-level.** Do not duplicate cap logic in application layer.
35. **Email lowercasing is automatic.** `zz_lc_email` triggers on 42 tables.
36. **Aggregation trigger functions must be `SECURITY DEFINER`.**
37. **Nav chrome stays dark in light theme.** Desktop nav, mobile-page-header, bottom nav, more-menu, avatar panel all remain on the dark-theme palette regardless of `[data-theme="light"]`.
38. **nav.js injects nav chrome at `document.body` top**, not inside `#app` or `#skeleton`. Use `document.body.prepend()`.
39. **New portal pages must load 4 standard scripts in order:** `theme.js`, `auth.js`, `nav.js`, `offline-manager.js`. Do not roll your own top-bar markup.
40. **Mobile `.wrap` padding template:** `padding: 24px 16px 100px` at `@media(max-width:768px)`. 24px top clears mobile header; 100px bottom clears bottom nav.
41. **Use the semantic token layer for new CSS.** Reserve `--teal-lt` and `--teal-xl` for graphical accents only.
42. **HTML cache-bumps are no longer mandatory** (post-21 April network-first). Still bump for JS/CSS/asset changes.

## 4.12 Platform priorities to ship by end of May 2026

In rough priority order:

1. **Per-employer dashboard auth** (6–8 hours) — required before Sage demo.
2. **Push notification cron fix** (30 min) — 10+ days of missed notifications is a retention hit.
3. **GDPR export + delete tooling** (9–11 hours) — Article 20 and Article 17 compliance, required for enterprise procurement.
4. **Brevo logo removal** (~$12/month, Lewis action).
5. **B2B volume discount tiers** — Lewis decision, Dean adds to Stripe.
6. **Health disclaimer sign-off** — Lewis, for App Store listing + onboarding checkbox.
7. **HAVEN clinical review** — Phil, before we promote HAVEN in marketing.
8. **Movement plan content** — Calum / Lewis, before Movement stream is a meaningful member offering.
9. **Session recommender** (post-check-in, recommends a session based on mood / energy / time).
10. **Persona context modifier system** — extra prompt block based on onboarding flags (Age 50+, beginner, time-poor, new parent).
11. **First-activity nudge** (24-hour reminder) — addresses the 45% activation failure.
12. **Weekly progress summary email** (Friday, AI-generated, Brevo).
13. **Facebook Make connection renewal** — before 22 May.
14. **Make social publisher fix** or alternative — to unstick 133 posts.
15. **Security follow-ups:** PostHog PII hashing, XSS audit, service-role refactor, onboarding race condition.
16. **Exercise Hub completion:** Movement content in `programme_library`, Classes stream on hub, backfill decision for existing 18 members.

---

# APPENDICES

## Appendix A — Team

| Person | Role | Scope |
|---|---|---|
| **Lewis Vines** | CEO / Founder | Owns commercial, sales, content, AI operations, brand. Has the founder story. Decision authority on pricing, HAVEN activation, marketing, product copy. Internal contact at Sage. |
| **Dean Brown** | CTO / Co-Founder | Owns the full technical stack — Supabase, Edge Functions, PWA, Capacitor apps, CI/CD via GitHub Pages, brain repo. Part-time until MRR reaches £6K/month. Uses VYVEBrain + Claude / ChatGPT / Gemini interchangeably. |
| **Alan Bird** | COO | Operations, governance, daily updates, accessibility feedback (Alan's Large-Text feedback is the reason the Accessibility plan exists). Flagged real member issues during product testing. |
| **Phil** | Mental Health Lead | Clinical sign-off owner for HAVEN persona. Mental-health content, safe-messaging standards, professional-help signposting quality. Phil's sign-off is the gate to promoting HAVEN in marketing. |
| **Vicki** | Sales | Outbound sales pipeline, enterprise prospecting, SDR work, top-of-funnel for new logos beyond Sage. |
| **Cole** | Community | Member engagement, community rituals, retention play, live-session presence, leaderboard / charity narrative inside the community. |
| **Calum Denham** | Fitness Content | Exercise programme curation, workout library content, PT-reviewed programming. Featured Everyman/VYVE Podcast guest. Current platform member. |

## Appendix B — Legal and compliance

| Item | Status |
|---|---|
| **Legal name** | VYVE Health CIC (Community Interest Company) |
| **Companies House** | Registered |
| **Business contact** | team@vyvehealth.co.uk |
| **ICO Registration** | 00013608608 — registered March 2026, £52/year renewal |
| **DPA template** | Complete — replace `[CLIENT ORGANISATION NAME]` with client name before sending |
| **DPIA** | Complete — next review September 2026 |
| **Data Retention Policy** | Complete |
| **Breach Notification Procedure** | Complete |
| **Privacy Policy** | Live at `www.vyvehealth.co.uk/privacy.html` |
| **Terms of Service** | Live at `www.vyvehealth.co.uk/terms.html` |
| **Compliance calendar** | CIC36 filings, DPIA reviews, insurance renewals, HSE audits documented |
| **Google SCCs** | NOT in place — team@vyvehealth.co.uk is a personal Google account. Migrate to Workspace after first enterprise contract. |
| **External DPO** | Required before 500 members — budget £2–5K/year |
| **Employer reporting** | Aggregate only — no individual names ever visible to employers |
| **WHISPA Programme** | £3.7M research programme launching May 2026 — potential research partnership. Lewis monitoring. |

### GDPR data categories and processors
Four of ten data categories are **Article 9 special category data:** health & wellbeing scores, physical measurements, sleep data, injury & medical. This data is sent to Anthropic (US) for AI processing. The Article 9 consent wording in the member T&Cs needs review and is on the enterprise-readiness checklist.

Third-party processors:

| Processor | Location | Data | Risk |
|---|---|---|---|
| Supabase | EU (Ireland) | All member data | Low |
| Anthropic | US | Full profiles including health data | **High** |
| Brevo | EU (France) | Email, name | Low |
| Stripe | US / EU (Ireland) | Payment data | Low |
| PostHog | US (EU endpoint) | Email (unhashed — fix on backlog) | Medium |
| GitHub | US | Source code | Low |
| HubSpot | EU | Sales CRM | Low |
| Make | EU | Social content metadata | Low |

## Appendix C — Compliance for enterprise procurement

Questions Sage and similar are likely to ask, with pre-drafted answers (the `reports/09-enterprise-readiness.md` file has the full set of 12):

1. **Data hosted:** Supabase Pro, West EU (Ireland).
2. **Encrypted at rest:** AES-256 via AWS.
3. **Encrypted in transit:** TLS 1.2+.
4. **Access control:** RLS on 70 tables; JWT auth; service-role key server-side only.
5. **Authentication:** Supabase Auth; individual credentials; no shared accounts.
6. **Backup:** Daily + PITR (7-day retention), WAL archiving active. Off-platform EF backup is on the backlog.
7. **Uptime target:** 99.5%.
8. **Breach response:** Documented procedure, ICO notification path in place.
9. **Data residency:** EU (Ireland) for primary data.
10. **AI processing:** Anthropic (US) — special category data flagged.
11. **Member data export:** Article 20 tool on backlog.
12. **Member deletion:** Article 17 tool on backlog.

## Appendix D — Key URLs and identifiers

| Reference | Value |
|---|---|
| Supabase Project ID | `ixjfklpckgxrwjlfsaaz` (West EU / Ireland, Pro plan) |
| Supabase host | `db.ixjfklpckgxrwjlfsaaz.supabase.co` |
| Supabase Postgres version | 17.6.1.084 |
| PostHog key | `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl` |
| Stripe payment link | `buy.stripe.com/00wfZicla1Em0NnaIB93y00` → `welcome.html` |
| Stripe coupons | `VYVE15`, `VYVE10` |
| HubSpot | `app-eu1.hubspot.com` · Hub ID: 148106724 |
| Sage deal | HubSpot ID 495586118853 (Initial Contact stage) |
| Google Drive backups | Folder ID `1h1kUDQiC8UQRrfaZhZNeTQKxcBdcNDSN` |
| Action Ticks sheet | Google Sheet ID `1QyD_HGDGlDPC6oLaaFUF_9GYvL9hbak-aevxK0F-Hgg` |
| Credentials reference | Google Sheet ID `1eLZMb7O9D2AdwKf6PDyCwTTHYQbDjrcGUk9PyrGayWs` |
| Strategy dashboard | `online.vyvehealth.co.uk/strategy.html` (password: `vyve2026`) |
| Demo reset | `online.vyvehealth.co.uk/index.html?reset=checkin` |
| VYVE logo | `online.vyvehealth.co.uk/logo.png` |
| Podcast page | `www.vyvehealth.co.uk/vyve-podcast.html` |
| github-proxy PUT | `https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/github-proxy?path=FILE.html` (requires `x-proxy-key`) |
| Make social publisher | Scenario 4950386 — BROKEN since 23 March |
| Make analytics collectors | Scenarios 4993944, 4993948, 4993949 → Data Store 107716 |
| Facebook Make connection expiry | **22 MAY 2026** — Lewis to renew urgently |
| Onboarding form (current) | `www.vyvehealth.co.uk/welcome` (= `welcome.html` in `Test-Site-Finalv3`) |

## Appendix E — Open decisions

Things that are waiting on someone to decide, not on someone to build:

| Decision | Owner | Blocking |
|---|---|---|
| B2B volume discount tiers (201–500, 501+ seats) | Lewis | First enterprise contract |
| Annual pricing discount % | Lewis | Stripe setup |
| Weekly check-in slider wording (mirror onboarding questions) | Lewis | UX consistency |
| Health disclaimer wording | Lewis (draft ready) | App Store listing, onboarding checkbox |
| Make social publisher — fix vs replace | Lewis | Content output recovery |
| Wellbeing Scorecard hosting URL + form submission owner | Lewis + Dean | Lead-capture asset |
| "Today's Progress" strip copy and framing | Lewis | Dashboard build |
| Podcast rebrand timing (Everyman → VYVE) | Lewis | Content alignment |
| HAVEN go-live promotion | Phil (clinical review) | Marketing positioning |
| Google Workspace migration | Lewis | First enterprise contract (then action) |
| External DPO service | Dean / Lewis | 500-member threshold |
| 5 disabled Make tasks — keep or remove | Lewis | Workspace cleanliness (LinkedIn article, podcast brief, LinkedIn newsletter, PR pitch, employee advocacy pack) |

## Appendix F — Retired tech (never suggest)

| Technology | Replacement |
|---|---|
| Google Sheets (for portal data) | Supabase |
| Apps Script (for portal) | Edge Functions (only Action Ticks strategy sheet + backup.gs remain permanently) |
| Typeform | `welcome.html` questionnaire |
| Looker Studio | HTML dashboards on GitHub Pages |
| Auth0 | Supabase Auth (fully retired) |
| PAD / Kahunas | PWA / Capacitor apps (never reference "Kahunas" in member-facing copy) |
| Make (for Dean) | Dean no longer uses Make. Lewis only. All activity logging via `log-activity` EF v8. |

## Appendix G — Glossary

| Term | Meaning |
|---|---|
| **B2B** | Business-to-business — employer/enterprise contracts |
| **B2C** | Business-to-consumer — individual £20/month subscriptions |
| **CIC** | Community Interest Company — UK legal structure with social value / procurement advantages |
| **CIPD** | Chartered Institute of Personnel and Development — source of the key workplace absence / sickness statistics we cite |
| **DPA** | Data Processing Agreement |
| **DPIA** | Data Protection Impact Assessment |
| **DPO** | Data Protection Officer |
| **EF** | Supabase Edge Function |
| **HAVEN** | One of the five AI personas — gentle mental-health companion, non-judgmental, trauma-informed |
| **ICO** | Information Commissioner's Office — UK data protection regulator |
| **NOVA** | One of the five AI personas — high-performance coach |
| **PPL** | Push/Pull/Legs — gym programme format |
| **PWA** | Progressive Web App |
| **PostHog** | Analytics platform — EU endpoint |
| **PSS** | Public Sector Sales |
| **RAND Europe** | Non-profit research institute — source of NHS / workplace cost research |
| **RIVER** | One of the five AI personas — mindful wellness guide |
| **RLS** | Row-Level Security (Postgres feature) |
| **SAGE** | One of the five AI personas — knowledge-first mentor |
| **SPARK** | One of the five AI personas — motivational powerhouse |
| **SSP** | Statutory Sick Pay — UK employer obligation |
| **TDEE** | Total Daily Energy Expenditure — nutrition calorie target calculation |
| **VAPID** | Voluntary Application Server Identification — Web Push protocol |
| **VYVE Brain** | The VYVEBrain GitHub repo — source-of-truth for AI-assisted operations |
| **WHISPA** | UK Government's £3.7M workplace wellbeing research programme launching May 2026 |
| **WCAG** | Web Content Accessibility Guidelines |
| **Stress (inverted)** | VYVE-specific: stress slider is 1 (very stressed) → 10 (very calm). High score = good. |

## Appendix H — Pointers into the brain repo

Where to go for more detail on each topic:

| Topic | Path |
|---|---|
| Latest session history | `brain/changelog.md` (223K chars — prepended chronologically) |
| Live DB schema | `brain/schema-snapshot.md` (cron-refreshed) |
| Post-audit remediation tracking | `brain/audit_updates.md` |
| 11 April full system audit | `audits/VYVE_Full_System_Audit_2026-04-11.md` |
| 11 April remediation plan | `audits/VYVE_Remediation_Plan_2026-04-11.md` |
| 14 April 11-report audit series | `reports/01-security-audit.md` through `reports/11-master-action-plan.md` |
| Task backlog | `tasks/backlog.md` |
| Exercise restructure plan | `plans/exercise-restructure.md` |
| Admin dashboard plan | `plans/admin-dashboard.md` |
| Accessibility (Alan's feedback) | `plans/accessibility-large-text.md` |
| Offline architecture build | `playbooks/phase-c-offline-build.md` |
| AI cold-start prompt | `prompts/cold-start.md` |
| Canonical startup prompt | `brain/startup-prompt.md` |
| Human operator guide | `brain/how-to-use.md` |
| Playbooks index | `playbooks/` (14 files covering architect, bug-fix, build, debug, execution, feature-build, github-operator, optimise, refactor, repo-audit, research, review, brain-sync, phase-c-offline-build) |

---

*End of VYVE Health Master Document.*

*This document is the single source of truth for all VYVE platform, business, and technical knowledge. Verified against live Supabase project `ixjfklpckgxrwjlfsaaz` and VYVEBrain repo main branch on 21 April 2026.*

*Confidential — VYVE Health CIC — April 2026.*
