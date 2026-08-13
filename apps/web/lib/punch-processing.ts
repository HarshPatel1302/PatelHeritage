import {
  CardMatchMode,
  ParseStatus,
  PunchDirection,
  PunchResult,
  type AccessCard,
} from '@prisma/client';
import { createHash } from 'crypto';
import { resolveDirection, type ParsedPunch } from './adms';
import { compactCardNumber, normalizeCardNumber } from './cards';
import { prisma } from './db';

/**
 * Turning what the RS9N sent into something the guard can act on.
 *
 *   raw body ──► ALWAYS stored ──► parse attempt ──► card lookup ──► outcome
 *
 * The ordering matters: the raw record is written first and independently, so a
 * parser that does not yet match the physical unit cannot cause data loss
 * (Rule 5). If parsing fails we still keep the bytes, still dedupe them, and
 * still surface the attempt to the guard as PARSE_ERROR.
 */

/**
 * Deterministic idempotency key.
 *
 * ADMS devices resend anything they did not see acknowledged, so the same tap
 * can arrive many times and must collapse to one row (Rule 8). Two genuine taps
 * by the same person at different seconds must NOT collapse (they differ in
 * timestamp), and two different people tapping in the same second must not
 * either (they differ in card number).
 *
 * For records we could not parse there is no card or timestamp to key on, so we
 * fall back to hashing the raw line itself. That still absorbs verbatim retries
 * while keeping genuinely different payloads distinct.
 */
export function punchFingerprint(input: {
  deviceSerial: string;
  cardNumber?: string | null;
  punchedAt?: Date | null;
  rawLine: string;
}): string {
  const parsable = input.cardNumber && input.punchedAt;
  const material = parsable
    ? ['v1', input.deviceSerial, input.cardNumber, input.punchedAt!.toISOString()].join('|')
    : ['v1-raw', input.deviceSerial, input.rawLine].join('|');

  return createHash('sha256').update(material).digest('hex').slice(0, 40);
}

export interface CardResolution {
  card: AccessCard | null;
  matchMode: CardMatchMode;
  /** Set when the compact fallback found more than one candidate. */
  ambiguous: boolean;
}

/**
 * Find the registered card for a number the reader reported.
 *
 * Exact match wins. Only if nothing matches exactly do we retry ignoring
 * leading zeroes, and only when that yields exactly one card — an ambiguous
 * padding match is refused rather than guessed, because admitting the wrong
 * person is worse than making the guard check manually.
 */
export async function resolveCard(rawCardNumber: string): Promise<CardResolution> {
  const cardNumber = normalizeCardNumber(rawCardNumber);

  const exact = await prisma.accessCard.findUnique({ where: { cardNumber } });
  if (exact) return { card: exact, matchMode: CardMatchMode.EXACT, ambiguous: false };

  const compact = compactCardNumber(cardNumber);
  const candidates = await prisma.accessCard.findMany({
    where: { cardNumberCompact: compact },
    take: 2,
  });

  if (candidates.length === 1) {
    return { card: candidates[0]!, matchMode: CardMatchMode.ZERO_PADDED, ambiguous: false };
  }
  return {
    card: null,
    matchMode: CardMatchMode.NONE,
    ambiguous: candidates.length > 1,
  };
}

/**
 * Decide the outcome of a tap.
 *
 * Note what this does NOT do: it never opens anything. The MVP is
 * identify → validate → log → show the guard (Rule 10). A future relay would
 * read PunchResult.AUTHORIZED and act on it, without changing this function.
 */
export function classifyPunch(card: AccessCard | null, punchedAt: Date): PunchResult {
  if (!card) return PunchResult.UNKNOWN_CARD;
  if (!card.isActive) return PunchResult.INACTIVE_CARD; // Rule 4
  if (card.validUntil && card.validUntil < punchedAt) return PunchResult.EXPIRED_CARD;
  if (card.validFrom && card.validFrom > punchedAt) return PunchResult.NOT_YET_VALID;

  if (card.allowedFromHour !== null && card.allowedToHour !== null) {
    const hour = punchedAt.getHours();
    if (hour < card.allowedFromHour || hour >= card.allowedToHour) {
      return PunchResult.OUTSIDE_HOURS;
    }
  }
  return PunchResult.AUTHORIZED;
}

export interface IngestContext {
  deviceSerial: string;
  deviceDirection: PunchDirection;
  tableName: string | null;
  rawBody: string;
  queryString: string | null;
  sourceIp: string | null;
}

export interface IngestOutcome {
  fingerprint: string;
  duplicate: boolean;
  parseStatus: ParseStatus;
  punchId: string | null;
  result: PunchResult | null;
}

/**
 * Store one device line. Safe to call with a line that failed to parse.
 *
 * Returns duplicate:true when this exact record has been seen before, which is
 * the normal case during a device retry storm and is not an error.
 */
export async function ingestRecord(
  ctx: IngestContext,
  parsed: ParsedPunch | null,
  rawLine: string,
  parseError: string | null,
): Promise<IngestOutcome> {
  const cardNumber = parsed ? normalizeCardNumber(parsed.cardNumber) : null;
  const punchedAt = parsed?.punchedAt ?? null;

  const fingerprint = punchFingerprint({
    deviceSerial: ctx.deviceSerial,
    cardNumber,
    punchedAt,
    rawLine,
  });

  // Retry check first — cheap, and avoids re-resolving cards for records we
  // have already processed.
  const seen = await prisma.deviceRawRecord.findUnique({
    where: { fingerprint },
    select: { id: true, punchEventId: true, parseStatus: true },
  });
  if (seen) {
    return {
      fingerprint,
      duplicate: true,
      parseStatus: seen.parseStatus,
      punchId: seen.punchEventId,
      result: null,
    };
  }

  // ---- Unparsable: keep the bytes, tell the guard, do not pretend ----------
  if (!parsed || !cardNumber || !punchedAt) {
    const record = await prisma.deviceRawRecord.create({
      data: {
        deviceSerial: ctx.deviceSerial,
        tableName: ctx.tableName,
        rawLine,
        rawBody: ctx.rawBody,
        queryString: ctx.queryString,
        sourceIp: ctx.sourceIp,
        parseStatus: ParseStatus.FAILED,
        parseError: parseError ?? 'Could not extract card number and timestamp',
        fingerprint,
      },
    });

    // A tap we could not read is still an entry attempt the guard must see.
    const punch = await prisma.punchEvent.create({
      data: {
        deviceSerial: ctx.deviceSerial,
        cardNumber: cardNumber ?? '',
        punchedAt: punchedAt ?? new Date(),
        direction: PunchDirection.UNKNOWN,
        result: PunchResult.PARSE_ERROR,
        matchMode: CardMatchMode.NONE,
        fingerprint,
      },
    });
    await prisma.deviceRawRecord.update({
      where: { id: record.id },
      data: { punchEventId: punch.id },
    });

    return {
      fingerprint,
      duplicate: false,
      parseStatus: ParseStatus.FAILED,
      punchId: punch.id,
      result: PunchResult.PARSE_ERROR,
    };
  }

  // ---- Parsed: resolve the person and classify ----------------------------
  const { card, matchMode, ambiguous } = await resolveCard(cardNumber);
  const result = classifyPunch(card, punchedAt);

  const previous = card
    ? await prisma.punchEvent.findFirst({
        where: { cardId: card.id },
        orderBy: { punchedAt: 'desc' },
        select: { direction: true },
      })
    : null;

  const direction = resolveDirection(
    ctx.deviceDirection,
    parsed.statusCode,
    previous?.direction ?? null,
  );

  const punch = await prisma.punchEvent.create({
    data: {
      deviceSerial: ctx.deviceSerial,
      cardNumber,
      cardId: card?.id ?? null,
      matchMode,
      direction,
      punchedAt,
      verifyMode: parsed.verifyMode,
      result,
      // Copied, not joined, so the log stays truthful if the card is edited later.
      personName: card?.personName ?? null,
      category: card?.category ?? null,
      fingerprint,
    },
  });

  await prisma.deviceRawRecord.create({
    data: {
      deviceSerial: ctx.deviceSerial,
      tableName: ctx.tableName,
      rawLine,
      rawBody: ctx.rawBody,
      queryString: ctx.queryString,
      sourceIp: ctx.sourceIp,
      parseStatus: ParseStatus.PARSED,
      parseError: ambiguous
        ? 'Multiple cards share this number ignoring leading zeroes; treated as unknown'
        : null,
      parsedCardNumber: cardNumber,
      parsedPunchedAt: punchedAt,
      fingerprint,
      punchEventId: punch.id,
    },
  });

  return {
    fingerprint,
    duplicate: false,
    parseStatus: ParseStatus.PARSED,
    punchId: punch.id,
    result,
  };
}

/** Human wording for the guard console and the audit log. */
export const PUNCH_RESULT_LABELS: Record<PunchResult, string> = {
  AUTHORIZED: 'Authorized',
  UNKNOWN_CARD: 'Unknown card',
  INACTIVE_CARD: 'Card disabled',
  EXPIRED_CARD: 'Card expired',
  NOT_YET_VALID: 'Card not yet valid',
  OUTSIDE_HOURS: 'Outside permitted hours',
  PARSE_ERROR: 'Unreadable card data',
};
