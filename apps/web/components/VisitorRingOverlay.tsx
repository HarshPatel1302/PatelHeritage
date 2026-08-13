'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ShieldAlert, User, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { primeAudio, useRingtone } from '@/lib/use-ringtone';

export interface PendingRequest {
  id: string;
  flatId: string;
  visitorName: string | null;
  purpose: string;
  gate: string;
  source: string;
  photoUrl: string | null;
  createdAt: string;
  expiresAt: string;
  escalatedToGuard: boolean;
}

const POLL_MS = 2000;

/**
 * Mounted app-wide for signed-in residents. Polls for a request against this
 * resident's flat and, when one appears, takes over the screen and rings.
 *
 * Polling (not SSE) because Vercel's function timeout kills long-lived streams.
 * Push notifications cover the case where the app is closed; this covers the
 * case where it is open, which is the only case where we can truly ring.
 */
export default function VisitorRingOverlay() {
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ringtone = useRingtone();
  const activeIdRef = useRef<string | null>(null);

  // Autoplay policy: the first touch anywhere unlocks audio for later rings.
  useEffect(() => {
    const unlock = () => primeAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch('/api/visitor-requests/pending', { cache: 'no-store' });
        if (!res.ok) return; // signed out or offline — stay quiet
        const data = await res.json();
        if (cancelled) return;

        const next: PendingRequest | undefined = data.requests[0];

        if (next) {
          setRequest(next);
          setSecondsLeft(
            Math.max(0, Math.round((new Date(next.expiresAt).getTime() - Date.now()) / 1000)),
          );
          if (activeIdRef.current !== next.id) {
            activeIdRef.current = next.id;
            ringtone.start();
          }
        } else {
          if (activeIdRef.current) ringtone.stop();
          activeIdRef.current = null;
          setRequest(null);
        }
      } catch {
        /* offline — keep trying */
      }
    };

    void poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      ringtone.stop();
    };
  }, [ringtone]);

  const decide = useCallback(
    async (decision: 'APPROVE' | 'REJECT') => {
      if (!request || submitting) return;
      setSubmitting(true);
      setError(null);
      ringtone.stop();

      try {
        const res = await fetch(`/api/visitor-requests/${request.id}/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Could not send your answer.');
          setSubmitting(false);
          return;
        }
        activeIdRef.current = null;
        setRequest(null);
      } catch {
        setError('No connection. Try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [request, submitting, ringtone],
  );

  if (!request) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col bg-slate-950/98 backdrop-blur-sm"
      >
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
          <motion.p
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="text-lg font-semibold uppercase tracking-[0.25em] text-amber-300"
          >
            Someone is at the gate
          </motion.p>
          <p className="mt-1 text-white/50">कोई गेट पर आया है</p>

          <div className="relative mt-8">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="absolute -inset-3 rounded-3xl bg-amber-400/20 blur-xl"
            />
            {request.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.photoUrl}
                alt="Visitor at the gate"
                className="relative h-72 w-72 rounded-3xl border-4 border-amber-400/60 object-cover shadow-2xl sm:h-80 sm:w-80"
              />
            ) : (
              <div className="relative flex h-72 w-72 flex-col items-center justify-center rounded-3xl border-4 border-amber-400/40 bg-white/5 sm:h-80 sm:w-80">
                <User className="h-24 w-24 text-white/30" />
                <p className="mt-3 px-6 text-sm text-amber-200/80">No photo captured</p>
              </div>
            )}
          </div>

          <h2 className="mt-8 text-4xl font-bold text-white">Visiting flat {request.flatId}</h2>
          <p className="mt-2 text-lg capitalize text-white/60">
            {request.purpose.toLowerCase().replace('_', ' ')} · {request.gate.toLowerCase()} gate
            {request.visitorName ? ` · ${request.visitorName}` : ''}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="text-5xl font-bold tabular-nums text-amber-300">{secondsLeft}s</div>
            <p className="max-w-[14rem] text-left text-sm text-white/40">
              left to answer. No answer means entry is refused.
            </p>
          </div>

          {request.escalatedToGuard && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/15 px-4 py-2 text-sm text-amber-200">
              <ShieldAlert className="h-4 w-4" />
              Security has also been notified
            </p>
          )}

          {error && <p className="mt-4 text-red-300">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 pb-10">
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={submitting}
            onClick={() => decide('REJECT')}
            className="flex min-h-[6rem] flex-col items-center justify-center gap-2 rounded-2xl bg-red-500/90 text-white shadow-lg shadow-red-900/40 disabled:opacity-50"
          >
            <X className="h-10 w-10" strokeWidth={3} />
            <span className="text-xl font-bold">Deny</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={submitting}
            onClick={() => decide('APPROVE')}
            className="flex min-h-[6rem] flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 text-white shadow-lg shadow-emerald-900/40 disabled:opacity-50"
          >
            <Check className="h-10 w-10" strokeWidth={3} />
            <span className="text-xl font-bold">Allow</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
