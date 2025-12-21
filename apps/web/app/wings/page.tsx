'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import WingVisualization from '@/components/WingVisualization';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Building2 } from 'lucide-react';

export default function WingsPage() {
  const { user } = useAuth();

  // Cook and Security cannot access wings
  if (user?.role === 'cook' || user?.role === 'security') {
    return (
      <ProtectedRoute requireAuth={false}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <Building2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70">Cook and Security cannot access wings directory.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Wing Directory
          </h1>
          <p className="text-center text-gray-300">
            Select a wing to view detailed floor and resident information
          </p>
        </motion.div>
        <WingVisualization />
      </div>
      </div>
    </ProtectedRoute>
  );
}

