
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TEST_PHONE = "DUMMY_TEST_PHONE";
const TEST_KEY = "REPLACE_WITH_RANDOM_SECRET";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
        }

          if (req.headers.get("x-test-key") !== TEST_KEY) {
              return Response.json({ error: "Unauthorized" }, { status: 401 });
                }

                  const apiKey = Deno.env.get("OTPY_API_KEY");
                    if (!apiKey) {
                        return Response.json({ error: "OTPY_API_KEY missing" }, { status: 500 });
                          }

                            try {
                                const body = await req.json();
                                    const phone = typeof body.phone === "string" ? body.phone : "";
                                        const code = typeof body.code === "string" ? body.code.trim() : "";

                                            if (phone !== TEST_PHONE) {
                                                  return Response.json({ error: "Phone not allowed" }, { status: 403 });
                                                      }

                                                          if (!/^\d{4,8}$/.test(code)) {
                                                                return Response.json({ error: "Invalid code format" }, { status: 400 });
                                                                    }

                                                                        const response = await fetch("https://api.otpy.ir/v1/otp/verify", {
                                                                              method: "POST",
                                                                                    headers: {
                                                                                            "Authorization": `Bearer ${apiKey}`,
                                                                                                    "Content-Type": "application/json"
                                                                                                          },
                                                                                                                body: JSON.stringify({ phone, code })
                                                                                                                    });

                                                                                                                        const result = await response.json();
                                                                                                                            const verified = response.ok && result.verified === true;

                                                                                                                                return Response.json({
                                                                                                                                      provider_http_status: response.status,
                                                                                                                                            verified
                                                                                                                                                });
                                                                                                                                                  } catch {
                                                                                                                                                      return Response.json({ error: "Request failed" }, { status: 500 });
                                                                                                                                                        }
                                                                                                                                                        });
                                                                                                                                                        