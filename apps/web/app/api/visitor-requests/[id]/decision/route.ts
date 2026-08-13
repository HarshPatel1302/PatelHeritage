import { RequestStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canTransition, expireStaleRequests } from '@/lib/visitor-requests';

const GUARD_ROLES: Role[] = [Role.SECURITY, Role.ADMIN, Role.CHAIRMAN, Role.SECRETARY];

const schema = z.object({
  // DENY is the canonical wording; REJECT is accepted so older clients and the
  // service worker's notification actions keep working.
  decision: z.enum(['APPROVE', 'DENY', 'REJECT']),
  note: z.string().max(300).optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });
  }

  // Flip anything past its deadline before deciding, so a late tap on a stale
  // notification cannot approve a request that has already timed out (Rule 9).
  await expireStaleRequests();

  const req = await prisma.visitorRequest.findUnique({ where: { id: params.id } });
  if (!req) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const isResidentOfFlat = session.flatId === req.flatId;
  const isGuard = GUARD_ROLES.includes(session.role);

  if (!isResidentOfFlat && !isGuard) {
    await audit({
      actorId: session.userId,
      actorLabel: session.flatId ?? session.name,
      action: 'visitor.decision_denied',
      entityType: 'VisitorRequest',
      entityId: req.id,
      meta: { targetFlat: req.flatId },
      ipAddress: clientIp(),
    });
    return NextResponse.json({ error: 'Not your flat.' }, { status: 403 });
  }

  const approved = parsed.data.decision === 'APPROVE';
  const target = approved ? RequestStatus.APPROVED : RequestStatus.DENIED;

  if (!canTransition(req.status, target)) {
    return NextResponse.json(
      {
        error:
          req.status === RequestStatus.EXPIRED
            ? 'This request timed out and can no longer be approved.'
            : `This request is already ${req.status.toLowerCase()}.`,
        status: req.status,
      },
      { status: 409 },
    );
  }

  // Conditional update: whoever gets there first wins. This is the race guard
  // for a resident and a guard deciding at once, or two family devices both
  // tapping Allow — the WHERE clause makes it atomic in the database.
  const { count } = await prisma.visitorRequest.updateMany({
    where: { id: req.id, status: RequestStatus.PENDING },
    data: {
      status: target,
      respondedAt: new Date(),
      respondedById: session.userId,
      overriddenByGuard: isGuard && !isResidentOfFlat,
      decisionNote: parsed.data.note ?? null,
    },
  });

  if (count === 0) {
    const latest = await prisma.visitorRequest.findUnique({
      where: { id: req.id },
      select: { status: true },
    });
    return NextResponse.json(
      { error: 'Someone already answered this request.', status: latest?.status },
      { status: 409 },
    );
  }

  await audit({
    actorId: session.userId,
    actorLabel: session.flatId ?? session.name,
    action: approved ? 'visitor.approved' : 'visitor.denied',
    entityType: 'VisitorRequest',
    entityId: req.id,
    meta: {
      flatId: req.flatId,
      byGuardOverride: isGuard && !isResidentOfFlat,
      note: parsed.data.note ?? null,
    },
    ipAddress: clientIp(),
  });

  return NextResponse.json({ ok: true, status: target });
}
