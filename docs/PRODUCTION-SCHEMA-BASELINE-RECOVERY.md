# Production schema baseline — recovery snapshot

- Source: Supabase project ref `vwprdviufqukdvcroynt` (read-only catalog introspection).
- Captured: 2026-11-22.
- Artifact: `supabase/baselines/production-schema-baseline.sql`.
- This is a **schema snapshot**, not an original migration and not proof of full disaster recovery.
- No application row data, customer data, Auth identities/password hashes/sessions/MFA, Storage object bytes, Vault secrets, API keys, environment secrets, project-level Auth/provider configuration, cron jobs, publications or Supabase-managed internals are included.
- RLS administrator UUID literals were redacted to `NULL::uuid` so this public repository does not disclose the administrator's Auth UUID. Before a controlled restore, replace those placeholders with the intended administrator UUID; until then those admin policies fail closed.
- The baseline includes application-owned `public` and `private` tables, constraints, RLS flags, sequences, secondary indexes, application functions, policies, triggers, and captured grants. It deliberately excludes the managed `storage` schema and Supabase platform internals.
- It passed an isolated PostgreSQL 17 smoke replay in GitHub Actions run [45011084602](https://github.com/skinfahbc/sise-storefront/actions/runs/45011084602), using minimal stubs for Supabase Auth (`auth.users`, `auth.uid`) and pgcrypto. The smoke test verified 13 application tables, at least 19 functions, 3 triggers, at least 20 policies, 5 sequences, and 12 RLS-enabled tables. This is a structural/syntax smoke test only, not a full Supabase restore or proof that every runtime dependency and grant behaves identically to Production.
- Do not run this against Production. It is intended for a fresh isolated target only.

## Remaining recovery work

The current verified checklist and exact 17-entry Production migration reconciliation live in [PRODUCTION-RECOVERY-COMPLETENESS-LEDGER.md](PRODUCTION-RECOVERY-COMPLETENESS-LEDGER.md). In brief:

1. Recover the nine original migration SQL sources; four timestamp-mismatched historical snapshots remain archive-only.
2. Prove the AI migration sequence against the live channel-aware `pm_list` signature and `pm.channel`.
3. Apply and verify the newly captured Storage bucket configuration and object-policy exports alongside object bytes in an isolated Supabase-compatible target.
4. Define Auth identity recovery/reset strategy; current Auth export deliberately omits password hashes, sessions, refresh tokens, MFA secrets and other managed state.
5. Run real encrypted database and platform backups with configured GitHub secrets, then decrypt and restore them in an isolated Supabase-compatible environment. Current CI fixture tests are not a real platform restore.
6. Review exposed SECURITY DEFINER RPCs, RLS/grants, Auth password protection, and performance advisories function-by-function before any production remediation.
7. Complete isolated end-to-end storefront/admin tests and document recovery time/object-count/checksum evidence.

## Safety boundary

This snapshot was captured using read-only catalog queries. No Production schema, data, functions, policies, settings, migrations, Edge Functions or deployment state were changed. Do not replay this snapshot on Production or treat it as a replacement for the original migration ledger.
