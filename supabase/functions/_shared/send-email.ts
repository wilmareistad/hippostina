// Sends email through the Resend API. Folders starting with _ are not deployed as functions of their
// own: the code is bundled into each function that imports it.
//
// Uses fetch directly, since one POST request is all we need and it adds no dependency.

const RESEND_URL = "https://api.resend.com/emails";
// Stop waiting after a while, so a slow email service cannot hang the function that called this.
const TIMEOUT_MS = 10_000;

export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

// Throws if the email could not be sent, so the caller decides what a failure means.
// With an idempotency key, Resend sends only once per key for 24 hours. A repeated request must
// have the same content, and one made while the first is still running gets a 409, which throws.
export async function sendEmail(email: Email, idempotencyKey?: string): Promise<void> {
  // Set with `supabase secrets set`. Never sent to the browser.
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY or EMAIL_FROM is not set");
  }

  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, ...email }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    // Only the status and the error name: Resend's message can contain the customer's address.
    const { name } = await response.json().catch(() => ({ name: "unknown" }));
    throw new Error(`Resend refused the email: ${response.status} ${name}`);
  }
}
