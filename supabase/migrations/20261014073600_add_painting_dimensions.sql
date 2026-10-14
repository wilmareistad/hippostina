-- Painting size in whole centimetres. Nullable, so paintings without a known size can still be saved.
alter table public.paintings
  add column width_cm integer check (width_cm > 0),
  add column height_cm integer check (height_cm > 0);
