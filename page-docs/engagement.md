# engagement.html — The VYVE Score page

**What this page is.** The page where members see their VYVE Score — a single number from 50 to 100 that reflects how engaged they are with the platform over the last 7 days. Reached via the More menu in the bottom navigation.

**Why this page exists.** Two reasons. First, so members can see in one number whether they're using VYVE consistently, broadly, and recently. Second, so the platform itself has a single signal to read for "is this member slipping?" When the score drops, push notifications and emails trigger to bring them back. The score is a health signal, not a gamification toy.

---

## What members see

### The Score Hero

A circular ring showing the score (e.g. 78) out of 100. Next to it: a band label (Strong week / Steady / Sliding / Quiet) and a short message in VYVE voice that adapts to the score range. The message is welcoming, never shaming — even a low score reads as "one tap gets you started", not "you're failing".

### Consistency and Variety multipliers

Two cards under the hero. Each shows the multiplier value (e.g. 1.18×), the underlying count (e.g. "6 of 7 days"), a progress bar, and a short explanation. These are the two dimensions the score rewards beyond raw activity:

- **Consistency** rewards spreading activity across days. A member who logs every day for a week earns 1.30×; a member who showed up once earns 0.85×.
- **Variety** rewards using more than one pillar. A member who touched all five pillars in the last 7 days earns 1.20×; a workout-only member earns 0.90×.

### Where your score came from

A list of six rows — one per pillar — showing exactly how many points came from each. Today's Focus, Daily Habits, Body, Mind, Connect, Check-ins. Each row shows the count of activity logged, a short description of what counted, and the points earned. Pillars with zero activity show greyed out with a gentle suggestion ("A 10-min meditation earns 2pts and lifts your Variety multiplier").

### Activity Breakdown

Five cards — one per scoring pillar (Daily Habits, Body, Mind, Connect, Check-ins). Each card shows the count over a longer window (typically 30 days), current streak, and best streak. A small information eye (ⓘ) in the corner of each card opens a brief explainer of what counts for that pillar.

### 30-day activity strip

A grid showing the last 30 days, with each day showing small coloured dots for each type of activity logged that day. At-a-glance pattern recognition — when am I active, when do I drop off.

### How your score works

A plain-English explanation at the bottom of the page. Covers the 50-100 range, base points, the two multipliers, and the principle that you can't game it without genuine engagement.

---

## How a member uses this page

Most members tap into this page once or twice a week to check their score. They glance at the ring, scan which pillars are doing well or empty, and either feel reassured or get a small nudge to do something in a quiet pillar. The page is read-only — nothing on this page is itself a logging surface. All logging happens on the relevant pillar pages (habits.html, exercise.html, mind.html, connect.html) or via Today's Focus on the home page.

The page is the destination for two specific journeys: (a) tapping the Activity Score ring on the home page (if reinstated), and (b) tapping into a push notification that says "your VYVE score is sliding."

---

## How the score is calculated

```
final_score = 50 + min(50, (base_points × consistency_mult × variety_mult) / 2.5)
```

**The score floors at 50.** A member with no activity sees 50, not 0. This is deliberate — VYVE supports people who use it irregularly, and a brutal-low score on return would feel punishing.

**The score ceilings at 100.** Tuned so a realistic excellent week — daily activity across 4-5 pillars plus a weekly check-in — lands around 90-95, leaving 95-100 reserved for genuinely exceptional engagement.

### Base points

Activity earns points on a 7-day rolling window. Each log earns its point value at full strength on the day it was logged, then decays linearly to zero across 7 days. Today's log is worth 100%; yesterday's is worth ~86%; six days ago, ~14%; seven days ago, 0%. New logs continuously displace old ones — the score reflects what the member has done **recently**, not ever.

| Activity | Points | Daily cap |
|---|---|---|
| Today's Focus completion | 5 | 3/day (one per time-of-day slot) |
| Daily Habit logged | 1 | 5/day |
| Body activity (workouts, cardio, walks) | 2 | 2/day |
| Mind activity (meditation, journaling, sleep, etc) | 2 | 2/day |
| Connect activity (sessions, replays, check-ins) | 2 | 2/day |
| Weekly check-in | 8 | 1/week |
| Live check-in (form on weekly) | 4 | 1/week |
| Monthly check-in | 12 | 1/month |

Daily caps apply to *credit*, not to row storage. A member who logs 5 workouts in a day still has all 5 in their workout history; only the first 2 contribute to the score.

### Consistency multiplier (0.85× to 1.30×)

Counts distinct active days in the last 7. An active day is any day with at least one qualifying log.

| Active days in last 7 | Multiplier |
|---|---|
| 0–1 | 0.85× |
| 2–3 | 0.95× |
| 4–5 | 1.05× |
| 6 | 1.18× |
| 7 | 1.30× |

### Variety multiplier (0.90× to 1.20×)

Counts distinct pillars touched in the last 7 days: Today's Focus, Habits, Body, Mind, Connect. Check-ins are excluded — they're cadence-based, not a daily-variety signal.

| Pillars touched in last 7 | Multiplier |
|---|---|
| 1 | 0.90× |
| 2 | 1.00× |
| 3 | 1.05× |
| 4 | 1.12× |
| 5 | 1.20× |

---

## How the score drives re-engagement

The score isn't just for the member. It's also the signal the platform uses to decide when to nudge. Three thresholds:

| Trigger | Condition | Action |
|---|---|---|
| Soft slide | Score drops below 75 for the first time in 14 days | Gentle push: "Your VYVE score is sliding — one habit logs in 10 seconds." |
| Pillar gap | Score below 65 for 3 days running | Pillar-aware push: identifies which pillar has been empty and suggests a 10-minute action in it. |
| Re-engagement | Score below 55 for 7 days running | Routes into existing re-engagement email + push stream. |

The pillar-gap notification is the most useful of the three. It reads the variety calculation directly to name *which* pillar is being neglected and offers a specific 10-minute action in it.

---

## What this page does NOT do

- It does not log activity. All logging happens on the source pages (habits.html, exercise.html, mind.html, connect.html, sessions.html, focus pages).
- It does not show wellbeing. The previous version of the score included wellbeing self-reports as a component; this is gone. Submitting an honest "I feel rough today" should never penalise the score. The *act* of submitting a check-in earns its points; the contents of the check-in inform the AI recommendations, not the score.
- It does not show achievements. Those live on the Achievements tab of this page, which is a separate surface with its own data flow.

---

## Updates

The score updates **instantly** when the member logs activity. Tap a habit on habits.html → the score on engagement.html is already updated before the network call completes. This is because the score is computed client-side from the member's local Dexie database, not fetched from the server. Server is the backup, not the source.

The score on this page reads from the local cache first (instant), recomputes from Dexie second (~16ms), and verifies against the server in the background. If the server disagrees, the discrepancy is logged for investigation — the member sees the correct local value.

---

## Member-friendly summary

> "Your VYVE Score reflects how engaged you've been over the last 7 days. It starts at 50, can reach 100, and rewards three things: doing activity, spreading it across days, and using more than one part of VYVE. New logs lift it instantly; old logs fade away. Use it as a gentle weekly check on your engagement — and don't worry if it dips. One tap brings it back."
