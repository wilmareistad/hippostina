// Used by `ng build` (production). Public values only: never put secret keys here.
// While the shop is in test mode, this still uses the Stripe test publishable key.
export const environment = {
  production: true,
  siteUrl: 'https://hippostina.wilmareistad.workers.dev',
  supabaseUrl: 'https://xfsblmsellacsvhpkohv.supabase.co',
  supabaseAnonKey: 'sb_publishable_FIRXmXRMXua5ROd2KvfrmQ_Dasrwb6d',
  stripePublishableKey: 'pk_test_51UQ3LEDfjnv4bXoA1SqwvGF5zT9r5v1q9KY80HRVYGYni6Y1LINk9QbedcHAeOQ99OSkZS3SlPAab0PNde9CIMmS00LjgHfMy3', // pk_test_...
};
