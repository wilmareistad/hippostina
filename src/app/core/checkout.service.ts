import { DOCUMENT, inject, Injectable } from '@angular/core';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { CheckoutError, DeliveryMethod, PendingCheckout } from './checkout';
import { SupabaseService } from './supabase.service';

/** Only Stripe's hosted checkout page. We never send the customer anywhere else. */
const STRIPE_CHECKOUT_ORIGIN = 'https://checkout.stripe.com/';

/** sessionStorage key for the purchase that is in progress in this browser tab. */
const PENDING_KEY = 'hippostina.pendingCheckout';

// Same session id format as the cancel-checkout function accepts.
const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]{1,255}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CreateCheckoutResponse {
  url: string;
  sessionId: string;
}

/**
 * Starts a purchase: the create-checkout Edge Function reserves the painting and creates a Stripe
 * Checkout session, then the customer is sent to Stripe's page. The price is never sent from here,
 * the function reads it from the database.
 *
 * The started purchase is remembered in sessionStorage (one value per browser tab, kept on reload
 * and when the tab goes to Stripe and back, removed when the tab is closed). When the customer
 * cancels or presses Back, cancelPending() releases the painting at once.
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

    // Saved before leaving the page, because Stripe's cancel URL does not tell us the session id.
    this.savePending({ sessionId: data.sessionId, paintingId });
    this.document.location.assign(data.url);
  }

  /** The purchase in progress in this tab, or null if there is none or the saved value is broken. */
  pending(): PendingCheckout | null {
    try {
      const raw = this.storage()?.getItem(PENDING_KEY);
      if (!raw) return null;
      // Anything can be in sessionStorage (the user can edit it), so check every field.
      const { sessionId, paintingId } = JSON.parse(raw) as Record<string, unknown>;
      if (
        typeof sessionId !== 'string' ||
        !SESSION_ID_PATTERN.test(sessionId) ||
        typeof paintingId !== 'string' ||
        !UUID_PATTERN.test(paintingId)
      ) {
        return null;
      }
      return { sessionId, paintingId };
    } catch {
      return null;
    }
  }

  clearPending(): void {
    try {
      this.storage()?.removeItem(PENDING_KEY);
    } catch {
      // Storage not available: there is nothing to clear.
    }
  }

  /**
   * Cancels the purchase in progress: cancel-checkout expires the Stripe session and releases the
   * painting. The saved value is always cleared, also on failure, so we never retry in a loop.
   * If it fails, the scheduled cleanup releases the painting when the reservation runs out.
   * Resolves to true if the function answered OK (which does not tell whether a painting was released).
   */
  async cancelPending(): Promise<boolean> {
    const pending = this.pending();
    this.clearPending();
    if (!pending) return false;

    const { error } = await this.supabase.functions.invoke('cancel-checkout', {
      body: { session_id: pending.sessionId },
    });
    return !error;
  }

  private savePending(pending: PendingCheckout): void {
    try {
      this.storage()?.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch {
      // Storage blocked or full. Checkout still works; the painting is released when the
      // reservation runs out instead of at once.
    }
  }

  /** Can be missing, and reading it can throw when the browser blocks storage. */
  private storage(): Storage | undefined {
    return this.document.defaultView?.sessionStorage;
  }
}
