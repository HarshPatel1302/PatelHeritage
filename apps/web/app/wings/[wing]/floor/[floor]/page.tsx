'use client';

import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Home, Users, UserMinus, Phone, Mail, Edit2, Car, Save, X } from 'lucide-react';
import { WING_CONFIGS } from '@/lib/constants';
import { Wing, Flat } from '@/types';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/auth';
import { flatsOnFloor, roomsOnFloor } from '@/lib/flats';

export default function FloorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const wing = params.wing as Wing;
  const floor = parseInt(params.floor as string);

  const config = WING_CONFIGS.find(w => w.wing === wing);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);
  const [editForm, setEditForm] = useState({
    ownerName: '',
    ownerPhone: '',
    tenantName: '',
    tenantPhone: '',
    parkingSpots: 0,
  });

  // Computed, not returned on, so the hooks below always run. Returning early
  // here would call fewer hooks on an invalid floor than on a valid one, which
  // crashes React the moment someone navigates between the two.
  const floorExists = Boolean(config && floor >= 1 && floor <= config.floors);

  // Load real flats for this floor from the database. Contact details come back
  // only if the signed-in user is on the committee; everyone else sees occupancy.
  useEffect(() => {
    if (!floorExists || floor === 1) {
      setFlats([]);
      return;
    }

    let cancelled = false;

    (async () => {
      let residents: Array<{
        flatId: string | null;
        name?: string;
        phone?: string;
        tenantName?: string | null;
        tenantPhone?: string | null;
      }> = [];

      try {
        const res = await fetch(`/api/residents?wing=${wing}&floor=${floor}`, {
          cache: 'no-store',
        });
        if (res.ok) residents = (await res.json()).residents;
      } catch {
        /* fall through to an unoccupied view rather than breaking the page */
      }
      if (cancelled) return;

      const flatsList: Flat[] = flatsOnFloor(wing, floor).map((flatID, index) => {
        const resident = residents.find(
          (r) => r.flatId?.toUpperCase() === flatID.toUpperCase(),
        );
        const flatNumberText = flatID.slice(1);

        return {
          wing,
          floor,
          room: index + 1,
          flatNumber: flatID,
          ownerName: resident?.name,
          ownerPhone: resident?.phone,
          tenantName: resident?.tenantName ?? undefined,
          tenantPhone: resident?.tenantPhone ?? undefined,
          isOccupied: Boolean(resident),
          // Deterministic so server and client markup agree.
          parkingSpots: (parseInt(flatNumberText, 10) % 3) + 1,
        };
      });

      setFlats(flatsList);
    })();

    return () => {
      cancelled = true;
    };
  }, [wing, floor, floorExists]);

  // Safe here: every hook above has already run on this render.
  // `!config` is repeated so TypeScript narrows it for the JSX below.
  if (!floorExists || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center pt-24">
        <p className="text-white text-xl">Floor not found</p>
      </div>
    );
  }

  const currentFlats = flats;

  const handleEditFlat = (flat: Flat) => {
    if (!isAdmin(user)) return;
    setEditingFlat(flat);
    setEditForm({
      ownerName: flat.ownerName || '',
      ownerPhone: flat.ownerPhone || '',
      tenantName: flat.tenantName || '',
      tenantPhone: flat.tenantPhone || '',
      parkingSpots: flat.parkingSpots || 0,
    });
  };

  const handleSaveFlat = async () => {
    if (!editingFlat || !isAdmin(user)) return;

    const res = await fetch(`/api/residents/${editingFlat.flatNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerName: editForm.ownerName,
        ownerPhone: editForm.ownerPhone,
        tenantName: editForm.tenantName,
        tenantPhone: editForm.tenantPhone,
      }),
    }).catch(() => null);

    if (!res?.ok) {
      const message = res ? ((await res.json().catch(() => ({}))).error ?? '') : '';
      alert(`Could not save. ${message}`.trim());
      return;
    }

    setFlats(
      flats.map((f) =>
        f.flatNumber === editingFlat.flatNumber
          ? {
              ...f,
              ownerName: editForm.ownerName,
              ownerPhone: editForm.ownerPhone,
              tenantName: editForm.tenantName,
              tenantPhone: editForm.tenantPhone,
              parkingSpots: editForm.parkingSpots,
            }
          : f,
      ),
    );
    setEditingFlat(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push(`/wings/${wing}`)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Wing {wing}
          </button>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {floor === 1 ? 'Podium' : `Floor ${floor}`}
                </h1>
                <p className="text-gray-300">
                  {/* roomsOnFloor, not config.roomsPerFloor: the top floor of
                      wings B–E has a single flat, so the constant would lie. */}
                  Wing {wing} • {floor === 1 ? 'Common Area' : `${roomsOnFloor(wing, floor)} Flats`}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-white/70 mb-1">
                  <Home className="w-5 h-5" />
                  <span className="text-2xl font-bold">{wing}{floor === 1 ? 'P' : floor}</span>
                </div>
                {floor !== 1 && (
                  <p className="text-white/50 text-sm">
                    {currentFlats.filter(f => f.isOccupied).length} Occupied
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {floor === 1 ? (
          // Podium Information
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Podium Facilities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Swimming Pool',
                'Ganesh Mandir (Temple)',
                'Silver Hall',
                'Golden Hall',
                'Snooker Table',
                'Sauna',
                'Table Tennis Room',
                'Bicycle Room',
                'Football & Badminton Court',
              ].map((facility, index) => (
                <motion.div
                  key={facility}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-heritage-gold/50 transition-all"
                >
                  <p className="text-white font-medium">{facility}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          // Flats List
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentFlats.map((flat, index) => (
              <motion.div
                key={flat.flatNumber}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`rounded-xl p-6 border-2 transition-all ${flat.isOccupied
                  ? 'bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/50'
                  : 'bg-white/5 border-white/20'
                  }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {flat.flatNumber}
                    </h3>
                    <p className="text-white/70 text-sm">
                      Room {flat.room} • Floor {flat.floor}
                    </p>
                  </div>
                  {isAdmin(user) && (
                    <button
                      onClick={() => handleEditFlat(flat)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {flat.isOccupied ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-white/90">
                      <Users className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span className="font-medium">{flat.ownerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{flat.ownerPhone}</span>
                    </div>

                    {flat.tenantName && (
                      <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
                        <div className="flex items-start gap-2 text-white/90">
                          <UserMinus className="w-4 h-4 mt-1 flex-shrink-0 text-heritage-gold" />
                          <div className="flex flex-col">
                            <span className="text-xs text-heritage-gold uppercase font-bold tracking-wider">Tenant</span>
                            <span className="font-medium">{flat.tenantName}</span>
                          </div>
                        </div>
                        {flat.tenantPhone && (
                          <div className="flex items-start gap-2 text-white/70 text-sm">
                            <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                            <span>{flat.tenantPhone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {flat.parkingSpots && (
                      <div className="flex items-center gap-2 text-white/70 text-sm pt-1">
                        <Car className="w-4 h-4" />
                        <span>{flat.parkingSpots} Parking Spot{flat.parkingSpots > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-xs">
                        Occupied
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span className="px-3 py-1 bg-gray-500/30 text-gray-300 rounded-full text-xs">
                      Vacant
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Flat Modal */}
        {editingFlat && isAdmin(user) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditingFlat(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Edit Flat {editingFlat.flatNumber}</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveFlat(); }} className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Owner Name</label>
                  <input
                    type="text"
                    value={editForm.ownerName}
                    onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Owner Phone</label>
                  <input
                    type="tel"
                    value={editForm.ownerPhone}
                    onChange={(e) => setEditForm({ ...editForm, ownerPhone: e.target.value })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Tenant Name (Optional)</label>
                  <input
                    type="text"
                    value={editForm.tenantName}
                    onChange={(e) => setEditForm({ ...editForm, tenantName: e.target.value })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Tenant Phone</label>
                  <input
                    type="tel"
                    value={editForm.tenantPhone}
                    onChange={(e) => setEditForm({ ...editForm, tenantPhone: e.target.value })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Parking Spots
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.parkingSpots}
                    onChange={(e) => setEditForm({ ...editForm, parkingSpots: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFlat(null)}
                    className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
