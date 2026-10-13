# CLAUDE.md – Hippostina

## Project
Web shop for Hippostina, the company of the artist Stina. Built as an exam project.

- The exam project is the **test version** (Stripe test mode).
- It is built so that going live later means changing keys and config, not rebuilding.
- Every painting is a one-of-a-kind original, so each painting can only be sold once.
- Only the admin (Stina) can log in. Customers do not have accounts.

## Tech stack
- Frontend: Angular (TypeScript)
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions)
- Payments: Stripe Checkout (test mode)
- Email: Resend (called from Edge Functions)
- Hosting: Cloudflare Pages
- Design: Figma
- Version control: GitHub
- GitHub Actions: scheduled keep-alive ping to Supabase (so the free project is not paused)

## Architecture rules

### Secrets and config
- Secrets live only in environment variables or Supabase secrets. Never commit secrets.
- The Angular app may only contain public keys (Supabase anon key, Stripe publishable key).
- The Stripe secret key and the webhook secret are only used inside Edge Functions.
- No hardcoded domain or URLs. Use environment config.

### Paintings and status
- Status flow: `available -> reserved -> sold`, plus `archived`.
  - Checkout starts: painting becomes `reserved` (the session expires after about 30 minutes).
  - Webhook `checkout.session.completed`: painting becomes `sold` and the order is saved.
  - Session expires or is cancelled: painting becomes `available` again.
- Admin can also mark a painting as sold elsewhere.
- Soft delete only. Paintings are archived, never permanently deleted (old orders refer to them).
- Reserving must be atomic, so two customers cannot reserve the same painting:
  a single `update ... set status = 'reserved' where id = ... and status = 'available'`,
  and only create the Checkout session if that update changed a row.
- Store when the reservation ends (`reserved_until`). A missed `checkout.session.expired`
  webhook must not leave a painting stuck as `reserved` forever.
- The cancel URL does not expire the session by itself. Either expire it via the Stripe API
  or let it time out.

### Payments
- Prices come from our database. Create Checkout sessions with `price_data`. No hardcoded Stripe product or price IDs.
- Prices are stored as integers in öre (SEK minor unit), never as floats.
- Always verify the Stripe signature in the webhook (use the raw request body, `constructEventAsync` in Deno).
- The webhook handler must be idempotent (Stripe can send the same event more than once),
  for example with a unique constraint on the Stripe Checkout session ID in `orders`.
- Only mark as `sold` when the session's `payment_status` is `paid`.
- Never handle card data. Stripe's hosted checkout page does that.
- Our database is the source of truth for orders, not Stripe.

### Security
- Row Level Security (RLS) is enabled on all tables.
- Visitors who are not logged in can only read available paintings and cannot change any data.
- Visitors can never read `orders` (it contains customer personal data).
- Writes require the admin. Public sign-ups are disabled in Supabase Auth, otherwise anyone
  could create an "authenticated" user. Prefer policies that check for the admin explicitly,
  not only the `authenticated` role.
- Storage buckets have their own policies (`storage.objects`): public read for painting images,
  upload/delete only for the admin.
- The Supabase service role key is only used inside Edge Functions, never in Angular.
- The Stripe webhook function runs with JWT verification turned off (Stripe has no Supabase JWT),
  so the Stripe signature check is its only protection.
- Collect only the customer data that is needed for the order (GDPR).
- If RLS gets too hard to get right, plan B is to move all writes into Edge Functions.

## Conventions
- Code, comments and commit messages in English.
- UI language: TODO (decide Swedish or English).
- Angular: standalone components, strict TypeScript, kebab-case file names, one component per folder.
- Edge Functions live in `supabase/functions/<function-name>/` (Deno + TypeScript, packages via `npm:` imports).
- Database changes only through migrations in `supabase/migrations/`.
- Small, focused commits.

## Project structure
- Angular app in the repo root (`src/`, `angular.json`).
- `supabase/` – config, migrations and Edge Functions (created by `supabase init`).
- `docs/` – `ai-log.md`, `go-live-checklist.md` and other documentation.
- `.github/workflows/` – keep-alive ping.
- Local secrets go in `.env` / `supabase/functions/.env`, which must be in `.gitignore`.

## Commands
- `ng serve` – run the Angular app locally (http://localhost:4200).
- `ng build` – production build (output in `dist/`, used by Cloudflare Pages).
- `ng test` – unit tests.
- `supabase migration new <name>` – create a new migration file.
- `supabase db push` – apply migrations to the linked Supabase project.
- `supabase functions deploy <name>` – deploy an Edge Function.
- `supabase secrets set KEY=value` – set a secret for Edge Functions.
- `stripe listen --forward-to <webhook-url>` – forward test webhooks while developing.

## Testing notes
- Use Stripe test cards (for example `4242 4242 4242 4242`).
- Test the three outcomes: successful payment, cancelled payment, expired session.
- Test RLS as a logged-out visitor (try to read orders and update a painting; both must fail).
- Until a domain is verified, Resend only sends to my own email. Use my own address as the customer email when testing.
- Test the status flow with two browser tabs (two customers, one painting).

## Ask before you
- Change the database schema or RLS policies
- Edit or overwrite existing migrations
- Add new dependencies
- Delete existing project files
- Touch anything related to live Stripe keys

## Scope (short)
- **Must**: artist and contact info, gallery and product page, admin login, CRUD for paintings, painting disappears when sold, Stripe Checkout (test), webhook and status handling, order emails and receipts, order overview, legal pages (terms, withdrawal, privacy), pickup option, responsive design, deployed.
- **Should**: shipping option, "shipped" email with tracking number, rate limiting / bot protection.
- **Could**: go live, print-on-demand, shipping label API.
- **Won't**: customer accounts, custom payment handling.
- Full project plan (MVP, Definition of Done, sprint plan, risks): `docs/project-plan.md`.
  Read it when planning work, deciding what to do next, or checking scope.

## Working style
- I am learning Angular. Explain new concepts briefly and prefer small steps.
- Point out security problems when you see them.
- Say when you are unsure. I check important things against the official docs.
- Significant AI-assisted decisions are logged in `docs/ai-log.md`.