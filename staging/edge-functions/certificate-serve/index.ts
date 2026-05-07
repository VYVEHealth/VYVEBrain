// VYVE Health — Certificate Serve v24
// RETIRED: Returns 410 Gone + redirects to certificates library
// Old Brevo email links still point here, so this provides graceful degradation
Deno.serve(async (req)=>{
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
  };
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  // Old certificate links redirect to the main certificates library
  const libraryUrl = "https://online.vyvehealth.co.uk/certificates.html";
  return new Response(`The certificate system has been updated. Please visit your certificate library: ${libraryUrl}`, {
    status: 410,
    headers: {
      ...corsHeaders,
      "Location": libraryUrl,
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache"
    }
  });
});
