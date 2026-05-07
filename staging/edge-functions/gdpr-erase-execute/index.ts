// VYVE Health — gdpr-erase-execute v1 (Security commit 4, 07 May 2026 PM-4).
//
// Cron-driven executor for GDPR Article 17 right of erasure. Picks up to 5 due
// rows from gdpr_erasure_requests via gdpr_erasure_pick_due() (FOR UPDATE SKIP
// LOCKED, scheduled_for <= now(), not cancelled/executed/failed, attempt < 3,
// re-queues rows older than 10 min). For each row:
//   1. Best-effort purge from third parties (Stripe customer, Brevo contact,
//      PostHog person). Failures log to platform_alerts but do NOT abort.
//   2. Atomic DB purge via gdpr_erasure_purge(p_email) RPC. This deletes all
//      rows for the subject across the canonical 45-table list in one tx,
//      with explicit deletes for FK NO-ACTION children and members deleted last.
//      The RPC returns a JSONB summary recorded in execution_summary.
//   3. auth.users delete via admin API (post-tx — admin API isn't transactional
//      with the SQL session).
//   4. Mark executed_at, send Brevo confirmation, audit log.
//
// On any error: do NOT mark executed_at. Increment attempt_count via pick_due
// (already done at pickup time). Log failure_reason. After 3 attempts, mark
// failed_at — operations team must investigate manually.
//
// CRITICAL: this EF cannot be JWT-gated because the cron has no JWT; instead
// CRON_SECRET bearer token guards inbound requests, mirroring gdpr-export-execute.
//
// verify_jwt: false at platform; secret-bearer check inside.
// See brain/gdpr_erasure_flow.md (signed off 07 May 2026 PM-3).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const POSTHOG_KEY = Deno.env.get("POSTHOG_PERSONAL_API_KEY") ?? "";
const POSTHOG_PROJECT_ID = Deno.env.get("POSTHOG_PROJECT_ID") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const TICK_LIMIT = 5;
const MAX_ATTEMPTS = 3;
// ─── Brevo email (executed confirmation) ─────────────────────────────────
const wrap = (body)=>`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4FAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);"><tr><td style="background:#0D2B2B;padding:24px 32px;"><img src="https://online.vyvehealth.co.uk/logo.png" alt="VYVE Health" style="height:36px;display:block;" /></td></tr><tr><td style="padding:32px;">${body}</td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &nbsp;&middot;&nbsp; team@vyvehealth.co.uk<br>ICO Registration No. 00013608608</p></td></tr></table></td></tr></table></body></html>`;
const h2 = (t)=>`<h2 style="margin:0 0 20px;font-size:22px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">${t}</h2>`;
const pp = (t)=>`<p style="margin:0 0 16px;font-size:15px;color:#3A5A5A;line-height:1.7;">${t}</p>`;
function buildExecutedEmailHTML(firstName) {
  const name = firstName || "there";
  return wrap(`
${h2(`Your VYVE Health account has been deleted, ${name}.`)}
${pp("As requested, we've permanently erased your VYVE Health account and all associated data — your profile, activity history, wellbeing check-ins, nutrition logs, AI coach interactions, and all derived analytics. This action is final and cannot be reversed.")}
${pp("We've also removed you from our email lists and analytics. You will not hear from us again unless you choose to sign up in future, in which case a fresh account will be created.")}
${pp("This receipt is the last email you will receive from VYVE Health under the now-deleted account. We're sending it to confirm the erasure has completed and to give you a written record for your own files. Under UK GDPR, we retain this confirmation only as long as necessary for accountability purposes.")}
${pp("Wishing you well. — The VYVE Health team.")}
`);
}
async function sendBrevoExecuted(toEmail, toName) {
  if (!BREVO_KEY) throw new Error("BREVO_API_KEY not set");
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_KEY,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: "VYVE Health",
        email: "team@vyvehealth.co.uk"
      },
      to: [
        {
          email: toEmail,
          name: toName
        }
      ],
      subject: "VYVE Health: account deletion complete",
      htmlContent: buildExecutedEmailHTML(toName),
      tags: [
        "gdpr_erase_executed"
      ]
    })
  });
  const d = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return d.messageId || null;
}
// ─── Third-party purges (best-effort) ─────────────────────────────────────
async function alertPlatform(supabaseSvc, severity, type, memberEmail, details) {
  try {
    await supabaseSvc.from("platform_alerts").insert({
      severity,
      type,
      source: "gdpr-erase-execute",
      member_email: memberEmail,
      details
    });
  } catch (e) {
    console.error("[alertPlatform] insert failed:", e.message);
  }
}
async function purgeStripe(supabaseSvc, memberEmail, stripeCustomerId) {
  if (!stripeCustomerId) return {
    ok: true,
    detail: "no_stripe_customer_id_on_member"
  };
  if (!STRIPE_KEY) {
    await alertPlatform(supabaseSvc, "warning", "gdpr_erase_stripe_skipped", memberEmail, "STRIPE_SECRET_KEY not set; Stripe purge skipped");
    return {
      ok: true,
      detail: "stripe_key_not_set_skipped"
    };
  }
  try {
    const r = await fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(stripeCustomerId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`
      }
    });
    if (r.status === 404) return {
      ok: true,
      detail: "stripe_customer_already_absent_404"
    };
    if (!r.ok) {
      const body = await r.text().catch(()=>"");
      await alertPlatform(supabaseSvc, "warning", "gdpr_erase_stripe_failed", memberEmail, `Stripe DELETE ${r.status}: ${body.slice(0, 300)}`);
      return {
        ok: false,
        detail: `stripe_delete_${r.status}`
      };
    }
    return {
      ok: true,
      detail: "stripe_customer_deleted"
    };
  } catch (e) {
    await alertPlatform(supabaseSvc, "warning", "gdpr_erase_stripe_failed", memberEmail, `Stripe call threw: ${e.message}`);
    return {
      ok: false,
      detail: `stripe_threw_${e.message.slice(0, 100)}`
    };
  }
}
async function purgeBrevoContact(supabaseSvc, memberEmail) {
  if (!BREVO_KEY) {
    await alertPlatform(supabaseSvc, "warning", "gdpr_erase_brevo_skipped", memberEmail, "BREVO_API_KEY not set; Brevo contact purge skipped");
    return {
      ok: true,
      detail: "brevo_key_not_set_skipped"
    };
  }
  try {
    const r = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(memberEmail)}`, {
      method: "DELETE",
      headers: {
        "api-key": BREVO_KEY,
        Accept: "application/json"
      }
    });
    if (r.status === 204) return {
      ok: true,
      detail: "brevo_contact_deleted"
    };
    if (r.status === 404) return {
      ok: true,
      detail: "brevo_contact_already_absent_404"
    };
    const body = await r.text().catch(()=>"");
    await alertPlatform(supabaseSvc, "warning", "gdpr_erase_brevo_failed", memberEmail, `Brevo DELETE ${r.status}: ${body.slice(0, 300)}`);
    return {
      ok: false,
      detail: `brevo_delete_${r.status}`
    };
  } catch (e) {
    await alertPlatform(supabaseSvc, "warning", "gdpr_erase_brevo_failed", memberEmail, `Brevo call threw: ${e.message}`);
    return {
      ok: false,
      detail: `brevo_threw_${e.message.slice(0, 100)}`
    };
  }
}
async function purgePostHog(supabaseSvc, memberEmail) {
  if (!POSTHOG_KEY || !POSTHOG_PROJECT_ID) {
    // PostHog identity wiring is in backlog (see master.md). Until live, skipping is correct.
    return {
      ok: true,
      detail: "posthog_not_configured_skipped"
    };
  }
  try {
    // PostHog GDPR delete: POST to /api/projects/{id}/persons/delete with distinct_id
    const r = await fetch(`https://eu.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/persons/?distinct_id=${encodeURIComponent(memberEmail)}&delete_events=true`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${POSTHOG_KEY}`,
        Accept: "application/json"
      }
    });
    if (r.status === 204 || r.status === 200) return {
      ok: true,
      detail: "posthog_person_deleted"
    };
    if (r.status === 404) return {
      ok: true,
      detail: "posthog_person_absent_404"
    };
    const body = await r.text().catch(()=>"");
    await alertPlatform(supabaseSvc, "warning", "gdpr_erase_posthog_failed", memberEmail, `PostHog DELETE ${r.status}: ${body.slice(0, 300)}`);
    return {
      ok: false,
      detail: `posthog_delete_${r.status}`
    };
  } catch (e) {
    await alertPlatform(supabaseSvc, "warning", "gdpr_erase_posthog_failed", memberEmail, `PostHog call threw: ${e.message}`);
    return {
      ok: false,
      detail: `posthog_threw_${e.message.slice(0, 100)}`
    };
  }
}
// ─── Audit ────────────────────────────────────────────────────────────────
async function writeAudit(supabaseSvc, subject, requester, kind, action, metadata) {
  try {
    await supabaseSvc.from("admin_audit_log").insert({
      admin_email: requester,
      admin_role: kind === "admin" ? "admin" : "member_self",
      member_email: subject,
      action,
      table_name: "gdpr_erasure_requests",
      new_value: metadata
    });
  } catch (e) {
    console.error("[writeAudit] failed:", e.message);
  }
}
// ─── Per-row processing ─────────────────────────────────────────────────
async function processRequest(supabaseSvc, req) {
  const { id, member_email, requested_by, request_kind, attempt_count } = req;
  const startedAt = Date.now();
  try {
    // Capture firstName + stripe id BEFORE the purge wipes the row
    const { data: memberRow } = await supabaseSvc.from("members").select("first_name, stripe_customer_id").eq("email", member_email).maybeSingle();
    const firstName = memberRow?.first_name || "";
    const stripeCustomerId = memberRow?.stripe_customer_id || null;
    // 1. Third-party purges (best-effort, non-aborting)
    const [stripeRes, brevoRes, posthogRes] = await Promise.all([
      purgeStripe(supabaseSvc, member_email, stripeCustomerId),
      purgeBrevoContact(supabaseSvc, member_email),
      purgePostHog(supabaseSvc, member_email)
    ]);
    // 2. Atomic DB purge via RPC. This is the bit that MUST succeed.
    const { data: purgeResult, error: purgeErr } = await supabaseSvc.rpc("gdpr_erasure_purge", {
      p_email: member_email
    });
    if (purgeErr) throw new Error(`gdpr_erasure_purge rpc: ${purgeErr.message}`);
    // 3. auth.users delete (post-tx)
    let authDeleted = false;
    let authDeleteDetail = "";
    try {
      const { data: usersData } = await supabaseSvc.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      const u = usersData?.users?.find((x)=>x.email?.toLowerCase() === member_email);
      if (u?.id) {
        const { error: delErr } = await supabaseSvc.auth.admin.deleteUser(u.id);
        if (delErr) {
          authDeleteDetail = `delete_failed: ${delErr.message}`;
          await alertPlatform(supabaseSvc, "warning", "gdpr_erase_auth_user_failed", member_email, `auth.admin.deleteUser failed for ${u.id}: ${delErr.message}`);
        } else {
          authDeleted = true;
          authDeleteDetail = `deleted_user_id_${u.id}`;
        }
      } else {
        authDeleteDetail = "no_auth_user_found";
      }
    } catch (e) {
      authDeleteDetail = `threw: ${e.message}`;
      await alertPlatform(supabaseSvc, "warning", "gdpr_erase_auth_user_failed", member_email, `auth user purge threw: ${e.message}`);
    }
    // Build the full execution summary
    const fullSummary = {
      db_purge: purgeResult,
      stripe: stripeRes,
      brevo_contact: brevoRes,
      posthog: posthogRes,
      auth_user_deleted: authDeleted,
      auth_user_detail: authDeleteDetail,
      duration_ms: Date.now() - startedAt,
      attempt_count
    };
    // 4. Mark the request executed
    await supabaseSvc.from("gdpr_erasure_requests").update({
      executed_at: new Date().toISOString(),
      stripe_handled: stripeRes.ok,
      execution_summary: fullSummary
    }).eq("id", id);
    // 5. Send the executed confirmation email (best-effort; the record is already final)
    try {
      await sendBrevoExecuted(member_email, firstName);
    } catch (e) {
      // Already deleted from Brevo contact list one step ago — sending a transactional
      // email may still work (transactional doesn't require contact list membership).
      // If it fails, log but don't fail the whole erasure.
      await alertPlatform(supabaseSvc, "info", "gdpr_erase_executed_email_failed", member_email, `Executed email failed (record is final): ${e.message}`);
    }
    await writeAudit(supabaseSvc, member_email, requested_by, request_kind, "gdpr_erase_executed", {
      request_id: id,
      ...fullSummary
    });
    return {
      status: "executed",
      summary: fullSummary
    };
  } catch (e) {
    const msg = e.message || String(e);
    console.error(`[processRequest] ${member_email} attempt ${attempt_count}/${MAX_ATTEMPTS}:`, msg);
    const isFinalAttempt = attempt_count >= MAX_ATTEMPTS;
    const updates = {
      failure_reason: msg.slice(0, 500)
    };
    if (isFinalAttempt) updates.failed_at = new Date().toISOString();
    await supabaseSvc.from("gdpr_erasure_requests").update(updates).eq("id", id);
    if (isFinalAttempt) {
      await alertPlatform(supabaseSvc, "critical", "gdpr_erase_terminal_failure", member_email, `Erasure ${id} hit ${MAX_ATTEMPTS}-attempt cap. Last error: ${msg.slice(0, 300)}`);
    }
    await writeAudit(supabaseSvc, member_email, requested_by, request_kind, "gdpr_erase_failed", {
      request_id: id,
      attempt: attempt_count,
      max_attempts: MAX_ATTEMPTS,
      final_attempt: isFinalAttempt,
      reason: msg,
      duration_ms: Date.now() - startedAt
    });
    return {
      status: "failed",
      detail: msg
    };
  }
}
// ─── HTTP entry ───────────────────────────────────────────────────────────
Deno.serve(async (req)=>{
  if (CRON_SECRET) {
    const auth = req.headers.get("Authorization") ?? "";
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({
        error: "unauthorized"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  const supabaseSvc = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
      persistSession: false
    }
  });
  const { data: due, error: pickErr } = await supabaseSvc.rpc("gdpr_erasure_pick_due", {
    limit_n: TICK_LIMIT
  });
  if (pickErr) {
    console.error("[gdpr-erase-execute] pick_due error:", pickErr);
    return new Response(JSON.stringify({
      error: "pick_due failed",
      detail: pickErr.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  const dueRows = due ?? [];
  console.log(`[gdpr-erase-execute] picked ${dueRows.length} due rows`);
  const results = [];
  for (const row of dueRows){
    const r = await processRequest(supabaseSvc, row);
    results.push({
      id: row.id,
      member_email: row.member_email,
      status: r.status,
      ...r.detail ? {
        detail: r.detail
      } : {}
    });
  }
  return new Response(JSON.stringify({
    success: true,
    picked: dueRows.length,
    executed: results.filter((r)=>r.status === "executed").length,
    failed: results.filter((r)=>r.status === "failed").length,
    results
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
});
