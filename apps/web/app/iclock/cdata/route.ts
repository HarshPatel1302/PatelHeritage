import { ParseStatus } from '@prisma/client';
import { handshakeResponse, parseAttlog, splitLines } from '@/lib/adms';
import { prisma } from '@/lib/db';
import { ingestRecord, punchFingerprint } from '@/lib/punch-processing';

/**
 * The endpoint the Realtime RS9N is pointed at.
 *
 * Device setup: Menu -> Comm -> Cloud Server / ADMS, server address = this
 * host, port 443 (HTTPS) or 80 (HTTP).
 *
 * The body must be the bare string "OK" — not JSON — or the unit retries the
 * same records forever.
 */
export const dynamic = 'force-dynamic';

function plain(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

const ok = () => plain('OK');

function sourceIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip');
}

/** Handshake: the device asks how it should behave. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const serial = url.searchParams.get('SN');
  if (!serial) return plain('ERROR: missing SN', 400);

  const device = await prisma.device.findUnique({ where: { serialNumber: serial } });
  if (!device || !device.isActive) {
    // An unregistered serial is hardware nobody added on purpose. Refuse it
    // rather than trusting whatever just appeared on the network.
    console.warn(`[adms] handshake from unregistered device ${serial}`);
    return plain('ERROR: device not registered', 403);
  }

  const now = new Date();
  await prisma.device.update({
    where: { serialNumber: serial },
    data: {
      lastSeenAt: now,
      lastHandshakeAt: now,
      lastSourceIp: sourceIp(request),
      lastUserAgent: request.headers.get('user-agent'),
    },
  });

  return plain(handshakeResponse(serial));
}

/** Punch records. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const serial = url.searchParams.get('SN');
  const tableName = url.searchParams.get('table') ?? 'ATTLOG';
  if (!serial) return plain('ERROR: missing SN', 400);

  const device = await prisma.device.findUnique({ where: { serialNumber: serial } });
  if (!device || !device.isActive) {
    console.warn(`[adms] data from unregistered device ${serial}`);
    return plain('ERROR: device not registered', 403);
  }

  const rawBody = await request.text();
  const ip = sourceIp(request);
  const now = new Date();

  await prisma.device.update({
    where: { serialNumber: serial },
    data: { lastSeenAt: now, lastSourceIp: ip, lastUserAgent: request.headers.get('user-agent') },
  });

  const ctx = {
    deviceSerial: serial,
    deviceDirection: device.direction,
    tableName,
    rawBody,
    queryString: url.search.replace(/^\?/, '') || null,
    sourceIp: ip,
  };

  // Tables we knowingly do not act on are still recorded, so that when the real
  // unit is connected we can see everything it actually sends.
  if (tableName.toUpperCase() !== 'ATTLOG') {
    await recordIgnored(ctx);
    return ok();
  }

  // Parse line by line rather than all-or-nothing: one malformed row must not
  // discard the good rows sent alongside it.
  const lines = splitLines(rawBody);
  if (lines.length === 0) {
    if (rawBody.trim()) await recordIgnored({ ...ctx, tableName: `${tableName} (empty parse)` });
    return ok();
  }

  let stored = 0;
  let failed = 0;

  for (const line of lines) {
    const parsedLines = parseAttlog(line);
    const parsed = parsedLines[0] ?? null;

    try {
      const outcome = await ingestRecord(
        ctx,
        parsed,
        line,
        parsed ? null : 'ATTLOG line did not match the expected tab-separated layout',
      );
      if (!outcome.duplicate) stored += 1;
      if (outcome.parseStatus === ParseStatus.FAILED) failed += 1;
    } catch (err) {
      // Never let one bad row abort the batch: the device would resend the
      // entire batch, and the rows that did work would be reprocessed.
      console.error(`[adms] failed to ingest line from ${serial}:`, line, err);
      failed += 1;
    }
  }

  if (stored > 0) {
    await prisma.device.update({
      where: { serialNumber: serial },
      data: { lastPunchAt: now },
    });
  }
  if (failed > 0) {
    console.warn(`[adms] ${failed} unparsed line(s) from ${serial} — see /admin/devices`);
  }

  return ok();
}

/** Keeps a copy of traffic we do not turn into punches. */
async function recordIgnored(ctx: {
  deviceSerial: string;
  tableName: string | null;
  rawBody: string;
  queryString: string | null;
  sourceIp: string | null;
}) {
  const fingerprint = punchFingerprint({
    deviceSerial: ctx.deviceSerial,
    rawLine: `${ctx.tableName ?? ''}:${ctx.rawBody}`,
  });

  await prisma.deviceRawRecord
    .create({
      data: {
        deviceSerial: ctx.deviceSerial,
        tableName: ctx.tableName,
        rawLine: ctx.rawBody.slice(0, 2000),
        rawBody: ctx.rawBody,
        queryString: ctx.queryString,
        sourceIp: ctx.sourceIp,
        parseStatus: ParseStatus.IGNORED,
        fingerprint,
      },
    })
    // Unique violation just means the device resent it — expected, not an error.
    .catch(() => undefined);
}
