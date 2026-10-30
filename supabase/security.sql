-- Run this migration in the Supabase SQL Editor after checking that the
-- app_owner.user_id column is UUID and app_state.id is the singleton key 1.
-- This file is a proposed policy migration; it is NOT applied automatically.
alter table public.app_owner enable row level security;
alter table public.app_state enable row level security;

drop policy if exists "Owners can read their own owner record" on public.app_owner;
create policy "Owners can read their own owner record"
on public.app_owner for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Authorized owners can read app state" on public.app_state;
create policy "Authorized owners can read app state"
on public.app_state for select to authenticated
using (id = 1 and exists (
  select 1 from public.app_owner o where o.user_id = auth.uid()
));

drop policy if exists "Authorized owners can create app state" on public.app_state;
create policy "Authorized owners can create app state"
on public.app_state for insert to authenticated
with check (id = 1 and exists (
  select 1 from public.app_owner o where o.user_id = auth.uid()
));

drop policy if exists "Authorized owners can update app state" on public.app_state;
create policy "Authorized owners can update app state"
on public.app_state for update to authenticated
using (id = 1 and exists (
  select 1 from public.app_owner o where o.user_id = auth.uid()
))
with check (id = 1 and exists (
  select 1 from public.app_owner o where o.user_id = auth.uid()
));

-- Deliberately no authenticated INSERT/UPDATE/DELETE policies on app_owner.
