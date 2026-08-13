import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Committee-only password reset for a flat, for when a resident is locked out.
 *
 * The old client-side version wrote a plaintext password into localStorage and
 * trusted the browser to enforce "only admins". Both halves of that are now
 * enforced on the server.
 */
const ADMIN_ROLES: Role[] = [Role.CHAIRMAN, Role.SECRETARY, Role.ADMIN];

const schema = z.object({
  flatId: z.string().regex(/^[A-F]\d{3,4}$/),
  newPassword: z.string().min(6).max(200),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  if (!ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters.' },
      { status: 400 },
    );
  }

  const { flatId, newPassword } = parsed.data;

  const target = await prisma.user.findFirst({
    where: { flatId: flatId.toUpperCase(), isActive: true, role: Role.RESIDENT },
  });
  if (!target) return NextResponse.json({ error: 'No resident on that flat.' }, { status: 404 });

  await prisma.user.update({
    where: { id: target.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 12),
      // Force the resident to pick their own on next sign-in — the committee
      // must not keep knowing a working password for someone's home.
      mustChangePassword: true,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await audit({
    actorId: session.userId,
    actorLabel: session.flatId ?? session.name,
    action: 'admin.password_reset',
    entityType: 'User',
    entityId: target.id,
    meta: { flatId },
    ipAddress: clientIp(),
  });

  return NextResponse.json({ ok: true });
}
