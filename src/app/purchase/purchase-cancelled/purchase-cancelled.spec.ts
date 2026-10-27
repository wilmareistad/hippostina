import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PurchaseCancelled } from './purchase-cancelled';

describe('PurchaseCancelled', () => {
  let root: HTMLElement;

  beforeEach(async () => {
    // provideRouter([]) gives RouterLink a router, so the link gets a real href.
    await TestBed.configureTestingModule({
      imports: [PurchaseCancelled],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PurchaseCancelled);
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
  });

  it('says that the purchase was cancelled and nothing was paid', () => {
    expect(root.querySelector('h1')?.textContent).toContain('Köpet avbröts');
    expect(root.querySelector('p')?.textContent).toContain('Ingen betalning har gjorts');
  });

  it('links back to the gallery', () => {
    expect(root.querySelector('a')?.getAttribute('href')).toBe('/malningar');
  });
});
