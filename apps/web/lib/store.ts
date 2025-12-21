import { create } from 'zustand';
import { Message, Visitor, Announcement, Flat } from '@/types';

interface AppState {
  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  
  // Visitors
  visitors: Visitor[];
  addVisitor: (visitor: Visitor) => void;
  updateVisitor: (id: string, updates: Partial<Visitor>) => void;
  
  // Announcements
  announcements: Announcement[];
  addAnnouncement: (announcement: Announcement) => void;
  
  // Flats
  flats: Flat[];
  updateFlat: (flatNumber: string, updates: Partial<Flat>) => void;
  
  // User
  currentUser: {
    id: string;
    name: string;
    flat: string;
    role: 'resident' | 'chairman' | 'secretary' | 'treasurer' | 'committee' | 'security' | 'admin';
  } | null;
  setCurrentUser: (user: AppState['currentUser']) => void;
}

export const useStore = create<AppState>((set) => ({
  // Messages
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [message, ...state.messages] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
  
  // Visitors
  visitors: [],
  addVisitor: (visitor) => set((state) => ({ visitors: [visitor, ...state.visitors] })),
  updateVisitor: (id, updates) =>
    set((state) => ({
      visitors: state.visitors.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    })),
  
  // Announcements
  announcements: [],
  addAnnouncement: (announcement) =>
    set((state) => ({ announcements: [announcement, ...state.announcements] })),
  
  // Flats
  flats: [],
  updateFlat: (flatNumber, updates) =>
    set((state) => ({
      flats: state.flats.map((flat) =>
        flat.flatNumber === flatNumber ? { ...flat, ...updates } : flat
      ),
    })),
  
  // User
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}));

