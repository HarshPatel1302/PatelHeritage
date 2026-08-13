import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * The resident directory.
 *
 * Contact details are visible only to the committee. Everyone else who is
 * signed in gets occupancy (which flats exist and whether someone lives there)
 * without names or phone numbers — enough to render the wing views, not enough
 * to build a phone list of every family in the building.
 */
export const dynamic = 'force-dynamic';

const PRIVILEGED: Role[] = [Role.CHAIRMAN, Role.SECRETARY, Role.ADMIN];

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const wing = searchParams.get('wing')?.toUpperCase();
  const floor = searchParams.get('floor');

  const canSeeContacts = PRIVILEGED.includes(session.role);

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      flatId: { not: null },
      ...(wing ? { flat: { wing } } : {}),
      ...(floor ? { flat: { floor: Number(floor) } } : {}),
    },
    select: {
      id: true,
      flatId: true,
      role: true,
      name: canSeeContacts,
      phone: canSeeContacts,
      email: canSeeContacts,
      tenantName: canSeeContacts,
      tenantPhone: canSeeContacts,
    },
    orderBy: { flatId: 'asc' },
  });

  return NextResponse.json({
    residents: users,
    // Tells the client whether it is looking at a redacted view.
    includesContactDetails: canSeeContacts,
  });
}
