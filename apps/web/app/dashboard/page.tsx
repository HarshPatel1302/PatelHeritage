'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Building2, MessageSquare, Shield, ShoppingBag, Users, Calendar,
  TrendingUp, Activity, AlertCircle, BarChart3, DollarSign, FileText, Lock,
  Check, X, UserMinus, UserCheck
} from 'lucide-react';
import { WING_CONFIGS } from '@/lib/constants';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, isCommitteeMember, canViewAnalytics, getUsers } from '@/lib/auth';
import { Visitor, User } from '@/types';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pendingVisitors, setPendingVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState([
    { label: 'Total Flats', value: '0', icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Residents', value: '0', icon: Users, color: 'from-green-500 to-emerald-500' },
    { label: 'Tenants', value: '0', icon: UserMinus, color: 'from-heritage-gold to-yellow-600' },
    { label: 'Pending Messages', value: '0', icon: MessageSquare, color: 'from-purple-500 to-pink-500' },
    { label: 'Today\'s Visitors', value: '0', icon: Shield, color: 'from-orange-500 to-red-500' },
  ]);

  useEffect(() => {
    const allUsers = getUsers();

    // Total flats count in the society
    const totalFlats = 236;

    // Filter to only resident units (excluding system accounts like security, admin, cook)
    const residentUsers = allUsers.filter((u: User) =>
      u.role === 'resident' &&
      !['Security', 'Kitchen'].includes(u.flat)
    );

    // Total units occupied (Owners + Tenants)
    const totalResidents = residentUsers.length;

    // Separate count for Tenants
    const tenantsCount = residentUsers.filter((u: User) => u.tenantName && u.tenantName.trim() !== "").length;

    // Separate count for Owners (occupied by owner, not tenant)
    const ownersCount = totalResidents - tenantsCount;

    // Get pending messages count
    const storedMessages = localStorage.getItem('messages');
    const messagesCount = storedMessages ? JSON.parse(storedMessages).filter((m: any) => m.status === 'pending').length : 12;

    // Get today's visitors count
    const storedVisitors = localStorage.getItem('visitors');
    const today = new Date().toISOString().split('T')[0];
    const visitorsCount = storedVisitors ? JSON.parse(storedVisitors).filter((v: any) => {
      if (!v.entryTime) return false;
      return v.entryTime.startsWith(today);
    }).length : 8;

    setStats([
      { label: 'Total Residents', value: totalResidents.toString(), icon: Users, color: 'from-blue-500 to-cyan-500' },
      { label: 'Owners', value: ownersCount.toString(), icon: UserCheck, color: 'from-green-500 to-emerald-500' },
      { label: 'Tenants', value: tenantsCount.toString(), icon: UserMinus, color: 'from-heritage-gold to-yellow-600' },
      { label: 'Pending Messages', value: messagesCount.toString(), icon: MessageSquare, color: 'from-purple-500 to-pink-500' },
      { label: 'Today\'s Visitors', value: visitorsCount.toString(), icon: Shield, color: 'from-orange-500 to-red-500' },
    ]);
  }, []);

  useEffect(() => {
    if (user?.flat) {
      const loadPendingVisitors = () => {
        const stored = localStorage.getItem('visitors');
        if (stored) {
          const allVisitors = JSON.parse(stored);
          const pending = allVisitors.filter((v: Visitor) =>
            v.visitingFlat.toUpperCase() === user.flat.toUpperCase() && v.status === 'pending'
          );
          setPendingVisitors(pending);
        }
      };

      loadPendingVisitors();
      // Poll for updates every 5 seconds
      const interval = setInterval(loadPendingVisitors, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleVisitorAction = (visitorId: string, status: 'approved' | 'rejected') => {
    const stored = localStorage.getItem('visitors');
    if (stored) {
      const allVisitors = JSON.parse(stored);
      const updatedVisitors = allVisitors.map((v: Visitor) => {
        if (v.id === visitorId) {
          return { ...v, status, approvedBy: user?.name || 'Resident' };
        }
        return v;
      });
      localStorage.setItem('visitors', JSON.stringify(updatedVisitors));

      // Update local state
      setPendingVisitors(prev => prev.filter(v => v.id !== visitorId));

      // Optional: Add notification logic here if needed
      alert(`Visitor ${status}`);
    }
  };

  // Cook and Security cannot access dashboard
  if (user?.role === 'cook' || user?.role === 'security') {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <Building2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70">Cook and Security cannot access dashboard.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }


  const quickActions = [
    { title: 'View Wings', icon: Building2, route: '/wings', color: 'from-blue-500 to-cyan-500' },
    { title: 'Common Messages', icon: MessageSquare, route: '/messages/common', color: 'from-purple-500 to-pink-500' },
    { title: 'Complaints', icon: MessageSquare, route: '/messages', color: 'from-red-500 to-pink-500' },
    { title: 'Pre-approve Visitor', icon: Shield, route: '/pre-approve', color: 'from-green-500 to-emerald-500', showFor: ['resident'] },
    { title: 'Security', icon: Shield, route: '/security', color: 'from-green-500 to-emerald-500', showFor: ['security'] },
    { title: 'Tiffin Service', icon: Users, route: '/tiffin', color: 'from-orange-500 to-amber-500' },
    { title: 'Shops', icon: ShoppingBag, route: '/shops', color: 'from-orange-500 to-red-500' },
    { title: 'Amenities', icon: Users, route: '/amenities', color: 'from-indigo-500 to-purple-500' },
    { title: 'Announcements', icon: Calendar, route: '/announcements', color: 'from-yellow-500 to-amber-500' },
    { title: 'Password Management', icon: Lock, route: '/admin/passwords', color: 'from-red-500 to-pink-500', showFor: ['chairman', 'secretary'] },
  ].filter(action => {
    if (!action.showFor) return true;
    return user && action.showFor.includes(user.role);
  });

  const isUserAdmin = isAdmin(user);
  const isUserCommittee = isCommitteeMember(user);
  const canViewStats = canViewAnalytics(user);

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-300">
                  Welcome back, {user?.name} • {user?.flat}
                </p>
              </div>
              {isUserAdmin && (
                <div className="px-4 py-2 bg-gradient-to-r from-heritage-gold to-yellow-500 rounded-lg">
                  <span className="text-black font-semibold">Admin Panel</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Pending Visitor Requests */}
        {pendingVisitors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-red-500 animate-pulse" />
                <h2 className="text-2xl font-bold text-white">Pending Visitor Approval</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingVisitors.map((visitor) => (
                  <div key={visitor.id} className="bg-white/10 rounded-lg p-4 border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {visitor.photo && (
                          <div className="mb-2">
                            <img src={visitor.photo} alt={visitor.name} className="w-16 h-16 rounded-full object-cover border-2 border-heritage-gold/50" />
                          </div>
                        )}
                        <h3 className="font-bold text-white text-lg">{visitor.name}</h3>
                        <p className="text-white/70 text-sm">{visitor.phone}</p>
                        <p className="text-heritage-gold text-sm mt-1">{visitor.purpose}</p>
                      </div>
                      <div className="text-right text-xs text-white/50">
                        {new Date(visitor.entryTime || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVisitorAction(visitor.id, 'approved')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleVisitorAction(visitor.id, 'rejected')}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 border border-white/20 shadow-xl`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-8 h-8 text-white/80" />
                  <TrendingUp className="w-5 h-5 text-white/60" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-white/80 text-sm">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(action.route)}
                  className={`bg-gradient-to-br ${action.color} rounded-xl p-6 border border-white/20 cursor-pointer shadow-lg hover:shadow-xl transition-all`}
                >
                  <Icon className="w-8 h-8 text-white mb-3" />
                  <h3 className="text-xl font-semibold text-white">{action.title}</h3>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Admin-Only Analytics */}
        {canViewStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Analytics & Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <BarChart3 className="w-8 h-8 text-heritage-gold mb-3" />
                <h3 className="text-white font-semibold mb-2">Monthly Reports</h3>
                <p className="text-white/70 text-sm">View detailed analytics and insights</p>
                <button className="mt-4 px-4 py-2 bg-heritage-gold/20 hover:bg-heritage-gold/30 text-heritage-gold rounded-lg transition-all text-sm">
                  View Reports
                </button>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <DollarSign className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Financial Overview</h3>
                <p className="text-white/70 text-sm">Track expenses and revenue</p>
                <button className="mt-4 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all text-sm">
                  View Finance
                </button>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <FileText className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Document Management</h3>
                <p className="text-white/70 text-sm">Manage society documents</p>
                <button className="mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all text-sm">
                  View Documents
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <AlertCircle className="w-5 h-5 text-heritage-gold" />
                <div className="flex-1">
                  <p className="text-white text-sm">New visitor registered at Front Gate</p>
                  <p className="text-white/60 text-xs">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}

