# Product images storage setup

If you see **"Bucket not found"** when saving a product in Admin → Products, the Supabase Storage bucket for product images has not been created yet.

## Option 1: Run the migration (recommended)

In **Supabase Dashboard → SQL Editor**, run the contents of:

```
supabase/migrations/20240214200000_storage_product_images_bucket.sql
```

That creates the `product-images` bucket (public) and the RLS policies so only admins can upload; everyone can view.

You must run the admin role migration first (`20240214100000_add_admin_role_and_policies.sql`) so `public.is_admin()` exists.

## Option 2: Create the bucket in the Dashboard

If the migration fails or you prefer to create the bucket manually:

1. Open **Supabase Dashboard** → **Storage**.
2. Click **New bucket**.
3. **Name:** `product-images` (exactly this; the app uses this id).
4. Enable **Public bucket** so product images load without auth.
5. Click **Create bucket**.

Then add the RLS policies so only admins can upload. In **SQL Editor** run:

```sql
-- Public read
create policy "Product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Admin-only upload/update/delete
create policy "Admins can insert product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
```

After the bucket exists (and policies are in place if you used Option 2), try saving the product again; the image should upload and the error should go away.
