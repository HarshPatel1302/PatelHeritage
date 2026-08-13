import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * Gate-screen device identity.
 *
 * Without this, /api/visitor-requests is an open endpoint: anyone on the
 * internet could POST a flat number and make a family's phone ring at 3am,
 * repeatedly, from anywhere in the world. Per-flat rate limits blunt that but
 * do not stop it.
 *
 * So the gate tablet is paired once by a committee member, which drops a
 * long-lived signed cookie on that specific device. Paired devices are trusted
 * to generate the society's real visitor traffic; anything unpaired is treated
 * as hostile and rate-limited hard.
 *
 * The cookie is httpOnly, so the kiosk page's own JavaScript cannot read or
 * copy it — a visitor poking at the tablet's browser cannot lift the token.
 */

const KIOSK_COOKIE = 'ph_kiosk';
const KIOSK_MAX_AGE = 60 * 60 * 24 * 365; // a year; re-pairing is a deliberate act

export interface KioskPayload {
  deviceId: string;
  gate: 'FRONT' | 'BACK';
  pairedBy: string;
}

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters.');
  }
  return new TextEncoder().encode(value);
}

export async function setKioskCookie(payload: KioskPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${KIOSK_MAX_AGE}s`)
    .sign(secret());

  cookies().set(KIOSK_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: KIOSK_MAX_AGE,
  });
}

export async function getKioskSession(): Promise<KioskPayload | null> {
  const token = cookies().get(KIOSK_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as KioskPayload;
  } catch {
    return null;
  }
}

export function clearKioskCookie() {
  cookies().delete(KIOSK_COOKIE);
}

/**
 * Requests-per-10-minutes ceiling for a paired gate screen.
 *
 * One screen legitimately speaks for all 236 flats, so this is not a security
 * control — it only catches a device stuck in a loop. The security control is
 * that unpaired devices are refused outright (403), not rate-limited: a budget
 * of even five per ten minutes would let a stranger ring 700+ flats a day.
 */
export const RATE_LIMIT_PAIRED = 200;
