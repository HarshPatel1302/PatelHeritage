import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { vapidPublicKey } from '@/lib/push';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

/** The browser needs the public VAPID key to create a subscription. */
export async function GET() {
  const key = vapidPublicKey();
  if (!key) {
    return NextResponse.json({ error: 'Push is not configured.' }, { status: 503 });
  }
  return NextResponse.json({ publicKey: key });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;

  // A device can move between accounts (shared family tablet), so the endpoint
  // is the identity and ownership is reassigned on conflict.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: session.userId, p256dh: keys.p256dh, auth: keys.auth, failedAt: null },
    create: {
      userId: session.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: request.headers.get('user-agent'),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { endpoint } = await request.json().catch(() => ({ endpoint: null }));
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint.' }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.userId } });
  return NextResponse.json({ ok: true });
}
