# Achievements deep-dive — new chat prompt

> Created PM-309 (25 May 2026). Paste the section below into a fresh Claude conversation when you want to do the Achievements design session. The prompt is first-person from Dean's perspective and self-loading — it gives the new Claude enough context to pull the brain, do the Supabase enumeration, and start the design conversation without you having to re-explain the project.

---

## The prompt to paste

Load VYVE brain.

Once that's loaded, we're doing the Achievements deep-dive design session. The Achievements tab on `engagement-v2.html` is currently an empty-state placeholder ("being overhauled"). v1 trophy cabinet has been retired (PM-305 on 25 May 2026 — `engagement.html` is now a redirect to v2). Member achievement DATA is intact — every activity row in Supabase is preserved — but the SURFACE that displayed it is gone. We're rebuilding from scratch.

The campaign is described in `tasks/backlog.md` under "Achievements overhaul campaign" — eight design questions, soft-trigger of "wait at least 5 days of v2 device time before designing achievements against a pillar shape that may still be moving." We've now had enough device time, so we're starting.

What I want from this session, in this order:

**Phase 1 — Enumerate everything trackable.** Pull the live Supabase schema from project `ixjfklpckgxrwjlfsaaz`. List every member-keyed table that captures activity, with what each row represents. For each table, list the columns that could plausibly be the basis of an achievement (date column for streak-style achievements, metric columns for milestone-style achievements, foreign keys for variety/breadth-style achievements). Don't skip the obvious ones — daily_habits, workouts, cardio, session_views — but also don't miss the less obvious ones: weight_logs, nutrition_logs, persona_switches, monthly_checkins, member_achievements (if it exists), focus completions, mind_activities, connect_checkins, replay_video_views, session_live_views. Cross-reference against `brain/master.md` Section 6 (Supabase architecture) but treat the live schema as authoritative.

**Phase 2 — Enumerate every member-facing action.** Walk through every portal page (home, exercise/body, mind, connect, sessions, replays, weekly check-in, monthly check-in, food log, habits, settings) and list every action a member can take that could trigger an achievement. Tap a habit. Complete a focus card. Start and finish a workout. Watch a live session for 30+ seconds. Submit a check-in. Log a meal. Change persona. Use the app three days in a row. Use the app at 6am. The point of this enumeration isn't to commit to every one — it's to map the surface area so we can pick the right ones.

**Phase 3 — Design framework.** Help me work through the 8 design questions in the backlog campaign entry. The dominant constraint is the one I haven't been able to crack: balancing the regular user (who finishes the 5/10/30 achievements quickly and needs more to chase) against the in-and-out user (who needs early wins to stay motivated). v1 jumped from 10 to 30 to 100 to 250 which felt too sparse for daily users. I'm thinking we might need THREE tiers of achievement cadence:
- Short-cadence (3, 7, 14 logs) — early wins, fast feedback, keep daily users dopamine-hit
- Medium-cadence (30, 60, 100 logs) — the certificate territory, charity-mechanic-linked, real commitment
- Long-cadence (250, 500, 1000 logs) — legacy achievements for power users, status signals
Plus possibly BEHAVIOURAL achievements that aren't count-based at all — "used all 5 pillars in one week," "logged before 8am five days in a row," "first time hitting a Powerhouse score," "donated your fifth charity month." Behavioural achievements are inherently milestone-y rather than cumulative, so they don't need cadence tiering at all.

**Phase 4 — Visual direction.** v1's trophy cabinet looked terrible — the cup-and-laurel SVGs felt cheap, the cabinet shelf gradient looked dated, the locked-vs-earned states didn't read clearly. I don't want to redo that aesthetic. Open to:
- Earned badges (icon + accent colour matching the pillar it belongs to)
- Card grid like the Progress tab metric cards on engagement-v2 (consistent with the rest of v2)
- List with progress bars (most utilitarian, least exciting)
- Something else entirely

The brand language is `#0D2B2B` dark, `#1B7878` teal, `#4DAAAA` teal-light, `#C9A84C` gold. Playfair Display for headings, DM Sans/Inter for body. Mockup before code per usual.

**Phase 5 — Persona awareness.** Five AI personas drive the app: NOVA (performance), SPARK (motivational), RIVER (mindful), SAGE (knowledge-first), HAVEN (mental health, safety-gated). Achievements need to respect persona context — RIVER and HAVEN members shouldn't see "push harder this week" framing; NOVA members shouldn't get watered-down language. Either:
- Persona-conditional achievement set (some achievements only show to certain personas)
- Persona-conditional copy on universal achievements (same milestone, different framing language)
- Universal neutral framing
Lewis will own final copy regardless, but the framework decision is mine.

**Working ground rules for this session:**

- Mockup before code. No matter how clear the spec seems, sketch it in prose or simple HTML first, get my sign-off, then build.
- Don't ship anything until the design is fully settled. This is design first, build second. PM-310+ ships are about the data model and rendering; the design questions above are the gate.
- Watch for parallel session activity. There's a tracker debug session in another tab that may still be shipping `vyve-site` commits. §23.41/§23.66/§23.68 discipline applies — fresh HEAD before every brain claim, content rebase before every code commit.
- Be willing to push back. If I'm conflating two ideas, say so. If a design direction will create debt, say so. If I'm asking for something that contradicts an earlier decision in the brain, surface it. The default of decisive single-recommendation answers still applies — but on a design call this complex, the back-and-forth is more important than usual.

Start with Phase 1. Pull the live Supabase schema and produce the table enumeration. We'll work through the rest as we go.

---

## Notes on this prompt (for Dean's reference, not for pasting)

**Why a new chat.** Achievements is a substantive design surface that needs full context-window headroom for the Supabase enumeration + the design conversation + the mockup work. Doing it in the same chat as the engagement-v2 build (which is already at ~50% of context with all the brain content and code patches) would force aggressive truncation partway through.

**Why first-person.** Per the brain's session-prompts rule: "Write in conversational natural prose, first-person from Dean's perspective, minimal formatting. No CRITICAL sections, no directive ALL-CAPS blocks." This prompt is shaped to match how Dean opens every other session.

**Estimated session length.** Probably 2-3 hours for Phases 1-3 (enumeration + design questions resolved), another 2-3 hours for Phases 4-5 (visual + persona pass) including mockup iterations. Build phases (PM-310+) come after.

**When to use this.** Whenever Dean has a clear-headed window of at least 2 hours and is ready to make design calls. Not late at night, not when juggling parallel sessions on other work, not in passing.
