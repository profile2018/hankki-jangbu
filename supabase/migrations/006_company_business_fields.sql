alter table public.companies
  add column if not exists business_number text,
  add column if not exists business_address text,
  add column if not exists company_phone text,
  add column if not exists contact_phone text;

create or replace function public.create_company_full(
  p_restaurant_id uuid,
  p_company_no text,
  p_name text,
  p_pin text,
  p_lunch_price integer,
  p_dinner_price integer,
  p_contact_name text default null,
  p_contact_email text default null,
  p_business_number text default null,
  p_business_address text default null,
  p_company_phone text default null,
  p_contact_phone text default null
)
returns public.companies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company public.companies%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_pin !~ '^[0-9]{4}$' then raise exception 'PIN must be 4 digits'; end if;
  if not public.is_restaurant_owner(p_restaurant_id) then raise exception 'not authorized'; end if;
  if exists(select 1 from public.companies c where c.restaurant_id=p_restaurant_id and c.company_no=trim(p_company_no)) then raise exception 'duplicate company no'; end if;
  if exists(select 1 from public.companies c where c.restaurant_id=p_restaurant_id and c.is_active=true and public.company_pin_matches(p_pin,c.company_pin_hash)) then raise exception 'duplicate company pin'; end if;

  insert into public.companies(
    restaurant_id, company_no, name, lunch_price, dinner_price, company_pin_hash,
    contact_name, contact_email, business_number, business_address, company_phone, contact_phone, is_active
  ) values (
    p_restaurant_id, trim(p_company_no), trim(p_name), greatest(coalesce(p_lunch_price,0),0),
    greatest(coalesce(p_dinner_price,0),0), public.hash_company_pin(p_pin),
    nullif(trim(p_contact_name),''), nullif(trim(p_contact_email),''), nullif(trim(p_business_number),''),
    nullif(trim(p_business_address),''), nullif(trim(p_company_phone),''), nullif(trim(p_contact_phone),''), true
  ) returning * into v_company;
  return v_company;
end;
$$;

create or replace function public.update_company_with_optional_pin(
  p_company_id uuid,
  p_company_no text,
  p_name text,
  p_lunch_price integer,
  p_dinner_price integer,
  p_contact_name text default null,
  p_contact_email text default null,
  p_pin text default null,
  p_business_number text default null,
  p_business_address text default null,
  p_company_phone text default null,
  p_contact_phone text default null
)
returns public.companies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company public.companies%rowtype;
begin
  select * into v_company from public.companies where id=p_company_id;
  if v_company.id is null then raise exception 'company not found'; end if;
  if not public.is_restaurant_owner(v_company.restaurant_id) then raise exception 'not authorized'; end if;
  if p_pin is not null and p_pin<>'' and p_pin !~ '^[0-9]{4}$' then raise exception 'PIN must be 4 digits'; end if;
  if exists(select 1 from public.companies c where c.restaurant_id=v_company.restaurant_id and c.id<>p_company_id and c.company_no=trim(p_company_no)) then raise exception 'duplicate company no'; end if;
  if p_pin is not null and p_pin<>'' and exists(select 1 from public.companies c where c.restaurant_id=v_company.restaurant_id and c.id<>p_company_id and c.is_active=true and public.company_pin_matches(p_pin,c.company_pin_hash)) then raise exception 'duplicate company pin'; end if;

  update public.companies set
    company_no=trim(p_company_no), name=trim(p_name),
    lunch_price=greatest(coalesce(p_lunch_price,0),0), dinner_price=greatest(coalesce(p_dinner_price,0),0),
    contact_name=nullif(trim(p_contact_name),''), contact_email=nullif(trim(p_contact_email),''),
    business_number=nullif(trim(p_business_number),''), business_address=nullif(trim(p_business_address),''),
    company_phone=nullif(trim(p_company_phone),''), contact_phone=nullif(trim(p_contact_phone),''),
    company_pin_hash=case when p_pin is not null and p_pin<>'' then public.hash_company_pin(p_pin) else company_pin_hash end
  where id=p_company_id
  returning * into v_company;
  return v_company;
end;
$$;

revoke all on function public.create_company_full(uuid,text,text,text,integer,integer,text,text,text,text,text,text) from public;
grant execute on function public.create_company_full(uuid,text,text,text,integer,integer,text,text,text,text,text,text) to authenticated;
revoke all on function public.update_company_with_optional_pin(uuid,text,text,integer,integer,text,text,text,text,text,text,text) from public;
grant execute on function public.update_company_with_optional_pin(uuid,text,text,integer,integer,text,text,text,text,text,text,text) to authenticated;
