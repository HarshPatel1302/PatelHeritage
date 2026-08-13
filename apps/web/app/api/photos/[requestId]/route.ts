import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readPhoto } from '@/lib/photo-storage';
import { getSession } from '@/lib/session';

/**
 * Visitor photos are served only here, never as a public URL.
 * Access: the resident of that flat, or security/admin. Nobody else — a photo
 * of a person at a gate is personal data under the DPDP Act 2023.
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { requestId: string } }) {
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const req = await prisma.visitorRequest.findUnique({
    where: { id: params.requestId },
    select: { flatId: true, photoKey: true },
  });

  if (!req?.photoKey) return new NextResponse('Not found', { status: 404 });

  const privileged = ([Role.SECURITY, Role.ADMIN] as Role[]).includes(session.role);
  if (!privileged && session.flatId !== req.flatId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const bytes = await readPhoto(req.photoKey);
  if (!bytes) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/jpeg',
      // Private: must never land in a shared CDN cache.
      'Cache-Control': 'private, max-age=300, no-store',
      'Content-Disposition': 'inline',
    },
  });
}
