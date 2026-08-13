import { headers } from 'next/headers';
import { prisma } from './db';

/**
 * Append-only record of who let whom in. In a society dispute ("who approved
 * that man at 2am?") this table is the answer, so it is written on every
 * decision path — including guard overrides and automatic expiries.
 */
export async function audit(entry: {
  actorId?: string | null;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorLabel: entry.actorLabel,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        meta: (entry.meta ?? {}) as object,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (err) {
    // Never let audit failure block an entry decision — a resident stuck at the
    // gate is worse than a missing log line. Surface it loudly instead.
    console.error('[audit] failed to write entry', entry.action, err);
  }
}

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(): string | null {
  const h = headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return h.get('x-real-ip');
}
