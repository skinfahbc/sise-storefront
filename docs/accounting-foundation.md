# SISE Accounting Foundation

## Currency decision (confirmed)
- Accounting ledger and every financial report are denominated in **Iranian rial (IRR)**.
- Read-only inspection of `public.site` confirms the current storefront display currency is `تومان`.
- Current catalogue prices and existing order totals are therefore treated as source amounts in toman, and the accounting import normalization is **10 IRR per 1 toman**.
- Preserve the original source amount and source unit in imported website-order records; store the normalized ledger amount as integer IRR. Never change existing storefront prices or the live store currency as part of this accounting work.
- Before the first live import, validate the amount-unit convention with a real settled payment reconciliation; do not infer paid status from shipping status.

## Scope and safety
This work is isolated on `feature/sise-accounting-foundation`. The live Supabase project was inspected read-only. No schema, policy, trigger, data, or production storefront changes have been made. The HTML preview uses sample figures, now displayed in IRR.

## Confirmed current SISE data model
- Supabase project: `vwprdviufqukdvcroynt` (production; do not use for experimental DDL).
- `public.site`: one row; storefront content is in JSONB `data`. Product catalogue is `data.products`.
- Existing product JSON keys: `id`, `title`, `desc`, `price`, `oldPrice`, `cat`, `badge`, `images`, `colors`, `stock`.
- Existing storefront setting: `data.store.currency = 'تومان'`.
- All 8 current catalogue products have a matching row in `public.stock`.
- `public.stock`: `pid` (primary key), `qty` (non-negative integer), `updated_at`.
- `public.orders`: UUID `id`, unique text `code`, JSONB `data`, `created_at`.
- Order JSON keys include `id`, `code`, `items`, `total`, `subtotal`, `discount`, `coupon`, `ship`, `status`, `payRef`, and customer/shipping fields.
- Order line JSON keys include `pid`, `title`, `price`, `qty`, `color`, and `img`.
- Observed statuses include `new`, `paid`, and `shipped`. The storefront currently shows a note that automated payment verification needs a server-side callback/verification service. Do not treat `shipped` as proof of payment; require a verified payment event before revenue posting.
- Existing triggers: `stock_on_order_t` runs after order insert and decrements stock for each order item. `stock_on_status_t` restores stock when status becomes `canceled` and deducts again when leaving `canceled`. Accounting must not decrement website stock a second time.

## Design principles
1. Keep existing `site.data.products[].id` as canonical product identity; map it to accounting records. Never create duplicate catalogue products.
2. Generate a separate human-friendly SKU such as `SISE-000001`; preserve the current product ID as the integration key.
3. Use one central warehouse for the first release.
4. Use an append-only inventory movement ledger. Purchases, POS sales, approved adjustments, and returns create movements.
5. Use existing `orders` as the website sales source. Add an idempotent posting record keyed by order UUID so retries cannot post twice.
6. Website orders in `new` are not revenue. Only a verified payment event may post revenue. A `paid` string or non-empty `payRef` alone must be checked against the payment provider's verification record.
7. Do not make a second stock deduction for website orders: the existing order trigger already owns stock decrement/reservation behavior. Accounting records COGS and journal entries separately and reconciles stock.
8. In-person sales are entered through the accounting/POS panel and create their own sale document and stock movement.
9. Use double-entry journal entries; every posted journal entry must balance (debits = credits).
10. Archive products rather than hard-delete them when referenced by orders, invoices, or inventory history.
11. Enable RLS on all new exposed tables. No browser service-role credentials. Role policies must match the verified admin auth model.
12. Store all ledger money amounts as integer IRR. Preserve original source amounts and source units for imported website orders; normalize toman to IRR at 10:1.

## Proposed modules
- Product mapping and SKU registry
- Central warehouse and inventory movements
- Purchase invoices and supplier balances
- Website sales synchronization (idempotent; verified paid only)
- POS / in-person sales
- Cash and bank accounts, receipts, payments, and transfers
- Customers, suppliers, debtors, and creditors
- Income and expense documents
- Chart of accounts and double-entry journal
- Daily, monthly, yearly, channel-based sales and profit/loss reports
- Audit log and permission management

## Candidate database objects (SQL draft only; not applied)
- `accounting_products`: canonical product mapping, SKU, archived flag
- `inventory_movements`: immutable inbound/outbound/return/adjustment ledger
- `purchase_invoices`, `purchase_invoice_items`
- `sales_documents`, `sales_document_items` for POS documents (website orders remain in existing `orders`)
- `accounting_parties`: customers and suppliers
- `cash_accounts`, `cash_transactions`
- `chart_of_accounts`, `journal_entries`, `journal_lines`
- `accounting_postings`: source reference, source amount/unit, conversion rate and idempotency for website orders
- `accounting_expenses`
- `accounting_audit_logs`

## Next implementation sequence
1. Confirm payment provider verification and admin authentication before wiring any automatic import.
2. Add SQL migration drafts and schema tests in GitHub only. Do not run DDL against production.
3. Build interactive UI against mock data, then connect only to a separately approved safe environment.
4. Test duplicate order delivery, cancellation, returns, partial payment, supplier credit, stock reconciliation, and balanced journal posting before considering production rollout.
