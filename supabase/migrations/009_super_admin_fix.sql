-- 슈퍼관리자 테이블/함수 이름 정합성 보정
create table if not exists public.super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.super_admins enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.super_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.super_admin_restaurants()
returns table (
  id uuid,
  name text,
  owner_name text,
  phone text,
  email text,
  created_at timestamptz,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  subscription_status text,
  company_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'super admin access required';
  end if;

  return query
  select
    r.id,
    r.name,
    r.owner_name,
    r.phone,
    r.email,
    r.created_at,
    r.trial_started_at,
    r.trial_ends_at,
    r.subscription_status,
    (select count(*) from public.companies c where c.restaurant_id = r.id)::bigint
  from public.restaurants r
  order by r.created_at desc;
end;
$$;

revoke all on function public.super_admin_restaurants() from public;
grant execute on function public.super_admin_restaurants() to authenticated;
