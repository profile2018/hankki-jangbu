-- Apply in Supabase SQL Editor before enabling the test card registration flow.
-- billing keys are never readable through browser-facing PostgREST.
create table if not exists public.billing_registrations (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 customer_key text not null unique,
 state uuid not null unique,
 plan text not null check(plan in ('basic','plus')),
 status text not null default 'pending' check(status in ('pending','registered','cancelled')),
 billing_key text,
 card_company text,
 card_number text,
 created_at timestamptz not null default now(),
 registered_at timestamptz
);
create index if not exists billing_registrations_owner_idx on public.billing_registrations(user_id,state);
alter table public.billing_registrations enable row level security;
revoke all on public.billing_registrations from anon,authenticated;
grant select(id,restaurant_id,user_id,customer_key,state,plan,status) on public.billing_registrations to authenticated;
grant insert(restaurant_id,user_id,customer_key,state,plan,status) on public.billing_registrations to authenticated;
-- Only server-side service-role code may write billing keys.
create policy "billing_registration_select_owner" on public.billing_registrations for select to authenticated using (user_id=(select auth.uid()) and exists(select 1 from public.restaurant_members m where m.restaurant_id=billing_registrations.restaurant_id and m.user_id=(select auth.uid())));
create policy "billing_registration_insert_owner" on public.billing_registrations for insert to authenticated with check (user_id=(select auth.uid()) and status='pending' and exists(select 1 from public.restaurant_members m where m.restaurant_id=billing_registrations.restaurant_id and m.user_id=(select auth.uid())));

