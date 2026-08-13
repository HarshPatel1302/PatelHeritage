'use client';

import { motion } from 'framer-motion';
import { Building2, Lock, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/** The real sign-in form. Used whenever demo mode is off — i.e. in production. */
export default function CredentialsForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, refresh } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(username, password);
    if (!success) {
      setError('Incorrect flat number or password');
      setIsLoading(false);
      return;
    }

    // Ask the server who we are. This used to read a localStorage key that
    // nothing writes any more, so every sign-in fell through to /dashboard.
    const res = await fetch('/api/auth/me', { cache: 'no-store' }).catch(() => null);
    const role = res?.ok ? String((await res.json()).user?.role ?? '').toLowerCase() : '';
    await refresh();

    router.push(
      role === 'security'
        ? '/gate'
        : role === 'cook'
          ? '/tiffin'
          : role === 'resident'
            ? '/resident-home'
            : '/dashboard',
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex rounded-full bg-gradient-to-br from-heritage-gold to-yellow-500 p-4">
              <Building2 className="h-8 w-8 text-black" />
            </div>
            <h1 className="mb-2 text-4xl font-bold text-white">Patel Heritage</h1>
            <p className="text-gray-300">Society Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-white/80">Flat Number</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder="Enter flat number (e.g., A201)"
                className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder-white/50 transition-all focus:border-heritage-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-white/80">
                <Lock className="h-4 w-4" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder-white/50 transition-all focus:border-heritage-gold focus:outline-none"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-200"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-heritage-gold to-yellow-500 py-3 font-semibold text-black transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn className="h-5 w-5" />
              {isLoading ? 'Logging in…' : 'Login'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
