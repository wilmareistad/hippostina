import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactMessage } from '../../core/contact';
import { ContactService } from '../../core/contact.service';
import { ContactSection } from './contact-section';

class FakeContactService {
  sent: ContactMessage[] = [];
  shouldFail = false;

  async send(message: ContactMessage): Promise<void> {
    if (this.shouldFail) {
      throw new Error('failed');
    }
    this.sent.push(message);
  }
}

describe('ContactSection', () => {
  let fixture: ComponentFixture<ContactSection>;
  let service: FakeContactService;

  const root = () => fixture.nativeElement as HTMLElement;
  const field = (id: string) => root().querySelector<HTMLInputElement>(`#${id}`)!;

  function fill(id: string, value: string): void {
    const element = field(id);
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  async function submit(): Promise<void> {
    root().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    service = new FakeContactService();
    await TestBed.configureTestingModule({
      imports: [ContactSection],
      providers: [{ provide: ContactService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(ContactSection);
    fixture.detectChanges();
  });

  it('has a label for every field', () => {
    for (const id of ['contact-name', 'contact-email', 'contact-message']) {
      expect(root().querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
  });

  it('shows Swedish errors and sends nothing when the form is empty', async () => {
    await submit();

    expect(root().textContent).toContain('Fyll i ditt namn.');
    expect(root().textContent).toContain('Fyll i din e-postadress.');
    expect(root().textContent).toContain('Skriv ett meddelande.');
    expect(field('contact-name').getAttribute('aria-invalid')).toBe('true');
    expect(service.sent.length).toBe(0);
  });

  it('rejects an email without a dot in the domain', async () => {
    fill('contact-name', 'Anna');
    fill('contact-email', 'anna@host');
    fill('contact-message', 'Hej, jag undrar över en tavla.');
    await submit();

    expect(root().textContent).toContain('giltig e-postadress');
    expect(service.sent.length).toBe(0);
  });

  it('treats a message with only spaces as empty', async () => {
    fill('contact-name', 'Anna');
    fill('contact-email', 'anna@example.com');
    fill('contact-message', '            ');
    await submit();

    expect(root().textContent).toContain('Skriv ett meddelande.');
    expect(service.sent.length).toBe(0);
  });

  it('sends the trimmed values and shows a thank-you message', async () => {
    fill('contact-name', '  Anna  ');
    fill('contact-email', 'anna@example.com');
    fill('contact-message', 'Hej, jag undrar över en tavla.');
    await submit();

    expect(service.sent).toEqual([
      { name: 'Anna', email: 'anna@example.com', message: 'Hej, jag undrar över en tavla.' },
    ]);
    expect(root().textContent).toContain('Ditt meddelande är skickat');
    expect(field('contact-name').value).toBe('');
  });

  it('shows an error and keeps the text when sending fails', async () => {
    service.shouldFail = true;
    fill('contact-name', 'Anna');
    fill('contact-email', 'anna@example.com');
    fill('contact-message', 'Hej, jag undrar över en tavla.');
    await submit();

    expect(root().querySelector('[role="alert"]')?.textContent).toContain('Det gick inte att skicka');
    expect(field('contact-name').value).toBe('Anna');
  });
});
