/**
 * Project contact – single source of truth for support/contact email.
 * Used by email service fallback, footer, and auth messages.
 * Location: src/lib/contact.ts
 */

/** Support / contact email (Namecheap Private Email: ichigo@ketchup.cc). */
export const CONTACT_EMAIL = 'ichigo@ketchup.cc';

/** mailto href for contact. */
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
