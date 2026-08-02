// _shared/taxonomy.ts — single source of workout classification + health rule types.
// Shipped as a sibling file to both member-dashboard and sync-health-data EFs.
// Created autotick session 2 (24 April 2026) — extracts workout-type constants
// from sync-health-data v6 and codifies health rule shape used by the evaluator.
export function normWorkoutType(s) {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
export const STRENGTH_CANON = new Set([
  "functionalstrengthtraining",
  "traditionalstrengthtraining",
  "strengthtraining",
  "coretraining",
  "pilates",
  "crosstraining",
  "calisthenics"
]);
export const CARDIO_CANON = new Set([
  "running",
  "cycling",
  "walking",
  "hiking",
  "rowing",
  "swimming",
  "highintensityintervaltraining",
  "hiit",
  "elliptical",
  "stairclimbing",
  "mixedcardio"
]);
export const IGNORED_CANON = new Set([
  "mindandbody",
  "dance",
  "golf",
  "baseball",
  "basketball",
  "americanfootball",
  "soccer",
  "tennis",
  "racquetball",
  "tabletennis",
  "badminton",
  "squash",
  "cricket",
  "bowling",
  "climbing",
  "surfing",
  "waterfitness",
  "waterpolo",
  "watersports",
  "gymnastics",
  "martialarts",
  "trackandfield",
  "volleyball",
  "skating",
  "snowboarding",
  "skiing",
  "downhillskiing",
  "crosscountryskiing",
  "hockey",
  "handball",
  "rugby",
  "archery",
  "equestrian",
  "fishing",
  "hunting",
  "lacrosse",
  "mountainbiking",
  "paddlesports",
  "play",
  "preparationandrecovery",
  "sailing",
  "wrestling",
  "other"
]);
export const YOGA_CANON = "yoga";
export const YOGA_STRENGTH_MIN_MINUTES = 30;
export function classifyWorkout(workoutTypeRaw, durationMin) {
  const canon = normWorkoutType(workoutTypeRaw);
  if (!canon) return "unknown";
  if (IGNORED_CANON.has(canon)) return "ignored";
  if (STRENGTH_CANON.has(canon)) return "strength";
  if (canon === YOGA_CANON) {
    return durationMin >= YOGA_STRENGTH_MIN_MINUTES ? "strength" : "ignored";
  }
  if (CARDIO_CANON.has(canon)) return "cardio";
  return "unknown";
}
export const ALLOWED_DAILY_TYPES = new Set([
  "steps",
  "distance",
  "active_energy"
]);
export function applyOp(op, value, target) {
  switch(op){
    case "gte":
      return value >= target;
    case "lte":
      return value <= target;
    case "eq":
      return value === target;
    case "exists":
      return value > 0;
    default:
      return false;
  }
}
function isBST(d) {
  const m = d.getUTCMonth();
  return m >= 3 && m <= 9;
}
export function ukLocalDateISO(now = new Date()) {
  const offsetHours = isBST(now) ? 1 : 0;
  const local = new Date(now.getTime() + offsetHours * 3600_000);
  return local.toISOString().slice(0, 10);
}
export function lastNightWindow(now = new Date()) {
  const offsetHours = isBST(now) ? 1 : 0;
  const nowLocal = new Date(now.getTime() + offsetHours * 3600_000);
  const todayStr = nowLocal.toISOString().slice(0, 10);
  const endLocal = new Date(todayStr + "T11:00:00Z");
  const startLocal = new Date(endLocal.getTime() - 17 * 3600_000);
  const windowEnd = new Date(endLocal.getTime() - offsetHours * 3600_000);
  const windowStart = new Date(startLocal.getTime() - offsetHours * 3600_000);
  return {
    windowStart,
    windowEnd
  };
}
export function dailyMetricColumn(metric) {
  if (metric === "steps") return "steps";
  if (metric === "distance_km") return "distance";
  if (metric === "distance") return "distance";
  if (metric === "active_energy") return "active_energy";
  return null;
}
export function dailyUnitFor(metric, storedUnit) {
  if (metric === "distance_km") return "km";
  if (metric === "steps") return "steps";
  if (metric === "active_energy") return "kcal";
  return storedUnit || "";
}
