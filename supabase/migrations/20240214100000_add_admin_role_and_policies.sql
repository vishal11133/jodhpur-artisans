-- House of Crafts – Admin role and RLS policies
-- Run after init_schema. Adds role to profiles, is_admin(), and admin-only policies.

-- 1. Add role column to profiles (nullable first for existing rows)
alter table public.profiles
  add column if not exists role text check (role in ('user', 'admin'));

-- Backfill existing rows
update public.profiles set role = 'user' where role is null;

-- Make not null with default
alter table public.profiles
  alter column role set default 'user';
alter table public.profiles
  alter column role set not null;

-- 2. Update trigger: new signups get role = 'user'
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Security definer function for RLS: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 4. Products: admin can insert, update, delete
create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products for update
  using (public.is_admin());

create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- 5. Orders: admin can select all and update (e.g. status)
-- Replace "Users can read own orders" with one that also allows admin to read all
drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders or admin reads all"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin());

-- 6. Order items: admin can read all (for order details)
drop policy if exists "Users can read order_items for own orders" on public.order_items;
create policy "Users or admin can read order_items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- 7. Optional: admins can read newsletter subscribers
create policy "Admins can read newsletter subscribers"
  on public.newsletter_subscribers for select
  using (public.is_admin());
