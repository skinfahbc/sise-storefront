DO $$
DECLARE
  v_buckets integer;
  v_policies integer;
  v_chat_limit bigint;
  v_media_limit bigint;
  v_media_policy text;
BEGIN
  SELECT count(*) INTO v_buckets FROM storage.buckets;
  IF v_buckets <> 2 THEN RAISE EXCEPTION 'Expected 2 Storage buckets, found %', v_buckets; END IF;

  SELECT file_size_limit INTO v_chat_limit FROM storage.buckets WHERE id = 'chat';
  SELECT file_size_limit INTO v_media_limit FROM storage.buckets WHERE id = 'media';
  IF v_chat_limit <> 3145728 THEN RAISE EXCEPTION 'Unexpected chat bucket size limit: %', v_chat_limit; END IF;
  IF v_media_limit <> 15728640 THEN RAISE EXCEPTION 'Unexpected media bucket size limit: %', v_media_limit; END IF;

  SELECT count(*) INTO v_policies FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
  IF v_policies <> 4 THEN RAISE EXCEPTION 'Expected 4 Storage object policies, found %', v_policies; END IF;

  SELECT qual INTO v_media_policy FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'media write';
  IF v_media_policy IS NULL OR position('NULL::uuid' in v_media_policy) = 0 THEN
    RAISE EXCEPTION 'Expected fail-closed redacted admin UUID in media write policy';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'storage.objects'::regclass) THEN
    RAISE EXCEPTION 'Storage objects RLS must remain enabled';
  END IF;
END
$$;
