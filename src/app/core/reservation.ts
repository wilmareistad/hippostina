const TIME_ZONE = 'Europe/Stockholm';

const clock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});
const day = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Text for when a reservation ends, in Swedish time, for example "Reserverad till 14:35".
 * The date is added when the end is not today. `reserved_until` is a UTC timestamp from the
 * database; `now` is a parameter so tests do not depend on the clock.
 */
export function formatReservationEnd(reservedUntil: string | null, now = new Date()): string {
  if (!reservedUntil) return 'Sluttid saknas';

  const end = new Date(reservedUntil);
  const time = clock.format(end);
  const when = day.format(end) === day.format(now) ? time : `${day.format(end)} ${time}`;
  // Past: the cleanup job (every 5 minutes) or the webhook releases it, unless it was paid.
  return end.getTime() > now.getTime() ? `Reserverad till ${when}` : `Gick ut ${when}`;
}
