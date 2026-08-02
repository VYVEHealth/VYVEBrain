// VYVE Health — achievements-sweep v2
// v1 + push fan-out via achievement-earned-push v1 on freshly-earned tiers.
// Phase 1 metric scope unchanged (member_days only). Phase 2 metric extensions deferred.
//
// Auth: NO JWT required at gateway (verify_jwt:false). Service role used internally.
// Push fan-out uses LEGACY_SERVICE_ROLE_JWT to satisfy achievement-earned-push v1's gateway
// (which is verify_jwt:true under the dual-auth pattern, §23).
//
// Spec: VYVEBrain backlog item 1 — push notifications Session 2.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LEGACY_SERVICE_ROLE_JWT = Deno.env.get("LEGACY_SERVICE_ROLE_JWT") ?? "";
async function pushAchievementEarned(email, earns) {
  if (!earns.length) return true;
  if (!LEGACY_SERVICE_ROLE_JWT) {
    console.warn("[achievements-sweep] LEGACY_SERVICE_ROLE_JWT missing — skipping push for", email);
    return false;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/achievement-earned-push`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LEGACY_SERVICE_ROLE_JWT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        member_email: email,
        earns
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      console.warn("[achievements-sweep] push fail", email, res.status, txt);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[achievements-sweep] push error", email, e.message);
    return false;
  }
}
async function sweepMemberDays(supabase) {
  const result = {
    metric: "member_days",
    rows_inserted: 0,
    members_processed: 0,
    push_attempted: 0,
    push_succeeded: 0,
    push_failed: 0,
    errors: []
  };
  // v2: pull title + body alongside tier_index + threshold for push payload
  const { data: tiers, error: tErr } = await supabase.from("achievement_tiers").select("tier_index, threshold, title, body").eq("metric_slug", "member_days").order("tier_index");
  if (tErr) {
    result.errors.push(`tiers: ${tErr.message}`);
    return result;
  }
  if (!tiers?.length) {
    result.errors.push("no tiers");
    return result;
  }
  // Pull all members + their existing earned member_days tiers
  const [{ data: members, error: mErr }, { data: earned, error: eErr }] = await Promise.all([
    supabase.from("members").select("email, created_at"),
    supabase.from("member_achievements").select("member_email, tier_index").eq("metric_slug", "member_days")
  ]);
  if (mErr) {
    result.errors.push(`members: ${mErr.message}`);
    return result;
  }
  if (eErr) {
    result.errors.push(`earned: ${eErr.message}`);
    return result;
  }
  const earnedSet = new Set();
  for (const r of earned ?? [])earnedSet.add(`${r.member_email.toLowerCase()}:${r.tier_index}`);
  const tierMap = new Map();
  for (const t of tiers)tierMap.set(t.tier_index, {
    title: t.title,
    body: t.body
  });
  const now = Date.now();
  const newRows = [];
  // v2: track freshly-earned tiers per member for push fan-out
  const earnsByMember = new Map();
  for (const m of members ?? []){
    result.members_processed += 1;
    const email = m.email?.toLowerCase();
    if (!email || !m.created_at) continue;
    const days = Math.floor((now - new Date(m.created_at).getTime()) / 86400000);
    if (days <= 0) continue;
    for (const t of tiers){
      if (Number(t.threshold) > days) break;
      const key = `${email}:${t.tier_index}`;
      if (earnedSet.has(key)) continue;
      newRows.push({
        member_email: email,
        metric_slug: "member_days",
        tier_index: t.tier_index
      });
      const list = earnsByMember.get(email) ?? [];
      list.push({
        metric_slug: "member_days",
        tier_index: t.tier_index,
        title: t.title,
        body: t.body ?? null
      });
      earnsByMember.set(email, list);
    }
  }
  if (newRows.length > 0) {
    const { error: iErr } = await supabase.from("member_achievements").upsert(newRows, {
      onConflict: "member_email,metric_slug,tier_index",
      ignoreDuplicates: true
    });
    if (iErr) {
      result.errors.push(`insert: ${iErr.message}`);
      // If the upsert failed, do NOT push — we'd be lying about earned tiers.
      return result;
    }
    result.rows_inserted = newRows.length;
    // v2: fan out pushes per member after successful upsert.
    // Sequential (low cohort size; low cron frequency) — keeps log noise tidy.
    for (const [email, earns] of earnsByMember.entries()){
      result.push_attempted += earns.length;
      const ok = await pushAchievementEarned(email, earns);
      if (ok) result.push_succeeded += earns.length;
      else result.push_failed += earns.length;
    }
  }
  return result;
}
serve(async (_req)=>{
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    });
    const t0 = Date.now();
    const memberDaysRes = await sweepMemberDays(supabase);
    const elapsed = Date.now() - t0;
    return new Response(JSON.stringify({
      success: true,
      elapsed_ms: elapsed,
      results: [
        memberDaysRes
      ],
      phase2_deferred: [
        "lifetime_steps",
        "lifetime_distance_hk",
        "lifetime_active_energy",
        "nights_slept_7h",
        "full_five_weeks",
        "charity_tips",
        "personal_charity_contribution",
        "tour_complete",
        "healthkit_connected"
      ]
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[achievements-sweep] error:", err.message);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
