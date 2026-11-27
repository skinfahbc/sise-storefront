import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const OTPY_API_KEY = Deno.env.get("OTPY_API_KEY")!;
const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
const publishableKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
const ADMIN_KEY = secretKeys ? JSON.parse(secretKeys).default : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_KEY = publishableKeys ? JSON.parse(publishableKeys).default : Deno.env.get("SUPABASE_ANON_KEY")!;
const ADMIN_EMAIL = (Deno.env.get("SISE_ADMIN_EMAIL") || "").trim().toLowerCase();
const ALLOWED_ORIGINS = new Set(["https://sisestore.ir", "https://www.sisestore.ir"]);

const json = (body: unknown, status = 200, origin = "https://sisestore.ir") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    },
  });

function normalizePhone(input: unknown) {
  let s = String(input ?? "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[\s()-]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  if (!/^09\d{9}$/.test(s)) throw new Error("شماره موبایل باید به شکل 09xxxxxxxxx باشد");
  return { local: s, e164: "+98" + s.slice(1), digits: s.slice(1) };
}

async function api(path: string, key: string, token: string, method = "GET", body?: unknown) {
  const r = await fetch(SUPABASE_URL + path, {
    method,
    headers: { apikey: key, Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await r.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!r.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || "خطای سرویس احراز هویت";
    throw new Error(String(message));
  }
  return data;
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function adminUsersByPhone(e164: string) {
  for (let page = 1; page <= 100; page++) {
    const data = await api("/auth/v1/admin/users?page=" + page + "&per_page=1000", ADMIN_KEY, ADMIN_KEY);
    const users = Array.isArray(data?.users) ? data.users : [];
    const found = users.find((u: any) => u.phone === e164);
    if (found) return found;
    if (users.length < 1000) return null;
  }
  throw new Error("تعداد حساب‌ها برای جست‌وجوی امن بیش از حد مجاز است");
}

async function sendOtp(phone: string) {
  const r = await fetch("https://api.otpy.ir/v1/otp/send", {
    method: "POST",
    headers: { Authorization: "Bearer " + OTPY_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!r.ok) throw new Error("ارسال کد توسط سرویس پیامک انجام نشد (کد " + r.status + ")");
}

async function verifyOtp(phone: string, code: string) {
  const r = await fetch("https://api.otpy.ir/v1/otp/verify", {
    method: "POST",
    headers: { Authorization: "Bearer " + OTPY_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  let data: any = {};
  try { data = await r.json(); } catch { /* invalid provider payload */ }
  return r.ok && data?.verified === true;
}

async function issueSessionForUser(user: any) {
  let email = user.email;
  if (!email) {
    email = "phone-" + String(user.phone || "").replace(/\D/g, "") + "@phone.sisestore.invalid";
    await api("/auth/v1/admin/users/" + user.id, ADMIN_KEY, ADMIN_KEY, "PUT", { email, email_confirm: true });
  }
  const link = await api("/auth/v1/admin/generate_link", ADMIN_KEY, ADMIN_KEY, "POST", { type: "magiclink", email });
  const tokenHash = link?.hashed_token || link?.properties?.hashed_token;
  if (!tokenHash) throw new Error("توکن نشست از Supabase دریافت نشد");
  const session = await api("/auth/v1/verify", PUBLIC_KEY, PUBLIC_KEY, "POST", { token_hash: tokenHash, type: "magiclink" });
  if (!session?.access_token || !session?.refresh_token || !session?.user) {
    throw new Error("Supabase نشست ورود معتبری برنگرداند");
  }
  return session;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const corsOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://sisestore.ir";
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    },
  });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsOrigin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, corsOrigin);
  if (!OTPY_API_KEY || !ADMIN_KEY || !PUBLIC_KEY || !ADMIN_EMAIL) return json({ error: "Auth service is not configured" }, 500, corsOrigin);

  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "list_users") {
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Bearer ")) return json({ error: "دسترسی مدیر لازم است." }, 401, corsOrigin);
      let admin: any;
      try {
        admin = await api("/auth/v1/user", PUBLIC_KEY, authHeader.slice(7));
      } catch {
        return json({ error: "نشست مدیر معتبر نیست؛ دوباره وارد پنل شوید." }, 401, corsOrigin);
      }
      if (String(admin?.email || "").toLowerCase() !== ADMIN_EMAIL) {
        return json({ error: "این حساب اجازه مشاهده فهرست کاربران را ندارد." }, 403, corsOrigin);
      }
      const all: any[] = [];
      for (let page = 1; page <= 50; page++) {
        const data = await api("/auth/v1/admin/users?page=" + page + "&per_page=1000", ADMIN_KEY, ADMIN_KEY);
        const batch = Array.isArray(data?.users) ? data.users : [];
        all.push(...batch);
        if (batch.length < 1000) break;
      }
      const [accountLinks, privateMessages] = await Promise.all([
        api("/rest/v1/pm_accounts?select=auth_user_id,pm_uid", ADMIN_KEY, ADMIN_KEY),
        api("/rest/v1/pm?select=id,uid,name,text,image,from_admin,ai_generated,needs_admin,channel,created_at&order=id.asc&limit=10000", ADMIN_KEY, ADMIN_KEY),
      ]);
      const users = all.map((u: any) => ({
        id: u.id, email: u.email || "", phone: u.phone || "",
        phone_confirmed_at: u.phone_confirmed_at || null,
        email_confirmed_at: u.email_confirmed_at || null,
        created_at: u.created_at || null, last_sign_in_at: u.last_sign_in_at || null,
        user_metadata: u.user_metadata || {},
        app_metadata: { providers: u.app_metadata?.providers || (u.app_metadata?.provider ? [u.app_metadata.provider] : []) },
      }));
      return json({
        ok: true, count: users.length, users,
        pm_accounts: Array.isArray(accountLinks) ? accountLinks : [],
        pm_messages: Array.isArray(privateMessages) ? privateMessages : [],
      }, 200, corsOrigin);
    }

    if (action === "update_user" || action === "delete_user") {
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Bearer ")) return json({ error: "دسترسی مدیر لازم است." }, 401, corsOrigin);
      let admin: any;
      try {
        admin = await api("/auth/v1/user", PUBLIC_KEY, authHeader.slice(7));
      } catch {
        return json({ error: "نشست مدیر معتبر نیست؛ دوباره وارد پنل شوید." }, 401, corsOrigin);
      }
      if (String(admin?.email || "").toLowerCase() !== ADMIN_EMAIL) {
        return json({ error: "این حساب اجازه مدیریت کاربران را ندارد." }, 403, corsOrigin);
      }
      const userId = String(body?.user_id || "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
        return json({ error: "شناسه کاربر معتبر نیست." }, 400, corsOrigin);
      }
      const target = await api("/auth/v1/admin/users/" + userId, ADMIN_KEY, ADMIN_KEY);
      if (!target?.id) return json({ error: "کاربر پیدا نشد." }, 404, corsOrigin);
      if (target.id === admin.id || String(target.email || "").toLowerCase() === ADMIN_EMAIL) {
        return json({ error: "حساب اصلی مدیر قابل ویرایش یا حذف نیست." }, 403, corsOrigin);
      }
      if (action === "delete_user") {
        await api("/auth/v1/admin/users/" + userId, ADMIN_KEY, ADMIN_KEY, "DELETE");
        return json({ ok: true, deleted: true, user_id: userId }, 200, corsOrigin);
      }
      const attrs: any = {};
      if (typeof body?.name === "string") {
        attrs.user_metadata = { ...(target.user_metadata || {}), full_name: body.name.trim() };
      }
      if (typeof body?.email === "string" && body.email.trim() && body.email.trim() !== (target.email || "")) {
        const email = body.email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "فرمت ایمیل معتبر نیست." }, 400, corsOrigin);
        attrs.email = email;
        attrs.email_confirm = false;
      }
      if (typeof body?.phone === "string" && body.phone.trim() && body.phone.trim() !== (target.phone || "")) {
        const phone = normalizePhone(body.phone).e164;
        attrs.phone = phone;
        attrs.phone_confirm = false;
      }
      if (!Object.keys(attrs).length) return json({ ok: true, unchanged: true }, 200, corsOrigin);
      const updated = await api("/auth/v1/admin/users/" + userId, ADMIN_KEY, ADMIN_KEY, "PUT", attrs);
      return json({ ok: true, user: updated?.user || updated }, 200, corsOrigin);
    }

    const phone = normalizePhone(body?.phone);

    if (action === "send") {
      const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const [phoneHash, ipHash] = await Promise.all([sha256(phone.local), sha256(ip)]);
      const limited = await api("/rest/v1/rpc/sise_otp_take_send", ADMIN_KEY, ADMIN_KEY, "POST", {
        p_phone_hash: phoneHash,
        p_ip_hash: ipHash,
      });
      if (limited !== true) return json({ error: "برای ارسال دوباره کد باید ۶۰ ثانیه صبر کنید؛ سقف ۵ پیامک برای هر شماره و ۲۰ پیامک برای هر اتصال در روز است." }, 429, corsOrigin);
      await sendOtp(phone.local);
      return json({ ok: true, cooldown: 60 }, 200, corsOrigin);
    }

    if (action === "verify") {
      const code = String(body?.code ?? "").trim();
      if (!/^\d{4,8}$/.test(code)) return json({ error: "کد تأیید معتبر نیست." }, 400, corsOrigin);
      if (!await verifyOtp(phone.local, code)) return json({ error: "کد تأیید اشتباه یا منقضی شده است." }, 400, corsOrigin);

      const authHeader = req.headers.get("Authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        const accessToken = authHeader.slice(7);
        let currentUser: any;
        try {
          currentUser = await api("/auth/v1/user", PUBLIC_KEY, accessToken);
        } catch {
          return json({ error: "نشست فعلی معتبر نیست؛ دوباره با گوگل وارد شوید." }, 401, corsOrigin);
        }
        const owner = await adminUsersByPhone(phone.e164);
        if (owner && owner.id !== currentUser.id) return json({ error: "این شماره قبلاً به حساب دیگری متصل شده است." }, 409, corsOrigin);
        const updated = await api("/auth/v1/admin/users/" + currentUser.id, ADMIN_KEY, ADMIN_KEY, "PUT", {
          phone: phone.e164,
          phone_confirm: true,
        });
        return json({ ok: true, linked: true, user: updated?.user || updated }, 200, corsOrigin);
      }

      let user = await adminUsersByPhone(phone.e164);
      if (!user) {
        const email = "phone-" + phone.digits + "@phone.sisestore.invalid";
        const passwordBytes = crypto.getRandomValues(new Uint8Array(32));
        const password = Array.from(passwordBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
        const created = await api("/auth/v1/admin/users", ADMIN_KEY, ADMIN_KEY, "POST", {
          phone: phone.e164, phone_confirm: true, email, email_confirm: true, password,
          user_metadata: { phone_login: true, full_name: "مشتری" },
        });
        user = created?.user || created;
      }
      const session = await issueSessionForUser(user);
      return json({
        ok: true, linked: false, access_token: session.access_token,
        refresh_token: session.refresh_token, expires_in: session.expires_in, user: session.user,
      }, 200, corsOrigin);
    }

    return json({ error: "عملیات نامعتبر است." }, 400, corsOrigin);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "خطای داخلی سرویس" }, 500, corsOrigin);
  }
});