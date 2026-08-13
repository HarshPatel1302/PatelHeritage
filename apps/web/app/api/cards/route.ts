import { CardCategory, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { compactCardNumber, isValidCardNumber, normalizeCardNumber } from '@/lib/cards';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/** Society-issued RF cards. Security and committee can issue and revoke. */
export const dynamic = 'force-dynamic';

const MANAGERS: Role[] = [Role.SECURITY, Role.ADMIN, Role.CHAIRMAN, Role.SECRETARY];

const createSchema = z.object({
  cardNumber: z.string().min(1).max(64),
  personName: z.string().min(1).max(200),
  category: z.nativeEnum(CardCategory).default(CardCategory.OTHER),
  mobileNumber: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  flatId: z.string().regex(/^[A-F]\d{3,4}$/).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  allowedFromHour: z.number().int().min(0).max(23).optional(),
  allowedToHour: z.number().int().min(1).max(24).optional(),
});

async function requireManager() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: 'Not signed in.' }, { status: 401 }) };
  if (!MANAGERS.includes(session.role)) {
    return { error: NextResponse.json({ error: 'Not permitted.' }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request: Request) {
  const auth = await requireManager();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const activeOnly = searchParams.get('active') === '1';

  const cards = await prisma.accessCard.findMany({
    where: {
      ...(activeOnly ? { isActive: true } : {}),
      ...(query
        ? {
            OR: [
              { personName: { contains: query, mode: 'insensitive' as const } },
              { cardNumber: { contains: normalizeCardNumber(query) } },
              { mobileNumber: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: [{ isActive: 'desc' }, { personName: 'asc' }],
    take: 300,
    include: {
      _count: { select: { punches: true } },
      punches: {
        orderBy: { punchedAt: 'desc' },
        take: 1,
        select: { punchedAt: true, direction: true, result: true },
      },
    },
  });

  return NextResponse.json({
    cards: cards.map((c) => ({
      id: c.id,
      cardNumber: c.cardNumber,
      personName: c.personName,
      category: c.category,
      mobileNumber: c.mobileNumber,
      notes: c.notes,
      flatId: c.flatId,
      isActive: c.isActive,
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      allowedFromHour: c.allowedFromHour,
      allowedToHour: c.allowedToHour,
      punchCount: c._count.punches,
      lastPunch: c.punches[0] ?? null,
      createdAt: c.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireManager();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid card details.' },
      { status: 400 },
    );
  }
  const input = parsed.data;

  if (!isValidCardNumber(input.cardNumber)) {
    return NextResponse.json(
      { error: 'Card number must be letters and digits only.' },
      { status: 400 },
    );
  }

  // Normalised before the uniqueness check, so "0000-1234" and "00001234"
  // cannot both be issued to different people.
  const cardNumber = normalizeCardNumber(input.cardNumber);

  const existing = await prisma.accessCard.findUnique({ where: { cardNumber } });
  if (existing) {
    return NextResponse.json(
      { error: `Card ${cardNumber} is already issued to ${existing.personName}.` },
      { status: 409 },
    );
  }

  const card = await prisma.accessCard.create({
    data: {
      cardNumber,
      cardNumberCompact: compactCardNumber(cardNumber),
      personName: input.personName.trim(),
      category: input.category,
      mobileNumber: input.mobileNumber?.trim() || null,
      notes: input.notes?.trim() || null,
      flatId: input.flatId?.toUpperCase() ?? null,
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      allowedFromHour: input.allowedFromHour ?? null,
      allowedToHour: input.allowedToHour ?? null,
    },
  });

  // Punches logged before this card was registered were recorded as
  // UNKNOWN_CARD. Leave them as they were — a security log must reflect what was
  // true at the time — but link them so the person's history is complete.
  await prisma.punchEvent.updateMany({
    where: { cardNumber, cardId: null },
    data: { cardId: card.id },
  });

  await audit({
    actorId: session.userId,
    actorLabel: session.flatId ?? session.name,
    action: 'card.created',
    entityType: 'AccessCard',
    entityId: card.id,
    meta: { cardNumber: card.cardNumber, personName: card.personName, category: card.category },
    ipAddress: clientIp(),
  });

  return NextResponse.json({ card }, { status: 201 });
}
