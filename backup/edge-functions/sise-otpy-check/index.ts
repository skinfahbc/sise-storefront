import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CHECK_KEY = "REPLACE_WITH_RANDOM_SECRET";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  const url = new URL(req.url);
  if (url.searchParams.get("k") !== CHECK_KEY) return json({ error: "not_found" }, 404);

  const apiKey = Deno.env.get("OTPY_API_KEY");
  if (!apiKey) return json({ configured: false, error: "OTPY_API_KEY secret is missing" }, 503);

  try {
    const upstream = await fetch("https://api.otpy.ir/v1/usage", {
      method: "GET",
      headers: { Authorization: "Bearer " + apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    const raw = await upstream.text();
    let providerResponse: unknown = raw.slice(0, 3000);
    try { providerResponse = JSON.parse(raw); } catch { /* keep short text */ }
    return json({
      configured: true,
      provider_http_status: upstream.status,
      provider_response: providerResponse,
      checked_at: new Date().toISOString(),
      note: "Read-only OTPy API-key and connectivity check. No SMS was sent."
    });
  } catch (error) {
    return json({
      configured: true,
      error: "provider_connection_failed",
      detail: String(error).slice(0, 300),
      checked_at: new Date().toISOString(),
      note: "No SMS was sent."
    }, 502);
  }
});