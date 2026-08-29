create table if not exists public.trial_extension_history (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  added_days integer not null check (added_days > 0 and added_days <= 3650),
  previous_trial_ends_at timestamptz,
  new_trial_ends_at timestamptz not null,
  reason text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.trial_extension_history enable row level security;

create or replace function public.super_admin_extend_trial(
  p_restaurant_id uuid,
  p_days integer,
  p_reason text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous timestamptz;
  v_base timestamptz;
  v_new timestamptz;
begin
  if not public.is_super_admin() then
    raise exception 'super admin access required';
  end if;
  if p_days is null or p_days < 1 or p_days > 3650 then
    raise exception '연장 일수는 1일 이상 3650일 이하로 입력해 주세요.';
  end if;

  select trial_ends_at into v_previous
  from public.restaurants
  where id = p_restaurant_id
  for update;

  if not found then raise exception '식당을 찾을 수 없습니다.'; end if;

  v_base := greatest(coalesce(v_previous, now()), now());
  v_new := v_base + make_interval(days => p_days);

  update public.restaurants
  set trial_ends_at = v_new,
      trial_started_at = coalesce(trial_started_at, now()),
      subscription_status = case when subscription_status = 'trial' then 'trial' else subscription_status end
  where id = p_restaurant_id;

  update public.subscriptions
  set trial_ends_at = v_new,
      trial_started_at = coalesce(trial_started_at, now()),
      updated_at = now()
  where restaurant_id = p_restaurant_id;

  insert into public.trial_extension_history(restaurant_id,added_days,previous_trial_ends_at,new_trial_ends_at,reason,changed_by)
  values(p_restaurant_id,p_days,v_previous,v_new,nullif(trim(p_reason),''),auth.uid());

  return v_new;
end;
$$;

revoke all on function public.super_admin_extend_trial(uuid,integer,text) from public;
grant execute on function public.super_admin_extend_trial(uuid,integer,text) to authenticated;

create or replace function public.super_admin_trial_history(p_restaurant_id uuid)
returns table(
  id uuid,
  added_days integer,
  previous_trial_ends_at timestamptz,
  new_trial_ends_at timestamptz,
  reason text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then raise exception 'super admin access required'; end if;
  return query
  select h.id,h.added_days,h.previous_trial_ends_at,h.new_trial_ends_at,h.reason,h.created_at
  from public.trial_extension_history h
  where h.restaurant_id = p_restaurant_id
  order by h.created_at desc;
end;
$$;

revoke all on function public.super_admin_trial_history(uuid) from public;
grant execute on function public.super_admin_trial_history(uuid) to authenticated;
