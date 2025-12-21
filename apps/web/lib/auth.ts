import { User } from '@/types';

// User database with flat-based IDs and passwords
interface UserWithPassword extends User {
  password: string;
}

const MOCK_USERS: UserWithPassword[] = [
  // Chairman
  {
    id: 'chairman-1',
    name: 'Chairman',
    email: 'chairman@patelheritage.com',
    phone: '+91 98765 43211',
    flat: 'B301',
    role: 'chairman',
    password: 'chairman123', // Can be changed by chairman/secretary
  },
  // Secretary
  {
    id: 'secretary-1',
    name: 'Secretary',
    email: 'secretary@patelheritage.com',
    phone: '+91 98765 43212',
    flat: 'C401',
    role: 'secretary',
    password: 'secretary123', // Can be changed by chairman/secretary
  },
  // Security Guard
  {
    id: 'security-1',
    name: 'Security Guard',
    email: 'security@patelheritage.com',
    phone: '+91 98765 43215',
    flat: 'Security',
    role: 'security',
    password: 'security123',
  },
  // Cook
  {
    id: 'cook-1',
    name: 'Cook',
    email: 'cook@patelheritage.com',
    phone: '+91 98765 43216',
    flat: 'Kitchen',
    role: 'cook',
    password: 'cook123',
  },
  // Sample Residents (flat-based IDs)
  {
    id: 'A201',
    name: 'Resident A201',
    email: 'a201@patelheritage.com',
    phone: '+91 98765 43220',
    flat: 'A201',
    role: 'resident',
    password: '123', // Default password
  },
  {
    id: 'A202',
    name: 'Resident A202',
    email: 'a202@patelheritage.com',
    phone: '+91 98765 43221',
    flat: 'A202',
    role: 'resident',
    password: '123',
  },
  {
    id: 'B201',
    name: 'Resident B201',
    email: 'b201@patelheritage.com',
    phone: '+91 98765 43222',
    flat: 'B201',
    role: 'resident',
    password: '123',
  },
  {
    id: 'F1302',
    name: 'Dinesh Choudhary',
    email: 'f1302@patelheritage.com',
    phone: '+91 99999 00001',
    flat: 'F1302',
    role: 'resident',
    password: '123',
  },
  {
    id: 'A301',
    name: 'Rajesh Gupta',
    email: 'a301@patelheritage.com',
    phone: '+91 99999 00002',
    flat: 'A301',
    role: 'resident',
    password: '123',
  },
  {
    id: 'B502',
    name: 'Priya Sharma',
    email: 'b502@patelheritage.com',
    phone: '+91 99999 00003',
    flat: 'B502',
    role: 'resident',
    password: '123',
  },
  {
    id: 'C1001',
    name: 'Amit Patel',
    email: 'c1001@patelheritage.com',
    phone: '+91 99999 00004',
    flat: 'C1001',
    role: 'resident',
    password: '123',
  },
  {
    id: 'D703',
    name: 'Sneha Reddy',
    email: 'd703@patelheritage.com',
    phone: '+91 99999 00005',
    flat: 'D703',
    role: 'resident',
    password: '123',
  },
  {
    id: 'E1201',
    name: 'Vikram Singh',
    email: 'e1201@patelheritage.com',
    phone: '+91 99999 00006',
    flat: 'E1201',
    role: 'resident',
    password: '123',
  },
];

// Store passwords in localStorage for demo (in production, use backend)
export function getUsers(): UserWithPassword[] {
  if (typeof window === 'undefined') return MOCK_USERS;

  const stored = localStorage.getItem('patelHeritageUsers');
  if (stored) {
    try {
      const storedUsers = JSON.parse(stored) as UserWithPassword[];

      // Ensure all MOCK_USERS are present in stored users (for development updates)
      let hasUpdates = false;
      const updatedUsers = [...storedUsers];

      MOCK_USERS.forEach(mockUser => {
        const index = updatedUsers.findIndex(u => u.id === mockUser.id);
        if (index === -1) {
          updatedUsers.push(mockUser);
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        saveUsers(updatedUsers);
      }

      return updatedUsers;
    } catch {
      return MOCK_USERS;
    }
  }
  // Initialize with default users
  localStorage.setItem('patelHeritageUsers', JSON.stringify(MOCK_USERS));
  return MOCK_USERS;
}

export function saveUsers(users: UserWithPassword[]) {
  localStorage.setItem('patelHeritageUsers', JSON.stringify(users));
}

export interface LoginCredentials {
  username: string; // Can be email or flat number
  password: string;
}

// Authentication function
export function login(credentials: LoginCredentials): User | null {
  const users = getUsers();
  const username = credentials.username.toUpperCase().trim();

  // Try to find user by flat number or email
  const user = users.find(u =>
    u.flat.toUpperCase() === username ||
    u.email.toLowerCase() === credentials.username.toLowerCase()
  );

  if (user && user.password === credentials.password) {
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  return null;
}

export function getUserByFlat(flat: string): UserWithPassword | null {
  const users = getUsers();
  return users.find(u => u.flat.toUpperCase() === flat.toUpperCase()) || null;
}

export function getUserById(id: string): UserWithPassword | null {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

// Only Chairman and Secretary are admins
export function isAdmin(user: User | null): boolean {
  return user?.role === 'chairman' || user?.role === 'secretary';
}

export function isCommitteeMember(user: User | null): boolean {
  if (!user) return false;
  return ['chairman', 'secretary'].includes(user.role);
}

export function canManageMessages(user: User | null): boolean {
  if (!user) return false;
  // Only admins can manage messages, security cannot access
  return isAdmin(user) && user.role !== 'security';
}

// Visitors are private - only security can manage, residents can pre-approve
export function canManageVisitors(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'security';
}

export function canCreateAnnouncements(user: User | null): boolean {
  return isAdmin(user);
}

export function canManageShops(user: User | null): boolean {
  return isAdmin(user);
}

export function canViewAnalytics(user: User | null): boolean {
  return isAdmin(user);
}

export function canChangePasswords(user: User | null): boolean {
  return isAdmin(user);
}

export function canViewTiffinOrders(user: User | null): boolean {
  if (!user) return false;
  // Security cannot view tiffin orders
  if (user.role === 'security') return false;
  return user.role === 'cook' || isAdmin(user);
}

export function canViewCommonMessages(user: User | null): boolean {
  if (!user) return false;
  // Cook and Security cannot see common messages
  return user.role !== 'cook' && user.role !== 'security';
}

export function changePassword(flatOrId: string, newPassword: string, changedBy: User): boolean {
  if (!canChangePasswords(changedBy)) {
    return false;
  }

  const users = getUsers();
  const userIndex = users.findIndex(u =>
    u.flat.toUpperCase() === flatOrId.toUpperCase() || u.id === flatOrId
  );

  if (userIndex === -1) return false;

  users[userIndex].password = newPassword;
  saveUsers(users);
  return true;
}

// Generate all possible flat numbers for residents
export function generateResidentFlats(): string[] {
  const flats: string[] = [];
  const wings = ['A', 'B', 'C', 'D', 'E', 'F'];

  wings.forEach(wing => {
    const floors = (wing === 'A' || wing === 'F') ? 17 : 20;
    const roomsPerFloor = (wing === 'A' || wing === 'F') ? 3 : 2;

    for (let floor = 2; floor <= floors; floor++) {
      for (let room = 1; room <= roomsPerFloor; room++) {
        const flatNumber = `${floor}${String(room).padStart(2, '0')}`;
        flats.push(`${wing}${flatNumber}`);
      }
    }
  });

  return flats;
}
