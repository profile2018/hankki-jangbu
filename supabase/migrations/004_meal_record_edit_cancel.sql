-- Meal record correction/cancellation with audit history.
-- Run this migration in Supabase SQL Editor before using the dashboard actions.

alter table public.meal_records
add column if not exists cancelled_at timestamptz;

create or replace function public.update_meal_record(
  p_record_id uuid,
  p_meal_type text,
  p_headcount integer,
  p_reason text default null
)
returns public.meal_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.meal_records;
  v_after public.meal_records;
begin
  if p_meal_type not in ('lunch','dinner') then
    raise exception 'invalid meal type';
  end if;
  if p_headcount < 1 or p_headcount > 999 then
    raise exception 'invalid headcount';
  end if;

  select * into v_before
  from public.meal_records
  where id = p_record_id;

  if v_before.id is null then
    raise exception 'meal record not found';
  end if;
  if v_before.cancelled_at is not null then
    raise exception 'cancelled meal record';
  end if;

  if not exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = v_before.restaurant_id
      and rm.user_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  update public.meal_records
  set meal_type = p_meal_type,
      headcount = p_headcount
  where id = p_record_id
  returning * into v_after;

  insert into public.meal_record_history (
    restaurant_id,
    meal_record_id,
    changed_by,
    before_data,
    after_data,
    reason
  ) values (
    v_before.restaurant_id,
    v_before.id,
    auth.uid(),
    to_jsonb(v_before),
    to_jsonb(v_after),
    coalesce(nullif(trim(p_reason), ''), '식수 기록 수정')
  );

  return v_after;
end;
$$;

revoke all on function public.update_meal_record(uuid,text,integer,text) from public;
grant execute on function public.update_meal_record(uuid,text,integer,text) to authenticated;

create or replace function public.cancel_meal_record(
  p_record_id uuid,
  p_reason text default null
)
returns public.meal_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.meal_records;
  v_after public.meal_records;
begin
  select * into v_before
  from public.meal_records
  where id = p_record_id;

  if v_before.id is null then
    raise exception 'meal record not found';
  end if;
  if v_before.cancelled_at is not null then
    raise exception 'meal record already cancelled';
  end if;

  if not exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = v_before.restaurant_id
      and rm.user_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  update public.meal_records
  set cancelled_at = now()
  where id = p_record_id
  returning * into v_after;

  insert into public.meal_record_history (
    restaurant_id,
    meal_record_id,
    changed_by,
    before_data,
    after_data,
    reason
  ) values (
    v_before.restaurant_id,
    v_before.id,
    auth.uid(),
    to_jsonb(v_before),
    to_jsonb(v_after),
    coalesce(nullif(trim(p_reason), ''), '식수 기록 취소')
  );

  return v_after;
end;
$$;

revoke all on function public.cancel_meal_record(uuid,text) from public;
grant execute on function public.cancel_meal_record(uuid,text) to authenticated;
