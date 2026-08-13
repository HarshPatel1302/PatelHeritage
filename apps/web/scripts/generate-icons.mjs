/**
 * Generates the PWA icons without any image dependency.
 *
 * The machine building this project has no ImageMagick/librsvg/PIL, and pulling
 * a raster library in just for two static files is not worth it. Node ships
 * zlib, and a PNG is just zlib-compressed scanlines plus a CRC, so we draw the
 * mark by hand: a gold tower on the app's slate background.
 *
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const BG = [2, 6, 23]; // slate-950
const GOLD = [245, 158, 11]; // amber-500
const GOLD_DIM = [180, 116, 8];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, pixelAt) {
  // Raw scanlines, each prefixed with filter byte 0 (none).
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelAt(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** A tower with lit windows — reads at 48px, which is what a notification badge shows. */
function drawIcon(size) {
  const s = (v) => Math.round(v * size);

  const towerLeft = s(0.34);
  const towerRight = s(0.66);
  const towerTop = s(0.2);
  const towerBottom = s(0.82);

  const roofTop = s(0.12);
  const roofLeft = s(0.28);
  const roofRight = s(0.72);

  const baseLeft = s(0.24);
  const baseRight = s(0.76);
  const baseTop = s(0.82);
  const baseBottom = s(0.88);

  return (x, y) => {
    // Roof: a triangle tapering to the tower width.
    if (y >= roofTop && y < towerTop) {
      const t = (y - roofTop) / Math.max(1, towerTop - roofTop);
      const left = roofLeft + (towerLeft - roofLeft) * (1 - t);
      const right = roofRight + (towerRight - roofRight) * (1 - t);
      const mid = size / 2;
      const halfWidth = ((right - left) / 2) * t + (roofRight - roofLeft) / 2 - ((roofRight - roofLeft) / 2) * t;
      if (x >= mid - halfWidth && x <= mid + halfWidth) return GOLD;
    }

    // Plinth
    if (y >= baseTop && y < baseBottom && x >= baseLeft && x < baseRight) return GOLD;

    // Tower body with a grid of windows punched out.
    if (y >= towerTop && y < towerBottom && x >= towerLeft && x < towerRight) {
      const cell = Math.max(2, Math.round(size * 0.09));
      const gap = Math.max(1, Math.round(size * 0.035));
      const localX = x - towerLeft;
      const localY = y - towerTop;
      const inWindowX = localX % cell < cell - gap;
      const inWindowY = localY % cell < cell - gap;
      const marginX = localX > gap && localX < towerRight - towerLeft - gap;
      const marginY = localY > gap && localY < towerBottom - towerTop - gap;
      if (inWindowX && inWindowY && marginX && marginY) return BG;
      return GOLD;
    }

    // Subtle inner ring so the mark does not float in an empty square.
    const cx = size / 2;
    const cy = size / 2;
    const dist = Math.hypot(x - cx, y - cy);
    if (dist > size * 0.455 && dist < size * 0.475) return GOLD_DIM;

    return BG;
  };
}

mkdirSync(OUT_DIR, { recursive: true });

for (const size of [192, 512]) {
  writeFileSync(join(OUT_DIR, `icon-${size}.png`), encodePng(size, drawIcon(size)));
  console.log(`wrote icons/icon-${size}.png`);
}
writeFileSync(join(OUT_DIR, 'badge.png'), encodePng(96, drawIcon(96)));
console.log('wrote icons/badge.png');

/** Doorbell mark for the owner app — distinct from the society tower at a glance. */
function drawOwnerIcon(size) {
  const s = (v) => Math.round(v * size);
  const cx = size / 2;

  const bellTop = s(0.24);
  const bellBottom = s(0.66);
  const bellHalfTop = s(0.11);
  const bellHalfBottom = s(0.26);

  return (x, y) => {
    // Clapper
    const clapperY = s(0.76);
    if (Math.hypot(x - cx, y - clapperY) < s(0.065)) return GOLD;

    // Rim
    if (y >= bellBottom && y < bellBottom + s(0.05) && Math.abs(x - cx) <= bellHalfBottom) {
      return GOLD;
    }

    // Body: a dome widening towards the rim.
    if (y >= bellTop && y < bellBottom) {
      const t = (y - bellTop) / (bellBottom - bellTop);
      const half = bellHalfTop + (bellHalfBottom - bellHalfTop) * Math.sqrt(t);
      if (Math.abs(x - cx) <= half) return GOLD;
    }

    // Handle
    if (y >= s(0.16) && y < bellTop && Math.hypot(x - cx, y - s(0.2)) < s(0.055)) return GOLD;

    const dist = Math.hypot(x - cx, y - size / 2);
    if (dist > size * 0.455 && dist < size * 0.475) return GOLD_DIM;

    return BG;
  };
}

for (const size of [192, 512]) {
  writeFileSync(join(OUT_DIR, `owner-${size}.png`), encodePng(size, drawOwnerIcon(size)));
  console.log(`wrote icons/owner-${size}.png`);
}
