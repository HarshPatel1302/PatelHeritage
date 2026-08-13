'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

/**
 * Shown on a gate screen that has not been paired yet.
 *
 * Pairing is a one-time, in-person act by a committee member or the security
 * in-charge. It leaves an httpOnly cookie on this tablet — no credentials are
 * stored on the device, and the kiosk's own JavaScript cannot read the token.
 */
export default function PairScreen({ onPaired }: { onPaired: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gate, setGate] = useState<'FRONT' | 'BACK'>('FRONT');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch('/api/kiosk/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, gate }),
    }).catch(() => null);

    setBusy(false);
    if (!res?.ok) {
      setError(res ? ((await res.json().catch(() => ({}))).error ?? 'Pairing failed.') : 'No connection.');
      return;
    }
    setPassword('');
    onPaired();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6"
    >
      <ShieldCheck className="h-16 w-16 text-amber-300" />
      <h1 className="mt-6 text-4xl font-bold text-white">Set up this gate screen</h1>
      <p className="mt-2 max-w-lg text-center text-white/50">
        A committee member or the security in-charge should sign in once to register this device.
        Visitors never see this screen again.
      </p>

      <form onSubmit={submit} className="mt-10 w-full max-w-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {(['FRONT', 'BACK'] as const).map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setGate(g)}
              className={`rounded-xl border py-4 text-lg font-semibold transition-colors ${
                gate === g
                  ? 'border-amber-400 bg-amber-400/20 text-white'
                  : 'border-white/15 bg-white/5 text-white/60'
              }`}
            >
              {g === 'FRONT' ? 'Front Gate' : 'Back Gate'}
            </button>
          ))}
        </div>

        <input
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username (e.g. SECURITY)"
          className="w-full rounded-xl border border-white/20 bg-white/10 p-4 text-lg text-white placeholder-white/40 focus:border-amber-400 focus:outline-none"
        />
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-white/20 bg-white/10 p-4 text-lg text-white placeholder-white/40 focus:border-amber-400 focus:outline-none"
        />

        {error && <p className="text-center text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-xl font-bold text-black disabled:opacity-50"
        >
          {busy ? 'Registering…' : 'Register this screen'}
        </button>
      </form>
    </motion.div>
  );
}
