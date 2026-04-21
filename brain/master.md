# VYVE Health — Master Document

> **The single definitive reference for VYVE Health CIC.**
> Layered so different readers can skim to what they need: executives and investors stay in Part 1, commercial roles stay in Parts 1–2, product and operations in Parts 1–3, engineers across the whole document.
>
> **Last updated:** 21 April 2026
> **Maintainer:** Dean Brown (CTO)
> **Supersedes:** `brain/master.md` (previous technical-only version), `VYVE Complete Knowledge Base` (early April), any informally circulated master docs.

---

## Contents

**PART 1 — EXECUTIVE** *(read this if nothing else; ~3 pages)*
- 1.1 Elevator pitch
- 1.2 Company snapshot
- 1.3 Current state (members, revenue, stage)
- 1.4 Team
- 1.5 Mission, vision, values
- 1.6 Top priorities to May 2026

**PART 2 — COMMERCIAL**
- 2.1 The three pillars (investor/enterprise framing)
- 2.2 The five pillars (website/member framing)
- 2.3 Market positioning and the VYVE difference
- 2.4 Business model and pricing
- 2.5 Target market and enterprise pipeline
- 2.6 Competitive landscape
- 2.7 Sales enablement (skills, playbooks, assessment tool)
- 2.8 Marketing, brand and content
- 2.9 Lewis's origin story and The Everyman / VYVE Podcast
- 2.10 Charity mechanic and partner categories
- 2.11 CIC advantage and public sector route
- 2.12 Unit economics and cost structure
- 2.13 Compliance and legal posture

**PART 3 — PRODUCT**
- 3.1 What members get
- 3.2 Member journey
- 3.3 Portal pages (page-by-page)
- 3.4 AI coaching personas
- 3.5 The Exercise Hub (Movement, Workouts, Cardio, Running Plan)
- 3.6 Nutrition, habits and check-ins
- 3.7 Live and replay sessions
- 3.8 Certificates and engagement scoring
- 3.9 Employer dashboard
- 3.10 Admin dashboard (internal)
- 3.11 Mobile apps (iOS + Android)

**PART 4 — TECHNICAL** *(detailed reference for engineers)*
- 4.1 Architecture overview
- 4.2 Hosting and repositories
- 4.3 Authentication
- 4.4 Database (Supabase, 70 tables)
- 4.5 Edge Functions
- 4.6 Service Worker and offline architecture
- 4.7 Design system (tokens, theme layer)
- 4.8 Navigation system
- 4.9 AI integration rules
- 4.10 Security state
- 4.11 Hard rules (never break)
- 4.12 Known technical debt

**APPENDICES**
- A. Key URLs, credentials and identifiers
- B. Team contacts
- C. Outstanding decisions needing owner sign-off
- D. Glossary

---
---

# PART 1 — EXECUTIVE

## 1.1 Elevator pitch

VYVE Health is a UK workplace wellbeing platform that helps people build proactive physical, mental and social health habits before they break. Members get a personalised 8-week programme, daily habit tracking, weekly and monthly AI check-ins, five AI coaching personas, a full nutrition tracker and access to live and on-demand sessions — all wrapped in a mobile app that works across iOS, Android and the web.

We sell direct to individuals at £20/month and to employers at £10 per user per month. We are built as a UK Community Interest Company (CIC), which gives us a structural advantage in public sector procurement, and every 30 activities that members or companies complete funds one free month of the platform for someone in need through our charity partner network.

Our edge is threefold: proactive versus reactive (we build health before it breaks, not after), three-pillar versus single-pillar (physical, mental and social wellbeing, not just one), and social-impact-native versus commercial-first (the CIC structure and charity mechanic are built into the product, not bolted on).

## 1.2 Company snapshot

| Field | Detail |
|---|---|
| **Legal name** | VYVE Health CIC (Community Interest Company) |
| **Registered office** | United Kingdom |
| **ICO registration** | 00013608608 (registered March 2026, £52/year renewal) |
| **Stage** | Pre-revenue, MVP, active validation |
| **Founded** | 2026 (CIC); Lewis has run The Everyman Podcast since February 2023 |
| **Business email** | team@vyvehealth.co.uk |
| **Marketing site** | www.vyvehealth.co.uk |
| **Portal** | online.vyvehealth.co.uk |
| **Podcast** | www.vyvehealth.co.uk/vyve-podcast.html (rebranding from The Everyman) |

## 1.3 Current state

**Members:** 17 total in Supabase as of 21 April 2026. Of these, 9 have logged activity; the rest are test accounts, onboarded-but-not-yet-active accounts, or legacy Kahunas imports. Most recent cohort: 13 members joined in April 2026.

**Engagement (last 30 days):**
- 45 workouts logged
- 12 cardio sessions
- 100 daily habits
- 14 weekly check-ins
- 48 live/replay session views
- 15 personalised workout programmes generated
- 0 running plans generated (table exists, feature recently shipped, adoption pending)
- 0 monthly check-ins (table exists, feature recently shipped)

**Revenue:** £0. We are pre-revenue. Stripe is wired, coupons exist (`VYVE15`, `VYVE10`), the payment link is live, but we are not yet actively converting paying customers. Revenue target: **£6,000 MRR** (the threshold at which Dean goes full-time on VYVE).

**Company breakdown:** 2 members labelled as Sage, 1 as BT, 1 as Individual, 13 unlabelled. This is trial/testing state — no live employer contracts yet.

**Apps:** iOS app is **live on the App Store**. Android app is **awaiting Google confirmation** (resubmitted 15 April; icon issue identified and resolved).

## 1.4 Team

**Core team (6 people):**

| Name | Role | Scope | Email |
|---|---|---|---|
| **Lewis Vines** | CEO / Founder | Commercial, sales, content, AI ops, brand, product sign-off | lewisvines@hotmail.com |
| **Dean Brown** | CTO / Co-Founder | All technical work (part-time until £6K MRR); architecture, builds, data, security | deanonbrown@hotmail.com |
| **Alan Bird** | COO | Operations, process, go-to-market execution, compliance | (internal) |
| **Phil** | Mental Health Lead | Mental health content, HAVEN persona review and clinical sign-off | (to be added) |
| **Calum Denham** | Performance / Fitness Content | Exercise and workout content, performance expertise | (internal) |
| **Vicki** | Sales | Enterprise outbound, pipeline, demos | (to be added) |
| **Cole** | Community | Community engagement, member support, retention | (to be added) |

**Business email:** All outbound business communication uses `team@vyvehealth.co.uk` — never personal emails.

## 1.5 Mission, vision, values

**Tagline:** *Help yourself. Help others. Change the world.*

**Mission:** Proactive workplace wellbeing across three pillars — Physical, Mental, Social — so people and organisations build health before it breaks.

**Core values** (derived from about page, used in hiring and product decisions):
1. **Proactive, not reactive** — act before problems arise
2. **Evidence over assumption** — claims backed by research (Deloitte, RAND Europe, Gallup, The Lancet, WHO)
3. **People first, always** — product and policies designed around the user
4. **Radical transparency** — open communication, no hidden agendas
5. **Long-term thinking** — sustainable health practices, not fads
6. **Health for everyone** — equitable access, which is why we are a CIC and why the charity mechanic exists

**Positioning line:** *Prevention over cure — build health before it breaks.*

## 1.6 Top priorities to May 2026

**Sell-ready by end of May 2026** — meaning: enterprise-demo-ready for Sage, iOS and Android both live in their respective stores with no known blockers, all critical audit findings remediated, and a polished demo environment.

In order of priority:

1. **Android app launch confirmed** — waiting on Google review of the resubmission
2. **Facebook Make connection renewal before 22 May 2026** — critical, Lewis
3. **Sage demo readiness** — per-employer dashboard auth, volume pricing tiers, GDPR tooling (export + delete)
4. **Active members re-engagement** — Lewis and Kelly (both Sage contacts) have not logged activity in over a week; they must be live in the platform before the Sage demo
5. **Brevo logo removal** (~$12/month upgrade) before the Sage demo goes out on branded email
6. **Movement content backfill** — members choosing the Movement exercise stream currently see an empty-state page; we need at least 4–6 movement plans in the library
7. **HAVEN persona clinical review** — built and technically live, but should not be actively promoted until Phil signs off
8. **Fix push notifications** (broken since 11 April, affects daily habit and streak reminders)

---
---

# PART 2 — COMMERCIAL

## 2.1 The three pillars (investor / enterprise framing)

At the board, investor and enterprise level, VYVE speaks in three pillars. This is the strategic framing — it's how we describe what we do in pitch decks, procurement conversations, and top-of-funnel marketing.

| Pillar | What it covers | Evidence anchor |
|---|---|---|
| **Physical** | Workout programmes, cardio, movement, nutrition, daily habits, wearable integration | ROI of physical wellbeing from Deloitte + RAND Europe; £150bn UK economic cost of ill health (CIPD 2025) |
| **Mental** | Weekly and monthly wellbeing check-ins, five AI coaching personas, mindfulness content, the HAVEN safe-space persona, group therapy sessions | 41% of UK long-term absence driven by mental ill health (CIPD 2025); 2.8m economically inactive due to long-term health conditions |
| **Social** | Live sessions with chat, community leaderboards, charity mechanic, peer accountability, upcoming employer team dashboards | Gallup research on workplace connection; Warwick and UCL research on social health outcomes |

The three-pillar framing is deliberately simple because enterprise buyers and boards think in simple frameworks. When someone asks "what is VYVE?", this is the answer.

## 2.2 The five pillars (website / member framing)

At the website and member-experience level, VYVE presents five pillars. This is the feature-detail framing — it gives individuals browsing the marketing site a clearer picture of what they actually get day-to-day.

| Pillar | What it is on the page |
|---|---|
| **Mental** | Group therapy sessions, stress management, sleep support, AI coaching (NOVA, RIVER, SPARK, SAGE, HAVEN) |
| **Physical** | 40+ tailored workout plans, cardio programmes, movement tracking, custom exercise creation, wearable integration |
| **Nutrition** | Evidence-based guidance, no fad diets, meal planning, nutrition logging, TDEE and macro tracking |
| **Education** | Expert speakers, live podcast episodes, growing content library, CIPD research, thought leadership |
| **Purpose** | Meaningful goals, lasting habits, accountability, charity mechanic, community leaderboards |

**How the two framings reconcile:** Nutrition rolls up under Physical in the three-pillar view. Education and Purpose roll up under Social. Mental is the same in both. The website gets five pillars so individuals can see specific features; the boardroom gets three pillars because that's the strategic story.

## 2.3 Market positioning and the VYVE difference

The UK wellbeing market is crowded but the vast majority of incumbents are reactive, single-pillar, or both. Employee Assistance Programmes activate when something breaks. Gym-style apps only address physical. Meditation apps only address mental. Nobody in the UK does proactive, three-pillar wellbeing with a social-impact structure — that's the gap VYVE fills.

**Positioning phrases we use consistently:**
- *Prevention over cure*
- *Build health before it breaks*
- *A performance investment, not a cost centre*
- *Evidence over assumption*

**Evidence base cited in sales conversations:**
Deloitte · RAND Europe · Gallup · The Lancet · University of Warwick · University College London · World Health Organization · CIPD (UK wellbeing annual report).

**Economic context for sales conversations (CIPD 2025 figures):**
- £150bn annual cost of UK ill health to the economy
- 9.4 days average sickness absence per employee (24-year record high)
- 41% of long-term absence driven by mental ill health
- 2.8m economically inactive due to long-term health conditions
- 37% of UK employers still purely reactive — a massive market opportunity
- 5–8% average EAP utilisation — the engagement gap VYVE's gamification model directly addresses

The **Employment Rights Act SSP changes effective 6 April 2026** is the strongest current economic argument for preventative workplace wellbeing. We lead with it in enterprise conversations.

## 2.4 Business model and pricing

**B2C (individual):** £20 per month. Paid directly via Stripe. Onboarding is self-serve: pay → redirected to the questionnaire → account created → portal access within minutes. Coupons `VYVE15` and `VYVE10` are live.

**B2B (enterprise):** £10 per user per month — half the B2C rate, which is positioned as the bulk discount. Contact-first sales, so Vicki qualifies and Lewis handles the close. Volume tiers above 200 seats are not formally defined yet (open decision, Lewis). Indicative working tiers:
- 50–200 seats: full £10 rate
- 201–500 seats: negotiable
- 500+ seats: bespoke

**Annual billing:** Open question. Lewis to decide on a 10–15% annual discount, Dean to configure in Stripe once confirmed.

**Revenue model framing:** We sell VYVE as a performance investment, not a cost centre. In enterprise pitches we anchor against the ROI studies above and the CIPD crisis statistics. Contribution margin is 97.5% at B2C and 95.5% at B2B (see 2.12 Unit economics), so the product is built to scale profitably.

**Milestone targets:**
- **£6,000 MRR** — Dean goes full-time on VYVE (approximately 300 paying individuals, or 600 B2B seats, or a blended mix).
- **Series A readiness** — £1–2M ARR, 10%+ month-on-month growth, under 8% churn, over 100% net revenue retention.

## 2.5 Target market and enterprise pipeline

**Target segments, ranked by strategic fit:**

1. **Private sector enterprise (primary)** — Sage, BT, Barclays, Balfour Beatty and similar. These are our priority outbound targets. Lewis has warm contacts at several.
2. **Public sector (secondary but high-leverage)** — NHS, councils, government departments. Our CIC status gives us 6–8 extra points in social value scoring in tenders, which is often decisive. Full playbook built.
3. **Individuals (steady state)** — Direct B2C via the website, £20/month. Not the growth engine but pays for infrastructure and generates product validation.

**Current enterprise pipeline:**

| Prospect | Status | Notes |
|---|---|---|
| **Sage** | Warm — most likely first enterprise client | Lewis has an internal contact at senior wellbeing lead level. Two Sage employees already in the system (Lewis Vines, Kelly Bestford) as test accounts. HubSpot deal ID 495586118853, Initial Contact stage. |
| **BT** | Target — identified priority | Test accounts already in system (Danielle Akin, Callum Budzinski, Liam Carr, Logan Vines, Gary Vines, Colin White) |
| **Barclays** | Target — identified priority | No contact yet |
| **Balfour Beatty** | Target — identified priority | No contact yet |
| **NHS / councils / government** | Target — public sector playbook ready | Requires full procurement response; CIC status is a real edge |

## 2.6 Competitive landscape

**Primary threats:**

| Competitor | Threat level | Notes |
|---|---|---|
| **Unmind** | High | £61M capital raised, established enterprise presence |
| **Spectrum.Life** | High | Recently won AXA Health EAP contract, launching 'Cara' Q2 2026 |
| **YuLife** | Medium-high | New CEO + Bupa partnership; insurance-linked angle |

**Unstable players / opportunity windows:**
- **Headspace** — 15% layoffs creating an opportunity to approach UK clients
- **Spring Health** — £6–7B Alma acquisition validates the market size

**Also tracked:** Wellhub, BetterUp, Virgin Pulse, Champion Health, Heka, Vitality, Calm, Koa Health, Lyra Health, Thrive Global.

**How we win against each category:**
- Against reactive EAPs: the prevention narrative and CIPD data
- Against single-pillar apps (meditation only, fitness only): three-pillar breadth
- Against large incumbents (Unmind, Spectrum): agility, CIC social-value scoring, proactive positioning
- Against US-heavy players (Calm, Headspace, BetterUp): UK-first GDPR and NHS familiarity

Our Sales Intelligence skill runs a weekly deep-dive across 20+ competitors with a threat/opportunity matrix and displacement-pitch prep. The displacement table lives in Lewis's sales kit.

## 2.7 Sales enablement

Four structured assets Lewis uses on every enterprise conversation:

**Sales Intelligence pre-call briefs** — 8-step deep dive on any prospect, including ROI calculator and displacement table against the 20 tracked competitors. Objection-handling scripts for common procurement pushback.

**Three Pillar Assessment Guide** — employer-facing prospect tool. Prospect answers a short structured assessment, we score them against the three pillars and suggest a tier (starter, standard, premium). Useful qualifying tool — also builds trust because it's genuinely diagnostic, not a sales-theatre gimmick.

**Public Sector Sales Playbook** — five procurement routes mapped out (framework agreements, direct award, competitive tender, Dynamic Purchasing System, Innovation Partnership), social value scoring guidance, tender response template, 90-day action plan.

**Research Library + Stat Bank** — 20+ indexed studies, each distilled into copy-paste-ready statistics for sales decks and cold outreach. Updated weekly by the Research Radar automation.

## 2.8 Marketing, brand and content

**Brand identity:**
- **Palette:** `#0D2B2B` (dark green-teal), `#1B7878` (teal), `#4DAAAA` (teal light, graphical use only), `#C9A84C` (gold accent)
- **Fonts:** Playfair Display (headings), DM Sans / Inter (body)
- **Tone:** Evidence-led, warm, grounded. No exclamation marks, no fitness-bro energy, no wellness-industry cliché. Lewis dislikes emojis — we strip all emojis from member-facing and marketing copy.

**Marketing site** (`www.vyvehealth.co.uk`, hosted on GitHub Pages in the `Test-Site-Finalv3` repo):

| Page | Status | Purpose |
|---|---|---|
| `index.html` | Live | Three audience paths: Individual, Employer, Members |
| `individual.html` | Live | Five pillars, pricing, features, Give Back explainer |
| `about.html` | Live | Origin story, values, CIPD statistics, founding team |
| `give-back.html` | Live | Charity mechanic, partner categories, FAQ |
| `roi-calculator.html` | Live | Interactive ROI calculator with CIPD 2025 benchmarks |
| `vyve-podcast.html` | Live | Podcast hub, 35+ episodes, platform links, guest expression of interest |
| `privacy.html` | Live | Privacy Policy |
| `terms.html` | Live | Terms of Service |
| `welcome.html` | Live | Post-Stripe-payment onboarding questionnaire |
| `vyve-dashboard-live.html` | Live | Employer dashboard (aggregate only, no PII) |
| `employer.html` | **404, needs building** | Employer sign-up; currently not a live page |

**Content production:**
- **Target:** 10–14 social posts per week across LinkedIn, Instagram, Facebook
- **Current output:** 6/week (publishing pipeline broken since 23 March — Lewis to fix)
- **Backlog:** 133 posts queued and waiting (Make scenario 4950386 broken)
- **Quality:** Strong (4.4/5 average) even at reduced volume
- **Pre-recorded sessions target:** 30 videos before hiring external instructors
- **Workflow:** Claude script → ElevenLabs voice → Audacity post → stock footage → CapCut edit → Castr scheduled publish

**24 custom AI skills for Lewis** run daily, weekly and monthly intelligence, content, sales and monitoring workflows. Highlights:
- **Daily Intelligence** — weekday morning 6-area intelligence scan with top 3 actions
- **Content Engine** — converts a single podcast into 5+ platform-specific assets
- **Sales Intelligence** — pre-call briefs, displacement tables, objection handling
- **Research Radar** — 4 credibility tiers, 20+ indexed studies, weekly Stat Bank refresh
- **Competitor Deep Dive** — weekly tracking of 20+ competitors
- **Client Health Monitor** — green/amber/red scoring, 15+ early warning signals, retention playbooks
- **Investor & Growth Tracker** — UK health-tech funding, monthly KPIs, grant calendar, Series A prep

**Automation layer:**
- **Daily:** Morning brief, 3 social posts, engagement ritual (30 min playbook)
- **Weekly:** Strategic digest (Mon 8am, synthesised from 9 JSON data sources), competitor deep dive, research radar, analytics feedback, content intelligence
- **Monthly:** 25-piece content calendar (4 themed weeks), thought leadership macro-trend report

**Make scenarios (Lewis only):**
- 4950386 — Social publisher (**BROKEN since 23 March, Lewis to fix**)
- 4993944 — Instagram analytics collector
- 4993948 — Facebook analytics collector
- 4993949 — LinkedIn analytics collector

All analytics feed Make Data Store 107716.

## 2.9 Lewis's origin story and the VYVE Podcast

**The turning point** — Lewis Vines nearly lost his life to addiction. Standing on a train platform, he realised honest conversations — first with himself, then with the people who mattered — saved his life. This lived experience is the authentic foundation of VYVE's mission around mental health, proactive support, and the power of community.

**The Everyman Podcast** — launched February 2023, men's health podcast with one founding rule: no topic off limits. Candid conversations about mental health, addiction recovery, purpose, performance, and living well — exactly what VYVE enables digitally.

**35+ episodes** with guests including:
- Matthew Jarvis (England and Premier League footballer)
- Calum Denham (performance expert, now VYVE fitness lead)
- Luke Ambler (founder, Andy's Man Club suicide prevention charity)
- Ray Winstone (actor, prostate cancer awareness)
- Dr Tamara Russell (mindfulness researcher)
- David Wetherill (Paralympic champion)
- 3 Dads Walking (suicide prevention)

**Platforms:** Spotify, Apple Podcasts, Amazon Music.

**Rebrand:** The Everyman Podcast is being rebranded to **The VYVE Podcast** in 2026. Timing of full switchover is an open decision (Lewis).

**Guest expression of interest form** live on the podcast page — pipeline for thought leadership, PR and partnership conversations.

## 2.10 Charity mechanic and partner categories

**Individual track:** Every 30 completions of a specific activity type (30 workouts, or 30 habits, or 30 cardio sessions, etc.) donates one free month of VYVE to a recipient through our charity partner network.

**Enterprise track:** Every 30 activities collectively logged by a company's members donates one free month. Collective impact — an employer's engagement directly funds access for people in need.

**Framing:** This is social impact, not a referral reward. It's central to the CIC positioning and lives in every marketing touchpoint.

**Five partner categories** (specific charity names to be confirmed, still open):

1. **Addiction Recovery** — recovery programmes and rehabilitation
2. **Homelessness & Reintegration** — housing-first approaches and reintegration services
3. **Mental Health** — crisis support, counselling, wellbeing services
4. **Social Mobility** — education, skills training, economic opportunity
5. **Physical Health Access** — enabling fitness, nutrition and wellness for underserved populations

**Partner economics:**
- £0 cost to charity partners to refer recipients
- £0 cost to recipients to access donated memberships
- Counters reset after each 30-activity milestone — unlimited donations possible
- Milestone certificates generated automatically on donation events

This zero-cost model is deliberate: it removes friction for charity partners signing up and makes the donation engine truly unlimited.

## 2.11 CIC advantage and public sector route

**Why CIC matters:**
- Social value scoring adds 6–8 extra points in public sector tenders — often the difference between winning and losing
- Charity mechanic reinforces social impact positioning
- Eligible for grants and social enterprise funding streams traditional competitors cannot access
- Procurement teams treat CICs more favourably than pure commercial entities on equal offering

**Public sector playbook (built and ready):**
- 5 procurement routes mapped
- Tender response template
- Social value scoring guidance (how to translate our CIC structure and charity mechanic into tender points)
- 90-day action plan for post-win implementation

**Funding and grants status (21 April 2026):** Self-funded. No grants applied for or secured. No external capital. When we are ready, the grants on our radar are:
- **National Lottery Awards for All** — application backlogged
- **The Fore** — register June/July 2026
- **WHISPA research programme** (£3.7M launching May 2026) — potential research partnership, monitor

## 2.12 Unit economics and cost structure

**Current monthly costs: ~£81/month**

| Item | Monthly | Notes |
|---|---|---|
| Supabase Pro | ~£20 | Database + auth + storage + Edge Functions |
| Anthropic API | ~£40 | Spend limit £50, actual lower |
| Domain | ~£1.50 | GoDaddy |
| ICO registration | ~£4.33 | Annualised £52 |
| Make (Lewis) | ~£15 | Social automation |
| Brevo | £0 | Free tier (300/day) — upgrade to ~£12/month before Sage demo |
| GitHub, PostHog, HubSpot, Cloudflare | £0 | All free tiers |

**Variable cost per member: ~£0.45/month** (mostly AI inference + marginal Supabase usage).

**Contribution margin:**
- B2C (£20): 97.5%
- B2B (£10): 95.5%

**Break-even: 4–5 paying members.** Cost structure is almost entirely fixed until approximately 500 members.

**AI cost per member per month: ~£0.13**

| AI feature | Cost per call | Frequency | Monthly per member |
|---|---|---|---|
| Onboarding (6 calls) | £0.22 total | Once | ~£0.07 (amortised) |
| Weekly check-in | £0.008 | Weekly | ~£0.03 |
| Re-engagement email | £0.004 | Per email | ~£0.01 |
| Running plan | £0.01 | Cached | ~£0.005 |
| Monthly check-in | £0.015 | Monthly | £0.015 |

**Scaling thresholds:**
- **80 members** — Brevo upgrade needed (~£19/month tier)
- **100 members** — Anthropic spend monitoring required
- **200 members** — Supabase tier review
- **500 members** — External DPO service required by UK GDPR (£2–5K/year)

**Revenue scenarios:**

| Scenario | Members | MRR | Profit | Margin |
|---|---|---|---|---|
| 100 B2C | 100 × £20 | £2,000 | ~£1,930 | 96.5% |
| Sage 200 | 200 × £10 | £2,000 | ~£1,850 | 92.5% |
| Mixed (Sage + 50 B2C) | 250 | £3,000 | ~£2,840 | 94.7% |
| **Target (Dean full-time)** | **~300+** | **£6,000** | **~£5,700** | **95%** |
| Series A (£1.5M ARR) | ~6,250 | £125,000 | ~£119,000 | 95.2% |

The economics are, in a word, healthy.

## 2.13 Compliance and legal posture

| Document / item | Status |
|---|---|
| **ICO registration** | 00013608608 — registered March 2026, £52/year renewal |
| **DPA (Data Processing Agreement)** template | Complete. Replace `[CLIENT ORGANISATION NAME]` with client name before sending |
| **DPIA (Data Protection Impact Assessment)** | Complete. Next review September 2026 |
| **Data Retention Policy** | Complete |
| **Breach Notification Procedure** | Complete |
| **Privacy Policy** | Live at vyvehealth.co.uk/privacy.html |
| **Terms of Service** | Live at vyvehealth.co.uk/terms.html |
| **Compliance Calendar** | Live — tracks CIC36 filing, DPIA reviews, insurance renewals, HSE audits |
| **Google Standard Contractual Clauses** | Not in place (personal Google account). Migrate post-first-enterprise-contract |
| **External Data Protection Officer** | Required before 500 members; budget £2–5K/year |
| **Employer reporting** | Aggregate only, no individual names ever visible to employers |
| **Article 9 special category data handling** | Wellbeing scores, physical measurements, sleep data, injury and medical data all classified as Article 9. Data processor agreements in place with all processors except Google Workspace (migration pending). Consent language under review |

**Third-party data processors in play:**

| Processor | Location | Data handled | Risk |
|---|---|---|---|
| Supabase | EU (Ireland) | All member data | Low |
| **Anthropic** | **US** | **Full profiles including Article 9 health data** | **High — requires clear consent and SCC** |
| Brevo | EU (France) | Email, name | Low |
| Stripe | US / EU (Ireland) | Payment data | Low |
| PostHog | US (EU endpoint) | Email (currently unhashed — remediation on backlog) | Medium |
| GitHub | US | Source code | Low |

**Member data rights (GDPR Articles 15, 17, 20):** Request-by-email handling currently; automated export and delete tooling is on the Sage-readiness backlog.

---
---

# PART 3 — PRODUCT

## 3.1 What members get

A member's experience at a high level:

- **A personalised 8-week workout programme**, generated by AI at onboarding based on their goals, equipment, experience level and training days available. Lives in the database and the app, regenerates when the member hits the end of a cycle.
- **Daily habit tracking** — 5 habits chosen at onboarding from a library of 30 across 6 monthly themes (Movement, Nutrition, Mindfulness, Social, Sleep, plus a rotating theme). Yes/no/skip tapping with streak visualisation.
- **Weekly wellbeing check-in** — 4 sliders (wellbeing, energy, stress, sleep) plus a free-text reflection. AI generates personalised recommendations in the member's assigned persona voice.
- **Monthly deep check-in** — 8 wellbeing areas scored, activity recap, AI-generated monthly report with trend analysis.
- **An AI-powered running plan** — members set distance goal, pace target, training days, timeframe; the AI builds a progressive plan stored on the server (now syncs across devices).
- **Full nutrition tracking** — TDEE calculation, macros, hydration, food log (powered by Open Food Facts API), weight tracking with 7/30/90-day trends.
- **Live and replay sessions** — yoga, mindfulness, workouts, group therapy, run club, education, podcast. Sessions have real-time chat for the live audience.
- **Five AI coaching personas** — NOVA, RIVER, SPARK, SAGE, HAVEN. Assigned at onboarding based on goals, life context and wellbeing scores. Personas shape tone across welcome email, check-in responses, re-engagement nudges.
- **Certificate system with charity donation** — every 30 completions of a specific activity type generates a personalised certificate and donates one free month of VYVE to a charity partner recipient.
- **Engagement scoring and leaderboards** — 0–100 engagement score across 4 components (activity, consistency, variety, wellbeing), leaderboards with company-scoped and team-scoped views.
- **PWA on iOS and Android** — installable home-screen app with push notifications (iOS PWA push went live 17 April 2026; requires user-gesture permission grant as per iOS rules).

## 3.2 Member journey

**1. Discovery** — marketing site (www.vyvehealth.co.uk), podcast, social content, word of mouth, enterprise referral.

**2. Conversion** — Stripe payment link (`buy.stripe.com/00wfZicla1Em0NnaIB93y00`) with optional coupon (`VYVE15`, `VYVE10`). On successful payment, Stripe redirects to `welcome.html`.

**3. Onboarding questionnaire** — 10-section form covering:
- Section A: About you (name, DOB, gender, location)
- Section B: What you want from VYVE (goals, vision of success)
- Section C: Physical health (training location, equipment, experience, injuries)
- Section D: Nutrition (activity level, current weight, TDEE target)
- Section E: Sleep and mental wellbeing (hours, quality, stress, energy)
- Section F: Social and accountability (support areas, motivation style)
- Section G: Life context (bereavement, mental health struggles, new parent, etc. — drives persona assignment)
- Section H: Communication preferences (contact preference, reminder frequency, tone)
- Section I: Tech (smartphone, smartwatch)
- Section J: Consent (terms, privacy, health data processing)

**4. AI processing** (server-side in `onboarding` Edge Function, ~8 seconds for fast path):
- Persona assignment (hard rules first, then AI for ambiguous cases)
- Programme name generation (8-week programme titled contextually)
- Habit selection (5 of 30 from the habit library)
- Recommendation generation (3 personalised recommendations in persona voice)
- Welcome email draft

**5. Account creation** — Supabase Auth user created, member row written, habits assigned, weekly goals set.

**6. Welcome email** — sent via Brevo. Includes PWA install steps, programme overview card, 3 first-week recommendations in the assigned persona voice.

**7. Background processing** — 8-week personalised workout programme generated and written to the `workout_plan_cache` table. Takes 1–24 hours depending on complexity; kicked off via `EdgeRuntime.waitUntil()` so the member sees their welcome screen immediately.

**8. First login** — member receives password-set email, lands on the portal, dashboard loads (skeleton first, real content second).

**9. Daily engagement loop:**
- Log 1+ daily habits → streak maintained
- Do a workout or cardio session → progress ring moves, programme advances
- Watch a live session (or replay) → catches up asynchronously
- End of week: complete the weekly check-in → AI generates recommendations for next week
- End of month: complete monthly check-in → deeper trend analysis

**10. Milestones:**
- Every 30 activities in a specific category → certificate unlocked, charity donation triggered
- Life context changes or persona feels wrong → member can request a persona switch in settings

**11. Re-engagement** — automated streams (A/B/C1/C2/C3) kick in at different inactivity thresholds with personalised AI-written emails via Brevo.

## 3.3 Portal pages

All portal pages are at `online.vyvehealth.co.uk` and sit behind Supabase Auth.

| Page | What it does |
|---|---|
| `index.html` (Home) | Member dashboard. Skeleton-first loading, cache-first return visits. Activity score ring, daily check-in, this-week's goals, live session, next sessions, 5 progress tracks, milestones, collective charity impact banner |
| `habits.html` | Daily habit logging. Yes/no/skip cards, 7-day pill strip, streak flame, monthly theme badge |
| `exercise.html` | **Hub** for the Exercise restructure (shipped 19 April 2026). Shows active programme + sub-page cards for Movement, Workouts, Cardio |
| `workouts.html` | Full workout programme view + session logging. Uses modular JS (6 external files). Exercise logs, custom workouts, swipe-to-delete, PRs, history |
| `movement.html` | Movement stream — walks, stretching, mobility. Quick-log form for non-planned movement. Plans pending (content backfill) |
| `cardio.html` | Cardio stream — running, cycling, walking. Active running plan hero card if one exists |
| `running-plan.html` | AI running plan generator. Server-side storage (new, 20 April). Form + preview mode before full plan generation |
| `nutrition.html` | TDEE + macros + hydration. Weight tracker with 7/30/90-day charts. Recalculator |
| `nutrition-setup.html` | Nutrition setup for members who skipped it at onboarding |
| `log-food.html` | Food logging via Open Food Facts API |
| `wellbeing-checkin.html` | Weekly check-in. 4 sliders + free text. AI recommendations in persona voice. Locks after submission |
| `monthly-checkin.html` | Monthly deep check-in. 8 wellbeing areas + activity recap + AI report. Locks after submission |
| `certificates.html` | Certificate display. 5 tracks (Architect / Warrior / Relentless / Elite / Explorer). Progress bars, PDF download, full-screen view |
| `engagement.html` | Activity score breakdown. 4 components explained, activity history, streak and PBs |
| `leaderboard.html` | Leaderboard. 3 scopes (All members / Company / Team). 4 metrics. Privacy-first: only sees above, never below |
| `sessions.html` | Live session listings with filters. Live chat on active sessions (last 50 messages) |
| `settings.html` | Theme toggle (dark/light), persona change, notification prefs, goal focus, privacy toggle. Cache-first load |
| `login.html` | Supabase Auth login |
| `set-password.html` | Password set/reset flow |
| `consent-gate.html` | Health data consent gate |
| `strategy.html` | Internal strategy dashboard (password: `vyve2026`) |

Also: `shared-workout.html` (shareable workout preview), plus per-session-type live and replay pages.

## 3.4 AI coaching personas

Five personas live in the `personas` table. Each has a full system prompt defining voice, approach and guardrails. They shape every AI-generated output for that member — welcome email, weekly check-in recommendations, re-engagement emails, monthly reports.

| Persona | Character | For whom |
|---|---|---|
| **NOVA** | High-performance coach. Driven, data-led, precision-focused. Metrics and measurable progress. | Performance-focused members with calm baseline. Typically 1–2 goals dominated by strength/performance/muscle, high energy and calm stress scores. |
| **RIVER** | Mindful wellness guide. Calm, empathetic, holistic. Stress, sleep, emotional balance. | Stressed (low stress score — see stress scale note), low energy, or struggling members. |
| **SPARK** | Motivational powerhouse. Energetic, warm, challenge-driven. Accountability. | Mixed goals, consistency focus, busy lifestyles, parents, time-poor. Default when signals are ambiguous. |
| **SAGE** | Knowledge-first mentor. Thoughtful, evidence-based. Understands the why. | Analytical members who want to understand mechanisms. |
| **HAVEN** | Gentle mental health companion. Non-judgmental, trauma-informed. | Life context including bereavement or "struggling with mental health". **Live in code but should not be actively promoted before Phil's clinical review.** |

**Stress scale — critical:** The stress slider reads `1 = very stressed` and `10 = very calm`. This is inverted from intuition and caused a significant bug earlier in April. High stress score = member is calm; low stress score = member is struggling. All persona assignment and habit-selection logic respects this.

**Current persona distribution (21 April 2026):** SPARK 11, NOVA 3, RIVER 2, HAVEN 1.

**Assignment rules in order:**

1. **HAVEN** — if life context includes "Bereavement" or "Struggling with mental health", assigned immediately regardless of other signals
2. **RIVER** — if stress ≤ 3 (actually stressed), wellbeing ≤ 4, or energy ≤ 3
3. **NOVA** — wellbeing ≥ 7 AND energy ≥ 7 AND stress ≥ 7 (calm) AND 1–2 goals max where strength/performance/muscle is dominant. Members with 3+ mixed goals always go to the AI path, even if scores qualify
4. **AI decides** — everything else. SPARK is the default for mixed goals, consistency focus, or demanding life context
5. **Never assign NOVA or SPARK** if serious life context is flagged (bereavement / mental health), regardless of other signals

**Persona switching:** Members can request a switch in settings. Handled via `persona_switches` table. No switches triggered to date.

## 3.5 The Exercise Hub

Shipped 19 April 2026 (Rounds 1–5). Full plan at `plans/exercise-restructure.md`.

**Rationale:** The original "Workouts" tab was gym-centric. A 52-year-old menopausal member returning from injury doesn't need a Push/Pull/Legs split — she needs a walking plan and gentle movement. The hub makes space for both without overwhelming either.

**Hub structure (`exercise.html`):**
- Active programme hero card (shows current stream — Workouts / Movement / Cardio)
- Sub-page cards for the other streams

**Streams:**

| Stream | Page | For whom | Status |
|---|---|---|---|
| **Workouts** | `workouts.html` | Active gym-goers, strength-focused members | Live, fully populated — 5 plans, 244 workout rows, 39 plan-days |
| **Movement** | `movement.html` | Sandra-type members: low activity, returning from injury, desk workers, older adults, new to exercise | **Live but content backfill pending** — no Movement plans in the library yet. Members see quick-log form as a fallback |
| **Cardio** | `cardio.html` | Runners, cyclists, walkers | Live. Hero card shows active running plan if one exists |
| **Running Plan** | `running-plan.html` | Any member with a distance goal | Live. AI-generated progressive plans, server-side storage (shipped 20 April 2026), localStorage cache for offline |

**Open items on the restructure:**
- Movement plan content in the `programme_library` (no rows with `category='movement'` yet — all Movement members see the no-plan state)
- `programme_library.category` column to distinguish movement vs gym plans
- Backfill decision for existing members (all 17 currently default to `exercise_stream='workouts'`)
- Classes stream on the hub (plan says cross-cutting, not yet built)
- Hub progress across all streams vs just the primary (open plan-doc question)

**Workout architecture:**
- 5 plans currently in the library: Push/Pull/Legs (11 workout days), Upper/Lower (8), Full Body (7), Home Workouts (7), Movement & Wellbeing (7 content tabs)
- 244 total workout rows across 39 plan-days
- Every member gets all 5 plans assigned; AI recommends weekly schedule, not plan selection
- Members can create custom workouts
- Exercise logs (sets/reps/weight) are plan-agnostic — permanent per-member record

## 3.6 Nutrition, habits and check-ins

**Nutrition:**
- TDEE calculator with 5 activity levels and goal-aware deficit slider (fat loss / maintenance / muscle)
- Macros split across protein (2g × bodyweight kg default), fat and carbs
- Food logging via Open Food Facts API (proxied through `off-proxy` Edge Function to avoid CORS)
- 4 meal slots: Breakfast, Lunch, Dinner, Snacks
- Daily running totals with per-target indicators
- Pre-populated food database of 125 common foods
- Member-saved custom foods
- Weight log with 7/30/90-day trend chart
- Water tracker (daily target: 2L default)

**Daily habits:**
- 30-habit library across 6 monthly themes: Movement, Nutrition, Mindfulness, Social, Sleep, plus rotating seasonal theme (April theme: "Move — Move More")
- AI selects 5 habits per member at onboarding from the library
- Yes/no/skip tap on each habit
- Cap: up to 10/day (distinct habits, not raw rows). Over-cap routed to `activity_dedupe` table
- Monthly theme refreshes the pool

**Weekly check-in** (`wellbeing-checkin.html`):
- 4 sliders: wellbeing, energy, stress (inverted scale), sleep
- Free-text reflection
- AI generates recommendations in persona voice
- Activity recap ("here's what you did this week") shown before submission
- Locks after submission; can re-submit on next ISO week
- Results stored in `wellbeing_checkins` and `weekly_scores`

**Monthly check-in** (`monthly-checkin.html`) — shipped 18 April 2026:
- Activity recap (full month across all streams)
- 8-area wellbeing scoring (physical, mental, sleep, energy, stress, nutrition, social, purpose)
- AI-generated monthly report in persona voice
- Locks after submission; re-opens on 1st of next month
- Stored in `monthly_checkins`. Zero submissions to date (table new).

## 3.7 Live and replay sessions

**Session types** (all listed on `sessions.html`):

| Type | Cadence | Level |
|---|---|---|
| Yoga, Pilates & Stretch | Daily 6:00 AM | Movement, All levels |
| Mindfulness & Mindset | Daily 8:00 AM | Mental Wellbeing, All levels |
| Workouts | Daily 7:30 AM | Exercise, All levels |
| Weekly Check-In | Monday 9:00 AM | Check-In, All members |
| Group Therapy | Wednesday 12:00 PM | Therapy, All members |
| Events & Run Club | Monthly, varies | Community, All members |
| Education & Experts | Monthly, varies | Education, All members |
| The VYVE Podcast | As scheduled | Podcast, All members |

**Technology:**
- **Riverside** — 7 studios, permanent links, used for recording
- **YouTube** — 8 channels for live streaming and on-demand hosting
- **Castr** — scheduled pre-recorded stream publishing

**Live chat:** `session_chat` table, last 50 messages per session, RLS enabled.

**Replays:** Auto-published to replay pages (`yoga-rp.html`, `mindfulness-rp.html`, etc.). On the tech-debt list to consolidate: 8 live pages and 8 replay pages currently duplicate each other with minor parameter differences (~310KB unnecessary payload, 16 files that could be 2 parameterised files).

**Live viewer count:** Not currently displayed. Open decision — display only when 20+ viewers to avoid empty-room awkwardness.

## 3.8 Certificates and engagement scoring

**Certificate tracks:**

| Track | Colour | Activity | Tier name |
|---|---|---|---|
| Daily Habits | Teal `#3DB89F` | Daily habit log completions | The Architect |
| Workouts | Teal `#3DB89F` | Workout completions | The Warrior |
| Cardio | Orange `#E8834A` | Cardio completions | The Relentless |
| Weekly Check-ins | Gold `#C9A84C` | Weekly check-ins | The Elite |
| Sessions | Teal `#3DB89F` | Live session views | The Explorer |

Every 30 activities in a track unlocks a new milestone certificate and triggers a charity donation. HTML certificates stored in Supabase Storage, served by `certificate-serve` Edge Function, PDF-downloadable and globally numbered (No. 0001+).

**Engagement score (0–100):**
- Base: 50 points
- 4 weighted components, max 12.5 each:
  - **Activity** — recency (full points within 24h, zero after 7 days)
  - **Consistency** — distinct active days in last 30 (20+ days = full marks)
  - **Variety** — activity types in last 7 days (movement, habits, sessions)
  - **Wellbeing** — from weekly check-in score (1–10 scale)

**Leaderboard:**
- Scopes: All members, Company (if employed), Team (if employed)
- Metrics: All, Habits, Workouts, Streak
- Privacy-first design: member only sees people ranked above them, never below. Names and scores anonymised from other members — only the position and gap are visible.

## 3.9 Employer dashboard

**Live at:** `www.vyvehealth.co.uk/vyve-dashboard-live.html`

**Data source:** `employer-dashboard` Edge Function. Aggregate only — no individual names or personal data ever visible to employers.

**Member status definitions:**
- Active: 0–7 days since last activity
- Quiet: 8–30 days
- Inactive: 30+ days or never active

**Current state:** Demo / test data only. No live employer contracts yet. Readiness gap for Sage demo:
- Per-employer authentication (currently shared API key model — needs individual auth)
- GDPR data export and delete tooling
- Volume pricing tiers formally defined
- Brevo logo removal (~£12/month)

**Build time to full Sage readiness:** ~35–45 hours (from the 14 April Enterprise Readiness report).

## 3.10 Admin dashboard (internal)

Single-page admin client at `apps/admin-dashboard/admin.html` in the `vyve-command-centre` repo. Shipped 18 April 2026. Two users: Dean and Lewis. Target deployment: `admin.vyvehealth.co.uk` (file committed, GitHub Pages hosting pending).

**Architecture:** Hot / warm / cold data layers backed by aggregation tables that keep queries sub-millisecond at 5,000+ members.

- **Hot (0–30 days)** — raw activity tables, queried only for member deep-dive timeline
- **Warm (30–90 days)** — `member_activity_daily` aggregate (one row per member per date, pre-counted)
- **Cold (90+ days)** — `member_stats`, `company_summary`, `platform_metrics_daily` summary tables

**Refresh cadence:**
- `recompute_all_member_stats()` every 15 minutes
- `rebuild_member_activity_daily()` nightly 03:00 UTC
- Company and platform rollups via triggers on member_stats changes

**Views:**
- Platform KPIs (total members, MAU, DAU, churn, revenue where applicable)
- Company rollup (per-employer engagement)
- Member list (sortable, with risk flags for quiet/inactive)
- Member deep-dive timeline (hot-data)
- Onboarding pipeline status
- Content performance
- System health

Admin users authenticated via Supabase Auth with an `admin_users` allowlist. Dean and Lewis seeded.

## 3.11 Mobile apps

**iOS** — live on the App Store. Wrapped with Capacitor; loads the PWA via WebView. GitHub Pages pushes deploy to the app automatically — no App Store resubmission needed for content or logic changes, only for native-shell changes (push config, orientation, icons).

**Android** — awaiting Google Play review after 15 April resubmission (icon issue identified and fixed). Same Capacitor architecture.

**Push notifications (iOS PWA):**
- Web Push (VAPID) live since 17 April 2026
- RFC 8291 AES-GCM encryption via Deno Web Crypto (Apple push requirement)
- Permission triggered on user gesture (required for iOS compliance)
- Subscriptions stored in `push_subscriptions` table
- Daily habit reminder and streak reminder automations (**currently broken since 11 April — push cron JSON syntax error, fix on priority list**)

**Capacitor native capabilities in use:** Push notifications (via VAPID Web Push), orientation lock via manifest, safe-area insets. HealthKit / Health Connect integration scoped but not yet built.

---
---

# PART 4 — TECHNICAL

## 4.1 Architecture overview

VYVE is a thin-client PWA hosted on GitHub Pages, backed by Supabase (Postgres + Edge Functions + Auth + Storage), with Anthropic AI called server-side only. Capacitor wraps the PWA for iOS and Android without needing App Store resubmission for most changes.

**Design principles:**
- Single source of truth for data: Supabase (never Google Sheets or Apps Script)
- AI stays server-side only: Anthropic API calls happen exclusively inside Edge Functions, never from HTML
- RLS on all member/employer data at the database level
- GDPR by default: data minimisation, purpose limitation, anonymisation for employer reporting
- Cheap at small scale: <£100/month infrastructure for first few hundred members
- Small team-friendly: single-file HTML pages, no build pipeline, changes ship instantly

## 4.2 Hosting and repositories

| Component | Hosting | Repo |
|---|---|---|
| Member portal (PWA) | GitHub Pages → `online.vyvehealth.co.uk` | `VYVEHealth/vyve-site` (private) |
| Marketing site | GitHub Pages → `www.vyvehealth.co.uk` | `VYVEHealth/Test-Site-Finalv3` |
| Admin dashboard (single file) | GitHub Pages → `admin.vyvehealth.co.uk` (target) | `VYVEHealth/vyve-command-centre` |
| Brain (AI continuity + operational docs) | GitHub | `VYVEHealth/VYVEBrain` (public for AI access) |
| Backend / DB / Edge Functions | Supabase Pro (West EU / Ireland) | Project ID `ixjfklpckgxrwjlfsaaz` |

**Portal repo structure:**

Single-file HTML pages with self-contained inline CSS and JavaScript. No build process, no bundler. 39 HTML files totalling ~1,245 KB; 14 JS files (including supabase.min.js at 185 KB). Shared JS: `auth.js` (17 KB, v2.4 with offline fast-path), `nav.js` (18 KB, body-prepend injection), `theme.js` (4.4 KB), `theme.css` (6.8 KB with semantic token layer), `sw.js` (4 KB, network-first HTML), `vapid.js` (2.6 KB), `tracking.js` (8.5 KB), `offline-manager.js`, `supabase.min.js`.

**Retired technologies (do not reintroduce):**

| Technology | Replacement |
|---|---|
| Auth0 | Supabase Auth (fully migrated) |
| Google Sheets for portal data | Supabase |
| Apps Script | Retired from portal; only Action Ticks + backup.gs remain as legacy helpers |
| Typeform | `welcome.html` onboarding questionnaire |
| Looker Studio | HTML dashboards on GitHub Pages |
| PAD / Kahunas | Replaced by the VYVE PWA. Never reference "Kahunas" in member-facing copy |
| Make (Dean) | Dean no longer uses Make for anything. All activity logging via `log-activity` Edge Function |

## 4.3 Authentication

Supabase Auth. All portal pages gated via `auth.js` v2.4. Auth0 fully retired. Session JWTs are the single auth mechanism for Edge Function calls.

**Rules:**
- Every Edge Function handling member data validates JWT internally (via `supabase.auth.getUser()`)
- `verify_jwt: false` is the deploy-time default — Edge Functions do their own JWT check because this gives better error messages and CORS control
- `github-proxy` uses a separate shared-secret auth model (`x-proxy-key` header) since it's an internal infra endpoint
- `employer-dashboard` uses an API key model with per-employer scoping (not full Auth) — readiness gap for Sage
- Password reset emails route to `set-password.html`
- `auth.js` has an offline fast-path so members can still see cached content with no network

## 4.4 Database (Supabase, 70 tables)

Project: `ixjfklpckgxrwjlfsaaz`, West EU / Ireland, Pro plan, Postgres 17.6.1. Approximately 20 MB total.

**70 tables verified live on 21 April 2026.** Primary key pattern: `member_email` (lowercased by `zz_lc_email` trigger on 42 tables). RLS enabled on all member/employer/aggregate tables.

**Core member and activity tables:**

| Table | Rows (21 Apr) | Purpose |
|---|---|---|
| `members` | 17 | Core member profiles |
| `workouts` | 45 | Workout completions (capped 2/day) |
| `cardio` | 12 | Cardio completions (capped 2/day) |
| `daily_habits` | 100 | Habit log entries (capped 10/day distinct) |
| `session_views` | 48 | Live session views |
| `replay_views` | — | Replay views |
| `wellbeing_checkins` | 14 | Weekly check-ins |
| `monthly_checkins` | 0 | Monthly check-ins (new, no usage yet) |
| `kahunas_checkins` | — | Legacy Q&A completions (imported from Kahunas) |
| `weekly_scores` | — | Weekly check-in scores by ISO week |
| `weekly_goals` | — | AI-generated weekly goals |
| `ai_interactions` | — | All Anthropic API calls logged |
| `ai_decisions` | — | AI routing and decision log |
| `activity_dedupe` | — | Over-cap inserts routed here |

**Workout and exercise:**

| Table | Purpose |
|---|---|
| `workout_plans` | 244 rows — the plan library (PPL, Upper/Lower, Full Body, Home, Movement) |
| `workout_plan_cache` | 15 rows — per-member 8-week programme JSONB |
| `exercise_logs` | Plan-agnostic sets/reps/weight log |
| `exercise_swaps` | Member exercise substitutions |
| `exercise_notes` | Per-exercise notes |
| `custom_workouts` | Member-created workouts |

**AI and persona:**

| Table | Purpose |
|---|---|
| `personas` | 5 personas with full system prompts |
| `persona_switches` | Member persona change requests |
| `running_plan_cache` | Legacy localStorage-era cache |
| `member_running_plans` | New server-side running plan storage (shipped 20 April) |
| `knowledge_base` | Reference content for AI grounding |

**Habit and nutrition:**

| Table | Rows | Purpose |
|---|---|---|
| `habit_themes` | 5 | Monthly theme definitions |
| `habit_library` | 30 | All available habits |
| `member_habits` | — | 5 habits per member |
| `nutrition_logs` | — | Food log entries |
| `nutrition_my_foods` | — | Member-saved custom foods |
| `nutrition_common_foods` | 125 | Pre-populated food database |
| `weight_logs` | — | Member weight entries (one per day, upsert) |

**Infrastructure and monitoring:**

| Table | Purpose |
|---|---|
| `platform_alerts` | Error log from client and server. 31 records — **visible only to service role; RLS has no policies. Fix on the list** |
| `platform_metrics_daily` | Daily rollups for admin dashboard |
| `member_stats` | Per-member rollup, refreshed every 15 min |
| `member_activity_daily` | Per-member per-date activity counts |
| `member_home_state` | Pre-aggregated dashboard data (shipped 20 April) |
| `company_summary` | Per-employer rollup |
| `admin_users` | Admin dashboard allowlist (Dean, Lewis) |
| `push_subscriptions` | VAPID push subscriptions per device |
| `engagement_emails` | Re-engagement email log (streams A/B/C1/C2/C3) |
| `session_chat` | Live session chat, last 50 messages per session |
| `certificates` | Member certificate records |
| `employer_members` | Member-to-employer relationships |
| `service_catalogue` | 21 rows — all available sessions and content |
| `vyve_job_runs` | Cron and job execution log |

**Aggregation rules:**
- Most aggregation tables are service-role only (RLS enabled, no client policies). Clients read via Edge Function.
- `member_home_state` is the exception — RLS policy `auth.email() = member_email` allows direct client reads.
- All aggregation trigger functions must be `SECURITY DEFINER`.

**Activity caps (enforced via `enforce_cap_*` triggers):**

| Activity | Cap |
|---|---|
| `daily_habits` | 10 distinct habits/day (raised from 1) |
| `workouts` | 2/day |
| `cardio` | 2/day |
| `session_views` | 2/day |
| `kahunas_checkins` | 1/ISO week |

**Over-cap inserts:** routed to `activity_dedupe` (not discarded).

**Key SQL functions:**
- `set_activity_time_fields()` — sets day_of_week, time_of_day, week_start, month from timestamp (BST-aware)
- `get_charity_total()` — returns capped activity counts for charity milestone calculation
- `refresh_member_home_state(p_email)` — refreshes the pre-aggregated home dashboard
- `recompute_all_member_stats()` — refreshes admin dashboard aggregates
- `rebuild_member_activity_daily()` — nightly job

**Email lowercasing:** The `zz_lc_email` trigger lowercases `member_email` on every INSERT/UPDATE across 42 tables. Application code does not need to `.toLowerCase()` before writing.

**Tables that do NOT exist (despite being referenced in old docs):** `monthly_summaries`, `activity_patterns`, `charity_totals`, `audit_log`, `milestone_messages`. Do not try to reference them.

## 4.5 Edge Functions

**Core operational Edge Functions (24, April 2026):**

| Function | Purpose | JWT |
|---|---|---|
| `onboarding` | Persona + habits + programme overview + background 8-week workout plan | false (public; validates internally) |
| `member-dashboard` | Full dashboard data in one call | true |
| `wellbeing-checkin` | Weekly check-in with AI recommendations | true |
| `monthly-checkin` | Monthly check-in with AI report | true |
| `log-activity` | PWA activity logging (replaces Make for all activity writes) | true |
| `employer-dashboard` | Aggregate employer data; API key auth | Custom API key |
| `anthropic-proxy` | Running plan AI calls | true |
| `send-email` | Brevo transactional email | false |
| `re-engagement-scheduler` | Cron 08:00 UTC daily; streams A/B/C1/C2/C3 | false |
| `daily-report` | Cron 08:05 UTC daily | false |
| `weekly-report` | Cron Monday 08:10 UTC | false |
| `monthly-report` | Cron 1st of month 08:15 UTC | false |
| `certificate-checker` | Cron 09:00 UTC daily | false |
| `certificate-serve` | Serves certificate HTML | false |
| `github-proxy` | GET + PUT to vyve-site via shared-secret auth | Custom header auth |
| `off-proxy` | Open Food Facts proxy | false |
| `send-session-recap` | Session recap emails | false |
| `send-journey-recap` | Journey recap emails | false |
| `backfill-auth-users` | Auth user creation utility | false |
| `internal-dashboard` | Internal metrics | false |
| `ops-brief` | Ops brief generation | false |
| `habit-reminder` | Daily habit push notification (**broken since 11 April, fix priority**) | false |
| `streak-reminder` | Streak push notification (**broken since 11 April, fix priority**) | false |
| `warm-ping` | Every 5 min — keeps service warm | false |

**Deploy rule:** Full `index.ts` required — no partial updates. Large EFs (>10 KB) must be read from GitHub into a variable and passed to the deploy call. Never pass inline via `COMPOSIO_MULTI_EXECUTE_TOOL`.

**Staging backup:** Only `onboarding_v67.ts` is currently in `VYVEBrain/staging/` — and it's 7 versions stale. **All 24 core Edge Functions should be backed up to the Brain — priority P0 from the 14 April audit.**

## 4.6 Service Worker and offline architecture

`sw.js` — network-first for HTML, cache-first for static assets. Shipped 21 April 2026.

**Strategy:**
- `install` handler calls `self.skipWaiting()` after `cache.addAll` — new SW activates on the next page load, no tab-close needed
- `activate` handler calls `self.clients.claim()` plus old-cache purge — open tabs immediately adopt the new SW
- **HTML navigations** (`req.mode === 'navigate'`, `.html`, or `/`) use network-first: every page reload fetches the latest HTML from GitHub Pages, falls back to cache only when offline
- **Static assets** (JS, CSS, images) use cache-first with network fallback
- Cross-origin requests and any `/functions/*` or `/auth/*` calls bypass the SW entirely
- `message` handler responds to `{type:'SKIP_WAITING'}` for future update-prompt UI

**Cache version format:** `vyve-cache-v2026-04-[date][letter]`. Current: `vyve-cache-v2026-04-21f-navjs-body-prepend`.

**Implication:** HTML-only changes reach members on the next reload without a cache bump. Cache bumps are still required for JS, CSS, or other cached-first assets.

**Offline manager:** `offline-manager.js` handles offline-queued actions and replays them when the connection returns. Used by the activity log flow.

## 4.7 Design system

Three phases shipped so far (17 April and 21 April 2026):

**Phase A — Tokens (17 April):** Brand accents (`--teal`, `--teal-lt`, `--teal-xl`, `--teal-dark`, `--green`, `--amber`, `--coral`), fonts (`--font-head`, `--font-body`), scales (spacing `--space-0` → `--space-16`, typography `--text-2xs` → `--text-4xl`, radius scale, shadow scale).

**Phase B — Semantic colour migration (17 April) + semantic token layer refinement (21 April):**

Three families of theme-aware tokens. Values differ for `[data-theme="dark"]` (default) and `[data-theme="light"]`.

- **Text tokens:** `--label-strong`, `--label-medium`, `--label-weak`, `--label-accent`, `--label-accent-strong`, `--label-eyebrow`, `--label-heading-em`, `--label-on-accent`, `--label-success`, `--label-warning`, `--label-danger`
- **Fill tokens:** `--fill-subtle`, `--fill-subtle-hover`, `--fill-accent`, `--fill-accent-hover`, `--fill-accent-strong`, `--fill-success`, `--fill-warning`, `--fill-danger`
- **Line tokens:** `--line-subtle`, `--line-accent`, `--line-accent-strong`, `--line-success`, `--line-warning`, `--line-danger`

**Rules:**
- New CSS must use semantic tokens. Never use `--teal-lt` or `--teal-xl` as text colours — they fail WCAG AA contrast on the light background. Reserve those for graphical elements (dots, rings, chart lines).
- For filled accent backgrounds, text must use `--label-on-accent` (always white).
- Nav chrome is locked dark in both themes — it does not flip with `[data-theme="light"]`. Scoped override block in theme.css.
- All contrast verified WCAG AA compliant on both themes.

**Activity track colours:**

| Token | Hex | Activity |
|---|---|---|
| `--track-habits` | #4DAAAA | Daily Habits |
| `--track-workouts` | #E09B3D | Workouts |
| `--track-cardio` | #E06060 | Cardio |
| `--track-sessions` | #9B7AE0 | Sessions |
| `--track-nutrition` | #2D9E4A | Nutrition |

**Habit pot colours:**

| Token | Hex | Theme |
|---|---|---|
| `--pot-movement` | #4DAAAA | Movement |
| `--pot-nutrition` | #2D9E4A | Nutrition |
| `--pot-mindfulness` | #5BA8D9 | Mindfulness |
| `--pot-social` | #E879A3 | Social |
| `--pot-sleep` | #6366B8 | Sleep |

**Phase C — Session template consolidation (17 April):** 14 session-page stubs + 4 shared files.

**Phase D (components) and E (typography/spacing)** — open backlog. When they land, they must consume the semantic tokens, not raw brand tokens.

## 4.8 Navigation system

`nav.js` owns all navigation chrome. Injected at `document.body` level — outside `#app` and `#skeleton` — to be independent of page loading state.

**Injection heights (mobile ≤768px):**
- Mobile top header: `position:sticky; top:0; height:56px` (+ safe-area-inset-top). Injected via `document.body.prepend()`.
- Bottom nav: `position:fixed; bottom:0; z-index:9999; ~62px + safe-area`. Injected via `document.body.appendChild()`.
- Body gets `padding-bottom: calc(62px + env(safe-area-inset-bottom, 0px)) !important`
- Page-level sticky elements use `top:56px` on mobile (not `top:0`)
- Modals use `z-index:10001` minimum

**Standard script order** on every portal page:
1. `theme.js` (before `</head>`)
2. `auth.js`
3. `nav.js`
4. `offline-manager.js`

New pages must not roll their own top-bar or bottom-nav markup. Do not declare your own CSS for `.desktop-nav`, `.nav-logo`, `.nav-badge`, etc. — those class names belong to nav.js.

**Mobile `.wrap` padding template:** `padding: 24px 16px 100px` at `@media(max-width:768px)`. 24px top clears the nav.js sticky mobile header; 100px bottom clears the bottom nav.

**Sub-page detection:** `isNavPage` matches only the 4 hub paths (`/`, `/index`, `/exercise`, `/nutrition`, `/sessions`). Sub-pages get a back button in the mobile header while still highlighting the correct bottom-nav tab. `subPageLabels` map provides correct titles.

**Desktop (≥768px):** More dropdown and profile avatar dropdown. More dropdown grouped: Check-Ins (Weekly, Monthly), Progress (Certificates, Leaderboard, Activity Score), Content (Guides, How-to Videos, Catch-up), Settings.

## 4.9 AI integration rules

**Anthropic Claude** is the only AI model in use. Split across:
- **Claude Sonnet 4** for complex reasoning: persona assignment, programme overview generation, check-in recommendations, monthly reports
- **Claude Haiku 4.5** for faster/cheaper calls: running plan generation, recommendation text

**Rules:**
1. AI keys NEVER in HTML or committed files. Server-side in Edge Functions only.
2. AI calls always via Edge Functions with a clear model choice and max_tokens.
3. All calls logged to `ai_interactions` for cost and debugging.
4. Outputs sanitised before `innerHTML` render (tech-debt item: XSS audit on AI content).
5. Stress scale is inverted (1 = stressed, 10 = calm) — every prompt must state this explicitly to avoid model confusion.
6. Response-shape mismatches between EF versions break frontend pages. Always audit pages when bumping EF versions.

## 4.10 Security state

**Current posture (21 April 2026):**

- All 70 tables have RLS enabled
- All 24 core Edge Functions use service-role key server-side only
- All member-data-handling EFs validate JWT internally
- `github-proxy` has shared-secret auth (`x-proxy-key`)
- `member-dashboard` is JWT-only (no `?email=` fallback — closed 11 April)
- `onboarding` CORS restricted to `https://www.vyvehealth.co.uk`
- All contrast verified WCAG AA on both dark and light themes

**Remaining priorities (from 11 April full system audit + 14 April report pack):**

4 critical items still outstanding:
1. Fix push notification crons (30 min — the JSON syntax bug since 11 April)
2. Add `platform_alerts` RLS policy so errors become visible (15 min — the 31 alerts currently trapped)
3. Back up all 24 core Edge Functions to VYVEBrain staging (1 hour — currently only 1/24 backed up, 7 versions stale)
4. XSS sanitisation on AI-generated `innerHTML` (1 hour)

Medium-priority follow-ups:
- Hash PostHog emails before sending (30 min)
- CSP meta tags on all portal pages (2–3 hrs)
- Per-employer dashboard auth (6–8 hrs) — required for Sage
- GDPR data export Edge Function (4–5 hrs) — required for Sage
- GDPR data delete Edge Function (5–6 hrs) — required for Sage
- Stripe webhook (3–4 hrs) — needed to track onboarding funnel properly
- Security questionnaire template (3–4 hrs) — for enterprise procurement

## 4.11 Hard rules (never break)

1. **API keys never in HTML or GitHub.** Server-side Edge Functions only.
2. **Auth0 is dead.** Never reference it.
3. **Kahunas / PAD are dead.** Product is "VYVE Health app".
4. **Never say "Corporate Wellness"** as a tagline.
5. **sw.js cache must be bumped after every portal push that touches JS/CSS.** Pattern: `vyve-cache-v2026-04-[date][letter]`. HTML-only changes reach users via network-first without a bump.
6. **EF deploys require full `index.ts`.** No partial updates.
7. **Dual dark/light CSS blocks.** `theme.js` before `</head>`.
8. **Employer dashboard is aggregate only.** No PII ever visible to employers.
9. **HAVEN must signpost professional help** if a member is in crisis. Clinical review by Phil required before active promotion.
10. **Password reset emails route to `set-password.html`.**
11. **GitHub writes via `github-proxy` PUT** (with `x-proxy-key`). Composio MCP is READ-ONLY.
12. **`workouts.html` uses MutationObserver on `#app`.** Never revert to `waitForAuth`.
13. **Business email: team@vyvehealth.co.uk.** Never personal emails for business.
14. **Dean does not use Make.** Lewis only.
15. **Stress scale: 1 = very stressed, 10 = very calm.** Never treat high stress as negative.
16. **`member_habits.assigned_by`:** only `'onboarding'`, `'ai'`, `'theme_update'`, `'self'` allowed.
17. **Nav overlap:** sticky elements use `top:56px` on mobile. Bottom nav `z-index:9999`. Modals `z-index:10001+`.
18. **Modal sheets must `stopPropagation`** on the sheet element.
19. **Settings cache:** `vyve_settings_cache` in localStorage, 10-min TTL, keyed to user email.
20. **Habit count = distinct `activity_date` values**, not raw rows. Cap 10/day.
21. **`verify_jwt: false` is the VYVE deploy default.** All EFs do internal JWT validation.
22. **AI stays server-side.** All Anthropic calls via Edge Functions only.
23. **Lewis dislikes emojis.** Strip all emoji from content/copy before final commit.
24. **Talk first, build second.** Dean prefers to confirm direction before implementation for product/architecture decisions.
25. **Large HTML files (>50KB): use `github-proxy` PUT**, not inline Composio commits.
26. **Never pass large file content via inline `COMPOSIO_MULTI_EXECUTE_TOOL`** — use the workbench.
27. **Dean does not run SQL manually** — deploy DDL via one-shot Edge Functions using the `postgres` Deno driver.
28. **Build speed heuristic:** "1 week" = 1–2 focused days. "2–3 weeks" = 3–5 days.
29. **GDPR / UK compliance by default.** RLS on all user/employer data. Anonymisation for workforce insights.
30. **For Supabase EF deploys of large files (>10KB)** always read from GitHub, store in a variable, pass to deploy. Never inline.
31. **`sw.js` activate handler: no page migration logic.** Just purge old caches.
32. **Never inject `<script>` tags via naive string search.** The `</script>` in the injected tag will terminate any `<script>` block it lands inside.
33. **Most aggregation tables are service-role only.** Read via Edge Function. `member_home_state` is the exception.
34. **Activity caps are DB-level** (via `enforce_cap_*` triggers). Do not duplicate in the application layer.
35. **Email lowercasing is automatic** (via `zz_lc_email` trigger on 42 tables). Application code does not need to `.toLowerCase()` before writing.
36. **Aggregation trigger functions must be `SECURITY DEFINER`.**
37. **Nav chrome stays dark in light theme.** Desktop nav, mobile header, bottom nav, more-menu, avatar panel all on the dark palette regardless of `[data-theme="light"]`.
38. **nav.js injects nav chrome at `document.body` top** via `prepend()`. Not inside `#app` or `#skeleton`.
39. **New pages load 4 standard scripts in order:** `theme.js`, `auth.js`, `nav.js`, `offline-manager.js`. Do not roll own top-bar or bottom-nav markup.
40. **Mobile `.wrap` padding template:** `padding: 24px 16px 100px` at `@media(max-width:768px)`.
41. **Use the semantic token layer for new CSS** (`--label-*`, `--fill-*`, `--line-*`). Reserve `--teal-lt`/`--teal-xl` for graphical use only.
42. **HTML cache-bumps are optional** since network-first sw.js shipped 21 April. Still required for JS/CSS/asset changes.

## 4.12 Known technical debt

**Bugs (4 active in `platform_alerts`, from 14 April audit):**
1. `workouts-library.js:40` — SyntaxError
2. `yoga-live.html:142` — `switchTab` not defined
3. `index.html:853` — `getTimeGreeting` not defined
4. `workouts.html` — `showToast` not defined

**Missing database indexes** (10 tables, `workouts` has 3,654 seq scans). 2-minute migration ready and tested.

**Large files and duplication:**
- `VYVE_Health_Hub.html` (183 KB) — legacy, candidate for deletion
- 8 live session pages (~22 KB each = 178 KB) — consolidate to 1 parameterised page
- 8 replay pages (~17 KB each = 131 KB) — same
- Potential savings: ~280 KB, 14 fewer files

**Architectural debt:**
- `#skeleton` + `#app` dual-main DOM pattern on `exercise.html` and `movement.html` — fragile for future scripts doing broad selectors. Migrate to single `#app` with internal skeleton state. Pair with Design System Phase E.
- Legacy `running_plan_cache` table still exists alongside the new `member_running_plans` table. Migrate and drop the old one once the new one has all data.
- `brain/changelog.md` contains a base64-encoded historical blob (~152K decoded chars). Needs a dedicated cleanup session.

**Zero automated tests.** Tradeoff accepted for now given team size and pace.

**Monitoring blind spots:**
- `platform_alerts` has no RLS policy so the 31 errors captured since its creation are invisible to both Dean and Lewis without the service role.
- No real user monitoring beyond the skeleton-timeout watchdog.
- PostHog captures events but emails are unhashed — privacy debt.

---
---

# APPENDICES

## A. Key URLs, credentials and identifiers

### Primary URLs

| Reference | URL |
|---|---|
| Marketing site | https://www.vyvehealth.co.uk |
| Member portal | https://online.vyvehealth.co.uk |
| Employer dashboard (demo) | https://www.vyvehealth.co.uk/vyve-dashboard-live.html |
| Admin dashboard | https://admin.vyvehealth.co.uk (target, not yet deployed) |
| Podcast | https://www.vyvehealth.co.uk/vyve-podcast.html |
| ROI calculator | https://www.vyvehealth.co.uk/roi-calculator.html |
| Give back / charity | https://www.vyvehealth.co.uk/give-back.html |
| Onboarding form | https://www.vyvehealth.co.uk/welcome |
| Stripe payment link | https://buy.stripe.com/00wfZicla1Em0NnaIB93y00 |

### Internal tools

| Reference | URL / Value |
|---|---|
| Strategy Dashboard | online.vyvehealth.co.uk/strategy.html (password: `vyve2026`) |
| Demo Reset | online.vyvehealth.co.uk/index.html?reset=checkin |
| github-proxy PUT | https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/github-proxy?path=filename.html |

### Platform identifiers

| Service | Reference |
|---|---|
| Supabase Project ID | `ixjfklpckgxrwjlfsaaz` |
| Supabase Region | West EU / Ireland (eu-central-1) |
| PostHog Project Key | `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl` |
| HubSpot Hub ID | 148106724 |
| HubSpot timezone | Europe/London |
| HubSpot currency | GBP |
| Sage HubSpot Deal | 495586118853 |
| VAPID public key | `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4` |
| ICO Registration | 00013608608 |

### Brand assets

| Asset | Location |
|---|---|
| Logo | https://online.vyvehealth.co.uk/logo.png |
| Brand palette | #0D2B2B · #1B7878 · #4DAAAA · #C9A84C |
| Fonts | Playfair Display (headings), DM Sans / Inter (body) |
| Gemini image prompt suffix | "Colour grade: deep teals and greens, warm highlights, no text, no logos" |

### Stripe

| Item | Value |
|---|---|
| Payment link | buy.stripe.com/00wfZicla1Em0NnaIB93y00 |
| Coupons | `VYVE15`, `VYVE10` |
| B2C price | £20/month |
| B2B price | £10/user/month |

### Make scenarios

| Scenario | ID | Status |
|---|---|---|
| Social publisher | 4950386 | **BROKEN since 23 March, Lewis to fix** |
| Instagram analytics | 4993944 | Live → Data Store 107716 |
| Facebook analytics | 4993948 | Live → Data Store 107716 |
| LinkedIn analytics | 4993949 | Live → Data Store 107716 |
| Facebook connection | — | **EXPIRES 22 MAY 2026 — critical renewal** |

## B. Team contacts

| Name | Role | Email |
|---|---|---|
| Lewis Vines | CEO / Founder | lewisvines@hotmail.com |
| Dean Brown | CTO / Co-Founder | deanonbrown@hotmail.com |
| Alan Bird | COO | (to confirm) |
| Phil | Mental Health Lead | (to confirm) |
| Calum Denham | Performance / Fitness Content | (to confirm) |
| Vicki | Sales | (to confirm) |
| Cole | Community | (to confirm) |
| Business / all outbound | | team@vyvehealth.co.uk |

## C. Open decisions (owner and timing)

| Decision | Owner | Suggested timing |
|---|---|---|
| Volume discount tiers above 200 seats | Lewis | Before first enterprise contract |
| Annual billing discount percentage | Lewis | Before first enterprise contract |
| Health disclaimer wording (App Store + onboarding) | Lewis sign-off | Before next App Store submission |
| HAVEN activation timing | Phil + Lewis | After clinical review |
| Wellbeing Scorecard hosting (which domain, who builds the form) | Lewis | Not blocking |
| Today's Progress strip copy | Lewis | Not blocking |
| Podcast rebrand cutover timing | Lewis | Not blocking |
| 5 disabled Make tasks — keep or delete | Lewis | Not blocking |
| Google Workspace migration for team@vyvehealth.co.uk | Dean | Post-first-enterprise-contract |
| External DPO contracting | Dean | Before 500 members |
| Phil / Vicki / Cole email addresses on team@ | Lewis | Before public role announcement |

## D. Glossary

| Term | Meaning |
|---|---|
| **CIC** | Community Interest Company — UK legal structure for mission-driven organisations. Social value advantage in public sector tenders. |
| **EF** | Edge Function — Supabase server-side function written in TypeScript / Deno. |
| **PWA** | Progressive Web App — website that installs to home screen and works offline. |
| **RLS** | Row-Level Security — Postgres feature that scopes data access per-row. |
| **JWT** | JSON Web Token — signed token proving a user's identity. |
| **TDEE** | Total Daily Energy Expenditure — calorie maintenance value based on activity level. |
| **MRR / ARR** | Monthly / Annual Recurring Revenue. |
| **NRR** | Net Revenue Retention. |
| **DPA / DPIA** | Data Processing Agreement / Data Protection Impact Assessment. |
| **SCC** | Standard Contractual Clauses (for GDPR-compliant data transfers outside the UK/EEA). |
| **Persona** | One of five AI coach characters (NOVA, RIVER, SPARK, SAGE, HAVEN). Assigned at onboarding. |
| **Stream** | Exercise stream on the Hub (Workouts / Movement / Cardio). |
| **Brain** | The `VYVEHealth/VYVEBrain` repo — operational knowledge for AI continuity across sessions. |
| **Composio** | The tool platform Dean and Claude use to read/write GitHub and Supabase from AI sessions. |
| **Capacitor** | Framework that wraps a PWA as native iOS and Android apps. |

---

*End of master document.*

*This is the single definitive reference for VYVE Health CIC. If the information here conflicts with any other VYVE document, this document takes precedence.*

*For maintenance: update incrementally via PR commits to `VYVEHealth/VYVEBrain/brain/master.md`. Significant restructures should be preceded by questions to Lewis and Dean. Do not let this document go stale — stale master docs are worse than no master doc.*
