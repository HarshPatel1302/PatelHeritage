'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Check,
  AlarmClock,
  History,
  LogOut,
  Package,
  ShieldCheck,
  User,
  WifiOff,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { primeAudio, useRingtone } from '@/lib/use-ringtone';

interface PendingRequest {
  id: string;
  flatId: string;
  visitorName: string | null;
  purpose: string;
  photoUrl: string | null;
  createdAt: string;
  expiresAt: string;
  escalatedToGuard: boolean;
}

const POLL_MS = 1500;

/**
 * The owner app's only job: answer the door.
 *
 * When nobody is waiting it stays deliberately quiet — a resident opening this
 * should see at a glance that there is nothing to do. When someone is at the
 * gate the whole screen becomes the request: photo, name, purpose, and two
 * targets big enough to hit without looking.
 */
export default function OwnerApprovalsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, demoMode } = useAuth();

  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [justAnswered, setJustAnswered] = useState<'APPROVED' | 'DENIED' | null>(null);

  const ringtone = useRingtone();
  const ringingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/owner/login');
  }, [isLoading, isAuthenticated, router]);

  // Browsers block audio until the page has been interacted with once; prime it
  // on the first touch so the doorbell is allowed to play later.
  useEffect(() => {
    const unlock = () => primeAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/visitor-requests/pending', { cache: 'no-store' });
      if (!res.ok) return;
      const { requests } = await res.json();
      setOnline(true);

      const next: PendingRequest | undefined = requests[0];
      setPending(requests);

      if (next) {
        setSecondsLeft(
          Math.max(0, Math.round((new Date(next.expiresAt).getTime() - Date.now()) / 1000)),
        );
        if (ringingIdRef.current !== next.id) {
          ringingIdRef.current = next.id;
          ringtone.start();
        }
      } else {
        if (ringingIdRef.current) ringtone.stop();
        ringingIdRef.current = null;
      }
    } catch {
      setOnline(false);
    }
  }, [ringtone]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      clearInterval(interval);
      ringtone.stop();
    };
  }, [isAuthenticated, poll, ringtone]);

  const decide = async (id: string, decision: 'APPROVE' | 'DENY') => {
    if (busy) return;
    setBusy(true);
    setError(null);
    ringtone.stop();

    try {
      const res = await fetch(`/api/visitor-requests/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Could not send your answer.');
        return;
      }
      ringingIdRef.current = null;
      setJustAnswered(decision === 'APPROVE' ? 'APPROVED' : 'DENIED');
      setTimeout(() => setJustAnswered(null), 2200);
      setPending((list) => list.filter((r) => r.id !== id));
    } catch {
      setError('No connection. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-950">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="text-white/50"
        >
          Loading…
        </motion.div>
      </div>
    );
  }

  const current = pending[0];

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/35">Patel Heritage</p>
          <h1 className="text-2xl font-bold">Flat {user?.flat}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/owner/history"
            className="rounded-xl bg-white/10 p-3 text-white/70 active:bg-white/20"
            aria-label="Visitor history"
          >
            <History className="h-5 w-5" />
          </Link>
          <button
            onClick={async () => {
              if (!demoMode) await logout();
              router.push('/owner/login');
            }}
            className="rounded-xl bg-white/10 p-3 text-white/70 active:bg-white/20"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {!online && (
        <div className="flex items-center gap-2 bg-red-500/20 px-5 py-3 text-sm text-red-200">
          <WifiOff className="h-4 w-4 shrink-0" />
          No connection — you may not be told about new visitors right now.
        </div>
      )}

      <AnimatePresence mode="wait">
        {current ? (
          /* ------------------------------------------------ someone waiting */
          <motion.main
            key={current.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex flex-1 flex-col px-5 pb-6 pt-4"
          >
            <motion.div
              animate={{ opacity: [1, 0.45, 1] }}
              transition={{ duration: 1.3, repeat: Infinity }}
              className="mb-4 flex items-center justify-center gap-2 text-lg font-bold uppercase tracking-widest text-amber-300"
            >
              <Bell className="h-5 w-5" />
              Someone is at the gate
            </motion.div>

            {/* Photo */}
            <div className="relative mx-auto w-full max-w-sm">
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="absolute -inset-2 rounded-[2rem] bg-amber-400/25 blur-2xl"
              />
              {current.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.photoUrl}
                  alt="Visitor at the gate"
                  className="relative aspect-square w-full rounded-[1.75rem] border-4 border-amber-400/60 object-cover shadow-2xl"
                />
              ) : (
                <div className="relative flex aspect-square w-full flex-col items-center justify-center rounded-[1.75rem] border-4 border-amber-400/40 bg-white/5">
                  <User className="h-24 w-24 text-white/25" />
                  <p className="mt-2 px-6 text-center text-sm text-amber-200/80">
                    No photo could be taken
                  </p>
                </div>
              )}
            </div>

            {/* Who */}
            <div className="mt-5 text-center">
              <h2 className="text-3xl font-bold">
                {current.visitorName?.trim() || 'Visitor'}
              </h2>
              <p className="mt-1 flex items-center justify-center gap-2 text-lg text-white/60">
                {current.purpose === 'DELIVERY' ? (
                  <>
                    <Package className="h-5 w-5" /> Delivery
                  </>
                ) : (
                  <>
                    <User className="h-5 w-5" /> Visitor
                  </>
                )}
                <span className="text-white/25">·</span>
                {new Date(current.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Countdown */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <motion.span
                key={secondsLeft}
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                className={`text-4xl font-black tabular-nums ${
                  secondsLeft <= 10 ? 'text-red-400' : 'text-amber-300'
                }`}
              >
                {secondsLeft}s
              </motion.span>
              <p className="max-w-[12rem] text-left text-xs leading-snug text-white/40">
                left to answer. No answer means entry is refused.
              </p>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-500/20 px-4 py-2 text-center text-red-200">
                {error}
              </p>
            )}

            {/* Decision */}
            <div className="mt-auto grid grid-cols-2 gap-4 pt-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={busy}
                onClick={() => decide(current.id, 'DENY')}
                className="flex min-h-[7rem] flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-b from-red-500 to-red-600 shadow-lg shadow-red-900/40 disabled:opacity-50"
              >
                <X className="h-11 w-11" strokeWidth={3} />
                <span className="text-xl font-bold">Deny</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={busy}
                onClick={() => decide(current.id, 'APPROVE')}
                className="flex min-h-[7rem] flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-900/40 disabled:opacity-50"
              >
                <Check className="h-11 w-11" strokeWidth={3} />
                <span className="text-xl font-bold">Allow</span>
              </motion.button>
            </div>

            {pending.length > 1 && (
              <p className="mt-3 text-center text-sm text-white/40">
                {pending.length - 1} more waiting
              </p>
            )}
          </motion.main>
        ) : (
          /* --------------------------------------------------- nobody there */
          <motion.main
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center px-8 text-center"
          >
            <AnimatePresence>
              {justAnswered ? (
                <motion.div
                  key={justAnswered}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  className="flex flex-col items-center"
                >
                  {justAnswered === 'APPROVED' ? (
                    <>
                      <Check className="h-24 w-24 text-emerald-400" strokeWidth={2.5} />
                      <p className="mt-4 text-2xl font-bold text-emerald-300">Entry allowed</p>
                    </>
                  ) : (
                    <>
                      <X className="h-24 w-24 text-red-400" strokeWidth={2.5} />
                      <p className="mt-4 text-2xl font-bold text-red-300">Entry denied</p>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="quiet"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="rounded-full bg-white/5 p-8"
                  >
                    <ShieldCheck className="h-16 w-16 text-white/25" strokeWidth={1.5} />
                  </motion.div>
                  <h2 className="mt-6 text-2xl font-semibold text-white/80">
                    Nobody at your gate
                  </h2>
                  <p className="mt-2 max-w-xs text-white/40">
                    You will be alerted here the moment a visitor asks to come up.
                  </p>

                  <Link
                    href="/owner/history"
                    className="mt-8 flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 font-medium text-white/80 active:bg-white/20"
                  >
                    <History className="h-5 w-5" />
                    See visitor history
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        )}
      </AnimatePresence>

      <footer className="flex items-center justify-center gap-2 px-5 pb-5 text-xs text-white/25">
        <AlarmClock className="h-3.5 w-3.5" />
        Keep this app open to hear the doorbell
      </footer>
    </div>
  );
}
