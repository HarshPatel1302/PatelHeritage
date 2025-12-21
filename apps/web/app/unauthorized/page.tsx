'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ShieldX, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 max-w-md w-full text-center"
      >
        <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/70 mb-6">
          You don't have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
        >
          <Home className="w-5 h-5" />
          Go to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

