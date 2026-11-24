# SISE Accounting Foundation

## Scope and safety
This work is isolated on `feature/sise-accounting-foundation`. The live Supabase project was inspected read-only. No schema, policy, trigger, data, or production storefront changes have been made. The HTML preview is a UI-only prototype and uses clearly labelled sample figures.

## Confirmed current SISE data model
- Supabase project: `vwprdviufqukdvcroynt` (production; do not use for experimental DDL).
- `public.site`: one row; storefront content is in JSONB `data`. Product catalogue is `data.products`.
- Existing product JSON keys: `id`, `title`, `desc`, `price`, `oldPrice`, `cat`, `badge`, `images`, `colors`, `stock`.
- Existing `public.stock`: `pid` (primary key), `qty` (non-negative integer), `updated_at`. All 8 current catalogue products have a matching stock row.
- Existing `public.orders`: UUID `id`, unique text `code`, JSONB `data`, `created_at`. Order JSON keys include `id`, `code`, `items`, `total`, `subtotal`, `discount`, `coupon`, `ship`, `status`, `payRef`, and customer/shipping fields.
- Order line JSON keys include `pid`, `title`, `price`, `qty`, `color`, and `img`.
- Observed order statuses currently include `new`, `paid`, and `shipped`. Do not assume `shipped` is a payment event until the checkout lifecycle is verified.
- Existing triggers: `stock_on_order_t` runs after order insert and `stock_on_status_t` runs after order update. Their functions decrement stock on every inserted order and restore/deduct stock when status crosses into/out of `canceled`. Accounting must not decrement stock a second time.

## Design principles
1. Keep the existing catalogue `site.data.products[].id` as the canonical product identity and map it to the accounting product record. Never create duplicate catalogue items.
2. Generate a separate human-friendly SKU such as `SISE-000001` for display and invoices; preserve the existing product ID as the integration key.
3. Keep one central warehouse for the first release.
4. Use an append-only inventory movement ledger. Purchases, POS sales, approved stock adjustments, and returns create movements; historical movements are never silently overwritten.
5. Use the existing `orders` table as the source for website orders. Add an idempotent accounting posting record keyed by order UUID/code so retries cannot post twice.
6. Do not recognize unpaid `new` orders as revenue. Post revenue only after the confirmed payment event is established from the actual checkout/payment flow.
7. Do not make a second stock deduction for website orders: the existing order trigger already owns reservation/deduction behavior. Accounting will record COGS/financial entries separately and reconcile with existing stock.
8. In-person sales are entered through the accounting/POS panel and create their own sale document and stock movement.
9. Use double-entry journal entries; every posted journal entry must balance (total debits = total credits).
10. Archive products rather than hard-delete them when referenced by orders, invoices, or inventory history.
11. Enable RLS on all new exposed tables and implement role-specific policies; never expose service-role credentials in the browser.
12. Keep currency storage in one verified base unit. Confirm whether current product/order amounts are toman or rial before connecting live financial records.

## Proposed modules
- Product mapping and SKU registry
- Central warehouse and inventory movements
- Purchase invoices and supplier balances
- Website sales synchronization (idempotent)
- POS / in-person sales
- Cash and bank accounts, receipts, payments, and transfers
- Customers, suppliers, debtors, and creditors
- Income and expense documents
- Chart of accounts and double-entry journal
- Daily, monthly, yearly, channel-based sales and profit/loss reports
- Audit log and permission management

## Candidate database objects (not created yet)
- `accounting_products`: product mapping, SKU, archived flag
- `inventory_movements`: immutable inbound/outbound/return/adjustment ledger
- `purchase_invoices`, `purchase_invoice_items`
- `sales_documents`, `sales_document_items` for POS documents (website orders remain in existing `orders`)
- `accounting_parties`: customers and suppliers
- `cash_accounts`, `cash_transactions`
- `chart_of_accounts`, `journal_entries`, `journal_lines`
- `accounting_postings`: idempotency key and source reference for imported website orders
- `accounting_audit_logs`

## Next implementation sequence
1. Finish read-only review of checkout payment confirmation, order cancellation, stock RPC/trigger, admin authentication and current amount units.
2. Finalize accounting rules (especially inventory cost method and when a website order becomes paid).
3. Add a migration draft and schema tests in the GitHub branch only. Do not run DDL against production.
4. Build the interactive UI against mock data, then connect only to a separately approved safe environment.
5. Test duplicate order delivery, cancellation, returns, partial payment, supplier credit, stock reconciliation, and balanced journal posting before considering production rollout.
