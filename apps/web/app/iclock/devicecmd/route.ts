import { prisma } from '@/lib/db';

/**
 * Command acknowledgement. The device reports the outcome of whatever it
 * collected from /iclock/getrequest, in the form:
 *
 *   ID=<commandId>&Return=<code>&CMD=<name>
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const serial = searchParams.get('SN');
  if (!serial) return new Response('ERROR: missing SN', { status: 400 });

  const body = await request.text();

  for (const line of body.split(/\r?\n/)) {
    const params = new URLSearchParams(line.trim());
    const id = params.get('ID');
    if (!id) continue;

    await prisma.deviceCommand
      .update({
        where: { id },
        data: { acknowledgedAt: new Date(), result: line.trim() },
      })
      .catch(() => undefined); // unknown id — nothing to record
  }

  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
}
