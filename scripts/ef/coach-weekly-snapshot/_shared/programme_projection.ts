// _shared/programme_projection.ts — v1 (Trainerize W0, PM-1068, 8 Sep 2026).
// THE single truth for "which programme week does a calendar week map to, and what does it schedule".
// Consumers: coach-weekly-snapshot (W0), the W5 scheduling wave (phases, workout_queue, schedule_overrides —
// all additive on this contract). Change the contract here, never in a consumer.
//
// Anchor rule: the member's CURRENT calendar week (Monday of `now`, or of paused_at while paused) is
// programme week `current_week`; every other week is offset from that. This honours coach/admin set-week,
// pause and resume exactly as the member app does, instead of trusting generated_at arithmetic.

export type WpcSession = { session_number?: number; session_name?: string; [k: string]: unknown };
export type WpcWeek = { week?: number; sessions?: WpcSession[]; [k: string]: unknown };
export type WpcRow = {
  member_email: string;
  programme_json: { weeks?: WpcWeek[]; sessions_per_week?: number; surface?: string; programme_name?: string; [k: string]: unknown } | null;
  plan_duration_weeks: number | null;
  current_week: number | null;
  is_active: boolean | null;
  paused_at: string | null;
  generated_at: string | null;
  source: string | null;
};

export type WeekProjection = {
  week_start: string;          // YYYY-MM-DD (Monday)
  week_index: number;          // 1-based programme week; 0 = outside the plan (before start, after end, or paused)
  scheduled: { session_number: number; session_name: string }[];
  scheduled_count: number;
  paused: boolean;
};

const DAY = 86400000;

/** UTC Monday 00:00 of the week containing d. */
export function mondayOf(d: Date): Date {
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (u.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  u.setUTCDate(u.getUTCDate() - dow);
  return u;
}

export function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }

/** Parse YYYY-MM-DD as UTC midnight. */
export function fromIso(s: string): Date { return new Date(s + 'T00:00:00Z'); }

/** Whole weeks between two Mondays (b - a). */
export function weeksBetween(a: Date, b: Date): number { return Math.round((b.getTime() - a.getTime()) / (7 * DAY)); }

/** The list of Monday dates ending at the week containing `now`, `count` weeks long, oldest first. */
export function recentWeekStarts(count: number, now: Date = new Date()): string[] {
  const thisMon = mondayOf(now);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(isoDate(new Date(thisMon.getTime() - i * 7 * DAY)));
  return out;
}

/** Programme week index for a given calendar week (Monday ISO date). 0 = outside plan. */
export function weekIndexFor(wpc: WpcRow | null, weekStart: string, now: Date = new Date()): { index: number; paused: boolean } {
  if (!wpc || !wpc.programme_json || wpc.is_active === false) return { index: 0, paused: false };
  const cur = Math.max(1, Number(wpc.current_week || 1));
  const total = Math.max(1, Number(wpc.plan_duration_weeks || (wpc.programme_json.weeks || []).length || 1));
  const anchorNow = wpc.paused_at ? new Date(Math.min(now.getTime(), new Date(wpc.paused_at).getTime())) : now;
  const anchorMon = mondayOf(anchorNow);
  const target = fromIso(weekStart);
  const offset = weeksBetween(anchorMon, target);
  // Paused: weeks after the pause week schedule nothing.
  if (wpc.paused_at && offset > 0) return { index: 0, paused: true };
  // Before the plan existed: nothing scheduled.
  if (wpc.generated_at && target.getTime() < mondayOf(new Date(wpc.generated_at)).getTime()) return { index: 0, paused: false };
  // current_week advances by session completion in the member app, not by the calendar — so an inactive
  // client sits on week 1 and every earlier calendar week since the plan existed also projects week 1
  // (sessions were scheduled, none were done). W5's strict/loose modes refine this; the clamp is the honest W0 read.
  const idx = Math.max(1, cur + offset);
  if (idx > total) return { index: 0, paused: false };
  return { index: idx, paused: false };
}

/** Sessions the plan schedules for a given calendar week. */
export function projectWeek(wpc: WpcRow | null, weekStart: string, now: Date = new Date()): WeekProjection {
  const { index, paused } = weekIndexFor(wpc, weekStart, now);
  if (!index || !wpc || !wpc.programme_json) return { week_start: weekStart, week_index: 0, scheduled: [], scheduled_count: 0, paused };
  const weeks = wpc.programme_json.weeks || [];
  // weeks[] may be keyed by .week or positional; prefer the .week match.
  let wk = weeks.find((w) => Number(w.week) === index);
  if (!wk) wk = weeks[index - 1];
  const sessions = (wk && Array.isArray(wk.sessions)) ? wk.sessions : [];
  let scheduled = sessions.map((s, i) => ({ session_number: Number(s.session_number || i + 1), session_name: String(s.session_name || ('Session ' + (i + 1))) }));
  if (!scheduled.length && wpc.programme_json.sessions_per_week) {
    const n = Math.max(0, Number(wpc.programme_json.sessions_per_week));
    scheduled = Array.from({ length: n }, (_, i) => ({ session_number: i + 1, session_name: 'Session ' + (i + 1) }));
  }
  return { week_start: weekStart, week_index: index, scheduled, scheduled_count: scheduled.length, paused };
}

/** Pick the plan that drives compliance: active, surface=workouts, coach-authored first, newest otherwise. */
export function pickCompliancePlan(rows: WpcRow[]): WpcRow | null {
  const cands = rows.filter((r) => r.is_active !== false && r.programme_json && ((r.programme_json.surface || 'workouts') === 'workouts'));
  if (!cands.length) return null;
  cands.sort((a, b) => {
    const ca = a.source === 'coach' ? 0 : 1, cb = b.source === 'coach' ? 0 : 1;
    if (ca !== cb) return ca - cb;
    return String(b.generated_at || '').localeCompare(String(a.generated_at || ''));
  });
  return cands[0];
}
