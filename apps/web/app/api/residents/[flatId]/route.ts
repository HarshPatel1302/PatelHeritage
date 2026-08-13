import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Committee edit of a flat's occupant details.
 *
 * This screen previously wrote to localStorage and told the user "updated
 * successfully" while changing nothing anyone else could see.
 */
const ADMIN_ROLES: Role[] = [Role.CHAIRMAN, Role.SECRETARY, Role.ADMIN];

const schema = z.object({
  ownerName: z.string().max(200).optional(),
  ownerPhone: z.string().max(30).optional(),
  tenantName: z.string().max(200).optional(),
  tenantPhone: z.string().max(30).optional(),
});

export async function PATCH(request: Request, { params }: { params: { flatId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  if (!ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data.' }, { status: 400 });

  const flatId = params.flatId.toUpperCase();
  const target = await prisma.user.findFirst({
    where: { flatId, isActive: true, role: Role.RESIDENT },
  });
  if (!target) return NextResponse.json({ error: 'No resident on that flat.' }, { status: 404 });

  const data = parsed.data;
  await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(data.ownerName !== undefined ? { name: data.ownerName } : {}),
      ...(data.ownerPhone !== undefined ? { phone: data.ownerPhone } : {}),
      ...(data.tenantName !== undefined ? { tenantName: data.tenantName || null } : {}),
      ...(data.tenantPhone !== undefined ? { tenantPhone: data.tenantPhone || null } : {}),
    },
  });

  await audit({
    actorId: session.userId,
    actorLabel: session.flatId ?? session.name,
    action: 'resident.updated',
    entityType: 'User',
    entityId: target.id,
    meta: { flatId, fields: Object.keys(data) },
    ipAddress: clientIp(),
  });

  return NextResponse.json({ ok: true });
}
