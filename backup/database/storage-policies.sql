-- SISE Storage bucket metadata and RLS policies snapshot, 2026-11-16
-- Create buckets in Supabase Storage dashboard or via supported Storage API first.
-- Bucket settings:
-- chat: public=true, file_size_limit=3145728, allowed MIME: image/jpeg,image/png,image/webp
-- media: public=true, file_size_limit=15728640, allowed MIME: image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm

-- Policies on storage.objects:
CREATE POLICY "chat img read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chat');
CREATE POLICY "chat img upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'chat');
CREATE POLICY "media read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
CREATE POLICY "media write" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'media' AND auth.uid() = '7a52dd4c-f75a-4e1c-9b49-230b84c4fec8'::uuid)
WITH CHECK (bucket_id = 'media' AND auth.uid() = '7a52dd4c-f75a-4e1c-9b49-230b84c4fec8'::uuid);
