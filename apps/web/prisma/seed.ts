import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { CardCategory, PrismaClient, Role } from '@prisma/client';
import { MOCK_USERS } from '../lib/legacy-users';
import { compactCardNumber } from '../lib/cards';
import { passwordForFlat } from '../lib/flat-credentials';
import { WING_CONFIGS } from '../lib/constants';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const ROLE_MAP: Record<string, Role> = {
  resident: Role.RESIDENT,
  chairman: Role.CHAIRMAN,
  secretary: Role.SECRETARY,
  treasurer: Role.TREASURER,
  committee: Role.COMMITTEE,
  security: Role.SECURITY,
  admin: Role.ADMIN,
  cook: Role.COOK,
};

/** "A201" -> { wing: "A", floor: 2, room: 1 }. Handles 3- and 4-digit flats. */
function parseFlat(flat: string): { wing: string; floor: number; room: number } | null {
  const match = /^([A-F])(\d{3,4})$/.exec(flat.toUpperCase());
  if (!match) return null;
  const [, wing, digits] = match;
  const room = parseInt(digits!.slice(-2), 10);
  const floor = parseInt(digits!.slice(0, -2), 10);
  if (!floor || !room) return null;
  return { wing: wing!, floor, room };
}

async function main() {
  console.log('Seeding Patel Heritage...');

  // ---- Flats -------------------------------------------------------------
  // Generated from WING_CONFIGS so every flat exists even if nobody is registered.
  const flatRows: { id: string; wing: string; floor: number; room: number }[] = [];
  for (const cfg of WING_CONFIGS) {
    for (let floor = 2; floor <= cfg.floors; floor++) {
      // B/C/D/E top floor has a single flat (see constants.ts).
      const rooms =
        ['B', 'C', 'D', 'E'].includes(cfg.wing) && floor === cfg.floors ? 1 : cfg.roomsPerFloor;
      for (let room = 1; room <= rooms; room++) {
        const id = `${cfg.wing}${floor}${String(room).padStart(2, '0')}`;
        flatRows.push({ id, wing: cfg.wing, floor, room });
      }
    }
  }
  await prisma.flat.createMany({ data: flatRows, skipDuplicates: true });
  console.log(`  flats: ${flatRows.length}`);

  // ---- Users -------------------------------------------------------------
  // Passwords in the legacy file were plaintext and shipped to the browser.
  // Everyone is seeded with a hash and mustChangePassword = true.
  const knownFlats = new Set(flatRows.map((f) => f.id));
  let created = 0;
  let staffAccounts = 0;

  // Decide who owns each flat's username before writing anything.
  //
  // Every flat must be reachable as "<flat> / <number>" (F1302 / 1302). Most
  // flats have exactly one account, but a couple carry both a resident and a
  // committee role — B301 has the chairman and an unrelated family. Where they
  // collide the resident keeps the flat username and the role account falls
  // back to its title, so no flat is ever left without a login.
  const flatUsernameOwner = new Map<string, string>();
  for (const legacy of MOCK_USERS) {
    const flatId = knownFlats.has(legacy.flat.toUpperCase())
      ? legacy.flat.toUpperCase()
      : null;
    if (!flatId) continue;

    const current = flatUsernameOwner.get(flatId);
    const isResident = ROLE_MAP[legacy.role] === Role.RESIDENT;
    if (!current || isResident) {
      // First writer wins, unless a resident turns up later and displaces a
      // role account.
      if (!current || isResident) flatUsernameOwner.set(flatId, legacy.email.toLowerCase());
    }
  }

  for (const legacy of MOCK_USERS) {
    const parsed = parseFlat(legacy.flat);
    const flatId = parsed && knownFlats.has(legacy.flat.toUpperCase())
      ? legacy.flat.toUpperCase()
      : null;

    // Chairman/secretary/security/cook rows carry role identity, not a residence.
    // Give them a deterministic email so re-running the seed is idempotent.
    // Residents sign in with their flat number and the same number without the
    // wing letter (A302 / 302). Staff keep their existing role passwords, since
    // they have no flat to derive one from.
    const plainPassword =
      flatId && flatUsernameOwner.get(flatId) === legacy.email.toLowerCase()
        ? (passwordForFlat(flatId) ?? legacy.password)
        : legacy.password;
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    // The flat number when this account owns it, otherwise the role title.
    const ownsFlatUsername =
      flatId && flatUsernameOwner.get(flatId) === legacy.email.toLowerCase();
    const username = (ownsFlatUsername ? flatId : legacy.role).toUpperCase();

    await prisma.user.upsert({
      where: { email: legacy.email.toLowerCase() },
      update: {
        name: legacy.name,
        phone: legacy.phone,
        username,
        passwordHash,
        role: ROLE_MAP[legacy.role] ?? Role.RESIDENT,
        flatId,
        tenantName: legacy.tenantName ?? null,
        tenantPhone: legacy.tenantPhone ?? null,
      },
      create: {
        name: legacy.name,
        email: legacy.email.toLowerCase(),
        phone: legacy.phone,
        username,
        passwordHash,
        role: ROLE_MAP[legacy.role] ?? Role.RESIDENT,
        flatId,
        tenantName: legacy.tenantName ?? null,
        tenantPhone: legacy.tenantPhone ?? null,
        mustChangePassword: true,
      },
    });
    created += 1;
    if (!flatId) staffAccounts += 1;
  }
  console.log(`  users: ${created} (${staffAccounts} non-resident role accounts)`);

  // ---- Gate devices ------------------------------------------------------
  // Serial numbers must be replaced with the real RS9N serials before go-live.
  await prisma.device.upsert({
    where: { serialNumber: 'RS9N-FRONT-001' },
    update: {},
    create: {
      serialNumber: 'RS9N-FRONT-001',
      name: 'Front Gate Reader',
      gate: 'FRONT',
      direction: 'IN',
    },
  });
  await prisma.device.upsert({
    where: { serialNumber: 'RS9N-BACK-001' },
    update: {},
    create: {
      serialNumber: 'RS9N-BACK-001',
      name: 'Back Gate Reader',
      gate: 'BACK',
      direction: 'UNKNOWN',
    },
  });
  console.log('  devices: 2 (placeholder serials — replace with real RS9N serials)');

  // ---- Test cards --------------------------------------------------------
  // Predictable numbers so the simulator, the dev control panel and the docs
  // all refer to the same cards, and so a database reset needs no manual SQL.
  const testCards = [
    {
      cardNumber: '0000000001',
      personName: 'Ramesh Kumar',
      category: CardCategory.NEWSPAPER,
      mobileNumber: '9820000001',
      isActive: true,
    },
    {
      cardNumber: '0000000002',
      personName: 'Sunita Devi',
      category: CardCategory.HOUSE_HELP,
      mobileNumber: '9820000002',
      isActive: true,
      allowedFromHour: 6,
      allowedToHour: 20,
    },
    {
      cardNumber: '0000000003',
      personName: 'Mahesh Patil',
      category: CardCategory.MILK,
      isActive: false, // disabled — must never read as authorized (Rule 4)
    },
    {
      cardNumber: '0000000004',
      personName: 'Anil Sharma',
      category: CardCategory.DELIVERY_REGULAR,
      isActive: true,
      validUntil: new Date('2020-01-01T00:00:00Z'), // long expired
    },
  ];

  for (const card of testCards) {
    await prisma.accessCard.upsert({
      where: { cardNumber: card.cardNumber },
      update: {
        personName: card.personName,
        category: card.category,
        isActive: card.isActive,
        validUntil: card.validUntil ?? null,
        allowedFromHour: card.allowedFromHour ?? null,
        allowedToHour: card.allowedToHour ?? null,
      },
      create: {
        ...card,
        cardNumberCompact: compactCardNumber(card.cardNumber),
        validUntil: card.validUntil ?? null,
        allowedFromHour: card.allowedFromHour ?? null,
        allowedToHour: card.allowedToHour ?? null,
      },
    });
  }
  console.log(`  test cards: ${testCards.length} (1 active, 1 hours-limited, 1 disabled, 1 expired)`);

  console.log('\nDone. Seed is idempotent — running it again is safe.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
