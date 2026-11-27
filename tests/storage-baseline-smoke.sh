#!/usr/bin/env bash
set -euo pipefail

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE storage_baseline_restore"
STORAGE_DATABASE_URL="${DATABASE_URL%/*}/storage_baseline_restore"

psql "$STORAGE_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/storage-baseline-bootstrap.sql
psql "$STORAGE_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/baselines/storage-recovery-baseline.sql
psql "$STORAGE_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/storage-baseline-assertions.sql

echo "PASS: Storage bucket configuration and RLS policy snapshot replayed in disposable PostgreSQL."
