# Hippostina

Web shop for **Hippostina**, the company of the artist Stina. Every painting is a one-of-a-kind
original, so each painting can only be sold once. Visitors browse the gallery and pay with Stripe
Checkout. The artist logs in as admin to manage paintings and orders. Customers do not need an account.

Built as an exam project. The shop runs in **Stripe test mode**. Going live means changing keys and
config, not code (see [docs/go-live-checklist.md](docs/go-live-checklist.md)).

**Live demo (test mode):** https://hippostina.wilmareistad.workers.dev

## Features

- Gallery and product pages. A painting disappears from the shop once it is sold.
- Checkout with Stripe Checkout (hosted page, no card data touches the site).
- Atomic reservation: two customers cannot buy the same painting at the same time.
- Stripe webhook marks paintings as sold and saves the order. Expired or cancelled checkouts make
  the painting available again (with a scheduled job as a backup if a webhook is missed).
- Order confirmation emails to the customer and the admin (Resend).
- Admin area: log in, create/edit/archive/delete paintings, upload images, order overview,
  mark orders as shipped.
- Contact form, artist page and legal pages (terms, right of withdrawal, privacy).
- Pickup option and responsive design. UI language is Swedish.

## Tech stack

| Part      | Technology                                                       |
| --------- | ---------------------------------------------------------------- |
| Frontend  | Angular 22 (standalone components, strict TypeScript)            |
| Backend   | Supabase: Postgres with Row Level Security, Auth, Storage, Edge Functions (Deno) |
| Payments  | Stripe Checkout (test mode)                                      |
| Email     | Resend, called from Edge Functions                               |
| Hosting   | Cloudflare Workers (static assets)                               |
| CI        | GitHub Actions (keep-alive ping so the free Supabase project is not paused) |

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`) and npm
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Stripe CLI](https://docs.stripe.com/stripe-cli) (for testing webhooks locally)
- Accounts (all have free tiers): [Supabase](https://supabase.com), [Stripe](https://stripe.com),
  [Resend](https://resend.com), and [Cloudflare](https://cloudflare.com) if you want to deploy

### 1. Clone and install

```bash
git clone https://github.com/wilmareistad/hippostina.git
cd hippostina
nvm use          # optional, picks Node 24 from .nvmrc
npm install
```

### 2. Run the frontend only

The repo already points at the project's own Supabase test backend, so this is enough to look at
the shop:

```bash
npm start        # same as ng serve
```

Open http://localhost:4200.

To run the whole system against **your own** backend, continue with the steps below.

### 3. Create a Supabase project

1. Create a new project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Connect the repo to your project and create the database. The commands below:
   - `supabase login` opens the browser so you can log in to Supabase.
   - `supabase link` connects this folder to your project. The project ref is the ID in your
     project URL: `https://<project-ref>.supabase.co`. You will be asked for the database password
     you chose when you created the project.
   - `supabase db push` runs all files in `supabase/migrations/` against your database. This
     creates the tables, security rules (RLS), the image storage bucket and scheduled jobs.

   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

3. In **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**.
   Otherwise anyone could create an account.
4. Create the admin user in **Authentication → Users → Add user** (email and password).
5. Make that user an admin. Copy the user's ID and run this in the **SQL Editor**:

   ```sql
   insert into public.admins (user_id) values ('<user-id>');
   ```

6. Add two Vault secrets, used by the cron job that releases expired reservations
   (**SQL Editor**):

   ```sql
   select vault.create_secret('https://<your-project-ref>.supabase.co', 'project_url');
   select vault.create_secret('<your-publishable-key>', 'publishable_key');
   ```

### 4. Configure the Angular app

Edit `src/environments/environment.development.ts` (used by `ng serve`) and
`src/environments/environment.ts` (used by `ng build`):

```ts
export const environment = {
  production: false,                       // true in environment.ts
  siteUrl: 'http://localhost:4200',        // your deployed URL in environment.ts
  supabaseUrl: 'https://<your-project-ref>.supabase.co',
  supabaseAnonKey: '<your Supabase publishable/anon key>',
  stripePublishableKey: 'pk_test_...',
};
```

Only **public** keys belong here. Never put a secret key in the Angular app.

### 5. Set Edge Function secrets in Supabase

| Secret                  | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe secret key (`sk_test_...`)                              |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint (`whsec_...`, see step 7) |
| `RESEND_API_KEY`        | Resend API key                                                 |
| `EMAIL_FROM`            | Sender address, e.g. `Hippostina <onboarding@resend.dev>`      |
| `ADMIN_EMAIL`           | Where order notifications and contact messages are sent        |
| `SITE_URL`              | Public URL of the site (used for Stripe success/cancel URLs)   |

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_... RESEND_API_KEY=re_... \
  EMAIL_FROM="Hippostina <onboarding@resend.dev>" ADMIN_EMAIL=you@example.com \
  SITE_URL=http://localhost:4200
```

For local function development, put the same values in `supabase/functions/.env`
(ignored by git).

> Until you verify a domain in Resend, it only sends email to your own address.
> Use that address as the customer email when testing.

### 6. Deploy the Edge Functions

```bash
supabase functions deploy create-checkout
supabase functions deploy cancel-checkout
supabase functions deploy stripe-webhook
supabase functions deploy send-contact-message
```

JWT verification is turned off for these functions in `supabase/config.toml`.
The webhook is protected by the Stripe signature check instead.

### 7. Set up the Stripe webhook

**Deployed:** in the Stripe Dashboard (test mode), go to **Developers → Webhooks**, add an endpoint
pointing to `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook` and select the events
`checkout.session.completed` and `checkout.session.expired`. Copy the signing secret:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Local testing:** forward test events with the Stripe CLI. It prints its own `whsec_...` secret,
which must be set as `STRIPE_WEBHOOK_SECRET` while you test this way:

```bash
stripe login
stripe listen --forward-to https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
```

### 8. Deploy the frontend (Cloudflare Workers)

```bash
npm run build                 # output in dist/hippostina/browser
npx wrangler deploy           # uses wrangler.jsonc
```

Or connect the GitHub repo to Cloudflare Workers so every push builds and deploys automatically
(build command `npm run build`). Remember to update `siteUrl` in `environment.ts` and the
`SITE_URL` secret to the deployed URL.

### 9. Keep-alive (optional)

Free Supabase projects are paused after a week without activity. The workflow in
`.github/workflows/keep-alive.yml` pings the database every three days. Add the repository secrets
`SUPABASE_URL` and `SUPABASE_ANON_KEY` under **Settings → Secrets and variables → Actions**.

## Commands

| Command                              | Description                         |
| ------------------------------------ | ----------------------------------- |
| `npm start`                          | Dev server on http://localhost:4200 |
| `npm run build`                      | Production build to `dist/`         |
| `npm test`                           | Unit tests (Vitest)                 |
| `supabase migration new <name>`      | Create a new migration              |
| `supabase db push`                   | Apply migrations                    |
| `supabase functions deploy <name>`   | Deploy an Edge Function             |

## Testing a purchase

Use the Stripe test card `4242 4242 4242 4242`, any future expiry date and any CVC.
Test the three outcomes: successful payment, cancelled payment and expired session.
The full test report is in [docs/test-report.md](docs/test-report.md).

## Security

- Row Level Security is enabled on all tables. Visitors can only read available paintings and can
  never read orders. All writes require the admin (checked against the `admins` table).
- Stripe secret key, webhook secret and service role key are only used in Edge Functions.
- Prices come from the database (in öre) and are sent to Stripe with `price_data`.
- The webhook verifies the Stripe signature and is idempotent.

## License

The source code is licensed under the [MIT License](LICENSE).

The artwork, painting images, photos (such as `public/stina.png`) and the Hippostina name are
**not** covered by the license. All rights reserved by the artist.

## Author

Wilma Reistad ([@wilmareistad](https://github.com/wilmareistad))
