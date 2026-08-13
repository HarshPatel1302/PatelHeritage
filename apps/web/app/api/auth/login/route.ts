import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/session';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const schema = z.object({
  username: z.string().min(1).max(120), // flat number or email
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const ip = clientIp();

  const identifier = username.trim();
  // Username covers both cases: a resident types their flat ("A201"), a guard
  // types their role ("SECURITY"). Email is accepted as an alternative.
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier.toUpperCase() }, { email: identifier.toLowerCase() }],
      isActive: true,
    },
  });

  // Uniform failure message: never reveal whether the flat exists.
  const deny = () =>
    NextResponse.json({ error: 'Incorrect flat number or password.' }, { status: 401 });

  if (!user) {
    await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    return deny();
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again in a few minutes.' },
      { status: 429 },
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    const failed = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failed,
        lockedUntil:
          failed >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
            : null,
      },
    });
    await audit({
      actorId: user.id,
      actorLabel: user.flatId ?? user.email,
      action: 'auth.login_failed',
      entityType: 'User',
      entityId: user.id,
      meta: { attempt: failed },
      ipAddress: ip,
    });
    return deny();
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  await setSessionCookie({
    userId: user.id,
    flatId: user.flatId,
    role: user.role,
    name: user.name,
    mustChangePassword: user.mustChangePassword,
  });

  await audit({
    actorId: user.id,
    actorLabel: user.flatId ?? user.email,
    action: 'auth.login',
    entityType: 'User',
    entityId: user.id,
    ipAddress: ip,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      flatId: user.flatId,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });
}
