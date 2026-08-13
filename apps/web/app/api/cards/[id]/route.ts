import { CardCategory, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

const MANAGERS: Role[] = [Role.SECURITY, Role.ADMIN, Role.CHAIRMAN, Role.SECRETARY];

const schema = z.object({
  isActive: z.boolean().optional(),
  personName: z.string().min(1).max(200).optional(),
  category: z.nativeEnum(CardCategory).optional(),
  mobileNumber: z.string().max(20).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  allowedFromHour: z.number().int().min(0).max(23).nullable().optional(),
  allowedToHour: z.number().int().min(1).max(24).nullable().optional(),
});

/** Card detail plus punch history — the "view punch history" requirement. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  if (!MANAGERS.includes(session.role)) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const card = await prisma.accessCard.findUnique({
    where: { id: params.id },
    include: {
      punches: {
        orderBy: { punchedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          punchedAt: true,
          direction: true,
          result: true,
          deviceSerial: true,
          matchMode: true,
        },
      },
    },
  });
  if (!card) return NextResponse.json({ error: 'Card not found.' }, { status: 404 });

  return NextResponse.json({ card });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  if (!MANAGERS.includes(session.role)) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });

  const card = await prisma.accessCard.findUnique({ where: { id: params.id } });
  if (!card) return NextResponse.json({ error: 'Card not found.' }, { status: 404 });

  const data = parsed.data;
  const updated = await prisma.accessCard.update({
    where: { id: params.id },
    data: {
      ...data,
      validUntil:
        data.validUntil === undefined
          ? undefined
          : data.validUntil === null
            ? null
            : new Date(data.validUntil),
    },
  });

  // Deactivating here only stops OUR system trusting the card. The reader keeps
  // its own copy, so queue a delete on every device as well — otherwise a
  // revoked card would still be accepted at the gate.
  if (data.isActive === false) {
    const devices = await prisma.device.findMany({ where: { isActive: true } });
    if (devices.length > 0) {
      await prisma.deviceCommand.createMany({
        data: devices.map((d) => ({
          deviceSerial: d.serialNumber,
          command: `DATA DELETE USERINFO PIN=${card.cardNumber}`,
        })),
      });
    }
  }

  await audit({
    actorId: session.userId,
    actorLabel: session.flatId ?? session.name,
    action:
      data.isActive === false
        ? 'card.disabled'
        : data.isActive === true
          ? 'card.enabled'
          : 'card.updated',
    entityType: 'AccessCard',
    entityId: card.id,
    meta: { cardNumber: card.cardNumber, personName: card.personName, changes: data },
    ipAddress: clientIp(),
  });

  return NextResponse.json({ card: updated });
}
