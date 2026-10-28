import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CheckoutService } from '../../core/checkout.service';
import { PurchaseThanks } from './purchase-thanks';

describe('PurchaseThanks', () => {
  let fixture: ComponentFixture<PurchaseThanks>;
  let root: HTMLElement;
  let clearPending: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    clearPending = vi.fn();
    // provideRouter([]) gives RouterLink a router, so the link gets a real href.
    await TestBed.configureTestingModule({
      imports: [PurchaseThanks],
      providers: [provideRouter([]), { provide: CheckoutService, useValue: { clearPending } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseThanks);
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
  });

  it('thanks the customer', () => {
    expect(root.querySelector('h1')?.textContent).toContain('Tack för ditt köp');
  });

  it('links back to the gallery', () => {
    expect(root.querySelector('a')?.getAttribute('href')).toBe('/malningar');
  });

  it('clears the pending purchase when the page is left, not when it opens', () => {
    expect(clearPending).not.toHaveBeenCalled();

    fixture.destroy();

    expect(clearPending).toHaveBeenCalledOnce();
  });
});
