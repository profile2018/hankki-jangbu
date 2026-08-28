create or replace function public.kiosk_identify_company(p_restaurant_id uuid, p_pin text)
returns table(company_id uuid, company_name text, lunch_price integer, dinner_price integer)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.lunch_price, c.dinner_price
  from public.companies c
  where c.restaurant_id = p_restaurant_id
    and c.company_pin = p_pin
    and c.is_active = true
  limit 1;
$$;

create or replace function public.kiosk_record_meal(
  p_restaurant_id uuid,
  p_pin text,
  p_meal_type text,
  p_headcount integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company public.companies%rowtype;
  v_record_id uuid;
begin
  if p_meal_type not in ('lunch','dinner') then
    raise exception 'invalid meal type';
  end if;
  if p_headcount is null or p_headcount < 1 or p_headcount > 999 then
    raise exception 'invalid headcount';
  end if;

  select * into v_company
  from public.companies
  where restaurant_id = p_restaurant_id
    and company_pin = p_pin
    and is_active = true
  limit 1;

  if v_company.id is null then
    raise exception 'invalid company pin';
  end if;

  insert into public.meal_records(
    restaurant_id, company_id, guest_type, meal_type, headcount, unit_price
  ) values (
    p_restaurant_id,
    v_company.id,
    'company',
    p_meal_type,
    p_headcount,
    case when p_meal_type = 'lunch' then v_company.lunch_price else v_company.dinner_price end
  ) returning id into v_record_id;

  return v_record_id;
end;
$$;

revoke all on function public.kiosk_identify_company(uuid,text) from public;
revoke all on function public.kiosk_record_meal(uuid,text,text,integer) from public;
grant execute on function public.kiosk_identify_company(uuid,text) to anon, authenticated;
grant execute on function public.kiosk_record_meal(uuid,text,text,integer) to anon, authenticated;
