/* Patel Heritage service worker — entry-request notifications.
 *
 * Scope note: this worker exists to deliver visitor alerts when the app is
 * closed. It deliberately does NOT cache pages: a stale approval screen or a
 * cached visitor photo would be worse than a slow load.
 */

self.addEventListener('install', (event) => {
  // Take over immediately so a resident who just installed the app is covered.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  if (payload.type !== 'VISITOR_REQUEST') return;

  const title = `Someone is at the gate — Flat ${payload.flat}`;
  const body = payload.visitorName
    ? `${payload.visitorName} is asking to come in. Tap to allow or deny.`
    : 'A visitor is asking to come in. Tap to allow or deny.';

  event.waitUntil(
    (async () => {
      // If a window is already open, let the in-app overlay do the ringing —
      // it can loop audio, which a notification cannot.
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const visible = clientList.some((c) => c.visibilityState === 'visible');
      if (visible) {
        clientList.forEach((c) => c.postMessage({ type: 'VISITOR_REQUEST', ...payload }));
        return;
      }

      await self.registration.showNotification(title, {
        body,
        tag: `visitor-${payload.requestId}`,
        renotify: true,
        requireInteraction: true, // stays on screen until answered
        vibrate: [400, 200, 400, 200, 400],
        badge: '/icons/badge.png',
        icon: '/icons/icon-192.png',
        data: { requestId: payload.requestId, url: '/resident-home' },
        actions: [
          { action: 'approve', title: 'Allow' },
          { action: 'reject', title: 'Deny' },
        ],
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  const { requestId, url } = event.notification.data || {};
  event.notification.close();

  event.waitUntil(
    (async () => {
      // Answering straight from the notification, without opening the app.
      if (event.action === 'approve' || event.action === 'reject') {
        try {
          await fetch(`/api/visitor-requests/${requestId}/decision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              decision: event.action === 'approve' ? 'APPROVE' : 'REJECT',
            }),
          });
          return;
        } catch {
          // Fall through and open the app so the resident can retry by hand.
        }
      }

      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const existing = clientList.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(url || '/');
    })(),
  );
});
