import { CardCategory } from '@prisma/client';

/**
 * Card number handling.
 *
 * Card identifiers are ALWAYS strings (Rule 7). Readers commonly report a
 * zero-padded decimal such as "0000012345" while the number silk-screened on
 * the card reads "12345", so padding must never be treated as insignificant
 * during storage — only during an explicit, audited fallback lookup.
 */

/**
 * Canonical storage form: trimmed, separators removed, uppercased.
 * Leading zeroes are deliberately preserved.
 *
 *   " 0000-1234 " -> "00001234"
 *   "abc123"      -> "ABC123"
 */
export function normalizeCardNumber(input: string): string {
  return input
    .trim()
    .replace(/[\s\-_:.]/g, '')
    .toUpperCase();
}

/**
 * Comparison form used only for the padding-tolerant fallback.
 * "00001234" -> "1234", and an all-zero card collapses to "0" rather than "".
 */
export function compactCardNumber(input: string): string {
  const normalised = normalizeCardNumber(input);
  const stripped = normalised.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
}

/** Rejects obviously unusable identifiers before they reach the database. */
export function isValidCardNumber(input: string): boolean {
  const normalised = normalizeCardNumber(input);
  return normalised.length >= 1 && normalised.length <= 64 && /^[A-Z0-9]+$/.test(normalised);
}

/** Guard-console display form: never show the whole number on a shared screen. */
export function maskCardNumber(cardNumber: string): string {
  const normalised = normalizeCardNumber(cardNumber);
  if (normalised.length <= 4) return normalised;
  return `••••${normalised.slice(-4)}`;
}

export const CARD_CATEGORY_LABELS: Record<CardCategory, string> = {
  NEWSPAPER: 'Newspaper Delivery',
  MILK: 'Milk Delivery',
  HOUSE_HELP: 'House Help',
  CLEANER: 'Cleaner',
  DRIVER: 'Driver',
  SOCIETY_STAFF: 'Society Staff',
  DELIVERY_REGULAR: 'Regular Delivery',
  VENDOR: 'Vendor',
  RESIDENT: 'Resident',
  OTHER: 'Other',
};

export const CARD_CATEGORIES = Object.keys(CARD_CATEGORY_LABELS) as CardCategory[];

export function categoryLabel(category: CardCategory | null | undefined): string {
  return category ? CARD_CATEGORY_LABELS[category] : 'Unassigned';
}
