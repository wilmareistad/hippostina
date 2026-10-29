import { TestBed } from '@angular/core/testing';
import { PaintingService } from './painting.service';
import { SupabaseService } from './supabase.service';

const PAINTING_ID = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';

describe('PaintingService.markSold', () => {
  let update: ReturnType<typeof vi.fn>;
  let eq: ReturnType<typeof vi.fn>;
  let inFilter: ReturnType<typeof vi.fn>;
  let select: ReturnType<typeof vi.fn>;
  let service: PaintingService;

  beforeEach(() => {
    // from('paintings').update(...).eq(...).in(...).select(...) in one chain.
    select = vi.fn().mockResolvedValue({ data: [{ id: PAINTING_ID }], error: null });
    inFilter = vi.fn().mockReturnValue({ select });
    eq = vi.fn().mockReturnValue({ in: inFilter });
    update = vi.fn().mockReturnValue({ eq });
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { from: () => ({ update }) } } },
      ],
    });
    service = TestBed.inject(PaintingService);
  });

  it('sets sold, but only from available or archived', async () => {
    await service.markSold(PAINTING_ID);

    expect(update).toHaveBeenCalledWith({ status: 'sold' });
    expect(eq).toHaveBeenCalledWith('id', PAINTING_ID);
    expect(inFilter).toHaveBeenCalledWith('status', ['available', 'archived']);
  });

  it('throws when no row changed (for example a customer reserved it meanwhile)', async () => {
    select.mockResolvedValue({ data: [], error: null });

    await expect(service.markSold(PAINTING_ID)).rejects.toThrow('cannot become sold');
  });

  it('throws the database error', async () => {
    const error = new Error('boom');
    select.mockResolvedValue({ data: null, error });

    await expect(service.markSold(PAINTING_ID)).rejects.toBe(error);
  });
});

describe('PaintingService.unsell', () => {
  let update: ReturnType<typeof vi.fn>;
  let eq: ReturnType<typeof vi.fn>;
  let is: ReturnType<typeof vi.fn>;
  let select: ReturnType<typeof vi.fn>;
  let service: PaintingService;

  beforeEach(() => {
    // from('paintings').update(...).eq('id').eq('status').is(...).select(...) in one chain.
    select = vi.fn().mockResolvedValue({ data: [{ id: PAINTING_ID }], error: null });
    is = vi.fn().mockReturnValue({ select });
    eq = vi.fn();
    eq.mockReturnValue({ eq, is }); // eq returns an object that has eq again (two filters in a row)
    update = vi.fn().mockReturnValue({ eq });
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { from: () => ({ update }) } } },
      ],
    });
    service = TestBed.inject(PaintingService);
  });

  it('sets available, but only for a sold painting without a checkout session', async () => {
    await service.unsell(PAINTING_ID);

    expect(update).toHaveBeenCalledWith({ status: 'available' });
    expect(eq).toHaveBeenCalledWith('id', PAINTING_ID);
    expect(eq).toHaveBeenCalledWith('status', 'sold');
    expect(is).toHaveBeenCalledWith('checkout_session_id', null);
  });

  it('throws when no row changed (for example it was sold online)', async () => {
    select.mockResolvedValue({ data: [], error: null });

    await expect(service.unsell(PAINTING_ID)).rejects.toThrow('cannot become available');
  });
});
