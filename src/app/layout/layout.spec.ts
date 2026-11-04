import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Layout } from './layout';

describe('Layout footer', () => {
  it.each([
    ['/kopvillkor', 'Köpvillkor och ångerrätt'],
    ['/integritetspolicy', 'Integritetspolicy'],
  ])('links to %s', async (href, text) => {
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const link = root.querySelector(`footer a[href="${href}"]`);

    expect(link?.textContent).toContain(text);
  });
});
