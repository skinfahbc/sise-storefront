# Kifara assets integrated into SISE

## Canonical ownership and live backend

- `skinfahbc/sise-storefront` remains the canonical SISE storefront and deployment source.
- The current `main` versions of both `index.html` and `admin.html` point to Supabase project ref `vwprdviufqukdvcroynt`, whose Dashboard project name is **Kifara**.
- The separate Supabase project named **skinfa** currently has no recorded migrations and is not referenced by the current SISE frontend. Do not switch SISE to it as part of this integration.
- `skinfahbc/kifara-shop` remains a historical source/reference. Its old frontend must not replace the current SISE frontend.

## Live production audit — 2026-11-22

Read-only inspection of the connected Kifara project confirmed:

- Project status is active/healthy on PostgreSQL 17.
- The migration history already contains the checkout, direct-order lockdown, admin/chat/storage hardening, chat rate-limit, and public Data API grant migrations, followed by the later SISE chat and AI migrations.
- All 11 current `public` tables have RLS enabled.
- The `anon` role cannot insert directly into `public.orders`; the guest-facing `create_order`, `pay_order`, and `track_order` RPCs are executable.
- The chat token-hash column `chat_messages.tokh` is not readable by `anon`.
- The configured admin UUID exists in Auth.
- The `media` bucket is limited to 15 MiB and the configured image/video MIME types. The `chat` bucket is limited to 3 MiB and permits JPEG, PNG, and WebP.
- No production database, Auth, Storage, or website changes were made during this audit.

## Migration history — do not replay archived snapshots

The four imported SQL snapshots originally placed under `supabase/migrations/` used timestamps that do **not** match the versions recorded in the connected production database:

| Archived snapshot filename | Version already recorded in production |
| --- | --- |
| `20261112111000_sise_secure_checkout.sql` | `20261112111637_sise_secure_checkout` |
| `20261112112000_sise_lockdown_direct_orders.sql` | `20261112113300_sise_lockdown_direct_orders` |
| `20261112130000_sise_admin_chat_storage_hardening.sql` | `20261112113842_sise_admin_chat_storage_hardening` |
| `20261112143000_sise_chat_rate_limit.sql` | `20261112114837_sise_chat_rate_limit` |

These snapshots are retained under `docs/archive/kifara-applied-migrations/` for reference and isolated smoke testing only. They are deliberately outside Supabase's active migration directory so a future `supabase db push` cannot treat them as new migrations and replay them against production.

This is not merely a filename discrepancy: the archived checkout snapshot has an older `track_order` implementation than the live database. The live function also retains a compatibility branch for eight-character hexadecimal legacy aliases. Do not replace the live function with the archived snapshot.

The file `supabase/migrations/20261113083642_sise_public_api_grants_hardening.sql` is retained under the active migrations directory because its version exactly matches the production migration history and its contents match the Kifara source file. It is already recorded as applied in the connected project.

## Imported paths

- `.github/scripts/sise-platform-backup.py`
- `.github/workflows/sise-backup.yml`
- `.github/workflows/sise-platform-backup.yml`
- `.github/workflows/sise-restore-check.yml`
- `.github/workflows/sise-restore-test.yml`
- `.github/workflows/sise-security-validation.yml`
- `BACKUP.md`, `SECURITY.md`
- The exact-version public Data API grants migration noted above
- `docs/archive/kifara-applied-migrations/` — non-active historical SQL snapshots
- `tests/checkout-fixture.sql`, `tests/checkout-smoke.sql`

## Deliberately not imported

The old Kifara `index.html`, `admin.html`, `sise-index.html`, `src/`, `build.sh`, and `CNAME` are not copied. They are a divergent frontend line and could overwrite current SISE behavior or domain configuration. The current SISE repository does not contain the legacy `build.sh`; the security validation workflow must not attempt to run it.

## Security Advisor findings to track

The live Supabase Security Advisor currently reports:

- Leaked-password protection is disabled in Auth. Enable it after reviewing the password policy and user impact.
- Publicly executable `SECURITY DEFINER` RPCs exist for checkout, order tracking/payment, chat ownership, and token-based private messaging. These are intentional API entry points, but must remain input-validated and authorization/token-checked.
- RLS is enabled without policies on `public.pm_accounts` and `private.sise_otp_send_limits`. These appear intended to be inaccessible directly and used through controlled functions; confirm this remains the intended model.
- Performance advisories include repeated `auth.uid()` evaluation in RLS policies, multiple permissive policies, and unused indexes. These are follow-up optimization work, not a reason to change production grants blindly.

Storage currently permits guest uploads to the public `chat` bucket, while writes to `media` are restricted to the authenticated admin. Keep the chat bucket's file-size and MIME restrictions, and consider abuse/rate controls for guest uploads.

## Backup and recovery status

The workflows are configured to target the currently connected Kifara project. They have **not yet been demonstrated by a successful backup run** in this review. Confirm the three required GitHub Actions secrets before relying on them:

- `SUPABASE_DB_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BACKUP_ENCRYPTION_KEY`

Database and Auth/Storage archives are retained for seven days. The restore-test workflow validates a database archive in isolated PostgreSQL; it does not restore Auth users or Storage objects into a replacement Supabase project. Auth exports do not include passwords, active sessions, refresh tokens, or MFA secrets. This is not a complete point-in-time disaster-recovery solution until those limitations and an off-repository retention process are addressed.

## CI and rollout

- The validation workflow now runs on pushes to this integration branch and on relevant pull-request changes.
- It parses all imported workflow YAML, checks Python and frontend JavaScript syntax, and exercises the archived SQL snapshots plus the exact-version grants migration against a disposable PostgreSQL service.
- The isolated tests do not constitute a full Supabase staging test. The GitHub Actions result must be green before the PR is marked ready.
- Do not apply any production migration from this PR: the connected production project already records the relevant migrations as applied.
- Do not merge or deploy without a separate review and explicit approval. No production action is part of this PR.
