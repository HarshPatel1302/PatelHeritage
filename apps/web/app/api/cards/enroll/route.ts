import { PunchResult, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Card enrollment helper: "Waiting for card…"
 *
 * The admin opens this screen, the person taps their new card on the RS9N, and
 * the unknown-card punch that lands is offered for assignment.
 *
 * Deliberately a READ. Nothing is registered automatically — an unknown card
 * becoming valid on its own would let anyone with any RF card enrol themselves.
 * The admin must confirm the assignment with an explicit POST /api/cards.
 */
export const dynamic = 'force-dynamic';

const MANAGERS: Role[] = [Role.SECURITY, Role.ADMIN, Role.CHAIRMAN, Role.SECRETARY];

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  if (!MANAGERS.includes(session.role)) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  // Only consider taps since the admin opened the enrollment screen, so a
  // stale unknown card from yesterday is never offered up.
  const sinceParam = searchParams.get('since');
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 2 * 60_000);

  const candidates = await prisma.punchEvent.findMany({
    where: {
      result: PunchResult.UNKNOWN_CARD,
      cardId: null,
      createdAt: { gte: since },
      cardNumber: { not: '' },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      cardNumber: true,
      punchedAt: true,
      deviceSerial: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    detected: candidates,
    serverTime: new Date().toISOString(),
  });
}
