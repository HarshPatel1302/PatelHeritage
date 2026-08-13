'use client';

import { useCallback, useEffect, useState } from 'react';

interface PunchRow {
  id: string;
  personName: string | null;
  cardNumberMasked: string | null;
  result: string;
  punchedAt: string;
}

interface VisitorRow {
  id: string;
  flatId: string;
  status?: string;
  createdAt: string;
}

const TEST_CARDS = [
  { label: 'Active card (Ramesh — Newspaper)', card: '0000000001' },
  { label: 'Active card (Sunita — House Help)', card: '0000000002' },
  { label: 'Disabled card (Mahesh)', card: '0000000003' },
  { label: 'Expired card (Anil)', card: '0000000004' },
  { label: 'Unknown card', card: '9999999999' },
];

/** Dev-only. The page that renders this 404s unless DEMO_MODE is on. */
export default function ControlPanelClient() {
  const [log, setLog] = useState<string[]>([]);
  const [punches, setPunches] = useState<PunchRow[]>([]);
  const [pending, setPending] = useState<VisitorRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [flat, setFlat] = useState('A201');

  const say = (message: string) =>
    setLog((prev) => [`${new Date().toLocaleTimeString('en-IN', { hour12: false })}  ${message}`, ...prev].slice(0, 40));

  const refresh = useCallback(async () => {
    const [p, v] = await Promise.all([
      fetch('/api/punches?limit=10', { cache: 'no-store' }).catch(() => null),
      fetch('/api/visitor-requests/pending', { cache: 'no-store' }).catch(() => null),
    ]);
    if (p?.ok) setPunches((await p.json()).punches);
    if (v?.ok) setPending((await v.json()).requests);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  const call = async (url: string, body?: unknown, method = 'POST') => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      say(`${method} ${url} → ${res.status} ${text.slice(0, 160)}`);
      await refresh();
      return res.ok;
    } catch (err) {
      say(`${method} ${url} → network error ${String(err)}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const Button = ({ onClick, children, tone = 'default' }: {
    onClick: () => void;
    children: React.ReactNode;
    tone?: 'default' | 'good' | 'bad';
  }) => (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-50 ${
        tone === 'good'
          ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
          : tone === 'bad'
            ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
            : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 pt-24 text-white">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3">
          <p className="font-bold text-amber-200">Development control panel</p>
          <p className="text-sm text-amber-100/70">
            Only reachable while DEMO_MODE=true outside production. Card buttons post to the real{' '}
            <code className="font-mono">/iclock/cdata</code> endpoint, so they exercise the same
            parsing and classification path as the physical reader.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sessions */}
          <section className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-2 font-bold uppercase tracking-wide text-white/50">Sign in as</h2>
            <Button onClick={() => call('/api/dev/login-as', { username: 'SECURITY', pairKiosk: true })}>
              Security guard (+ pair kiosk)
            </Button>
            <Button onClick={() => call('/api/dev/login-as', { username: 'A201' })}>
              Resident A201
            </Button>
            <Button onClick={() => call('/api/dev/login-as', { username: 'C1402' })}>
              Resident C1402
            </Button>
            <Button onClick={() => call('/api/dev/login-as', { username: 'CHAIRMAN' })}>
              Chairman
            </Button>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {['/kiosk', '/gate', '/admin/cards', '/admin/devices', '/resident-home'].map((href) => (
                <a key={href} href={href} className="text-heritage-gold hover:underline">
                  {href}
                </a>
              ))}
            </div>
          </section>

          {/* Card taps */}
          <section className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-2 font-bold uppercase tracking-wide text-white/50">Simulate card tap</h2>
            {TEST_CARDS.map((c) => (
              <Button
                key={c.card}
                tone={c.label.startsWith('Active') ? 'good' : 'bad'}
                onClick={() => call('/api/dev/simulate', { action: 'punch', cardNumber: c.card })}
              >
                {c.label}
              </Button>
            ))}
            <Button onClick={() => call('/api/dev/simulate', { action: 'punch_duplicate' })}>
              Duplicate retry (should dedupe)
            </Button>
            <Button onClick={() => call('/api/dev/simulate', { action: 'punch_malformed' })}>
              Malformed record (should still be saved)
            </Button>
          </section>

          {/* Visitors */}
          <section className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-2 font-bold uppercase tracking-wide text-white/50">Visitor requests</h2>
            <input
              value={flat}
              onChange={(e) => setFlat(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-white/20 bg-white/10 p-2 font-mono"
            />
            <Button
              onClick={() =>
                call('/api/visitor-requests', { flatId: flat, purpose: 'GUEST', gate: 'FRONT' })
              }
            >
              Create request for {flat}
            </Button>
            {pending.map((r) => (
              <div key={r.id} className="rounded-lg bg-black/30 p-2">
                <p className="mb-2 text-sm text-white/70">
                  Flat {r.flatId} · pending
                </p>
                <div className="flex gap-2">
                  <Button
                    tone="good"
                    onClick={() =>
                      call(`/api/visitor-requests/${r.id}/decision`, { decision: 'APPROVE' })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    tone="bad"
                    onClick={() =>
                      call(`/api/visitor-requests/${r.id}/decision`, { decision: 'DENY' })
                    }
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
            <Button onClick={() => call('/api/dev/simulate', { action: 'expire_visitor' })}>
              Expire all pending
            </Button>
            <Button onClick={() => call('/api/dev/simulate', { action: 'cancel_all_pending' })}>
              Cancel all pending
            </Button>
          </section>
        </div>

        {/* Latest punches */}
        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 font-bold uppercase tracking-wide text-white/50">Latest punches</h2>
          <div className="divide-y divide-white/5">
            {punches.length === 0 ? (
              <p className="py-4 text-white/40">None yet.</p>
            ) : (
              punches.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
                  <span
                    className={`w-40 shrink-0 font-bold ${
                      p.result === 'AUTHORIZED' ? 'text-emerald-300' : 'text-red-300'
                    }`}
                  >
                    {p.result}
                  </span>
                  <span className="flex-1">{p.personName ?? '—'}</span>
                  <span className="font-mono text-white/50">{p.cardNumberMasked}</span>
                  <span className="font-mono text-white/40">
                    {new Date(p.punchedAt).toLocaleTimeString('en-IN', { hour12: false })}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Request log */}
        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 font-bold uppercase tracking-wide text-white/50">Response log</h2>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-white/60">
            {log.join('\n') || 'No calls yet.'}
          </pre>
        </section>
      </div>
    </div>
  );
}
