// _shared/programme_projection.ts — v2 (Trainerize W5, PM-1089, 8 Sep 2026). v1 = W0 PM-1068.
// THE single truth for "which programme week does a calendar week map to, and what does it schedule".
// Consumers: coach-weekly-snapshot (W0), coach-provision-client (W5 queue sweep), the coach portal's client
// Calendar tab and the member app carry a JS port of the same rules (portal `w5proj`, member `workouts-programme.js`).
// Change the contract here, then re-port — never fork the rules in a consumer.
//
// v2 additions (all additive on v1):
//   • `week_start` on the wpc row (W5 column). When present the programme is CALENDAR-anchored: programme week
//     index = whole weeks since week_start + 1, clamped to the plan length, paused weeks project nothing.
//     When null the v1 anchor rule stands (this calendar week = current_week; completion advances the week).
//   • `day` on a session (0=Mon..6=Sun, written by coach_build_program_json v2). Sessions without a day are spread
//     across the week by count (DEFAULT_DAYS) so AI plans and the weekly `workout` kind still land on dates.
//   • `phases[]` on programme_json ({name, weeks:[1-based output week numbers]}) → phaseFor().
//   • `schedule_overrides` ({ '<orig ISO date>': { to: '<ISO date>' } | { skip: true } }) applied in
//     projectSessions(); a moved session keeps its week_index / session_number and reports orig_date + moved.
//   • projectSessions(): dated sessions for a date range — the calendar/overlay/queue primitive.
//   • programmeEnd(): the last scheduled date (Sunday of the final week) for calendar-anchored plans.

export type WpcSession = { session_number?: number; session_name?: string; day?: number; estimated_duration_mins?: number; [k: string]: unknown };
export type WpcWeek = { week?: number; sessions?: WpcSession[]; [k: string]: unknown };
export type WpcPhase = { name?: string; weeks?: number[] };
export type WpcRow = {
  member_email: string;
  programme_json: { weeks?: WpcWeek[]; sessions_per_week?: number; surface?: string; programme_name?: string; phases?: WpcPhase[]; [k: string]: unknown } | null;
  plan_duration_weeks: number | null;
  current_week: number | null;
  is_active: boolean | null;
  paused_at: string | null;
  generated_at: string | null;
  source: string | null;
  week_start?: string | null;
};

export type ScheduleOverride = { to?: string; skip?: boolean; by?: string; at?: string };
export type ScheduleOverrides = Record<string, ScheduleOverride>;

export type WeekProjection = {
  week_start: string;          // YYYY-MM-DD (Monday)
  week_index: number;          // 1-based programme week; 0 = outside the plan (before start, after end, or paused)
  scheduled: { session_number: number; session_name: string; day: number; date: string }[];
  scheduled_count: number;
  paused: boolean;
  phase: PhaseInfo | null;
};

export type PhaseInfo = { name: string; index: number; week_of_phase: number; phase_weeks: number };

export type DatedSession = {
  date: string;                // where it lands after overrides
  orig_date: string;           // where the plan put it
  week_start: string;
  week_index: number;
  session_number: number;
  session_name: string;
  day: number;                 // 0=Mon..6 of orig_date
  estimated_duration_mins: number | null;
  phase: PhaseInfo | null;
  moved: boolean;
  skipped: boolean;
};

const DAY = 86400000;

/** Even spread for sessions that carry no `day`: index by count, 1..7. */
export const DEFAULT_DAYS: Record<number, number[]> = {
  1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6]
};

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

export function addDays(iso: string, n: number): string { return isoDate(new Date(fromIso(iso).getTime() + n * DAY)); }

/** Whole weeks between two Mondays (b - a). */
export function weeksBetween(a: Date, b: Date): number { return Math.round((b.getTime() - a.getTime()) / (7 * DAY)); }

/** The list of Monday dates ending at the week containing `now`, `count` weeks long, oldest first. */
export function recentWeekStarts(count: number, now: Date = new Date()): string[] {
  const thisMon = mondayOf(now);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(isoDate(new Date(thisMon.getTime() - i * 7 * DAY)));
  return out;
}

export function planWeeks(wpc: WpcRow): number {
  return Math.max(1, Number(wpc.plan_duration_weeks || (wpc.programme_json?.weeks || []).length || 1));
}

/** True when the plan is calendar-anchored (W5 week_start present and parseable). */
export function isCalendar(wpc: WpcRow | null): boolean {
  return !!(wpc && wpc.week_start && /^\d{4}-\d{2}-\d{2}$/.test(String(wpc.week_start)));
}

/** Programme week index for a given calendar week (Monday ISO date). 0 = outside plan. */
export function weekIndexFor(wpc: WpcRow | null, weekStart: string, now: Date = new Date()): { index: number; paused: boolean } {
  if (!wpc || !wpc.programme_json || wpc.is_active === false) return { index: 0, paused: false };
  const total = planWeeks(wpc);
  const target = fromIso(weekStart);
  if (isCalendar(wpc)) {
    // v2: calendar anchor. Paused: the pause week still projects (sessions were scheduled), later weeks do not.
    const anchor = mondayOf(fromIso(String(wpc.week_start)));
    if (wpc.paused_at && target.getTime() > mondayOf(new Date(wpc.paused_at)).getTime()) return { index: 0, paused: true };
    const idx = weeksBetween(anchor, target) + 1;
    if (idx < 1 || idx > total) return { index: 0, paused: false };
    return { index: idx, paused: false };
  }
  // v1: this calendar week = current_week; completion advances the week.
  const cur = Math.max(1, Number(wpc.current_week || 1));
  const anchorNow = wpc.paused_at ? new Date(Math.min(now.getTime(), new Date(wpc.paused_at).getTime())) : now;
  const anchorMon = mondayOf(anchorNow);
  const offset = weeksBetween(anchorMon, target);
  if (wpc.paused_at && offset > 0) return { index: 0, paused: true };
  if (wpc.generated_at && target.getTime() < mondayOf(new Date(wpc.generated_at)).getTime()) return { index: 0, paused: false };
  const idx = Math.max(1, cur + offset);
  if (idx > total) return { index: 0, paused: false };
  return { index: idx, paused: false };
}

/** Phase that owns a programme week, or null when the plan has no phases (or the week is outside them). */
export function phaseFor(wpc: WpcRow | null, weekIndex: number): PhaseInfo | null {
  const phases = wpc?.programme_json?.phases;
  if (!Array.isArray(phases) || !phases.length || !weekIndex) return null;
  for (let i = 0; i < phases.length; i++) {
    const ws = (phases[i].weeks || []).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
    const pos = ws.indexOf(weekIndex);
    if (pos >= 0) return { name: String(phases[i].name || ('Phase ' + (i + 1))), index: i + 1, week_of_phase: pos + 1, phase_weeks: ws.length };
  }
  return null;
}

/** The week's sessions as [{session_number, session_name, day}] — explicit day first, spread fallback, no collisions. */
export function weekSessions(wpc: WpcRow, index: number): { session_number: number; session_name: string; day: number; estimated_duration_mins: number | null }[] {
  const weeks = wpc.programme_json?.weeks || [];
  let wk = weeks.find((w) => Number(w.week) === index);
  if (!wk) wk = weeks[index - 1];
  let sessions: WpcSession[] = (wk && Array.isArray(wk.sessions)) ? wk.sessions : [];
  if (!sessions.length && wpc.programme_json?.sessions_per_week) {
    const n = Math.max(0, Number(wpc.programme_json.sessions_per_week));
    sessions = Array.from({ length: n }, (_, i) => ({ session_number: i + 1, session_name: 'Session ' + (i + 1) }));
  }
  const spread = DEFAULT_DAYS[Math.min(7, Math.max(1, sessions.length))] || DEFAULT_DAYS[7];
  const used = new Set<number>();
  const out: { session_number: number; session_name: string; day: number; estimated_duration_mins: number | null }[] = [];
  sessions.forEach((s, i) => {
    let day = (typeof s.day === 'number' && s.day >= 0 && s.day <= 6) ? s.day : -1;
    if (day < 0) { day = spread[i] ?? i; while (used.has(day) && day < 6) day++; }
    used.add(day);
    out.push({ session_number: Number(s.session_number || i + 1), session_name: String(s.session_name || ('Session ' + (i + 1))), day, estimated_duration_mins: s.estimated_duration_mins != null ? Number(s.estimated_duration_mins) : null });
  });
  return out;
}

/** Sessions the plan schedules for a given calendar week (overrides optional; skipped sessions drop out). */
export function projectWeek(wpc: WpcRow | null, weekStart: string, now: Date = new Date(), overrides: ScheduleOverrides | null = null): WeekProjection {
  const { index, paused } = weekIndexFor(wpc, weekStart, now);
  if (!index || !wpc || !wpc.programme_json) return { week_start: weekStart, week_index: 0, scheduled: [], scheduled_count: 0, paused, phase: null };
  const scheduled = weekSessions(wpc, index)
    .map((s) => ({ ...s, date: addDays(weekStart, s.day) }))
    .filter((s) => !(overrides && overrides[s.date] && overrides[s.date].skip));
  return { week_start: weekStart, week_index: index, scheduled: scheduled.map((s) => ({ session_number: s.session_number, session_name: s.session_name, day: s.day, date: s.date })), scheduled_count: scheduled.length, paused, phase: phaseFor(wpc, index) };
}

/** Dated sessions between two ISO dates inclusive, overrides applied. Skips are returned with skipped=true. */
export function projectSessions(wpc: WpcRow | null, fromDate: string, toDate: string, overrides: ScheduleOverrides | null = null, now: Date = new Date()): DatedSession[] {
  if (!wpc || !wpc.programme_json) return [];
  const out: DatedSession[] = [];
  let ws = isoDate(mondayOf(fromIso(fromDate)));
  const end = fromIso(toDate).getTime();
  // walk every week whose Monday is <= toDate; moved sessions can only land inside their own week, so this is complete
  while (fromIso(ws).getTime() <= end) {
    const { index } = weekIndexFor(wpc, ws, now);
    if (index) {
      const phase = phaseFor(wpc, index);
      for (const s of weekSessions(wpc, index)) {
        const orig = addDays(ws, s.day);
        const ov = overrides ? overrides[orig] : null;
        const skipped = !!(ov && ov.skip);
        const date = (ov && ov.to && /^\d{4}-\d{2}-\d{2}$/.test(ov.to)) ? ov.to : orig;
        if (date < fromDate || date > toDate) continue;
        out.push({ date, orig_date: orig, week_start: ws, week_index: index, session_number: s.session_number, session_name: s.session_name, day: s.day, estimated_duration_mins: s.estimated_duration_mins, phase, moved: date !== orig, skipped });
      }
    }
    ws = addDays(ws, 7);
  }
  out.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.session_number - b.session_number);
  return out;
}

/** Last scheduled date (Sunday of the final programme week) for a calendar-anchored plan; null otherwise. */
export function programmeEnd(wpc: WpcRow | null): string | null {
  if (!wpc || !isCalendar(wpc)) return null;
  return addDays(isoDate(mondayOf(fromIso(String(wpc.week_start)))), planWeeks(wpc) * 7 - 1);
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
