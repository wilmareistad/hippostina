import { TestBed } from '@angular/core/testing';
import { Order } from '../../core/order';
import { OrderService } from '../../core/order.service';
import { OrderList } from './order-list';

const ORDER: Order = {
  id: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
  created_at: '2026-11-03T13:05:00Z',
  customer_name: 'Anna Andersson',
  customer_email: 'anna@example.com',
  amount_ore: 125000,
  delivery_method: 'pickup',
  customer_email_sent_at: '2026-11-03T13:05:10Z',
  admin_email_sent_at: '2026-11-03T13:05:10Z',
  painting: { title: 'Hästen' },
};

describe('OrderList', () => {
  let listOrders: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    listOrders = vi.fn();
    await TestBed.configureTestingModule({
      imports: [OrderList],
      providers: [{ provide: OrderService, useValue: { listOrders } }],
    }).compileComponents();
  });

  /** Creates the list and waits until listOrders() has answered. */
  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(OrderList);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  /** The text of each cell in a row, with whitespace from non-breaking spaces made normal. */
  function cells(row: Element): string[] {
    return Array.from(row.querySelectorAll('td')).map((cell) =>
      (cell.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
  }

  /** The name and email lines in the customer cell of the first row. */
  function customerLines(root: HTMLElement): string[] {
    return Array.from(root.querySelectorAll('tbody tr td:nth-child(4) div')).map((line) =>
      (line.textContent ?? '').trim(),
    );
  }

  it('shows the details of an order, and "Skickat" when both emails are confirmed', async () => {
    listOrders.mockResolvedValue([ORDER]);

    const root = await render();

    expect(cells(root.querySelector('tbody tr')!)).toEqual([
      '6F1C2A3B',
      '2026-11-03 14:05',
      'Hästen',
      'Anna Anderssonanna@example.com', // Two separate lines, checked below.
      '1 250 kr',
      'Hämtning',
      'Skickat',
    ]);
    expect(customerLines(root)).toEqual(['Anna Andersson', 'anna@example.com']);
    expect(root.querySelector('.warning')).toBeNull();
  });

  it('keeps the order from the service, with one row per order', async () => {
    listOrders.mockResolvedValue([
      { ...ORDER, id: 'aaaaaaaa-newest' },
      { ...ORDER, id: 'bbbbbbbb-oldest' },
    ]);

    const root = await render();

    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(rows.map((row) => cells(row)[0])).toEqual(['AAAAAAAA', 'BBBBBBBB']);
  });

  it('shows "Ej angivet" when the customer has no name', async () => {
    listOrders.mockResolvedValue([{ ...ORDER, customer_name: null }]);

    const root = await render();

    expect(customerLines(root)).toEqual(['Ej angivet', 'anna@example.com']);
  });

  it('warns on the row and counts the order when an email is not confirmed', async () => {
    listOrders.mockResolvedValue([{ ...ORDER, customer_email_sent_at: null }, ORDER]);

    const root = await render();

    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(cells(rows[0])[6]).toBe('Kundmejl ej bekräftat');
    expect(cells(rows[1])[6]).toBe('Skickat');
    expect(root.querySelector('.summary')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1 order saknar bekräftat mejl',
    );
  });

  it('counts orders, not emails, in the summary', async () => {
    const noEmails = { ...ORDER, customer_email_sent_at: null, admin_email_sent_at: null };
    listOrders.mockResolvedValue([noEmails, noEmails]);

    const root = await render();

    expect(root.querySelector('.summary')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '2 ordrar saknar bekräftat mejl',
    );
  });

  it('shows a message when there are no orders', async () => {
    listOrders.mockResolvedValue([]);

    const root = await render();

    expect(root.textContent).toContain('Inga ordrar än.');
    expect(root.querySelector('table')).toBeNull();
  });

  it('shows an error when the orders cannot be read', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    listOrders.mockRejectedValue(new Error('boom'));

    const root = await render();

    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'Kunde inte hämta ordrarna',
    );
    expect(root.querySelector('table')).toBeNull();
    consoleError.mockRestore();
  });
});
