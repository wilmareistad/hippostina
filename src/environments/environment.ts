// Used by `ng build` (production). Public values only: never put secret keys here.
// While the shop is in test mode, this still uses the Stripe test publishable key.
export const environment = {
  production: true,
  siteUrl: 'PASTE_CLOUDFLARE_PAGES_URL_HERE',
  supabaseUrl: 'PASTE_SUPABASE_PROJECT_URL_HERE',
  supabaseAnonKey: 'PASTE_SUPABASE_PUBLIC_KEY_HERE',
  stripePublishableKey: 'PASTE_STRIPE_PUBLISHABLE_KEY_HERE', // pk_test_...
};
