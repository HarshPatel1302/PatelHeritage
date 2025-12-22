'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Lock, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState(''); // Can be flat number or email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(username, password);

    if (success) {
      // Get the logged in user to check their role
      const storedUser = localStorage.getItem('patelHeritageUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Redirect based on user role
          if (userData.role === 'security') {
            router.push('/security');
          } else if (userData.role === 'cook') {
            router.push('/tiffin');
          } else if (userData.role === 'resident') {
            router.push('/resident-home');
          } else {
            router.push('/dashboard');
          }
        } catch {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } else {
      setError('Invalid flat number or password');
    }

    setIsLoading(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 shadow-2xl">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-heritage-gold to-yellow-500 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Patel Heritage</h1>
            <p className="text-gray-300">Society Management System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 mb-2 flex items-center gap-2">
                Flat Number
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder="Enter flat number (e.g., A201)"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold transition-all"
              />
            </div>

            <div>
              <label className="block text-white/80 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold transition-all"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

        </div>
      </motion.div>
    </div>
  );
}

