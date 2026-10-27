/** Delivery choice. Same values as the create-checkout function accepts. */
export type DeliveryMethod = 'pickup';

/**
 * Why checkout could not start.
 * - `unavailable`: the painting is already reserved, sold or archived (409 from create-checkout).
 * - `failed`: anything else, for example a network or server error.
 */
export type CheckoutErrorReason = 'unavailable' | 'failed';

export class CheckoutError extends Error {
  constructor(readonly reason: CheckoutErrorReason) {
    super(`Checkout could not start: ${reason}`);
    this.name = 'CheckoutError';
  }
}
