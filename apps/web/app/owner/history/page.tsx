'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Check, Package, ShieldAlert, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Visit {
  id: string;
  visitorName: string | null;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';
  photoUrl: string | null;
  createdAt: string;
  overriddenByGuard: boolean;
}

interface DayGroup {
  date: string;
  total: number;
  approved: number;
  denied: number;
  missed: number;
  visits: Visit[];
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Allowed', className: 'bg-emerald-500/20 text-emerald-300' },
  DENIED: { label: 'Denied', className: 'bg-red-500/20 text-red-300' },
  EXPIRED: { label: 'Missed', className: 'bg-amber-500/20 text-amber-300' },
  CANCELLED: { label: 'Cancelled', className: 'bg-white/10 text-white/50' },
  PENDING: { label: 'Waiting', className: 'bg-amber-500/25 text-amber-200' },
};

/** Human day label: Today, Yesterday, or a written date. */
function dayLabel(isoDate: string): string {
  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString('en-CA');
  if (isoDate === today) return 'Today';
  if (isoDate === yesterday) return 'Yesterday';
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Every visitor who has come to this flat, newest day first. */
export default function OwnerHistoryPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [totals, setTotals] = useState({ all: 0, approved: 0, denied: 0, missed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/owner/login');
  }, [isLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/history?days=30', { cache: 'no-store' });
      if (!res.ok) {
        setError('Could not load your visitor history.');
        return;
      }
      const data = await res.json();
      setGroups(data.groups);
      setTotals(data.totals);
      setError(null);
    } catch {
      setError('No connection to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 to-slate-900 pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-slate-950/90 px-5 py-4 backdrop-blur">
        <Link
          href="/owner"
          className="rounded-xl bg-white/10 p-2.5 text-white/70 active:bg-white/20"
          aria-label="Back to approvals"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Visitor History</h1>
          <p className="text-sm text-white/40">Flat {user?.flat} · last 30 days</p>
        </div>
      </header>

      {/* Totals */}
      <div className="grid grid-cols-4 gap-2 px-5 py-4">
        {[
          { label: 'Total', value: totals.all, colour: 'text-white' },
          { label: 'Allowed', value: totals.approved, colour: 'text-emerald-300' },
          { label: 'Denied', value: totals.denied, colour: 'text-red-300' },
          { label: 'Missed', value: totals.missed, colour: 'text-amber-300' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl bg-white/5 p-3 text-center"
          >
            <p className={`text-2xl font-bold tabular-nums ${stat.colour}`}>{stat.value}</p>
            <p className="text-xs text-white/40">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {error && (
        <p className="mx-5 rounded-xl bg-red-500/20 px-4 py-3 text-red-200">{error}</p>
      )}

      {loading ? (
        <p className="px-5 py-10 text-center text-white/40">Loading…</p>
      ) : groups.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <User className="mx-auto h-14 w-14 text-white/15" />
          <p className="mt-4 text-lg text-white/50">No visitors yet</p>
          <p className="mt-1 text-sm text-white/30">
            Anyone who comes to your flat will be listed here.
          </p>
        </div>
      ) : (
        <div className="space-y-6 px-5">
          {groups.map((group, groupIndex) => (
            <motion.section
              key={group.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(groupIndex * 0.05, 0.3) }}
            >
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-white/90">{dayLabel(group.date)}</h2>
                <span className="text-sm text-white/35">
                  {group.total} visitor{group.total === 1 ? '' : 's'}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl bg-white/5">
                {group.visits.map((visit, index) => {
                  const style = STATUS_STYLE[visit.status] ?? STATUS_STYLE.CANCELLED!;
                  return (
                    <div
                      key={visit.id}
                      className={`flex items-center gap-3 p-3 ${
                        index > 0 ? 'border-t border-white/5' : ''
                      }`}
                    >
                      {visit.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={visit.photoUrl}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-xl border border-white/15 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                          <User className="h-6 w-6 text-white/25" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {visit.visitorName?.trim() || 'Visitor'}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-white/45">
                          {visit.purpose === 'DELIVERY' ? (
                            <Package className="h-3.5 w-3.5" />
                          ) : (
                            <User className="h-3.5 w-3.5" />
                          )}
                          {visit.purpose === 'DELIVERY' ? 'Delivery' : 'Visitor'}
                          <span className="text-white/20">·</span>
                          {new Date(visit.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${style.className}`}
                        >
                          {visit.status === 'APPROVED' && <Check className="h-3 w-3" />}
                          {visit.status === 'DENIED' && <X className="h-3 w-3" />}
                          {visit.status === 'EXPIRED' && <ShieldAlert className="h-3 w-3" />}
                          {style.label}
                        </span>
                        {visit.overriddenByGuard && (
                          <span className="text-[10px] text-white/30">by security</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
