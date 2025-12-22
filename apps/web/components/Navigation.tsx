'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Building2, MessageSquare, Shield, ShoppingBag, Users, Calendar, Menu, X, User, Settings, LogOut, LogIn, CheckCircle2, UtensilsCrossed, Lock, ChevronDown, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { canManageVisitors, canManageMessages, canCreateAnnouncements, canViewCommonMessages, canViewTiffinOrders, isAdmin } from '@/lib/auth';
import { Visitor } from '@/types';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);
  const prevCountRef = useRef(0);
  const { user, logout, isAuthenticated } = useAuth();

  // Poll for pending visitors
  useEffect(() => {
    if (!user || user.role === 'security' || user.role === 'cook') return;

    const checkNotifications = () => {
      const stored = localStorage.getItem('visitors');
      if (stored) {
        const allVisitors = JSON.parse(stored);
        const pending = allVisitors.filter((v: Visitor) =>
          v.visitingFlat.toUpperCase() === user.flat.toUpperCase() && v.status === 'pending'
        );
        const count = pending.length;
        setPendingCount(count);

        // Play sound if count increased
        if (count > prevCountRef.current) {
          setShowNotificationBadge(true);
          // Optional: sound effect could go here
        }
        prevCountRef.current = count;
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // All navigation items go in dropdown menu (Home removed as it's same as Dashboard)
  const allNavItemsList = [
    { path: '/resident-home', label: 'Home', icon: Home, public: false, requiresRole: (u: any) => u?.role === 'resident' },
    { path: '/dashboard', label: 'Dashboard', icon: Home, public: false, excludeRole: ['cook', 'security', 'resident'] },
    { path: '/wings', label: 'Wings', icon: Building2, public: false, excludeRole: ['cook', 'security', 'resident'] },
    { path: '/messages/common', label: 'Common Messages', icon: MessageSquare, public: false, requiresRole: canViewCommonMessages },
    { path: '/messages', label: 'Complaints', icon: MessageSquare, public: false, requiresRole: (u: any) => u && u.role !== 'security' && u?.role !== 'cook' },
    { path: '/pre-approve', label: 'Pre-approve Visitor', icon: CheckCircle2, public: false, requiresRole: (u: any) => u?.role === 'resident' },
    { path: '/security', label: 'Security', icon: Shield, public: false, requiresRole: canManageVisitors },
    { path: '/tiffin', label: 'Tiffin Service', icon: UtensilsCrossed, public: false, requiresRole: (u: any) => u && u.role !== 'security' },
    { path: '/shops', label: 'Shops', icon: ShoppingBag, public: false, excludeRole: ['cook', 'security'] },
    { path: '/amenities', label: 'Amenities', icon: Users, public: false, excludeRole: ['cook', 'security'] },
    { path: '/announcements', label: 'Announcements', icon: Calendar, public: false },
    { path: '/admin/passwords', label: 'Password Management', icon: Lock, public: false, requiresRole: isAdmin },
    { path: '/profile', label: 'Profile', icon: User, public: false },
    { path: '/settings', label: 'Settings', icon: Settings, public: false },
  ];

  // Filter nav items based on authentication and role
  const filterNavItems = (items: typeof allNavItemsList) => {
    return items.filter(item => {
      // Exclude items for specific roles (can be string or array)
      if (item.excludeRole) {
        if (Array.isArray(item.excludeRole)) {
          if (item.excludeRole.includes(user?.role || '')) return false;
        } else if (item.excludeRole === user?.role) {
          return false;
        }
      }
      if (item.public) return true;
      if (!isAuthenticated) return false;
      if (item.requiresRole) {
        if (typeof item.requiresRole === 'function') {
          if (!item.requiresRole(user)) return false;
        }
      }
      return true;
    });
  };

  const navItems = filterNavItems(allNavItemsList);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMoreMenuOpen]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="cursor-pointer"
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-heritage-gold to-yellow-400 bg-clip-text text-transparent">
                Patel Heritage
              </h1>
            </motion.div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              {user && user.role !== 'security' && user.role !== 'cook' && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowNotificationBadge(false);
                    router.push('/dashboard');
                  }}
                  className="relative p-2 text-white/70 hover:text-white transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {pendingCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full animate-bounce">
                      {pendingCount}
                    </span>
                  )}
                </motion.button>
              )}

              {/* Menu Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${navItems.some(item => pathname === item.path)
                    ? 'bg-heritage-gold text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <Menu className="w-5 h-5" />
                  <span className="text-sm font-medium whitespace-nowrap">Menu</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {isMoreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-white/10 overflow-hidden z-50 max-h-[80vh] overflow-y-auto"
                  >
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            router.push(item.path);
                            setIsMoreMenuOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${isActive
                            ? 'bg-heritage-gold/20 text-heritage-gold'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              {!isAuthenticated && (
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 bg-heritage-gold text-black hover:bg-yellow-500"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm font-medium">Login</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="cursor-pointer"
            >
              <h1 className="text-xl font-bold bg-gradient-to-r from-heritage-gold to-yellow-400 bg-clip-text text-transparent">
                Patel Heritage
              </h1>
            </motion.div>

            <div className="flex items-center gap-2">
              {/* Mobile Notification Bell */}
              {user && user.role !== 'security' && user.role !== 'cook' && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="relative p-2 text-white/70"
                >
                  <Bell className="w-6 h-6" />
                  {pendingCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-white"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/95 backdrop-blur-md border-t border-white/10"
            >
              <div className="container mx-auto px-4 py-4 space-y-2">
                {navItems.filter(item => item.path !== '/').map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <motion.button
                      key={item.path}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        router.push(item.path);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${isActive
                        ? 'bg-heritage-gold text-black'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
                {isAuthenticated ? (
                  <>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="px-4 py-2 text-white/80 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{user?.name}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-heritage-gold/20 text-heritage-gold rounded text-xs mt-1 inline-block">
                        {user?.role}
                      </span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Logout</span>
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      router.push('/login');
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 bg-heritage-gold text-black"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">Login</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16 md:block hidden" />
    </>
  );
}
