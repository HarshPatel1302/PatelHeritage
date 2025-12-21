'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Package, Car, Bike, CheckCircle2, XCircle, Clock, Shield } from 'lucide-react';
import { Visitor } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { canManageVisitors } from '@/lib/auth';

export default function EntryPage() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: 'visit' as Visitor['purpose'],
    visitingFlat: '',
    entryGate: 'front' as 'front' | 'back',
    vehicleType: 'none' as 'two-wheeler' | 'four-wheeler' | 'none',
    vehicleNumber: '',
  });
  
  // Visitors are private - only security can access
  if (!user || user.role !== 'security') {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70 mb-4">Visitor management is private. Only security guards can access this section.</p>
            <p className="text-white/50 text-sm">Residents can pre-approve visitors from the "Pre-approve Visitor" page.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const visitor: Visitor = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
      entryTime: new Date(),
    };

    setVisitors([visitor, ...visitors]);
    setFormData({
      name: '',
      phone: '',
      purpose: 'visit',
      visitingFlat: '',
      entryGate: 'front',
      vehicleType: 'none',
      vehicleNumber: '',
    });
  };

  const handleApprove = (id: string) => {
    setVisitors(visitors.map(v => 
      v.id === id ? { ...v, status: 'approved' as const, approvedBy: 'Security' } : v
    ));
  };

  const handleReject = (id: string) => {
    setVisitors(visitors.map(v => 
      v.id === id ? { ...v, status: 'rejected' as const } : v
    ));
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Entry Management
          </h1>
          <p className="text-center text-gray-300">
            Register visitors, deliveries, and manage entry permissions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Register Entry</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2">Purpose</label>
                <select
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value as Visitor['purpose'] })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                >
                  <option value="visit">Visit</option>
                  <option value="delivery">Delivery/Parcel</option>
                  <option value="service">Service</option>
                </select>
              </div>

              <div>
                <label className="block text-white/80 mb-2">Visiting Flat</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., A201"
                  value={formData.visitingFlat}
                  onChange={(e) => setFormData({ ...formData, visitingFlat: e.target.value.toUpperCase() })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2">Entry Gate</label>
                <select
                  required
                  value={formData.entryGate}
                  onChange={(e) => {
                    const gate = e.target.value as 'front' | 'back';
                    setFormData({ 
                      ...formData, 
                      entryGate: gate,
                      vehicleType: gate === 'front' ? 'none' : formData.vehicleType
                    });
                  }}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                >
                  <option value="front">Front Gate (Walk-in only)</option>
                  <option value="back">Back Gate (Vehicles allowed)</option>
                </select>
              </div>

              {formData.entryGate === 'back' && (
                <div>
                  <label className="block text-white/80 mb-2">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  >
                    <option value="none">No Vehicle</option>
                    <option value="two-wheeler">Two Wheeler</option>
                    <option value="four-wheeler">Four Wheeler</option>
                  </select>
                </div>
              )}

              {formData.vehicleType !== 'none' && (
                <div>
                  <label className="block text-white/80 mb-2">Vehicle Number</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Register Entry
              </button>
            </form>
          </motion.div>

          {/* Visitors List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Pending Entries</h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {visitors.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No entries registered yet</p>
                </div>
              ) : (
                visitors.map((visitor) => (
                  <motion.div
                    key={visitor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{visitor.name}</h3>
                        <p className="text-white/70 text-sm">{visitor.phone}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        visitor.status === 'approved' ? 'bg-green-500/30 text-green-200' :
                        visitor.status === 'rejected' ? 'bg-red-500/30 text-red-200' :
                        'bg-yellow-500/30 text-yellow-200'
                      }`}>
                        {visitor.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-white/80 mb-3">
                      <div className="flex items-center gap-2">
                        {visitor.purpose === 'delivery' ? <Package className="w-4 h-4" /> :
                         visitor.purpose === 'service' ? <User className="w-4 h-4" /> :
                         <User className="w-4 h-4" />}
                        <span className="capitalize">{visitor.purpose}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Visiting: {visitor.visitingFlat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {visitor.entryGate === 'front' ? '🚶' : '🚗'}
                        <span className="capitalize">{visitor.entryGate} Gate</span>
                      </div>
                      {visitor.vehicleType !== 'none' && (
                        <div className="flex items-center gap-2">
                          {visitor.vehicleType === 'two-wheeler' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                          <span>{visitor.vehicleNumber}</span>
                        </div>
                      )}
                      {visitor.entryTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{visitor.entryTime.toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>

                    {visitor.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(visitor.id)}
                          className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(visitor.id)}
                          className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}

