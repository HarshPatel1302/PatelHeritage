/**
 * Flat login credentials.
 *
 * The society wants something a resident can remember without being told twice:
 * the username is the flat number, and the password is the same number without
 * the wing letter.
 *
 *   A302  → username "A302",  password "302"
 *   F1302 → username "F1302", password "1302"
 *
 * These are short numeric passwords, so the account lockout in the login route
 * (5 attempts, 15 minutes) is doing real work here — without it a four-digit
 * password would fall to guessing in minutes. Rotating to something stronger is
 * on the production checklist in ACCESS_CONTROL.md.
 */

/** "F1302" -> "1302". Returns null when the flat is not in wing+number form. */
export function passwordForFlat(flatId: string): string | null {
  const match = /^([A-F])(\d{3,4})$/.exec(flatId.trim().toUpperCase());
  return match ? match[2]! : null;
}

/** The username a resident types. Same as the flat number, uppercased. */
export function usernameForFlat(flatId: string): string {
  return flatId.trim().toUpperCase();
}
