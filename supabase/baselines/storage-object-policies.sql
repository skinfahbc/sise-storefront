-- SISE Storage object RLS policy recovery snapshot (captured 2026-11-22).
-- Apply only after Supabase Storage schema is installed on an isolated target.
-- The Production admin UUID is redacted to NULL::uuid; media writes fail closed
-- until the intended administrator UUID is supplied during a controlled restore.

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
