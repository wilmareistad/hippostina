-- Edge Functions use the service role (supabaseAdmin) for checkout and the Stripe webhook.
-- This project does not grant table privileges by default, so grant only what they need.

-- create-checkout, cancel-checkout and the webhook: read and update paintings.
grant select, update on public.paintings to service_role;

-- Webhook: save orders. Select is needed to read back the saved row.
grant select, insert on public.orders to service_role;
