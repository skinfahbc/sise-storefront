# SISE backups (Free plan)

## Database backup

The workflow `SISE encrypted database backup` runs daily at 03:00 UTC and can be started manually. It exports the application database schema, data, and roles, encrypts the archive with GPG AES-256, and uploads only the encrypted artifact. Artifact retention is 7 days.

Required GitHub Actions secrets:
- `SUPABASE_DB_URL`: PostgreSQL connection URI from Supabase Dashboard → Project → Connect. Percent-encode special characters in the password.
- `BACKUP_ENCRYPTION_KEY`: a strong, unique passphrase of at least 32 random characters, stored in a password manager.

## Auth and Storage backup

The separate workflow `SISE encrypted Auth and Storage backup` runs daily at 03:20 UTC and can be started manually. It:
- Exports Auth user records through the server-side Auth Admin API.
- Downloads the actual objects from every Storage bucket and writes a manifest with bucket/object metadata.
- Encrypts the complete archive with GPG AES-256 before uploading it.
- Uploads only the encrypted artifact and retains it for 7 days.

Additional required GitHub Actions secret:
- `SUPABASE_SERVICE_ROLE_KEY`: the project's server-side service-role/secret API key. Add it only under GitHub **Settings → Secrets and variables → Actions**. Never commit it, paste it into chat, or put it in browser code. Do not use the anon/publishable key.

**Auth limitations:** the Auth Admin API export does not include passwords/password hashes, active sessions, refresh tokens, MFA secrets, or all runtime Auth state. Restored users may need password resets or invitations. This is a user-record export, not a complete point-in-time clone of Supabase Auth.

**Storage scope:** actual file bytes from all buckets are downloaded. This is separate from the database dump, which contains Storage metadata but not the file contents.

## Retention and recovery

Both GitHub artifact workflows currently retain files for 7 days. Download important encrypted artifacts to a separate secure location before expiry. Keep `BACKUP_ENCRYPTION_KEY` separately; without it the archives cannot be decrypted.

A backup is not considered fully verified until the encrypted artifact has been produced and a restore/retrieval test has been performed in an isolated environment. Do not create a paid Supabase test project for this process.
