import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { isDemoMode } from '@/lib/dev-mode';
import { clearKioskCookie, getKioskSession, setKioskCookie } from '@/lib/kiosk-session';

/**
 * Pair a gate screen to this society.
 *
 * Done once, in person, by a committee member or security in-charge standing at
 * the tablet. Credentials are checked here and never stored on the device —
 * only an opaque signed cookie is left behind.
 */
export const dynamic = 'force-dynamic';

const PAIRERS: Role[] = [Role.CHAIRMAN, Role.SECRETARY, Role.ADMIN, Role.SECURITY];

const schema = z.object({
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(200),
  gate: z.enum(['FRONT', 'BACK']).default('FRONT'),
});

/** Lets the kiosk page ask "am I paired?" without exposing the token itself. */
export async function GET() {
  let kiosk = await getKioskSession();

  // In demo mode a fresh browser opening /kiosk would otherwise be met with the
  // setup screen rather than "Welcome to Patel Heritage". Pair it on the spot so
  // the gate flow is reachable with no credentials at all. Production is
  // untouched: isDemoMode() requires DEMO_MODE outside a production runtime, and
  // the server refuses to boot if those ever disagree.
  if (!kiosk && isDemoMode()) {
    await setKioskCookie({ deviceId: 'demo-kiosk', gate: 'FRONT', pairedBy: 'demo' });
    kiosk = await getKioskSession();
  }

  return NextResponse.json({
    paired: Boolean(kiosk),
    gate: kiosk?.gate ?? null,
  });
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { username, password, gate } = parsed.data;
  const ip = clientIp();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: username.toUpperCase() }, { email: username.toLowerCase() }],
      isActive: true,
    },
  });

  const deny = () =>
    NextResponse.json({ error: 'Incorrect username or password.' }, { status: 401 });

  if (!user) {
    await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    return deny();
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) return deny();

  if (!PAIRERS.includes(user.role)) {
    return NextResponse.json(
      { error: 'Only committee members or security may pair a gate screen.' },
      { status: 403 },
    );
  }

  const deviceId = randomUUID();
  await setKioskCookie({ deviceId, gate, pairedBy: user.id });

  await audit({
    actorId: user.id,
    actorLabel: user.username,
    action: 'kiosk.paired',
    entityType: 'Device',
    entityId: deviceId,
    meta: { gate, userAgent: request.headers.get('user-agent') },
    ipAddress: ip,
  });

  return NextResponse.json({ ok: true, gate });
}

/** Unpair — used when a gate tablet is replaced, lost, or repurposed. */
export async function DELETE() {
  const kiosk = await getKioskSession();
  clearKioskCookie();
  if (kiosk) {
    await audit({
      actorLabel: 'kiosk',
      action: 'kiosk.unpaired',
      entityType: 'Device',
      entityId: kiosk.deviceId,
      ipAddress: clientIp(),
    });
  }
  return NextResponse.json({ ok: true });
}
