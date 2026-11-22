-- Rate-limit guest chat inserts at the database boundary so direct REST calls
-- cannot bypass browser-side throttling. Admin messages remain available.
DO $$
BEGIN
  IF to_regclass('public.chat_messages') IS NOT NULL
     AND to_regprocedure('private.consume_rate_limit(text,integer,integer)') IS NOT NULL THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.sise_limit_guest_chat()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $body$
      DECLARE
        v_headers jsonb;
        v_ip text;
        v_uid text;
      BEGIN
        IF coalesce(NEW.is_admin, false) THEN
          RETURN NEW;
        END IF;

        v_headers := coalesce(
          nullif(current_setting('request.headers', true), '')::jsonb,
          '{}'::jsonb
        );
        v_ip := nullif(
          split_part(
            coalesce(v_headers->>'x-forwarded-for', v_headers->>'cf-connecting-ip', ''),
            ',', 1
          ),
          ''
        );
        v_uid := coalesce(nullif(trim(NEW.uid), ''), 'anonymous');

        IF NOT private.consume_rate_limit('chat:uid:' || md5(v_uid), 8, 60)
           OR NOT private.consume_rate_limit('chat:uid-hour:' || md5(v_uid), 50, 3600) THEN
          RAISE EXCEPTION 'ارسال پیام بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید'
            USING errcode = 'P0001';
        END IF;

        IF v_ip IS NOT NULL THEN
          IF NOT private.consume_rate_limit('chat:ip:' || md5(v_ip), 40, 60)
             OR NOT private.consume_rate_limit('chat:ip-hour:' || md5(v_ip), 250, 3600) THEN
            RAISE EXCEPTION 'تعداد پیام‌ها از این اتصال بیش از حد مجاز است؛ کمی بعد تلاش کنید'
              USING errcode = 'P0001';
          END IF;
        END IF;

        RETURN NEW;
      END
      $body$
    $fn$;

    EXECUTE 'REVOKE ALL ON FUNCTION public.sise_limit_guest_chat() FROM PUBLIC, anon, authenticated';
    EXECUTE 'DROP TRIGGER IF EXISTS sise_guest_chat_rate_limit ON public.chat_messages';
    EXECUTE 'CREATE TRIGGER sise_guest_chat_rate_limit BEFORE INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.sise_limit_guest_chat()';
  END IF;
END
$$;
