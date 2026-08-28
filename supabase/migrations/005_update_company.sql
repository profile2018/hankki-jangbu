create or replace function public.update_company_with_optional_pin(
  p_company_id uuid,
  p_company_no text,
  p_name text,
  p_lunch_price integer,
  p_dinner_price integer,
  p_contact_name text default null,
  p_contact_email text default null,
  p_pin text default null
)
returns public.companies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company public.companies%rowtype;
  v_pin text := nullif(trim(coalesce(p_pin, '')), '');
begin
  select * into v_company
  from public.companies
  where id = p_company_id;

  if v_company.id is null then
    raise exception 'company not found';
  end if;

  if not public.is_restaurant_owner(v_company.restaurant_id) then
    raise exception 'not authorized';
  end if;

  if exists (
    select 1 from public.companies c
    where c.restaurant_id = v_company.restaurant_id
      and c.id <> v_company.id
      and c.company_no = trim(p_company_no)
  ) then
    raise exception 'duplicate company no';
  end if;

  if v_pin is not null then
    if v_pin !~ '^[0-9]{4}$' then
      raise exception 'PIN must be 4 digits';
    end if;

    if exists (
      select 1 from public.companies c
      where c.restaurant_id = v_company.restaurant_id
        and c.id <> v_company.id
        and c.is_active = true
        and public.company_pin_matches(v_pin, c.company_pin_hash)
    ) then
      raise exception 'duplicate company pin';
    end if;
  end if;

  update public.companies
  set company_no = trim(p_company_no),
      name = trim(p_name),
      lunch_price = greatest(coalesce(p_lunch_price, 0), 0),
      dinner_price = greatest(coalesce(p_dinner_price, 0), 0),
      contact_name = nullif(trim(coalesce(p_contact_name, '')), ''),
      contact_email = nullif(trim(coalesce(p_contact_email, '')), ''),
      company_pin_hash = case when v_pin is null then company_pin_hash else public.hash_company_pin(v_pin) end
  where id = p_company_id
  returning * into v_company;

  return v_company;
end;
$$;

revoke all on function public.update_company_with_optional_pin(uuid,text,text,integer,integer,text,text,text) from public;
grant execute on function public.update_company_with_optional_pin(uuid,text,text,integer,integer,text,text,text) to authenticated;
