import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AdminLayout } from './admin-layout';

describe('AdminLayout', () => {
  let signOut: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    signOut = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [provideRouter([]), { provide: AuthService, useValue: { signOut } }],
    }).compileComponents();
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('links to the admin start page and the orders', () => {
    const root = render();

    const links = Array.from(root.querySelectorAll('nav a')).map((link) => [
      link.textContent?.trim(),
      link.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ['Admin start', '/admin'],
      ['Ordrar', '/admin/ordrar'],
    ]);
  });

  it('logs out first and then goes to the start page of the shop', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const root = render();

    root.querySelector<HTMLButtonElement>('nav button')?.click();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/'));

    expect(signOut).toHaveBeenCalledOnce();
    expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);
  });
});
