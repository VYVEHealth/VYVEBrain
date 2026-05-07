import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
serve(async ()=>{
  const sb = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false
    }
  });
  // Find anyone called Stuart
  const { data, error } = await sb.from('members').select('email, first_name, last_name, company').ilike('first_name', 'stuart');
  return new Response(JSON.stringify({
    data,
    error
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});
