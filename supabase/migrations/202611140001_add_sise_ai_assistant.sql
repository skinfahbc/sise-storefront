alter table public.pm
  add column if not exists ai_generated boolean not null default false,
  add column if not exists needs_admin boolean not null default false,
  add column if not exists reply_to_id bigint null references public.pm(id) on delete set null;

create unique index if not exists pm_one_ai_reply_per_message
  on public.pm(reply_to_id)
  where ai_generated = true and reply_to_id is not null;

create or replace function public.pm_list(p_uid text, p_tok text)
returns setof public.pm
language plpgsql
security definer
set search_path = ''
as $function$
declare
  h text;
begin
  if p_uid is null or p_tok is null then
    return;
  end if;
  h := encode(extensions.digest(p_tok, 'sha256'), 'hex');
  if not exists (
    select 1 from public.pm
    where uid = p_uid and tokh = h
  ) then
    return;
  end if;
  return query
    select p.id, p.uid, p.name, p.text, p.image, p.from_admin, null::text, p.created_at,
           p.ai_generated, p.needs_admin, p.reply_to_id
    from public.pm p
    where p.uid = p_uid
    order by p.id
    limit 300;
end
$function$;
