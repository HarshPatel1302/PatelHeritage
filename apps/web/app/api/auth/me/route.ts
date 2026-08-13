import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { demoDefaultUsername, isDemoMode } from '@/lib/dev-mode';
import { getKioskSession, setKioskCookie } from '@/lib/kiosk-session';
import { getSession, setSessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();

  // ---- Demo mode: no login screen at all ---------------------------------
  // Every page already asks "who am I?" on mount, so signing in here means the
  // app simply opens, already authenticated, with no credentials anywhere.
  // isDemoMode() requires DEMO_MODE=true AND a non-production runtime, and the
  // server refuses to boot if those ever disagree — so this cannot leak out.
  if (!session && isDemoMode()) {
    const user = await autoSignIn();
    if (user) return NextResponse.json({ user, demoMode: true });
  }

  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  // Read through to the DB so a deactivated account loses access immediately
  // rather than at token expiry.
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      flatId: true,
      mustChangePassword: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user, demoMode: isDemoMode() });
}

/**
 * Creates a real session for the default demo identity, and pairs this browser
 * as a gate screen so /kiosk works too without anyone registering it.
 */
async function autoSignIn() {
  const user = await prisma.user.findFirst({
    where: { username: demoDefaultUsername(), isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      flatId: true,
      username: true,
    },
  });

  if (!user) {
    console.warn(
      `[demo-mode] DEMO_USER "${demoDefaultUsername()}" not found. Has the database been seeded?`,
    );
    return null;
  }

  await setSessionCookie({
    userId: user.id,
    flatId: user.flatId,
    role: user.role,
    name: user.name,
    mustChangePassword: false,
  });

  if (!(await getKioskSession())) {
    await setKioskCookie({ deviceId: 'demo-kiosk', gate: 'FRONT', pairedBy: user.id });
  }

  return { ...user, mustChangePassword: false, isActive: true };
}
