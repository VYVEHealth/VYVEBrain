// github-proxy v11 — GITHUB_PROXY_SECRET header auth + CORS restricted to portal
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const GITHUB_PAT = Deno.env.get('GITHUB_PAT');
const PROXY_SECRET = Deno.env.get('GITHUB_PROXY_SECRET') ?? '';
const OWNER = 'VYVEHealth';
const REPO = 'vyve-site';
const BRANCH = 'main';
const CORS = {
  'Access-Control-Allow-Origin': 'https://online.vyvehealth.co.uk',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-proxy-key',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  // Auth check — require x-proxy-key header
  if (!PROXY_SECRET) {
    console.error('github-proxy: GITHUB_PROXY_SECRET not configured');
    return new Response(JSON.stringify({
      error: 'Server misconfiguration'
    }), {
      status: 500,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const providedKey = req.headers.get('x-proxy-key') ?? '';
  if (providedKey !== PROXY_SECRET) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const url = new URL(req.url);
  const filePath = url.searchParams.get('path');
  if (!filePath) return new Response('Missing path', {
    status: 400,
    headers: CORS
  });
  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  const ghHeaders = {
    'Authorization': `token ${GITHUB_PAT}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'VYVE-Edge'
  };
  if (req.method === 'GET') {
    const res = await fetch(apiUrl, {
      headers: ghHeaders
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method === 'PUT') {
    const body = await req.json();
    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        ...ghHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: body.message || 'Update via Edge Function',
        content: body.content,
        sha: body.sha,
        branch: BRANCH
      })
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  return new Response('Method not allowed', {
    status: 405,
    headers: CORS
  });
});
