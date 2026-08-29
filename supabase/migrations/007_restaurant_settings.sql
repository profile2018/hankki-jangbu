alter table public.restaurants
  add column if not exists business_number text,
  add column if not exists address text,
  add column if not exists email text,
  add column if not exists bank_name text,
  add column if not exists bank_account text,
  add column if not exists bank_holder text,
  add column if not exists kiosk_reset_seconds integer not null default 3 check (kiosk_reset_seconds in (2,3,5)),
  add column if not exists kiosk_default_meal text not null default 'lunch' check (kiosk_default_meal in ('lunch','dinner'));

create or replace function public.update_restaurant_settings(
  p_restaurant_id uuid,
  p_name text,
  p_owner_name text,
  p_phone text,
  p_business_number text,
  p_address text,
  p_email text,
  p_bank_name text,
  p_bank_account text,
  p_bank_holder text,
  p_default_lunch_price integer,
  p_default_dinner_price integer,
  p_kiosk_reset_seconds integer,
  p_kiosk_default_meal text
)
returns public.restaurants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.restaurants;
begin
  if not exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = p_restaurant_id
      and rm.user_id = auth.uid()
      and rm.role in ('owner','manager')
  ) then
    raise exception '설정을 변경할 권한이 없습니다.';
  end if;

  if coalesce(trim(p_name),'') = '' then
    raise exception '식당명을 입력해 주세요.';
  end if;

  if coalesce(trim(p_owner_name),'') = '' then
    raise exception '대표자명을 입력해 주세요.';
  end if;

  if p_default_lunch_price < 0 or p_default_dinner_price < 0 then
    raise exception '식대는 0원 이상이어야 합니다.';
  end if;

  if p_kiosk_reset_seconds not in (2,3,5) then
    raise exception '키오스크 복귀 시간은 2초, 3초, 5초 중 하나여야 합니다.';
  end if;

  if p_kiosk_default_meal not in ('lunch','dinner') then
    raise exception '기본 식사 유형을 확인해 주세요.';
  end if;

  update public.restaurants
  set name = trim(p_name),
      owner_name = trim(p_owner_name),
      phone = nullif(trim(p_phone),''),
      business_number = nullif(trim(p_business_number),''),
      address = nullif(trim(p_address),''),
      email = nullif(trim(p_email),''),
      bank_name = nullif(trim(p_bank_name),''),
      bank_account = nullif(trim(p_bank_account),''),
      bank_holder = nullif(trim(p_bank_holder),''),
      default_lunch_price = p_default_lunch_price,
      default_dinner_price = p_default_dinner_price,
      kiosk_reset_seconds = p_kiosk_reset_seconds,
      kiosk_default_meal = p_kiosk_default_meal
  where id = p_restaurant_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.update_restaurant_settings(uuid,text,text,text,text,text,text,text,text,text,integer,integer,integer,text) to authenticated;
