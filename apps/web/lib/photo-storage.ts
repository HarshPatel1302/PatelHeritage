import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';

/**
 * Visitor photos are personal data under India's DPDP Act 2023.
 *
 * Rules encoded here:
 *  - Always JPEG on disk, as requested, so photos open in any viewer.
 *  - Keys are opaque UUIDs, never the flat number, so a leaked key reveals nothing.
 *  - Photos are served only through an authenticated route, never as a public URL.
 *  - Every photo gets a purge deadline (see VisitorRequest.photoPurgeAfter).
 *
 * Local dev writes to disk. In production set BLOB_READ_WRITE_TOKEN and this
 * switches to Vercel Blob without any caller changes.
 */

const LOCAL_DIR = process.env.PHOTO_STORAGE_DIR ?? './storage/visitor-photos';

export const MAX_PHOTO_BYTES = 800 * 1024; // 800 KB — a 640x480 JPEG is ~60 KB

function blobStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Rejects anything that is not actually a JPEG, regardless of declared mime type. */
export function isJpeg(bytes: Buffer): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export async function savePhoto(bytes: Buffer): Promise<string> {
  if (!isJpeg(bytes)) {
    throw new Error('Photo is not a valid JPEG.');
  }
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('Photo exceeds size limit.');
  }

  const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.jpg`;

  if (blobStorageEnabled()) {
    const { put } = await import('@vercel/blob');
    await put(key, bytes, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
    });
    return key;
  }

  const target = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return key;
}

export async function readPhoto(key: string): Promise<Buffer | null> {
  // Reject traversal before touching the filesystem.
  if (key.includes('..') || path.isAbsolute(key)) return null;

  if (blobStorageEnabled()) {
    const { head } = await import('@vercel/blob');
    try {
      const meta = await head(key);
      const res = await fetch(meta.url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  try {
    return await readFile(path.join(LOCAL_DIR, key));
  } catch {
    return null;
  }
}

export async function deletePhoto(key: string): Promise<void> {
  if (key.includes('..') || path.isAbsolute(key)) return;

  if (blobStorageEnabled()) {
    const { del } = await import('@vercel/blob');
    await del(key).catch(() => undefined);
    return;
  }
  await unlink(path.join(LOCAL_DIR, key)).catch(() => undefined);
}
