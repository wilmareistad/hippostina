import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Page Stripe sends the customer to after a successful payment (/kop/tack).
 * Shows no order details: anyone can open this URL, and the webhook decides if a painting is sold.
 */
@Component({
  selector: 'app-purchase-thanks',
  imports: [RouterLink],
  templateUrl: './purchase-thanks.html',
  styleUrl: '../purchase-page.scss',
})
export class PurchaseThanks {}
