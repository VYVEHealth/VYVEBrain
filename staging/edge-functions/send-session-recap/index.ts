import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4FAFA;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);">
<tr><td style="background:#0D2B2B;padding:24px 32px;">
  <div style="font-family:Georgia,serif;font-size:20px;letter-spacing:6px;color:#fff;">VYVE</div>
  <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:2px;text-transform:uppercase;">Full Session Recap &mdash; 8 April 2026</div>
</td></tr>
<tr><td style="padding:32px;">

<h2 style="margin:0 0 6px;font-size:22px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">Everything done today</h2>
<p style="margin:0 0 28px;font-size:13px;color:#7A9A9A;">Corrected full recap &mdash; the first email was incomplete.</p>

<!-- WORKOUTS -->
<div style="margin-bottom:20px;background:#E8F5F2;border-radius:8px;padding:20px 24px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1B7878;font-weight:600;margin-bottom:14px;">✅ workouts.html &mdash; 6 features added (patch-workouts-features)</div>
<div style="font-size:13px;color:#3A5A5A;line-height:1.8;">
1. <strong>Exercise notes</strong> &mdash; inline textarea per exercise, saves to exercise_notes table, persists globally across all sessions<br>
2. <strong>Progressive overload nudge</strong> &mdash; amber nudge fires when ALL sets ticked + every set hit top of rep range at same weight as last session<br>
3. <strong>All-time PRs view</strong> &mdash; full-screen view, best ever set per exercise A-Z, searchable. Opens via My PRs button<br>
4. <strong>Past sessions history</strong> &mdash; full-screen view, last 50 sessions, expandable cards with best set per exercise<br>
5. <strong>Last session summary</strong> &mdash; shows on Next Session card: last date done + total weight lifted<br>
6. <strong>Rest timer next-set context</strong> &mdash; during rest shows next exercise name + set number + target weight/reps<br>
<br>
Also fixed: swipe-to-delete easier (threshold reduced, delete zone wider), exit warning when leaving mid-workout with logged sets. exercise_notes table created in Supabase.
</div></div>

<!-- SETTINGS -->
<div style="margin-bottom:20px;background:#E8F5F2;border-radius:8px;padding:20px 24px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1B7878;font-weight:600;margin-bottom:14px;">✅ settings.html &mdash; sign out + improvements</div>
<div style="font-size:13px;color:#3A5A5A;line-height:1.8;">
settings.html confirmed live with sign out functionality and all member preference controls (theme, persona, TDEE, notifications, reminder frequency, goal focus, employer privacy toggle).
</div></div>

<!-- POST-WORKOUT COMPLETION -->
<div style="margin-bottom:20px;background:#E8F5F2;border-radius:8px;padding:20px 24px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1B7878;font-weight:600;margin-bottom:14px;">✅ Post-workout completion screen &mdash; added to build queue</div>
<div style="font-size:13px;color:#3A5A5A;line-height:1.8;">
Spec agreed: total weight lifted, sets/reps done, PRs hit, all-time workout count. Appears as overlay after Complete Workout. Added to workouts.html build queue.
</div></div>

<!-- ONBOARDING -->
<div style="margin-bottom:20px;background:#E8F5F2;border-radius:8px;padding:20px 24px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1B7878;font-weight:600;margin-bottom:14px;">✅ welcome.html &mdash; 3 changes</div>
<div style="font-size:13px;color:#3A5A5A;line-height:1.8;">
1. <strong>Gender options expanded</strong> &mdash; 3 options &rarr; 8 inclusive options including &ldquo;Prefer to self-describe&rdquo; free-text field<br>
2. <strong>Junk folder nudge</strong> &mdash; added to results screen: &ldquo;Can&apos;t see the email? Check your junk folder&rdquo; message<br>
3. <strong>Onboarding EF v42</strong> &mdash; gender + gender_self_describe + tdee_formula now written to Supabase members table (was collecting but not storing)
</div></div>

<!-- ONBOARDING AI FIX -->
<div style="margin-bottom:20px;background:#E8F5F2;border-radius:8px;padding:20px 24px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1B7878;font-weight:600;margin-bottom:14px;">✅ Onboarding AI hallucination fix &mdash; onboarding EF v41</div>
<div style="font-size:13px;color:#3A5A5A;line-height:1.8;">
AI was inventing goals/injuries/preferences for quick-path signups (name + scores only). Fixed: isQuickPath() detection, factual-only member summary (empty fields excluded from prompt), explicit anti-hallucination instruction per path. Quick-path rec 3 now invites them to complete the full questionnaire for a tailored plan.
</div></div>

<!-- PASSWORD RESET -->
<div style="margin-bottom:20px;background:#E8F5F2;border-radius:8px;padding:20px 24px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1B7878;font-weight:600;margin-bottom:14px;">✅ Password reset flow &mdash; diagnosed, fix scoped</div>
<div style="font-size:13px;color:#3A5A5A;line-height:1.8;">
Two issues: (a) reset emails going to junk &mdash; Supabase default sender domain. Fix: Brevo custom SMTP in Supabase Auth dashboard. (b) reset link bypassing set-password.html. Fix: add set-password.html to Supabase redirect allowlist + update email template. set-password.html code already correct. All dashboard-only.
</div></div>

<!-- BUILD QUEUE / DOCS -->
<div style="margin-bottom:20px;background:#E8F5F2;border-radius:8px;padding:20px 24px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1B7878;font-weight:600;margin-bottom:14px;">✅ Project docs updated</div>
<div style="font-size:13px;color:#3A5A5A;line-height:1.8;">
Build Queue: weekly check-in, re-engagement, certificates, settings marked done. Queue reprioritised. Stack Snapshot: Auth0 removed, EF versions corrected, onboarding URL updated to welcome.html.
</div></div>

<!-- OTHER -->
<div style="margin-bottom:20px;background:#E8F5F2;border-radius:8px;padding:20px 24px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1B7878;font-weight:600;margin-bottom:14px;">✅ Other completed</div>
<div style="font-size:13px;color:#3A5A5A;line-height:1.8;">
&bull; iOS + Android PWA install posters created (branded, VYVE colour scheme)<br>
&bull; Capacitor wrap timeline assessed &mdash; 5&ndash;8 days realistic for both stores<br>
&bull; weight_logs migrated to Supabase (was localStorage only &mdash; data loss risk on device switch)<br>
&bull; index.html cache-first load &mdash; renders instantly from localStorage, skeleton on first load only<br>
&bull; nav.js: back button on inner pages, logo-only on home screen<br>
&bull; Theme system (light/dark) rolled out across all portal pages via Edge Function patches
</div></div>

<!-- ACTION -->
<div style="margin-bottom:0;background:#FFF8EC;border:1px solid rgba(201,168,76,0.3);border-radius:8px;padding:20px 24px;">
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-weight:600;margin-bottom:10px;">⚡ Action required &mdash; Dean (when back at computer)</div>
<div style="font-size:13px;color:#3A5A5A;line-height:1.8;">
<strong>Password reset fix (5 min, Supabase dashboard):</strong><br>
1. Auth &rarr; Settings &rarr; SMTP &rarr; enable Brevo (smtp-relay.brevo.com:587, team@vyvehealth.co.uk)<br>
2. Auth &rarr; URL Configuration &rarr; add https://online.vyvehealth.co.uk/set-password.html to redirect allowlist<br>
3. Auth &rarr; Email Templates &rarr; Reset Password &rarr; update action URL to set-password.html
</div></div>

</td></tr>
<tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &nbsp;&middot;&nbsp; team@vyvehealth.co.uk &nbsp;&middot;&nbsp; ICO Reg. 00013608608</p></td></tr>
</table></td></tr></table>
</body></html>`;
serve(async ()=>{
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'VYVE Health',
        email: 'team@vyvehealth.co.uk'
      },
      to: [
        {
          email: 'team@vyvehealth.co.uk',
          name: 'Dean & Lewis'
        }
      ],
      subject: 'VYVE Full Session Recap — 8 April 2026 (corrected)',
      htmlContent: html,
      tags: [
        'session-recap'
      ]
    })
  });
  const data = await res.json();
  return new Response(JSON.stringify(res.ok ? {
    ok: true,
    messageId: data.messageId
  } : {
    ok: false,
    error: data
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});
