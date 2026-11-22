# SISE production source audit

**Audit date:** 2026-11-22  
**Canonical code repository:** `skinfahbc/sise-storefront`  
**Connected Supabase project:** `vwprdviufqukdvcroynt` (dashboard display name: Kifara)

This is a read-only source audit. No production database migration, Edge Function deployment, site deployment, or live-data change was performed.

## Findings

### 1. Edge Functions

The storefront's current `index.html` calls `sise-otpy-auth` and `sise-ai-chat`; `admin.html` calls `sise-otpy-auth`.

The connected Supabase project reported these production functions as active at audit time:

- `sise-otpy-auth`, deployed version 8.
- `sise-ai-chat`, deployed version 26.

The repository previously had no source for `sise-otpy-auth`. Its source has now been added under `supabase/functions/sise-otpy-auth/index.ts`.

The repository's former `sise-ai-chat/index.ts` did not match the deployed implementation: it used a different provider key and a different private-chat authentication/data flow. The source on this branch has been synchronized to the deployed implementation.

For public-repository safety, the admin account email embedded in the deployed OTP function has been replaced in the checked-in source with the `SISE_ADMIN_EMAIL` environment variable. Configure that secret before any future redeployment. No secret values were copied into GitHub.

Both deployed production functions currently have `verify_jwt=false`; they perform their own request validation. Preserve that setting unless the functions are redesigned and retested.

The project also listed `sise-otpy-check`, `sise-otpy-send-test`, `sise-otpy-verify-test`, and `sise-ip-diagnostic`. They are not called by the current storefront. The test endpoints contain test-only credentials/phone details, and the IP diagnostic currently returns HTTP 410; they were intentionally not copied.

### 2. Applied database migrations versus checked-in SQL

The connected database reports 17 applied migration-history entries. Comparing that history with the repository's `main` branch plus the Kifara integration branch gives the following source-coverage result:

| Database version | Database migration name | Repository source status |
|---|---|---|
| `20261111122719` | `sise_security_hardening` | No matching SQL file found |
| `20261112111637` | `sise_secure_checkout` | Related legacy snapshot archived under a different version |
| `20261112113300` | `sise_lockdown_direct_orders` | Related legacy snapshot archived under a different version |
| `20261112113842` | `sise_admin_chat_storage_hardening` | Related legacy snapshot archived under a different version |
| `20261112114837` | `sise_chat_rate_limit` | Related legacy snapshot archived under a different version |
| `20261113083642` | `sise_public_api_grants_hardening` | Matching migration file is included in the integration branch |
| `20261114120423` | `sise_private_customer_admin_chat` | No matching SQL file found |
| `20261114125326` | `add_sise_ai_assistant` | A similarly named file exists, but its filename version is `202611140001`; equivalence is not yet verified |
| `20261114162349` | `separate_ai_and_management_chats` | No matching SQL file found |
| `20261114162514` | `remove_legacy_chat_rpc_overloads` | No matching SQL file found |
| `20261114162602` | `reload_postgrest_chat_schema` | No matching SQL file found |
| `20261114205854` | `customer_email_auth_private_chat` | No matching SQL file found |
| `20261116105016` | `sise_otpy_rate_limit` | No matching SQL file found |
| `20261116105203` | `sise_otpy_ip_rate_limit` | No matching SQL file found |
| `20261116105327` | `remove_old_sise_otp_limit_rpc` | No matching SQL file found |
| `20261119073429` | `sise_chat_reactions_read_receipts` | Matching migration file exists |
| `20261119073816` | `sise_chat_private_rpc_wrappers` | Matching migration file exists |

**Important:** the four archived Kifara SQL snapshots are deliberately not active migrations. Their filenames do not match the applied versions recorded by Supabase. Do not move them into the active migrations directory or run them again without a careful schema/history reconciliation.

The similarly named AI-assistant migration must also not be renamed or reapplied until its SQL is compared with the applied database change. A filename mismatch alone is not proof that the SQL is missing or different.

### 3. What this means for recovery

The repository now has the two production Edge Function source files used by the current storefront, but the database migration history is not yet fully represented by matching SQL files. Therefore this repository should **not yet be described as a complete, one-command rebuild of the entire production system**.

The next safe database-source task is to recover or reconstruct the nine missing migration definitions and verify the four archived snapshots plus the AI-assistant migration against the live schema/history. Any reconstructed SQL should first be placed in an archive/recovery area for review—not in the active migrations folder—and must not be replayed against production.

## Change scope and safety

- Changes are on `integration/kifara-security-backup` for PR #66.
- No merge was performed.
- No Supabase migration was applied.
- No Edge Function was deployed.
- No production data was modified.
