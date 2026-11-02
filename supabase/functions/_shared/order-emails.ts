// Builds the order emails. Only builds them: sending is done by send-email.ts.

import type { Email } from "./send-email.ts";

// Replace with Stina's real business details before going live (see docs/go-live-checklist.md).
const SELLER = "Hippostina (uppgifter kommer)";

const DELIVERY_LABELS: Record<string, string> = {
  pickup: "Hämtning",
};

// Same columns as in the orders table, plus the painting's title.
export type OrderEmailData = {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name: string | null;
  amount_ore: number;
  delivery_method: string;
  painting_title: string;
};

// Short version of the order id, easier to read and to refer to than the whole id.
export function formatOrderNumber(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

// Same format as formatPrice in the Angular app, which Edge Functions cannot import from.
function formatPrice(ore: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 2,
    minimumFractionDigits: ore % 100 === 0 ? 0 : 2,
  }).format(ore / 100);
}

// Fixed time zone, so the date is Swedish wherever the function runs.
function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeZone: "Europe/Stockholm",
  }).format(new Date(isoDate));
}

// The customer's name and the painting's title must not be able to add HTML to the email.
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildCustomerConfirmation(order: OrderEmailData): Email {
  const greeting = order.customer_name
    ? `Tack för ditt köp, ${order.customer_name}!`
    : "Tack för ditt köp!";
  const pickupInfo = "Stina hör av sig för att bestämma tid och plats för hämtning.";
  const seller = `Säljare: ${SELLER}`;

  const details = [
    ["Ordernummer", formatOrderNumber(order.id)],
    ["Datum", formatDate(order.created_at)],
    ["Målning", order.painting_title],
    ["Leverans", DELIVERY_LABELS[order.delivery_method] ?? order.delivery_method],
    ["Totalt", formatPrice(order.amount_ore)],
  ];

  const rows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0"><strong>${label}</strong></td><td>${
          escapeHtml(value)
        }</td></tr>`,
    )
    .join("");

  return {
    to: order.customer_email,
    subject: "Orderbekräftelse från Hippostina",
    html: `<h1>${escapeHtml(greeting)}</h1>
<table>${rows}</table>
<p>${pickupInfo}</p>
<p>${escapeHtml(seller)}</p>`,
    text: [
      greeting,
      "",
      ...details.map(([label, value]) => `${label}: ${value}`),
      "",
      pickupInfo,
      "",
      seller,
    ].join("\n"),
  };
}
