import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SupabaseService } from '../../core/supabase.service';

/** Admin start page. Painting CRUD and the order overview will live here. */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService).client;
  protected readonly auth = inject(AuthService);

  // Temporary (sprint 1 Stripe spike): remove together with the create-checkout-test function.
  /** Set by Stripe's redirect back to /admin?checkout=success or ?checkout=cancelled. */
  protected readonly checkoutResult = inject(ActivatedRoute).snapshot.queryParamMap.get('checkout');
  protected readonly checkoutError = signal<string | null>(null);
  protected readonly checkoutLoading = signal(false);

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }

  /** Asks the Edge Function for a Stripe Checkout session and goes to Stripe's payment page. */
  protected async testCheckout(): Promise<void> {
    this.checkoutError.set(null);
    this.checkoutLoading.set(true);
    // invoke() sends the logged-in user's JWT, which the function needs.
    const { data, error } = await this.supabase.functions.invoke<{ url: string }>(
      'create-checkout-test',
      { method: 'POST' },
    );
    if (error || !data?.url) {
      console.error(error);
      this.checkoutError.set('Could not start test checkout. See the console.');
      this.checkoutLoading.set(false);
      return;
    }
    window.location.href = data.url;
  }
}
