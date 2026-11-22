# SISE Production Read-Only Schema & Security Inventory

**Observed:** 2026-11-22  
**Project:** `vwprdviufqukdvcroynt`  
**Method:** Supabase catalog SELECTs and advisor reads only. No production writes.

## Application relations and RLS

| Schema | Relation | RLS | Notes |
|---|---|---:|---|
| `public` | `chat_messages` | enabled | Guest/admin chat; token hash column `tokh` is present |
| `public` | `chat_reactions` | enabled | Unique reaction key on message/user/emoji |
| `public` | `chat_reads` | enabled | Composite primary key message/user |
| `public` | `draw_entries` | enabled | Guest insert; admin read/delete |
| `public` | `orders` | enabled | Admin policy; order RPCs handle guest checkout/tracking |
| `public` | `pm` | enabled | Private customer/admin messages; channel `management` / `ai` |
| `public` | `pm_accounts` | enabled | Auth-user to private-message UID mapping; no direct RLS policies |
| `public` | `site` | enabled | Public read and admin write |
| `public` | `stock` | enabled | Public read and admin writes |
| `public` | `stock_notify` | enabled | Guest insert; admin read/delete |
| `public` | `story_comments` | enabled | Public read/insert; admin update/delete |
| `private` | `api_rate_limits` | **disabled** | Direct table privileges are not granted to anon/authenticated/service_role |
| `private` | `sise_otp_send_limits` | enabled | No direct RLS policies; intended for privileged OTP function path |

The current table inventory contains 13 application tables. The public application tables have RLS enabled. This table is a read-only inventory, not a rebuild-ready schema dump.

## Private rate-limit table: advisory context

Supabase's security advisor reports `private.api_rate_limits` as RLS-disabled (critical). Follow-up privilege checks on 2026-11-22 showed:

- `anon`, `authenticated`, and `service_role` have no SELECT, INSERT, UPDATE, or DELETE privilege on `private.api_rate_limits`.
- Those roles also cannot execute `private.consume_rate_limit(text,integer,integer)`.
- The `postgres` owner has the expected table and function privileges.
- The private schema reports USAGE for these roles, but table privileges remain denied.

Therefore the advisor is a valid defense-in-depth warning, but the inspected grants do **not** show direct table access for API roles. Do not apply `ENABLE ROW LEVEL SECURITY` blindly: the SECURITY DEFINER rate-limit function currently executes as its owner, and any change must be tested against all dependent checkout/chat RPCs in an isolated database first.

## RLS policies observed

Public policies currently include:
- `site`, `stock`, and `chat_messages` public read policies.
- Guest inserts for `chat_messages`, `draw_entries`, `stock_notify`, and `story_comments`.
- Admin-only policies keyed to the configured admin Auth UUID for orders, site, stock, chat, draw entries, stock notifications, story comments, and PM.
- `chat_reactions` and `chat_reads` public read policies; writes are routed through RPC wrappers.

`public.pm_accounts` has RLS enabled but no direct policies. Its intended access path appears to be through `SECURITY DEFINER` functions `pm_register_account`, `pm_list_auth`, and `pm_send_auth`. Keep this closed by default; review the function bodies and grants before adding any direct policy.

## Functions and security-advisor findings

The live project includes SECURITY DEFINER RPCs in the exposed `public` schema. The advisor flags:
- Guest-callable: `chat_delete`, `chat_edit`, `create_order`, `pay_order`, `pm_list`, `pm_send`, `track_order`.
- Authenticated-callable: the above plus `pm_list_auth`, `pm_register_account`, and `pm_send_auth`.

These functions are part of the current application API, so the advisor finding is a review queue, not proof that every endpoint is exploitable. Several implement explicit guest token-hash checks or authenticated-account lookups; checkout/tracking/payment endpoints perform validation and rate limiting. Each function still needs a dedicated authorization and abuse-case review. Do not mass-revoke EXECUTE or convert to SECURITY INVOKER without testing the storefront and private chat flows.

Additional advisor findings:
- `private.sise_otp_send_limits` and `public.pm_accounts` have RLS enabled but no policies. Their direct access paths should remain closed unless a documented use case requires policies.
- Supabase Auth leaked-password protection is disabled. Review enabling it in project Auth settings as a separate security decision.

## Storage

Two public buckets are configured:

| Bucket | Public | Max object size | Allowed MIME types |
|---|---:|---:|---|
| `chat` | yes | 3 MiB | JPEG, PNG, WebP |
| `media` | yes | 15 MiB | JPEG, PNG, WebP, SVG, GIF, MP4, WebM |

Storage policies observed:
- Public SELECT for both buckets.
- `chat` INSERT allowed to anon/authenticated.
- `media` write operations limited to authenticated admin UUID.

A complete recovery source must preserve bucket configuration and storage.objects policies, not just bucket names.

## Triggers and indexes

Observed application triggers:
- `sise_guest_chat_rate_limit`: BEFORE INSERT on `public.chat_messages`.
- `stock_on_order_t`: AFTER INSERT on `public.orders`.
- `stock_on_status_t`: AFTER UPDATE on `public.orders`.

Selected indexes:
- `private.api_rate_limits`: primary key `rate_key`.
- `private.sise_otp_send_limits`: primary key `phone_hash`.
- `public.pm`: primary key, `pm_uid_channel_id_idx`, `pm_uid_idx`, and partial unique `pm_one_ai_reply_per_message`.
- `public.pm_accounts`: primary key `auth_user_id`, unique `pm_uid`.
- `public.chat_reactions`: primary key, message lookup, unique message/user/emoji.
- `public.chat_reads`: composite primary key and UID/read-time index.

## Migration recovery research

The Kifara repository's current tree and its migration-path commit history contain only the four historical snapshots already archived in this SISE branch, plus the grants-hardening migration. No exact SQL source for the other nine missing production migrations was found in that historical repository path history.

The four snapshots remain historical evidence only. Their version timestamps differ from the live migration ledger, so they must not be copied into active migrations or replayed. The AI assistant migration file in SISE uses a different version and defines a legacy two-argument `pm_list` overload; the live database currently has a channel-aware three-argument function and a `pm` table with a `channel` column. This is not sufficient proof of exact equivalence. Review the later migrations that separated channels and removed legacy overloads before deciding how to represent the migration chain.

The remaining nine migrations should be recovered from any surviving SQL-editor exports, deployment artifacts, backups, or developer working copies. If the original SQL is unavailable, create a separately named schema baseline/snapshot from catalog metadata; never fabricate the original migration files.

## CI state

For PR #66 head commit `b56fe7f59ab65248d232d2fe44d9435a1af31cb4`, the latest observed checks completed successfully:
- `syntax`
- `validate` (two jobs)
- `SISE free validation`
- `Validate SISE static pages`

These checks establish repository/static validation only. They do not prove a real encrypted backup, full restore, Auth/Storage recovery, or production end-to-end behavior.

## Safety record

All database operations for this inventory were SELECT/catalog/advisor reads. No production SQL mutation, migration, Edge Function deployment, site deployment, or live-data change was performed.


## Function execution inventory — follow-up read-only catalog query

The current application function inventory also records the execution mode, search path, and ACLs. The following functions are marked `SECURITY DEFINER` in the live catalog:

| Schema | Function | Key observation |
|---|---|---|
| `private` | `chat_mark_read_impl(bigint[],text,text)` | Fixed search path `pg_catalog, public`; ACL includes anon/authenticated |
| `private` | `chat_react_impl(bigint,text,text,text)` | Fixed search path `pg_catalog, public`; ACL includes anon/authenticated |
| `private` | `consume_rate_limit(text,integer,integer)` | Fixed empty search path; ACL limited to postgres |
| `public` | `chat_delete(bigint,text,text)` | Guest/authenticated executable; token validation must be reviewed |
| `public` | `chat_edit(bigint,text,text,text)` | Guest/authenticated executable; token validation must be reviewed |
| `public` | `create_order(jsonb)` | Guest/authenticated executable; checkout validation and abuse controls must be reviewed |
| `public` | `pay_order(text,text)` | Guest/authenticated executable; payment reference/status rules must be reviewed |
| `public` | `pm_list(text,text,text)` | ACL includes PUBLIC; token/channel authorization must be reviewed |
| `public` | `pm_list_auth(text)` | Authenticated executable; account/channel ownership must be reviewed |
| `public` | `pm_register_account()` | Authenticated executable; account binding must be reviewed |
| `public` | `pm_send(text,text,text,text,text,text)` | ACL includes PUBLIC; token/channel authorization must be reviewed |
| `public` | `pm_send_auth(text,text,text,text)` | Authenticated executable; account/channel ownership must be reviewed |
| `public` | `sise_limit_guest_chat()` | Trigger function; not a direct API endpoint |
| `public` | `sise_otp_take_send(text,text)` | ACL limited to postgres/service_role in the inspected catalog |
| `public` | `stock_on_order()` | Trigger function; not a direct API endpoint |
| `public` | `stock_on_status()` | Trigger function; not a direct API endpoint |
| `public` | `track_order(text)` | Guest/authenticated executable; response must not expose customer PII |

The live catalog also contains `chat_mark_read(bigint[],text,text)` and `chat_react(bigint,text,text,text)` as SECURITY INVOKER wrappers. Their privileged implementations are in the private schema. These wrapper/implementation pairs must be reviewed together.

Supabase advisors currently report seven guest-callable SECURITY DEFINER RPCs (`chat_delete`, `chat_edit`, `create_order`, `pay_order`, `pm_list`, `pm_send`, `track_order`) and ten authenticated-callable SECURITY DEFINER RPCs. These are review findings, not a basis for blanket revocation: the functions are part of existing application flows and require endpoint-by-endpoint authorization tests before any ACL or security-mode change.

## Additional advisor results

Read-only security advisor results on 2026-11-22 also reported:

- `public.pm_accounts`: RLS enabled, no direct policies.
- `private.sise_otp_send_limits`: RLS enabled, no direct policies.
- Auth leaked-password protection: disabled.

The two no-policy tables appear intended to remain closed to direct access and be used through privileged function paths. Do not add broad policies merely to silence the advisor. Enabling leaked-password protection is an Auth project-setting change and should be handled separately from repository consolidation.

## Current live configuration facts

- Supabase project status: `ACTIVE_HEALTHY`; PostgreSQL major version 17.
- Public buckets: `chat` (3 MiB limit; JPEG/PNG/WebP) and `media` (15 MiB limit; JPEG/PNG/WebP/SVG/GIF/MP4/WebM).
- Storage object policies: public read for both buckets; anon/authenticated insert for `chat`; authenticated admin-only writes for `media`.
- Active application Edge Functions: `sise-ai-chat` v26 and `sise-otpy-auth` v8.
- Active diagnostic/test functions: `sise-ip-diagnostic` v5, `sise-otpy-check` v1, `sise-otpy-send-test` v1, and `sise-otpy-verify-test` v1.

This section is an inventory only. It does not contain function bodies, user data, secrets, or authorization to change production.
