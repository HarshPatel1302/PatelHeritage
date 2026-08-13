import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deletePhoto } from '@/lib/photo-storage';
import { expireStaleRequests } from '@/lib/visitor-requests';

/**
 * Housekeeping, run on a schedule.
 *
 * 1. Expire any request nobody answered (belt and braces — the read paths
 *    already do this, so correctness never depends on this job running).
 * 2. Delete visitor photographs past their retention deadline.
 *
 * (2) is the one that matters legally. Under India's DPDP Act 2023 personal
 * data must not be kept longer than the purpose requires, and a photograph of
 * someone at a gate stops serving any purpose once the visit is long over.
 * PHOTO_RETENTION_DAYS (default 30) sets the window; the committee can shorten
 * it but should not extend it without a reason they can defend.
 *
 * On Vercel, add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/sweep", "schedule": "0 3 * * *" }] }
 * and set CRON_SECRET so nobody else can trigger it.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  const expired = await expireStaleRequests();

  const duePhotos = await prisma.visitorRequest.findMany({
    where: { photoKey: { not: null }, photoPurgeAfter: { lt: new Date() } },
    select: { id: true, photoKey: true },
    take: 500,
  });

  let purged = 0;
  for (const row of duePhotos) {
    if (!row.photoKey) continue;
    await deletePhoto(row.photoKey);
    // Clear the reference only after the bytes are gone, so a crash mid-way
    // leaves a retryable record rather than an orphaned file we can never find.
    await prisma.visitorRequest.update({
      where: { id: row.id },
      data: { photoKey: null, photoPurgeAfter: null },
    });
    purged += 1;
  }

  return NextResponse.json({ expired, photosPurged: purged, ranAt: new Date().toISOString() });
}
