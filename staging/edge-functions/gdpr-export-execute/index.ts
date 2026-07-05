// VYVE Health — gdpr-export-execute v4 (4 July 2026).
//
// v4: gate additionally accepts an x-vyve-cron-key header matching the
// GDPR_CRON_KEY vault secret (fetched via the service-role-only RPC
// gdpr_cron_key(), cached per isolate). The pg_cron tick sends this header
// with the value read from vault in the cron command itself — both sides
// share one secret with no dashboard round-trip. Bearer CRON_SECRET and
// Bearer SERVICE_KEY remain accepted.
//
// v3: gate accepts Bearer CRON_SECRET OR Bearer SUPABASE_SERVICE_ROLE_KEY;
// always enforced. (Discovered: crons sent no auth header while CRON_SECRET
// was set — every tick 401'd; pipeline silently dead.)
//
// v2: table coverage is CATALOG-DRIVEN via gdpr_member_scoped_tables() — same
// source of truth as gdpr_erasure_purge. Retain-policy tables still included
// (Article 15 covers retained data). Enumeration failure = export failure;
// never a silent partial export.
//
// v1 core unchanged: every 15 min, pick ≤5 due rows via gdpr_export_pick_due()
// (FOR UPDATE SKIP LOCKED, attempt_count < 3, 10-min re-queue), build JSON,
// upload to gdpr-exports, sign URL (7d), Brevo email, admin_audit_log receipt.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_KEY = Deno.env.get("BREVO_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const SIGNED_URL_TTL_SECONDS = 7 * 86400;  // 7 days
const TICK_LIMIT = 5;
const MAX_ATTEMPTS = 3;

type ScopedTable = { table_name: string; subject_column: string; policy: string; registered: boolean };

let cachedCronKey: string | null = null;

async function isAuthorized(req: Request, svc: any): Promise<boolean> {
  const auth = req.headers.get("Authorization") ?? "";
  if (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) return true;
  if (SERVICE_KEY && auth === `Bearer ${SERVICE_KEY}`) return true;
  const hdr = req.headers.get("x-vyve-cron-key") ?? "";
  if (hdr) {
    if (cachedCronKey === null) {
      try {
        const { data } = await svc.rpc("gdpr_cron_key");
        cachedCronKey = typeof data === "string" ? data : "";
      } catch (_e) {
        cachedCronKey = "";
      }
    }
    if (cachedCronKey && hdr === cachedCronKey) return true;
  }
  return false;
}

// auth.users sanitisation whitelist - everything else dropped (tokens, hashes, etc).
const AUTH_USER_WHITELIST = [
  "id", "email", "created_at", "updated_at",
  "last_sign_in_at", "email_confirmed_at",
  "user_metadata", "app_metadata",
];

const README_TEXT = `This file is your VYVE Health data export under Article 15 of the UK GDPR.

WHAT'S INCLUDED
This export contains every record VYVE Health CIC holds against your email
address across our platform tables. The table list is generated automatically
from our live database catalogue at the moment of export, so newly added
features are always covered. Each top-level key corresponds to one database
table; the value is either a single object (your profile) or an array of rows.
A small number of tables are retained after account erasure for a documented
legal basis (e.g. financial transaction records) — those are still included
here in full, and are listed in _meta.retained_on_erasure.

UNDERSTANDING DERIVED DATA
Some sections (member_home_state, member_stats, member_activity_daily) are
derived counters and aggregates computed from your raw activity. Deleting
your account purges both the source and derived rows; this export shows both
for completeness.

WHAT'S NOT INCLUDED
- Reference / library data (workout templates, habit themes, nutrition database)
  is not personal data and is not included.
- Shared resources (running plan templates) where multiple members hit the same
  cached output cannot be attributed to any single member; we have noted this
  exclusion in _meta.tables_excluded.
- Live session chat messages from OTHER members are not included — only your
  own messages. Note: chat sent in a live session was visible to all session
  attendees at the time. The same applies to any custom workouts you shared.
- Internal staff audit logs are not included; they record who accessed your
  data, not your data itself.

YOUR RIGHTS
You can request correction (Article 16) or erasure (Article 17) of any of
this data by emailing team@vyvehealth.co.uk. Erasure has a 30-day grace
period before permanent deletion, during which you can cancel by replying
to the confirmation email.

VYVE Health CIC · ICO Registration: 00013608608`;

// ─── Brevo email ─────────────────────────────────────────────────────────────

const wrap = (body: string) => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4FAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);"><tr><td style="background:#0D2B2B;padding:24px 32px;"><img src="https://online.vyvehealth.co.uk/logo.png" alt="VYVE Health" style="height:36px;display:block;" /></td></tr><tr><td style="padding:32px;">${body}</td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &nbsp;&middot;&nbsp; team@vyvehealth.co.uk<br>ICO Registration No. 00013608608</p></td></tr></table></td></tr></table></body></html>`;
const h2 = (t: string) => `<h2 style="margin:0 0 20px;font-size:22px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">${t}</h2>`;
const pp = (t: string) => `<p style="margin:0 0 16px;font-size:15px;color:#3A5A5A;line-height:1.7;">${t}</p>`;
const btn = (label: string, href: string) => `<div style="text-align:center;margin:28px 0;"><a href="${href}" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${label} &rarr;</a></div>`;

function buildEmailHTML(firstName: string, signedUrl: string, expiresAt: string): string {
  const name = firstName || "there";
  const expDate = new Date(expiresAt).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return wrap(`
${h2(`Your VYVE Health data export is ready, ${name}.`)}
${pp("This file contains every record we hold about you across our platform — your profile, activity history, wellbeing check-ins, nutrition logs, AI coach interactions, and more. It's the response to your right of access under Article 15 of the UK GDPR.")}
${btn("Download my VYVE data", signedUrl)}
${pp(`The link expires on ${expDate}. If you didn't request this export, please reply to this email and we'll investigate.`)}
${pp("For any questions about your data or your rights under UK GDPR, reach us at team@vyvehealth.co.uk.")}
`);
}

async function sendBrevo(toEmail: string, toName: string, signedUrl: string, expiresAt: string): Promise<string | null> {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "VYVE Health", email: "team@vyvehealth.co.uk" },
      to: [{ email: toEmail, name: toName }],
      subject: "Your VYVE Health data export is ready",
      htmlContent: buildEmailHTML(toName, signedUrl, expiresAt),
      tags: ["gdpr_export"],
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return d.messageId || null;
}

// ─── Build per-subject JSON ─────────────────────────────────────────────────

function sanitiseAuthUser(u: any): Record<string, unknown> | null {
  if (!u) return null;
  const out: Record<string, unknown> = {};
  for (const k of AUTH_USER_WHITELIST) {
    if (k in u) out[k] = u[k];
  }
  return out;
}

async function buildExport(supabaseSvc: any, subject: string): Promise<{ json: Record<string, unknown>; tablesIncluded: number }> {
  // Catalog-driven enumeration — the same source of truth gdpr_erasure_purge uses.
  // If this fails, the whole export fails (retry path). NEVER fall back to a hand list.
  const { data: scoped, error: enumErr } = await supabaseSvc.rpc("gdpr_member_scoped_tables");
  if (enumErr || !Array.isArray(scoped) || scoped.length === 0) {
    throw new Error(`gdpr_member_scoped_tables enumeration failed: ${enumErr?.message || "empty result"}`);
  }
  const scopedTables = scoped as ScopedTable[];
  const retainedTables = scopedTables.filter((t) => t.policy === "retain").map((t) => t.table_name);

  const out: Record<string, unknown> = {
    _meta: {
      schema_version: "2.0",
      enumeration: "catalog-driven (gdpr_member_scoped_tables)",
      generated_at: new Date().toISOString(),
      subject_email: subject,
      tables_included: 0,
      retained_on_erasure: retainedTables,
      tables_excluded: [
        { table: "running_plan_cache", reason: "shared_parametric_cache_no_subject_attribution" },
      ],
      vyve_legal_entity: "VYVE Health CIC",
      ico_registration: "00013608608",
      contact: "team@vyvehealth.co.uk",
    },
    _readme: README_TEXT,
  };

  let tableCount = 0;

  // Parent row: members, single object on email.
  {
    const { data, error } = await supabaseSvc.from("members").select("*").eq("email", subject).maybeSingle();
    if (error) {
      console.warn("[buildExport] members error:", error.message);
      out.members = null;
      out._meta = { ...(out._meta as object), error_members: error.message };
    } else {
      out.members = data;
    }
    tableCount += 1;
  }

  // Every enumerated member-scoped table, batched 8 at a time, filtered on its own subject column.
  const batches: ScopedTable[][] = [];
  for (let i = 0; i < scopedTables.length; i += 8) {
    batches.push(scopedTables.slice(i, i + 8));
  }
  for (const batch of batches) {
    const results = await Promise.all(
      batch.map((t) => supabaseSvc.from(t.table_name).select("*").eq(t.subject_column, subject))
    );
    batch.forEach((t, i) => {
      const r = results[i];
      if (r.error) {
        console.warn(`[buildExport] ${t.table_name} error:`, r.error.message);
        out[t.table_name] = [];
        out._meta = { ...(out._meta as object), [`error_${t.table_name}`]: r.error.message };
      } else {
        out[t.table_name] = r.data || [];
      }
      tableCount += 1;
    });
  }

  try {
    const { data: usersData } = await supabaseSvc.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const u = usersData?.users?.find((x: any) => x.email?.toLowerCase() === subject);
    out.auth_user = sanitiseAuthUser(u);
    tableCount += 1;
  } catch (e) {
    console.warn("[buildExport] auth.users error:", (e as Error).message);
    out.auth_user = null;
    out._meta = { ...(out._meta as object), error_auth_user: String(e) };
  }

  (out._meta as Record<string, unknown>).tables_included = tableCount;

  return { json: out, tablesIncluded: tableCount };
}

async function writeAudit(supabaseSvc: any, subject: string, requester: string, kind: string, action: string, metadata: Record<string, unknown>) {
  try {
    await supabaseSvc.from("admin_audit_log").insert({
      admin_email: requester,
      admin_role: kind === "admin" ? "admin" : "member_self",
      member_email: subject,
      action,
      table_name: "gdpr_export_requests",
      new_value: metadata,
    });
  } catch (e) {
    console.error("[writeAudit] failed:", (e as Error).message);
  }
}

async function processRequest(supabaseSvc: any, req: any): Promise<{ status: "delivered" | "failed"; detail?: string }> {
  const { id, member_email, requested_by, request_kind, attempt_count } = req;
  const startedAt = Date.now();

  try {
    const { json, tablesIncluded } = await buildExport(supabaseSvc, member_email);
    const jsonText = JSON.stringify(json, null, 2);
    const sizeBytes = jsonText.length;

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = `${member_email}/${ts}.json`;
    const { error: upErr } = await supabaseSvc.storage
      .from("gdpr-exports")
      .upload(filePath, jsonText, { contentType: "application/json", upsert: true });
    if (upErr) throw new Error(`Storage upload: ${upErr.message}`);

    const { data: signed, error: signErr } = await supabaseSvc.storage
      .from("gdpr-exports")
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
    if (signErr || !signed?.signedUrl) throw new Error(`Sign URL: ${signErr?.message || "no url"}`);
    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

    const { data: memberRow } = await supabaseSvc.from("members").select("first_name").eq("email", member_email).maybeSingle();
    const firstName = memberRow?.first_name || "there";
    const messageId = await sendBrevo(member_email, firstName, signed.signedUrl, expiresAt);

    await supabaseSvc.from("gdpr_export_requests").update({
      delivered_at: new Date().toISOString(),
      file_path: filePath,
      signed_url_expires_at: expiresAt,
      size_bytes: sizeBytes,
      tables_included: tablesIncluded,
      brevo_message_id: messageId,
    }).eq("id", id);

    await writeAudit(supabaseSvc, member_email, requested_by, request_kind, "gdpr_export_delivered", {
      request_id: id,
      file_path: filePath,
      signed_url_expires_at: expiresAt,
      size_bytes: sizeBytes,
      tables_included: tablesIncluded,
      brevo_message_id: messageId,
      duration_ms: Date.now() - startedAt,
    });

    return { status: "delivered" };
  } catch (e) {
    const msg = (e as Error).message || String(e);
    console.error(`[processRequest] ${member_email} attempt ${attempt_count}/${MAX_ATTEMPTS}:`, msg);

    const isFinalAttempt = attempt_count >= MAX_ATTEMPTS;
    const updates: Record<string, unknown> = { failure_reason: msg.slice(0, 500) };
    if (isFinalAttempt) updates.failed_at = new Date().toISOString();
    await supabaseSvc.from("gdpr_export_requests").update(updates).eq("id", id);

    await writeAudit(supabaseSvc, member_email, requested_by, request_kind, "gdpr_export_failed", {
      request_id: id,
      attempt: attempt_count,
      max_attempts: MAX_ATTEMPTS,
      final_attempt: isFinalAttempt,
      reason: msg,
      duration_ms: Date.now() - startedAt,
    });

    return { status: "failed", detail: msg };
  }
}

Deno.serve(async (req: Request) => {
  const supabaseSvc = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (!(await isAuthorized(req, supabaseSvc))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json" },
    });
  }

  const { data: due, error: pickErr } = await supabaseSvc.rpc("gdpr_export_pick_due", { limit_n: TICK_LIMIT });
  if (pickErr) {
    console.error("[gdpr-export-execute] pick_due error:", pickErr);
    return new Response(JSON.stringify({ error: "pick_due failed", detail: pickErr.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const dueRows = (due ?? []) as any[];
  console.log(`[gdpr-export-execute] picked ${dueRows.length} due rows`);

  const results: any[] = [];
  for (const row of dueRows) {
    const r = await processRequest(supabaseSvc, row);
    results.push({ id: row.id, member_email: row.member_email, ...r });
  }

  return new Response(JSON.stringify({
    success: true,
    processed: results.length,
    delivered: results.filter((r) => r.status === "delivered").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
