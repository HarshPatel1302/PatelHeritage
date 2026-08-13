import { prisma } from '@/lib/db';

/**
 * Command poll. The RS9N hits this on a timer asking "anything for me?".
 *
 * Answer "OK" for nothing to do, or a command line the device then executes
 * (used for enrolling/removing cards from the reader). Commands are queued in
 * DeviceCommand so the guard console can push a card revocation to the gate
 * without anyone walking to the machine.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serial = searchParams.get('SN');
  if (!serial) return new Response('ERROR: missing SN', { status: 400 });

  const device = await prisma.device.findUnique({ where: { serialNumber: serial } });
  if (!device || !device.isActive) {
    return new Response('ERROR: device not registered', { status: 403 });
  }

  await prisma.device.update({
    where: { serialNumber: serial },
    data: { lastSeenAt: new Date() },
  });

  const pending = await prisma.deviceCommand.findFirst({
    where: { deviceSerial: serial, sentAt: null },
    orderBy: { createdAt: 'asc' },
  });

  if (!pending) {
    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  await prisma.deviceCommand.update({
    where: { id: pending.id },
    data: { sentAt: new Date() },
  });

  // Format: C:<id>:<COMMAND>
  return new Response(`C:${pending.id}:${pending.command}`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
