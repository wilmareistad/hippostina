import { inject, Injectable } from '@angular/core';
import { Painting, PaintingInput } from './painting';
import { SupabaseService } from './supabase.service';

/**
 * Reads and writes paintings. RLS decides what is allowed when logged in as admin
 * every painting is visible and writable, for visitors only available ones are readable.
 * Paintings are never deleted, only archived.
 */
@Injectable({ providedIn: 'root' })
export class PaintingService {
  private readonly supabase = inject(SupabaseService).client;

  /** All paintings, newest first. Only the admin gets archived, reserved and sold ones. */
  async list(): Promise<Painting[]> {
    const { data, error } = await this.supabase
      .from('paintings')
      .select('*')
      .order('created_at', { ascending: false })
      .overrideTypes<Painting[]>();
    if (error) throw error;
    return data;
  }

  /** One painting, or null if it does not exist (or RLS hides it). */
  async get(id: string): Promise<Painting | null> {
    const { data, error } = await this.supabase
      .from('paintings')
      .select('*')
      .eq('id', id)
      .maybeSingle<Painting>();
    if (error) throw error;
    return data;
  }

  /** New paintings always start as `available` (the column default). */
  async create(input: PaintingInput): Promise<Painting> {
    const { data, error } = await this.supabase
      .from('paintings')
      .insert(input)
      .select()
      .single<Painting>();
    if (error) throw error;
    return data;
  }

  async update(id: string, input: PaintingInput): Promise<Painting> {
    const { data, error } = await this.supabase
      .from('paintings')
      .update(input)
      .eq('id', id)
      .select()
      .single<Painting>();
    if (error) throw error;
    return data;
  }

  /** Soft delete. Old orders still point to the painting. */
  async archive(id: string): Promise<void> {
    // Only archive paintings that are available. A reserved or sold painting must not
    // be changed here, because a customer may be paying for it right now.
    await this.setStatus(id, 'available', 'archived');
  }

  /** Undo an archive. */
  async restore(id: string): Promise<void> {
    await this.setStatus(id, 'archived', 'available');
  }

  /** Changes status only if the painting currently has from (one atomic update). */
  private async setStatus(id: string, from: Painting['status'], to: Painting['status']) {
    const { data, error } = await this.supabase
      .from('paintings')
      .update({ status: to })
      .eq('id', id)
      .eq('status', from)
      .select('id');
    if (error) throw error;
    if (data.length === 0) {
      throw new Error(`Painting is not ${from}, so it cannot become ${to}.`);
    }
  }
}
