import { formatPrice } from './price';

// Intl uses a non-breaking space between number and unit, so normalise whitespace first.
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('formatPrice', () => {
  it('shows whole kronor without decimals', () => {
    expect(plain(formatPrice(125000))).toBe('1 250 kr');
  });

  it('shows öre as decimals', () => {
    expect(plain(formatPrice(125050))).toBe('1 250,50 kr');
  });
});
