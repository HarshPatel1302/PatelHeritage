'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Moon, Sun, Globe, Save } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      messages: true,
      announcements: true,
      visitors: true,
      amenities: false,
    },
    theme: 'dark',
    language: 'en',
    privacy: {
      showPhone: true,
      showEmail: false,
    },
  });

  const handleSave = () => {
    // TODO: Save to backend/localStorage
    localStorage.setItem('patelHeritageSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Settings
          </h1>
          <p className="text-gray-300">Manage your preferences and account settings</p>
        </motion.div>

        <div className="space-y-6">
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-heritage-gold" />
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          [key]: !value,
                        },
                      })
                    }
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      value ? 'bg-heritage-gold' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        value ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-heritage-gold" />
              <h2 className="text-2xl font-bold text-white">Privacy</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(settings.privacy).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-white">
                    Show {key === 'showPhone' ? 'Phone Number' : 'Email'} in Directory
                  </label>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        privacy: {
                          ...settings.privacy,
                          [key]: !value,
                        },
                      })
                    }
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      value ? 'bg-heritage-gold' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        value ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              {settings.theme === 'dark' ? (
                <Moon className="w-6 h-6 text-heritage-gold" />
              ) : (
                <Sun className="w-6 h-6 text-heritage-gold" />
              )}
              <h2 className="text-2xl font-bold text-white">Appearance</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-white">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    setSettings({ ...settings, theme: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                >
                  <option value="dark" className="bg-slate-800">Dark</option>
                  <option value="light" className="bg-slate-800">Light</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Language */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-heritage-gold" />
              <h2 className="text-2xl font-bold text-white">Language</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-white">Preferred Language</label>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings({ ...settings, language: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                >
                  <option value="en" className="bg-slate-800">English</option>
                  <option value="hi" className="bg-slate-800">Hindi</option>
                  <option value="gu" className="bg-slate-800">Gujarati</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end"
          >
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>
          </motion.div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
