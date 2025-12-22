'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Home, Phone, Edit2, Save, X, LogOut, UserMinus } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // TODO: Save to backend
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [profile, setProfile] = useState({
    name: user?.name || 'John Doe',
    flat: user?.flat || 'A201',
    phone: user?.phone || '+91 98765 43210',
    role: user?.role || 'Resident',
    avatar: '',
    tenantName: user?.tenantName || '',
    tenantPhone: user?.tenantPhone || '',
  });

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              My Profile
            </h1>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-1"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-heritage-gold to-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-black" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{profile.name}</h2>
                <p className="text-white/70 mb-4">{profile.role}</p>
                <span className="px-4 py-2 bg-heritage-gold/20 text-heritage-gold rounded-full text-sm">
                  {profile.flat}
                </span>
              </div>
            </motion.div>

            {/* Details Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-2"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                    >
                      <Edit2 className="w-5 h-5 text-white" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all"
                      >
                        <Save className="w-5 h-5 text-green-300" />
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all"
                      >
                        <X className="w-5 h-5 text-red-300" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 mb-2">Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                      />
                    ) : (
                      <p className="text-white text-lg">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 mb-2 flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Flat Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.flat}
                        onChange={(e) => setProfile({ ...profile, flat: e.target.value.toUpperCase() })}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                      />
                    ) : (
                      <p className="text-white text-lg">{profile.flat}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/70 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                      />
                    ) : (
                      <p className="text-white text-lg">{profile.phone}</p>
                    )}
                  </div>

                  {/* Tenant Info (if any) */}
                  {(user?.tenantName || isEditing) && (
                    <div className="pt-4 mt-2 border-t border-white/10 space-y-6">
                      <h3 className="text-heritage-gold font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
                        <UserMinus className="w-4 h-4" />
                        Tenant Details
                      </h3>
                      <div>
                        <label className="block text-white/70 mb-2">Tenant Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.tenantName || ''}
                            onChange={(e) => setProfile({ ...profile, tenantName: e.target.value })}
                            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                            placeholder="Optional"
                          />
                        ) : (
                          <p className="text-white text-lg">{profile.tenantName || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-white/70 mb-2">Tenant Phone</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={profile.tenantPhone || ''}
                            onChange={(e) => setProfile({ ...profile, tenantPhone: e.target.value })}
                            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                            placeholder="Optional"
                          />
                        ) : (
                          <p className="text-white text-lg">{profile.tenantPhone || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  )}


                  {/* Logout Button */}
                  <div className="pt-4 border-t border-white/10">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogout}
                      className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

