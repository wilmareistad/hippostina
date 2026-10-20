-- The admin can permanently delete a painting, but only an archived one.
--
-- Because test paintings and mistakes would otherwise stay in the archive forever.
-- Paintings with orders can never be deleted: orders.painting_id is "on delete restrict",
-- so the database refuses even if the admin tries (or the app has a bug).

-- GRANT decides if the role may delete at all; the policy below decides which rows.
grant delete on public.paintings to authenticated;

-- Visitors have no delete grant and no policy. An admin must archive a painting first.
create policy "Admin can delete archived paintings"
  on public.paintings for delete
  to authenticated
  using (public.is_admin() and status = 'archived');
