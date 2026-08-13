import { RequestSource, Role, VisitorPurpose } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, clientIp } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { RATE_LIMIT_PAIRED, getKioskSession } from '@/lib/kiosk-session';
import { MAX_PHOTO_BYTES, savePhoto } from '@/lib/photo-storage';
import { notifyFlatOfRequest } from '@/lib/push';
import { getSession } from '@/lib/session';
import {
  REQUEST_TIMEOUT_SECONDS,
  isBlacklisted,
  isFlatRateLimited,
  isIpRateLimited,
  photoPurgeDate,
  toKioskView,
} from '@/lib/visitor-requests';

/**
 * Created by the gate kiosk, which is deliberately UNAUTHENTICATED — a visitor
 * cannot log in. Everything that protects this endpoint is therefore here:
 * rate limits, blacklist, photo validation, and deny-by-default expiry.
 */
export const dynamic = 'force-dynamic';

const schema = z.object({
  flatId: z.string().regex(/^[A-F]\d{3,4}$/, 'Invalid flat'),
  purpose: z.nativeEnum(VisitorPurpose).default(VisitorPurpose.GUEST),
  visitorName: z.string().max(120).optional(),
  visitorPhone: z.string().max(20).optional(),
  gate: z.enum(['FRONT', 'BACK']).default('FRONT'),
  kioskSessionId: z.string().max(64).optional(),
  /** data:image/jpeg;base64,... captured by the kiosk camera */
  photoDataUrl: z.string().optional(),
});

function decodeJpegDataUrl(dataUrl: string): Buffer | null {
  const match = /^data:image\/jpe?g;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  const buf = Buffer.from(match[1]!, 'base64');
  return buf.length > 0 && buf.length <= MAX_PHOTO_BYTES ? buf : null;
}

export async function POST(request: Request) {
  const ip = clientIp();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const input = parsed.data;
  const flatId = input.flatId.toUpperCase();

  const flat = await prisma.flat.findUnique({
    where: { id: flatId },
    include: { users: { where: { isActive: true }, select: { id: true } } },
  });
  if (!flat) {
    return NextResponse.json({ error: 'Unknown flat.' }, { status: 404 });
  }

  const blocked = await isBlacklisted({ phone: input.visitorPhone });
  if (blocked.blocked) {
    // Do not tell the visitor they are blacklisted — tell them to see the guard,
    // and raise it on the guard console instead.
    await audit({
      actorLabel: 'kiosk',
      action: 'visitor.blacklist_blocked',
      entityType: 'Flat',
      entityId: flatId,
      meta: { reason: blocked.reason, phone: input.visitorPhone },
      ipAddress: ip,
    });
    return NextResponse.json(
      { error: 'Please see the security guard at the gate.', code: 'SEE_GUARD' },
      { status: 403 },
    );
  }

  // Only two callers may make a resident's phone ring: a paired gate screen,
  // or a signed-in guard registering a walk-in by hand. Anything else is a
  // stranger on the internet, and is refused rather than rate-limited.
  const kiosk = await getKioskSession();
  const session = kiosk ? null : await getSession();
  const staffRegistering =
    session !== null && ([Role.SECURITY, Role.ADMIN] as Role[]).includes(session.role);

  if (!kiosk && !staffRegistering) {
    return NextResponse.json(
      {
        error: 'This device is not registered as a gate screen.',
        code: 'NOT_PAIRED',
      },
      { status: 403 },
    );
  }

  if (await isIpRateLimited(ip, RATE_LIMIT_PAIRED)) {
    return NextResponse.json(
      { error: 'Too many requests from this gate. Please see the security guard.' },
      { status: 429 },
    );
  }

  if (await isFlatRateLimited(flatId)) {
    return NextResponse.json(
      {
        error: 'This flat already has a request waiting. Please see the security guard.',
        code: 'ALREADY_PENDING',
      },
      { status: 429 },
    );
  }

  // Photo is expected but not mandatory: a failed camera must never trap a
  // visitor at the gate. A missing photo is flagged so the guard notices.
  let photoKey: string | null = null;
  let photoError: string | null = null;
  if (input.photoDataUrl) {
    const bytes = decodeJpegDataUrl(input.photoDataUrl);
    if (!bytes) {
      photoError = 'invalid_jpeg';
    } else {
      try {
        photoKey = await savePhoto(bytes);
      } catch (err) {
        photoError = err instanceof Error ? err.message : 'save_failed';
      }
    }
  } else {
    photoError = 'no_photo_captured';
  }

  const created = await prisma.visitorRequest.create({
    data: {
      flatId,
      visitorName: input.visitorName?.trim() || null,
      visitorPhone: input.visitorPhone?.trim() || null,
      purpose: input.purpose,
      source: RequestSource.KIOSK,
      // Trust the paired device's configured gate over anything the client
      // claims, so a request cannot be mislabelled as coming from another gate.
      gate: kiosk?.gate ?? input.gate,
      photoKey,
      photoPurgeAfter: photoKey ? photoPurgeDate() : null,
      expiresAt: new Date(Date.now() + REQUEST_TIMEOUT_SECONDS * 1000),
      kioskSessionId: input.kioskSessionId ?? null,
      ipAddress: ip,
      // Nobody registered on this flat means nobody can answer — send it
      // straight to the guard rather than ringing into the void.
      escalatedToGuard: flat.users.length === 0,
    },
  });

  await audit({
    actorLabel: 'kiosk',
    action: 'visitor.requested',
    entityType: 'VisitorRequest',
    entityId: created.id,
    meta: { flatId, purpose: input.purpose, photoError, gate: input.gate },
    ipAddress: ip,
  });

  // Fire the push. Failure here must not fail the request — the resident's
  // open app will still pick it up by polling.
  notifyFlatOfRequest(created.id).catch((err) =>
    console.error('[push] notify failed', created.id, err),
  );

  return NextResponse.json(
    { request: toKioskView(created), photoCaptured: Boolean(photoKey) },
    { status: 201 },
  );
}
