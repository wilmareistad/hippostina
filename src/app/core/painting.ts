export type PaintingStatus = 'available' | 'reserved' | 'sold' | 'archived';

export interface Painting {
  id: string;
  title: string;
  description: string | null;
  /** Price in öre (SEK), never a float. 100 kr = 10000. */
  price_ore: number;
  image_path: string | null;
  status: PaintingStatus;
  reserved_until: string | null;
  width_cm: number | null;
  height_cm: number | null;
  created_at: string;
  updated_at: string;
}

/** What the admin form sends when creating or editing. The database fills in the rest. */
export type PaintingInput = Pick<
  Painting,
  'title' | 'description' | 'price_ore' | 'image_path' | 'width_cm' | 'height_cm'
>;
