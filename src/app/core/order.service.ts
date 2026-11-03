import { inject, Injectable } from '@angular/core';
import { Order } from './order';
import { SupabaseService } from './supabase.service';

/** Only what the overview shows. Not `*`, so for example the shipping address is never fetched. */
const ORDER_COLUMNS =
  'id, created_at, customer_name, customer_email, amount_ore, delivery_method, customer_email_sent_at, admin_email_sent_at, painting:paintings(title)';

/** Reads orders. RLS only lets the admin read them. */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly supabase = inject(SupabaseService).client;

  /** Ids of paintings that have an order. Only `painting_id` is fetched, no customer data. */
  async listPaintingIds(): Promise<Set<string>> {
    const { data, error } = await this.supabase.from('orders').select('painting_id');
    if (error) throw error;
    return new Set((data as { painting_id: string }[]).map((order) => order.painting_id));
  }

  /** All orders for the admin overview, newest first. */
  async listOrders(): Promise<Order[]> {
    const { data, error } = await this.supabase
      .from('orders')
      .select(ORDER_COLUMNS)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Order[];
  }
}
