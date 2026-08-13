import { RequestStatus } from '@prisma/client';
import { prisma } from './db';

export const REQUEST_TIMEOUT_SECONDS = Number(process.env.REQUEST_TIMEOUT_SECONDS ?? 60);
export const PHOTO_RETENTION_DAYS = Number(process.env.PHOTO_RETENTION_DAYS ?? 30);

/**
 * Visitor request state machine.
 *
 *            ┌──────────► APPROVED
 *   PENDING ─┼──────────► DENIED
 *            ├──────────► EXPIRED    (nobody answered — never an approval)
 *            └──────────► CANCELLED  (visitor left / guard voided)
 *
 * Every terminal state is final. In particular EXPIRED → APPROVED is refused
 * (Rule 9), which is what stops a resident tapping a stale notification minutes
 * later and admitting someone who has already been turned away.
 */
const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDING: [
    RequestStatus.APPROVED,
    RequestStatus.DENIED,
    RequestStatus.EXPIRED,
    RequestStatus.CANCELLED,
  ],
  APPROVED: [],
  DENIED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export const TERMINAL_STATUSES: RequestStatus[] = [
  RequestStatus.APPROVED,
  RequestStatus.DENIED,
  RequestStatus.EXPIRED,
  RequestStatus.CANCELLED,
];

/**
 * Deny by default.
 *
 * A request that nobody answers must never drift into "approved". Rather than
 * relying on a cron job that might not run, any read path calls this first, so
 * an unanswered request is already EXPIRED by the time anyone sees it.
 * The cron in /api/cron/sweep is a backstop for photo purging, not correctness.
 */
export async function expireStaleRequests(): Promise<number> {
  const { count } = await prisma.visitorRequest.updateMany({
    where: { status: RequestStatus.PENDING, expiresAt: { lt: new Date() } },
    data: { status: RequestStatus.EXPIRED, escalatedToGuard: true },
  });
  return count;
}

/**
 * Harassment guard. Anyone can walk to the gate and tap a flat; without this,
 * a person could ring an elderly resident's phone continuously.
 * Enforced in the database so it survives serverless cold starts.
 */
export async function isFlatRateLimited(flatId: string): Promise<boolean> {
  const [pending, recent] = await Promise.all([
    prisma.visitorRequest.count({
      where: { flatId, status: RequestStatus.PENDING },
    }),
    prisma.visitorRequest.count({
      where: { flatId, createdAt: { gte: new Date(Date.now() - 10 * 60_000) } },
    }),
  ]);
  return pending >= 2 || recent >= 5;
}

/**
 * Per-IP ceiling over the last 10 minutes.
 *
 * The budget depends on whether the caller is a paired gate screen. One kiosk
 * speaks for all 236 flats, so its limit only needs to catch a device stuck in
 * a loop; an unpaired caller is someone hitting the API directly and gets
 * almost no room at all.
 */
export async function isIpRateLimited(ip: string | null, budget: number): Promise<boolean> {
  if (!ip) return false;
  const recent = await prisma.visitorRequest.count({
    where: { ipAddress: ip, createdAt: { gte: new Date(Date.now() - 10 * 60_000) } },
  });
  return recent >= budget;
}

export async function isBlacklisted(input: {
  phone?: string | null;
  cardNumber?: string | null;
}): Promise<{ blocked: boolean; reason?: string }> {
  const or = [];
  if (input.phone) or.push({ phone: input.phone });
  if (input.cardNumber) or.push({ cardNumber: input.cardNumber });
  if (or.length === 0) return { blocked: false };

  const hit = await prisma.blacklistEntry.findFirst({
    where: { isActive: true, OR: or },
  });
  return hit ? { blocked: true, reason: hit.reason } : { blocked: false };
}

export function photoPurgeDate(): Date {
  return new Date(Date.now() + PHOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

/** Shape sent to the kiosk. Deliberately carries no resident identity. */
export function toKioskView(req: {
  id: string;
  status: RequestStatus;
  flatId: string;
  expiresAt: Date;
  escalatedToGuard: boolean;
}) {
  return {
    id: req.id,
    status: req.status,
    flat: req.flatId,
    expiresAt: req.expiresAt.toISOString(),
    escalatedToGuard: req.escalatedToGuard,
  };
}
