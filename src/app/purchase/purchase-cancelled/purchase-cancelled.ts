import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Page Stripe sends the customer to when they cancel on the checkout page (/kop/avbrutet).
 * Coming to this page does not expire the Checkout session by itself.
 */
// TODO call cancel-checkout with the session id from sessionStorage, so the painting
// is released at once, and link back to that painting.
@Component({
  selector: 'app-purchase-cancelled',
  imports: [RouterLink],
  templateUrl: './purchase-cancelled.html',
  styleUrl: '../purchase-page.scss',
})
export class PurchaseCancelled {}
