import webpush from 'web-push';
import { prisma } from './db';

/**
 * Web Push delivery for entry requests.
 *
 * Reality check on "it should ring":
 *  - App OPEN  -> the page plays a looping ringtone itself (see RingingOverlay).
 *  - App CLOSED, Android -> this notification fires with a sound and vibration
 *    pattern; Android may still throttle repeated high-priority pushes.
 *  - App CLOSED, iOS -> only works for an installed PWA (iOS 16.4+), and iOS
 *    will NOT play a custom ringtone or show a call-style screen. It is a
 *    notification, not a ring. True call behaviour needs a native app
 *    using PushKit + CallKit, which can reuse this same backend.
 */

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@patelheritage.com';
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function notifyFlatOfRequest(requestId: string): Promise<void> {
  if (!configure()) {
    console.warn('[push] VAPID keys not set — skipping push. Run: npm run push:keys');
    return;
  }

  const req = await prisma.visitorRequest.findUnique({
    where: { id: requestId },
    include: {
      flat: {
        include: {
          users: {
            where: { isActive: true },
            include: { pushSubscriptions: { where: { failedAt: null } } },
          },
        },
      },
    },
  });
  if (!req) return;

  const payload = JSON.stringify({
    type: 'VISITOR_REQUEST',
    requestId: req.id,
    flat: req.flatId,
    purpose: req.purpose,
    visitorName: req.visitorName,
    expiresAt: req.expiresAt.toISOString(),
  });

  const sends = req.flat.users.flatMap((user) =>
    user.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          { urgency: 'high', TTL: 60 },
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410 mean the browser threw the subscription away. Mark it dead so
        // we stop wasting calls on it, but keep the row for audit.
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { failedAt: new Date() },
          });
        } else {
          console.error('[push] send failed', sub.endpoint.slice(0, 40), status);
        }
      }
    }),
  );

  await Promise.allSettled(sends);
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}
