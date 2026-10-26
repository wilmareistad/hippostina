/** What a visitor sends through the contact form. Only what is needed to answer (GDPR). */
export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

/**
 * Length limits for the contact form. The Edge Function must check the same limits again,
 * because the browser can be bypassed.
 */
export const CONTACT_LIMITS = {
  nameMax: 100,
  emailMax: 254,
  messageMin: 10,
  messageMax: 2000,
} as const;
