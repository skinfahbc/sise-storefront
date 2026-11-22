-- SISE Production Storage recovery snapshot (captured 2026-11-22).
-- NOT an original migration. Apply only after Supabase Storage schema is installed
-- in a fresh isolated Supabase-compatible target. Never apply blindly to Production.
-- Bucket owner identifiers are intentionally omitted.
-- The production admin UUID in "media write" is redacted to NULL::uuid (fail-closed).

INSERT INTO storage.buckets
  (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types,
   type, versioning_status, lifecycle_configuration)
VALUES
  ('chat', 'chat', true, false, 3145728,
   ARRAY['image/jpeg', 'image/png', 'image/webp']::text[],
   'STANDARD', 'DISABLED', NULL),
  ('media', 'media', true, false, 15728640,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
         'image/gif', 'video/mp4', 'video/webm']::text[],
   'STANDARD', 'DISABLED', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  type = EXCLUDED.type,
  versioning_status = EXCLUDED.versioning_status,
  lifecycle_configuration = EXCLUDED.lifecycle_configuration;

DROP POLICY IF EXISTS "chat img read" ON storage.objects;
CREATE POLICY "chat img read"
  ON storage.objects AS PERMISSIVE
  FOR SELECT TO public
  USING (bucket_id = 'chat');

DROP POLICY IF EXISTS "chat img upload" ON storage.objects;
CREATE POLICY "chat img upload"
  ON storage.objects AS PERMISSIVE
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'chat');

DROP POLICY IF EXISTS "media read" ON storage.objects;
CREATE POLICY "media read"
  ON storage.objects AS PERMISSIVE
  FOR SELECT TO public
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media write" ON storage.objects;
CREATE POLICY "media write"
  ON storage.objects AS PERMISSIVE
  FOR ALL TO authenticated
  USING (bucket_id = 'media' AND auth.uid() = NULL::uuid)
  WITH CHECK (bucket_id = 'media' AND auth.uid() = NULL::uuid);
