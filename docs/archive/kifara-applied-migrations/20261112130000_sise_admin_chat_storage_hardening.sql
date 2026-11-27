-- Harden the public chat owner RPCs without changing their intended guest access.
-- Keep execute limited to the two API roles explicitly used by the frontend.
DO $$
BEGIN
  IF to_regprocedure('public.chat_delete(bigint,text,text)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.chat_delete(bigint,text,text) SET search_path = pg_catalog, public';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.chat_delete(bigint,text,text) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.chat_delete(bigint,text,text) TO anon, authenticated';
  END IF;

  IF to_regprocedure('public.chat_edit(bigint,text,text,text)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.chat_edit(bigint,text,text,text) SET search_path = pg_catalog, public';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.chat_edit(bigint,text,text,text) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.chat_edit(bigint,text,text,text) TO anon, authenticated';
  END IF;

  -- Admin media accepts images and short videos in the frontend. Cap uploads
  -- slightly above its 14 MB video limit to prevent unbounded public storage.
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE storage.buckets
      SET file_size_limit = 15728640,
          allowed_mime_types = ARRAY[
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/svg+xml',
            'image/gif',
            'video/mp4',
            'video/webm'
          ]::text[]
      WHERE id = 'media'
    $sql$;
  END IF;
END
$$;
