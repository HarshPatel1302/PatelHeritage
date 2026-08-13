'use client';

import { CheckCircle2, HelpCircle, Slash, XOctagon, AlertTriangle, Clock } from 'lucide-react';
import type { PunchResult } from '@prisma/client';
import { categoryLabel } from '@/lib/cards';

export interface CardEvent {
  id: string;
  cardNumberMasked: string | null;
  personName: string | null;
  category: string | null;
  result: PunchResult;
  matchMode: string;
  direction: string;
  punchedAt: string;
  createdAt: string;
  deviceName: string;
  gate: string | null;
}

/**
 * Visual language for a card tap.
 *
 * A guard glances at this from a metre away while someone waits, so the state
 * is carried by colour, icon and a single word — not by reading a table.
 * Nothing here opens a gate; the guard reads it and decides (Rule 10).
 */
const RESULT_STYLES: Record<
  PunchResult,
  { icon: typeof CheckCircle2; label: string; border: string; bg: string; text: string; mark: string }
> = {
  AUTHORIZED: {
    icon: CheckCircle2,
    label: 'AUTHORIZED',
    border: 'border-emerald-400/60',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    mark: '✓',
  },
  UNKNOWN_CARD: {
    icon: HelpCircle,
    label: 'UNKNOWN CARD',
    border: 'border-red-400/60',
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    mark: '✗',
  },
  INACTIVE_CARD: {
    icon: Slash,
    label: 'CARD DISABLED',
    border: 'border-orange-400/60',
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    mark: '!',
  },
  EXPIRED_CARD: {
    icon: XOctagon,
    label: 'CARD EXPIRED',
    border: 'border-orange-400/60',
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    mark: '!',
  },
  NOT_YET_VALID: {
    icon: Clock,
    label: 'CARD NOT YET VALID',
    border: 'border-orange-400/60',
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    mark: '!',
  },
  OUTSIDE_HOURS: {
    icon: Clock,
    label: 'OUTSIDE PERMITTED HOURS',
    border: 'border-amber-400/60',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    mark: '!',
  },
  PARSE_ERROR: {
    icon: AlertTriangle,
    label: 'UNREADABLE CARD DATA',
    border: 'border-amber-400/60',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    mark: '?',
  },
};

export function resultStyle(result: PunchResult) {
  return RESULT_STYLES[result] ?? RESULT_STYLES.PARSE_ERROR;
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour12: false });
}

/** The large banner for the most recent tap. */
export function LatestCardEvent({ event }: { event: CardEvent }) {
  const style = resultStyle(event.result);
  const Icon = style.icon;

  return (
    <div className={`rounded-2xl border-2 p-6 ${style.border} ${style.bg}`}>
      <div className="flex items-center gap-5">
        <Icon className={`h-16 w-16 shrink-0 ${style.text}`} strokeWidth={2.5} />
        <div className="min-w-0 flex-1">
          <p className={`text-3xl font-black tracking-tight ${style.text}`}>{style.label}</p>

          {event.personName ? (
            <>
              <p className="mt-1 truncate text-2xl font-bold text-white">{event.personName}</p>
              <p className="text-lg text-white/70">{categoryLabel(event.category as never)}</p>
            </>
          ) : (
            <p className="mt-1 text-xl text-white/70">
              {event.result === 'PARSE_ERROR'
                ? 'Card data could not be read — raw event saved'
                : 'Not registered to any person'}
            </p>
          )}

          <p className="mt-2 text-lg text-white/60">
            {event.cardNumberMasked && <>Card {event.cardNumberMasked} · </>}
            {timeOf(event.punchedAt)} · {event.deviceName}
          </p>

          {event.matchMode === 'ZERO_PADDED' && (
            <p className="mt-1 text-sm text-amber-200/80">
              Matched ignoring leading zeroes — check the card number is registered exactly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Compact row for the scrolling history. */
export function CardEventRow({ event }: { event: CardEvent }) {
  const style = resultStyle(event.result);

  return (
    <div className={`flex items-center gap-4 border-l-4 px-4 py-3 ${style.border} ${style.bg}`}>
      <span className={`w-6 text-center text-2xl font-black ${style.text}`}>{style.mark}</span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold text-white">
          {event.personName ?? 'Unknown person'}
          {event.category && (
            <span className="ml-2 text-base font-normal text-white/50">
              {categoryLabel(event.category as never)}
            </span>
          )}
        </p>
        <p className="text-sm text-white/50">
          {style.label}
          {event.cardNumberMasked && <> · {event.cardNumberMasked}</>}
          {' · '}
          {event.direction === 'OUT' ? 'Exit' : 'Entry'}
        </p>
      </div>

      <span className="shrink-0 font-mono text-lg tabular-nums text-white/70">
        {timeOf(event.punchedAt)}
      </span>
    </div>
  );
}
