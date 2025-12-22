export type Wing = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface WingConfig {
  wing: Wing;
  floors: number;
  roomsPerFloor: number;
}

export interface Flat {
  wing: Wing;
  floor: number;
  room: number;
  flatNumber: string;
  ownerName?: string;
  tenantName?: string;
  tenantPhone?: string;
  ownerPhone?: string;
  isOccupied: boolean;
  parkingSpots?: number;
}

export interface Amenity {
  id: string;
  name: string;
  description: string;
  location: string;
  icon: string;
  isBookable: boolean;
  bookingSlots?: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookedBy?: string;
}

export interface Shop {
  id: string;
  name: string;
  category: string;
  description?: string;
  phone?: string;
  email?: string;
  location?: string;
  isActive: boolean;
  products?: Product[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  inStock: boolean;
}

export interface Message {
  id: string;
  from: string;
  fromFlat: string;
  to?: string; // Committee member or 'all'
  message: string;
  type: 'complaint' | 'suggestion' | 'query' | 'general';
  timestamp: Date;
  status: 'pending' | 'read' | 'resolved';
  response?: string;
  respondedBy?: string;
}

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: 'delivery' | 'visit' | 'service';
  visitingFlat: string;
  entryGate: 'front' | 'back';
  vehicleType?: 'two-wheeler' | 'four-wheeler' | 'none';
  vehicleNumber?: string;
  entryTime?: Date;
  exitTime?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedBy?: string;
  registeredBy?: string; // Security guard who registered
  isPreApproved?: boolean;
  preApprovedDate?: Date;
  preApprovedBy?: string; // Flat number who pre-approved
  photo?: string; // Base64 encoded visitor photo
}

export interface PreApprovedVisitor {
  id: string;
  name: string;
  phone?: string;
  visitingFlat: string;
  visitDate: Date;
  preApprovedBy: string; // Flat number
  status: 'pending' | 'used' | 'expired';
  createdAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  postedBy: string;
  postedAt: Date;
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'event' | 'maintenance' | 'emergency';
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  flat: string;
  role: 'resident' | 'chairman' | 'secretary' | 'treasurer' | 'committee' | 'security' | 'admin' | 'cook';
  avatar?: string;
  tenantName?: string;
  tenantPhone?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  provider: string;
  phone: string;
  schedule: string;
  isActive: boolean;
}

export interface SecurityLog {
  id: string;
  guardName: string;
  checkInTime: Date;
  checkOutTime?: Date;
  gate: 'front' | 'back';
  status: 'on-duty' | 'off-duty';
}

export interface CommonMessage {
  id: string;
  from: string;
  fromFlat: string;
  message: string;
  type: 'alert' | 'complaint' | 'announcement' | 'general';
  timestamp: Date;
  isPinned?: boolean;
  postedByRole?: string;
}

export interface TiffinOrder {
  id: string;
  flatNumber: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  date: Date;
  quantity: number;
  status: 'pending' | 'confirmed' | 'prepared' | 'delivered' | 'cancelled';
  orderedAt: Date;
  orderedBy: string;
  price?: number;
  specialInstructions?: string;
}

export interface HallBooking {
  id: string;
  hall: 'silver' | 'golden';
  bookedBy: string;
  bookedByFlat: string;
  purpose: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Date;
  approvedBy?: string;
  price?: number;
  notes?: string;
}

