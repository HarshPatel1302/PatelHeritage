import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { demoOnlyResponse } from '@/lib/dev-mode';
import { setKioskCookie } from '@/lib/kiosk-session';
import { setSessionCookie } from '@/lib/session';

/**
 * Demo-mode session shortcut.
 *
 * Signs in as any seeded account by username WITHOUT a password, and can pair
 * the browser as a gate screen in one step. This exists so the whole system can
 * be demonstrated locally while production password work is still deferred.
 *
 * It is unreachable unless DEMO_MODE=true in a non-production runtime — the
 * route 404s otherwise, so it is not merely hidden but absent.
 */
export const dynamic = 'force-dynamic';

const schema = z.object({
  username: z.string().min(1).max(120),
  /** Also drop a kiosk pairing cookie, so /kiosk is usable immediately. */
  pairKiosk: z.boolean().optional(),
  gate: z.enum(['FRONT', 'BACK']).default('FRONT'),
});

export async function POST(request: Request) {
  const blocked = demoOnlyResponse();
  if (blocked) return blocked;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { username: parsed.data.username.toUpperCase(), isActive: true },
  });
  if (!user) return NextResponse.json({ error: 'No such account.' }, { status: 404 });

  await setSessionCookie({
    userId: user.id,
    flatId: user.flatId,
    role: user.role,
    name: user.name,
    // Demo sessions skip the change-password gate on purpose; production auth
    // work is deliberately deferred and is tracked in ACCESS_CONTROL.md.
    mustChangePassword: false,
  });

  if (parsed.data.pairKiosk) {
    await setKioskCookie({
      deviceId: 'demo-kiosk',
      gate: parsed.data.gate,
      pairedBy: user.id,
    });
  }

  console.warn(`[demo-mode] signed in as ${user.username} without a password`);

  return NextResponse.json({
    ok: true,
    user: { username: user.username, role: user.role, flatId: user.flatId },
    kioskPaired: Boolean(parsed.data.pairKiosk),
  });
}
