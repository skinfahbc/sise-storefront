-- SISE secure checkout and public order RPC hardening.
-- Phase 1 of staged rollout: safe to apply before frontend deployment; direct inserts remain temporarily enabled.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.api_rate_limits (
  rate_key text primary key,
  window_started timestamptz not null,
  hits integer not null check (hits >= 0)
);
revoke all on table private.api_rate_limits from public, anon, authenticated;

create or replace function private.consume_rate_limit(p_key text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path=''
as $$
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
$$;
revoke all on function private.consume_rate_limit(text,integer,integer) from public,anon,authenticated;

create index if not exists orders_phone_created_idx on public.orders ((data->>'phone'),created_at desc);
create or replace function public.create_order(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
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
$$;
revoke all on function public.create_order(jsonb) from public,anon,authenticated;
grant execute on function public.create_order(jsonb) to anon,authenticated;

drop function if exists public.pay_order(text,text);
create or replace function public.pay_order(c text,r text)
returns boolean language plpgsql security definer set search_path=''
as $$
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
$$;
revoke all on function public.pay_order(text,text) from public,anon,authenticated;
grant execute on function public.pay_order(text,text) to anon,authenticated;

create or replace function public.track_order(c text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_headers jsonb; v_ip text;
begin
  if c is null or upper(trim(c)) !~ '^(SI[A-F0-9]{32}|K[0-9]{6})$' then return null; end if;
  v_headers:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
  v_ip:=coalesce(nullif(split_part(coalesce(v_headers->>'x-forwarded-for',v_headers->>'cf-connecting-ip',''),',',1),''),'unknown');
  if not private.consume_rate_limit('track:'||md5(v_ip),30,60) then return null; end if;
  return (select jsonb_build_object('code',o.code,'status',o.data->>'status','created',o.data->'created',
    'total',o.data->'total','items',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'title',i->>'title','color',i->>'color','qty',i->'qty')))
      from jsonb_array_elements(coalesce(o.data->'items','[]'::jsonb)) i),'[]'::jsonb))
    from public.orders o where o.code=upper(trim(c)) limit 1);
end;
$$;
revoke all on function public.track_order(text) from public,anon,authenticated;
grant execute on function public.track_order(text) to anon,authenticated;

create or replace function public.stock_on_order()
returns trigger language plpgsql security definer set search_path=''
as $$
declare it jsonb;
begin
  for it in select value from jsonb_array_elements(coalesce(new.data->'items','[]'::jsonb))
  loop
    update public.stock set qty=qty-(it->>'qty')::integer,updated_at=clock_timestamp() where pid=it->>'pid';
  end loop;
  return new;
end;
$$;
revoke all on function public.stock_on_order() from public,anon,authenticated;

create or replace function public.stock_on_status()
returns trigger language plpgsql security definer set search_path=''
as $$
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
$$;
revoke all on function public.stock_on_status() from public,anon,authenticated;
