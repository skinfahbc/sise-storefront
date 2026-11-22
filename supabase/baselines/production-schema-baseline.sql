-- SISE production schema baseline (catalog snapshot; generated read-only)
-- Source project: vwprdviufqukdvcroynt
-- Captured: 2026-11-22
-- IMPORTANT: This is NOT an original migration and must never be replayed on production.
-- Apply only to a fresh isolated PostgreSQL/Supabase environment after reviewing managed dependencies.
-- Admin UUID literals were intentionally redacted to NULL::uuid in RLS policies (fail-closed).
-- Replace each NULL::uuid with the intended admin auth.users UUID before a recovery restore.
-- This file excludes application rows, Auth users/secrets, Storage objects, Vault secrets,
-- project settings, API keys, cron jobs, publications/replication settings and provider-managed internals.
-- It includes only public/private application tables, sequences, indexes, policies, functions,
-- triggers and captured grants. Review roles/extensions and managed dependencies before replay.

CREATE SCHEMA IF NOT EXISTS private;
ALTER SCHEMA public OWNER TO pg_database_owner;
ALTER SCHEMA private OWNER TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT CREATE ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT CREATE ON SCHEMA private TO postgres;

CREATE TABLE IF NOT EXISTS private.api_rate_limits (
  rate_key text NOT NULL,
  window_started timestamp with time zone NOT NULL,
  hits integer NOT NULL,
  CONSTRAINT api_rate_limits_hits_check CHECK (hits >= 0),
  CONSTRAINT api_rate_limits_pkey PRIMARY KEY (rate_key)
);
ALTER TABLE private.api_rate_limits OWNER TO postgres;
ALTER TABLE private.api_rate_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE private.api_rate_limits DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS private.sise_otp_send_limits (
  phone_hash text NOT NULL,
  last_sent_at timestamp with time zone NOT NULL,
  window_started_at timestamp with time zone NOT NULL,
  send_count integer NOT NULL DEFAULT 1,
  CONSTRAINT sise_otp_send_limits_pkey PRIMARY KEY (phone_hash)
);
ALTER TABLE private.sise_otp_send_limits OWNER TO postgres;
ALTER TABLE private.sise_otp_send_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.sise_otp_send_limits DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id bigint NOT NULL,
  uid text,
  name text NOT NULL,
  avatar text,
  text text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image text,
  is_admin boolean NOT NULL DEFAULT false,
  edited boolean NOT NULL DEFAULT false,
  tokh text,
  reply_to bigint,
  rname text,
  rtext text,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_text_ok CHECK (char_length(text) <= 500 AND (char_length(text) > 0 OR image IS NOT NULL))
);
ALTER TABLE public.chat_messages OWNER TO postgres;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_reactions (
  id bigint NOT NULL,
  message_id bigint NOT NULL,
  uid text NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_reactions_emoji_check CHECK (emoji = ANY (ARRAY['❤️'::text, '😂'::text, '😍'::text, '👍'::text, '🔥'::text, '👏'::text, '😢'::text, '🎉'::text])),
  CONSTRAINT chat_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
  CONSTRAINT chat_reactions_message_uid_emoji_key UNIQUE (message_id, uid, emoji),
  CONSTRAINT chat_reactions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.chat_reactions OWNER TO postgres;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_reads (
  message_id bigint NOT NULL,
  uid text NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
  CONSTRAINT chat_reads_pkey PRIMARY KEY (message_id, uid)
);
ALTER TABLE public.chat_reads OWNER TO postgres;
ALTER TABLE public.chat_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reads DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.draw_entries (
  id bigint NOT NULL,
  draw_id text NOT NULL,
  phone text NOT NULL,
  name text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT draw_entries_draw_id_phone_key UNIQUE (draw_id, phone),
  CONSTRAINT draw_entries_pkey PRIMARY KEY (id)
);
ALTER TABLE public.draw_entries OWNER TO postgres;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_code_key UNIQUE (code),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);
ALTER TABLE public.orders OWNER TO postgres;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.pm (
  id bigint NOT NULL,
  uid text NOT NULL,
  name text,
  text text,
  image text,
  from_admin boolean NOT NULL DEFAULT false,
  tokh text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ai_generated boolean NOT NULL DEFAULT false,
  needs_admin boolean NOT NULL DEFAULT false,
  reply_to_id bigint,
  channel text NOT NULL DEFAULT 'management'::text,
  CONSTRAINT pm_channel_check CHECK (channel = ANY (ARRAY['management'::text, 'ai'::text])),
  CONSTRAINT pm_pkey PRIMARY KEY (id),
  CONSTRAINT pm_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES pm(id) ON DELETE SET NULL
);
ALTER TABLE public.pm OWNER TO postgres;
ALTER TABLE public.pm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.pm_accounts (
  auth_user_id uuid NOT NULL,
  pm_uid text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pm_accounts_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT pm_accounts_pkey PRIMARY KEY (auth_user_id),
  CONSTRAINT pm_accounts_pm_uid_key UNIQUE (pm_uid)
);
ALTER TABLE public.pm_accounts OWNER TO postgres;
ALTER TABLE public.pm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_accounts DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.site (
  id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_pkey PRIMARY KEY (id)
);
ALTER TABLE public.site OWNER TO postgres;
ALTER TABLE public.site ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.stock (
  pid text NOT NULL,
  qty integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stock_pkey PRIMARY KEY (pid),
  CONSTRAINT stock_qty_check CHECK (qty >= 0)
);
ALTER TABLE public.stock OWNER TO postgres;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.stock_notify (
  id bigint NOT NULL,
  pid text NOT NULL,
  phone text NOT NULL,
  name text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stock_notify_pid_phone_key UNIQUE (pid, phone),
  CONSTRAINT stock_notify_pkey PRIMARY KEY (id)
);
ALTER TABLE public.stock_notify OWNER TO postgres;
ALTER TABLE public.stock_notify ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_notify DISABLE FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.story_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id text NOT NULL,
  name text NOT NULL,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  avatar text,
  CONSTRAINT story_comments_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 60),
  CONSTRAINT story_comments_pkey PRIMARY KEY (id),
  CONSTRAINT story_comments_text_check CHECK (char_length(text) >= 1 AND char_length(text) <= 300)
);
ALTER TABLE public.story_comments OWNER TO postgres;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments DISABLE FORCE ROW LEVEL SECURITY;

-- Sequences and defaults
CREATE SEQUENCE IF NOT EXISTS public.chat_reactions_id_seq;
ALTER SEQUENCE public.chat_reactions_id_seq OWNED BY public.chat_reactions.id;
ALTER TABLE public.chat_reactions ALTER COLUMN id SET DEFAULT nextval('public.chat_reactions_id_seq'::regclass);
CREATE SEQUENCE IF NOT EXISTS public.pm_id_seq;
ALTER SEQUENCE public.pm_id_seq OWNED BY public.pm.id;
ALTER TABLE public.pm ALTER COLUMN id SET DEFAULT nextval('public.pm_id_seq'::regclass);
CREATE SEQUENCE IF NOT EXISTS public.chat_messages_id_seq;
ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;
ALTER TABLE public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);
CREATE SEQUENCE IF NOT EXISTS public.stock_notify_id_seq;
ALTER SEQUENCE public.stock_notify_id_seq OWNED BY public.stock_notify.id;
ALTER TABLE public.stock_notify ALTER COLUMN id SET DEFAULT nextval('public.stock_notify_id_seq'::regclass);
CREATE SEQUENCE IF NOT EXISTS public.draw_entries_id_seq;
ALTER SEQUENCE public.draw_entries_id_seq OWNED BY public.draw_entries.id;
ALTER TABLE public.draw_entries ALTER COLUMN id SET DEFAULT nextval('public.draw_entries_id_seq'::regclass);
-- Secondary indexes
CREATE INDEX chat_reactions_message_id_idx ON public.chat_reactions USING btree (message_id);
CREATE INDEX chat_reads_uid_read_at_idx ON public.chat_reads USING btree (uid, read_at DESC);
CREATE INDEX orders_phone_created_idx ON public.orders USING btree (((data ->> 'phone'::text)), created_at DESC);
CREATE INDEX pm_uid_idx ON public.pm USING btree (uid, id);
CREATE UNIQUE INDEX pm_one_ai_reply_per_message ON public.pm USING btree (reply_to_id) WHERE ((ai_generated = true) AND (reply_to_id IS NOT NULL));
CREATE INDEX pm_uid_channel_id_idx ON public.pm USING btree (uid, channel, id);
-- Application functions
CREATE OR REPLACE FUNCTION private.chat_mark_read_impl(p_ids bigint[], p_uid text, p_tok text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_hash text;
  v_count integer := 0;
begin
  if p_uid is null or length(p_uid) not between 1 and 128
     or p_tok is null or length(p_tok) not between 16 and 256
     or p_ids is null or coalesce(array_length(p_ids, 1), 0) = 0
     or array_length(p_ids, 1) > 100 then
    return -1;
  end if;
  v_hash := encode(sha256(convert_to(p_tok, 'UTF8')), 'hex');
  if not exists (
    select 1 from public.chat_messages
    where uid = p_uid and tokh = v_hash and is_admin = false
  ) then
    return -1;
  end if;
  insert into public.chat_reads(message_id, uid)
  select distinct m.id, p_uid
  from public.chat_messages m
  where m.id = any(p_ids) and m.uid is distinct from p_uid
  on conflict (message_id, uid) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$


CREATE OR REPLACE FUNCTION private.chat_react_impl(p_id bigint, p_uid text, p_tok text, p_emoji text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_hash text;
begin
  if p_id is null or p_uid is null or length(p_uid) not between 1 and 128
     or p_tok is null or length(p_tok) not between 16 and 256
     or p_emoji is null or p_emoji not in ('❤️','😂','😍','👍','🔥','👏','😢','🎉') then
    return 'invalid';
  end if;
  v_hash := encode(sha256(convert_to(p_tok, 'UTF8')), 'hex');
  if not exists (
    select 1 from public.chat_messages
    where uid = p_uid and tokh = v_hash and is_admin = false
  ) then
    return 'invalid';
  end if;
  if not exists (select 1 from public.chat_messages where id = p_id) then
    return 'invalid';
  end if;
  if exists (
    select 1 from public.chat_reactions
    where message_id = p_id and uid = p_uid and emoji = p_emoji
  ) then
    delete from public.chat_reactions
    where message_id = p_id and uid = p_uid and emoji = p_emoji;
    return 'removed';
  end if;
  insert into public.chat_reactions(message_id, uid, emoji)
  values (p_id, p_uid, p_emoji)
  on conflict (message_id, uid, emoji) do nothing;
  return 'added';
end;
$function$


CREATE OR REPLACE FUNCTION private.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_hits integer;
begin
  if p_limit<1 or p_window_seconds<1 then return false; end if;
  insert into private.api_rate_limits(rate_key,window_started,hits) values(p_key,clock_timestamp(),1)
  on conflict(rate_key) do update
    set window_started=case when private.api_rate_limits.window_started<=clock_timestamp()-make_interval(secs=>p_window_seconds)
                             then clock_timestamp() else private.api_rate_limits.window_started end,
        hits=case when private.api_rate_limits.window_started<=clock_timestamp()-make_interval(secs=>p_window_seconds)
                  then 1 else private.api_rate_limits.hits+1 end
  returning hits into v_hits;
  return v_hits<=p_limit;
end;
$function$


CREATE OR REPLACE FUNCTION public.chat_delete(p_id bigint, p_uid text, p_tok text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
                                         declare n int;
                                         begin
                                           delete from chat_messages
                                              where id = p_id and uid = p_uid and is_admin = false and tokh is not null
                                                   and tokh = encode(sha256(convert_to(p_tok, 'UTF8')), 'hex');
                                                     get diagnostics n = row_count;
                                                       return n > 0;
                                                       end $function$


CREATE OR REPLACE FUNCTION public.chat_edit(p_id bigint, p_uid text, p_tok text, p_text text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
                      declare n int;
                      begin
                        update chat_messages set text = left(trim(p_text), 500), edited = true
                           where id = p_id and uid = p_uid and is_admin = false and tokh is not null
                                and tokh = encode(sha256(convert_to(p_tok, 'UTF8')), 'hex')
                                     and (char_length(trim(p_text)) > 0 or image is not null);
                                       get diagnostics n = row_count;
                                         return n > 0;
                                         end $function$


CREATE OR REPLACE FUNCTION public.chat_mark_read(p_ids bigint[], p_uid text, p_tok text)
 RETURNS integer
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select private.chat_mark_read_impl(p_ids, p_uid, p_tok);
$function$


CREATE OR REPLACE FUNCTION public.chat_react(p_id bigint, p_uid text, p_tok text, p_emoji text)
 RETURNS text
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select private.chat_react_impl(p_id, p_uid, p_tok, p_emoji);
$function$


CREATE OR REPLACE FUNCTION public.create_order(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_site jsonb; v_customer jsonb; v_line jsonb; v_product jsonb; v_color jsonb;
  v_items jsonb:='[]'::jsonb; v_order jsonb; v_headers jsonb; v_ip text;
  v_name text; v_phone text; v_address text; v_note text; v_coupon_code text;
  v_coupon jsonb; v_shipping_id text; v_shipping jsonb; v_pid text;
  v_color_id text; v_color_name text; v_img text; v_qty integer; v_stock integer;
  v_price numeric; v_subtotal numeric:=0; v_discount numeric:=0;
  v_shipping_cost numeric:=0; v_total numeric; v_percent integer;
  v_code text; v_created bigint; v_stock_line record;
begin
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then
    raise exception 'اطلاعات سفارش نامعتبر است' using errcode='22023';
  end if;
  v_customer:=p_payload->'customer';
  if jsonb_typeof(v_customer)<>'object' then raise exception 'اطلاعات خریدار ناقص است' using errcode='22023'; end if;
  v_name:=left(trim(coalesce(v_customer->>'name','')),120);
  v_phone:=regexp_replace(coalesce(v_customer->>'phone',''),'[^0-9]','','g');
  v_address:=left(trim(coalesce(v_customer->>'address','')),1000);
  v_note:=left(trim(coalesce(v_customer->>'note','')),500);
  if char_length(v_name)<2 or v_phone !~ '^09[0-9]{9}$' or char_length(v_address)<8 then
    raise exception 'نام، شماره موبایل یا آدرس معتبر نیست' using errcode='22023';
  end if;
  if jsonb_typeof(p_payload->'items')<>'array' or jsonb_array_length(p_payload->'items')<1
     or jsonb_array_length(p_payload->'items')>20 then
    raise exception 'سبد خرید نامعتبر است' using errcode='22023';
  end if;

  v_headers:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
  v_ip:=coalesce(nullif(split_part(coalesce(v_headers->>'x-forwarded-for',v_headers->>'cf-connecting-ip',''),',',1),''),
                 'phone:'||md5(v_phone));
  if not private.consume_rate_limit('order:'||md5(v_ip),8,600) then
    raise exception 'تعداد درخواست ثبت سفارش بیش از حد مجاز است؛ کمی بعد تلاش کنید' using errcode='P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_phone,0));
  if (select count(*) from public.orders o where o.data->>'phone'=v_phone
      and o.created_at>clock_timestamp()-interval '1 hour')>=5 then
    raise exception 'برای این شماره در یک ساعت اخیر تعداد سفارش زیادی ثبت شده است' using errcode='P0001';
  end if;

  select s.data into v_site from public.site s where s.id='main' for share;
  if v_site is null then raise exception 'تنظیمات فروشگاه در دسترس نیست' using errcode='P0001'; end if;

  for v_line in select value from jsonb_array_elements(p_payload->'items')
  loop
    v_pid:=trim(coalesce(v_line->>'pid',''));
    v_color_id:=nullif(trim(coalesce(v_line->>'color','')),'');
    if coalesce(v_line->>'qty','') !~ '^[1-9][0-9]{0,2}$' then raise exception 'تعداد یکی از کالاها نامعتبر است' using errcode='22023'; end if;
    v_qty:=(v_line->>'qty')::integer;
    select p.value into v_product from jsonb_array_elements(coalesce(v_site->'products','[]'::jsonb)) p(value)
      where p.value->>'id'=v_pid limit 1;
    if v_product is null then raise exception 'یکی از کالاها دیگر در فروشگاه موجود نیست' using errcode='22023'; end if;
    if coalesce(v_product->>'active','true')='false' or coalesce(v_product->>'hidden','false')='true' then
      raise exception 'یکی از کالاها در حال حاضر قابل سفارش نیست' using errcode='22023';
    end if;
    if coalesce(v_product->>'price','') !~ '^[0-9]+([.][0-9]+)?$' then raise exception 'قیمت کالا نامعتبر است' using errcode='22023'; end if;
    v_price:=(v_product->>'price')::numeric;
    if v_price<=0 or v_price>1000000000000 then raise exception 'قیمت کالا خارج از محدوده مجاز است' using errcode='22023'; end if;
    v_color_name:=''; v_img:=coalesce(v_product->'images'->>0,'');
    if v_color_id is not null then
      select c.value into v_color from jsonb_array_elements(coalesce(v_product->'colors','[]'::jsonb)) c(value)
        where c.value->>'id'=v_color_id limit 1;
      if v_color is null then raise exception 'رنگ انتخاب‌شده برای یکی از کالاها معتبر نیست' using errcode='22023'; end if;
      v_color_name:=coalesce(v_color->>'name',''); v_img:=coalesce(nullif(v_color->>'img',''),v_img);
    end if;
    v_items:=v_items||jsonb_build_array(jsonb_build_object('pid',v_pid,'title',v_product->>'title',
      'color',v_color_name,'qty',v_qty,'price',v_price,'img',v_img));
    v_subtotal:=v_subtotal+v_price*v_qty;
  end loop;

  for v_stock_line in
    select e.value->>'pid' as pid,sum((e.value->>'qty')::integer)::integer as qty
    from jsonb_array_elements(p_payload->'items') e(value)
    group by e.value->>'pid' order by e.value->>'pid'
  loop
    select st.qty into v_stock from public.stock st where st.pid=v_stock_line.pid for update;
    if not found or v_stock<v_stock_line.qty then raise exception 'موجودی یکی از کالاها کافی نیست؛ سبد را به‌روزرسانی کنید' using errcode='P0001'; end if;
  end loop;

  v_shipping_id:=nullif(trim(coalesce(p_payload->>'shipping','')),'');
  if v_shipping_id is null
     and jsonb_array_length(coalesce(v_site->'ship'->'methods','[]'::jsonb)) > 0 then
    raise exception 'لطفاً روش ارسال را انتخاب کنید' using errcode='22023';
  end if;
  if v_shipping_id is not null then
    select m.value into v_shipping from jsonb_array_elements(coalesce(v_site->'ship'->'methods','[]'::jsonb)) m(value)
      where m.value->>'id'=v_shipping_id and coalesce((m.value->>'on')::boolean,true) limit 1;
    if v_shipping is null then raise exception 'روش ارسال انتخاب‌شده معتبر یا فعال نیست' using errcode='22023'; end if;
    v_shipping_cost:=coalesce(nullif(v_shipping->>'price','')::numeric,0);
    if v_shipping_cost<0 or v_shipping_cost>100000000 then raise exception 'هزینه ارسال نامعتبر است' using errcode='22023'; end if;
  end if;

  v_coupon_code:=upper(trim(coalesce(p_payload->>'coupon','')));
  if v_coupon_code<>'' then
    select c.value into v_coupon from jsonb_array_elements(coalesce(v_site->'coupons','[]'::jsonb)) c(value)
      where upper(trim(coalesce(c.value->>'code','')))=v_coupon_code
        and coalesce((c.value->>'active')::boolean,false)
        and (coalesce(c.value->>'expires','')='' or
             ((c.value->>'expires') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and (c.value->>'expires')::date>=current_date))
      limit 1;
    if v_coupon is null then raise exception 'کد تخفیف معتبر یا فعال نیست' using errcode='22023'; end if;
    if coalesce(v_coupon->>'percent','') !~ '^[0-9]{1,2}$' then raise exception 'درصد تخفیف نامعتبر است' using errcode='22023'; end if;
    v_percent:=(v_coupon->>'percent')::integer;
    if v_percent<1 or v_percent>90 then raise exception 'درصد تخفیف خارج از محدوده مجاز است' using errcode='22023'; end if;
    v_discount:=floor(v_subtotal*v_percent/100);
  end if;
  v_total:=v_subtotal-v_discount+v_shipping_cost;
  if v_total<=0 or v_total>1000000000000 then raise exception 'مبلغ نهایی سفارش نامعتبر است' using errcode='22023'; end if;

  v_code:='SI'||upper(replace(pg_catalog.gen_random_uuid()::text,'-',''));
  v_created:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  v_order:=jsonb_build_object('id',pg_catalog.gen_random_uuid()::text,'code',v_code,'created',v_created,
    'name',v_name,'phone',v_phone,'address',v_address,'note',v_note,'status','new','payRef','',
    'total',v_total,'subtotal',v_subtotal,
    'ship',case when v_shipping is null then null else jsonb_build_object('id',v_shipping->>'id',
      'title',v_shipping->>'title','price',v_shipping_cost,'courier',coalesce((v_shipping->>'courier')::boolean,false)) end,
    'discount',v_discount,'coupon',case when v_coupon is null then null else jsonb_build_object('code',v_coupon->>'code','percent',v_percent) end,
    'reg',auth.uid() is not null,'items',v_items);
  insert into public.orders(code,data) values(v_code,v_order);
  return v_order;
end;
$function$


CREATE OR REPLACE FUNCTION public.pay_order(c text, r text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_headers jsonb; v_ip text; v_count integer;
begin
  if c is null or upper(trim(c)) !~ '^(SI[A-F0-9]{32}|K[0-9]{6})$' or r is null or length(trim(r)) not between 3 and 120 then return false; end if;
  v_headers:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
  v_ip:=coalesce(nullif(split_part(coalesce(v_headers->>'x-forwarded-for',v_headers->>'cf-connecting-ip',''),',',1),''),'unknown');
  if not private.consume_rate_limit('pay:'||md5(v_ip),10,600) then return false; end if;
  update public.orders set data=jsonb_set(jsonb_set(data,'{status}','"pending_review"'::jsonb),
    '{payRef}',to_jsonb(left(trim(r),120)))
    where code=upper(trim(c)) and data->>'status'='new';
  get diagnostics v_count=row_count;
  return v_count=1;
end;
$function$


CREATE OR REPLACE FUNCTION public.pm_list(p_uid text, p_tok text, p_channel text DEFAULT 'management'::text)
 RETURNS SETOF pm
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare h text;
begin
 if coalesce(p_uid,'')='' or coalesce(p_tok,'')='' then raise exception 'invalid credentials'; end if;
 if coalesce(p_channel,'management') not in ('management','ai') then raise exception 'invalid channel'; end if;
 h := encode(extensions.digest(p_tok,'sha256'),'hex');
 if not exists(select 1 from public.pm where uid=p_uid and tokh=h) then raise exception 'unauthorized'; end if;
 return query
 select p.id,p.uid,p.name,p.text,p.image,p.from_admin,p.tokh,p.created_at,p.ai_generated,p.needs_admin,p.reply_to_id,p.channel
 from public.pm p
 where p.uid=p_uid and p.channel=coalesce(p_channel,'management')
 order by p.id
 limit 300;
end;
$function$


CREATE OR REPLACE FUNCTION public.pm_list_auth(p_channel text DEFAULT 'management'::text)
 RETURNS SETOF pm
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_uid text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if coalesce(p_channel,'management') not in ('management','ai') then raise exception 'invalid_channel'; end if;
  select pm_uid into v_uid from public.pm_accounts where auth_user_id = auth.uid();
  if v_uid is null then raise exception 'account_not_registered'; end if;
  return query select p.* from public.pm p
    where p.uid = v_uid and p.channel = coalesce(p_channel,'management')
    order by p.id limit 300;
end;
$function$


CREATE OR REPLACE FUNCTION public.pm_register_account()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_uid text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select pm_uid into v_uid from public.pm_accounts where auth_user_id = auth.uid();
  if v_uid is not null then return v_uid; end if;
  v_uid := 'u' || replace(gen_random_uuid()::text, '-', '');
  insert into public.pm_accounts(auth_user_id, pm_uid) values(auth.uid(), v_uid)
  on conflict (auth_user_id) do update set auth_user_id = excluded.auth_user_id
  returning pm_uid into v_uid;
  return v_uid;
end;
$function$


CREATE OR REPLACE FUNCTION public.pm_send(p_uid text, p_tok text, p_name text, p_text text, p_image text DEFAULT NULL::text, p_channel text DEFAULT 'management'::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare h text; new_id bigint;
begin
 if coalesce(p_uid,'')='' or length(coalesce(p_tok,''))<16 then raise exception 'invalid credentials'; end if;
 if coalesce(p_channel,'management') not in ('management','ai') then raise exception 'invalid channel'; end if;
 if coalesce(nullif(trim(p_text),''),p_image) is null then raise exception 'empty message'; end if;
 h := encode(extensions.digest(p_tok,'sha256'),'hex');
 if not exists(select 1 from public.pm where uid=p_uid and tokh=h) then raise exception 'unauthorized'; end if;
 insert into public.pm(uid,name,text,image,from_admin,tokh,channel)
 values(p_uid,p_name,nullif(trim(p_text),''),p_image,false,h,coalesce(p_channel,'management'))
 returning id into new_id;
 return new_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.pm_send_auth(p_name text, p_text text, p_image text DEFAULT NULL::text, p_channel text DEFAULT 'management'::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_uid text; new_id bigint;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if coalesce(p_channel,'management') not in ('management','ai') then raise exception 'invalid_channel'; end if;
  if coalesce(nullif(trim(p_text),''),p_image) is null then raise exception 'empty_message'; end if;
  select pm_uid into v_uid from public.pm_accounts where auth_user_id = auth.uid();
  if v_uid is null then raise exception 'account_not_registered'; end if;
  insert into public.pm(uid,name,text,image,from_admin,tokh,channel)
  values(v_uid,left(coalesce(p_name,'مشتری'),100),nullif(trim(p_text),''),p_image,false,'auth:'||auth.uid()::text,coalesce(p_channel,'management'))
  returning id into new_id;
  return new_id;
end;
$function$


CREATE OR REPLACE FUNCTION public.sise_limit_guest_chat()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      $function$


CREATE OR REPLACE FUNCTION public.sise_otp_take_send(p_phone_hash text, p_ip_hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_allowed boolean := false;
begin
  insert into private.sise_otp_send_limits
    (phone_hash, last_sent_at, window_started_at, send_count)
  values
    ('p:' || p_phone_hash, now(), now(), 1)
  on conflict (phone_hash) do update
    set
      send_count = case
        when private.sise_otp_send_limits.window_started_at < now() - interval '24 hours' then 1
        else private.sise_otp_send_limits.send_count + 1
      end,
      window_started_at = case
        when private.sise_otp_send_limits.window_started_at < now() - interval '24 hours' then now()
        else private.sise_otp_send_limits.window_started_at
      end,
      last_sent_at = now()
    where
      private.sise_otp_send_limits.last_sent_at < now() - interval '60 seconds'
      and (
        private.sise_otp_send_limits.window_started_at < now() - interval '24 hours'
        or private.sise_otp_send_limits.send_count < 5
      )
  returning true into v_allowed;

  if not coalesce(v_allowed, false) then
    return false;
  end if;

  v_allowed := false;
  insert into private.sise_otp_send_limits
    (phone_hash, last_sent_at, window_started_at, send_count)
  values
    ('i:' || p_ip_hash, now(), now(), 1)
  on conflict (phone_hash) do update
    set
      send_count = case
        when private.sise_otp_send_limits.window_started_at < now() - interval '24 hours' then 1
        else private.sise_otp_send_limits.send_count + 1
      end,
      window_started_at = case
        when private.sise_otp_send_limits.window_started_at < now() - interval '24 hours' then now()
        else private.sise_otp_send_limits.window_started_at
      end,
      last_sent_at = now()
    where
      private.sise_otp_send_limits.last_sent_at < now() - interval '10 seconds'
      and (
        private.sise_otp_send_limits.window_started_at < now() - interval '24 hours'
        or private.sise_otp_send_limits.send_count < 20
      )
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$function$


CREATE OR REPLACE FUNCTION public.stock_on_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare it jsonb;
begin
  for it in select value from jsonb_array_elements(coalesce(new.data->'items','[]'::jsonb))
  loop
    update public.stock set qty=qty-(it->>'qty')::integer,updated_at=clock_timestamp() where pid=it->>'pid';
  end loop;
  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.stock_on_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare it jsonb; delta integer:=0;
begin
  if old.data->>'status' is distinct from 'canceled' and new.data->>'status'='canceled' then delta:=1;
  elsif old.data->>'status'='canceled' and new.data->>'status' is distinct from 'canceled' then delta:=-1;
  end if;
  if delta<>0 then
    for it in select value from jsonb_array_elements(coalesce(new.data->'items','[]'::jsonb))
    loop
      update public.stock set qty=greatest(0,qty+delta*(it->>'qty')::integer),updated_at=clock_timestamp()
      where pid=it->>'pid';
    end loop;
  end if;
  return new;
end;
$function$


CREATE OR REPLACE FUNCTION public.track_order(c text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_headers jsonb; v_ip text;
begin
  if c is null or upper(trim(c)) !~ '^(SI[A-F0-9]{32}|K[0-9]{6}|K[A-F0-9]{8})$' then return null; end if;
  v_headers:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
  v_ip:=coalesce(nullif(split_part(coalesce(v_headers->>'x-forwarded-for',v_headers->>'cf-connecting-ip',''),',',1),''),'unknown');
  if not private.consume_rate_limit('track:'||md5(v_ip),30,60) then return null; end if;
  return (
    select jsonb_build_object(
      'code',o.code,
      'status',o.data->>'status',
      'created',o.data->'created',
      'total',o.data->'total',
      'items',coalesce((
        select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
          'title',i->>'title','color',i->>'color','qty',i->'qty'
        )))
        from jsonb_array_elements(coalesce(o.data->'items','[]'::jsonb)) i
      ),'[]'::jsonb)
    )
    from public.orders o
    where o.code=upper(trim(c))
       or (upper(trim(c)) ~ '^K[A-F0-9]{8}$'
           and o.code ~ '^SI[A-F0-9]{32}$'
           and right(o.code,8)=substr(upper(trim(c)),2,8))
    order by o.created_at desc
    limit 1
  );
end;
$function$


-- RLS policies (admin UUID placeholders are fail-closed)
CREATE POLICY "chat admin delete" ON public.chat_messages AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = NULL::uuid));
CREATE POLICY "chat admin insert" ON public.chat_messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = NULL::uuid));
CREATE POLICY "chat admin update" ON public.chat_messages AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = NULL::uuid)) WITH CHECK ((auth.uid() = NULL::uuid));
CREATE POLICY "chat insert" ON public.chat_messages AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK ((is_admin = false));
CREATE POLICY "chat read" ON public.chat_messages AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "chat reactions public read" ON public.chat_reactions AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chat reads public read" ON public.chat_reads AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "draw admin delete" ON public.draw_entries AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = NULL::uuid));
CREATE POLICY "draw admin read" ON public.draw_entries AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = NULL::uuid));
CREATE POLICY "draw insert" ON public.draw_entries AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (((char_length(phone) = 11) AND (char_length(draw_id) <= 40)));
CREATE POLICY "orders admin" ON public.orders AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = NULL::uuid)) WITH CHECK ((auth.uid() = NULL::uuid));
CREATE POLICY pm_admin_all ON public.pm AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = NULL::uuid)) WITH CHECK ((auth.uid() = NULL::uuid));
CREATE POLICY "site read" ON public.site AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "site write" ON public.site AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = NULL::uuid)) WITH CHECK ((auth.uid() = NULL::uuid));
CREATE POLICY "stock admin delete" ON public.stock AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = NULL::uuid));
CREATE POLICY "stock admin insert" ON public.stock AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = NULL::uuid));
CREATE POLICY "stock admin update" ON public.stock AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = NULL::uuid)) WITH CHECK ((auth.uid() = NULL::uuid));
CREATE POLICY "stock read" ON public.stock AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "sn admin delete" ON public.stock_notify AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = NULL::uuid));
CREATE POLICY "sn admin read" ON public.stock_notify AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = NULL::uuid));
CREATE POLICY "sn insert" ON public.stock_notify AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (((char_length(phone) = 11) AND (char_length(pid) <= 40)));
CREATE POLICY "sc admin DELETE" ON public.story_comments AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = NULL::uuid));
CREATE POLICY "sc admin UPDATE" ON public.story_comments AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = NULL::uuid)) WITH CHECK ((auth.uid() = NULL::uuid));
CREATE POLICY "sc insert" ON public.story_comments AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "sc read" ON public.story_comments AS PERMISSIVE FOR SELECT TO public USING (true);
-- Application triggers
CREATE TRIGGER sise_guest_chat_rate_limit BEFORE INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION sise_limit_guest_chat();
CREATE TRIGGER stock_on_order_t AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION stock_on_order();
CREATE TRIGGER stock_on_status_t AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION stock_on_status();
-- Table grants
GRANT DELETE ON TABLE private.api_rate_limits TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE private.api_rate_limits TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE private.api_rate_limits TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE private.api_rate_limits TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE private.api_rate_limits TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE private.api_rate_limits TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE private.api_rate_limits TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE private.sise_otp_send_limits TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE private.sise_otp_send_limits TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE private.sise_otp_send_limits TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE private.sise_otp_send_limits TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE private.sise_otp_send_limits TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE private.sise_otp_send_limits TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE private.sise_otp_send_limits TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE private.sise_otp_send_limits TO service_role;
GRANT INSERT ON TABLE private.sise_otp_send_limits TO service_role;
GRANT SELECT ON TABLE private.sise_otp_send_limits TO service_role;
GRANT UPDATE ON TABLE private.sise_otp_send_limits TO service_role;
GRANT INSERT ON TABLE public.chat_messages TO anon;
GRANT DELETE ON TABLE public.chat_messages TO authenticated;
GRANT INSERT ON TABLE public.chat_messages TO authenticated;
GRANT UPDATE ON TABLE public.chat_messages TO authenticated;
GRANT DELETE ON TABLE public.chat_messages TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.chat_messages TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.chat_messages TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.chat_messages TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.chat_messages TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.chat_messages TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.chat_messages TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.chat_messages TO service_role;
GRANT INSERT ON TABLE public.chat_messages TO service_role;
GRANT REFERENCES ON TABLE public.chat_messages TO service_role;
GRANT SELECT ON TABLE public.chat_messages TO service_role;
GRANT TRIGGER ON TABLE public.chat_messages TO service_role;
GRANT TRUNCATE ON TABLE public.chat_messages TO service_role;
GRANT UPDATE ON TABLE public.chat_messages TO service_role;
GRANT SELECT ON TABLE public.chat_reactions TO anon;
GRANT SELECT ON TABLE public.chat_reactions TO authenticated;
GRANT DELETE ON TABLE public.chat_reactions TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.chat_reactions TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.chat_reactions TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.chat_reactions TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.chat_reactions TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.chat_reactions TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.chat_reactions TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.chat_reactions TO service_role;
GRANT INSERT ON TABLE public.chat_reactions TO service_role;
GRANT REFERENCES ON TABLE public.chat_reactions TO service_role;
GRANT SELECT ON TABLE public.chat_reactions TO service_role;
GRANT TRIGGER ON TABLE public.chat_reactions TO service_role;
GRANT TRUNCATE ON TABLE public.chat_reactions TO service_role;
GRANT UPDATE ON TABLE public.chat_reactions TO service_role;
GRANT SELECT ON TABLE public.chat_reads TO anon;
GRANT SELECT ON TABLE public.chat_reads TO authenticated;
GRANT DELETE ON TABLE public.chat_reads TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.chat_reads TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.chat_reads TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.chat_reads TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.chat_reads TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.chat_reads TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.chat_reads TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.chat_reads TO service_role;
GRANT INSERT ON TABLE public.chat_reads TO service_role;
GRANT REFERENCES ON TABLE public.chat_reads TO service_role;
GRANT SELECT ON TABLE public.chat_reads TO service_role;
GRANT TRIGGER ON TABLE public.chat_reads TO service_role;
GRANT TRUNCATE ON TABLE public.chat_reads TO service_role;
GRANT UPDATE ON TABLE public.chat_reads TO service_role;
GRANT INSERT ON TABLE public.draw_entries TO anon;
GRANT DELETE ON TABLE public.draw_entries TO authenticated;
GRANT INSERT ON TABLE public.draw_entries TO authenticated;
GRANT SELECT ON TABLE public.draw_entries TO authenticated;
GRANT DELETE ON TABLE public.draw_entries TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.draw_entries TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.draw_entries TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.draw_entries TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.draw_entries TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.draw_entries TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.draw_entries TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.draw_entries TO service_role;
GRANT INSERT ON TABLE public.draw_entries TO service_role;
GRANT REFERENCES ON TABLE public.draw_entries TO service_role;
GRANT SELECT ON TABLE public.draw_entries TO service_role;
GRANT TRIGGER ON TABLE public.draw_entries TO service_role;
GRANT TRUNCATE ON TABLE public.draw_entries TO service_role;
GRANT UPDATE ON TABLE public.draw_entries TO service_role;
GRANT SELECT ON TABLE public.orders TO authenticated;
GRANT UPDATE ON TABLE public.orders TO authenticated;
GRANT DELETE ON TABLE public.orders TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.orders TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.orders TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.orders TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.orders TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.orders TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.orders TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.orders TO service_role;
GRANT INSERT ON TABLE public.orders TO service_role;
GRANT REFERENCES ON TABLE public.orders TO service_role;
GRANT SELECT ON TABLE public.orders TO service_role;
GRANT TRIGGER ON TABLE public.orders TO service_role;
GRANT TRUNCATE ON TABLE public.orders TO service_role;
GRANT UPDATE ON TABLE public.orders TO service_role;
GRANT DELETE ON TABLE public.pm TO authenticated;
GRANT INSERT ON TABLE public.pm TO authenticated;
GRANT SELECT ON TABLE public.pm TO authenticated;
GRANT UPDATE ON TABLE public.pm TO authenticated;
GRANT DELETE ON TABLE public.pm TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.pm TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.pm TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.pm TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.pm TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.pm TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.pm TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.pm TO service_role;
GRANT INSERT ON TABLE public.pm TO service_role;
GRANT REFERENCES ON TABLE public.pm TO service_role;
GRANT SELECT ON TABLE public.pm TO service_role;
GRANT TRIGGER ON TABLE public.pm TO service_role;
GRANT TRUNCATE ON TABLE public.pm TO service_role;
GRANT UPDATE ON TABLE public.pm TO service_role;
GRANT DELETE ON TABLE public.pm_accounts TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.pm_accounts TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.pm_accounts TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.pm_accounts TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.pm_accounts TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.pm_accounts TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.pm_accounts TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.pm_accounts TO service_role;
GRANT INSERT ON TABLE public.pm_accounts TO service_role;
GRANT REFERENCES ON TABLE public.pm_accounts TO service_role;
GRANT SELECT ON TABLE public.pm_accounts TO service_role;
GRANT TRIGGER ON TABLE public.pm_accounts TO service_role;
GRANT TRUNCATE ON TABLE public.pm_accounts TO service_role;
GRANT UPDATE ON TABLE public.pm_accounts TO service_role;
GRANT SELECT ON TABLE public.site TO anon;
GRANT INSERT ON TABLE public.site TO authenticated;
GRANT SELECT ON TABLE public.site TO authenticated;
GRANT UPDATE ON TABLE public.site TO authenticated;
GRANT DELETE ON TABLE public.site TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.site TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.site TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.site TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.site TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.site TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.site TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.site TO service_role;
GRANT INSERT ON TABLE public.site TO service_role;
GRANT REFERENCES ON TABLE public.site TO service_role;
GRANT SELECT ON TABLE public.site TO service_role;
GRANT TRIGGER ON TABLE public.site TO service_role;
GRANT TRUNCATE ON TABLE public.site TO service_role;
GRANT UPDATE ON TABLE public.site TO service_role;
GRANT SELECT ON TABLE public.stock TO anon;
GRANT DELETE ON TABLE public.stock TO authenticated;
GRANT INSERT ON TABLE public.stock TO authenticated;
GRANT SELECT ON TABLE public.stock TO authenticated;
GRANT UPDATE ON TABLE public.stock TO authenticated;
GRANT DELETE ON TABLE public.stock TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.stock TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.stock TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.stock TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.stock TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.stock TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.stock TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.stock TO service_role;
GRANT INSERT ON TABLE public.stock TO service_role;
GRANT REFERENCES ON TABLE public.stock TO service_role;
GRANT SELECT ON TABLE public.stock TO service_role;
GRANT TRIGGER ON TABLE public.stock TO service_role;
GRANT TRUNCATE ON TABLE public.stock TO service_role;
GRANT UPDATE ON TABLE public.stock TO service_role;
GRANT INSERT ON TABLE public.stock_notify TO anon;
GRANT DELETE ON TABLE public.stock_notify TO authenticated;
GRANT INSERT ON TABLE public.stock_notify TO authenticated;
GRANT SELECT ON TABLE public.stock_notify TO authenticated;
GRANT DELETE ON TABLE public.stock_notify TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.stock_notify TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.stock_notify TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.stock_notify TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.stock_notify TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.stock_notify TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.stock_notify TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.stock_notify TO service_role;
GRANT INSERT ON TABLE public.stock_notify TO service_role;
GRANT REFERENCES ON TABLE public.stock_notify TO service_role;
GRANT SELECT ON TABLE public.stock_notify TO service_role;
GRANT TRIGGER ON TABLE public.stock_notify TO service_role;
GRANT TRUNCATE ON TABLE public.stock_notify TO service_role;
GRANT UPDATE ON TABLE public.stock_notify TO service_role;
GRANT INSERT ON TABLE public.story_comments TO anon;
GRANT SELECT ON TABLE public.story_comments TO anon;
GRANT DELETE ON TABLE public.story_comments TO authenticated;
GRANT INSERT ON TABLE public.story_comments TO authenticated;
GRANT SELECT ON TABLE public.story_comments TO authenticated;
GRANT UPDATE ON TABLE public.story_comments TO authenticated;
GRANT DELETE ON TABLE public.story_comments TO postgres WITH GRANT OPTION;
GRANT INSERT ON TABLE public.story_comments TO postgres WITH GRANT OPTION;
GRANT REFERENCES ON TABLE public.story_comments TO postgres WITH GRANT OPTION;
GRANT SELECT ON TABLE public.story_comments TO postgres WITH GRANT OPTION;
GRANT TRIGGER ON TABLE public.story_comments TO postgres WITH GRANT OPTION;
GRANT TRUNCATE ON TABLE public.story_comments TO postgres WITH GRANT OPTION;
GRANT UPDATE ON TABLE public.story_comments TO postgres WITH GRANT OPTION;
GRANT DELETE ON TABLE public.story_comments TO service_role;
GRANT INSERT ON TABLE public.story_comments TO service_role;
GRANT REFERENCES ON TABLE public.story_comments TO service_role;
GRANT SELECT ON TABLE public.story_comments TO service_role;
GRANT TRIGGER ON TABLE public.story_comments TO service_role;
GRANT TRUNCATE ON TABLE public.story_comments TO service_role;
GRANT UPDATE ON TABLE public.story_comments TO service_role;
-- Function EXECUTE grants
GRANT EXECUTE ON FUNCTION private.chat_mark_read_impl(p_ids bigint[], p_uid text, p_tok text) TO anon;
GRANT EXECUTE ON FUNCTION private.chat_mark_read_impl(p_ids bigint[], p_uid text, p_tok text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.chat_mark_read_impl(p_ids bigint[], p_uid text, p_tok text) TO postgres;
GRANT EXECUTE ON FUNCTION private.chat_react_impl(p_id bigint, p_uid text, p_tok text, p_emoji text) TO anon;
GRANT EXECUTE ON FUNCTION private.chat_react_impl(p_id bigint, p_uid text, p_tok text, p_emoji text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.chat_react_impl(p_id bigint, p_uid text, p_tok text, p_emoji text) TO postgres;
GRANT EXECUTE ON FUNCTION private.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer) TO postgres;
GRANT EXECUTE ON FUNCTION public.chat_delete(p_id bigint, p_uid text, p_tok text) TO anon;
GRANT EXECUTE ON FUNCTION public.chat_delete(p_id bigint, p_uid text, p_tok text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_delete(p_id bigint, p_uid text, p_tok text) TO postgres;
GRANT EXECUTE ON FUNCTION public.chat_delete(p_id bigint, p_uid text, p_tok text) TO service_role;
GRANT EXECUTE ON FUNCTION public.chat_edit(p_id bigint, p_uid text, p_tok text, p_text text) TO anon;
GRANT EXECUTE ON FUNCTION public.chat_edit(p_id bigint, p_uid text, p_tok text, p_text text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_edit(p_id bigint, p_uid text, p_tok text, p_text text) TO postgres;
GRANT EXECUTE ON FUNCTION public.chat_edit(p_id bigint, p_uid text, p_tok text, p_text text) TO service_role;
GRANT EXECUTE ON FUNCTION public.chat_mark_read(p_ids bigint[], p_uid text, p_tok text) TO anon;
GRANT EXECUTE ON FUNCTION public.chat_mark_read(p_ids bigint[], p_uid text, p_tok text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_mark_read(p_ids bigint[], p_uid text, p_tok text) TO postgres;
GRANT EXECUTE ON FUNCTION public.chat_mark_read(p_ids bigint[], p_uid text, p_tok text) TO service_role;
GRANT EXECUTE ON FUNCTION public.chat_react(p_id bigint, p_uid text, p_tok text, p_emoji text) TO anon;
GRANT EXECUTE ON FUNCTION public.chat_react(p_id bigint, p_uid text, p_tok text, p_emoji text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_react(p_id bigint, p_uid text, p_tok text, p_emoji text) TO postgres;
GRANT EXECUTE ON FUNCTION public.chat_react(p_id bigint, p_uid text, p_tok text, p_emoji text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_order(p_payload jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_order(p_payload jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(p_payload jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.create_order(p_payload jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.pay_order(c text, r text) TO anon;
GRANT EXECUTE ON FUNCTION public.pay_order(c text, r text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pay_order(c text, r text) TO postgres;
GRANT EXECUTE ON FUNCTION public.pay_order(c text, r text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pm_list(p_uid text, p_tok text, p_channel text) TO postgres;
GRANT EXECUTE ON FUNCTION public.pm_list(p_uid text, p_tok text, p_channel text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pm_list_auth(p_channel text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pm_list_auth(p_channel text) TO postgres;
GRANT EXECUTE ON FUNCTION public.pm_list_auth(p_channel text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pm_register_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pm_register_account() TO postgres;
GRANT EXECUTE ON FUNCTION public.pm_register_account() TO service_role;
GRANT EXECUTE ON FUNCTION public.pm_send(p_uid text, p_tok text, p_name text, p_text text, p_image text, p_channel text) TO postgres;
GRANT EXECUTE ON FUNCTION public.pm_send(p_uid text, p_tok text, p_name text, p_text text, p_image text, p_channel text) TO service_role;
GRANT EXECUTE ON FUNCTION public.pm_send_auth(p_name text, p_text text, p_image text, p_channel text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pm_send_auth(p_name text, p_text text, p_image text, p_channel text) TO postgres;
GRANT EXECUTE ON FUNCTION public.pm_send_auth(p_name text, p_text text, p_image text, p_channel text) TO service_role;
GRANT EXECUTE ON FUNCTION public.sise_limit_guest_chat() TO postgres;
GRANT EXECUTE ON FUNCTION public.sise_limit_guest_chat() TO service_role;
GRANT EXECUTE ON FUNCTION public.sise_otp_take_send(p_phone_hash text, p_ip_hash text) TO postgres;
GRANT EXECUTE ON FUNCTION public.sise_otp_take_send(p_phone_hash text, p_ip_hash text) TO service_role;
GRANT EXECUTE ON FUNCTION public.stock_on_order() TO postgres;
GRANT EXECUTE ON FUNCTION public.stock_on_order() TO service_role;
GRANT EXECUTE ON FUNCTION public.stock_on_status() TO postgres;
GRANT EXECUTE ON FUNCTION public.stock_on_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.track_order(c text) TO anon;
GRANT EXECUTE ON FUNCTION public.track_order(c text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_order(c text) TO postgres;
GRANT EXECUTE ON FUNCTION public.track_order(c text) TO service_role;
