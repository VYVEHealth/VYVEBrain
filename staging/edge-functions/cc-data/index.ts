// cc-data v2 — Command Centre data API
// Handles all CRUD for cc_* tables + file uploads to cc-documents Storage bucket
// Auth: JWT required, team@vyvehealth.co.uk only
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};
// Valid cc_ tables
const VALID_TABLES = new Set([
  'cc_clients',
  'cc_leads',
  'cc_investors',
  'cc_partners',
  'cc_tasks',
  'cc_decisions',
  'cc_okrs',
  'cc_finance',
  'cc_revenue',
  'cc_grants',
  'cc_posts',
  'cc_invoices',
  'cc_sessions',
  'cc_intel',
  'cc_knowledge',
  'cc_documents',
  'cc_swot',
  'cc_episodes'
]);
async function getEmail(req) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  if (token === SUPABASE_ANON) return null;
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user?.email) return null;
    return user.email.toLowerCase();
  } catch  {
    return null;
  }
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    const email = await getEmail(req);
    if (!email) return json({
      error: 'Authentication required'
    }, 401);
    if (email !== 'team@vyvehealth.co.uk') return json({
      error: 'Unauthorised'
    }, 403);
    const url = new URL(req.url);
    // Supabase EFs receive full path. Strip the function prefix to get sub-path.
    const rawPath = url.pathname;
    // Try both patterns - with and without /functions/v1/ prefix
    let subPath = rawPath.replace(/^\/functions\/v1\/cc-data/, '').replace(/^\/cc-data/, '');
    // Also handle case where Supabase strips to just the sub-path
    if (subPath === rawPath) subPath = rawPath; // no match, use raw
    const segments = subPath.split('/').filter(Boolean);
    const table = segments[0];
    const id = segments[1];
    console.log(`[cc-data] ${req.method} rawPath=${rawPath} subPath=${subPath} table=${table} id=${id}`);
    // ── File upload ──────────────────────────────────────────────────────────
    if (table === 'upload') {
      if (req.method !== 'POST') return json({
        error: 'POST required'
      }, 405);
      const formData = await req.formData();
      const file = formData.get('file');
      const category = formData.get('category') || 'general';
      if (!file) return json({
        error: 'No file provided'
      }, 400);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const storagePath = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { error: uploadError } = await sb.storage.from('cc-documents').upload(storagePath, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false
      });
      if (uploadError) return json({
        error: uploadError.message
      }, 500);
      const { data: doc, error: dbError } = await sb.from('cc_documents').insert({
        name: file.name,
        file_size: file.size,
        file_type: ext,
        category,
        storage_path: storagePath,
        created_by: email
      }).select().single();
      if (dbError) return json({
        error: dbError.message
      }, 500);
      return json({
        success: true,
        document: doc
      });
    }
    // ── Signed URL for file download ─────────────────────────────────────────
    if (table === 'signed-url' && id) {
      const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data: doc } = await sb.from('cc_documents').select('storage_path,name').eq('id', id).single();
      if (!doc) return json({
        error: 'Document not found'
      }, 404);
      const { data: urlData, error: urlError } = await sb.storage.from('cc-documents').createSignedUrl(doc.storage_path, 3600);
      if (urlError) return json({
        error: urlError.message
      }, 500);
      return json({
        url: urlData.signedUrl,
        name: doc.name
      });
    }
    // ── Table validation ─────────────────────────────────────────────────────
    if (!table || !VALID_TABLES.has(table)) {
      return json({
        error: `Invalid table: ${table}. rawPath=${rawPath}, subPath=${subPath}, segments=${JSON.stringify(segments)}`
      }, 400);
    }
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      if (id) {
        const { data, error } = await sb.from(table).select('*').eq('id', id).single();
        if (error) return json({
          error: error.message
        }, 404);
        return json({
          data
        });
      }
      const params = Object.fromEntries(url.searchParams);
      let query = sb.from(table).select('*');
      if (params.type) query = query.eq('type', params.type);
      if (params.stage) query = query.eq('stage', params.stage);
      if (params.status) query = query.eq('status', params.status);
      if (params.owner) query = query.eq('owner', params.owner);
      if (params.quadrant) query = query.eq('quadrant', params.quadrant);
      query = query.order('created_at', {
        ascending: false
      });
      if (params.limit) query = query.limit(parseInt(params.limit));
      const { data, error } = await query;
      if (error) return json({
        error: error.message
      }, 500);
      return json({
        data: data || []
      });
    }
    // ── POST ─────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = await req.json();
      body.created_by = email;
      const { data, error } = await sb.from(table).insert(body).select().single();
      if (error) return json({
        error: error.message
      }, 500);
      return json({
        data
      }, 201);
    }
    // ── PATCH ────────────────────────────────────────────────────────────────
    if (req.method === 'PATCH') {
      if (!id) return json({
        error: 'ID required for PATCH'
      }, 400);
      const body = await req.json();
      delete body.id;
      delete body.created_by;
      delete body.created_at;
      const { data, error } = await sb.from(table).update(body).eq('id', id).select().single();
      if (error) return json({
        error: error.message
      }, 500);
      return json({
        data
      });
    }
    // ── DELETE ───────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!id) return json({
        error: 'ID required for DELETE'
      }, 400);
      if (table === 'cc_documents') {
        const { data: doc } = await sb.from('cc_documents').select('storage_path').eq('id', id).single();
        if (doc?.storage_path) {
          await sb.storage.from('cc-documents').remove([
            doc.storage_path
          ]);
        }
      }
      const { error } = await sb.from(table).delete().eq('id', id);
      if (error) return json({
        error: error.message
      }, 500);
      return json({
        success: true
      });
    }
    return json({
      error: 'Method not allowed'
    }, 405);
  } catch (err) {
    console.error('cc-data error:', err);
    return json({
      error: String(err)
    }, 500);
  }
});
