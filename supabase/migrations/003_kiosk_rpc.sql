create extension if not exists pgcrypto with schema extensions;

create or replace function public.hash_company_pin(p_pin text)
returns text
language sql
immutable
strict
as $$
  select extensions.crypt(p_pin, extensions.gen_salt('bf'));
$$;

create or replace function public.company_pin_matches(p_pin text, p_hash text)
returns boolean
language sql
immutable
strict
as $$
  select extensions.crypt(p_pin, p_hash) = p_hash;
$$;

create or replace function public.create_company_with_pin(
  p_restaurant_id uuid,
  p_company_no text,
  p_name text,
  p_pin text,
  p_lunch_price integer,
  p_dinner_price integer,
  p_contact_name text default null,
  p_contact_email text default null
)
returns public.companies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company public.companies%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN must be 4 digits';
  end if;

  if not public.is_restaurant_owner(p_restaurant_id) then
    raise exception 'not authorized';
  end if;

  if exists (
    select 1
    from public.companies c
    where c.restaurant_id = p_restaurant_id
      and c.company_no = trim(p_company_no)
  ) then
    raise exception 'duplicate company no';
  end if;

  if exists (
    select 1
    from public.companies c
    where c.restaurant_id = p_restaurant_id
      and c.is_active = true
      and public.company_pin_matches(p_pin, c.company_pin_hash)
  ) then
    raise exception 'duplicate company pin';
  end if;

  insert into public.companies (
    restaurant_id, company_no, name, lunch_price, dinner_price,
    company_pin_hash, contact_name, contact_email, is_active
  ) values (
    p_restaurant_id,
    trim(p_company_no),
    trim(p_name),
    greatest(coalesce(p_lunch_price, 0), 0),
    greatest(coalesce(p_dinner_price, 0), 0),
    public.hash_company_pin(p_pin),
    nullif(trim(p_contact_name), ''),
    nullif(trim(p_contact_email), ''),
    true
  ) returning * into v_company;

  return v_company;
end;
$$;

create or replace function public.kiosk_identify_company(
  p_restaurant_id uuid,
  p_pin text
)
returns table(
  company_id uuid,
  company_name text,
  lunch_price integer,
  dinner_price integer
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.lunch_price, c.dinner_price
  from public.companies c
  where c.restaurant_id = p_restaurant_id
    and c.is_active = true
    and public.company_pin_matches(p_pin, c.company_pin_hash)
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
  if p_meal_type not in ('lunch', 'dinner') then
    raise exception 'invalid meal type';
  end if;

  if p_headcount is null or p_headcount < 1 or p_headcount > 999 then
    raise exception 'invalid headcount';
  end if;

  select * into v_company
  from public.companies c
  where c.restaurant_id = p_restaurant_id
    and c.is_active = true
    and public.company_pin_matches(p_pin, c.company_pin_hash)
  limit 1;

  if v_company.id is null then
    raise exception 'invalid company pin';
  end if;

  insert into public.meal_records (
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

revoke all on function public.hash_company_pin(text) from public;
revoke all on function public.company_pin_matches(text,text) from public;
revoke all on function public.create_company_with_pin(uuid,text,text,text,integer,integer,text,text) from public;
revoke all on function public.kiosk_identify_company(uuid,text) from public;
revoke all on function public.kiosk_record_meal(uuid,text,text,integer) from public;

grant execute on function public.create_company_with_pin(uuid,text,text,text,integer,integer,text,text) to authenticated;
grant execute on function public.kiosk_identify_company(uuid,text) to anon, authenticated;
grant execute on function public.kiosk_record_meal(uuid,text,text,integer) to anon, authenticated;
