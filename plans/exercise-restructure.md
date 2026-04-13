# Exercise Restructure — Option A: Exercise Hub

> Decision: 13 April 2026. Dean selected Option A after reviewing all three architectures.
> Status: Planning — not yet in build.

---

## The Problem

VYVE originally assumed every member needed a gym programme. The platform has leapfrogged this — we can now serve any type of exercise. A 52-year-old menopausal member who's 3 stone overweight doesn't need a PPL split. She needs a walking plan and gentle movement. The current "Workouts" tab is gym-centric and intimidating for non-gym members.

## The Decision

**Rename "Workouts" → "Exercise"** across the app.

The Exercise tab becomes a **hub page** showing the member's active plan prominently at the top, with cards linking to other exercise streams below. Each stream opens into its own dedicated sub-page.

## Exercise Streams

| Stream | What it is | Who gets it | Page |
|--------|-----------|-------------|------|
| **Movement** | Walking plans, daily stretching, gentle mobility | Sandra-type members: low activity, returning from injury, desk workers, older adults, new to exercise | `movement.html` (new) |
| **Workouts** | Structured gym programmes (PPL, Upper/Lower, Full Body, Home) + exercise logging | Active gym-goers, strength-focused members | `workouts.html` (existing, becomes sub-page) |
| **Cardio** | Running plans, cycling logs, swimming logs | Endurance-focused members | `running-plan.html` (existing) + future cardio types |
| **Classes** | Yoga, pilates, guided sessions from live content | Cross-cutting — available to all | Links to sessions/replays |

## How It Works

### Exercise Hub Page (`exercise.html`)
- Shows the member's **primary assigned plan** as a hero card at the top
  - Sandra sees: "4-Week Movement Plan — Walk & stretch · Week 2 of 4" with today's activity and a "Mark Complete" button
  - Dean sees: "8-Week PPL Strength — Push/Pull/Legs · Week 3 of 8" with next session and a "Start Workout" button
- Below the hero card: cards for other available streams
- The hub adapts based on what the AI assigned at onboarding

### AI Routing at Onboarding
The onboarding questionnaire needs a new question (or modified existing question) to assess exercise type:

**"What does exercise look like for you right now?"**
- I don't really exercise
- I walk or do light activity
- I exercise at home
- I go to the gym regularly

This answer, combined with goals, age, stress, energy, and persona assignment, tells the AI which stream to assign as their primary plan:

| Signal | Primary Stream |
|--------|---------------|
| "I don't really exercise" + any goal | Movement |
| "I walk or do light activity" + weight loss/general | Movement |
| "I exercise at home" + strength goal | Workouts (Home programme) |
| "I go to the gym regularly" + strength/muscle | Workouts (gym programme) |
| Running/cardio/endurance goal | Cardio |
| High stress + low energy | Movement (gentle) |
| Age 50+ + beginner | Movement |

### Movement Plans (New)
- AI-generated or templated walking + movement plans
- Simple UX: weekly schedule, today's activity, done/not done
- Example Week 1: "Walk 20 min (Mon, Wed, Fri), Stretch 15 min (Tue, Thu)"
- Progressive: weeks get slightly longer/more varied
- No sets/reps/weight tracking — just completion

### Nav Changes
- Bottom nav: "Workouts" label → "Exercise"
- Exercise tab opens `exercise.html` (hub)
- Workouts page becomes a sub-page accessed from the hub
- Running plan page stays as-is, linked from Cardio card on hub

## What Changes

| Component | Change |
|-----------|--------|
| `nav.js` | "Workouts" → "Exercise", links to `exercise.html` |
| `exercise.html` | **NEW** — hub page |
| `movement.html` | **NEW** — movement plan display + tracking |
| `workouts.html` | Unchanged internally, but accessed from hub instead of nav |
| `running-plan.html` | Unchanged, linked from hub |
| `welcome.html` | New exercise-type question added |
| `onboarding` EF | AI routing logic for exercise stream assignment |
| `members` table | New column: `exercise_stream` (movement/workouts/cardio) |
| `movement_plans` table | **NEW** — movement plan data (or use workout_plan_cache with type) |
| `sw.js` | Cache bump after all changes |

## What Doesn't Change
- Existing workout logging (sets/reps/weight) — stays exactly as-is
- Running plan generator — stays as-is
- Exercise library — stays as-is
- Custom workouts — stays as-is
- All existing member data — nothing breaks

## Build Order (Suggested)
1. `exercise.html` — hub page with hero card + stream cards
2. `movement.html` — movement plan display + completion tracking
3. `nav.js` — rename tab, point to exercise.html
4. `welcome.html` — add exercise-type question
5. `onboarding` EF — AI routing for exercise stream
6. `members` table — add `exercise_stream` column
7. `sw.js` — cache bump

## Open Questions
- Movement plans: AI-generated (like running plans) or templated? Templates are faster to ship.
- Do we backfill existing members with an exercise_stream value based on their current data?
- Classes stream: link to existing sessions page or build a dedicated classes page?
- Should the hub show progress across all streams or just the primary one?

---

*Created: 13 April 2026*
