import { RequestStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { expireStaleRequests } from '@/lib/visitor-requests';

/**
 * Polled every couple of seconds by the resident app (and the guard console)
 * to drive the ringing overlay. Vercel's function timeout rules out a
 * long-lived SSE stream, so short polling is the honest choice here.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  await expireStaleRequests();

  const isGuard = ([Role.SECURITY, Role.ADMIN] as Role[]).includes(session.role);

  const requests = await prisma.visitorRequest.findMany({
    where: isGuard
      ? { status: RequestStatus.PENDING }
      : { status: RequestStatus.PENDING, flatId: session.flatId ?? '__none__' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      flatId: true,
      visitorName: true,
      visitorPhone: true,
      purpose: true,
      gate: true,
      source: true,
      photoKey: true,
      createdAt: true,
      expiresAt: true,
      escalatedToGuard: true,
    },
    take: 50,
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      ...r,
      // Never expose the raw storage key; the client fetches through /api/photos.
      photoUrl: r.photoKey ? `/api/photos/${r.id}` : null,
      photoKey: undefined,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    })),
    serverTime: new Date().toISOString(),
  });
}
