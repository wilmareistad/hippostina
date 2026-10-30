import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

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
}
