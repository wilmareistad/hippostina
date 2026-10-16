-- Only the admin can list files in the painting-images bucket.
--
-- The bucket is public, so images are served by their public URL without any SELECT policy.
-- The old policy only added the ability for anyone to list all file names through the API,
-- which would also reveal images of archived or unpublished paintings.

drop policy "Anyone can read painting images" on storage.objects;

-- Kept for the admin, because some Storage operations (for example upsert) need SELECT.
create policy "Admin can read painting images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'painting-images' and public.is_admin());
