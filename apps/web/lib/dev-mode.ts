/**
 * Development / demo mode.
 *
 * Lets the whole system be demonstrated locally without fighting passwords or
 * pairing a gate screen. It does NOT remove the security architecture —
 * sessions, roles, hashing and the kiosk pairing model are all still there, and
 * are what run in production.
 *
 * Three independent conditions must hold, so this cannot switch itself on by
 * accident on a deployed server:
 *
 *   1. DEMO_MODE=true must be set explicitly.
 *   2. NODE_ENV must not be production.
 *   3. VERCEL_ENV, if present, must not be production.
 *
 * assertDemoModeSafe() is called at startup and throws if 1 is set while 2 or 3
 * indicate production, so a misconfigured deploy fails closed and loudly rather
 * than silently exposing the bypass.
 */

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE !== 'true') return false;
  if (isProductionRuntime()) return false;
  return true;
}

/** Throws when DEMO_MODE is requested in a production runtime. Fail closed. */
export function assertDemoModeSafe(): void {
  if (process.env.DEMO_MODE === 'true' && isProductionRuntime()) {
    throw new Error(
      'DEMO_MODE=true is set in a production runtime. Refusing to start: this would ' +
        'bypass authentication. Remove DEMO_MODE from the production environment.',
    );
  }
}

/**
 * Guard for dev-only routes. Returns a 404 rather than a 403 so that a
 * production deployment does not even admit these routes exist.
 */
export function demoOnlyResponse(): Response | null {
  if (isDemoMode()) return null;
  return new Response('Not found', { status: 404 });
}

/**
 * Who you are when the app opens with no login.
 *
 * Chairman has the widest view — dashboard, wings, gate console, cards and
 * device diagnostics — so the whole system is reachable from a cold start.
 * Override with DEMO_USER in .env to land as somebody else.
 */
export function demoDefaultUsername(): string {
  return (process.env.DEMO_USER ?? 'CHAIRMAN').toUpperCase();
}

/** Identities offered by the switcher, so no password is ever needed. */
export const DEMO_IDENTITIES = [
  { username: 'CHAIRMAN', label: 'Chairman', detail: 'Committee — sees everything' },
  { username: 'SECURITY', label: 'Security Guard', detail: 'Gate console, cards, readers' },
  { username: 'A201', label: 'Resident — A201', detail: 'Receives the ringing visitor screen' },
  { username: 'C1402', label: 'Resident — C1402', detail: 'A second flat, for testing two phones' },
  { username: 'COOK', label: 'Cook', detail: 'Tiffin service only' },
] as const;
