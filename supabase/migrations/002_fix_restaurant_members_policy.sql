-- Fix recursive RLS evaluation between restaurants and restaurant_members.
-- The SECURITY DEFINER helper checks restaurant ownership without re-entering RLS.

create or replace function public.is_restaurant_owner(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurants r
    where r.id = target_restaurant_id
      and r.owner_user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_restaurant_owner(uuid) from public;
grant execute on function public.is_restaurant_owner(uuid) to authenticated;

drop policy if exists "restaurant owner can create membership" on public.restaurant_members;
drop policy if exists "owner can create own membership" on public.restaurant_members;

create policy "restaurant owner can create membership"
on public.restaurant_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.is_restaurant_owner(restaurant_id)
);
