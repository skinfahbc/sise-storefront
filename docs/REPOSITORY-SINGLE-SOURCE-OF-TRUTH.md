# SISE repository ownership and single-source-of-truth contract

**Status:** Canonical repository decision  
**Canonical repo:** `skinfahbc/sise-storefront`  
**Historical repo:** `skinfahbc/kifara-shop`  
**Production site:** https://sisestore.ir  
**Supabase project:** `vwprdviufqukdvcroynt`

## Decision

All ongoing SISE application development, release preparation, infrastructure source, recovery evidence, tests, and operational documentation belong in `sise-storefront`.

There must be one maintained repository, one review path, and one release source. Kifara is not a second production source and must not be required to build, test, deploy, or operate SISE.

## What is already in SISE

The canonical repository's default branch already contains the current storefront and admin application, product landing pages, SEO generation, site metadata, and the current static-site workflow.

The recovery branch in [PR #66](https://github.com/skinfahbc/sise-storefront/pull/66) adds the recovered SISE-specific backup/security material, OTP and AI application Edge Function source, migration evidence, checkout tests, and production audit documents.

## What is intentionally not copied from Kifara

The legacy Kifara frontend/build line is not the deployed SISE application and is deliberately excluded:

- `index.html`
- `admin.html`
- `sise-index.html`
- `src/`
- `build.sh`
- `CNAME`

Copying these files over the current SISE application would replace or mix a divergent frontend rather than consolidate the live SISE source.

The four recovered Kifara SQL files are stored under `docs/archive/kifara-applied-migrations/` because their timestamps do not match the live Supabase migration ledger. They are not active migrations.

## Remaining blockers before the repository is a certified full rebuild source

1. Recover or reconstruct (as a separately labelled baseline) the nine production migration sources that are absent from both inspected repository histories.
2. Verify the AI-assistant migration and its later channel-separation / legacy-overload-removal steps against the current database.
3. Complete the database baseline: relations, functions, grants, RLS policies, triggers, indexes, views, sequences, types, extensions, and required project configuration.
4. Capture Auth settings and Storage bucket/object policies in a reproducible recovery record.
5. Decide the lifecycle of the four active diagnostic/test Edge Functions; do not make them storefront runtime dependencies by default.
6. Run a real encrypted database + Auth + Storage backup and a complete isolated restore exercise.
7. Validate a clean rebuild using only this repository, with no reads from Kifara.

The current state is therefore **single-repository direction established, but full rebuild completeness not yet certified**.

## Safety boundary

This contract and PR are repository-only work. No production SQL, migration replay, RLS change, Edge Function deployment, website deployment, or live data mutation is authorized. Merge and production release remain separate approval gates.
