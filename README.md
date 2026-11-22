# SISE Storefront

This repository is the **single canonical source of truth** for the SISE storefront and its maintained application infrastructure.

- Production storefront: https://sisestore.ir
- Canonical repository: https://github.com/skinfahbc/sise-storefront
- Supabase project reference: `vwprdviufqukdvcroynt`
- Integration/recovery review: [PR #66](https://github.com/skinfahbc/sise-storefront/pull/66)

## Repository ownership

| Area | Canonical location |
|---|---|
| Customer storefront | `index.html` |
| Admin application | `admin.html` |
| Product landing pages | `products/*/index.html` |
| Product SEO generation | `scripts/generate-product-seo.mjs` |
| Supabase Edge Functions | `supabase/functions/*` |
| Active, verified migration sources | `supabase/migrations/*` |
| Recovery evidence and production inventory | `docs/*` |
| Backup and restore automation | `.github/workflows/*`, `.github/scripts/*` |
| Security and operations | `SECURITY.md`, `BACKUP.md` |

## Legacy Kifara repository

`skinfahbc/kifara-shop` is a historical recovery source only. It is not a build input, deployment source, submodule, runtime dependency, or second place to maintain SISE.

The old Kifara frontend files (`index.html`, `admin.html`, `sise-index.html`, `src/`, `build.sh`, and its `CNAME`) are deliberately not copied over the current SISE frontend. They are a divergent application line and must not overwrite the current storefront.

Historical SQL files recovered from Kifara are kept under `docs/archive/kifara-applied-migrations/`; they are evidence only, not active migrations and must not be replayed.

## Production backend

The connected Supabase project currently has two production application Edge Functions tracked here:

- `sise-ai-chat`
- `sise-otpy-auth`

The project also has diagnostic/test functions. They are not storefront runtime dependencies and are intentionally excluded from the deployable application source until their ownership, retention, and removal decisions are reviewed. See [the production completeness audit](docs/PRODUCTION-COMPLETENESS-AUDIT.md).

## Important migration warning

The production database reports 17 applied migrations. The repository currently has exact-version sources for only part of that history. Several original SQL files were not recoverable from either repository's inspected migration history. Do not invent historical migration files, rename snapshots to match production versions, or replay archived SQL.

The exact migration ledger and recovery requirements are documented in [the production completeness audit](docs/PRODUCTION-COMPLETENESS-AUDIT.md). A clean database rebuild is **not yet certified**.

## Safe workflow

1. Make and review changes in a feature/recovery branch.
2. Run repository validation and isolated database tests.
3. Reconcile any schema/function/policy changes against the read-only production inventory.
4. Verify encrypted backup and isolated restore before calling recovery complete.
5. Merge only after explicit approval.
6. Deploy the site or Supabase changes only after separate explicit approval.

No production migration, database mutation, Edge Function deployment, or site deployment is authorized by this README.
