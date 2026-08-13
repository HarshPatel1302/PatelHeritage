'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Plus, Search, Store, Phone, Mail, MapPin } from 'lucide-react';
import { SHOPS } from '@/lib/constants';
import { Shop } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { canManageShops, isAdmin } from '@/lib/auth';

export default function ShopsPage() {
  const { user } = useAuth();
  const canAddShops = canManageShops(user);


  const [shops, setShops] = useState<Shop[]>(SHOPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShop, setNewShop] = useState({
    name: '',
    category: '',
    description: '',
    phone: '',
    email: '',
    location: '',
  });

  const categories = ['all', ...Array.from(new Set(shops.map(s => s.category)))];

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shop.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || shop.category === selectedCategory;
    return matchesSearch && matchesCategory && shop.isActive;
  });

  const handleAddShop = (e: React.FormEvent) => {
    e.preventDefault();
    const shop: Shop = {
      id: Date.now().toString(),
      ...newShop,
      isActive: true,
    };
    setShops([...shops, shop]);
    setNewShop({ name: '', category: '', description: '', phone: '', email: '', location: '' });
    setShowAddForm(false);
  };

  // Access check runs AFTER every hook above. Returning before them would
  // render a different number of hooks for a permitted and a blocked user,
  // which crashes React when the same component re-renders across roles.
  // Cook and Security cannot access shops
  if (user?.role === 'cook' || user?.role === 'security') {
    return (
      <ProtectedRoute requireAuth={false}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <ShoppingBag className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70">Cook and Security cannot access shops directory.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  Shop Directory
                </h1>
                <p className="text-gray-300">
                  Discover shops and services available in Patel Heritage
                </p>
              </div>
              {canAddShops && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-6 py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Shop
                </button>
              )}
            </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                type="text"
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-slate-800">
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Add Shop Form */}
        {showAddForm && canAddShops && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Add New Shop</h2>
            <form onSubmit={handleAddShop} className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Shop Name"
                value={newShop.name}
                onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                className="p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
              />
              <input
                type="text"
                required
                placeholder="Category"
                value={newShop.category}
                onChange={(e) => setNewShop({ ...newShop, category: e.target.value })}
                className="p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newShop.phone}
                onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                className="p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
              />
              <input
                type="email"
                placeholder="Email"
                value={newShop.email}
                onChange={(e) => setNewShop({ ...newShop, email: e.target.value })}
                className="p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
              />
              <input
                type="text"
                placeholder="Location/Shop Number"
                value={newShop.location}
                onChange={(e) => setNewShop({ ...newShop, location: e.target.value })}
                className="p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
              />
              <textarea
                placeholder="Description"
                value={newShop.description}
                onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
                className="p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold md:col-span-2"
                rows={3}
              />
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Add Shop
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Shops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop, index) => (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-heritage-gold/50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-heritage-gold to-yellow-500 rounded-lg">
                  <Store className="w-6 h-6 text-black" />
                </div>
                <span className="px-3 py-1 bg-blue-500/30 text-blue-200 rounded-full text-xs">
                  {shop.category}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{shop.name}</h3>
              {shop.description && (
                <p className="text-white/70 text-sm mb-4">{shop.description}</p>
              )}
              
              <div className="space-y-2 text-sm text-white/80">
                {shop.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{shop.email}</span>
                  </div>
                )}
                {shop.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{shop.location}</span>
                  </div>
                )}
              </div>

              <button className="w-full mt-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all">
                View Details
              </button>
            </motion.div>
          ))}
        </div>

        {filteredShops.length === 0 && (
          <div className="text-center py-12 text-white/70">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No shops found matching your search</p>
          </div>
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
}

