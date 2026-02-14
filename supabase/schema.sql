-- House of Crafts – Supabase schema
-- Run this in Supabase Dashboard → SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: create profile on signup
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Products (public read)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  category text not null,
  price numeric not null check (price >= 0),
  image_url text,
  badge text check (badge in ('new_arrival', 'best_seller')),
  created_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

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

create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());
create policy "Admins can update products"
  on public.products for update
  using (public.is_admin());
create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- Orders (user-scoped)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'cancelled')),
  shipping_address jsonb not null,
  total numeric not null check (total >= 0),
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can read own orders or admin reads all"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());
create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin());

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity int not null check (quantity > 0),
  price_at_order numeric not null check (price_at_order >= 0)
);

alter table public.order_items enable row level security;

create policy "Users can insert order_items for own orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Users or admin can read order_items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- Newsletter subscribers
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can insert newsletter email"
  on public.newsletter_subscribers for insert
  with check (true);
create policy "Admins can read newsletter subscribers"
  on public.newsletter_subscribers for select
  using (public.is_admin());

-- Seed products (run after schema)
insert into public.products (id, name, slug, category, price, image_url, badge) values
  (gen_random_uuid(), 'Indigo Inlay Commode', 'indigo-inlay-commode', 'Bedroom Furniture', 1299, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuz52AHhQKgPoAjgV_tWGgJnrLX5hvdaOeNDwMwtFYTgFl8x1rO73D9qiEDSKKrUs6GlhXof8FZSKNHfeK7eyGyf4cNPEtWwdxUX83UIrQar8Wg4LisNXPsFigNglDTIRnDzVYJCXKbIhsN64Lj6GhM97uEJqVl2sED36GinsW8amhYQiKWChE6rn7gSeB2o0y7GnMecqM_Id3EIuaxvrFEHwFNyMTJ6Es8VMiw1JWgDe7qIU6EDX1Kh9JGFO_CRKGpOQdffW6_YE', 'new_arrival'),
  (gen_random_uuid(), 'Marwar Coffee Table', 'marwar-coffee-table', 'Living Room', 450, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBqAI2yi_4Mo6Q5Af0lKBPzungNnR_f-d5GETv0vKXooiqt7hY1jaZrIdgNv6H_z2lrQB-sqnMGvIsO4D2N0YMM_PdXg97rJB7YJ54tqsp14uKnc59e_lAolqceKstDZZ6_rcUQsy12NJgxcT752SlzOVqxDWfee_zUE4Wo7YEE7C4LBbaMLexeHIK2LLZ4iE2iz_VNw6jeuA91xXySK1b5qeIb8WlmaiLoQ_m7Am3_cNQWkEx_dheop9sPqe03GmGisDJesx3j1k', null),
  (gen_random_uuid(), 'Sunburst Jodhpur Mirror', 'sunburst-jodhpur-mirror', 'Wall Decor', 210, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYNtzJ4NrX2-ywpZWFZgW_Jwo5KCGxPlYtkrwtwYAM-AgxPzrekNThcWBIxjamltFp4DiELXDBHaBsusnZWwvZ9syx759fpCC1wS8N4_NHYzF00j59aNjjgwRDvvc1ZvkyfveQ8twpmEjJ2Gmrff_4KlshuA0TLMlDt7Xj5Pi4lexMLNTLK8pOOYnkwVWdqXMh6W8LqLxWBfj5taci_BEdhe2hsuI4G8Zkx8pyf4auy7WGGOjXievyGK4bS4dX_89WQSrfpFBcBg4', 'best_seller'),
  (gen_random_uuid(), 'Desert Teak Chair', 'desert-teak-chair', 'Seating', 299, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrbiYwmOYRQyFcpNcxX_uue_9J1bGbGzVGnFFw3FJeZ0CXOZQQGwwp_BQAqwwi2Sj5KY_pR8ApbGqWiHPwBz1C1nUQmTB5UYWc8v5-S8FzfEZGknRKHa34-ksL9nG72O2wvm0i5nHJcBW7TJDoWqg4CRh7tM2_kxhODM6nNUL4LNEiIRhwotTUygo7A379hy6ZGDTkSkkCHK77ogfmf5G5zDiExoIQ5XrekCM2aw93WjiU9l0JfRAnzCqGYzzsuILZly86eF7oxeI', null)
on conflict (slug) do nothing;
