import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CheckoutService } from '../../core/checkout.service';

type CancelState = 'cancelling' | 'released' | 'failed';

/**
 * Page Stripe sends the customer to when they cancel on the checkout page (/kop/avbrutet).
 * Coming to this page does not expire the Checkout session by itself, so it calls cancel-checkout
 * with the session id saved in sessionStorage. pendingCheckoutGuard only lets the visitor in when
 * a purchase was started in this tab.
 */
@Component({
  selector: 'app-purchase-cancelled',
  imports: [RouterLink],
  templateUrl: './purchase-cancelled.html',
  styleUrl: '../purchase-page.scss',
})
export class PurchaseCancelled implements OnInit {
  private readonly checkoutService = inject(CheckoutService);

  /** Read before cancelling, because cancelPending() clears the saved value. */
  protected readonly paintingId = signal(this.checkoutService.pending()?.paintingId ?? null);
  protected readonly state = signal<CancelState>('cancelling');

  async ngOnInit(): Promise<void> {
    // false also covers a network error. The painting is then released when the reservation runs out.
    const ok = await this.checkoutService.cancelPending();
    this.state.set(ok ? 'released' : 'failed');
  }
}
