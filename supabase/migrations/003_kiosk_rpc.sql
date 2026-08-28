create extension if not exists pgcrypto;

create or replace function public.register_company_with_pin(
  p_restaurant_id uuid,
  p_company_no text,
  p_name text,
  p_pin text,
  p_lunch_price integer,
  p_dinner_price integer,
  p_contact_name text default null,
  p_contact_email text default null
)
returns table(
  id uuid,
  company_no text,
  name text,
  lunch_price integer,
  dinner_price integer,
  contact_name text,
  contact_email text,
  is_active boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'invalid company pin';
  end if;

  if not exists (
    select 1 from public.restaurant_members rm
    where rm.restaurant_id = p_restaurant_id
      and rm.user_id = auth.uid()
      and rm.role in ('owner','manager')
  ) then
    raise exception 'not authorized';
  end if;

  if exists (
    select 1 from public.companies c
    where c.restaurant_id = p_restaurant_id
      and c.company_no = p_company_no
  ) then
    raise exception 'duplicate company no';
  end if;

  if exists (
    select 1 from public.companies c
    where c.restaurant_id = p_restaurant_id
      and crypt(p_pin, c.company_pin_hash) = c.company_pin_hash
  ) then
    raise exception 'duplicate company pin';
  end if;

  return query
  insert into public.companies(
    restaurant_id, company_no, name, lunch_price, dinner_price,
    company_pin_hash, contact_name, contact_email
  ) values (
    p_restaurant_id, p_company_no, p_name,
    greatest(coalesce(p_lunch_price,0),0),
    greatest(coalesce(p_dinner_price,0),0),
    crypt(p_pin, gen_salt('bf')),
    nullif(p_contact_name,''), nullif(p_contact_email,'')
  )
  returning companies.id, companies.company_no, companies.name,
            companies.lunch_price, companies.dinner_price,
            companies.contact_name, companies.contact_email,
            companies.is_active;
end;
$$;

create or replace function public.kiosk_identify_company(p_restaurant_id uuid, p_pin text)
returns table(company_id uuid, company_name text, lunch_price integer, dinner_price integer)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select c.id, c.name, c.lunch_price, c.dinner_price
  from public.companies c
  where c.restaurant_id = p_restaurant_id
    and c.is_active = true
    and crypt(p_pin, c.company_pin_hash) = c.company_pin_hash
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
set search_path = public, extensions
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
  from public.companies c
  where c.restaurant_id = p_restaurant_id
    and c.is_active = true
    and crypt(p_pin, c.company_pin_hash) = c.company_pin_hash
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

revoke all on function public.register_company_with_pin(uuid,text,text,text,integer,integer,text,text) from public;
revoke all on function public.kiosk_identify_company(uuid,text) from public;
revoke all on function public.kiosk_record_meal(uuid,text,text,integer) from public;

grant execute on function public.register_company_with_pin(uuid,text,text,text,integer,integer,text,text) to authenticated;
grant execute on function public.kiosk_identify_company(uuid,text) to anon, authenticated;
grant execute on function public.kiosk_record_meal(uuid,text,text,integer) to anon, authenticated;
