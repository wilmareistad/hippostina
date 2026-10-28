// Cancels a started purchase: expires the Stripe Checkout session and releases the painting at once,
// instead of waiting for the session to time out. Called by visitors from the cancel page and the
// product page, so there is no login. supabaseAdmin bypasses RLS, which means every input is
// validated before it is used.
//
// Takes the session id, never the painting id: painting ids are public, session ids are only known
// to the customer's own browser tab.
//
// Always answers 200 { ok: true } for a valid id, whether the session is unknown, already released,
// paid or released now, so the answer never tells anything about a painting.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import Stripe from "stripe";

// Set with `supabase secrets set`. Never sent to the browser.
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Checkout session ids look like cs_test_a1B2... (test mode) or cs_live_... (live mode).
const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]{1,255}$/;

export default {
  // auth: "publishable" only accepts requests with the project's publishable key (apikey header).
  // The key is public, so this is not bot protection, only "a known client". CORS is handled by withSupabase.
  fetch: withSupabase({ auth: "publishable" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (!stripe) {
      console.error("STRIPE_SECRET_KEY is not set");
      return Response.json({ error: "Server is not configured" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { session_id: sessionId } = (body ?? {}) as Record<string, unknown>;
    if (typeof sessionId !== "string" || !SESSION_ID_PATTERN.test(sessionId)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    // Check our own database first. Unknown or already released sessions never reach Stripe,
    // which makes a second call cheap and keeps made-up ids away from the Stripe API.
    const { data: reserved, error: findError } = await ctx.supabaseAdmin
      .from("paintings")
      .select("id")
      .eq("checkout_session_id", sessionId)
      .eq("status", "reserved")
      .maybeSingle();

    if (findError) {
      console.error("Find error:", findError);
      return Response.json({ error: "Could not cancel checkout" }, { status: 500 });
    }
    if (!reserved) {
      return Response.json({ ok: true });
    }

    // Only release the painting after Stripe has confirmed that the session is expired.
    // A paid (complete) session cannot be expired, so a payment can never lose its painting here.
    let expired: boolean;
    try {
      const session = await stripe.checkout.sessions.expire(sessionId);
      expired = session.status === "expired";
    } catch (expireError) {
      // Stripe refuses to expire a session that is not open. It may already be expired (it timed
      // out, or an earlier call expired it but failed before releasing), or it may be paid.
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        expired = session.status === "expired";
      } catch (retrieveError) {
        console.error("Stripe error:", expireError, retrieveError);
        return Response.json({ error: "Could not cancel checkout" }, { status: 502 });
      }
    }

    if (!expired) {
      // Paid or still open: release nothing. The webhook handles a paid session.
      return Response.json({ ok: true });
    }

    // Only matches while the painting is still reserved for this session. Stripe also sends
    // checkout.session.expired for this session; the webhook must accept that no row matches then.
    const { error: releaseError } = await ctx.supabaseAdmin
      .from("paintings")
      .update({ status: "available", reserved_until: null, checkout_session_id: null })
      .eq("checkout_session_id", sessionId)
      .eq("status", "reserved");

    if (releaseError) {
      // The session is expired, so nobody can pay. The pg_cron cleanup releases the painting later.
      console.error("Release error:", releaseError);
      return Response.json({ error: "Could not cancel checkout" }, { status: 500 });
    }

    return Response.json({ ok: true });
  }),
};
