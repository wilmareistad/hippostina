import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { CheckoutService } from './checkout.service';
import { pendingCheckoutGuard } from './pending-checkout.guard';

describe('pendingCheckoutGuard', () => {
  let pending: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    pending = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: CheckoutService, useValue: { pending } }],
    });
  });

  // A guard uses inject(), so it must run inside Angular's injection context.
  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      pendingCheckoutGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('lets the visitor in when a purchase was started', () => {
    pending.mockReturnValue({
      sessionId: 'cs_test_123',
      paintingId: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
    });

    expect(runGuard()).toBe(true);
  });

  it('sends the visitor to the gallery when no purchase was started', () => {
    pending.mockReturnValue(null);

    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/malningar');
  });
});
