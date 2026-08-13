import { WING_CONFIGS } from './constants';
import type { Wing } from '@/types';

/**
 * Flat topology, derived from WING_CONFIGS so the kiosk, the seed script and the
 * directory can never disagree about which flats exist.
 *
 * Ground floor (1) holds shops, not flats, so residences start at floor 2.
 */
export const FIRST_RESIDENTIAL_FLOOR = 2;

export function wings(): Wing[] {
  return WING_CONFIGS.map((c) => c.wing);
}

export function floorsForWing(wing: Wing): number[] {
  const config = WING_CONFIGS.find((c) => c.wing === wing);
  if (!config) return [];
  const result: number[] = [];
  for (let floor = FIRST_RESIDENTIAL_FLOOR; floor <= config.floors; floor++) {
    result.push(floor);
  }
  return result;
}

export function roomsOnFloor(wing: Wing, floor: number): number {
  const config = WING_CONFIGS.find((c) => c.wing === wing);
  if (!config) return 0;
  // B/C/D/E cap out with a single flat on their top floor.
  if (['B', 'C', 'D', 'E'].includes(wing) && floor === config.floors) return 1;
  return config.roomsPerFloor;
}

export function flatsOnFloor(wing: Wing, floor: number): string[] {
  const count = roomsOnFloor(wing, floor);
  return Array.from(
    { length: count },
    (_, i) => `${wing}${floor}${String(i + 1).padStart(2, '0')}`,
  );
}

export function isValidFlat(flatId: string): boolean {
  const match = /^([A-F])(\d{3,4})$/.exec(flatId.toUpperCase());
  if (!match) return false;
  const wing = match[1] as Wing;
  const digits = match[2]!;
  const room = parseInt(digits.slice(-2), 10);
  const floor = parseInt(digits.slice(0, -2), 10);
  if (floor < FIRST_RESIDENTIAL_FLOOR) return false;
  return room >= 1 && room <= roomsOnFloor(wing, floor);
}
