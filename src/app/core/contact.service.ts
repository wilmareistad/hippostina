import { Injectable } from '@angular/core';
import { ContactMessage } from './contact';

/**
 * Sends a contact message to Stina.
 *
 * Not connected yet: this is a stand-in so the form can be built and tried. Later it calls an
 * Edge Function that validates the message again, checks spam protection and rate limits, and sends
 * the email with Resend. Only this method needs to change then.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  async send(message: ContactMessage): Promise<void> {
    // TODO (Resend step): replace with
    //   const { error } = await inject(SupabaseService).client.functions.invoke(
    //     'send-contact-message', { body: message });
    //   if (error) throw error;
    void message;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
}
