import { NextResponse } from 'next/server';
import { audit, clientIp } from '@/lib/audit';
import { clearSessionCookie, getSession } from '@/lib/session';

export async function POST() {
  const session = await getSession();
  if (session) {
    await audit({
      actorId: session.userId,
      actorLabel: session.flatId ?? session.name,
      action: 'auth.logout',
      entityType: 'User',
      entityId: session.userId,
      ipAddress: clientIp(),
    });
  }
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
