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
  company_count bigint,
  archived_at timestamptz
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
    (select count(*) from public.companies c where c.restaurant_id = r.id)::bigint,
    r.archived_at
  from public.restaurants r
  order by (r.archived_at is not null), r.created_at desc;
end;
$$;

revoke all on function public.super_admin_restaurants() from public;
grant execute on function public.super_admin_restaurants() to authenticated;
