import { DOCUMENT, inject, Injectable } from '@angular/core';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { CheckoutError, DeliveryMethod } from './checkout';
import { SupabaseService } from './supabase.service';

/** Only Stripe's hosted checkout page. We never send the customer anywhere else. */
const STRIPE_CHECKOUT_ORIGIN = 'https://checkout.stripe.com/';

interface CreateCheckoutResponse {
  url: string;
  sessionId: string;
}

/**
 * Starts a purchase: the create-checkout Edge Function reserves the painting and creates a Stripe
 * Checkout session, then the customer is sent to Stripe's page. The price is never sent from here,
 * the function reads it from the database.
 */
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly supabase = inject(SupabaseService).client;
  // Injected instead of using window directly, so tests can check the redirect without leaving the page.
  private readonly document = inject(DOCUMENT);

  /** Resolves when the redirect has started. Throws a CheckoutError if checkout could not start. */
  async start(paintingId: string, delivery: DeliveryMethod): Promise<void> {
    const { data, error } = await this.supabase.functions.invoke<CreateCheckoutResponse>(
      'create-checkout',
      { body: { painting_id: paintingId, delivery } },
    );

    if (error) {
      // FunctionsHttpError: the function answered with a non-2xx status. context is the Response.
      const status = error instanceof FunctionsHttpError ? (error.context as Response).status : null;
      throw new CheckoutError(status === 409 ? 'unavailable' : 'failed');
    }

    if (!data?.url?.startsWith(STRIPE_CHECKOUT_ORIGIN)) {
      throw new CheckoutError('failed');
    }

    // to do save data.sessionId in sessionStorage here, before leaving the page.
    this.document.location.assign(data.url);
  }
}
