create extension if not exists pgcrypto;

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null,
  phone text,
  admin_pin text not null check (admin_pin ~ '^[0-9]{4}$'),
  default_lunch_price integer not null default 0 check (default_lunch_price >= 0),
  default_dinner_price integer not null default 0 check (default_dinner_price >= 0),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  subscription_status text not null default 'trial' check (subscription_status in ('trial','active','past_due','suspended')),
  created_at timestamptz not null default now()
);

create table public.restaurant_members (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','manager')),
  created_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  company_no text not null,
  name text not null,
  lunch_price integer not null default 0,
  dinner_price integer not null default 0,
  company_pin text not null check (company_pin ~ '^[0-9]{4}$'),
  contact_name text,
  contact_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (restaurant_id, company_no)
);

create table public.meal_records (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  guest_type text not null default 'company' check (guest_type in ('company','other_guest')),
  meal_type text not null check (meal_type in ('lunch','dinner')),
  headcount integer not null check (headcount > 0 and headcount <= 999),
  unit_price integer not null default 0,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.meal_record_history (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  meal_record_id uuid not null references public.meal_records(id) on delete cascade,
  changed_by uuid references auth.users(id),
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  plan_code text not null default 'basic',
  status text not null default 'trial' check (status in ('trial','active','past_due','cancelled','suspended')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.companies enable row level security;
alter table public.meal_records enable row level security;
alter table public.meal_record_history enable row level security;
alter table public.subscriptions enable row level security;

create policy "members can read restaurant" on public.restaurants
for select to authenticated
using (exists (select 1 from public.restaurant_members rm where rm.restaurant_id = restaurants.id and rm.user_id = (select auth.uid())));

create policy "authenticated can create restaurant" on public.restaurants
for insert to authenticated with check (true);

create policy "members can read memberships" on public.restaurant_members
for select to authenticated
using (user_id = (select auth.uid()));

create policy "owner can create own membership" on public.restaurant_members
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "members manage companies" on public.companies
for all to authenticated
using (exists (select 1 from public.restaurant_members rm where rm.restaurant_id = companies.restaurant_id and rm.user_id = (select auth.uid())))
with check (exists (select 1 from public.restaurant_members rm where rm.restaurant_id = companies.restaurant_id and rm.user_id = (select auth.uid())));

create policy "members manage meal records" on public.meal_records
for all to authenticated
using (exists (select 1 from public.restaurant_members rm where rm.restaurant_id = meal_records.restaurant_id and rm.user_id = (select auth.uid())))
with check (exists (select 1 from public.restaurant_members rm where rm.restaurant_id = meal_records.restaurant_id and rm.user_id = (select auth.uid())));

create policy "members read meal history" on public.meal_record_history
for select to authenticated
using (exists (select 1 from public.restaurant_members rm where rm.restaurant_id = meal_record_history.restaurant_id and rm.user_id = (select auth.uid())));

create policy "members read subscription" on public.subscriptions
for select to authenticated
using (exists (select 1 from public.restaurant_members rm where rm.restaurant_id = subscriptions.restaurant_id and rm.user_id = (select auth.uid())));
