// VYVE Health — Certificate Checker v23
// CERTIFICATE REFACTOR: Drops storage upload + HTML generation
// Certificates now render client-side from DB via /certificate.html?id=<uuid>
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
const CERT_TYPES = {
  habits: {
    label: "Daily Habits",
    title: "Daily Habits Achievement",
    persona: "The Architect"
  },
  workouts: {
    label: "Workouts",
    title: "Workout Achievement",
    persona: "The Warrior"
  },
  cardio: {
    label: "Cardio",
    title: "Cardio Achievement",
    persona: "The Relentless"
  },
  checkins: {
    label: "Weekly Check-ins",
    title: "Elite Check-In Achievement",
    persona: "The Elite"
  },
  sessions: {
    label: "Live Sessions",
    title: "Live Sessions Achievement",
    persona: "The Explorer"
  }
};
async function getNextSeqNumber() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data, error } = await supabase.rpc('get_next_global_cert_number');
  if (error) {
    console.error('Failed to get next cert number:', error);
    return 1;
  }
  return data || 1;
}
async function sendCertificateEmail(email, firstName, certType, count, certNo) {
  const typeConfig = CERT_TYPES[certType];
  if (!typeConfig) return;
  const subject = `🏆 You've earned your ${typeConfig.title} certificate!`;
  const personalizedSubject = `🏆 ${firstName}, you've earned your ${typeConfig.title} certificate!`;
  const bodyHtml = `
<div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
  <div style="background: white; border-radius: 12px; padding: 32px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <div style="color: #B8963C; font-size: 18px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 20px; font-weight: normal;">VYVE Health</div>
    
    <h1 style="color: #1A1A18; font-size: 28px; font-family: 'Georgia', serif; font-style: italic; margin-bottom: 16px; line-height: 1.2;">Congratulations ${firstName}!</h1>
    
    <p style="color: #4A4840; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">You've earned your <strong>${typeConfig.title}</strong> certificate by completing <strong>${count} ${typeConfig.label.toLowerCase()}</strong> as part of the VYVE Health programme.</p>
    
    <div style="background: #F5F3EE; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 3px solid #B8963C;">
      <div style="color: #7A7060; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Certificate ${certNo}</div>
      <div style="color: #1A1A18; font-size: 18px; font-family: 'Georgia', serif; font-style: italic;">${typeConfig.persona}</div>
    </div>
    
    <p style="color: #7A7060; font-size: 14px; line-height: 1.6; margin-bottom: 28px; font-style: italic;">Your achievement has donated a free month of wellness to someone in need through our charity partner.</p>
    
    <a href="${LIBRARY_URL}" style="display: inline-block; background: #1B7878; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; margin-bottom: 20px;">View Your Certificates</a>
    
    <div style="border-top: 1px solid #E0E0E0; padding-top: 20px; margin-top: 32px; color: #999; font-size: 12px;">VYVE Health CIC &middot; ICO No. 00013608608</div>
  </div>
</div>`;
  const payload = {
    sender: {
      name: FROM_NAME,
      email: FROM_EMAIL
    },
    to: [
      {
        email,
        name: firstName
      }
    ],
    subject: personalizedSubject,
    htmlContent: bodyHtml,
    tags: [
      "certificate-earned",
      certType
    ]
  };
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = await response.text();
      console.error(`Brevo email failed for ${email}: ${error}`);
    } else {
      console.log(`Certificate email sent to ${email} for ${certType}`);
    }
  } catch (error) {
    console.error(`Email send failed for ${email}:`, error);
  }
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  console.log("Certificate checker v23 - processing...");
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    // Get all members with their progress counts
    const { data: members, error: membersError } = await supabase.from('member_home_state').select(`
        member_email,
        habits_total,
        workouts_total,
        cardio_total,
        checkins_total,
        sessions_total
      `);
    if (membersError) throw membersError;
    if (!members || members.length === 0) {
      return new Response(JSON.stringify({
        message: "No members found"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Get existing certificates for comparison
    const { data: existingCerts, error: certsError } = await supabase.from('certificates').select('member_email, activity_type, milestone_count');
    if (certsError) throw certsError;
    const existingCertSet = new Set();
    for (const cert of existingCerts || []){
      // Only track the highest milestone per type per member
      const key = `${cert.member_email}:${cert.activity_type}`;
      const existing = existingCertSet.has(key) ? parseInt(key.split(':')[2]) : 0;
      if (cert.milestone_count > existing) {
        existingCertSet.delete(`${cert.member_email}:${cert.activity_type}:${existing}`);
        existingCertSet.add(`${cert.member_email}:${cert.activity_type}:${cert.milestone_count}`);
      }
    }
    let newCertsCreated = 0;
    for (const member of members){
      const email = member.member_email;
      // Get member details for email
      const { data: memberDetails, error: memberError } = await supabase.from('members').select('first_name, last_name').eq('email', email).single();
      if (memberError) {
        console.error(`Failed to get member details for ${email}:`, memberError);
        continue;
      }
      const firstName = memberDetails?.first_name || 'Member';
      // Check each activity type for 30+ milestones
      const activities = [
        {
          type: 'habits',
          count: member.habits_total || 0
        },
        {
          type: 'workouts',
          count: member.workouts_total || 0
        },
        {
          type: 'cardio',
          count: member.cardio_total || 0
        },
        {
          type: 'checkins',
          count: member.checkins_total || 0
        },
        {
          type: 'sessions',
          count: member.sessions_total || 0
        }
      ];
      for (const activity of activities){
        if (activity.count < 30) continue;
        // Calculate milestones earned (30, 60, 90, etc.)
        const milestonesEarned = Math.floor(activity.count / 30);
        for(let milestone = 1; milestone <= milestonesEarned; milestone++){
          const milestoneCount = milestone * 30;
          const certKey = `${email}:${activity.type}:${milestoneCount}`;
          if (existingCertSet.has(certKey)) continue;
          // Create new certificate
          console.log(`Creating certificate: ${email} - ${activity.type} - ${milestoneCount}`);
          try {
            // Get next sequential number
            const seqData = await getNextSeqNumber();
            const globalCertNo = seqData;
            // INSERT first to get the UUID, then use it to build certificate_url
            const { data: insertData, error: insertErr } = await supabase.from("certificates").insert({
              member_email: email,
              activity_type: activity.type,
              milestone_count: milestoneCount,
              earned_at: new Date().toISOString(),
              global_cert_number: globalCertNo,
              charity_moment_triggered: true,
              // certificate_url will be updated in the next step after we get the UUID
              certificate_url: '' // Temporary placeholder
            }).select('id').single();
            if (insertErr) {
              console.error(`Failed to insert certificate for ${email}:`, insertErr);
              continue;
            }
            const certId = insertData?.id;
            if (!certId) {
              console.error(`No ID returned from certificate insert for ${email}`);
              continue;
            }
            // Update with the proper certificate_url using the UUID
            const certificateUrl = `https://online.vyvehealth.co.uk/certificate.html?id=${certId}`;
            const { error: updateErr } = await supabase.from('certificates').update({
              certificate_url: certificateUrl
            }).eq('id', certId);
            if (updateErr) {
              console.error(`Failed to update certificate URL for ${email}:`, updateErr);
            // Continue - the cert exists, just without the proper URL
            }
            // Add to tracking set
            existingCertSet.add(certKey);
            newCertsCreated++;
            // Send email notification
            const certNoStr = String(globalCertNo).padStart(4, '0');
            await sendCertificateEmail(email, firstName, activity.type, milestoneCount, certNoStr);
          } catch (error) {
            console.error(`Error creating certificate for ${email} - ${activity.type} - ${milestoneCount}:`, error);
          }
        }
      }
    }
    const message = `Certificate checker completed. ${newCertsCreated} new certificates created.`;
    console.log(message);
    return new Response(JSON.stringify({
      success: true,
      message,
      newCertificates: newCertsCreated
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Certificate checker error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
