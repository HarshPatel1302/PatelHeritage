'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Building2, Users, MessageSquare, ShoppingBag, Shield, Calendar } from 'lucide-react';
import WingVisualization from '@/components/WingVisualization';
import FeatureCard from '@/components/FeatureCard';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Redirect to appropriate page if already logged in
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'security') {
        router.push('/security');
      } else if (user.role === 'cook') {
        router.push('/tiffin');
      } else if (user.role === 'resident') {
        router.push('/resident-home');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const features = [
    {
      icon: Building2,
      title: 'Wing Directory',
      description: 'Explore all wings and resident information',
      color: 'from-blue-500 to-cyan-500',
      onClick: () => router.push('/wings'),
    },
    {
      icon: MessageSquare,
      title: 'Complaints & Suggestions',
      description: 'Connect with committee members',
      color: 'from-purple-500 to-pink-500',
      onClick: () => router.push('/messages'),
    },
    {
      icon: Shield,
      title: 'Entry Management',
      description: 'Manage visitors and deliveries',
      color: 'from-green-500 to-emerald-500',
      onClick: () => router.push('/entry'),
    },
    {
      icon: ShoppingBag,
      title: 'Shop Directory',
      description: 'Discover shops and order products',
      color: 'from-orange-500 to-red-500',
      onClick: () => router.push('/shops'),
    },
    {
      icon: Users,
      title: 'Amenities',
      description: 'Book facilities and view availability',
      color: 'from-indigo-500 to-purple-500',
      onClick: () => router.push('/amenities'),
    },
    {
      icon: Calendar,
      title: 'Announcements',
      description: 'Stay updated with society news',
      color: 'from-yellow-500 to-amber-500',
      onClick: () => router.push('/announcements'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          <div className="absolute top-0 -left-4 w-72 h-72 bg-heritage-gold rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-heritage-gold via-yellow-400 to-heritage-gold bg-clip-text text-transparent animate-pulse-slow">
              Patel Heritage
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Your Smart Society Management System
            </p>
            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-heritage-gold text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                onClick={() => router.push('/wings')}
              >
                Explore Wings
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white/10 backdrop-blur-md text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all"
                onClick={() => router.push('/dashboard')}
              >
                Dashboard
              </motion.button>
            </div>
          </motion.div>

          {/* Wing Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16"
          >
            <WingVisualization />
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.1} />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

