'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertCircle, Calendar, Info, AlertTriangle, Plus, X } from 'lucide-react';
import { Announcement } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateAnnouncements } from '@/lib/auth';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const canCreate = canCreateAnnouncements(user);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'general' as 'general' | 'event' | 'maintenance' | 'emergency',
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Monthly Society Meeting',
      content: 'All residents are invited to attend the monthly society meeting on 15th of this month at 6 PM in the Golden Hall.',
      postedBy: 'Secretary',
      postedAt: new Date(),
      priority: 'high',
      category: 'general',
      isActive: true,
    },
    {
      id: '2',
      title: 'Swimming Pool Maintenance',
      content: 'The swimming pool will be under maintenance from 10th to 12th. Please plan accordingly.',
      postedBy: 'Committee',
      postedAt: new Date(Date.now() - 86400000),
      priority: 'medium',
      category: 'maintenance',
      isActive: true,
    },
  ]);

  const priorityIcons = {
    low: Info,
    medium: AlertCircle,
    high: AlertTriangle,
  };

  const priorityColors = {
    low: 'from-blue-500 to-cyan-500',
    medium: 'from-yellow-500 to-orange-500',
    high: 'from-red-500 to-pink-500',
  };

  const categoryColors = {
    general: 'bg-blue-500/30 text-blue-200',
    event: 'bg-purple-500/30 text-purple-200',
    maintenance: 'bg-yellow-500/30 text-yellow-200',
    emergency: 'bg-red-500/30 text-red-200',
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const announcement: Announcement = {
      id: Date.now().toString(),
      ...newAnnouncement,
      postedBy: user?.name || 'Committee',
      postedAt: new Date(),
      isActive: true,
    };
    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({ title: '', content: '', priority: 'medium', category: 'general' });
    setShowCreateForm(false);
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-heritage-gold" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Announcements
              </h1>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-6 py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {showCreateForm ? 'Cancel' : 'Create Announcement'}
              </button>
            )}
          </div>
          <p className="text-gray-300">
            Stay updated with the latest news and updates from the society
          </p>
        </motion.div>

        {/* Create Announcement Form */}
        {showCreateForm && canCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Create New Announcement</h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
                  placeholder="Enter announcement title"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Content</label>
                <textarea
                  required
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
                  rows={4}
                  placeholder="Enter announcement content"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 mb-2">Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  >
                    <option value="low" className="bg-slate-800">Low</option>
                    <option value="medium" className="bg-slate-800">Medium</option>
                    <option value="high" className="bg-slate-800">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Category</label>
                  <select
                    value={newAnnouncement.category}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value as any })}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-heritage-gold"
                  >
                    <option value="general" className="bg-slate-800">General</option>
                    <option value="event" className="bg-slate-800">Event</option>
                    <option value="maintenance" className="bg-slate-800">Maintenance</option>
                    <option value="emergency" className="bg-slate-800">Emergency</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Publish Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="space-y-6">
          {announcements.filter(a => a.isActive).map((announcement, index) => {
            const PriorityIcon = priorityIcons[announcement.priority];
            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${priorityColors[announcement.priority]} rounded-xl p-6 border border-white/20 shadow-xl`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <PriorityIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{announcement.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs ${categoryColors[announcement.category]}`}>
                          {announcement.category}
                        </span>
                        <span className="text-white/70 text-xs capitalize">
                          {announcement.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-white/80 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>{announcement.postedAt.toLocaleDateString()}</span>
                    </div>
                    <p className="text-white/70 text-xs">By {announcement.postedBy}</p>
                  </div>
                </div>
                
                <p className="text-white/90 leading-relaxed">{announcement.content}</p>
              </motion.div>
            );
          })}
        </div>

        {announcements.filter(a => a.isActive).length === 0 && (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
            <Bell className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <p className="text-white/70">No announcements at the moment</p>
          </div>
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
}

