-- Table privileges for the API roles. This project does not grant them by default.
-- GRANT decides if a role may touch a table at all; RLS policies still decide which rows.

-- Visitors and the admin can read paintings (RLS: visitors only see `available`).
grant select on public.paintings to anon, authenticated;

-- Only logged-in users can write; RLS limits this to the admin. No delete (soft delete only).
grant insert, update on public.paintings to authenticated;

-- Orders contain personal data. RLS limits reading to the admin.
grant select on public.orders to authenticated;

-- `admins` gets no grants: it is only read through public.is_admin().
