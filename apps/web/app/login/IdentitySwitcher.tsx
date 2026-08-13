'use client';

import { motion } from 'framer-motion';
import { Building2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Identity {
  username: string;
  label: string;
  detail: string;
}

const LANDING: Record<string, string> = {
  SECURITY: '/gate',
  COOK: '/tiffin',
  CHAIRMAN: '/dashboard',
  SECRETARY: '/dashboard',
};

/**
 * Passwordless identity picker, shown instead of the login form while demo mode
 * is on. The app already signs itself in on first load — this is only here for
 * when you want to look at the system through somebody else's eyes, e.g. as a
 * resident receiving the visitor ring.
 */
export default function IdentitySwitcher({
  identities,
  current,
}: {
  identities: readonly Identity[];
  current: string;
}) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const become = async (identity: Identity) => {
    setBusy(identity.username);
    await fetch('/api/dev/login-as', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identity.username, pairKiosk: true }),
    }).catch(() => null);

    await refresh();
    router.push(LANDING[identity.username] ?? '/resident-home');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="rounded-xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex rounded-full bg-gradient-to-br from-heritage-gold to-yellow-500 p-4">
              <Building2 className="h-8 w-8 text-black" />
            </div>
            <h1 className="mb-2 text-4xl font-bold text-white">Patel Heritage</h1>
            <p className="text-gray-300">Choose who to view the system as</p>
            <p className="mt-1 text-sm text-white/40">No password needed</p>
          </div>

          <div className="space-y-2">
            {identities.map((identity) => {
              const isCurrent = identity.username === current;
              return (
                <button
                  key={identity.username}
                  onClick={() => become(identity)}
                  disabled={busy !== null}
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors disabled:opacity-50 ${
                    isCurrent
                      ? 'border-heritage-gold/60 bg-heritage-gold/15'
                      : 'border-white/15 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">
                      {identity.label}
                      {isCurrent && (
                        <span className="ml-2 text-xs font-normal text-heritage-gold">
                          currently signed in
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-white/50">{identity.detail}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-white/40" />
                </button>
              );
            })}
          </div>

          <p className="mt-6 rounded-lg bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100/80">
            Demo mode is on, so the app opens already signed in and this picker replaces the
            password screen. Turn it off by removing <code className="font-mono">DEMO_MODE</code>{' '}
            from <code className="font-mono">.env</code> — the normal login returns, and the server
            refuses to start if demo mode is ever left on in production.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
