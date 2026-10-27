import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CheckoutService } from '../../core/checkout.service';
import { PurchaseCancelled } from './purchase-cancelled';

const PAINTING_ID = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';

describe('PurchaseCancelled', () => {
  let cancelPending: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    cancelPending = vi.fn();
    // provideRouter([]) gives RouterLink a router, so the link gets a real href.
    await TestBed.configureTestingModule({
      imports: [PurchaseCancelled],
      providers: [
        provideRouter([]),
        {
          provide: CheckoutService,
          useValue: {
            pending: () => ({ sessionId: 'cs_test_123', paintingId: PAINTING_ID }),
            cancelPending,
          },
        },
      ],
    }).compileComponents();
  });

  /** Creates the page and waits until cancelPending() has answered. */
  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(PurchaseCancelled);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('cancels the purchase and links back to the painting', async () => {
    cancelPending.mockResolvedValue(true);

    const root = await render();

    expect(cancelPending).toHaveBeenCalledOnce();
    expect(root.querySelector('h1')?.textContent).toContain('Köpet avbröts');
    expect(root.querySelector('p')?.textContent).toContain('Tavlan är tillgänglig igen');
    expect(root.querySelector('a')?.getAttribute('href')).toBe(`/malningar/${PAINTING_ID}`);
  });

  it('says the painting is released later and links to the gallery when cancelling fails', async () => {
    cancelPending.mockResolvedValue(false);

    const root = await render();

    expect(root.querySelector('p')?.textContent).toContain('Ingen betalning har gjorts');
    expect(root.querySelector('p')?.textContent).toContain('inom kort');
    expect(root.querySelector('a')?.getAttribute('href')).toBe('/malningar');
  });
});
