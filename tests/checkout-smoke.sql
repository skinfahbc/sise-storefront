-- Add a historical order using the six-digit legacy tracking format.
-- The insert is performed as the fixture owner, not through the public API.
insert into public.orders(code,data)
values ('K123456', jsonb_build_object(
  'status','new',
  'created',floor(extract(epoch from clock_timestamp())*1000)::bigint,
  'total',100,
  'items','[]'::jsonb
));

set role anon;
do $$
declare
  v_order jsonb;
  v_code text;
  v_track jsonb;
  v_qty integer;
  v_payload jsonb;
  i integer;
begin
  v_payload := jsonb_build_object(
    'customer',jsonb_build_object('name','Test Customer','phone','09123456789','address','Test address 123','note',''),
    'items',jsonb_build_array(jsonb_build_object('pid','p1','color','black','qty',2)),
    'coupon','SAVE10',
    'shipping','post'
  );
  v_order := public.create_order(v_payload);
  if (v_order->>'subtotal')::numeric <> 2000 then raise exception 'subtotal mismatch'; end if;
  if (v_order->>'discount')::numeric <> 200 then raise exception 'discount mismatch'; end if;
  if (v_order->>'total')::numeric <> 1900 then raise exception 'total mismatch'; end if;
  if v_order->>'code' !~ '^SI[A-F0-9]{32}$' then raise exception 'tracking code format mismatch'; end if;
  v_code := v_order->>'code';

  select qty into v_qty from public.stock where pid='p1';
  if v_qty <> 3 then raise exception 'stock was not decremented'; end if;

  if public.pay_order(v_code,'TEST-REF-123') is not true then raise exception 'pay_order failed'; end if;
  v_track := public.track_order(v_code);
  if v_track->>'status' <> 'pending_review' then raise exception 'tracking status mismatch'; end if;
  if v_track ? 'address' or v_track ? 'phone' then raise exception 'tracking leaks personal data'; end if;

  v_track := public.track_order('K123456');
  if v_track->>'code' <> 'K123456' or v_track->>'status' <> 'new' then
    raise exception 'legacy six-digit order tracking failed';
  end if;

  begin
    perform public.create_order(v_payload || jsonb_build_object('shipping',null));
    raise exception 'missing shipping method unexpectedly accepted';
  exception when sqlstate '22023' then
    null;
  end;

  begin
    perform public.create_order(jsonb_set(v_payload,'{items,0,qty}','4'::jsonb));
    raise exception 'insufficient stock unexpectedly accepted' using errcode='ZX001';
  exception when sqlstate 'P0001' then
    null;
  end;

  if has_table_privilege('anon','public.orders','INSERT') then
    raise exception 'anon can still insert orders directly';
  end if;
  if has_column_privilege('anon','public.chat_messages','tokh','SELECT') then
    raise exception 'anon can read chat token hashes';
  end if;
  if not has_column_privilege('anon','public.chat_messages','tokh','INSERT') then
    raise exception 'anon cannot submit chat token hashes';
  end if;

  if not has_sequence_privilege('anon','public.chat_messages_id_seq','USAGE')
     or not has_sequence_privilege('anon','public.draw_entries_id_seq','USAGE')
     or not has_sequence_privilege('anon','public.stock_notify_id_seq','USAGE') then
    raise exception 'guest insert sequence privileges are incomplete';
  end if;

  insert into public.story_comments(story_id,name,text)
  values ('smoke-story','Guest','Smoke test comment');

  for i in 1..8 loop
    insert into public.chat_messages(uid,name,text,is_admin,tokh)
    values ('smoke-guest','Guest','Smoke message',false,repeat('x',64));
  end loop;
  begin
    insert into public.chat_messages(uid,name,text,is_admin,tokh)
    values ('smoke-guest','Guest','Ninth message',false,repeat('x',64));
    raise exception 'chat rate limit did not block the ninth message' using errcode='ZX002';
  exception when sqlstate 'P0001' then
    null;
  end;
end;
$$;
reset role;
