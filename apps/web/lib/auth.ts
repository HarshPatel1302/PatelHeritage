import { User, WingConfig } from '@/types';
import { WING_CONFIGS } from './constants';

/**
 * Client-safe permission predicates ONLY.
 *
 * This module used to hold the entire resident roster with plaintext passwords
 * and a client-side login(). All of that shipped to every visitor's browser, so
 * anyone could read all ~240 names, phone numbers and passwords from the JS
 * bundle without signing in.
 *
 * The roster now lives in Postgres, authentication happens in /api/auth/*, and
 * the frozen snapshot used to seed the database is in lib/legacy-users.ts,
 * which is imported only by prisma/seed.ts and never by client code.
 *
 * These predicates are pure functions over a role. They decide what the UI
 * offers; the server re-checks every one of them before acting.
 */

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

/** Every flat number in the society. Pure — derived from WING_CONFIGS. */
export function generateResidentFlats(): string[] {
  const flats: string[] = [];
  const wings = ['A', 'B', 'C', 'D', 'E', 'F'];

  wings.forEach((wing) => {
    const wingConfig = WING_CONFIGS.find((w: WingConfig) => w.wing === wing);
    if (!wingConfig) return;

    for (let floor = 2; floor <= wingConfig.floors; floor++) {
      const maxRooms =
        ['B', 'C', 'D', 'E'].includes(wing) && floor === wingConfig.floors
          ? 1
          : wingConfig.roomsPerFloor;
      for (let room = 1; room <= maxRooms; room++) {
        const flatNumber = `${floor}${String(room).padStart(2, '0')}`;
        flats.push(`${wing}${flatNumber}`);
      }
    }
  });

  return flats;
}
