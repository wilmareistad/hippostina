import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PendingCheckout } from '../../core/checkout';
import { CheckoutService } from '../../core/checkout.service';
import { Painting } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { PaintingPage } from './painting-page';

const PAINTING_ID = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const OTHER_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

const PAINTING: Painting = {
  id: PAINTING_ID,
  title: 'Hästar i dimma',
  description: null,
  price_ore: 250000,
  image_path: null,
  status: 'available',
  reserved_until: null,
  width_cm: null,
  height_cm: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

describe('PaintingPage', () => {
  let getAvailable: ReturnType<typeof vi.fn>;
  let pending: ReturnType<typeof vi.fn>;
  let cancelPending: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getAvailable = vi.fn().mockResolvedValue(PAINTING);
    pending = vi.fn().mockReturnValue(null);
    cancelPending = vi.fn().mockResolvedValue(true);

    const params = convertToParamMap({ id: PAINTING_ID });
    // provideRouter([]) gives RouterLink a router. ActivatedRoute is replaced with a fixed id.
    await TestBed.configureTestingModule({
      imports: [PaintingPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(params), snapshot: { paramMap: params } } },
        { provide: PaintingService, useValue: { getAvailable, imageUrl: () => null } },
        { provide: CheckoutService, useValue: { pending, cancelPending, start: vi.fn() } },
      ],
    }).compileComponents();
  });

  /** Makes pending() behave like the real one: the value is gone after cancelPending(). */
  function startedPurchase(value: PendingCheckout): void {
    pending.mockReturnValue(value);
    cancelPending.mockImplementation(async () => {
      pending.mockReturnValue(null);
      return true;
    });
  }

  /**
   * Waits until load() is done, then updates the view. whenStable() does not wait for plain
   * promises in a zoneless app, and load() awaits twice, so wait for a timer instead: it runs
   * after all promises that are already resolved.
   */
  async function settle(fixture: ComponentFixture<PaintingPage>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  /** Creates the page and waits until the painting has loaded. */
  async function render() {
    const fixture = TestBed.createComponent(PaintingPage);
    fixture.detectChanges();
    await settle(fixture);
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  /** jsdom may not have PageTransitionEvent, so add persisted to a plain Event. */
  function pageShow(persisted: boolean): Event {
    const event = new Event('pageshow');
    Object.defineProperty(event, 'persisted', { value: persisted });
    return event;
  }

  it('shows the painting without cancelling when no purchase was started', async () => {
    const { root } = await render();

    expect(cancelPending).not.toHaveBeenCalled();
    expect(root.querySelector('h1')?.textContent).toContain('Hästar i dimma');
    expect(root.querySelector('.notice')).toBeNull();
  });

  it('cancels a purchase of this painting before loading it, and says so', async () => {
    startedPurchase({ sessionId: 'cs_test_123', paintingId: PAINTING_ID });

    const { root } = await render();

    expect(cancelPending).toHaveBeenCalledOnce();
    expect(cancelPending.mock.invocationCallOrder[0]).toBeLessThan(
      getAvailable.mock.invocationCallOrder[0],
    );
    expect(root.querySelector('.notice')?.textContent).toContain('Köpet avbröts. Tavlan finns kvar.');
    expect(root.querySelector('h1')?.textContent).toContain('Hästar i dimma');
  });

  it('shows not found and no notice when the painting is not available after cancelling', async () => {
    startedPurchase({ sessionId: 'cs_test_123', paintingId: PAINTING_ID });
    getAvailable.mockResolvedValue(null);

    const { root } = await render();

    expect(root.querySelector('h1')?.textContent).toContain('Tavlan hittades inte');
    expect(root.querySelector('.notice')).toBeNull();
  });

  it('shows the painting without a notice when cancelling fails', async () => {
    pending.mockReturnValue({ sessionId: 'cs_test_123', paintingId: PAINTING_ID });
    cancelPending.mockResolvedValue(false);

    const { root } = await render();

    expect(root.querySelector('h1')?.textContent).toContain('Hästar i dimma');
    expect(root.querySelector('.notice')).toBeNull();
  });

  it('does not cancel a purchase of another painting', async () => {
    pending.mockReturnValue({ sessionId: 'cs_test_123', paintingId: OTHER_ID });

    await render();

    expect(cancelPending).not.toHaveBeenCalled();
  });

  it('turns the button on, cancels and reloads when shown from the back/forward cache', async () => {
    const { fixture, root } = await render();
    // The mocked start() succeeds, so the button stays disabled, as when the browser left for Stripe.
    root.querySelector<HTMLButtonElement>('.buy-button')!.click();
    await settle(fixture);
    expect(root.querySelector<HTMLButtonElement>('.buy-button')?.disabled).toBe(true);
    startedPurchase({ sessionId: 'cs_test_123', paintingId: PAINTING_ID });

    window.dispatchEvent(pageShow(true));
    await settle(fixture);

    expect(cancelPending).toHaveBeenCalledOnce();
    expect(getAvailable).toHaveBeenCalledTimes(2);
    expect(root.querySelector<HTMLButtonElement>('.buy-button')?.disabled).toBe(false);
    expect(root.querySelector('.notice')?.textContent).toContain('Köpet avbröts');
  });

  it('does not reload on a normal page show', async () => {
    const { fixture } = await render();
    startedPurchase({ sessionId: 'cs_test_123', paintingId: PAINTING_ID });

    window.dispatchEvent(pageShow(false));
    await settle(fixture);

    expect(cancelPending).not.toHaveBeenCalled();
    expect(getAvailable).toHaveBeenCalledOnce();
  });
});
