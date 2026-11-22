# Kifara assets integrated into SISE

This branch imports the security, backup, recovery, and checkout-test assets from `skinfahbc/kifara-shop` into the canonical SISE repository.

## Repository ownership

- `skinfahbc/sise-storefront` remains the canonical SISE storefront and deployment source.
- This repository now also carries the SISE-specific database security migrations, GitHub Actions backup/recovery workflows, backup helper script, security/backup runbooks, and checkout smoke tests.
- `skinfahbc/kifara-shop` is retained as the historical source/reference until the owner separately decides to archive it. Do not deploy its legacy frontend.

## Imported paths

- `.github/scripts/sise-platform-backup.py`
- `.github/workflows/sise-backup.yml`
- `.github/workflows/sise-platform-backup.yml`
- `.github/workflows/sise-restore-check.yml`
- `.github/workflows/sise-restore-test.yml`
- `.github/workflows/sise-security-validation.yml` (renamed to avoid colliding with the existing static-page validator)
- `BACKUP.md`, `SECURITY.md`
- `supabase/migrations/20261112111000_sise_secure_checkout.sql`
- `supabase/migrations/20261112112000_sise_lockdown_direct_orders.sql`
- `supabase/migrations/20261112130000_sise_admin_chat_storage_hardening.sql`
- `supabase/migrations/20261112143000_sise_chat_rate_limit.sql`
- `supabase/migrations/20261113083642_sise_public_api_grants_hardening.sql`
- `tests/checkout-fixture.sql`, `tests/checkout-smoke.sql`

## Deliberately not imported

The old `index.html`, `admin.html`, `sise-index.html`, `src/`, and `build.sh` from Kifara are not copied. They are a separate/older frontend line and could overwrite or diverge from the current SISE storefront. Kifara's `CNAME` is also not copied because SISE already owns its domain configuration.

## Critical deployment precautions

1. This integration only adds files to a review branch. It does not deploy the website or change Supabase.
2. Do not run the imported SQL migrations against production merely because they are now in the repository. First compare the live Supabase migration history/schema with these migrations and verify dependencies, especially the staged two-step checkout rollout.
3. The secure checkout rollout is intentionally staged: apply the first migration, deploy a frontend that calls the new server-side order RPC, test guest and authenticated checkout, then apply the second migration that blocks direct public inserts. Applying the second migration before the compatible frontend is live can break checkout.
4. The imported security runbook explicitly says these changes were not yet applied to the live Supabase project at the time it was written. Verify the current live state before acting.
5. Configure GitHub Actions secrets only in repository Settings → Secrets and variables → Actions. Never commit Supabase service-role keys, database URLs, OpenAI keys, or backup encryption passphrases.
6. Auth export is not a complete Auth clone: passwords/password hashes, sessions, refresh tokens, and MFA secrets are not included. Restore may require password resets or invitations.
7. Backup artifacts have a limited retention window. Download encrypted backups to a separate secure location and keep the encryption passphrase separately.

## Review checklist

- [ ] Review imported SQL against current production schema and migration history.
- [ ] Validate checkout RPC against the current `index.html` payload and product/site JSON schema.
- [ ] Run checkout smoke tests in an isolated PostgreSQL/Supabase test environment.
- [ ] Configure and test encrypted database backup.
- [ ] Configure and test Auth + Storage backup.
- [ ] Run decrypt/restore verification and isolated PostgreSQL restore test.
- [ ] Confirm GitHub Actions permissions and required secrets.
- [ ] Only then merge and separately approve any production migration/deployment.
