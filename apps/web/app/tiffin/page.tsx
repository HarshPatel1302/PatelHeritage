'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Coffee, Sun, Moon, Calendar, CheckCircle2, Clock } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { TiffinOrder } from '@/types';

export default function TiffinPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<TiffinOrder[]>([]);
  const [formData, setFormData] = useState({
    mealType: 'lunch' as 'breakfast' | 'lunch' | 'dinner',
    date: '',
    quantity: 1,
    specialInstructions: '',
  });



  // Load orders
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem('tiffinOrders');
    if (stored) {
      try {
        const allOrders = JSON.parse(stored);
        // Residents see only their orders
        if (user.role === 'resident') {
          setOrders(allOrders.filter((o: TiffinOrder) => o.flatNumber === user.flat));
        } else {
          // Cook and admin see all orders
          setOrders(allOrders);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const order: TiffinOrder = {
      id: Date.now().toString(),
      flatNumber: user.flat,
      mealType: formData.mealType,
      date: new Date(formData.date),
      quantity: formData.quantity,
      status: 'pending',
      orderedAt: new Date(),
      orderedBy: user.name,
      specialInstructions: formData.specialInstructions || undefined,
    };

    const stored = localStorage.getItem('tiffinOrders');
    const existing = stored ? JSON.parse(stored) : [];
    const updated = [order, ...existing];
    localStorage.setItem('tiffinOrders', JSON.stringify(updated));
    setOrders([order, ...orders]);

    setFormData({
      mealType: 'lunch',
      date: '',
      quantity: 1,
      specialInstructions: '',
    });

    alert('Order placed successfully!');
  };

  const mealIcons = {
    breakfast: Coffee,
    lunch: Sun,
    dinner: Moon,
  };

  const mealColors = {
    breakfast: 'from-orange-500 to-amber-500',
    lunch: 'from-yellow-500 to-orange-500',
    dinner: 'from-purple-500 to-indigo-500',
  };

  const statusColors = {
    pending: 'bg-yellow-500/30 text-yellow-200',
    confirmed: 'bg-blue-500/30 text-blue-200',
    prepared: 'bg-green-500/30 text-green-200',
    delivered: 'bg-green-600/30 text-green-300',
    cancelled: 'bg-red-500/30 text-red-200',
  };

  // Access check runs AFTER every hook above. Returning before them would
  // render a different number of hooks for a permitted and a blocked user,
  // which crashes React when the same component re-renders across roles.
  // Security cannot access tiffin service
  if (user?.role === 'security') {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <UtensilsCrossed className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70">Security cannot access tiffin service.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <UtensilsCrossed className="w-8 h-8 text-heritage-gold" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Tiffin Service
              </h1>
            </div>
            <p className="text-gray-300">
              Order breakfast, lunch, or dinner from the society kitchen
            </p>
          </motion.div>

          {user?.role === 'resident' && (
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Order Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Place Order</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white/80 mb-2">Meal Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => {
                        const Icon = mealIcons[meal];
                        return (
                          <button
                            key={meal}
                            type="button"
                            onClick={() => setFormData({ ...formData, mealType: meal })}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.mealType === meal
                                ? `border-heritage-gold bg-gradient-to-br ${mealColors[meal]}`
                                : 'border-white/20 bg-white/5 hover:border-white/40'
                            }`}
                          >
                            <Icon className="w-6 h-6 text-white mx-auto mb-2" />
                            <p className="text-white text-sm capitalize">{meal}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">Special Instructions (Optional)</label>
                    <textarea
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
                      rows={3}
                      placeholder="Any special dietary requirements or instructions..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Place Order
                  </button>
                </form>
              </motion.div>

              {/* My Orders */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-6">My Orders</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-white/70">
                      <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No orders yet</p>
                    </div>
                  ) : (
                    orders.map((order) => {
                      const Icon = mealIcons[order.mealType];
                      return (
                        <div
                          key={order.id}
                          className={`bg-gradient-to-br ${mealColors[order.mealType]} rounded-lg p-4 border border-white/20`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Icon className="w-6 h-6 text-white" />
                              <div>
                                <h3 className="text-white font-semibold capitalize">{order.mealType}</h3>
                                <p className="text-white/70 text-sm">
                                  {new Date(order.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded text-xs ${statusColors[order.status]}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-white/80 text-sm">
                            <p>Quantity: {order.quantity}</p>
                            {order.specialInstructions && (
                              <p className="mt-1 italic">Note: {order.specialInstructions}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Cook/Admin View - All Orders */}
          {(user?.role === 'cook' || user?.role === 'chairman' || user?.role === 'secretary') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-6">All Orders</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-white/70">
                    <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const Icon = mealIcons[order.mealType];
                    return (
                      <div
                        key={order.id}
                        className={`bg-gradient-to-br ${mealColors[order.mealType]} rounded-lg p-4 border border-white/20`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Icon className="w-6 h-6 text-white" />
                            <div>
                              <h3 className="text-white font-semibold capitalize">{order.mealType}</h3>
                              <p className="text-white/70 text-sm">
                                Flat: {order.flatNumber} • {new Date(order.date).toLocaleDateString()}
                              </p>
                              <p className="text-white/60 text-xs">Ordered by: {order.orderedBy}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-white/80 text-sm">
                          <p>Quantity: {order.quantity}</p>
                          {order.specialInstructions && (
                            <p className="mt-1 italic">Note: {order.specialInstructions}</p>
                          )}
                        </div>
                        {user?.role === 'cook' && order.status === 'pending' && (
                          <button
                            onClick={() => {
                              const stored = localStorage.getItem('tiffinOrders');
                              if (stored) {
                                const allOrders = JSON.parse(stored);
                                const updated = allOrders.map((o: TiffinOrder) =>
                                  o.id === order.id ? { ...o, status: 'confirmed' as const } : o
                                );
                                localStorage.setItem('tiffinOrders', JSON.stringify(updated));
                                setOrders(updated);
                              }
                            }}
                            className="mt-3 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg transition-all text-sm"
                          >
                            Confirm Order
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

