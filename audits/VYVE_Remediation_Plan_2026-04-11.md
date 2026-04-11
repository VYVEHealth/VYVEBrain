# VYVE Health — Remediation Plan

**Date:** 11 April 2026
**Source:** Full System Audit (same date)
**Owner:** Dean Brown (CTO)
**Approach:** Plan first, execute after sign-off

---

## How to Use This Document

Each fix is self-contained with exact code, exact commands, and expected outcomes. Fixes are ordered by severity — do them in order. Each fix states what it changes, why, and what to verify after.

**Convention:** 🔴 = Critical, 🟠 = High, 🟡 = Medium, 🟢 = Low

---

## FIX 1 🔴 — Secure github-proxy (Unauthenticated Repo Write Access)

### What's wrong
`github-proxy` has no auth. Anyone who knows the URL can read or overwrite any file in `vyve-site`, including injecting malicious JavaScript into portal pages served to all members.

### What to change
Add a shared secret (`GITHUB_PROXY_SECRET`) that must be sent as an `x-proxy-key` header. Only Claude/Composio sessions and Dean's manual calls should know this key.

### Step-by-step

**Step 1:** Generate a secret:
```bash
openssl rand -hex 32
```
Save the output.

**Step 2:** Set the secret in Supabase:
```bash
supabase secrets set GITHUB_PROXY_SECRET=<your-generated-key> --project-ref ixjfklpckgxrwjlfsaaz
```

**Step 3:** Deploy updated `github-proxy` with auth check. The new code adds:
- Header validation: `x-proxy-key` must match the secret
- CORS restriction to trusted origins only
- 401 response for missing/invalid key

```typescript
// github-proxy v12 — adds secret-based auth
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GITHUB_PAT = Deno.env.get('GITHUB_PAT')!;
const PROXY_SECRET = Deno.env.get('GITHUB_PROXY_SECRET') ?? '';
const OWNER = 'VYVEHealth';
const REPO = 'vyve-site';
const BRANCH = 'main';

const CORS = {
  'Access-Control-Allow-Origin': 'https://online.vyvehealth.co.uk',
  'Access-Control-Allow-Headers': 'x-proxy-key, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Auth check
  const providedKey = req.headers.get('x-proxy-key');
  if (!PROXY_SECRET || providedKey !== PROXY_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(req.url);
  const filePath = url.searchParams.get('path');
  if (!filePath) return new Response('Missing path', { status: 400, headers: CORS });

  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  const headers = {
    'Authorization': `token ${GITHUB_PAT}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'VYVE-Edge'
  };

  if (req.method === 'GET') {
    const res = await fetch(apiUrl, { headers });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  if (req.method === 'PUT') {
    const body = await req.json();
    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
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
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405, headers: CORS });
});
```

**Step 4:** Verify — call without the key, expect 401:
```bash
curl -s https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/github-proxy?path=sw.js | head -20
# Should return: {"error":"Unauthorized"}
```

**Step 5:** Update VYVEBrain master.md with the new secret name and usage pattern.

---

## FIX 2 🔴 — Fix member-dashboard Auth (Remove ?email= Fallback)

### What's wrong
The function has `verify_jwt: false` and accepts `?email=` as a fallback. Anyone who knows a member's email can read their full dashboard data.

### What to change
- Remove `?email=` fallback entirely
- Derive email exclusively from JWT
- Keep `verify_jwt: false` at the Supabase level (because the function already does JWT validation in code and needs to handle the error gracefully)

### Step-by-step

**Step 1:** Deploy updated `member-dashboard` with JWT-only auth:

The key change is replacing the auth block. Remove:
```typescript
// Fall back to ?email= query param
if (!email) {
  const url = new URL(req.url);
  email = url.searchParams.get('email')?.toLowerCase() ?? null;
}
```

Replace the entire auth section with:
```typescript
let email: string | null = null;

const authHeader = req.headers.get('Authorization');
if (authHeader && authHeader.startsWith('Bearer ')) {
  const token = authHeader.slice(7);
  if (token !== SUPABASE_ANON) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        email = user.email?.toLowerCase() || null;
      }
    } catch (_) { /* no valid JWT */ }
  }
}

if (!email) {
  return new Response(JSON.stringify({ error: 'Authentication required. Please log in.' }), {
    status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}
```

**Step 2:** Verify all portal pages send JWT. Check `index.html` to ensure it calls the Edge Function with the auth header. The pattern should be:

```javascript
const { data: { session } } = await vyveSupabase.auth.getSession();
const res = await fetch(EF_URL + '/member-dashboard', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

Search each portal page that calls `member-dashboard` and confirm JWT headers are included.

**Step 3:** Test — log in as a member, confirm dashboard loads. Then try the old URL pattern:
```bash
curl -s "https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/member-dashboard?email=lewisvines@hotmail.com"
# Should return: {"error":"Authentication required. Please log in."}
```

---

## FIX 3 🔴 — Secure Onboarding Endpoint

### What's wrong
CORS is `*`, no Stripe payment verification, no CAPTCHA. Anyone can POST to create fake members.

### What to change
- Restrict CORS to `https://www.vyvehealth.co.uk` (where the onboarding form lives)
- Add basic rate limiting
- Add a shared secret header (same pattern as github-proxy) as an interim measure before Stripe session validation is built

### Step-by-step

**Step 1:** Change CORS in the onboarding function from:
```typescript
const CORS = {
  'Access-Control-Allow-Origin': '*',
  ...
};
```
To:
```typescript
const CORS = {
  'Access-Control-Allow-Origin': 'https://www.vyvehealth.co.uk',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-onboarding-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};
```

**Step 2:** Add a shared secret check:
```typescript
const ONBOARDING_SECRET = Deno.env.get('ONBOARDING_SECRET') ?? '';

// Inside serve handler, after OPTIONS check:
if (ONBOARDING_SECRET) {
  const providedKey = req.headers.get('x-onboarding-key');
  if (providedKey !== ONBOARDING_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}
```

**Step 3:** Set the secret:
```bash
openssl rand -hex 32
supabase secrets set ONBOARDING_SECRET=<generated-key> --project-ref ixjfklpckgxrwjlfsaaz
```

**Step 4:** Update `welcome.html` in `Test-Site-Finalv3` to include the key in the fetch call:
```javascript
const res = await fetch(ONBOARDING_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-onboarding-key': 'THE_KEY_HERE'  // This is OK in client code for the marketing site
  },
  body: JSON.stringify(formData)
});
```

**Note:** The key being visible in client JS is acceptable here — it stops casual abuse and automated attacks. The real protection is CORS (browser-enforced) + the key (stops cURL scripts). Full Stripe session validation is the proper long-term fix.

**Step 5:** Verify — try POSTing from a different origin or without the key, confirm 401.

---

## FIX 4 🟠 — Secure send-email (Open Relay)

### What's wrong
Anyone can POST to send-email and send emails from `team@vyvehealth.co.uk` to any address.

### What to change
The HTTP handler should only respond to requests from other Edge Functions (authenticated with the service role key) or be removed entirely.

### Step-by-step

**Step 1:** Add service-role-key validation to the HTTP handler:
```typescript
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Only allow calls from other Edge Functions (service role key)
  const authHeader = req.headers.get('Authorization');
  const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!authHeader || authHeader !== `Bearer ${SUPABASE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized — internal use only' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ... rest of existing handler
});
```

**Step 2:** Update CORS to restrict origins:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://online.vyvehealth.co.uk",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

**Step 3:** Verify — direct call without service role key returns 401.

---

## FIX 5 🟠 — Set EMPLOYER_DASHBOARD_API_KEY and Remove Unauthenticated Fallback

### What's wrong
API key secret not configured. The fallback allows unauthenticated access to all member/company data.

### Step-by-step

**Step 1:** Generate and set the key:
```bash
openssl rand -hex 32
supabase secrets set EMPLOYER_DASHBOARD_API_KEY=<generated-key> --project-ref ixjfklpckgxrwjlfsaaz
```

**Step 2:** Remove the unauthenticated fallback from `employer-dashboard`. Change:
```typescript
if (!EMPLOYER_API_KEY) {
  console.warn('EMPLOYER_DASHBOARD_API_KEY not configured - allowing unauthenticated access');
  return { valid: true, identifier: 'no-auth-configured' };
}
```
To:
```typescript
if (!EMPLOYER_API_KEY) {
  return { valid: false, error: 'Server configuration error — API key not set.' };
}
```

**Step 3:** Update the employer dashboard HTML page (`vyve-dashboard-live.html` in Test-Site-Finalv3) to include the API key in requests.

**Step 4:** Store the key securely. Share with Lewis for the dashboard page. Document in VYVEBrain.

---

## FIX 6 🟡 — Fix send-email Model Name

### What's wrong
```typescript
model: "claude-sonnet-4-5"  // Invalid
```

### What to change
```typescript
model: "claude-sonnet-4-20250514"  // Correct
```

### Step-by-step
Single-line fix in `send-email` Edge Function. Redeploy.

---

## FIX 7 🟡 — Fix session_chat INSERT Policy

### What's wrong
INSERT policy has `with_check: true` — any authenticated user can insert messages with any `member_email`, enabling impersonation.

### Step-by-step

**Step 1:** Run SQL migration:
```sql
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "members can insert chat" ON session_chat;

-- Create scoped INSERT policy
CREATE POLICY "members can insert own chat"
  ON session_chat
  FOR INSERT
  WITH CHECK (auth.email() = member_email);
```

**Step 2:** Verify — the session chat pages should still work (they send JWT), but direct inserts with a different email should fail.

---

## FIX 8 🟡 — Tighten CORS on All Edge Functions

### What's wrong
`onboarding`, `send-email`, and `employer-dashboard` all have `Access-Control-Allow-Origin: '*'`.

### What to change

| Function | Current CORS | Target CORS |
|----------|-------------|-------------|
| onboarding | `*` | `https://www.vyvehealth.co.uk` |
| send-email | `*` | `https://online.vyvehealth.co.uk` |
| employer-dashboard | `*` | `https://www.vyvehealth.co.uk` |
| github-proxy | None | `https://online.vyvehealth.co.uk` |

These changes are included in fixes 1, 3, and 4 above. If deploying separately, update each function's CORS constant.

---

## FIX 9 🟡 — Clean Up Duplicate RLS Policies

### What's wrong
Six tables have redundant per-operation policies alongside an ALL policy. The ALL policy already covers everything.

### Step-by-step

**Step 1:** Run SQL migration to drop duplicates:
```sql
-- cardio: keep cardio_own_data (ALL), drop per-operation
DROP POLICY IF EXISTS "cardio_select_own" ON cardio;
DROP POLICY IF EXISTS "cardio_insert_own" ON cardio;
DROP POLICY IF EXISTS "cardio_update_own" ON cardio;
DROP POLICY IF EXISTS "cardio_delete_own" ON cardio;

-- daily_habits: keep daily_habits_own_data (ALL), drop per-operation
DROP POLICY IF EXISTS "daily_habits_select_own" ON daily_habits;
DROP POLICY IF EXISTS "daily_habits_insert_own" ON daily_habits;
DROP POLICY IF EXISTS "daily_habits_update_own" ON daily_habits;
DROP POLICY IF EXISTS "daily_habits_delete_own" ON daily_habits;

-- workouts: keep workouts_own_data (ALL), drop per-operation
DROP POLICY IF EXISTS "workouts_select_own" ON workouts;
DROP POLICY IF EXISTS "workouts_insert_own" ON workouts;
DROP POLICY IF EXISTS "workouts_update_own" ON workouts;
DROP POLICY IF EXISTS "workouts_delete_own" ON workouts;

-- session_views: keep session_views_own_data (ALL), drop per-operation
DROP POLICY IF EXISTS "session_views_select_own" ON session_views;
DROP POLICY IF EXISTS "session_views_insert_own" ON session_views;
DROP POLICY IF EXISTS "session_views_update_own" ON session_views;

-- replay_views: keep replay_views_own_data (ALL), drop per-operation
DROP POLICY IF EXISTS "replay_views_select_own" ON replay_views;
DROP POLICY IF EXISTS "replay_views_insert_own" ON replay_views;
DROP POLICY IF EXISTS "replay_views_update_own" ON replay_views;

-- weekly_scores: keep weekly_scores_own_data (ALL), drop per-operation
DROP POLICY IF EXISTS "weekly_scores_select_own" ON weekly_scores;
DROP POLICY IF EXISTS "weekly_scores_insert_own" ON weekly_scores;
DROP POLICY IF EXISTS "weekly_scores_update_own" ON weekly_scores;

-- wellbeing_checkins: keep wellbeing_checkins_own_data (ALL), drop per-operation
DROP POLICY IF EXISTS "wellbeing_checkins_select_own" ON wellbeing_checkins;
DROP POLICY IF EXISTS "wellbeing_checkins_insert_own" ON wellbeing_checkins;
DROP POLICY IF EXISTS "wellbeing_checkins_update_own" ON wellbeing_checkins;

-- members: keep members_own_data (ALL), drop per-operation
DROP POLICY IF EXISTS "members_select_own" ON members;
DROP POLICY IF EXISTS "members_update_own" ON members;
```

**Step 2:** Verify — log into portal, confirm all pages still load and data is accessible.

---

## FIX 10 🟢 — Delete 89 Dead Edge Functions

### What's wrong
89 one-shot patcher functions clutter the Supabase dashboard.

### Step-by-step
Run the deletion script from the April 9 security audit document (saved at `/mnt/user-data/outputs/vyve_repo_audit_updated_2026-04-09.md`). The script uses `supabase functions delete` for each function.

**Prerequisite:** Install Supabase CLI and authenticate:
```bash
npm install -g supabase
supabase login
```

Then run the script. Verify with:
```bash
supabase functions list --project-ref ixjfklpckgxrwjlfsaaz
```

Should show ~24 functions, not 113+.

---

## FIX 11 🟢 — Remove Duplicate Indexes

### What's wrong
- `weekly_scores` has two identical unique indexes
- `exercise_notes` has three overlapping indexes on `member_email`

### Step-by-step

```sql
-- Drop duplicate weekly_scores index (keep the named one)
DROP INDEX IF EXISTS weekly_scores_member_week_unique;

-- Drop redundant exercise_notes indexes (keep exercise_notes_exercise_idx which covers both)
DROP INDEX IF EXISTS exercise_notes_member_idx;
DROP INDEX IF EXISTS idx_exercise_notes_member;
```

---

## Implementation Order Summary

| Order | Fix | Severity | Effort | Dependencies |
|-------|-----|----------|--------|-------------|
| 1 | github-proxy auth | 🔴 Critical | 30 min | Generate secret, deploy EF |
| 2 | member-dashboard JWT-only | 🔴 Critical | 1 hour | Check all portal pages send JWT |
| 3 | Onboarding CORS + secret | 🔴 Critical | 45 min | Update welcome.html |
| 4 | send-email auth | 🟠 High | 20 min | None |
| 5 | Employer dashboard API key | 🟠 High | 15 min | Generate key, set secret |
| 6 | send-email model name | 🟡 Medium | 5 min | Deploy with fix 4 |
| 7 | session_chat INSERT policy | 🟡 Medium | 5 min | SQL migration |
| 8 | CORS tightening | 🟡 Medium | Included in 1-4 | Deploy with each fix |
| 9 | Duplicate RLS cleanup | 🟡 Medium | 10 min | SQL migration |
| 10 | Delete dead EFs | 🟢 Low | 15 min | Supabase CLI |
| 11 | Duplicate indexes | 🟢 Low | 5 min | SQL migration |

**Total estimated effort:** ~3-4 hours for all fixes.

---

## Verification Checklist (Post-Implementation)

After all fixes are deployed, verify:

- [ ] `github-proxy` returns 401 without `x-proxy-key` header
- [ ] `member-dashboard` returns 401 without JWT (no `?email=` fallback)
- [ ] `member-dashboard` returns data with valid JWT
- [ ] `onboarding` returns 401 from non-whitelisted origin
- [ ] `onboarding` works from `www.vyvehealth.co.uk/welcome`
- [ ] `send-email` returns 401 without service role key
- [ ] `employer-dashboard` returns 401 without API key
- [ ] Portal pages load correctly (dashboard, habits, workouts, nutrition, checkin)
- [ ] Wellbeing check-in submits and returns AI recommendations
- [ ] Activity logging works (log-activity)
- [ ] Session chat still works
- [ ] Leaderboard loads
- [ ] Settings page loads and saves changes
- [ ] New onboarding works end-to-end (Stripe → form → portal)

---

*Remediation plan created 11 April 2026. All fixes are self-contained and can be implemented independently in order of priority.*
