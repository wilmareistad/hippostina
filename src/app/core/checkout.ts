/** Delivery choice. Same values as the create-checkout function accepts. */
export type DeliveryMethod = 'pickup';

/**
 * Why checkout could not start.
 * - `unavailable`: the painting is already reserved, sold or archived (409 from create-checkout).
 * - `failed`: anything else, for example a network or server error.
 */
export type CheckoutErrorReason = 'unavailable' | 'failed';

/**
 * A purchase that has been sent to Stripe but not finished, saved in sessionStorage so the cancel
 * page and the product page can cancel it when the customer comes back.
 */
export interface PendingCheckout {
  sessionId: string;
  paintingId: string;
}

export class CheckoutError extends Error {
  constructor(readonly reason: CheckoutErrorReason) {
    super(`Checkout could not start: ${reason}`);
    this.name = 'CheckoutError';
  }
}
