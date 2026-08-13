import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { maskCardNumber } from '@/lib/cards';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Card entry events for the guard console.
 *
 * A resident sees only punches for their own flat (their family and their
 * domestic staff); security and committee see everything.
 */
export const dynamic = 'force-dynamic';

const PRIVILEGED: Role[] = [Role.SECURITY, Role.ADMIN, Role.CHAIRMAN, Role.SECRETARY];

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const problemsOnly = searchParams.get('problems') === '1';
  // Lets the console poll for "anything newer than what I already have".
  const sinceParam = searchParams.get('since');

  const privileged = PRIVILEGED.includes(session.role);

  const punches = await prisma.punchEvent.findMany({
    where: {
      ...(problemsOnly ? { NOT: { result: 'AUTHORIZED' as const } } : {}),
      ...(sinceParam ? { createdAt: { gt: new Date(sinceParam) } } : {}),
      ...(privileged ? {} : { card: { flatId: session.flatId ?? '__none__' } }),
    },
    // Ordered by when WE received it, not by the timestamp the device reported.
    // A reader with a skewed clock (or one replaying buffered offline punches)
    // would otherwise pin a future-dated tap to the top of the guard's console
    // indefinitely and hide everything happening now.
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      card: { select: { id: true, personName: true, category: true, isActive: true } },
      device: { select: { name: true, gate: true } },
    },
  });

  return NextResponse.json({
    punches: punches.map((p) => ({
      id: p.id,
      // Masked: the console sits where residents and visitors can see it, and a
      // full card number on screen is enough to clone one.
      cardNumberMasked: p.cardNumber ? maskCardNumber(p.cardNumber) : null,
      // Personal details are denormalised on the punch, so a renamed or deleted
      // card does not rewrite history.
      personName: p.personName ?? p.card?.personName ?? null,
      category: p.category ?? p.card?.category ?? null,
      cardId: p.cardId,
      result: p.result,
      matchMode: p.matchMode,
      direction: p.direction,
      punchedAt: p.punchedAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
      deviceName: p.device?.name ?? p.deviceSerial,
      gate: p.device?.gate ?? null,
    })),
    serverTime: new Date().toISOString(),
  });
}
