#!/usr/bin/env bash
set -euo pipefail

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE baseline_restore"
BASELINE_DATABASE_URL="${DATABASE_URL%/*}/baseline_restore"

psql "$BASELINE_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/production-baseline-bootstrap.sql
psql "$BASELINE_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/baselines/production-schema-baseline.sql
psql "$BASELINE_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/production-baseline-assertions.sql
