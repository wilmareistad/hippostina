import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PurchaseThanks } from './purchase-thanks';

describe('PurchaseThanks', () => {
  let root: HTMLElement;

  beforeEach(async () => {
    // provideRouter([]) gives RouterLink a router, so the link gets a real href.
    await TestBed.configureTestingModule({
      imports: [PurchaseThanks],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PurchaseThanks);
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
  });

  it('thanks the customer', () => {
    expect(root.querySelector('h1')?.textContent).toContain('Tack för ditt köp');
  });

  it('links back to the gallery', () => {
    expect(root.querySelector('a')?.getAttribute('href')).toBe('/malningar');
  });
});
