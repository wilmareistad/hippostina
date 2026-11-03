-- Tracks which order emails have been sent, so the webhook can retry a failed email without
-- sending the other one again. Null means not sent yet. One column per email, since they can
-- succeed or fail separately.
alter table public.orders
  add column customer_email_sent_at timestamptz,
  add column admin_email_sent_at timestamptz;

-- Webhook: mark an email as sent. Only these columns, so it still cannot change the order itself.
grant update (customer_email_sent_at, admin_email_sent_at) on public.orders to service_role;
