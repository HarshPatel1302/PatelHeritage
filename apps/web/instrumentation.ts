import { assertDemoModeSafe } from '@/lib/dev-mode';

/**
 * Runs once when the server starts, before it accepts any request.
 *
 * The only job here is to fail closed: if someone deploys with DEMO_MODE=true
 * to production, refuse to boot rather than silently serving an application
 * where anyone can sign in as any resident without a password.
 */
export function register() {
  assertDemoModeSafe();

  if (process.env.DEMO_MODE === 'true') {
    console.warn(
      '\n  ⚠  DEMO_MODE is ON — /dev/control-panel is reachable and ' +
        '/api/dev/login-as will sign in without a password.\n' +
        '     This is refused automatically in production.\n',
    );
  }
}
