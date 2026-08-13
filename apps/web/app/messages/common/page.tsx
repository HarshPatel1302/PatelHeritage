'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, AlertCircle, Bell, AlertTriangle, Info } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { canViewCommonMessages } from '@/lib/auth';
import { CommonMessage } from '@/types';

export default function CommonMessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommonMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<CommonMessage['type']>('general');



  // Load messages
  useEffect(() => {
    const stored = localStorage.getItem('commonMessages');
    if (stored) {
      try {
        const loadedMessages = JSON.parse(stored);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }
  }, []);

  const handleSend = () => {
    if (!newMessage.trim() || !user) return;

    const message: CommonMessage = {
      id: Date.now().toString(),
      from: user.name,
      fromFlat: user.flat,
      message: newMessage,
      type: messageType,
      timestamp: new Date(),
      isPinned: false,
      postedByRole: user.role,
    };

    const updatedMessages = [message, ...messages];
    setMessages(updatedMessages);
    localStorage.setItem('commonMessages', JSON.stringify(updatedMessages));
    setNewMessage('');
  };

  const typeIcons = {
    alert: AlertCircle,
    complaint: AlertTriangle,
    announcement: Bell,
    general: Info,
  };

  const typeColors = {
    alert: 'from-yellow-500 to-orange-500',
    complaint: 'from-red-500 to-pink-500',
    announcement: 'from-blue-500 to-cyan-500',
    general: 'from-purple-500 to-indigo-500',
  };

  // Access check runs AFTER every hook above. Returning before them would
  // render a different number of hooks for a permitted and a blocked user,
  // which crashes React when the same component re-renders across roles.
  // Check if user can view common messages (cook and security cannot)
  if (!canViewCommonMessages(user)) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <MessageSquare className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/70">Cook and Security cannot access common messaging area.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 pt-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
              Common Messaging Area
            </h1>
            <p className="text-center text-gray-300">
              Share alerts, complaints, or announcements with all society members
            </p>
          </motion.div>

          {/* Message Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['alert', 'complaint', 'announcement', 'general'] as const).map((type) => {
                const Icon = typeIcons[type];
                return (
                  <button
                    key={type}
                    onClick={() => setMessageType(type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      messageType === type
                        ? `border-heritage-gold bg-gradient-to-br ${typeColors[type]}`
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white mx-auto mb-2" />
                    <p className="text-white text-sm capitalize">{type}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Messages List */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white/5 rounded-lg border border-white/10"
              >
                <MessageSquare className="w-12 h-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">No messages yet. Start a conversation!</p>
              </motion.div>
            ) : (
              messages.map((msg, index) => {
                const Icon = typeIcons[msg.type];
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-gradient-to-br ${typeColors[msg.type]} rounded-lg p-4 border border-white/20`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-white font-semibold">{msg.from}</p>
                            <p className="text-white/70 text-sm">{msg.fromFlat}</p>
                          </div>
                          <span className="text-white/70 text-xs">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-white mb-2">{msg.message}</p>
                        {msg.postedByRole === 'chairman' || msg.postedByRole === 'secretary' ? (
                          <span className="px-2 py-1 bg-white/20 text-white rounded text-xs">
                            Official
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message here..."
                className="flex-1 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-heritage-gold"
              />
              <button
                onClick={handleSend}
                className="px-6 py-3 bg-gradient-to-r from-heritage-gold to-yellow-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

