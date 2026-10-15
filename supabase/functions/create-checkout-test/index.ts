// Sprint 1 spike: proves that Angular -> Edge Function -> Stripe Checkout works.
// The amount is hardcoded on purpose. The real checkout function (sprint 3) reserves
// the painting and takes the price from the database this function is removed then.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import Stripe from "stripe";

// Set with `supabase secrets set`. Never sent to the browser.
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
// Taken from config, never from the request, so a caller cannot choose where Stripe redirects.
const siteUrl = Deno.env.get("SITE_URL");

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export default {
  // auth: 'user' rejects requests without a valid user JWT. CORS is handled by withSupabase.
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (!stripe || !siteUrl) {
      console.error("STRIPE_SECRET_KEY or SITE_URL is not set");
      return Response.json({ error: "Server is not configured" }, { status: 500 });
    }

    // A valid JWT only means "logged in". Check that the user is the admin.
    // ctx.supabase runs as the calling user, so auth.uid() inside is_admin() is that user.
    const { data: isAdmin, error: adminError } = await ctx.supabase.rpc("is_admin");
    if (adminError || isAdmin !== true) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "sek",
              unit_amount: 10000, // 100 kr in öre
              product_data: { name: "Test painting" },
            },
          },
        ],
        success_url: `${siteUrl}/admin?checkout=success`,
        cancel_url: `${siteUrl}/admin?checkout=cancelled`,
      });

      return Response.json({ url: session.url });
    } catch (error) {
      // Log the details for us, but do not send Stripe's error message to the browser.
      console.error("Stripe error:", error);
      return Response.json({ error: "Could not create checkout session" }, { status: 502 });
    }
  }),
};
