import { RequestStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { TERMINAL_STATUSES, expireStaleRequests } from '@/lib/visitor-requests';

/**
 * Recently decided visitor requests, for the guard's "what just happened" list.
 * Residents see only their own flat.
 */
export const dynamic = 'force-dynamic';

const PRIVILEGED: Role[] = [Role.SECURITY, Role.ADMIN, Role.CHAIRMAN, Role.SECRETARY];

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  await expireStaleRequests();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
  const privileged = PRIVILEGED.includes(session.role);

  const requests = await prisma.visitorRequest.findMany({
    where: {
      status: { in: TERMINAL_STATUSES as RequestStatus[] },
      ...(privileged ? {} : { flatId: session.flatId ?? '__none__' }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      flatId: true,
      status: true,
      purpose: true,
      gate: true,
      source: true,
      photoKey: true,
      visitorName: true,
      createdAt: true,
      expiresAt: true,
      respondedAt: true,
      overriddenByGuard: true,
      escalatedToGuard: true,
    },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      ...r,
      photoUrl: r.photoKey ? `/api/photos/${r.id}` : null,
      photoKey: undefined,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
      respondedAt: r.respondedAt?.toISOString() ?? null,
    })),
  });
}
