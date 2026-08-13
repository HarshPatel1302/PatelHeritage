import { RequestStatus, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/** Dashboard counters, computed in the database instead of by scanning a bundled array. */
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalFlats, residents, tenants, visitorsToday, pendingNow] = await Promise.all([
    prisma.flat.count(),
    prisma.user.count({ where: { role: Role.RESIDENT, isActive: true, flatId: { not: null } } }),
    prisma.user.count({
      where: {
        role: Role.RESIDENT,
        isActive: true,
        tenantName: { not: null, notIn: [''] },
      },
    }),
    prisma.visitorRequest.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.visitorRequest.count({ where: { status: RequestStatus.PENDING } }),
  ]);

  return NextResponse.json({
    totalFlats,
    residents,
    tenants,
    owners: residents - tenants,
    visitorsToday,
    pendingNow,
  });
}
