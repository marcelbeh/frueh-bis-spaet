create table if not exists public.leader_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  source_legacy boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.leader_profiles enable row level security;

revoke all on table public.leader_profiles from anon, public;
grant select, insert, update on table public.leader_profiles to authenticated;

drop policy if exists "Leaders can read leadership profiles" on public.leader_profiles;
create policy "Leaders can read leadership profiles"
  on public.leader_profiles
  for select
  to authenticated
  using (exists (
    select 1 from public.app_owner owner
    where owner.user_id = (select auth.uid())
  ));

drop policy if exists "Leaders can create own leadership profile" on public.leader_profiles;
create policy "Leaders can create own leadership profile"
  on public.leader_profiles
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_owner owner where owner.user_id = (select auth.uid()))
  );

drop policy if exists "Leaders can update own leadership profile" on public.leader_profiles;
create policy "Leaders can update own leadership profile"
  on public.leader_profiles
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_owner owner where owner.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_owner owner where owner.user_id = (select auth.uid()))
  );

-- Copy only when the shared profile has exactly one possible owner.
-- The original app_state JSON remains untouched until the new client has loaded
-- and confirmed the marked copy; existing profile rows are never overwritten.
insert into public.leader_profiles (user_id, profile, source_legacy)
select owner.user_id, state.state -> 'leaderProfile', true
from public.app_owner owner
cross join public.app_state state
where state.id = 1
  and jsonb_typeof(state.state -> 'leaderProfile') = 'object'
  and (select count(*) from public.app_owner) = 1
on conflict (user_id) do nothing;