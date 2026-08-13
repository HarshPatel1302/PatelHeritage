'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, CreditCard, DoorOpen, ShieldAlert, Users, WifiOff, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CardEventRow, LatestCardEvent, type CardEvent } from '@/components/guard/CardEventCard';
import type { PendingRequest } from '@/components/VisitorRingOverlay';
import { useAuth } from '@/contexts/AuthContext';

interface VisitorRow extends PendingRequest {
  status?: string;
}

const GUARD_ROLES = ['security', 'admin', 'chairman', 'secretary'];
/** Fast enough that a tap feels immediate, light enough for a gate tablet. */
const POLL_MS = 1500;

/**
 * The guard's console.
 *
 * Two things happen at this gate and the screen shows both without the guard
 * having to navigate: card taps from the RS9N, and visitors ringing a flat from
 * the kiosk. Type is large because it is read from a metre away, standing up,
 * while somebody waits.
 */
export default function GateConsolePage() {
  const { user } = useAuth();
  const [cardEvents, setCardEvents] = useState<CardEvent[]>([]);
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [recentDecisions, setRecentDecisions] = useState<VisitorRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const lastPunchIdRef = useRef<string | null>(null);
  const [flash, setFlash] = useState(false);

  const allowed = user ? GUARD_ROLES.includes(user.role) : false;

  const load = useCallback(async () => {
    try {
      const [punchRes, pendingRes, recentRes] = await Promise.all([
        fetch('/api/punches?limit=40', { cache: 'no-store' }),
        fetch('/api/visitor-requests/pending', { cache: 'no-store' }),
        fetch('/api/visitor-requests/recent?limit=12', { cache: 'no-store' }),
      ]);

      if (punchRes.ok) {
        const { punches } = await punchRes.json();
        setCardEvents(punches);
        // Flash the banner when a genuinely new tap arrives.
        const newest = punches[0]?.id ?? null;
        if (newest && lastPunchIdRef.current && newest !== lastPunchIdRef.current) {
          setFlash(true);
          setTimeout(() => setFlash(false), 900);
        }
        lastPunchIdRef.current = newest;
      }
      if (pendingRes.ok) setVisitors((await pendingRes.json()).requests);
      if (recentRes.ok) setRecentDecisions((await recentRes.json()).requests);

      setOnline(true);
      setRefreshedAt(new Date());
    } catch {
      // Tell the guard the screen is stale rather than showing old data silently.
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    void load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [allowed, load]);

  const decide = async (id: string, decision: 'APPROVE' | 'DENY') => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/visitor-requests/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note: 'Decided at gate by security' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Could not record that decision.');
      }
    } catch {
      alert('No connection. The decision was not recorded.');
    } finally {
      setBusyId(null);
      void load();
    }
  };

  if (!allowed) {
    return (
      <ProtectedRoute requireAuth>
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 pt-24">
          <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold text-white">Access Restricted</h2>
            <p className="text-white/70">The gate console is for security and committee only.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const latest = cardEvents[0];

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-slate-950 px-4 py-6 pt-24">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
              <DoorOpen className="h-8 w-8 text-heritage-gold" />
              Gate Console
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/cards"
                className="rounded-lg bg-white/10 px-4 py-2 text-white/80 hover:bg-white/20"
              >
                Manage cards
              </Link>
              {online ? (
                <span className="flex items-center gap-2 text-sm text-white/40">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Live{refreshedAt && ` · ${refreshedAt.toLocaleTimeString('en-IN', { hour12: false })}`}
                </span>
              ) : (
                <span className="flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-2 text-red-200">
                  <WifiOff className="h-4 w-4" />
                  No connection — this screen may be out of date
                </span>
              )}
            </div>
          </div>

          {/* Latest card tap — the thing the guard looks at most */}
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-white/50">
              <CreditCard className="h-5 w-5" />
              Last card tap
            </h2>
            {latest ? (
              <motion.div animate={flash ? { scale: [1, 1.015, 1] } : {}} transition={{ duration: 0.5 }}>
                <LatestCardEvent event={latest} />
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                No card taps yet. Once the RS9N is pointed at this server, taps appear here within
                a second or two.
              </div>
            )}
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Visitor requests */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-white/50">
                <Users className="h-5 w-5" />
                Visitors waiting
                {visitors.length > 0 && (
                  <span className="rounded-full bg-amber-500/30 px-3 py-0.5 text-amber-200">
                    {visitors.length}
                  </span>
                )}
              </h2>

              {visitors.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                  Nobody is waiting at the gate.
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {visitors.map((r) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border-2 border-amber-400/40 bg-amber-500/10 p-4"
                      >
                        <div className="flex gap-4">
                          {r.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.photoUrl}
                              alt="Visitor at the gate"
                              className="h-32 w-32 shrink-0 rounded-lg border border-white/20 object-cover"
                            />
                          ) : (
                            <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-amber-400/40 bg-amber-500/10 text-center">
                              <ShieldAlert className="h-8 w-8 text-amber-300" />
                              <span className="mt-1 px-1 text-xs text-amber-200">No photo</span>
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="text-3xl font-black text-white">Flat {r.flatId}</p>
                            <p className="text-lg capitalize text-white/70">
                              {r.purpose.toLowerCase().replace('_', ' ')}
                            </p>
                            <p className="mt-1 text-base text-white/50">
                              {new Date(r.createdAt).toLocaleTimeString('en-IN', { hour12: false })}
                            </p>
                            {r.escalatedToGuard && (
                              <p className="mt-2 inline-block rounded bg-amber-500/25 px-2 py-1 text-sm font-semibold text-amber-100">
                                Needs your decision
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <button
                            disabled={busyId === r.id}
                            onClick={() => decide(r.id, 'DENY')}
                            className="flex items-center justify-center gap-2 rounded-lg bg-red-500/80 py-4 text-xl font-bold text-white hover:bg-red-500 disabled:opacity-50"
                          >
                            <X className="h-6 w-6" strokeWidth={3} />
                            Deny
                          </button>
                          <button
                            disabled={busyId === r.id}
                            onClick={() => decide(r.id, 'APPROVE')}
                            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/80 py-4 text-xl font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            <Check className="h-6 w-6" strokeWidth={3} />
                            Allow
                          </button>
                        </div>
                        <p className="mt-2 text-center text-xs text-white/30">
                          Overriding is recorded against your name
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {recentDecisions.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-white/40">
                    Recently decided
                  </h3>
                  <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {recentDecisions.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : r.status === 'DENIED'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {r.status}
                        </span>
                        <span className="flex-1 text-white/80">Flat {r.flatId}</span>
                        <span className="font-mono text-sm text-white/40">
                          {new Date(r.createdAt).toLocaleTimeString('en-IN', { hour12: false })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Card entry history */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-white/50">
                <CreditCard className="h-5 w-5" />
                Card entry log
              </h2>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                {cardEvents.length === 0 ? (
                  <p className="p-8 text-center text-white/50">No card taps recorded yet.</p>
                ) : (
                  <div className="max-h-[38rem] divide-y divide-white/5 overflow-y-auto">
                    {cardEvents.map((event) => (
                      <CardEventRow key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
