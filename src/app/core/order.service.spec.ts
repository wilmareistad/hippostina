import { TestBed } from '@angular/core/testing';
import { OrderService } from './order.service';
import { SupabaseService } from './supabase.service';

describe('OrderService', () => {
  let select: ReturnType<typeof vi.fn>;
  let service: OrderService;

  beforeEach(() => {
    select = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client: { from: () => ({ select }) } } }],
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

  describe('listOrders', () => {
    let order: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      order = vi.fn();
      select.mockReturnValue({ order });
    });

    it('returns the orders, newest first', async () => {
      const orders = [{ id: 'newest' }, { id: 'oldest' }];
      order.mockResolvedValue({ data: orders, error: null });

      expect(await service.listOrders()).toEqual(orders);
      expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('asks only for the columns the overview shows', async () => {
      order.mockResolvedValue({ data: [], error: null });

      await service.listOrders();

      expect(select).toHaveBeenCalledWith(
        'id, created_at, customer_name, customer_email, amount_ore, delivery_method, customer_email_sent_at, admin_email_sent_at, painting:paintings(title)',
      );
    });

    it('throws the database error', async () => {
      const error = new Error('boom');
      order.mockResolvedValue({ data: null, error });

      await expect(service.listOrders()).rejects.toBe(error);
    });
  });
});
