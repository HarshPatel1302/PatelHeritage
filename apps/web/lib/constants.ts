import { WingConfig, Amenity, Shop } from '@/types';

export const WING_CONFIGS: WingConfig[] = [
  { wing: 'A', floors: 17, roomsPerFloor: 3 },
  { wing: 'B', floors: 19, roomsPerFloor: 2 }, // Floor 19 has only 1 flat (1901)
  { wing: 'C', floors: 19, roomsPerFloor: 2 }, // Floor 19 has only 1 flat (1901)
  { wing: 'D', floors: 19, roomsPerFloor: 2 }, // Floor 19 has only 1 flat (1901)
  { wing: 'E', floors: 19, roomsPerFloor: 2 }, // Floor 19 has only 1 flat (1901)
  { wing: 'F', floors: 17, roomsPerFloor: 3 },
];

export const AMENITIES: Amenity[] = [
  {
    id: 'swimming-pool',
    name: 'Swimming Pool',
    description: 'Olympic-sized swimming pool on the podium',
    location: 'Podium - First Floor',
    icon: '🏊',
    isBookable: true,
  },
  {
    id: 'temple',
    name: 'Ganesh Mandir',
    description: 'Temple for daily prayers and religious ceremonies',
    location: 'Podium - First Floor',
    icon: '🕉️',
    isBookable: false,
  },
  {
    id: 'snooker',
    name: 'Snooker Table',
    description: 'Professional snooker table for recreation',
    location: 'Podium - First Floor',
    icon: '🎱',
    isBookable: true,
  },
  {
    id: 'sauna',
    name: 'Sauna',
    description: 'Relaxation and wellness facility',
    location: 'Podium - First Floor',
    icon: '🧖',
    isBookable: true,
  },
  {
    id: 'table-tennis',
    name: 'Table Tennis Room',
    description: 'Indoor table tennis facility',
    location: 'Podium - First Floor',
    icon: '🏓',
    isBookable: true,
  },
  {
    id: 'bicycle-room',
    name: 'Bicycle Room (Spinning Room)',
    description: 'Storage and activity space for bicycles',
    location: 'Podium - First Floor',
    icon: '🚴',
    isBookable: false,
  },
  {
    id: 'sports-court',
    name: 'Football & Badminton Court',
    description: 'Multi-purpose sports court',
    location: 'Podium - First Floor',
    icon: '⚽',
    isBookable: true,
  },
  {
    id: 'silver-hall',
    name: 'Silver Hall',
    description: 'Event hall for weddings, parties, and community activities',
    location: 'Podium - First Floor',
    icon: '🎉',
    isBookable: true,
  },
  {
    id: 'golden-hall',
    name: 'Golden Hall',
    description: 'Premium event hall for special occasions',
    location: 'Podium - First Floor',
    icon: '✨',
    isBookable: true,
  },
];

export const SHOPS: Shop[] = [
  { id: '1', name: 'Vijay Sales', category: 'Electronics', isActive: true },
  { id: '2', name: 'Namaste Salon', category: 'Beauty & Wellness', isActive: true },
  { id: '3', name: 'Achija Restaurant', category: 'Food & Dining', isActive: true },
  { id: '4', name: 'Ajwa Restaurant', category: 'Food & Dining', isActive: true },
  { id: '5', name: 'Sujal Supermarket', category: 'Grocery', isActive: true },
  { id: '6', name: 'Iyengar Bakery', category: 'Food & Dining', isActive: true },
  { id: '7', name: 'Raymond', category: 'Fashion', isActive: true },
  { id: '8', name: 'Titan', category: 'Jewelry & Watches', isActive: true },
  { id: '9', name: 'HDFC Bank', category: 'Banking', isActive: true },
  { id: '10', name: 'Bandhan Bank', category: 'Banking', isActive: true },
  { id: '11', name: 'Medical Store', category: 'Healthcare', isActive: true },
];

export const GATES = {
  front: {
    name: 'Front Gate',
    allowedTypes: ['walk-in', 'delivery', 'parcel'],
    vehicleAllowed: false,
  },
  back: {
    name: 'Back Gate',
    allowedTypes: ['two-wheeler', 'four-wheeler', 'visitor-vehicle'],
    vehicleAllowed: true,
    hasBarricade: true,
    barricadeSystem: 'Parking Plus',
  },
};

