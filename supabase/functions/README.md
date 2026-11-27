# SISE Supabase Edge Functions

This directory tracks the source of the Edge Functions currently called by the SISE storefront.

## Production functions

| Function | Current deployed version at audit | Frontend usage | JWT gateway |
|---|---:|---|---|
| `sise-otpy-auth` | 8 | Phone OTP login, account linking, and admin user management | `verify_jwt=false`; the function validates origin and action-specific authorization itself |
| `sise-ai-chat` | 26 | AI replies in the private customer chat | `verify_jwt=false`; the function validates the SISE origin and the customer's bearer session itself |

Keep the deployed function slugs exactly as written. The existing `otpy` spelling is part of the live API path and must not be renamed casually.

## Required Supabase Function secrets

Set these in the Supabase project's Edge Function secrets. Never commit secret values.

### `sise-otpy-auth`

- `SUPABASE_URL`
- `OTPY_API_KEY`
- `SISE_ADMIN_EMAIL` — admin account email used for privileged user-management actions
- One server-side admin key source: `SUPABASE_SECRET_KEYS` (JSON containing a `default` key) or `SUPABASE_SERVICE_ROLE_KEY`
- One publishable key source: `SUPABASE_PUBLISHABLE_KEYS` (JSON containing a `default` key) or `SUPABASE_ANON_KEY`

The checked-in source reads the admin email from `SISE_ADMIN_EMAIL`; it intentionally does not embed the account email in this public repository.

### `sise-ai-chat`

- `SISE_AI_ENABLED=true`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- One server-side admin key source: `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEYS` (JSON containing a `default` key)

The live implementation uses the OpenAI API. Do not restore the older repository version that used an OpenRouter key and a different private-chat authentication flow.

## Functions intentionally not mirrored here

The connected Supabase project also listed these active endpoints during the source audit:

- `sise-otpy-check` — provider-usage diagnostic protected by a private check key; not called by the storefront.
- `sise-otpy-send-test` and `sise-otpy-verify-test` — test-only endpoints containing test access controls and a test phone number; do not copy them into production source or expose their keys.
- `sise-ip-diagnostic` — currently returns HTTP 410 and is disabled.

Only mirror a diagnostic/test function if it is deliberately redesigned, its test credentials are removed, and its purpose is documented.

## Deployment safety

The source files in this repository are a source backup; editing them does not deploy anything. Before a future deployment:

1. Confirm the target Supabase project ref is `vwprdviufqukdvcroynt`.
2. Confirm all required secrets above are configured.
3. Preserve `verify_jwt=false` for both functions unless their request/authentication design is deliberately changed and retested.
4. Review the diff against the currently deployed function before deploying.
5. Test login, account linking, admin user management, and private AI chat in a controlled environment.

Do not deploy these functions as part of a routine static-site publish.
