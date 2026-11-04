import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivacyPage } from './privacy-page/privacy-page';
import { TermsPage } from './terms-page/terms-page';

async function render(page: Type<unknown>): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [page],
    providers: [provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(page);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('legal pages', () => {
  it.each([
    ['Köpvillkor och ångerrätt', TermsPage],
    ['Integritetspolicy', PrivacyPage],
  ] as const)('%s has its heading and is marked as a draft', async (heading, page) => {
    const root = await render(page);

    expect(root.querySelector('h1')?.textContent).toBe(heading);
    expect(root.querySelector('app-draft-notice')?.textContent).toContain('Utkast');
  });

  it('terms say that the withdrawal function is missing', async () => {
    const root = await render(TermsPage);

    expect(root.querySelector('app-draft-notice')?.textContent).toContain('Ångerfunktion');
  });

  it('privacy policy describes recipients, IP addresses and transfers outside the EU', async () => {
    const root = await render(PrivacyPage);

    for (const text of ['betalning', 'e-post', 'lagring', 'drift', 'IP-adress', 'utanför EU/EES']) {
      expect(root.textContent).toContain(text);
    }
  });
});
