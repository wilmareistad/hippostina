import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CheckoutError, DeliveryMethod } from '../../core/checkout';
import { CheckoutService } from '../../core/checkout.service';
import { Painting } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { formatPrice } from '../../core/price';

/** Public product page (/malningar/:id): one available painting, delivery choice and buy button. */
@Component({
  selector: 'app-painting-page',
  imports: [RouterLink],
  templateUrl: './painting-page.html',
  styleUrl: './painting-page.scss',
  // Listens to an event on window for as long as this component is on screen.
  host: { '(window:pageshow)': 'onPageShow($event)' },
})
export class PaintingPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly paintingService = inject(PaintingService);
  private readonly checkoutService = inject(CheckoutService);

  protected readonly painting = signal<Painting | null>(null);
  protected readonly loading = signal(true);
  /** True when the painting is missing, not available, the id is invalid or loading failed. */
  protected readonly notFound = signal(false);

  protected readonly delivery = signal<DeliveryMethod>('pickup');
  /** True from the click until the browser leaves for Stripe, or until an error is shown. */
  protected readonly buying = signal(false);
  protected readonly buyError = signal<string | null>(null);
  /** True when the customer came back from Stripe without paying and the painting was released. */
  protected readonly cancelled = signal(false);

  protected readonly imageUrl = computed(() => {
    const path = this.painting()?.image_path;
    return path ? this.paintingService.imageUrl(path) : null;
  });
  protected readonly price = computed(() => {
    const painting = this.painting();
    return painting ? formatPrice(painting.price_ore) : '';
  });
  protected readonly size = computed(() => {
    const painting = this.painting();
    return painting?.width_cm && painting.height_cm
      ? `${painting.width_cm} × ${painting.height_cm} cm`
      : null;
  });

  // paramMap emits again if the id in the URL changes while this component stays on screen.
  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => void this.load(params.get('id')));
  }

  protected async buy(): Promise<void> {
    const painting = this.painting();
    if (!painting || this.buying()) return;

    this.buying.set(true);
    this.buyError.set(null);
    this.cancelled.set(false);
    try {
      // On success the browser leaves the page, so the button stays disabled.
      await this.checkoutService.start(painting.id, this.delivery());
    } catch (error) {
      this.buyError.set(
        error instanceof CheckoutError && error.reason === 'unavailable'
          ? 'Tavlan är tyvärr inte tillgänglig längre. Någon annan kan vara mitt i ett köp av den just nu.'
          : 'Något gick fel och köpet kunde inte startas. Försök igen om en stund.',
      );
      this.buying.set(false);
    }
  }

  /**
   * persisted is true when the browser shows this page from its back/forward cache, for example
   * when the customer presses Back on Stripe's page. The page then comes back exactly as it was
   * left, with the button disabled, so turn it on again.
   */
  protected onPageShow(event: PageTransitionEvent): void {
    if (event.persisted) {
      this.buying.set(false);
      // Angular does not run again when the page comes from the cache, so load here.
      // load() cancels the purchase first if it was for this painting.
      if (this.checkoutService.pending()) {
        void this.load(this.route.snapshot.paramMap.get('id'));
      }
    }
  }

  private async load(id: string | null): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    this.painting.set(null);
    this.cancelled.set(false);
    try {
      // Back from Stripe without paying: release the painting first, otherwise it is still
      // reserved and getAvailable() finds nothing.
      const cancelled =
        id !== null && this.checkoutService.pending()?.paintingId === id
          ? await this.checkoutService.cancelPending()
          : false;
      const painting = id ? await this.paintingService.getAvailable(id) : null;
      // Ignore the answer if the user has already moved on to another painting.
      if (id !== this.route.snapshot.paramMap.get('id')) return;
      this.painting.set(painting);
      this.notFound.set(painting === null);
      // cancelPending() answers OK even when nothing was released (for example a paid session),
      // so only say so when the painting really is available again.
      this.cancelled.set(cancelled && painting !== null);
    } catch {
      // An invalid uuid makes Postgres return an error. Show the same message as "not found".
      if (id !== this.route.snapshot.paramMap.get('id')) return;
      this.notFound.set(true);
    } finally {
      if (id === this.route.snapshot.paramMap.get('id')) this.loading.set(false);
    }
  }
}
