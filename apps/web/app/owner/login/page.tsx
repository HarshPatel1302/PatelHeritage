'use client';

import { motion } from 'framer-motion';
import { Building2, KeyRound, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Owner sign-in.
 *
 * Credentials follow the society's rule: the flat number is the username, and
 * the same number without the wing letter is the password (A302 / 302).
 */
export default function OwnerLoginPage() {
  const [flat, setFlat] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    const ok = await login(flat.trim().toUpperCase(), password.trim());
    setBusy(false);

    if (!ok) {
      setError('Incorrect flat number or password');
      return;
    }
    router.push('/owner');
    router.refresh();
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 18 }}
            className="mb-5 inline-flex rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 p-5 shadow-2xl shadow-amber-500/30"
          >
            <Building2 className="h-10 w-10 text-black" />
          </motion.div>
          <h1 className="text-3xl font-bold">Patel Heritage</h1>
          <p className="mt-1 text-lg text-amber-300/90">Visitor Approvals</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/60">Flat number</label>
            <input
              required
              autoFocus
              autoCapitalize="characters"
              autoComplete="username"
              value={flat}
              onChange={(e) => setFlat(e.target.value.toUpperCase())}
              placeholder="A302"
              className="w-full rounded-2xl border-2 border-white/15 bg-white/10 p-4 text-center text-2xl font-bold tracking-widest outline-none transition-colors focus:border-amber-400"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
              <KeyRound className="h-4 w-4" />
              Password
            </label>
            <input
              required
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="302"
              className="w-full rounded-2xl border-2 border-white/15 bg-white/10 p-4 text-center text-2xl font-bold tracking-widest outline-none transition-colors focus:border-amber-400"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-500/20 px-4 py-3 text-center text-red-200"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-lg font-bold text-black shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <LogIn className="h-5 w-5" />
            {busy ? 'Signing in…' : 'Sign in'}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm leading-relaxed text-white/35">
          Your password is your flat number without the wing letter.
          <br />
          Flat <span className="font-semibold text-white/55">A302</span> → password{' '}
          <span className="font-semibold text-white/55">302</span>
        </p>
      </motion.div>
    </div>
  );
}
