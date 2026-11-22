-- Apply only after the new SISE frontend has been deployed.
-- The preceding migration deliberately keeps the legacy insert path available
-- during the frontend rollout. This second phase closes that path.

drop policy if exists "orders insert" on public.orders;
revoke insert on table public.orders from anon, authenticated;
