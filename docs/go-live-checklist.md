# Go-live checklist (draft)

Going live is a **Could** item. This list shows that going live means changing config, not code.
Update it during the project when new settings or keys are added.

## Stripe
- [ ] Stripe account activated with Stina's real business information (and bank account).
- [ ] Live secret key set as a Supabase secret (`STRIPE_SECRET_KEY`).
- [ ] Live publishable key in the Angular production environment (if it is used).
- [ ] New live webhook endpoint created in the Stripe Dashboard, pointing to the webhook Edge Function.
      Same setup as the sandbox endpoint: scope "Your account", payload style "Snapshot", events
      `checkout.session.completed` and `checkout.session.expired`.
- [ ] Live webhook signing secret set as a Supabase secret (`STRIPE_WEBHOOK_SECRET`). Each endpoint has its
      own secret, and `stripe listen` uses another one, so this secret must belong to the live endpoint.
- [ ] Minimum price in the painting form (`MIN_PRICE_KRONOR` in `src/app/core/price.ts`) checked against
      Stripe's current minimum charge amount for SEK.
- [ ] Business name, logo and support email set for the Checkout page and receipts.

## Domain and hosting
- [ ] Custom domain connected to the Cloudflare Worker.
- [ ] `SITE_URL` (used for success and cancel URLs) updated to the real domain.
- [ ] Supabase Auth site URL and redirect URLs updated to the real domain.

## Email (Resend)
- [ ] Domain verified in Resend (SPF/DKIM DNS records).
- [ ] Sender address changed from the test sender to the real domain (Supabase secret `EMAIL_FROM`).
- [ ] Admin notification email set to Stina's address (Supabase secret `ADMIN_EMAIL`).
- [ ] Resend API key belongs to the account with the verified domain (Supabase secret `RESEND_API_KEY`).
- [ ] Rate limit added to `send-contact-message`, or the risk accepted. The function is open to everyone and only
      has a honeypot, so a bot could fill Stina's inbox or use up the Resend quota that the order emails need.
- [ ] Placeholder address `stina@example.com` in `src/app/contact/contact-content.ts` replaced with the real one.

## Supabase
- [ ] Decide if the free plan is enough (pausing, backups) or if Pro is needed.
- [ ] Public sign-ups still disabled. Only Stina's admin user exists.
- [ ] `public.admins` contains only Stina's user ID (the developer's ID removed).
- [ ] RLS tested again as a logged-out visitor.
- [ ] Test data (paintings and orders) removed.
- [ ] Vault secrets `project_url` and `publishable_key` (used by the `release-expired-reservations` pg_cron job)
      point to the live project and its publishable key. Created by hand in the SQL Editor, not in a migration.
- [ ] pg_cron jobs exist in the live project and run without errors (`select * from cron.job_run_details`).

## Legal
- [ ] Terms of purchase, right of withdrawal and privacy policy approved by Stina (based on Konsumentverket's checklists).
- [ ] All placeholders in brackets on the legal pages filled in or removed (`src/app/legal/`), and the
      draft notice (`app-draft-notice`) removed from each page once Stina has approved it.
- [ ] Withdrawal function on the site: clearly labelled, available during the whole withdrawal period, and
      sends a receipt in a durable form (required since 2026-06-19, Konsumentverket: "Informationskrav vid
      distansavtal"). Must be built, and the note on `/kopvillkor` removed.
- [ ] Standard withdrawal form included in the order confirmation, or otherwise given in a durable form.
- [ ] Link to Konsumentverket's withdrawal form on `/kopvillkor` opened in a browser (it refuses automated requests).
- [ ] Retention time for order data confirmed against the Accounting Act (bokföringslagen) and written in the
      privacy policy, and a way to delete order data after that time decided.
- [ ] Google Fonts: self-host the fonts, or check Google's transfer terms and complete the privacy policy.
- [ ] Privacy policy checked again against the features in use (for example the contact form, #74).
- [ ] Company information (name, org.nr, address, contact) shown on the site.
- [ ] Seller details in the order emails replaced with the real ones (`SELLER` in `supabase/functions/_shared/order-emails.ts`).
- [ ] Receipt content, including VAT, checked against Skatteverket and with Stina.

## Final test
- [ ] One real purchase with a small amount (at least the minimum price), then a refund.
- [ ] After that purchase: the webhook delivery succeeded in the Stripe Dashboard, the painting is `sold`,
      the order is saved, and both order emails arrived.
- [ ] A cancelled purchase makes the painting `available` again.
