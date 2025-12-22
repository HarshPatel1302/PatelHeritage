'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { WING_CONFIGS } from '@/lib/constants';
import { Wing } from '@/types';

export default function WingVisualization() {
  const router = useRouter();

  const handleWingClick = (wing: Wing) => {
    router.push(`/wings/${wing}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-white mb-8">
        Explore Our Wings
      </h2>

      {/* Podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-heritage-silver to-gray-300 rounded-lg p-6 text-center shadow-2xl border-2 border-heritage-gold">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">PODIUM</h3>
          <p className="text-gray-700">Common Area - First Floor</p>
          <p className="text-sm text-gray-600 mt-2">
            Swimming Pool • Temple • Halls • Sports Court • Recreation Facilities
          </p>
        </div>
      </motion.div>

      {/* Wings Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {WING_CONFIGS.map((config, index) => (
          <motion.div
            key={config.wing}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              scale: 1.1,
              y: -10,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleWingClick(config.wing)}
            className="cursor-pointer h-full"
          >
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 shadow-xl border-2 border-heritage-gold hover:border-heritage-gold/80 transition-all group h-full min-h-[200px] flex flex-col">
              {/* Building Icon */}
              <div className="flex justify-center mb-4 flex-shrink-0 h-12">
                <Building2 className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
              </div>

              {/* Wing Label */}
              <h3 className="text-3xl font-bold text-center text-white mb-2 flex-shrink-0 h-14 flex items-center justify-center whitespace-nowrap">
                Wing {config.wing}
              </h3>

              {/* Wing Details */}
              <div className="text-center text-white/90 text-sm space-y-1 flex-grow flex flex-col justify-center">
                <p>{config.floors} Floors</p>
                <p>{config.roomsPerFloor} Rooms/Floor</p>
                <p className="text-xs text-white/70 mt-2">
                  {(() => {
                    let total = 0;
                    for (let f = 2; f <= config.floors; f++) {
                      if (['B', 'C', 'D', 'E'].includes(config.wing) && f === 19) {
                        total += 1;
                      } else {
                        total += config.roomsPerFloor;
                      }
                    }
                    return total;
                  })()} Total Flats
                </p>
              </div>

              {/* Hover Effect Glow */}
              <div className="absolute inset-0 rounded-lg bg-heritage-gold opacity-0 group-hover:opacity-20 transition-opacity blur-xl"></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-gray-400 mt-8 text-sm"
      >
        Click on any wing to view detailed information
      </motion.p>
    </div>
  );
}

