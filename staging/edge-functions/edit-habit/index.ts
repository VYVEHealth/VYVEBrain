// VYVE Health — edit-habit v1 — Allow users to modify habit responses for today
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk'
]);
function getCORSHeaders(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : origin === 'null' || origin === '' ? '*' : 'https://online.vyvehealth.co.uk';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': allowOrigin !== '*' ? 'true' : 'false'
  };
}
function ukToday() {
  // Get today's date in UK timezone (UTC+1 for BST awareness)
  const now = new Date();
  const ukOffset = 60; // BST is UTC+1 
  const ukTime = new Date(now.getTime() + ukOffset * 60 * 1000);
  return ukTime.toISOString().slice(0, 10);
}
async function getAuthUser(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.email?.toLowerCase() || null;
}
serve(async (req)=>{
  const corsHeaders = getCORSHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false
    }
  });
  try {
    const member_email = await getAuthUser(req);
    if (!member_email) {
      return new Response(JSON.stringify({
        success: false,
        error: "Authentication required. Please log in."
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const today = ukToday();
    if (req.method === "DELETE") {
      // Un-skip or un-complete a habit for today
      const url = new URL(req.url);
      const habitType = url.searchParams.get('habit_type');
      if (!habitType) {
        return new Response(JSON.stringify({
          success: false,
          error: "habit_type parameter required for DELETE"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      // Delete the habit entry for today
      const { error: deleteErr } = await supabase.from('daily_habits').delete().eq('member_email', member_email).eq('activity_date', today).eq('habit_type', habitType);
      if (deleteErr) throw deleteErr;
      return new Response(JSON.stringify({
        success: true,
        action: 'deleted',
        habit_type: habitType,
        activity_date: today
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (req.method === "POST") {
      // Update a habit response for today
      const body = await req.json();
      const { habit_type, completed, notes } = body;
      if (!habit_type || completed === undefined) {
        return new Response(JSON.stringify({
          success: false,
          error: "habit_type and completed are required"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      // Check if habit entry exists for today
      const { data: existing } = await supabase.from('daily_habits').select('*').eq('member_email', member_email).eq('activity_date', today).eq('habit_type', habit_type).single();
      const logged_at = new Date().toISOString();
      if (existing) {
        // Update existing entry
        const { error: updateErr } = await supabase.from('daily_habits').update({
          completed,
          notes: notes || null,
          logged_at
        }).eq('member_email', member_email).eq('activity_date', today).eq('habit_type', habit_type);
        if (updateErr) throw updateErr;
        return new Response(JSON.stringify({
          success: true,
          action: 'updated',
          habit_type,
          completed,
          activity_date: today
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } else {
        // Create new entry
        const { error: insertErr } = await supabase.from('daily_habits').insert({
          member_email,
          activity_date: today,
          habit_type,
          completed,
          notes: notes || null,
          logged_at
        });
        if (insertErr) throw insertErr;
        return new Response(JSON.stringify({
          success: true,
          action: 'created',
          habit_type,
          completed,
          activity_date: today
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }
    return new Response(JSON.stringify({
      success: false,
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[edit-habit] Error:", err.message);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
