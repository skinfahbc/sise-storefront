# Production schema baseline — recovery snapshot

- Source: Supabase project ref vwprdviufqukdvcroynt (read-only catalog introspection).
- Captured: 2026-11-22.
- Artifact: `supabase/baselines/production-schema-baseline.sql`.
- This is a **schema snapshot**, not an original migration and not proof of full disaster recovery.
- No application row data, customer data, Auth identities/password hashes/sessions/MFA, Storage object bytes, Vault secrets, API keys, environment secrets, project-level Auth/provider configuration, cron jobs, publications or Supabase-managed internals are included.
- RLS admin UUID literals were redacted to `NULL::uuid` so this public repository does not disclose the administrator's auth UUID. Before a controlled restore, replace those placeholders with the intended administrator UUID; until then those admin policies fail closed.
- The baseline includes application-owned `public` and `private` tables, constraints, RLS flags, sequences, secondary indexes, app functions, policies, triggers, and captured grants. It deliberately excludes the managed `storage` schema and Supabase platform internals.
- It passed an isolated PostgreSQL 17 smoke replay in GitHub Actions run [45011084602](https://github.com/skinfahbc/sise-storefront/actions/runs/45011084602), using minimal stubs for Supabase Auth (`auth.users`, `auth.uid`) and pgcrypto. The smoke test verified 13 application tables, at least 19 functions, 3 triggers, at least 20 policies, 5 sequences, and 12 RLS-enabled tables. This is a structural/syntax smoke test only, not a full Supabase restore or proof that every runtime dependency and grant behaves identically to production.
- Do not run this against production. It is intended for a fresh isolated target only.

## Remaining recovery work

1. Recover or formally replace the nine missing historical migration sources; do not fabricate their original history.
2. Validate this snapshot on an isolated target and compare resulting catalogs with the source inventory.
3. Separately export Storage bucket configuration/policies and validate object backup/restore.
4. Separately define Auth identity migration/reset strategy and restore provider settings without exporting secrets.
5. Run an actual encrypted backup and restore drill; CI fixture tests are not a substitute.
6. Review SECURITY DEFINER RPCs, RLS, grants and Supabase advisors before any production remediation.

## Safety boundary

This snapshot was captured using read-only catalog queries. No production schema, data, functions, policies, settings, migrations, Edge Functions or deployment state were changed.
