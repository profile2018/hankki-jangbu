-- Super-admin restaurant lifecycle controls
alter table public.restaurants
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

create or replace function public.super_admin_set_restaurant_status(
  p_restaurant_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'super admin only';
  end if;
  if p_status not in ('trial','active','past_due','suspended') then
    raise exception 'invalid status';
  end if;
  update public.restaurants
     set subscription_status = p_status
   where id = p_restaurant_id and archived_at is null;
  if not found then raise exception 'restaurant not found'; end if;
end;
$$;

create or replace function public.super_admin_archive_restaurant(p_restaurant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then raise exception 'super admin only'; end if;
  update public.restaurants
     set archived_at = now(), archived_by = auth.uid(), subscription_status = 'suspended'
   where id = p_restaurant_id and archived_at is null;
  if not found then raise exception 'restaurant not found'; end if;
end;
$$;

create or replace function public.super_admin_restore_restaurant(p_restaurant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then raise exception 'super admin only'; end if;
  update public.restaurants
     set archived_at = null, archived_by = null,
         subscription_status = case when trial_ends_at is not null and trial_ends_at >= now() then 'trial' else 'past_due' end
   where id = p_restaurant_id and archived_at is not null;
  if not found then raise exception 'restaurant not found'; end if;
end;
$$;

revoke all on function public.super_admin_set_restaurant_status(uuid,text) from public;
revoke all on function public.super_admin_archive_restaurant(uuid) from public;
revoke all on function public.super_admin_restore_restaurant(uuid) from public;
grant execute on function public.super_admin_set_restaurant_status(uuid,text) to authenticated;
grant execute on function public.super_admin_archive_restaurant(uuid) to authenticated;
grant execute on function public.super_admin_restore_restaurant(uuid) to authenticated;
