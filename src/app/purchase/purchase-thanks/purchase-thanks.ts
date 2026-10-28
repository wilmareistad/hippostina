import { Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CheckoutService } from '../../core/checkout.service';

/**
 * Page Stripe sends the customer to after a successful payment (/kop/tack).
 * Shows no order details: anyone can open this URL, and the webhook decides if a painting is sold.
 * pendingCheckoutGuard only lets the visitor in when a purchase was started in this tab, and the
 * saved purchase is cleared when the customer leaves the page.
 */
@Component({
  selector: 'app-purchase-thanks',
  imports: [RouterLink],
  templateUrl: './purchase-thanks.html',
  styleUrl: '../purchase-page.scss',
})
export class PurchaseThanks {
  private readonly checkoutService = inject(CheckoutService);

  constructor() {
    // Cleared when the customer leaves the page, not when it opens, so a reload still passes
    // pendingCheckoutGuard. Not run when the tab is closed or the customer goes to another site,
    // but a leftover value is harmless: cancel-checkout cannot expire a paid session.
    inject(DestroyRef).onDestroy(() => this.checkoutService.clearPending());
  }
}
