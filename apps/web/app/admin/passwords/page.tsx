'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Search, Edit2, Save, X } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/auth';

export default function PasswordManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!isAdmin(user)) return;
    let cancelled = false;

    (async () => {
      const res = await fetch('/api/residents', { cache: 'no-store' }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const data = await res.json();
      // Map the API shape onto what this page already renders.
      setUsers(
        data.residents.map((r: any) => ({
          id: r.id,
          name: r.name ?? r.flatId,
          flat: r.flatId,
          role: String(r.role).toLowerCase(),
          tenantName: r.tenantName,
        })),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isAdmin(user)) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70">Only Chairman and Secretary can manage passwords.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const handleChangePassword = async (flatId: string) => {
    if (!user || newPassword.trim().length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const res = await fetch('/api/admin/residents/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flatId, newPassword }),
    }).catch(() => null);

    if (!res?.ok) {
      const message = res ? ((await res.json().catch(() => ({}))).error ?? '') : 'No connection.';
      alert(`Failed to change password. ${message}`.trim());
      return;
    }

    setEditingUser(null);
    setNewPassword('');
    alert(`Password reset for ${flatId}. The resident must choose a new one at next sign-in.`);
  };

  const filteredUsers = users.filter(u =>
    u.flat.toUpperCase().includes(searchQuery.toUpperCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute requireAuth={true} requiredRole={['chairman', 'secretary']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-heritage-gold" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Password Management
              </h1>
            </div>
            <p className="text-gray-300">
              Manage passwords for all society members. Only Chairman and Secretary can change passwords.
            </p>
          </motion.div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by flat number or name..."
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">All Users</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <p>No users found</p>
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{u.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-white/70 text-sm">
                          <span>Flat: {u.flat}</span>
                          <span>Role: {u.role}</span>
                          {u.tenantName && <span className="text-heritage-gold/80 italic">Tenant: {u.tenantName}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingUser === u.id ? (
                          <>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="New password"
                              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
                            />
                            <button
                              onClick={() => handleChangePassword(u.flat)}
                              className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all"
                            >
                              <Save className="w-5 h-5 text-green-300" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(null);
                                setNewPassword('');
                              }}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all"
                            >
                              <X className="w-5 h-5 text-red-300" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingUser(u.id)}
                            className="px-4 py-2 bg-heritage-gold/20 hover:bg-heritage-gold/30 text-heritage-gold rounded-lg transition-all flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Change Password
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

