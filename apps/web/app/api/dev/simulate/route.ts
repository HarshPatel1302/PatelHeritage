import { RequestStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { demoOnlyResponse } from '@/lib/dev-mode';

/**
 * Demo-mode test actions for the dev control panel.
 *
 * Everything here drives the REAL pipeline — the card actions post to the same
 * /iclock/cdata endpoint the physical RS9N uses, rather than inserting rows
 * directly. That way a green button here genuinely exercises parsing,
 * fingerprinting, card resolution and classification.
 *
 * 404s unless DEMO_MODE=true in a non-production runtime.
 */
export const dynamic = 'force-dynamic';

const schema = z.object({
  action: z.enum([
    'punch',
    'punch_malformed',
    'punch_duplicate',
    'expire_visitor',
    'cancel_all_pending',
  ]),
  cardNumber: z.string().max(64).optional(),
  deviceSerial: z.string().max(64).optional(),
  requestId: z.string().max(64).optional(),
});

function deviceTime(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
  );
}

export async function POST(request: Request) {
  const blocked = demoOnlyResponse();
  if (blocked) return blocked;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { action } = parsed.data;
  const serial = parsed.data.deviceSerial ?? 'RS9N-FRONT-001';
  const origin = new URL(request.url).origin;

  const postAttlog = async (body: string) => {
    const res = await fetch(`${origin}/iclock/cdata?SN=${serial}&table=ATTLOG&Stamp=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
    });
    return { status: res.status, body: (await res.text()).trim() };
  };

  switch (action) {
    case 'punch': {
      const card = parsed.data.cardNumber ?? '0000000001';
      const line = [card, deviceTime(new Date()), '0', '3', '0', '0', '0'].join('\t');
      return NextResponse.json({ sent: line, device: await postAttlog(line) });
    }

    case 'punch_duplicate': {
      // Same line twice: the second must be absorbed by the fingerprint.
      const card = parsed.data.cardNumber ?? '0000000001';
      const line = [card, deviceTime(new Date()), '0', '3', '0', '0', '0'].join('\t');
      const first = await postAttlog(line);
      const second = await postAttlog(line);
      return NextResponse.json({ sent: line, first, second });
    }

    case 'punch_malformed': {
      const line = 'THIS-IS-NOT-AN-ATTLOG-RECORD ~~ garbage from an unknown firmware';
      return NextResponse.json({ sent: line, device: await postAttlog(line) });
    }

    case 'expire_visitor': {
      const where = parsed.data.requestId
        ? { id: parsed.data.requestId }
        : { status: RequestStatus.PENDING };
      const { count } = await prisma.visitorRequest.updateMany({
        where,
        // Push the deadline into the past; the normal read paths then expire it
        // through the same code that runs in production.
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      return NextResponse.json({ expiredDeadlineSet: count });
    }

    case 'cancel_all_pending': {
      const { count } = await prisma.visitorRequest.updateMany({
        where: { status: RequestStatus.PENDING },
        data: { status: RequestStatus.CANCELLED },
      });
      return NextResponse.json({ cancelled: count });
    }
  }
}
