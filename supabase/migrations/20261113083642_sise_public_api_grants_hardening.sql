-- SISE public Data API least-privilege hardening.
-- Applied to project vwprdviufqukdvcroynt as migration
-- 20261113083642_sise_public_api_grants_hardening.
--
-- Preserve only the permissions required by the storefront and admin UI.
-- RLS remains enabled on all public tables.

revoke all privileges on all tables in schema public from anon, authenticated;

do $$
declare r record; cols text;
begin
  for r in
    select table_name from information_schema.tables
    where table_schema='public' and table_type='BASE TABLE'
  loop
    select string_agg(format('%I', column_name), ', ' order by ordinal_position)
      into cols
    from information_schema.columns
    where table_schema='public' and table_name=r.table_name;
    if cols is not null then
      execute format(
        'revoke all privileges (%s) on table public.%I from anon, authenticated',
        cols, r.table_name
      );
    end if;
  end loop;
end $$;

-- Public storefront reads.
grant select on table public.site, public.stock, public.story_comments to anon;

-- Chat is public, but never expose the private token hash column.
grant select (id, uid, name, avatar, text, created_at, image, is_admin, edited, reply_to, rname, rtext)
  on table public.chat_messages to anon, authenticated;

-- Guest-facing inserts.
grant insert on table public.chat_messages, public.draw_entries, public.stock_notify, public.story_comments to anon;

-- Admin reads (chat remains column-restricted above).
grant select on table public.site, public.stock, public.orders,
  public.draw_entries, public.stock_notify, public.story_comments to authenticated;

-- Admin writes, still restricted by the existing RLS policies.
grant insert, update on table public.site to authenticated;
grant insert, update, delete on table public.stock to authenticated;
grant update on table public.orders to authenticated;
grant insert, update, delete on table public.chat_messages to authenticated;
grant insert, delete on table public.draw_entries to authenticated;
grant insert, delete on table public.stock_notify to authenticated;
grant insert, update, delete on table public.story_comments to authenticated;

-- Identity sequences: USAGE only, not direct sequence modification.
revoke all privileges on all sequences in schema public from anon, authenticated;
grant usage on sequence public.chat_messages_id_seq,
  public.draw_entries_id_seq, public.stock_notify_id_seq to anon, authenticated;

-- Enable the authenticated admin's existing story-comment edit action.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='story_comments'
      and policyname='sc admin UPDATE'
  ) then
    create policy "sc admin UPDATE" on public.story_comments
      for update to authenticated
      using (auth.uid() = '7a52dd4c-f75a-4e1c-9b49-230b84c4fec8'::uuid)
      with check (auth.uid() = '7a52dd4c-f75a-4e1c-9b49-230b84c4fec8'::uuid);
  end if;
end $$;

-- New objects created by the postgres migration owner are not public by default.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
