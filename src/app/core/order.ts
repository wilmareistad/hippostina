/** The order fields the admin overview needs. Other columns are never fetched. */
export interface Order {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string;
  /** What the customer paid in öre. Stays the same if the painting's price changes later. */
  amount_ore: number;
  delivery_method: string;
  /** Null means the email is not confirmed as sent. */
  customer_email_sent_at: string | null;
  admin_email_sent_at: string | null;
  painting: { title: string };
}

/** Same labels as in order-emails.ts, which Angular cannot import from. */
const DELIVERY_LABELS: Record<string, string> = {
  pickup: 'Hämtning',
};

const dateTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm',
  dateStyle: 'short',
  timeStyle: 'short',
});

/**
 * Short version of the order id. Must match formatOrderNumber in order-emails.ts, so the customer
 * and the admin see the same number in the email and in the overview.
 */
export function formatOrderNumber(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

/** In Swedish time, for example "2026-01-16 00:30". `created_at` is a UTC timestamp. */
export function formatOrderDate(createdAt: string): string {
  return dateTime.format(new Date(createdAt));
}

export function formatDelivery(deliveryMethod: string): string {
  return DELIVERY_LABELS[deliveryMethod] ?? deliveryMethod;
}

/**
 * One warning per email without a sent time. "Ej bekräftat" and not "ej skickat": the email may
 * have gone even if saving the time failed, and the columns are empty while the webhook is running.
 */
export function missingEmailWarnings(order: Order): string[] {
  const warnings: string[] = [];
  if (!order.customer_email_sent_at) warnings.push('Kundmejl ej bekräftat');
  if (!order.admin_email_sent_at) warnings.push('Adminmejl ej bekräftat');
  return warnings;
}
