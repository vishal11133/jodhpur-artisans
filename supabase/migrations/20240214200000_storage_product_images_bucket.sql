-- House of Crafts – Product images storage bucket (public read, admin write)
-- Run after add_admin_role_and_policies so public.is_admin() exists.

-- Create public bucket for product images (anyone can read via URL)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- RLS on storage.objects: public read for product-images bucket
create policy "Product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only admins can upload to product-images
create policy "Admins can insert product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and public.is_admin()
  );

-- Only admins can update or delete product images
create policy "Admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
