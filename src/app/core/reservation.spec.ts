import { formatReservationEnd } from './reservation';

// 13:35 UTC is 14:35 in Sweden in winter time (CET, UTC+1).
const ENDS = '2026-10-30T13:35:00Z';

describe('formatReservationEnd', () => {
  it('shows the time in Swedish time when the reservation is still running today', () => {
    expect(formatReservationEnd(ENDS, new Date('2026-10-30T13:00:00Z'))).toBe(
      'Reserverad till 14:35',
    );
  });

  it('adds the date when the end is not today', () => {
    expect(formatReservationEnd(ENDS, new Date('2026-10-29T13:00:00Z'))).toBe(
      'Reserverad till 2026-10-30 14:35',
    );
  });

  it('says it has ended when the time has passed', () => {
    expect(formatReservationEnd(ENDS, new Date('2026-10-30T13:50:00Z'))).toBe('Gick ut 14:35');
  });

  it('uses summer time in summer', () => {
    // 12:35 UTC is 14:35 in Sweden in summer time (CEST, UTC+2).
    expect(formatReservationEnd('2026-07-01T12:35:00Z', new Date('2026-07-01T12:00:00Z'))).toBe(
      'Reserverad till 14:35',
    );
  });

  it('handles a missing end time', () => {
    expect(formatReservationEnd(null)).toBe('Sluttid saknas');
  });
});
