// Receives events from Stripe. Anyone can call this URL, so the Stripe signature check is the only
// protection: nothing is read from the event before the signature has been verified.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import Stripe from "stripe";
import { buildAdminNotification, buildCustomerConfirmation } from "../_shared/order-emails.ts";
import { type Email, sendEmail } from "../_shared/send-email.ts";

// Set with `supabase secrets set`. Never sent to the browser.
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
// The endpoint's signing secret (whsec_...). From `stripe listen` while testing, from the
// webhook endpoint in the Stripe Dashboard when it is set up there.
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
// Where the order notification goes. A missing address only stops that email.
const adminEmail = Deno.env.get("ADMIN_EMAIL");

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
// Deno has no Node crypto module, so the signature is checked with the Web Crypto API.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Same list as in create-checkout.
const DELIVERY_METHODS = ["pickup"];

// Only an id and the error, so no customer data ends up in the logs.
function logEmailError(label: string, id: string, error: unknown): void {
  console.error(label, id, error instanceof Error ? error.message : error);
}

export default {
  // cors: false because only Stripe's servers call this, never a browser.
  fetch: withSupabase({ auth: "none", cors: false }, async (req, ctx) => {
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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Card only, so a completed session should always be paid. Check anyway: never sell unpaid.
      if (session.payment_status !== "paid") {
        console.warn("Session is not paid:", session.id, session.payment_status);
        return Response.json({ received: true });
      }

      // create-checkout always sets both. Without them the session was not created by our shop
      // (for example `stripe trigger`), so there is nothing to save. 200, since a retry cannot help.
      const paintingId = session.metadata?.painting_id;
      const delivery = session.metadata?.delivery;
      if (
        !paintingId ||
        !UUID_PATTERN.test(paintingId) ||
        !delivery ||
        !DELIVERY_METHODS.includes(delivery)
      ) {
        console.warn("Session is not from our shop:", session.id);
        return Response.json({ received: true });
      }

      // Save the order first: the customer has paid, so the order must exist whatever happens to
      // the painting. ignoreDuplicates (on conflict do nothing) makes a repeated event harmless.
      const { error: orderError } = await ctx.supabaseAdmin
        .from("orders")
        .upsert(
          {
            painting_id: paintingId,
            stripe_session_id: session.id,
            customer_email: session.customer_details?.email,
            customer_name: session.customer_details?.individual_name,
            amount_ore: session.amount_total,
            delivery_method: delivery,
          },
          { onConflict: "stripe_session_id", ignoreDuplicates: true },
        );

      if (orderError) {
        // 500 makes Stripe send the event again later.
        console.error("Order error:", orderError);
        return Response.json({ error: "Could not save order" }, { status: 500 });
      }

      // Only the painting reserved for this session. "sold" is included so a repeated event
      // matches again instead of looking like a mismatch. checkout_session_id is kept on a sold
      // painting for the same reason.
      const { data: sold, error: soldError } = await ctx.supabaseAdmin
        .from("paintings")
        .update({ status: "sold", reserved_until: null })
        .eq("id", paintingId)
        .eq("checkout_session_id", session.id)
        .in("status", ["reserved", "sold"])
        .select("id")
        .maybeSingle();

      if (soldError) {
        // Not returned yet: the customer has paid, so the emails are still tried.
        console.error("Sold error:", soldError);
      } else if (!sold) {
        // Should not happen, since the reservation outlives the session. The order is saved,
        // so the admin can sort it out.
        console.error("Paid session did not match a reserved painting:", session.id, paintingId);
      }

      // After the painting is sold, so a failed email cannot affect the order or the status. The
      // columns stop an email that has been sent, also on a repeated event. The idempotency key
      // covers what they cannot: two events at the same time, and an email that was sent when
      // saving its column failed or the response timed out.
      let emailsFailed = false;
      try {
        // Read from the database, not the event: a retry must send exactly the same content.
        const { data: savedOrder, error: readError } = await ctx.supabaseAdmin
          .from("orders")
          .select(
            "id, created_at, customer_email, customer_name, amount_ore, delivery_method, customer_email_sent_at, admin_email_sent_at",
          )
          .eq("stripe_session_id", session.id)
          .single();

        if (readError) {
          throw new Error(`Could not read order: ${readError.message}`);
        }

        if (!savedOrder.customer_email_sent_at || !savedOrder.admin_email_sent_at) {
          const { data: painting, error: paintingError } = await ctx.supabaseAdmin
            .from("paintings")
            .select("title")
            .eq("id", paintingId)
            .single();

          if (paintingError) {
            throw new Error(`Could not read painting: ${paintingError.message}`);
          }

          const order = { ...savedOrder, painting_title: painting.title };

          // A column is only set after its own email has gone. "is null" keeps the first time.
          const sendAndMark = async (
            email: Email,
            key: string,
            column: "customer_email_sent_at" | "admin_email_sent_at",
          ): Promise<void> => {
            await sendEmail(email, key);

            const { error: markError } = await ctx.supabaseAdmin
              .from("orders")
              .update({ [column]: new Date().toISOString() })
              .eq("id", savedOrder.id)
              .is(column, null);

            if (markError) {
              throw new Error(`Could not save ${column}: ${markError.message}`);
            }
          };

          const sendCustomerEmail = async (): Promise<void> => {
            if (savedOrder.customer_email_sent_at) return;
            await sendAndMark(
              buildCustomerConfirmation(order),
              `order-customer/${savedOrder.id}`,
              "customer_email_sent_at",
            );
          };

          const sendAdminEmail = async (): Promise<void> => {
            if (savedOrder.admin_email_sent_at) return;
            if (!adminEmail) throw new Error("ADMIN_EMAIL is not set");
            await sendAndMark(
              buildAdminNotification(order, adminEmail),
              `order-admin/${savedOrder.id}`,
              "admin_email_sent_at",
            );
          };

          // allSettled: sent at the same time, and one failing does not stop the other.
          const [customerResult, adminResult] = await Promise.allSettled([
            sendCustomerEmail(),
            sendAdminEmail(),
          ]);

          if (customerResult.status === "rejected") {
            emailsFailed = true;
            logEmailError("Customer email error:", savedOrder.id, customerResult.reason);
          }
          if (adminResult.status === "rejected") {
            emailsFailed = true;
            logEmailError("Admin email error:", savedOrder.id, adminResult.reason);
          }
        }
      } catch (error) {
        emailsFailed = true;
        logEmailError("Order email error:", session.id, error);
      }

      // 500 makes Stripe send the event again. Nothing is undone: the order stays saved, and what
      // already succeeded is skipped on the next try.
      if (soldError) {
        return Response.json({ error: "Could not mark painting as sold" }, { status: 500 });
      }
      if (emailsFailed) {
        return Response.json({ error: "Could not send order emails" }, { status: 500 });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;

      // Only the painting still reserved for this session, so no metadata is needed. No row
      // matching is fine: cancel-checkout may already have released it.
      const { error: releaseError } = await ctx.supabaseAdmin
        .from("paintings")
        .update({ status: "available", reserved_until: null, checkout_session_id: null })
        .eq("checkout_session_id", session.id)
        .eq("status", "reserved");

      if (releaseError) {
        console.error("Release error:", releaseError);
        return Response.json({ error: "Could not release painting" }, { status: 500 });
      }
    }

    // Events we do not handle also get 200, otherwise Stripe keeps sending them again.
    return Response.json({ received: true });
  }),
};
