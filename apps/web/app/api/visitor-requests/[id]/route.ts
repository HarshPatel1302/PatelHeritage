import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { expireStaleRequests, toKioskView } from '@/lib/visitor-requests';

/**
 * Polled by the kiosk while the visitor waits. Returns status only — never the
 * resident's name, phone, or anything else a stranger at the gate could harvest.
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  await expireStaleRequests();

  const req = await prisma.visitorRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      flatId: true,
      expiresAt: true,
      escalatedToGuard: true,
    },
  });

  if (!req) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  return NextResponse.json({ request: toKioskView(req) });
}
