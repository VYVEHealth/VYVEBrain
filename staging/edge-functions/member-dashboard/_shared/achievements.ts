// _shared/achievements.ts — PM-419 surface stamping
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export async function getMemberAchievementsPayload(supabase: any, email: string, opts: { inflightLimit?: number; recentLimit?: number } = {}) {
  const { inflightLimit = 3, recentLimit = 8 } = opts;
  try {
    const [unseenRes, inflightRes, recentRes, countRes] = await Promise.all([
      supabase.from('member_achievements').select('id,achievement_key,achievement_label,achievement_description,icon_url,earned_at,seen_at,surface').eq('member_email', email).is('seen_at', null).order('earned_at', { ascending: false }).limit(10),
      supabase.from('member_achievement_progress').select('achievement_key,achievement_label,progress_pct,current_value,target_value,icon_url').eq('member_email', email).eq('status', 'inflight').order('progress_pct', { ascending: false }).limit(inflightLimit),
      supabase.from('member_achievements').select('id,achievement_key,achievement_label,icon_url,earned_at,surface').eq('member_email', email).not('seen_at', 'is', null).order('earned_at', { ascending: false }).limit(recentLimit),
      supabase.from('member_achievements').select('id', { count: 'exact', head: true }).eq('member_email', email),
    ]);
    const hkRes = await supabase.from('member_health_connections').select('platform').eq('member_email', email).not('revoked_at', 'is', null).limit(1);
    return {
      unseen: unseenRes.data || [],
      inflight: inflightRes.data || [],
      recent: recentRes.data || [],
      earned_count: countRes.count || 0,
      hk_connected: !!(hkRes.data && hkRes.data.length > 0),
    };
  } catch (e) {
    console.warn('[achievements] payload err:', e?.message);
    return { unseen: [], inflight: [], recent: [], earned_count: 0, hk_connected: false };
  }
}
