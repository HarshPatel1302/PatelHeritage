'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Phone, CheckCircle2, Clock } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { PreApprovedVisitor } from '@/types';

export default function PreApprovePage() {
  const { user } = useAuth();
  const [preApproved, setPreApproved] = useState<PreApprovedVisitor[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    visitDate: '',
  });

  // Load pre-approved visitors
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem('preApprovedVisitors');
    if (stored) {
      try {
        const visitors = JSON.parse(stored);
        const myVisitors = visitors.filter((v: PreApprovedVisitor) => 
          v.preApprovedBy === user.flat
        );
        setPreApproved(myVisitors);
      } catch (error) {
        console.error('Error loading pre-approved visitors:', error);
      }
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const visitor: PreApprovedVisitor = {
      id: Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      visitingFlat: user.flat,
      visitDate: new Date(formData.visitDate),
      preApprovedBy: user.flat,
      status: 'pending',
      createdAt: new Date(),
    };

    setPreApproved([...preApproved, visitor]);
    setFormData({ name: '', phone: '', visitDate: '' });
    
    // Save to localStorage (in production, this would be an API call)
    const stored = localStorage.getItem('preApprovedVisitors');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem('preApprovedVisitors', JSON.stringify([...existing, visitor]));
    
    // Update local state
    setPreApproved([...preApproved, visitor]);
  };

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
              Pre-approve Visitor
            </h1>
            <p className="text-gray-300">
              Pre-approve your guests for a specific date. Security guards will see this when they arrive.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Add Pre-approved Visitor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Visitor Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
                  placeholder="Enter visitor name"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Visit Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                />
                <p className="text-white/50 text-xs mt-1">
                  Visitor can arrive at any time on this date
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Pre-approve Visitor
              </button>
            </form>
          </motion.div>

          {/* Pre-approved List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Your Pre-approved Visitors</h2>
            {preApproved.length === 0 ? (
              <div className="text-center py-12 text-white/70">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pre-approved visitors yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {preApproved.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-semibold mb-1">{visitor.name}</h3>
                        {visitor.phone && (
                          <p className="text-white/70 text-sm mb-2">{visitor.phone}</p>
                        )}
                        <div className="flex items-center gap-4 text-white/60 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(visitor.visitDate).toLocaleDateString()}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            visitor.status === 'used' ? 'bg-green-500/30 text-green-200' :
                            visitor.status === 'expired' ? 'bg-red-500/30 text-red-200' :
                            'bg-yellow-500/30 text-yellow-200'
                          }`}>
                            {visitor.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

