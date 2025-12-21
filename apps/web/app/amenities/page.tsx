'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, XCircle, Info, DollarSign } from 'lucide-react';
import { AMENITIES } from '@/lib/constants';
import { Amenity, HallBooking } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/auth';

export default function AmenitiesPage() {
  const { user } = useAuth();
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [bookings, setBookings] = useState<HallBooking[]>([]);
  const [bookingForm, setBookingForm] = useState({
    purpose: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  // Cook and Security cannot access amenities
  if (user?.role === 'cook' || user?.role === 'security') {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <Users className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70">Cook and Security cannot access amenities.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Only Silver Hall and Golden Hall are bookable
  const bookableAmenities = AMENITIES.filter(a => 
    a.id === 'silver-hall' || a.id === 'golden-hall'
  );

  const nonBookableAmenities = AMENITIES.filter(a => 
    a.id !== 'silver-hall' && a.id !== 'golden-hall'
  );

  // Amenity timings (not bookable, just info)
  const amenityTimings: Record<string, string> = {
    'swimming-pool': '6:00 AM - 9:00 PM',
    'temple': '5:00 AM - 10:00 PM',
    'snooker': '8:00 AM - 10:00 PM',
    'sauna': '6:00 AM - 9:00 PM',
    'table-tennis': '7:00 AM - 9:00 PM',
    'bicycle-room': '24/7',
    'sports-court': '6:00 AM - 9:00 PM',
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity || !user) return;

    const bookingDate = new Date(bookingForm.date);
    const today = new Date();
    const threeWeeksFromNow = new Date();
    threeWeeksFromNow.setDate(today.getDate() + 21);

    // Check 3 weeks notice
    if (bookingDate < threeWeeksFromNow) {
      alert('Booking must be made at least 3 weeks in advance!');
      return;
    }

    const booking: HallBooking = {
      id: Date.now().toString(),
      hall: selectedAmenity.id === 'silver-hall' ? 'silver' : 'golden',
      bookedBy: user.name,
      bookedByFlat: user.flat,
      purpose: bookingForm.purpose,
      date: bookingDate,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      status: 'pending',
      requestedAt: new Date(),
    };

    const stored = localStorage.getItem('hallBookings');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem('hallBookings', JSON.stringify([booking, ...existing]));
    setBookings([booking, ...bookings]);

    alert('Booking request submitted! It will be reviewed by the committee.');
    setSelectedAmenity(null);
    setBookingForm({ purpose: '', date: '', startTime: '', endTime: '' });
  };

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 21); // 3 weeks from now
    return date.toISOString().split('T')[0];
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
              Amenities & Facilities
            </h1>
            <p className="text-center text-gray-300">
              View amenities and book halls (3 weeks advance notice required)
            </p>
          </motion.div>

          {/* Bookable Halls */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Bookable Halls</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {bookableAmenities.map((amenity, index) => (
                <motion.div
                  key={amenity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-heritage-gold/50 transition-all cursor-pointer"
                  onClick={() => setSelectedAmenity(amenity)}
                >
                  <div className="text-4xl mb-4">{amenity.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{amenity.name}</h3>
                  <p className="text-white/70 text-sm mb-4">{amenity.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-xs">
                      Bookable
                    </span>
                    {isAdmin(user) && (
                      <span className="text-white/60 text-xs">Pricing set by Admin</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Non-Bookable Amenities */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Open Amenities (No Booking Required)</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nonBookableAmenities.map((amenity, index) => (
                <motion.div
                  key={amenity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
                >
                  <div className="text-4xl mb-4">{amenity.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{amenity.name}</h3>
                  <p className="text-white/70 text-sm mb-4">{amenity.description}</p>
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <Clock className="w-4 h-4" />
                    <span>{amenityTimings[amenity.id] || 'Open 24/7'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Booking Modal */}
          {selectedAmenity && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedAmenity(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-2">{selectedAmenity.name}</h2>
                <p className="text-white/70 mb-6">{selectedAmenity.description}</p>

                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <label className="block text-white/80 mb-2">Purpose</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.purpose}
                      onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                      placeholder="e.g., Birthday party, Wedding, Garba practice"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2">Date (Minimum 3 weeks from today)</label>
                    <input
                      type="date"
                      required
                      min={getMinDate()}
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                    />
                    <p className="text-white/50 text-xs mt-1">
                      Booking must be made at least 3 weeks in advance
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/80 mb-2">Start Time</label>
                      <input
                        type="time"
                        required
                        value={bookingForm.startTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 mb-2">End Time</label>
                      <input
                        type="time"
                        required
                        value={bookingForm.endTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                      />
                    </div>
                  </div>

                  {isAdmin(user) && (
                    <div>
                      <label className="block text-white/80 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Price (Set by Admin)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter price"
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      Submit Booking Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAmenity(null)}
                      className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
