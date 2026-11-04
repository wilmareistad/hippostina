// Sends a message from the contact form to Stina. Called by visitors, so there is no login.
//
// The email always goes to ADMIN_EMAIL, never to an address from the request, so the function cannot
// be used to send email to someone else. It is plain text, so HTML in a message is never run. The
// message is not saved anywhere and never logged (GDPR).

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { sendEmail } from "../_shared/send-email.ts";

// Set with `supabase secrets set`. Never sent to the browser.
const adminEmail = Deno.env.get("ADMIN_EMAIL");

// Same limits and email check as the form (CONTACT_LIMITS in the Angular app, which Edge Functions
// cannot import from). Checked again here, because the browser can be bypassed.
const NAME_MAX = 100;
const EMAIL_MAX = 254;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// A name with line breaks could add fake lines, such as another address, to the email.
const LINE_BREAK_PATTERN = /[\r\n]/;

export default {
  // auth: "publishable" only accepts requests with the project's publishable key (apikey header).
  // The key is public, so this is not bot protection, only "a known client". CORS is handled by withSupabase.
  fetch: withSupabase({ auth: "publishable" }, async (req) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (!adminEmail) {
      console.error("ADMIN_EMAIL is not set");
      return Response.json({ error: "Server is not configured" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { name, email, message, leaveEmpty } = (body ?? {}) as Record<string, unknown>;

    // The honeypot: a hidden field that people never see, but simple bots fill in. Answer as if the
    // message was sent, so the bot does not learn that it was stopped.
    if (leaveEmpty) {
      return Response.json({ ok: true });
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    const valid = trimmedName.length > 0 &&
      trimmedName.length <= NAME_MAX &&
      !LINE_BREAK_PATTERN.test(trimmedName) &&
      trimmedEmail.length <= EMAIL_MAX &&
      EMAIL_PATTERN.test(trimmedEmail) &&
      trimmedMessage.length >= MESSAGE_MIN &&
      trimmedMessage.length <= MESSAGE_MAX;

    if (!valid) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    try {
      await sendEmail({
        to: adminEmail,
        // A fixed subject, so a visitor cannot decide what it says.
        subject: "Nytt meddelande från hemsidan",
        text: [
          `Namn: ${trimmedName}`,
          `E-post: ${trimmedEmail}`,
          "",
          trimmedMessage,
        ].join("\n"),
        reply_to: trimmedEmail,
      });
    } catch (error) {
      // sendEmail's errors contain no personal data.
      console.error("Email error:", error);
      return Response.json({ error: "Could not send message" }, { status: 502 });
    }

    return Response.json({ ok: true });
  }),
};
