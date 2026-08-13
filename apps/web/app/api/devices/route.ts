import { ParseStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Device diagnostics.
 *
 * This is the screen that makes connecting the physical RS9N cheap: it shows
 * whether the unit is reaching us at all, and exactly what bytes it sent. When
 * the real device arrives, register its serial here and read the raw records to
 * confirm (or correct) the ATTLOG field order in lib/adms.ts.
 */
export const dynamic = 'force-dynamic';

const ADMINS: Role[] = [Role.ADMIN, Role.CHAIRMAN, Role.SECRETARY, Role.SECURITY];

const createSchema = z.object({
  serialNumber: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  gate: z.enum(['FRONT', 'BACK']).default('FRONT'),
  direction: z.enum(['IN', 'OUT', 'UNKNOWN']).default('UNKNOWN'),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  if (!ADMINS.includes(session.role)) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = Math.min(Number(searchParams.get('rawLimit') ?? 25), 100);
  const unparsedOnly = searchParams.get('unparsed') === '1';

  const [devices, rawRecords, pendingCommands, counts] = await Promise.all([
    prisma.device.findMany({ orderBy: { name: 'asc' } }),
    prisma.deviceRawRecord.findMany({
      where: unparsedOnly ? { parseStatus: ParseStatus.FAILED } : {},
      orderBy: { receivedAt: 'desc' },
      take: rawLimit,
      include: { punchEvent: { select: { id: true, result: true } } },
    }),
    prisma.deviceCommand.findMany({
      where: { acknowledgedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.deviceRawRecord.groupBy({ by: ['parseStatus'], _count: true }),
  ]);

  return NextResponse.json({
    devices: devices.map((d) => ({
      id: d.id,
      serialNumber: d.serialNumber,
      name: d.name,
      gate: d.gate,
      direction: d.direction,
      isActive: d.isActive,
      lastSeenAt: d.lastSeenAt,
      lastHandshakeAt: d.lastHandshakeAt,
      lastPunchAt: d.lastPunchAt,
      lastSourceIp: d.lastSourceIp,
      lastUserAgent: d.lastUserAgent,
    })),
    rawRecords: rawRecords.map((r) => ({
      id: r.id,
      deviceSerial: r.deviceSerial,
      tableName: r.tableName,
      // Tabs are invisible in HTML; show them so field boundaries are obvious.
      rawLine: r.rawLine.replace(/\t/g, ' ⇥ '),
      rawLineExact: r.rawLine,
      rawBody: r.rawBody,
      queryString: r.queryString,
      sourceIp: r.sourceIp,
      receivedAt: r.receivedAt,
      parseStatus: r.parseStatus,
      parseError: r.parseError,
      parsedCardNumber: r.parsedCardNumber,
      parsedPunchedAt: r.parsedPunchedAt,
      punchResult: r.punchEvent?.result ?? null,
    })),
    pendingCommands,
    parseCounts: Object.fromEntries(counts.map((c) => [c.parseStatus, c._count])),
    serverTime: new Date().toISOString(),
  });
}

/** Register a device — used when the real RS9N's serial number is known. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  if (!ADMINS.includes(session.role)) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid device.' }, { status: 400 });

  const serialNumber = parsed.data.serialNumber.trim().toUpperCase();
  const existing = await prisma.device.findUnique({ where: { serialNumber } });
  if (existing) {
    return NextResponse.json({ error: 'That serial number is already registered.' }, { status: 409 });
  }

  const device = await prisma.device.create({
    data: { ...parsed.data, serialNumber },
  });

  await audit({
    actorId: session.userId,
    actorLabel: session.flatId ?? session.name,
    action: 'device.registered',
    entityType: 'Device',
    entityId: device.id,
    meta: { serialNumber, gate: device.gate },
    ipAddress: clientIp(),
  });

  return NextResponse.json({ device }, { status: 201 });
}
