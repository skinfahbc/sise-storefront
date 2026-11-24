-- SISE Accounting Foundation
-- SISE Accounting Foundation — additive production migration.
-- Currency convention: all *_irr amounts are integer Iranian rials.
-- Current storefront data.store.currency is "تومان"; source website amounts normalize at 10 IRR per toman.
-- This migration intentionally does NOT alter existing orders/stock triggers or write to production.

begin;

create sequence if not exists public.accounting_sku_seq start with 1 increment by 1;

create table if not exists public.accounting_products (
  id uuid primary key default gen_random_uuid(),
  product_id text not null unique, -- canonical public.site.data.products[].id
  sku text not null unique default ('SISE-' || lpad(nextval('public.accounting_sku_seq')::text, 6, '0')),
  product_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounting_parties (
  id uuid primary key default gen_random_uuid(),
  party_type text not null check (party_type in ('customer','supplier','both')),
  display_name text not null,
  phone text,
  national_id text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  account_code text not null unique,
  account_name text not null,
  account_type text not null check (account_type in ('asset','liability','equity','revenue','expense')),
  parent_id uuid references public.chart_of_accounts(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  account_name text not null unique,
  account_kind text not null check (account_kind in ('cash','bank')),
  ledger_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  opening_balance_irr bigint not null default 0,
  opening_balance_entered boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  supplier_id uuid references public.accounting_parties(id) on delete restrict,
  invoice_date date not null default current_date,
  due_date date,
  subtotal_irr bigint not null default 0 check (subtotal_irr >= 0),
  discount_irr bigint not null default 0 check (discount_irr >= 0),
  total_irr bigint not null default 0 check (total_irr >= 0),
  paid_irr bigint not null default 0 check (paid_irr >= 0),
  status text not null default 'draft' check (status in ('draft','posted','void')),
  notes text,
  created_at timestamptz not null default now(),
  check (paid_irr <= total_irr)
);

create table if not exists public.purchase_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.purchase_invoices(id) on delete restrict,
  product_id uuid not null references public.accounting_products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_cost_irr bigint not null check (unit_cost_irr >= 0),
  line_total_irr bigint not null check (line_total_irr >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.sales_documents (
  id uuid primary key default gen_random_uuid(),
  document_number text not null unique,
  channel text not null default 'pos' check (channel in ('pos')),
  customer_id uuid references public.accounting_parties(id) on delete restrict,
  document_date timestamptz not null default now(),
  subtotal_irr bigint not null default 0 check (subtotal_irr >= 0),
  discount_irr bigint not null default 0 check (discount_irr >= 0),
  total_irr bigint not null default 0 check (total_irr >= 0),
  received_irr bigint not null default 0 check (received_irr >= 0),
  status text not null default 'draft' check (status in ('draft','posted','void')),
  notes text,
  created_at timestamptz not null default now(),
  check (received_irr <= total_irr)
);

create table if not exists public.sales_document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.sales_documents(id) on delete restrict,
  product_id uuid not null references public.accounting_products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_irr bigint not null check (unit_price_irr >= 0),
  unit_cost_irr bigint not null default 0 check (unit_cost_irr >= 0),
  line_total_irr bigint not null check (line_total_irr >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.accounting_products(id) on delete restrict,
  movement_type text not null check (movement_type in ('purchase_in','pos_out','sale_return_in','purchase_return_out','adjustment_in','adjustment_out')),
  quantity_delta integer not null check (quantity_delta <> 0),
  unit_cost_irr bigint not null default 0 check (unit_cost_irr >= 0),
  source_type text not null,
  source_id text not null,
  source_line_id uuid,
  note text,
  created_at timestamptz not null default now(),
  unique (source_type, source_id, source_line_id)
);

create table if not exists public.accounting_postings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  order_code text not null,
  source_amount bigint not null check (source_amount >= 0),
  source_unit text not null check (source_unit in ('toman','rial')),
  conversion_factor numeric(12,4) not null check (conversion_factor > 0),
  amount_irr bigint not null check (amount_irr >= 0),
  payment_verified_at timestamptz,
  status text not null default 'pending_verification' check (status in ('pending_verification','posted','reversed')),
  journal_entry_id uuid,
  created_at timestamptz not null default now(),
  posted_at timestamptz
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_number text not null unique,
  entry_date timestamptz not null default now(),
  description text not null,
  source_type text,
  source_id text,
  status text not null default 'draft' check (status in ('draft','posted','reversed')),
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  unique (source_type, source_id)
);

create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete restrict,
  account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  party_id uuid references public.accounting_parties(id) on delete restrict,
  debit_irr bigint not null default 0 check (debit_irr >= 0),
  credit_irr bigint not null default 0 check (credit_irr >= 0),
  memo text,
  created_at timestamptz not null default now(),
  check ((debit_irr > 0 and credit_irr = 0) or (credit_irr > 0 and debit_irr = 0))
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  cash_account_id uuid not null references public.cash_accounts(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('receipt','payment','transfer_in','transfer_out')),
  amount_irr bigint not null check (amount_irr > 0),
  transaction_date timestamptz not null default now(),
  description text not null,
  party_id uuid references public.accounting_parties(id) on delete restrict,
  journal_entry_id uuid references public.journal_entries(id) on delete restrict,
  transfer_group_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.accounting_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_number text not null unique,
  expense_date date not null default current_date,
  category text not null,
  description text not null,
  amount_irr bigint not null check (amount_irr > 0),
  party_id uuid references public.accounting_parties(id) on delete restrict,
  cash_account_id uuid references public.cash_accounts(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','posted','void')),
  journal_entry_id uuid references public.journal_entries(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.accounting_audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.accounting_products enable row level security;
alter table public.accounting_parties enable row level security;
alter table public.chart_of_accounts enable row level security;
alter table public.cash_accounts enable row level security;
alter table public.purchase_invoices enable row level security;
alter table public.purchase_invoice_items enable row level security;
alter table public.sales_documents enable row level security;
alter table public.sales_document_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.accounting_postings enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.accounting_expenses enable row level security;
alter table public.accounting_audit_logs enable row level security;

create index if not exists accounting_parties_phone_idx on public.accounting_parties(phone);
create index if not exists purchase_invoices_date_idx on public.purchase_invoices(invoice_date);
create index if not exists sales_documents_date_idx on public.sales_documents(document_date);
create index if not exists inventory_movements_product_date_idx on public.inventory_movements(product_id, created_at desc);
create index if not exists journal_entries_date_idx on public.journal_entries(entry_date);
create index if not exists journal_lines_entry_idx on public.journal_lines(journal_entry_id);
create index if not exists cash_transactions_account_date_idx on public.cash_transactions(cash_account_id, transaction_date desc);
create index if not exists accounting_expenses_date_idx on public.accounting_expenses(expense_date);

-- Initial mapping only: preserves the storefront's existing product IDs.
-- SKU values are generated independently and do not replace canonical product IDs.
insert into public.accounting_products (product_id, product_name)
select p->>'id', p->>'title'
from public.site s
cross join lateral jsonb_array_elements(coalesce(s.data->'products','[]'::jsonb)) p
where s.id = 'main'
  and nullif(p->>'id','') is not null
  and nullif(p->>'title','') is not null
on conflict (product_id) do update
set product_name = excluded.product_name,
    updated_at = now();

comment on table public.accounting_postings is
'Website order accounting bridge. Import only after server-side payment verification. Existing website stock triggers remain authoritative.';
comment on column public.accounting_postings.source_amount is
'Original order amount in source_unit. Current SISE storefront is configured in toman.';
comment on column public.accounting_postings.amount_irr is
'Normalized integer Iranian rials. For current SISE toman source amounts use conversion_factor=10.';
comment on table public.inventory_movements is
'Append-only inventory ledger. Website order stock decrement is not repeated here.';


alter table public.accounting_postings
  add constraint accounting_postings_journal_entry_fk
  foreign key (journal_entry_id) references public.journal_entries(id) on delete restrict;

create or replace function public.accounting_post_journal_entry(p_entry_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_line_count bigint;
  v_debit bigint;
  v_credit bigint;
begin
  select count(*), coalesce(sum(debit_irr),0), coalesce(sum(credit_irr),0)
    into v_line_count, v_debit, v_credit
  from public.journal_lines
  where journal_entry_id = p_entry_id;

  if v_line_count < 2 then
    raise exception 'A journal entry requires at least two lines';
  end if;
  if v_debit <> v_credit then
    raise exception 'Journal entry is not balanced: debit %, credit %', v_debit, v_credit;
  end if;

  update public.journal_entries
  set status = 'posted', posted_at = now()
  where id = p_entry_id and status = 'draft';

  if not found then
    raise exception 'Journal entry does not exist or is not in draft status';
  end if;
end;
$function$;

revoke all on function public.accounting_post_journal_entry(uuid) from public, anon, authenticated;
grant execute on function public.accounting_post_journal_entry(uuid) to service_role;



create index if not exists accounting_purchase_items_invoice_idx on public.purchase_invoice_items(invoice_id);
create index if not exists accounting_purchase_items_product_idx on public.purchase_invoice_items(product_id);
create index if not exists accounting_sales_items_document_idx on public.sales_document_items(document_id);
create index if not exists accounting_sales_items_product_idx on public.sales_document_items(product_id);
create index if not exists accounting_postings_journal_idx on public.accounting_postings(journal_entry_id);
create index if not exists accounting_journal_lines_account_idx on public.journal_lines(account_id);
create index if not exists accounting_journal_lines_party_idx on public.journal_lines(party_id);
create index if not exists accounting_cash_tx_journal_idx on public.cash_transactions(journal_entry_id);
create index if not exists accounting_cash_tx_party_idx on public.cash_transactions(party_id);
create index if not exists accounting_expenses_party_idx on public.accounting_expenses(party_id);
create index if not exists accounting_expenses_cash_idx on public.accounting_expenses(cash_account_id);

grant select, insert, update, delete on
  public.accounting_products, public.accounting_parties, public.chart_of_accounts,
  public.cash_accounts, public.purchase_invoices, public.purchase_invoice_items,
  public.sales_documents, public.sales_document_items, public.inventory_movements,
  public.accounting_postings, public.journal_entries, public.journal_lines,
  public.cash_transactions, public.accounting_expenses
to authenticated;
grant select on public.accounting_audit_logs to authenticated;
grant usage, select on sequence public.accounting_sku_seq to authenticated;

do $policies$
declare t text;
begin
  foreach t in array array[
    'accounting_products','accounting_parties','chart_of_accounts','cash_accounts',
    'purchase_invoices','purchase_invoice_items','sales_documents','sales_document_items',
    'inventory_movements','accounting_postings','journal_entries','journal_lines',
    'cash_transactions','accounting_expenses'
  ] loop
    execute format('create policy sise_accounting_manager_all on public.%I for all to authenticated using ((select auth.uid()) = ''7a52dd4c-f75a-4e1c-9b49-230b84c4fec8''::uuid) with check ((select auth.uid()) = ''7a52dd4c-f75a-4e1c-9b49-230b84c4fec8''::uuid)', t);
  end loop;
end
$policies$;

create policy sise_accounting_audit_manager_read
on public.accounting_audit_logs for select to authenticated
using ((select auth.uid()) = '7a52dd4c-f75a-4e1c-9b49-230b84c4fec8'::uuid);

insert into public.chart_of_accounts(account_code,account_name,account_type) values
 ('1000','دارایی‌های جاری','asset'),('1010','صندوق اصلی','asset'),('1020','بانک اصلی','asset'),
 ('1100','حساب‌های دریافتنی','asset'),('1200','موجودی کالا','asset'),('2000','بدهی‌های جاری','liability'),
 ('2010','حساب‌های پرداختنی','liability'),('3000','سرمایه','equity'),('4000','فروش کالا','revenue'),
 ('4010','برگشت از فروش','revenue'),('5000','بهای تمام‌شده کالای فروش‌رفته','expense'),
 ('6000','هزینه‌های اداری و عمومی','expense'),('6010','هزینه ارسال','expense'),('6020','هزینه بسته‌بندی','expense'),
 ('6030','هزینه تبلیغات','expense'),('6040','کارمزد درگاه و بانکی','expense'),('6050','سایر هزینه‌ها','expense'),
 ('7000','سایر درآمدها','revenue'),('8000','سود و زیان انباشته','equity')
on conflict (account_code) do nothing;

insert into public.cash_accounts(account_name,account_kind,ledger_account_id,opening_balance_irr,opening_balance_entered)
select 'صندوق اصلی','cash',id,0,false from public.chart_of_accounts where account_code='1010'
on conflict (account_name) do nothing;
insert into public.cash_accounts(account_name,account_kind,ledger_account_id,opening_balance_irr,opening_balance_entered)
select 'بانک اصلی','bank',id,0,false from public.chart_of_accounts where account_code='1020'
on conflict (account_name) do nothing;

commit;
