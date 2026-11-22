-- Minimal Storage/Auth stubs for isolated SQL syntax tests only.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END
$$;

CREATE SCHEMA auth;
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;

CREATE SCHEMA storage;
CREATE TYPE storage.buckettype AS ENUM ('STANDARD', 'ANALYTICS');
CREATE TABLE storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean,
  avif_autodetection boolean,
  file_size_limit bigint,
  allowed_mime_types text[],
  type storage.buckettype NOT NULL DEFAULT 'STANDARD',
  versioning_status text NOT NULL DEFAULT 'DISABLED',
  lifecycle_configuration jsonb
);
CREATE TABLE storage.objects (bucket_id text);
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
