import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const GITHUB_PAT = Deno.env.get('GITHUB_PAT') ?? '';
const OWNER = 'VYVEHealth';
const REPO = 'Test-Site-Finalv3';
const BRANCH = 'main';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });
  try {
    const body = await req.json();
    const { path, content, message } = body;
    if (!path || !content || !message) {
      return new Response(JSON.stringify({
        error: 'path, content, message required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Check if file exists to get SHA
    const checkRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    let sha;
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }
    const payload = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: BRANCH
    };
    if (sha) payload.sha = sha;
    const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const result = await putRes.json();
    if (!putRes.ok) return new Response(JSON.stringify({
      error: result
    }), {
      status: putRes.status,
      headers: corsHeaders
    });
    return new Response(JSON.stringify({
      success: true,
      path,
      sha: result.content?.sha
    }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
