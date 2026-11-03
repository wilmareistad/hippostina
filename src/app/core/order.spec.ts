import {
  formatDelivery,
  formatOrderDate,
  formatOrderNumber,
  missingEmailWarnings,
  Order,
} from './order';

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

describe('formatOrderNumber', () => {
  it('gives the first eight characters in upper case, the same as in the email', () => {
    expect(formatOrderNumber(ORDER.id)).toBe('6F1C2A3B');
  });
});

describe('formatOrderDate', () => {
  it('uses Swedish time, also when that is another day than in UTC', () => {
    // 23:30 UTC is 00:30 the next day in Sweden in winter time (CET, UTC+1).
    expect(formatOrderDate('2026-01-15T23:30:00Z')).toBe('2026-01-16 00:30');
  });

  it('uses summer time in summer', () => {
    // 12:35 UTC is 14:35 in Sweden in summer time (CEST, UTC+2).
    expect(formatOrderDate('2026-07-01T12:35:00Z')).toBe('2026-07-01 14:35');
  });
});

describe('formatDelivery', () => {
  it('translates a known method', () => {
    expect(formatDelivery('pickup')).toBe('Hämtning');
  });

  it('shows an unknown method as it is', () => {
    expect(formatDelivery('shipping')).toBe('shipping');
  });
});

describe('missingEmailWarnings', () => {
  it('gives no warning when both emails have a sent time', () => {
    expect(missingEmailWarnings(ORDER)).toEqual([]);
  });

  it('warns about the customer email only', () => {
    expect(missingEmailWarnings({ ...ORDER, customer_email_sent_at: null })).toEqual([
      'Kundmejl ej bekräftat',
    ]);
  });

  it('warns about the admin email only', () => {
    expect(missingEmailWarnings({ ...ORDER, admin_email_sent_at: null })).toEqual([
      'Adminmejl ej bekräftat',
    ]);
  });

  it('warns about both emails', () => {
    expect(
      missingEmailWarnings({ ...ORDER, customer_email_sent_at: null, admin_email_sent_at: null }),
    ).toEqual(['Kundmejl ej bekräftat', 'Adminmejl ej bekräftat']);
  });
});
