# SEO product pages preview

This branch adds crawlable static landing pages for the current SISE products.

## What is included
- One Persian, RTL HTML page per product under `/products/<product-name>-<id>/`.
- Canonical URLs, meta descriptions, Open Graph metadata, and Schema.org Product/Offer JSON-LD.
- A sitemap containing the homepage and all generated product URLs.
- The storefront accepts `/?product=<id>` and opens the matching existing product detail modal, so the landing-page purchase link returns to the live catalogue flow.
- `scripts/generate-product-seo.mjs` rebuilds product pages and sitemap from the public `site` row in Supabase.

## Regenerate after catalogue changes
Run from the repository root with Node.js 18 or newer:

```sh
SUPABASE_URL="https://vwprdviufqukdvcroynt.supabase.co" \
SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_PUBLISHABLE_KEY" \
node scripts/generate-product-seo.mjs
```

The publishable key is intended for public client use; never use a service-role or secret key here. The script only reads the public catalogue row and writes generated static HTML and `sitemap.xml`.

## Deployment
This is a preview branch only. Do not merge or publish until the storefront, product pages, and sitemap have been reviewed and approved.
