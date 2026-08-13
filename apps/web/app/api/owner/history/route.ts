import { RequestStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { expireStaleRequests } from '@/lib/visitor-requests';

/**
 * Visitor history for the signed-in flat, grouped by day.
 *
 * Always scoped to the session's own flat — unlike the guard feeds, there is no
 * privileged branch here. A committee member using the owner app sees their own
 * home's visitors, not the whole society's.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  if (!session.flatId) {
    return NextResponse.json(
      { error: 'This account is not attached to a flat.' },
      { status: 403 },
    );
  }

  await expireStaleRequests();

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get('days') ?? 30), 1), 180);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.visitorRequest.findMany({
    where: { flatId: session.flatId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 400,
    select: {
      id: true,
      visitorName: true,
      purpose: true,
      status: true,
      photoKey: true,
      createdAt: true,
      respondedAt: true,
      overriddenByGuard: true,
      source: true,
    },
  });

  // Group in the server's local timezone so "today" matches the resident's day.
  const byDay = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = new Date(row.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
    const bucket = byDay.get(key) ?? [];
    bucket.push(row);
    byDay.set(key, bucket);
  }

  const groups = [...byDay.entries()].map(([date, entries]) => ({
    date,
    total: entries.length,
    approved: entries.filter((e) => e.status === RequestStatus.APPROVED).length,
    denied: entries.filter((e) => e.status === RequestStatus.DENIED).length,
    missed: entries.filter((e) => e.status === RequestStatus.EXPIRED).length,
    visits: entries.map((e) => ({
      id: e.id,
      visitorName: e.visitorName,
      purpose: e.purpose,
      status: e.status,
      photoUrl: e.photoKey ? `/api/photos/${e.id}` : null,
      createdAt: e.createdAt.toISOString(),
      respondedAt: e.respondedAt?.toISOString() ?? null,
      overriddenByGuard: e.overriddenByGuard,
    })),
  }));

  return NextResponse.json({
    flatId: session.flatId,
    days,
    totals: {
      all: rows.length,
      approved: rows.filter((r) => r.status === RequestStatus.APPROVED).length,
      denied: rows.filter((r) => r.status === RequestStatus.DENIED).length,
      missed: rows.filter((r) => r.status === RequestStatus.EXPIRED).length,
    },
    groups,
  });
}
