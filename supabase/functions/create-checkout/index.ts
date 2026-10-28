// Reserves a painting and creates a Stripe Checkout session for it.
// Called by visitors from the product page, so there is no login. supabaseAdmin bypasses RLS,
// which means every input is validated before it is used.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import Stripe from "stripe";

// Set with `supabase secrets set`. Never sent to the browser.
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
// Taken from config, never from the request, so a caller cannot choose where Stripe redirects.
const siteUrl = Deno.env.get("SITE_URL");

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Only pickup for now
const DELIVERY_METHODS = ["pickup"];
// Stripe requires at least 30 minutes. One extra minute so a slow request never makes it too short.
const SESSION_MINUTES = 31;
// The reservation outlives the session, so a payment can never complete after the painting
// has been released and reserved by someone else.
const RESERVATION_MINUTES = SESSION_MINUTES + 5;

export default {
  // auth: "publishable" only accepts requests with the project's publishable key (apikey header).
  // The key is public, so this is not bot protection, only "a known client". CORS is handled by withSupabase.
  fetch: withSupabase({ auth: "publishable" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (!stripe || !siteUrl) {
      console.error("STRIPE_SECRET_KEY or SITE_URL is not set");
      return Response.json({ error: "Server is not configured" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { painting_id: paintingId, delivery } = (body ?? {}) as Record<string, unknown>;
    if (
      typeof paintingId !== "string" ||
      !UUID_PATTERN.test(paintingId) ||
      typeof delivery !== "string" ||
      !DELIVERY_METHODS.includes(delivery)
    ) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const now = Date.now();
    const expiresAt = Math.floor(now / 1000) + SESSION_MINUTES * 60;
    const reservedUntil = new Date(now + RESERVATION_MINUTES * 60 * 1000).toISOString();

    // Atomic reservation: only one request can change the row from available to reserved.
    const { data: painting, error: reserveError } = await ctx.supabaseAdmin
      .from("paintings")
      .update({ status: "reserved", reserved_until: reservedUntil, checkout_session_id: null })
      .eq("id", paintingId)
      .eq("status", "available")
      .select("id, title, price_ore")
      .maybeSingle();

    if (reserveError) {
      console.error("Reserve error:", reserveError);
      return Response.json({ error: "Could not reserve painting" }, { status: 500 });
    }
    if (!painting) {
      // Already reserved, sold, archived or does not exist.
      return Response.json({ error: "Painting is not available" }, { status: 409 });
    }

    // Undo our own reservation. Only matches while no session id is saved, so it can never
    // release a reservation that belongs to a Checkout session.
    const releaseReservation = async () => {
      const { error } = await ctx.supabaseAdmin
        .from("paintings")
        .update({ status: "available", reserved_until: null })
        .eq("id", painting.id)
        .eq("status", "reserved")
        .is("checkout_session_id", null);
      if (error) {
        console.error("Release error:", error);
      }
    };

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "sek",
              unit_amount: painting.price_ore, // öre, from our database
              product_data: { name: painting.title },
            },
          },
        ],
        allowed_payment_method_types: ["card"],
        name_collection: { individual: { enabled: true } },
        locale: "sv",
        expires_at: expiresAt,
        // Read by the webhook. Short and without personal data.
        metadata: { painting_id: painting.id, delivery },
        success_url: `${siteUrl}/kop/tack`,
        cancel_url: `${siteUrl}/kop/avbrutet`,
      });
    } catch (error) {
      // Log the details for us, but do not send Stripe's error message to the browser.
      console.error("Stripe error:", error);
      await releaseReservation();
      return Response.json({ error: "Could not create checkout session" }, { status: 502 });
    }

    const { data: saved, error: saveError } = await ctx.supabaseAdmin
      .from("paintings")
      .update({ checkout_session_id: session.id })
      .eq("id", painting.id)
      .eq("status", "reserved")
      .is("checkout_session_id", null)
      .select("id")
      .maybeSingle();

    if (saveError || !saved) {
      console.error("Could not save session id:", saveError);
      // The session URL was never sent to the browser, but expire it anyway so nobody can pay.
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (error) {
        console.error("Could not expire session:", error);
      }
      await releaseReservation();
      return Response.json({ error: "Could not create checkout session" }, { status: 500 });
    }

    return Response.json({ url: session.url, sessionId: session.id });
  }),
};
