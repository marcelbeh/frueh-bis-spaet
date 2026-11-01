begin;

create table if not exists public.access_role_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null,
  target_user_id uuid not null,
  person_name text not null,
  role_key text not null check (role_key in ('employee', 'leader')),
  action text not null check (action in ('granted', 'revoked')),
  created_at timestamptz not null default now()
);

alter table public.access_role_audit enable row level security;
revoke all on public.access_role_audit from public, anon, authenticated;
grant all on public.access_role_audit to service_role;

alter table public.employee_access add column if not exists enabled boolean not null default true;

create index if not exists access_role_audit_target_created_idx
  on public.access_role_audit (target_user_id, created_at desc);

create or replace function public.manage_access_role(
  p_actor_user_id uuid,
  p_person_name text,
  p_role_key text,
  p_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_target_user_id uuid;
  v_current boolean := false;
  v_leader_count integer;
begin
  if p_role_key not in ('employee', 'leader') then
    raise exception 'Unbekannte Zugriffsrolle.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.app_owner where user_id = p_actor_user_id) then
    raise exception 'Leitungszugang erforderlich.' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.app_state s
    where s.id = 1
      and jsonb_typeof(s.state->'names') = 'array'
      and exists (
        select 1
        from jsonb_array_elements(
          case when jsonb_typeof(s.state->'names') = 'array'
            then s.state->'names' else '[]'::jsonb end
        ) as person
        where person->>'name' = p_person_name
      )
  ) then
    raise exception 'Mitarbeitendenprofil nicht gefunden.' using errcode = 'P0002';
  end if;

  select ea.user_id into v_target_user_id
  from public.employee_access ea
  where ea.person_name = p_person_name;

  if v_target_user_id is null then
    raise exception 'Für diese Person ist noch kein Benutzerkonto verknüpft. Bitte zuerst den bestehenden Einladungsweg verwenden.' using errcode = 'P0002';
  end if;

  if p_role_key = 'leader' then
    perform pg_advisory_xact_lock(830144229);
    select exists(select 1 from public.app_owner where user_id = v_target_user_id) into v_current;
    if p_enabled and not v_current then
      insert into public.app_owner(user_id) values (v_target_user_id)
      on conflict (user_id) do nothing;
      insert into public.access_role_audit(actor_user_id,target_user_id,person_name,role_key,action)
      values (p_actor_user_id,v_target_user_id,p_person_name,'leader','granted');
    elsif not p_enabled and v_current then
      select count(*) into v_leader_count from public.app_owner;
      if v_leader_count <= 1 then
        raise exception 'Der letzte Leitungszugang kann nicht entzogen werden.' using errcode = '23514';
      end if;
      delete from public.app_owner where user_id = v_target_user_id;
      insert into public.access_role_audit(actor_user_id,target_user_id,person_name,role_key,action)
      values (p_actor_user_id,v_target_user_id,p_person_name,'leader','revoked');
    end if;
  else
    select coalesce((select enabled from public.employee_access where user_id = v_target_user_id and person_name = p_person_name), false)
    into v_current;
    if p_enabled and not v_current then
      update public.employee_access set enabled = true where user_id = v_target_user_id and person_name = p_person_name;
    elsif not p_enabled and v_current then
      update public.employee_access set enabled = false where user_id = v_target_user_id and person_name = p_person_name;
      insert into public.access_role_audit(actor_user_id,target_user_id,person_name,role_key,action)
      values (p_actor_user_id,v_target_user_id,p_person_name,'employee','revoked');
    end if;
  end if;

  return jsonb_build_object(
    'personName', p_person_name,
    'userId', v_target_user_id,
    'role', p_role_key,
    'enabled', p_enabled,
    'isSelf', v_target_user_id = p_actor_user_id
  );
end;
$$;

create or replace function public.record_employee_access_invitation(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_person_name text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (select 1 from public.app_owner where user_id = p_actor_user_id) then
    raise exception 'Leitungszugang erforderlich.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.employee_access
    where user_id = p_target_user_id and person_name = p_person_name
  ) then
    raise exception 'Mitarbeiterzugang nicht verknüpft.' using errcode = 'P0002';
  end if;
  insert into public.access_role_audit(actor_user_id,target_user_id,person_name,role_key,action)
  values (p_actor_user_id,p_target_user_id,p_person_name,'employee','granted');
end;
$$;

revoke all on function public.manage_access_role(uuid,text,text,boolean) from public, anon, authenticated;
grant execute on function public.manage_access_role(uuid,text,text,boolean) to service_role;
revoke all on function public.record_employee_access_invitation(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.record_employee_access_invitation(uuid,uuid,text) to service_role;

commit;
