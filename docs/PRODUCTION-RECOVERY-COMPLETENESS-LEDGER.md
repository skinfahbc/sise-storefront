# SISE production recovery — verified completion ledger

**Last checked:** 2026-11-22  
**Canonical repository:** `skinfahbc/sise-storefront`  
**Production project ref:** `vwprdviufqukdvcroynt`  
**Working branch:** `integration/kifara-security-backup`  
**Pull request:** [#66](https://github.com/skinfahbc/sise-storefront/pull/66)

This ledger distinguishes repository work that has passed tests from production recovery tasks that still require credentials, source artifacts, an isolated Supabase target, or explicit approval. A green GitHub workflow is not evidence of a successful production backup or full platform restore.

## Verified complete in the repository branch

- [x] SISE is designated the sole maintained storefront repository; Kifara is historical evidence only.
- [x] Production application schema baseline captured through read-only catalog inspection at `supabase/baselines/production-schema-baseline.sql`.
- [x] Baseline includes app-owned `public`/`private` schema objects, constraints, RLS flags, sequences, indexes, functions, policies, triggers, and captured grants.
- [x] Administrator UUIDs in the public baseline are redacted fail-closed; restore requires deliberate substitution of the intended administrator UUID.
- [x] Baseline replay smoke-tested against disposable PostgreSQL 17 with minimal Supabase Auth stubs. This checks SQL structure, not equivalence with a full Supabase project.
- [x] Static-page validation and free validation passed on branch head `df525689715d1a10006d431a9efcbf78077d0e82` (runs [45011153585](https://github.com/skinfahbc/sise-storefront/actions/runs/45011153585) and [45011153570](https://github.com/skinfahbc/sise-storefront/actions/runs/45011153570)).
- [x] Supabase CLI backup workflow pinned to `v2.stable` to avoid the CLI v3 hosted-command default/flag transition until the workflow is deliberately migrated and tested.
- [x] Production migration ledger re-read: 17 applied entries.

## Production migration ledger reconciliation

The live ledger currently contains these 17 versions:

| Version | Ledger name | Repository evidence | Status |
|---|---|---|---|
| 20261111122719 | sise_security_hardening | No exact source found | **Missing original SQL** |
| 20261112111637 | sise_secure_checkout | Archived snapshot with different version | Historical only; not exact ledger source |
| 20261112113300 | sise_lockdown_direct_orders | Archived snapshot with different version | Historical only; not exact ledger source |
| 20261112113842 | sise_admin_chat_storage_hardening | Archived snapshot with different version | Historical only; not exact ledger source |
| 20261112114837 | sise_chat_rate_limit | Archived snapshot with different version | Historical only; not exact ledger source |
| 20261113083642 | sise_public_api_grants_hardening | Exact versioned migration in SISE | Present |
| 20261114120423 | sise_private_customer_admin_chat | No exact source found | **Missing original SQL** |
| 20261114125326 | add_sise_ai_assistant | Candidate file uses version 202611140001 and legacy two-argument `pm_list` | **Not proven equivalent** |
| 20261114162349 | separate_ai_and_management_chats | No exact source found | **Missing original SQL** |
| 20261114162514 | remove_legacy_chat_rpc_overloads | No exact source found | **Missing original SQL** |
| 20261114162602 | reload_postgrest_chat_schema | No exact source found | **Missing original SQL** |
| 20261114205854 | customer_email_auth_private_chat | No exact source found | **Missing original SQL** |
| 20261116105016 | sise_otpy_rate_limit | No exact source found | **Missing original SQL** |
| 20261116105203 | sise_otpy_ip_rate_limit | No exact source found | **Missing original SQL** |
| 20261116105327 | remove_old_sise_otp_limit_rpc | No exact source found | **Missing original SQL** |
| 20261119073429 | sise_chat_reactions_read_receipts | Exact versioned migration in SISE | Present |
| 20261119073816 | sise_chat_private_rpc_wrappers | Exact versioned migration in SISE | Present |

**Count reconciliation:** 17 live ledger entries = 3 exact versioned files + 4 archived timestamp-mismatched snapshots + 1 AI candidate with unproven equivalence + 9 unrecovered original SQL sources. Do not fabricate the nine originals or replay the four archived snapshots under different versions.

The AI candidate at `supabase/migrations/202611140001_add_sise_ai_assistant.sql` defines `pm_list(p_uid, p_tok)`; current Production exposes channel-aware `pm_list(p_uid, p_tok, p_channel)` and `public.pm.channel`. The candidate alone cannot represent the live applied migration. Recover the original migration or prove the complete sequence from trusted deployment artifacts before changing migration history.

## Current recovery / backup gaps

- [ ] Recover the nine original migration SQL files from trusted SQL-editor exports, deployment artifacts, backups, or developer working copies. If unavailable, document the loss and keep the catalog baseline separate from migration history.
- [ ] Reconcile the AI migration and all subsequent channel-separation/overload-removal changes against exact live function definitions and schema state.
- [x] Capture Storage bucket configuration and `storage.objects` policy definitions in separate recovery SQL files; the platform backup now packages generated bucket SQL, the policy snapshot, and bucket/object metadata with downloaded object bytes. The public policy snapshot redacts the administrator UUID fail-closed.
- [ ] Apply the packaged Storage configuration/policies and restore object bytes in an isolated Supabase-compatible target; verify counts, sizes, MIME rules, and access behavior.
- [ ] Define and test Auth recovery. The current Auth Admin export is not a full Auth backup: it omits password hashes, sessions, refresh tokens, MFA secrets, and other managed runtime state. A reset/re-invitation procedure is required.
- [ ] Build and test an isolated Supabase-compatible restore for database + Storage metadata/object bytes + Auth user recovery strategy. The PostgreSQL 17 fixture test is not a Supabase platform restore.
- [ ] Run the actual scheduled/manual encrypted database and platform backup workflows using repository secrets, inspect the resulting artifacts, decrypt them in an isolated environment, and retain copies outside the 7-day GitHub artifact window.
- [ ] Verify the backup workflow secrets exist and are valid: `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `BACKUP_ENCRYPTION_KEY`. Secret values must never be committed or sent in chat.
- [ ] Add automated checksums, object-count/byte-count verification, manifest validation, and a documented restore order/RTO/RPO.
- [ ] Review every exposed `SECURITY DEFINER` RPC body, authorization predicate, fixed search_path, grants, token handling, rate limits, and abuse cases. Do not mass-revoke grants or change invoker/definer modes without regression tests.
- [ ] Decide and test whether leaked-password protection should be enabled in Supabase Auth.
- [ ] Review performance advisories (RLS init-plan warnings, permissive policy overlap, unused indexes) with query evidence before making changes.
- [ ] Complete end-to-end storefront/admin tests against an isolated Supabase project, including checkout, payment callback/status, order tracking, stock updates, guest/admin chat, private management/AI channels, OTP login, reactions, read receipts, uploads, and recovery.
- [ ] Update this ledger and PR description with evidence links after each item is actually verified.

## Live advisor snapshot (read-only)

Security advisor findings observed 2026-11-22:
- 7 exposed `SECURITY DEFINER` functions callable by `anon`.
- 10 exposed `SECURITY DEFINER` functions callable by `authenticated`.
- `public.pm_accounts` and `private.sise_otp_send_limits` have RLS enabled but no policies.
- Auth leaked-password protection is disabled.
- `private.api_rate_limits` was previously flagged for RLS disabled; direct API-role table privileges were observed absent. Treat as defense-in-depth and test dependent functions before any change.

Performance advisor findings observed 2026-11-22:
- 15 RLS policy init-plan warnings.
- 2 multiple-permissive-policy warnings.
- 2 unused-index notices.

Advisor warnings are review findings, not automatic instructions to revoke access or alter policies. Function-by-function analysis and isolated regression tests are required.

## Operational safety boundary

This branch work has not changed Production database schema/data, migration history, RLS/grants, Auth settings, Storage policies/objects, Edge Functions, or the live website. No PR merge or deployment is authorized by this ledger. Production changes require a separate explicit approval after an isolated test and a verified rollback/backup plan.
