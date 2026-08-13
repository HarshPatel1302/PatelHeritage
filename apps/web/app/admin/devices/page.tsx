'use client';

import { Cpu, Radio, RefreshCw, ShieldAlert, Terminal } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface DeviceRow {
  id: string;
  serialNumber: string;
  name: string;
  gate: string;
  direction: string;
  isActive: boolean;
  lastSeenAt: string | null;
  lastHandshakeAt: string | null;
  lastPunchAt: string | null;
  lastSourceIp: string | null;
  lastUserAgent: string | null;
}

interface RawRecord {
  id: string;
  deviceSerial: string;
  tableName: string | null;
  rawLine: string;
  rawBody: string;
  queryString: string | null;
  sourceIp: string | null;
  receivedAt: string;
  parseStatus: 'PARSED' | 'FAILED' | 'IGNORED';
  parseError: string | null;
  parsedCardNumber: string | null;
  parsedPunchedAt: string | null;
  punchResult: string | null;
}

const ADMIN_ROLES = ['security', 'admin', 'chairman', 'secretary'];

function relative(iso: string | null): string {
  if (!iso) return 'never';
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN');
}

/**
 * RS9N diagnostics.
 *
 * The point of this page: the physical unit's exact ATTLOG field order is not
 * confirmed. Rather than guessing, every record the device sends is stored raw
 * and shown here, so connecting the real machine is "tap a card, read this
 * page, adjust one parser if needed" instead of a redesign.
 */
export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [records, setRecords] = useState<RawRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [unparsedOnly, setUnparsedOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const allowed = user ? ADMIN_ROLES.includes(user.role) : false;

  const load = useCallback(async () => {
    const res = await fetch(`/api/devices?rawLimit=40${unparsedOnly ? '&unparsed=1' : ''}`, {
      cache: 'no-store',
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setDevices(data.devices);
      setRecords(data.rawRecords);
      setCounts(data.parseCounts ?? {});
    }
    setLoading(false);
  }, [unparsedOnly]);

  useEffect(() => {
    if (!allowed) return;
    void load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [allowed, load]);

  if (!allowed) {
    return (
      <ProtectedRoute requireAuth>
        <div className="flex min-h-screen items-center justify-center bg-slate-950 pt-24">
          <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-slate-950 px-4 py-8 pt-24">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
              <Cpu className="h-8 w-8 text-heritage-gold" />
              Card Reader Diagnostics
            </h1>
            <button
              onClick={load}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white/80 hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Devices */}
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/40">
              Registered readers
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {devices.map((d) => {
                const seenRecently =
                  d.lastSeenAt && Date.now() - new Date(d.lastSeenAt).getTime() < 5 * 60_000;
                return (
                  <div
                    key={d.id}
                    className={`rounded-xl border p-5 ${
                      seenRecently
                        ? 'border-emerald-400/40 bg-emerald-500/10'
                        : 'border-white/15 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-bold text-white">{d.name}</p>
                        <p className="font-mono text-sm text-white/50">{d.serialNumber}</p>
                      </div>
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          seenRecently
                            ? 'bg-emerald-500/25 text-emerald-200'
                            : 'bg-white/10 text-white/50'
                        }`}
                      >
                        <Radio className="h-3 w-3" />
                        {seenRecently ? 'ONLINE' : 'NOT SEEN'}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <dt className="text-white/40">Gate</dt>
                      <dd className="text-white/80">
                        {d.gate} · {d.direction}
                      </dd>
                      <dt className="text-white/40">Last contact</dt>
                      <dd className="text-white/80">{relative(d.lastSeenAt)}</dd>
                      <dt className="text-white/40">Last handshake</dt>
                      <dd className="text-white/80">{relative(d.lastHandshakeAt)}</dd>
                      <dt className="text-white/40">Last punch</dt>
                      <dd className="text-white/80">{relative(d.lastPunchAt)}</dd>
                      <dt className="text-white/40">Source IP</dt>
                      <dd className="font-mono text-white/80">{d.lastSourceIp ?? '—'}</dd>
                    </dl>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Raw records */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white/40">
                <Terminal className="h-4 w-4" />
                Raw device records
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-300">{counts.PARSED ?? 0} parsed</span>
                <span className="text-red-300">{counts.FAILED ?? 0} failed</span>
                <span className="text-white/40">{counts.IGNORED ?? 0} ignored</span>
                <label className="flex cursor-pointer items-center gap-2 text-white/70">
                  <input
                    type="checkbox"
                    checked={unparsedOnly}
                    onChange={(e) => setUnparsedOnly(e.target.checked)}
                  />
                  Unparsed only
                </label>
              </div>
            </div>

            <p className="mb-3 rounded-lg bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
              Every record the reader sends is stored here before we try to interpret it. When the
              real RS9N is connected, tap a card and compare the raw line below against what the
              parser extracted — if the field order differs, only{' '}
              <code className="font-mono">lib/adms.ts</code> needs changing.
            </p>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {loading ? (
                <p className="p-10 text-center text-white/50">Loading…</p>
              ) : records.length === 0 ? (
                <p className="p-10 text-center text-white/50">
                  No device records yet. Run{' '}
                  <code className="font-mono text-white/70">npm run simulate:rs9n</code> or tap a
                  card on the reader.
                </p>
              ) : (
                <div className="divide-y divide-white/5">
                  {records.map((r) => (
                    <div key={r.id} className="p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            r.parseStatus === 'PARSED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : r.parseStatus === 'FAILED'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {r.parseStatus}
                        </span>
                        {r.punchResult && (
                          <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">
                            {r.punchResult}
                          </span>
                        )}
                        <span className="font-mono text-xs text-white/40">{r.deviceSerial}</span>
                        <span className="text-xs text-white/40">
                          {new Date(r.receivedAt).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                          className="ml-auto text-xs text-heritage-gold hover:underline"
                        >
                          {expanded === r.id ? 'Hide' : 'Show'} full body
                        </button>
                      </div>

                      <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-3 font-mono text-sm text-emerald-200">
                        {r.rawLine}
                      </pre>

                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                        <span className="text-white/40">
                          card:{' '}
                          <span className="font-mono text-white/80">
                            {r.parsedCardNumber ?? '— not extracted —'}
                          </span>
                        </span>
                        <span className="text-white/40">
                          time:{' '}
                          <span className="font-mono text-white/80">
                            {r.parsedPunchedAt
                              ? new Date(r.parsedPunchedAt).toLocaleString('en-IN')
                              : '— not extracted —'}
                          </span>
                        </span>
                        {r.parseError && <span className="text-red-300">{r.parseError}</span>}
                      </div>

                      {expanded === r.id && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-white/40">Query string</p>
                          <pre className="overflow-x-auto rounded bg-black/40 p-3 font-mono text-xs text-white/70">
                            {r.queryString ?? '—'}
                          </pre>
                          <p className="text-xs text-white/40">Complete request body</p>
                          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-black/40 p-3 font-mono text-xs text-white/70">
                            {r.rawBody}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
