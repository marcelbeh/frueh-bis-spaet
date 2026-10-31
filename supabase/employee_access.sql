-- Employee account-to-person mapping for the read-only employee schedule portal.
-- Apply this SQL in the Supabase SQL Editor after creating the employee's Auth user.
begin;

create table if not exists public.employee_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  person_name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.employee_access enable row level security;
revoke all on public.employee_access from public, anon, authenticated;
grant select on public.employee_access to authenticated;

drop policy if exists "Employees read own access" on public.employee_access;
create policy "Employees read own access"
on public.employee_access
for select
to authenticated
using ((select auth.uid()) = user_id);

commit;
