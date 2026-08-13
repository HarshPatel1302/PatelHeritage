import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { getSession, setSessionCookie } from '@/lib/session';

const schema = z.object({
  currentPassword: z.string().min(1),
  // 6+ so an elderly resident can still manage it, but not the old "123".
  newPassword: z.string().min(6).max(200),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'New password must be at least 6 characters.' },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    return NextResponse.json(
      { error: 'New password must be different from the current one.' },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 12),
      mustChangePassword: false,
    },
  });

  // Refresh the cookie so mustChangePassword stops gating the UI.
  await setSessionCookie({ ...session, mustChangePassword: false });

  await audit({
    actorId: user.id,
    actorLabel: user.flatId ?? user.email,
    action: 'auth.password_changed',
    entityType: 'User',
    entityId: user.id,
    ipAddress: clientIp(),
  });

  return NextResponse.json({ ok: true });
}
