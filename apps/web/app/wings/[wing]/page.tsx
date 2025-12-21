'use client';

import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Home, Users } from 'lucide-react';
import { WING_CONFIGS } from '@/lib/constants';
import { Wing } from '@/types';

export default function WingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const wing = params.wing as Wing;
  
  const config = WING_CONFIGS.find(w => w.wing === wing);
  
  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Wing not found</p>
      </div>
    );
  }

  const floors = Array.from({ length: config.floors }, (_, i) => i + 1);
  const rooms = Array.from({ length: config.roomsPerFloor }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/wings')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Wings
          </button>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Wing {wing}
            </h1>
            <div className="flex flex-wrap gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                <span>{config.floors} Floors</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{config.roomsPerFloor} Rooms per Floor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-heritage-gold font-semibold">
                  {config.floors * config.roomsPerFloor} Total Flats
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floors Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {floors.map((floor, index) => (
            <motion.div
              key={floor}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 hover:border-heritage-gold/50 transition-all cursor-pointer"
              onClick={() => router.push(`/wings/${wing}/floor/${floor}`)}
            >
              <h3 className="text-2xl font-bold text-white mb-3 text-center">
                {floor === 1 ? 'Podium' : `Floor ${floor}`}
              </h3>
              <div className="space-y-2">
                {floor === 1 ? (
                  <div className="text-center text-gray-300 text-sm">
                    Common Area
                  </div>
                ) : (
                  rooms.map((room) => {
                    const flatNumber = `${floor}${String(room).padStart(2, '0')}`;
                    return (
                      <div
                        key={room}
                        className="bg-blue-600/30 rounded px-3 py-2 text-center text-white text-sm hover:bg-blue-600/50 transition-colors"
                      >
                        {wing}{flatNumber}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

