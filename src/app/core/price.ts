/** Kronor typed in a form (integer).*/
export function kronorToOre(kronor: number): number {
  return Math.round(kronor * 100);
}

export function oreToKronor(ore: number): number {
  return ore / 100;
}

/** Formats a price in öre (Swedish kronor), for example 125000 -> "1 250 kr". */
export function formatPrice(ore: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 2,
    // No decimals for whole kronor ("1 250 kr"), two decimals otherwise ("1 250,50 kr").
    minimumFractionDigits: ore % 100 === 0 ? 0 : 2,
  }).format(ore / 100);
}
