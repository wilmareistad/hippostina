import { computed, inject, Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

/** Admin login and logout. Customers never log in. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly session = signal<Session | null>(null);

  /** The logged-in user, or null. */
  readonly user = computed(() => this.session()?.user ?? null);

  /** Resolves when the saved session (from an earlier visit) has been loaded. */
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.supabase.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
    });
    // Keeps `session` up to date on login, logout and token refresh.
    this.supabase.auth.onAuthStateChange((_event, session) => this.session.set(session));
  }

  /** Throws if the email or password is wrong. */
  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  /**
   * Asks the database if the logged-in user is in `public.admins`.
   * Only for showing the right page: RLS is what actually protects the data.
   */
  async isAdmin(): Promise<boolean> {
    await this.ready;
    if (!this.session()) return false;
    const { data, error } = await this.supabase.rpc('is_admin');
    return !error && data === true;
  }
}
