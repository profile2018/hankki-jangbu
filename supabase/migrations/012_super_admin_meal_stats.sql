-- Super-admin restaurant usage statistics.
-- Run this migration in Supabase SQL Editor before relying on the new admin metrics.

-- PostgreSQL cannot change a function's TABLE return type with CREATE OR REPLACE,
-- so drop the existing zero-argument function first and recreate it.
drop function if exists public.super_admin_restaurants();

create function public.super_admin_restaurants()
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
  archived_at timestamptz,
  current_month_headcount bigint,
  previous_month_headcount bigint,
  three_month_avg_headcount bigint,
  current_month_daily_avg numeric
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
    (select count(*) from public.companies c where c.restaurant_id = r.id)::bigint as company_count,
    r.archived_at,
    coalesce(stats.current_month_headcount, 0)::bigint,
    coalesce(stats.previous_month_headcount, 0)::bigint,
    round(
      coalesce(stats.three_month_headcount, 0)::numeric /
      least(
        3,
        greatest(
          1,
          ((extract(year from current_date)::int - extract(year from r.created_at)::int) * 12)
          + extract(month from current_date)::int
          - extract(month from r.created_at)::int
          + 1
        )
      )
    )::bigint as three_month_avg_headcount,
    round(
      coalesce(stats.current_month_headcount, 0)::numeric /
      greatest(1, extract(day from current_date)::int),
      1
    ) as current_month_daily_avg
  from public.restaurants r
  left join lateral (
    select
      sum(m.headcount) filter (
        where m.cancelled_at is null
          and m.occurred_at >= date_trunc('month', current_date)
          and m.occurred_at < date_trunc('month', current_date) + interval '1 month'
      )::bigint as current_month_headcount,
      sum(m.headcount) filter (
        where m.cancelled_at is null
          and m.occurred_at >= date_trunc('month', current_date) - interval '1 month'
          and m.occurred_at < date_trunc('month', current_date)
      )::bigint as previous_month_headcount,
      sum(m.headcount) filter (
        where m.cancelled_at is null
          and m.occurred_at >= date_trunc('month', current_date) - interval '2 months'
          and m.occurred_at < date_trunc('month', current_date) + interval '1 month'
      )::bigint as three_month_headcount
    from public.meal_records m
    where m.restaurant_id = r.id
  ) stats on true
  order by (r.archived_at is not null), r.created_at desc;
end;
$$;

revoke all on function public.super_admin_restaurants() from public;
grant execute on function public.super_admin_restaurants() to authenticated;
