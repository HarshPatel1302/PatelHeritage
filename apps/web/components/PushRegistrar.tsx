'use client';

import { Bell, BellOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type PushState = 'unsupported' | 'unconfigured' | 'default' | 'granted' | 'denied' | 'working';

/** base64url -> ArrayBuffer, the format PushManager.subscribe expects. */
function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalised);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

/**
 * Asks the resident to enable gate alerts, then registers the service worker
 * and stores the push subscription.
 *
 * Deliberately NOT auto-prompting on page load: browsers penalise sites that
 * do, and a resident who dismisses it once may never be asked again.
 */
export default function PushRegistrar() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<PushState>('default');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    setState(Notification.permission as PushState);
  }, []);

  const enable = useCallback(async () => {
    setState('working');
    try {
      const keyRes = await fetch('/api/push/subscribe');
      if (!keyRes.ok) {
        setState('unconfigured');
        return;
      }
      const { publicKey } = await keyRes.json();

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToBuffer(publicKey),
        }));

      const json = subscription.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setState('granted');
    } catch (err) {
      console.error('[push] enable failed', err);
      setState('default');
    }
  }, []);

  // Re-register on load if already granted, so a reinstalled browser
  // subscription gets stored again.
  useEffect(() => {
    if (isAuthenticated && state === 'granted') void enable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (state === 'granted' || state === 'unsupported') return null;

  if (state === 'denied') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        <BellOff className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Gate alerts are blocked in your browser settings. Until you allow notifications, you will
          only see visitors while this app is open on screen.
        </p>
      </div>
    );
  }

  if (state === 'unconfigured') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white/70">
        <BellOff className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Gate alerts are not set up on the server yet.</p>
      </div>
    );
  }

  return (
    <button
      onClick={enable}
      disabled={state === 'working'}
      className="flex w-full items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/15 p-4 text-left transition-colors hover:bg-amber-500/25 disabled:opacity-60"
    >
      <Bell className="h-6 w-6 shrink-0 text-amber-300" />
      <span>
        <span className="block font-semibold text-white">Turn on gate alerts</span>
        <span className="block text-sm text-white/60">
          Get notified when a visitor asks to enter your flat, even when the app is closed.
        </span>
      </span>
    </button>
  );
}
