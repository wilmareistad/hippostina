-- Bucket for painting images. Public read; only the admin can upload, change or delete.

-- public = true: images can be shown with a plain public URL, without a JWT.
-- file_size_limit and allowed_mime_types are enforced by Supabase Storage on upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'painting-images',
  'painting-images',
  true,
  10 * 1024 * 1024, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Anyone can list and download files in this bucket through the API.
create policy "Anyone can read painting images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'painting-images');

-- The extension check is extra protection, because the MIME type is set by the client.
create policy "Admin can upload painting images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'painting-images'
    and public.is_admin()
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  );

create policy "Admin can update painting images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'painting-images' and public.is_admin())
  with check (
    bucket_id = 'painting-images'
    and public.is_admin()
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  );

create policy "Admin can delete painting images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'painting-images' and public.is_admin());
