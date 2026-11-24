create index if not exists accounting_expenses_journal_idx on public.accounting_expenses(journal_entry_id);
create index if not exists cash_accounts_ledger_account_idx on public.cash_accounts(ledger_account_id);
create index if not exists chart_of_accounts_parent_idx on public.chart_of_accounts(parent_id);
create index if not exists purchase_invoices_supplier_idx on public.purchase_invoices(supplier_id);
create index if not exists sales_documents_customer_idx on public.sales_documents(customer_id);
