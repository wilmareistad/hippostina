# Go-live checklist (draft)

Going live is a **Could** item. This list shows that going live means changing config, not code.
Update it during the project when new settings or keys are added.

## Stripe
- [ ] Stripe account activated with Stina's real business information (and bank account).
- [ ] Live secret key set as a Supabase secret (`STRIPE_SECRET_KEY`).
- [ ] Live publishable key in the Angular production environment (if it is used).
- [ ] New live webhook endpoint created in the Stripe Dashboard, pointing to the webhook Edge Function.
- [ ] Live webhook signing secret set as a Supabase secret (`STRIPE_WEBHOOK_SECRET`).
- [ ] Business name, logo and support email set for the Checkout page and receipts.

## Domain and hosting
- [ ] Custom domain connected in Cloudflare Pages.
- [ ] `SITE_URL` (used for success and cancel URLs) updated to the real domain.
- [ ] Supabase Auth site URL and redirect URLs updated to the real domain.

## Email (Resend)
- [ ] Domain verified in Resend (SPF/DKIM DNS records).
- [ ] Sender address changed from the test sender to the real domain.
- [ ] Admin notification email set to Stina's address.

## Supabase
- [ ] Decide if the free plan is enough (pausing, backups) or if Pro is needed.
- [ ] Public sign-ups still disabled. Only Stina's admin user exists.
- [ ] `public.admins` contains only Stina's user ID (the developer's ID removed).
- [ ] RLS tested again as a logged-out visitor.
- [ ] Test data (paintings and orders) removed.

## Legal
- [ ] Terms of purchase, right of withdrawal and privacy policy approved by Stina (based on Konsumentverket's checklists).
- [ ] Company information (name, org.nr, address, contact) shown on the site.

## Final test
- [ ] One real purchase with a small amount, then a refund.
