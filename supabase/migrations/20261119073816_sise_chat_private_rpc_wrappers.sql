begin;

grant usage on schema private to anon, authenticated;

create or replace function private.chat_react_impl(p_id bigint, p_uid text, p_tok text, p_emoji text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
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
$$;

create or replace function private.chat_mark_read_impl(p_ids bigint[], p_uid text, p_tok text)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
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
$$;

revoke all on function private.chat_react_impl(bigint, text, text, text) from public;
revoke all on function private.chat_mark_read_impl(bigint[], text, text) from public;
grant execute on function private.chat_react_impl(bigint, text, text, text) to anon, authenticated;
grant execute on function private.chat_mark_read_impl(bigint[], text, text) to anon, authenticated;

create or replace function public.chat_react(p_id bigint, p_uid text, p_tok text, p_emoji text)
returns text
language sql
security invoker
set search_path = pg_catalog, public
as $$
  select private.chat_react_impl(p_id, p_uid, p_tok, p_emoji);
$$;

create or replace function public.chat_mark_read(p_ids bigint[], p_uid text, p_tok text)
returns integer
language sql
security invoker
set search_path = pg_catalog, public
as $$
  select private.chat_mark_read_impl(p_ids, p_uid, p_tok);
$$;

revoke all on function public.chat_react(bigint, text, text, text) from public;
revoke all on function public.chat_mark_read(bigint[], text, text) from public;
grant execute on function public.chat_react(bigint, text, text, text) to anon, authenticated;

commit;