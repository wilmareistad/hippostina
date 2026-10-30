-- Safety net for missed checkout.session.expired webhooks: releases reservations whose
-- reserved_until has passed, so no painting stays reserved forever.
--
-- A paid painting must never be released, even if its checkout.session.completed webhook is late
-- (Stripe retries for up to three days). So paintings with a Checkout session are not released here:
-- the job calls cancel-checkout, which asks Stripe and only releases an expired session.
--
-- Needs two Vault secrets, created by hand in the SQL Editor (never in a migration):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<publishable key>', 'publishable_key');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Two jobs instead of one, so an error in the HTTP job (for example a missing Vault secret)
-- cannot roll back the SQL-only release.

-- No session means create-checkout failed before a Checkout page existed, so nobody can have
-- paid. Safe to release directly. A reserved painting without reserved_until is broken, so it
-- is released too instead of staying reserved forever.
select cron.schedule(
  'release-reservations-without-session',
  '*/5 * * * *',
  $$
  update public.paintings
  set status = 'available', reserved_until = null
  where status = 'reserved'
    and checkout_session_id is null
    and (reserved_until is null or reserved_until < now());
  $$
);

-- With a session, Stripe decides: cancel-checkout releases the painting only if the session is
-- expired, and leaves a paid one reserved for the webhook. Uses the publishable key, the same
-- way as a visitor's browser, so no secret key is stored in the database.
-- If Stripe cannot be reached nothing happens, and the next run tries again.
-- Timeout 10 s: the default 2 s is too short for a cold start plus two Stripe calls.
select cron.schedule(
  'release-expired-reservations',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/cancel-checkout',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
    ),
    body := jsonb_build_object('session_id', checkout_session_id),
    timeout_milliseconds := 10000
  )
  from public.paintings
  where status = 'reserved'
    and checkout_session_id is not null
    and (reserved_until is null or reserved_until < now());
  $$
);
