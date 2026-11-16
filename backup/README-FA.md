# بسته پشتیبان آفلاین SISE
تهیه: 2026-11-16 | مخزن: https://github.com/skinfahbc/sise-storefront | Supabase project: vwprdviufqukdvcroynt | دامنه: https://sisestore.ir

## نقشه سایت و فایل‌ها
- index.html: فروشگاه اصلی و رابط مشتری.
- admin.html: پنل مدیریت.
- 404.html: صفحه خطای اختصاصی.
- products/*/index.html: صفحات اختصاصی محصولات.
- favicon.svg: آیکن.
- CNAME: دامنه سفارشی.
- robots.txt و sitemap.xml: SEO.
- scripts/generate-product-seo.mjs و .github/workflows: ساخت/همگام‌سازی SEO.
- supabase/functions: تابع AI ذخیره‌شده در مخزن اصلی.
- backup/edge-functions: کدهای فعلی Edge Functions از Supabase.

## معماری فعلی
Frontend: HTML/CSS/JavaScript استاتیک.
DB: Supabase PostgreSQL.
Auth: Supabase Auth با Google و OTP پیامکی.
Server: Supabase Edge Functions (Deno).
Storage buckets: chat و media.
SMS provider: OTPy.
AI provider: OpenRouter.
میزبانی دقیق باید در DNS و پنل میزبان تأیید شود؛ CNAME به تنهایی نوع هاست را ثابت نمی‌کند.

## انتقال به هاست ایرانی
1. ZIP همین شاخه را دانلود و آفلاین نگهداری کن.
2. فایل‌های ریشه را در public_html یا document root قرار بده؛ ساختار پوشه products را حفظ کن.
3. اگر هاست فقط استاتیک است، ظاهر سایت اجرا می‌شود اما دیتابیس/ورود/OTP/چت همچنان به Supabase فعلی وابسته‌اند.
4. برای استقلال کامل، PostgreSQL، Auth، Storage و توابع سرور باید به سرویس مقصد منتقل یا جایگزین شوند.
5. DNS دامنه را طبق مقادیر شرکت هاست به مقصد جدید تغییر بده و SSL را فعال کن.
6. مسیرهای /، /admin.html، /products/... و 404 را تست کن.
7. فقط پس از تست کامل خرید، موجودی، پیگیری، مدیریت، چت، ورود و تصاویر DNS را جابه‌جا کن.

## کلیدها و Secrets
در GitHub یا HTML عمومی قرار نده: SUPABASE_SERVICE_ROLE_KEY، کلید secret، OTPY_API_KEY، OPENROUTER_API_KEY.
متغیرهای مورد نیاز بسته به تابع: SUPABASE_URL، SUPABASE_ANON_KEY یا SUPABASE_PUBLISHABLE_KEY، SUPABASE_SERVICE_ROLE_KEY یا SUPABASE_SECRET_KEYS، OTPY_API_KEY، OPENROUTER_API_KEY، SISE_AI_ENABLED.
Google OAuth Client ID/Secret، Redirect URLs، دامنه‌های مجاز و SMTP باید در پنل سرویس مقصد تنظیم شوند. کلید service role فقط سمت سرور.

## دیتابیس و داده واقعی
backup/database/current-schema.sql snapshot ساختاری جدول‌ها، قیود، indexها، توابع، triggerها و RLS است؛ رکورد مشتریان در آن نیست. مقصد باید Supabase-compatible باشد و وابستگی به auth.users، extensions و schemaهای داخلی بررسی شود.
migrations-list.json فقط نام/نسخه ۱۵ migration ثبت‌شده است؛ همه فایل‌های تاریخی در مخزن فعلی نیستند.
داده‌هایی که باید جداگانه و رمزگذاری‌شده export/import شوند: public.site، orders، pm، pm_accounts، chat_messages، stock، stock_notify، story_comments، draw_entries، Auth users و فایل‌های bucketهای chat و media.
هرگز داده واقعی مشتریان را در مخزن عمومی GitHub قرار نده. از Database Backup/pg_dump و Storage export امن استفاده کن.

## ترتیب بازیابی
1. ساخت دیتابیس مقصد و Auth.
2. نصب extensionها و بازبینی SQL snapshot.
3. واردکردن داده‌های واقعی از نسخه پشتیبان امن.
4. ساخت bucketهای chat و media و انتقال فایل‌ها و policyها.
5. تنظیم secrets و deploy Edge Functions.
6. تنظیم URL و کلید عمومی در frontend.
7. آپلود فایل‌های سایت با حفظ پوشه‌ها.
8. اتصال دامنه و SSL.
9. تست کامل سفارش، موجودی، چت عمومی/خصوصی، پنل، OTP و تصاویر.

## هشدار
کدهای تست OTP در این بسته کلیدهای ثابتشان redacted شده و صرفاً برای مطالعه‌اند؛ برای سرویس عملیاتی deploy نکن. کلیدهای واقعی در فایل‌ها قرار داده نشده‌اند.
