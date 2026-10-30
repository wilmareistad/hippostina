import { TestBed } from '@angular/core/testing';
import { OrderService } from './order.service';
import { SupabaseService } from './supabase.service';

describe('OrderService', () => {
  let select: ReturnType<typeof vi.fn>;
  let service: OrderService;

  beforeEach(() => {
    select = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { from: () => ({ select }) } } },
      ],
    });
    service = TestBed.inject(OrderService);
  });

  it('returns the ids of paintings that have an order, and asks for nothing else', async () => {
    select.mockResolvedValue({
      data: [{ painting_id: 'a' }, { painting_id: 'b' }, { painting_id: 'a' }],
      error: null,
    });

    expect(await service.listPaintingIds()).toEqual(new Set(['a', 'b']));
    expect(select).toHaveBeenCalledWith('painting_id');
  });

  it('throws the database error', async () => {
    const error = new Error('boom');
    select.mockResolvedValue({ data: null, error });

    await expect(service.listPaintingIds()).rejects.toBe(error);
  });
});
