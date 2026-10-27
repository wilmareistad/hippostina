import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CheckoutService } from './checkout.service';

/**
 * Only lets the visitor open /kop/tack and /kop/avbrutet when a purchase was started in this tab.
 * Anyone else is sent to the gallery. This is for user experience only, not security: anyone can
 * edit sessionStorage, and the pages show no order data.
 */

export const pendingCheckoutGuard: CanActivateFn = () => {
  const checkoutService = inject(CheckoutService);
  const router = inject(Router);
  return checkoutService.pending() !== null ? true : router.createUrlTree(['/malningar']);
};
