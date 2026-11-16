import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TEST_PHONE = "DUMMY_TEST_PHONE";
const TEST_KEY = "REPLACE_WITH_RANDOM_SECRET";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
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
                                    if (body.phone !== TEST_PHONE) {
                                          return Response.json({ error: "Phone not allowed" }, { status: 403 });
                                              }

                                                  const response = await fetch("https://api.otpy.ir/v1/otp/send", {
                                                        method: "POST",
                                                              headers: {
                                                                      "Authorization": `Bearer ${apiKey}`,
                                                                              "Content-Type": "application/json"
                                                                                    },
                                                                                          body: JSON.stringify({ phone: TEST_PHONE })
                                                                                              });

                                                                                                  const result = await response.text();
                                                                                                      return Response.json({
                                                                                                            provider_http_status: response.status,
                                                                                                                  provider_response: result
                                                                                                                      });
                                                                                                                        } catch {
                                                                                                                            return Response.json({ error: "Request failed" }, { status: 500 });
                                                                                                                              }
                                                                                                                              });