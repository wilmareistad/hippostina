import { inject, Injectable } from '@angular/core';
import { ContactMessage } from './contact';
import { SupabaseService } from './supabase.service';

/**
 * Sends a contact message to Stina through the send-contact-message Edge Function, which checks the
 * message again and sends the email with Resend.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly supabase = inject(SupabaseService).client;

  async send(message: ContactMessage): Promise<void> {
    const { error } = await this.supabase.functions.invoke('send-contact-message', {
      body: message,
    });
    if (error) {
      throw error;
    }
  }
}
