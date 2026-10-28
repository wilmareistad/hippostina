// Receives events from Stripe. Anyone can call this URL, so the Stripe signature check is the only
// protection: nothing is read from the event before the signature has been verified.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import Stripe from "stripe";

// Set with `supabase secrets set`. Never sent to the browser.
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
// The endpoint's signing secret (whsec_...). From `stripe listen` while testing, from the
// webhook endpoint in the Stripe Dashboard when it is set up there.
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
// Deno has no Node crypto module, so the signature is checked with the Web Crypto API.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

export default {
  // cors: false because only Stripe's servers call this, never a browser.
  fetch: withSupabase({ auth: "none", cors: false }, async (req) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (!stripe || !webhookSecret) {
      console.error("STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set");
      return Response.json({ error: "Server is not configured" }, { status: 500 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return Response.json({ error: "Missing signature" }, { status: 400 });
    }

    // The signature is computed over the exact bytes Stripe sent, so read the raw body as text.
    // Parsing it as JSON first and turning it back into a string would break the check.
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      );
    } catch (error) {
      // Wrong secret, changed body or a too old timestamp. Do not say which one.
      console.error("Invalid signature:", error instanceof Error ? error.message : error);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("Received event:", event.type, event.id);

    // Events we do not handle also get 200, otherwise Stripe keeps sending them again.
    return Response.json({ received: true });
  }),
};
