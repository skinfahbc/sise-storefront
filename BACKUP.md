# SISE backups (Free plan)

## Database backup

The workflow `SISE encrypted database backup` runs daily at 03:00 UTC and can be started manually. It exports the application database schema, data, and roles, creates a SHA-256 manifest for the schema/data/roles/README files, encrypts the archive with GPG AES-256, and uploads only the encrypted artifact. Artifact retention is 7 days.

Required GitHub Actions secrets:
- `SUPABASE_DB_URL`: PostgreSQL connection URI from Supabase Dashboard → Project → Connect. Percent-encode special characters in the password.
- `BACKUP_ENCRYPTION_KEY`: a strong, unique passphrase of at least 32 random characters, stored in a password manager.

## Auth and Storage backup

The separate workflow `SISE encrypted Auth and Storage backup` runs daily at 03:20 UTC and can be started manually. It:
- Exports an allowlisted set of Auth user/profile/identity fields through the server-side Auth Admin API and recursively strips password, token, secret, OTP, credential, session and MFA-factor fields.
- Downloads the actual objects from every Storage bucket; records bucket configuration (visibility, MIME allowlist, size limits, type, versioning and lifecycle settings), object metadata, per-object SHA-256 checksums and byte counts; and emits isolated-restore SQL for bucket settings and Storage object RLS policies.
- Encrypts the complete archive with GPG AES-256 before uploading it.
- Uploads only the encrypted artifact and retains it for 7 days.

Additional required GitHub Actions secret:
- `SUPABASE_SERVICE_ROLE_KEY`: the project's server-side service-role/secret API key. Add it only under GitHub **Settings → Secrets and variables → Actions**. Never commit it, paste it into chat, or put it in browser code. Do not use the anon/publishable key.

**Auth limitations:** the Auth Admin API export does not include passwords/password hashes, active sessions, refresh tokens, MFA secrets, or all runtime Auth state. Restored users may need password resets or invitations. This is a user-record export, not a complete point-in-time clone of Supabase Auth.

**Platform artifact verification:** after the Auth/Storage backup workflow completes, run the manual workflow **SISE Auth and Storage backup verification** and provide that backup run's ID. It decrypts the artifact in GitHub Actions, rejects unsafe archive paths, verifies the Auth field allowlist, validates bucket/policy coverage, and checks every Storage object's SHA-256 and byte count. This is an integrity check, not an Auth/Storage restore.

**Storage scope:** actual file bytes from all buckets are downloaded. The encrypted platform archive also includes a generated `storage/buckets.sql`, the captured `storage/object-policies.sql`, and a JSON manifest with bucket/object metadata. The SQL requires the Supabase Storage schema to exist first. The exporter fails closed if the live bucket set differs from the reviewed object-policy snapshot, so a newly added bucket cannot silently pass as a complete backup. The administrator UUID in the public policy snapshot is redacted to `NULL::uuid` (fail-closed) and must be deliberately replaced for a controlled restore. The backup still needs an end-to-end restore test against an isolated Supabase-compatible target.

## Retention and recovery

Both GitHub artifact workflows currently retain files for 7 days. Download important encrypted artifacts to a separate secure location before expiry. Keep `BACKUP_ENCRYPTION_KEY` separately; without it the archives cannot be decrypted.

A backup is not considered fully verified until the encrypted artifact has been produced and a restore/retrieval test has been performed in an isolated environment. Do not create a paid Supabase test project for this process.
