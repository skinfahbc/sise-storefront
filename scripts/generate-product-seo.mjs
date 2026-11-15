// Generate static, crawlable product pages and sitemap.xml from the public SISE catalogue.
// Run with SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY environment variables.
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const base = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!base || !key) throw new Error("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.");
const response = await fetch(base + "/rest/v1/site?id=eq.main&select=data", {
  headers: { apikey: key, Authorization: "Bearer " + key }
});
if (!response.ok) throw new Error("Supabase catalogue request failed: HTTP " + response.status);
const rows = await response.json();
const data = rows[0] && rows[0].data;
if (!Array.isArray(data && data.products) || !Array.isArray(data.categories)) {
  throw new Error("The public site row does not contain products and categories.");
}
const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[c]));
const slug = value => value.normalize("NFC").replace(/[«»"“”،,؛:!?؟()[\]{}]/g, "")
  .trim().replace(/\s+/g, "-").replace(/-+/g, "-");
const clean = value => String(value || "").replace(/[\u{1F300}-\u{1FAFF}]/gu, "").replace(/\s+/g, " ").trim();
const money = value => Number(value || 0).toLocaleString("en-US");
const urls = [];
await rm("products", { recursive: true, force: true });

for (const p of data.products) {
  if (!p || !p.id || !p.title) continue;
  const category = (data.categories.find(c => c.id === p.cat) || {}).name || "کیف زنانه";
  const folder = slug(p.title) + "-" + p.id;
  const pageUrl = "https://sisestore.ir/products/" + folder + "/";
  const images = (p.images || []).filter(url => /^https:\/\//.test(url));
  const image = images[0] || "";
  const description = clean(p.desc).slice(0, 260) || (p.title + " از فروشگاه SISE.");
  const colors = (p.colors || []).map(c => c.name).filter(Boolean);
  const inStock = Number(p.stock || 0) > 0;
  const schema = {
    "@context":"https://schema.org", "@type":"Product", name:p.title,
    description:description, image:images, sku:p.id,
    brand:{"@type":"Brand",name:"SISE"}, category:category,
    ...(colors.length ? {color:colors} : {}),
    offers:{"@type":"Offer",url:pageUrl,priceCurrency:"IRR",
      price:String(Math.round(Number(p.price || 0) * 10)),
      availability:inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition:"https://schema.org/NewCondition",
      seller:{"@type":"Organization",name:"SISE"}}
  };
  const jsonLd = JSON.stringify(schema).replace(/</g, "\\u003c");
  const html = '<!doctype html><html lang="fa" dir="rtl"><head>' +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(p.title) + ' | خرید آنلاین از SISE</title>' +
    '<meta name="description" content="' + esc(description) + '">' +
    '<meta name="robots" content="index,follow"><link rel="canonical" href="' + esc(pageUrl) + '">' +
    '<meta property="og:type" content="product"><meta property="og:site_name" content="SISE">' +
    '<meta property="og:title" content="' + esc(p.title) + ' | SISE">' +
    '<meta property="og:description" content="' + esc(description) + '">' +
    '<meta property="og:url" content="' + esc(pageUrl) + '">' +
    (image ? '<meta property="og:image" content="' + esc(image) + '">' : "") +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + jsonLd + '</scr' + 'ipt>' +
    '<style>*{box-sizing:border-box}body{margin:0;background:#fbf8f3;color:#27221d;font:16px/1.9 Tahoma,Arial,sans-serif}' +
    'main{max-width:940px;margin:32px auto;padding:22px}.brand{color:#b88a51;font-weight:bold;text-decoration:none}' +
    'article{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:24px;align-items:start}' +
    '.photo{background:#f1ebe2;border-radius:22px;overflow:hidden}.photo img{width:100%;height:auto;display:block;object-fit:contain}' +
    'h1{font-size:clamp(24px,4vw,36px)}.muted{color:#766e65}.price{font-size:24px;color:#76512e;font-weight:bold}' +
    '.old{text-decoration:line-through;color:#999;margin-right:8px}.pill,.colors span{display:inline-block;border:1px solid #e6ded3;border-radius:22px;padding:2px 10px;margin:4px}' +
    '.cta{display:inline-block;background:#2c251f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;margin-top:16px}' +
    '@media(max-width:650px){article{grid-template-columns:1fr}main{padding:16px}}</style></head><body><main>' +
    '<a class="brand" href="https://sisestore.ir/">SISE</a><article>' +
    (image ? '<div class="photo"><img src="' + esc(image) + '" alt="' + esc(p.title) + '"></div>' : "") +
    '<section><div class="muted">' + esc(category) + '</div>' +
    (p.badge ? '<span class="pill">' + esc(p.badge) + '</span>' : "") +
    '<h1>' + esc(p.title) + '</h1><p class="muted">' + esc(description) + '</p>' +
    '<p class="price">' + money(p.price) + ' تومان ' +
    (Number(p.oldPrice) > Number(p.price) ? '<span class="old">' + money(p.oldPrice) + ' تومان</span>' : "") + '</p>' +
    '<p>' + (inStock ? "موجود در فروشگاه" : "در حال حاضر ناموجود") + '</p>' +
    '<div class="colors">' + colors.map(c => '<span>' + esc(c) + '</span>').join("") + '</div>' +
    '<a class="cta" href="https://sisestore.ir/?product=' + encodeURIComponent(p.id) + '">مشاهده و خرید این کیف در SISE</a>' +
    '</section></article><p class="muted">© SISE · ' + esc((data.store || {}).tagline || "کیف‌های دست‌دوز، اصیل و شیک") +
    '</p></main></body></html>';
  await mkdir(join("products", folder), { recursive: true });
  await writeFile(join("products", folder, "index.html"), html, "utf8");
  urls.push(pageUrl);
}
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  '  <url><loc>https://sisestore.ir/</loc></url>\n' +
  urls.map(url => "  <url><loc>" + url + "</loc></url>").join("\n") +
  '\n</urlset>\n';
await writeFile("sitemap.xml", sitemap, "utf8");
console.log("Generated " + urls.length + " product pages and sitemap.xml.");
