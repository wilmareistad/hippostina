-- Columns for the Stripe Checkout purchase flow.

-- The Checkout session that holds the current reservation. Null when not reserved.
-- The webhook only changes a painting if the event's session id matches, so a late
-- event for an old session cannot release or sell someone else's reservation.
alter table public.paintings
  add column checkout_session_id text;

-- How the customer gets the painting. Only pickup for now.
-- No default on purpose: the webhook must always set it.
alter table public.orders
  add column delivery_method text not null
    check (delivery_method in ('pickup'));
