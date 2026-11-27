# SISE Production Completeness Audit

**Audit date:** 2026-11-22  
**Canonical repository:** `skinfahbc/sise-storefront`  
**Production Supabase project:** `vwprdviufqukdvcroynt`  
**Scope:** Read-only inventory of the connected production project and the current integration branch. This document does not authorize or perform deployment, migration replay, or production changes.

## Canonical-source objective

The `sise-storefront` repository is intended to become the sole maintained source of truth for the SISE storefront and its supporting infrastructure. The legacy `kifara-shop` repository may be consulted for historical recovery, but production must not depend on it.

A repository is not considered a complete rebuild source until its application code, Edge Functions, database schema and migration history, configuration, required secrets, storage policies/buckets, backup and restore procedures, and operational documentation are represented and validated.

## Current repository / PR state

- Integration branch: `integration/kifara-security-backup`
- Review PR: [#66](https://github.com/skinfahbc/sise-storefront/pull/66)
- PR state at audit: open, draft, not merged.
- Production deploys and SQL migrations were not performed as part of this audit.

## Production Edge Functions inventory

The connected Supabase project currently reports six active functions:

| Function | Live version | Current classification |
|---|---:|---|
| `sise-otpy-auth` | 8 | Production application function; source is tracked in this repository branch |
| `sise-ai-chat` | 26 | Production application function; source is tracked in this repository branch |
| `sise-otpy-check` | 1 | Diagnostic; not part of the storefront's normal runtime path |
| `sise-otpy-send-test` | 1 | Test-only |
| `sise-otpy-verify-test` | 1 | Test-only |
| `sise-ip-diagnostic` | 5 | Diagnostic; not part of the storefront's normal runtime path |

The four diagnostic/test functions are intentionally not treated as production application dependencies. Before claiming a complete operational mirror, their purpose, owner, retention policy, and whether they should be disabled/deleted must be reviewed separately. Do not copy test credentials or diagnostic-only endpoints into production application code.

The tracked OTP source substitutes the production hardcoded administrator email with the environment variable `SISE_ADMIN_EMAIL`. Before any future redeployment of this source, confirm that this secret is configured in the target project. The live function was not changed by this audit.

## Production database migration inventory

The connected database reports these 17 applied migration versions:

| Applied version | Applied name | Repository evidence | Required treatment |
|---|---|---|---|
| `20261111122719` | `sise_security_hardening` | No matching SQL file found | Recover exact source or create a clearly labelled, reviewed schema-recovery record |
| `20261112111637` | `sise_secure_checkout` | Historical Kifara snapshot exists under a different version | Compare SQL and semantics; do not replay |
| `20261112113300` | `sise_lockdown_direct_orders` | Historical Kifara snapshot exists under a different version | Compare SQL and semantics; do not replay |
| `20261112113842` | `sise_admin_chat_storage_hardening` | Historical Kifara snapshot exists under a different version | Compare SQL and semantics; do not replay |
| `20261112114837` | `sise_chat_rate_limit` | Historical Kifara snapshot exists under a different version | Compare SQL and semantics; do not replay |
| `20261113083642` | `sise_public_api_grants_hardening` | Matching versioned SQL exists | Verify exact SQL against deployed behavior |
| `20261114120423` | `sise_private_customer_admin_chat` | No matching SQL file found | Recover exact source or create a clearly labelled, reviewed schema-recovery record |
| `20261114125326` | `add_sise_ai_assistant` | Similar file exists with version `202611140001` | Compare SQL exactly; version mismatch means it is not yet confirmed |
| `20261114162349` | `separate_ai_and_management_chats` | No matching SQL file found | Recover exact source or create a clearly labelled, reviewed schema-recovery record |
| `20261114162514` | `remove_legacy_chat_rpc_overloads` | No matching SQL file found | Recover exact source or create a clearly labelled, reviewed schema-recovery record |
| `20261114162602` | `reload_postgrest_chat_schema` | No matching SQL file found | Recover exact source or create a clearly labelled, reviewed schema-recovery record |
| `20261114205854` | `customer_email_auth_private_chat` | No matching SQL file found | Recover exact source or create a clearly labelled, reviewed schema-recovery record |
| `20261116105016` | `sise_otpy_rate_limit` | No matching SQL file found | Recover exact source or create a clearly labelled, reviewed schema-recovery record |
| `20261116105203` | `sise_otpy_ip_rate_limit` | No matching SQL file found | Recover exact source or create a clearly labelled, reviewed schema-recovery record |
| `20261116105327` | `remove_old_sise_otp_limit_rpc` | No matching SQL file found | Recover exact source or create a clearly labelled, reviewed schema-recovery record |
| `20261119073429` | `sise_chat_reactions_read_receipts` | Matching versioned SQL exists | Verify exact SQL against deployed behavior |
| `20261119073816` | `sise_chat_private_rpc_wrappers` | Matching versioned SQL exists | Verify exact SQL against deployed behavior |

### Migration reconciliation summary

- 3 applied migrations have an exact versioned repository filename.
- 4 historical Kifara SQL snapshots exist, but their filenames/versions differ from production migration history. They remain archived and must not be copied into active migrations or replayed without an explicit equivalence review.
- 1 AI migration has a likely corresponding file but a different version; equivalence is unverified.
- 9 applied production migrations have no matching SQL source currently identified in the repository tree/history inspected.

**Important:** A migration marked “missing” is not permission to invent a replacement and label it as the original migration. If its original SQL cannot be recovered, reconstruct the current schema in a separate, clearly named baseline/recovery artifact, document that it is a snapshot rather than the historical migration, and validate it in an isolated database before considering it canonical.

## Live schema inventory (high-level)

The connected project currently reports these application tables:

- `public.site`
- `public.orders`
- `public.story_comments`
- `public.chat_messages`
- `public.stock`
- `public.stock_notify`
- `public.draw_entries`
- `public.pm`
- `public.pm_accounts`
- `public.chat_reactions`
- `public.chat_reads`
- `private.api_rate_limits`
- `private.sise_otp_send_limits`

This is a table inventory, not yet a complete schema dump. A full rebuild source must also capture function definitions and grants, RLS policies, triggers, indexes, views, sequences, enum/types, extensions, storage buckets and object policies, Auth configuration, and relevant project settings.

## Security finding requiring review

The connected Supabase table inspection returned a **critical RLS-disabled advisory** for `private.api_rate_limits`. Follow-up read-only privilege checks showed that `anon`, `authenticated`, and `service_role` have no direct table privileges and cannot execute `private.consume_rate_limit`; the `postgres` owner has the expected privileges. This reduces evidence of direct API exposure, but RLS remains a defense-in-depth gap. Do not enable it blindly; first test the owner-executed rate-limit function and all dependent RPCs in isolation. Additional advisor findings include public/authenticated execution of several SECURITY DEFINER RPCs (requiring endpoint-by-endpoint authorization review), RLS-enabled tables with no policies (`public.pm_accounts` and `private.sise_otp_send_limits`), and disabled leaked-password protection. Details are recorded in [the read-only schema and security inventory](PRODUCTION-READONLY-SCHEMA-INVENTORY.md). No remediation was applied.

## Backup and disaster-recovery status

The integration branch contains encrypted database and Auth/Storage backup workflows and isolated database restore tests. CI success is not equivalent to a successful production backup or a full disaster-recovery exercise.

Still to verify operationally:

1. Required GitHub Actions secrets are configured.
2. A real encrypted database backup completes and can be decrypted.
3. Auth and Storage export completes and its artifact can be decrypted.
4. Database restore succeeds in an isolated target.
5. Auth users and Storage objects can be restored or the documented limitations are accepted.
6. A full recovery runbook is tested without touching production.

The current Auth export intentionally excludes passwords/password hashes, active sessions, refresh tokens, and MFA secrets. User password resets or invitations may be required after recovery.

## Completion gates

Do not mark SISE as the sole complete source until all of these are true:

- [ ] Every production application page and asset is tracked.
- [ ] Every production Edge Function dependency is tracked with its config and required secrets documented.
- [ ] All 17 applied migrations are reconciled to exact source or explicitly documented recovery snapshots.
- [ ] A clean isolated database can be built from the repository without reading Kifara.
- [ ] Database functions, policies, triggers, indexes, views, types, extensions, and grants are included.
- [ ] Storage buckets, policies, and required non-secret configuration are documented.
- [ ] Backup encryption and a complete restore path are tested.
- [ ] CI validates the clean rebuild and application integration.
- [ ] The live site is not changed until the user separately approves deployment.

## Safety record

This audit used read-only repository and Supabase inventory operations. No production SQL, migration, Edge Function deployment, site deployment, or live data mutation was performed.


## Follow-up verification — 2026-11-22

- PR #66 head commit `b56fe7f59ab65248d232d2fe44d9435a1af31cb4` has completed `syntax`, both `validate` checks, `SISE free validation`, and `Validate SISE static pages` successfully. This is CI/static validation only, not a backup or restore proof.
- Read-only catalog inspection captured application table columns, RLS states, policies, selected indexes, application triggers, Storage buckets and policies, PM RPC definitions, and relevant grants. See [PRODUCTION-READONLY-SCHEMA-INVENTORY.md](PRODUCTION-READONLY-SCHEMA-INVENTORY.md).
- Kifara migration-path history was inspected. It contains only the four already archived historical snapshots and the grants-hardening source. It did not yield exact source for the other nine missing production migrations.
- The AI assistant SQL file is not yet confirmed equivalent to production: its version differs, it contains a legacy two-argument `pm_list` definition, while production has a channel-aware three-argument function and `pm.channel`. Later channel-separation and overload-removal migrations must be reconciled before any baseline is considered rebuild-ready.

This follow-up was read-only against production. No migration, DDL, RLS change, function change, deployment, or live-data mutation was performed.
