'use client';

import { motion } from 'framer-motion';
import { Image, Video, Building2, Users, Calendar, Heart } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PushRegistrar from '@/components/PushRegistrar';
import { useAuth } from '@/contexts/AuthContext';

export default function ResidentHomePage() {
  const { user } = useAuth();

  // Placeholder images - in production, these would be actual society photos
  // Using gradient placeholders that you can replace with actual images later
  const placeholderImages = [
    { gradient: 'from-blue-500 to-cyan-500', label: 'Society Building' },
    { gradient: 'from-purple-500 to-pink-500', label: 'Swimming Pool' },
    { gradient: 'from-green-500 to-emerald-500', label: 'Garden Area' },
    { gradient: 'from-orange-500 to-red-500', label: 'Common Hall' },
    { gradient: 'from-indigo-500 to-purple-500', label: 'Playground' },
    { gradient: 'from-yellow-500 to-amber-500', label: 'Temple' },
  ];

  // Placeholder videos - in production, these would be actual society videos
  const placeholderVideos = [
    { gradient: 'from-teal-500 to-cyan-500', label: 'Society Tour' },
    { gradient: 'from-rose-500 to-pink-500', label: 'Community Events' },
  ];

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Welcome to Patel Heritage
            </h1>
            <p className="text-gray-300 text-lg">
              Your Home, Your Community, Your Heritage
            </p>
          </motion.div>

          {/* Gate alerts opt-in. Without this the resident only sees visitors
              while the app is open on screen. */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 mx-auto max-w-2xl"
          >
            <PushRegistrar />
          </motion.div>

          {/* Society Photos Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Image className="w-8 h-8 text-heritage-gold" />
              <h2 className="text-3xl font-bold text-white">Society Gallery</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {placeholderImages.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="relative group overflow-hidden rounded-xl border-2 border-white/20 hover:border-heritage-gold transition-all cursor-pointer"
                >
                  <div className={`aspect-video bg-gradient-to-br ${img.gradient} flex items-center justify-center`}>
                    <Image className="w-16 h-16 text-white/50" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.label}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view full image
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Society Videos Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Video className="w-8 h-8 text-heritage-gold" />
              <h2 className="text-3xl font-bold text-white">Society Videos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {placeholderVideos.map((video, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="relative group overflow-hidden rounded-xl border-2 border-white/20 hover:border-heritage-gold transition-all cursor-pointer"
                >
                  <div className={`aspect-video bg-gradient-to-br ${video.gradient} flex items-center justify-center`}>
                    <div className="relative">
                      <Video className="w-20 h-20 text-white/70" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {video.label}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to play video
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <Building2 className="w-12 h-12 text-heritage-gold mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">6 Wings</h3>
              <p className="text-white/70">A-F Wings with modern amenities</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <Users className="w-12 h-12 text-heritage-gold mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">236 Flats</h3>
              <p className="text-white/70">A vibrant community of residents</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <Heart className="w-12 h-12 text-heritage-gold mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Community First</h3>
              <p className="text-white/70">Building connections and memories</p>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

