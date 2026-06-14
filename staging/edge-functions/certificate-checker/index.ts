// VYVE Health — Certificate Checker v24
// PM-434: Re-pillared onto the five Journey-page buckets.
//   Tracks: habits · mind · body · connect · checkins
//   Body = workouts+cardio+movement (2/day combined); Connect = connect_checkins+
//   session_views+replays+live (2/day combined); Mind = mind_activities (2/day);
//   Habits 1/day; Check-ins 1/week. Single source: public.get_certificate_buckets().
// Certificates render client-side from DB via /certificate.html?id=<uuid>.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const FROM_EMAIL = "team@vyvehealth.co.uk";
const FROM_NAME = "VYVE Health";
const LIBRARY_URL = "https://online.vyvehealth.co.uk/certificates.html";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const TRACKS = {
  habits:   { label: "daily habits",       title: "Daily Habits Achievement",   persona: "The Architect",
              body: (m) => `for completing ${m} daily habits as part of the VYVE Health programme, building the kind of lasting consistency that defines a healthier way of living.` },
  body:     { label: "body activities",     title: "Body Achievement",           persona: "The Warrior",
              body: (m) => `for completing ${m} body activities — workouts, cardio and movement — as part of the VYVE Health programme, demonstrating outstanding dedication to your physical health.` },
  mind:     { label: "mind sessions",       title: "Mind Achievement",           persona: "The Anchor",
              body: (m) => `for completing ${m} mind sessions as part of the VYVE Health programme, demonstrating a genuine commitment to mental wellbeing and inner balance.` },
  connect:  { label: "connect activities",  title: "Connect Achievement",        persona: "The Explorer",
              body: (m) => `for completing ${m} connect activities as part of the VYVE Health programme, demonstrating a sustained commitment to community and shared wellbeing.` },
  checkins: { label: "weekly check-ins",    title: "Elite Check-In Achievement", persona: "The Elite",
              body: (m) => `for completing ${m} weekly check-ins as part of the VYVE Health programme, demonstrating an exceptional commitment to self-awareness and personal health.` }
};
const TRACK_KEYS = Object.keys(TRACKS);

async function nextSeqNumber(supabase) {
  const { data, error } = await supabase.rpc('next_certificate_number');
  if (error) { console.error('next_certificate_number failed:', error); return null; }
  return data;
}

async function sendCertificateEmail(email, firstName, track, count, certNo) {
  const cfg = TRACKS[track];
  if (!cfg) return;
  const personalizedSubject = `🏆 ${firstName}, you've earned your ${cfg.title} certificate!`;
  const bodyHtml = `
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
  <div style="background: white; border-radius: 12px; padding: 32px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <div style="color: #B8963C; font-size: 18px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 20px; font-weight: normal;">VYVE Health</div>
    <h1 style="color: #1A1A18; font-size: 28px; font-family: 'Georgia', serif; font-style: italic; margin-bottom: 16px; line-height: 1.2;">Congratulations ${firstName}!</h1>
    <p style="color: #4A4840; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">You've earned your <strong>${cfg.title}</strong> certificate by completing <strong>${count} ${cfg.label}</strong> as part of the VYVE Health programme.</p>
    <div style="background: #F5F3EE; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 3px solid #B8963C;">
      <div style="color: #7A7060; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Certificate ${certNo}</div>
      <div style="color: #1A1A18; font-size: 18px; font-family: 'Georgia', serif; font-style: italic;">${cfg.persona}</div>
    </div>
    <p style="color: #7A7060; font-size: 14px; line-height: 1.6; margin-bottom: 28px; font-style: italic;">Your achievement has donated a free month of wellness to someone in need through our charity partner.</p>
    <a href="${LIBRARY_URL}" style="display: inline-block; background: #1B7878; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; margin-bottom: 20px;">View Your Certificates</a>
    <div style="border-top: 1px solid #E0E0E0; padding-top: 20px; margin-top: 32px; color: #999; font-size: 12px;">VYVE Health CIC &middot; ICO No. 00013608608</div>
  </div>
</div>`;
  const payload = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email, name: firstName }],
    subject: personalizedSubject,
    htmlContent: bodyHtml,
    tags: ["certificate-earned", track]
  };
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "accept": "application/json", "api-key": BREVO_API_KEY, "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) console.error(`Brevo email failed for ${email}: ${await response.text()}`);
    else console.log(`Certificate email sent to ${email} for ${track}`);
  } catch (error) {
    console.error(`Email send failed for ${email}:`, error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  console.log("Certificate checker v24 (five-pillar) - processing...");
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: buckets, error: bucketsErr } = await supabase.rpc('get_certificate_buckets');
    if (bucketsErr) throw bucketsErr;
    if (!buckets || buckets.length === 0) {
      return new Response(JSON.stringify({ message: "No members found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: existing, error: existErr } = await supabase
      .from('certificates').select('member_email, activity_type, milestone_count');
    if (existErr) throw existErr;
    const have = new Set((existing || []).map(c => `${c.member_email}:${c.activity_type}:${c.milestone_count}`));

    const { data: memberRows, error: memErr } = await supabase.from('members').select('email, first_name');
    if (memErr) throw memErr;
    const firstNameOf = new Map((memberRows || []).map(m => [m.email, m.first_name || 'Member']));

    let newCertsCreated = 0;
    const noEmail = req.headers.get('x-no-email') === '1';

    for (const row of buckets) {
      const email = row.member_email;
      const firstName = firstNameOf.get(email) || 'Member';
      for (const track of TRACK_KEYS) {
        const count = Number(row[track]) || 0;
        if (count < 30) continue;
        const milestonesEarned = Math.floor(count / 30);
        for (let milestone = 1; milestone <= milestonesEarned; milestone++) {
          const ms = milestone * 30;
          const key = `${email}:${track}:${ms}`;
          if (have.has(key)) continue;

          const seq = await nextSeqNumber(supabase);
          const { data: ins, error: insErr } = await supabase.from('certificates')
            .upsert({
              member_email: email,
              activity_type: track,
              milestone_count: ms,
              earned_at: new Date().toISOString(),
              global_cert_number: seq,
              charity_moment_triggered: true,
              certificate_url: '',
              pillar: track
            }, { onConflict: 'member_email,activity_type,milestone_count', ignoreDuplicates: true })
            .select('id');
          if (insErr) { console.error(`Insert failed ${key}:`, insErr); continue; }
          have.add(key);
          const certId = ins && ins[0] && ins[0].id;
          if (!certId) continue;

          await supabase.from('certificates')
            .update({ certificate_url: `https://online.vyvehealth.co.uk/certificate.html?id=${certId}` })
            .eq('id', certId);
          newCertsCreated++;
          if (!noEmail) {
            await sendCertificateEmail(email, firstName, track, ms, String(seq ?? 0).padStart(4, '0'));
          }
        }
      }
    }

    const message = `Certificate checker v24 completed. ${newCertsCreated} new certificates created.`;
    console.log(message);
    return new Response(JSON.stringify({ success: true, message, newCertificates: newCertsCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Certificate checker error:", error);
    return new Response(JSON.stringify({ error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
