import { PunchDirection } from '@prisma/client';

/**
 * ADMS ("push SDK") protocol support for the Realtime RS9N.
 *
 * How the device talks to us:
 *   1. GET  /iclock/cdata?SN=<serial>&options=all&pushver=...   -> handshake
 *   2. GET  /iclock/getrequest?SN=<serial>                      -> command poll
 *   3. POST /iclock/cdata?SN=<serial>&table=ATTLOG&Stamp=...    -> punch records
 *   4. POST /iclock/devicecmd?SN=<serial>                       -> command results
 *
 * The device retries forever unless the body is exactly "OK", so every handler
 * must return that on success.
 *
 * ATTLOG payloads are tab-separated lines. The field order below is the one
 * ZK-derived firmware (which Realtime uses) sends:
 *
 *   PIN \t YYYY-MM-DD HH:MM:SS \t status \t verify \t workcode \t reserved...
 *
 * IMPORTANT: this is the documented shape, not something confirmed against your
 * physical unit. Every punch is therefore stored with its raw line intact
 * (PunchEvent.rawLine) so that if the RS9N words things differently, the log can
 * be re-parsed after the fact instead of losing entries.
 */

export interface ParsedPunch {
  cardNumber: string;
  punchedAt: Date;
  /** Device "status" column — on most units 0 = check-in, 1 = check-out. */
  statusCode: number | null;
  verifyMode: number | null;
  rawLine: string;
}

/** ZK-style timestamps are local time with no zone marker. */
function parseDeviceTimestamp(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match.map(Number) as unknown as number[];
  const date = new Date(y!, mo! - 1, d!, h!, mi!, s!);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Non-empty lines of a device body, preserving their original text. */
export function splitLines(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
}

/** Splits a record into columns, tolerating tabs, runs of spaces, or commas. */
function splitColumns(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
  if (line.includes(',')) return line.split(',').map((c) => c.trim());
  return line.split(/\s{2,}|\s+/).map((c) => c.trim());
}

const NUMERIC = /^\d+$/;

/**
 * Parse ATTLOG records.
 *
 * The physical RS9N's exact field order is UNCONFIRMED, so this deliberately
 * does not hard-code column positions beyond a sensible preference:
 *
 *   - the timestamp is whichever column parses as a date/time, wherever it sits;
 *   - the card identifier is the first remaining non-empty column;
 *   - status/verify are read from their conventional positions when those
 *     columns exist and are numeric, and are simply null when they do not.
 *
 * Anything that still cannot yield a card number AND a timestamp returns no
 * punch — and the caller stores the raw line as a PARSE_ERROR rather than
 * dropping it, so the real payload can be inspected on /admin/devices.
 */
export function parseAttlog(body: string): ParsedPunch[] {
  const punches: ParsedPunch[] = [];

  for (const rawLine of splitLines(body)) {
    const line = rawLine.trim();
    const cols = splitColumns(line);
    if (cols.length < 2) continue;

    // Locate the timestamp wherever the firmware chose to put it.
    let timestampIndex = -1;
    let punchedAt: Date | null = null;
    for (let i = 0; i < cols.length; i++) {
      const candidate = parseDeviceTimestamp(cols[i] ?? '');
      if (candidate) {
        timestampIndex = i;
        punchedAt = candidate;
        break;
      }
    }
    // Space-separated firmware splits "2026-08-10 07:42:15" into two columns.
    if (!punchedAt) {
      for (let i = 0; i < cols.length - 1; i++) {
        const candidate = parseDeviceTimestamp(`${cols[i]} ${cols[i + 1]}`);
        if (candidate) {
          timestampIndex = i;
          punchedAt = candidate;
          break;
        }
      }
    }
    if (!punchedAt) continue;

    const cardNumber = cols.find((c, i) => i !== timestampIndex && c.length > 0);
    if (!cardNumber) continue;

    const numberAt = (index: number): number | null => {
      const value = cols[index];
      if (value === undefined || value === '' || !NUMERIC.test(value)) return null;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    punches.push({
      cardNumber,
      punchedAt,
      statusCode: numberAt(timestampIndex + 1),
      verifyMode: numberAt(timestampIndex + 2),
      rawLine: line,
    });
  }

  return punches;
}

/**
 * Direction for a punch.
 *
 * A device configured as a dedicated entry or exit reader wins outright. When
 * the unit is bidirectional we fall back to the status column, and finally to
 * alternating from the card's previous punch — which is how attendance systems
 * conventionally resolve it.
 */
export function resolveDirection(
  deviceDirection: PunchDirection,
  statusCode: number | null,
  previousDirection: PunchDirection | null,
): PunchDirection {
  if (deviceDirection === PunchDirection.IN || deviceDirection === PunchDirection.OUT) {
    return deviceDirection;
  }
  if (statusCode === 0) return PunchDirection.IN;
  if (statusCode === 1) return PunchDirection.OUT;
  if (previousDirection === PunchDirection.IN) return PunchDirection.OUT;
  if (previousDirection === PunchDirection.OUT) return PunchDirection.IN;
  return PunchDirection.IN;
}

/**
 * Handshake reply. These keys tell the device how to behave; the values below
 * ask it to push attendance immediately and skip data we do not consume.
 */
export function handshakeResponse(serial: string): string {
  return [
    `GET OPTION FROM: ${serial}`,
    'ATTLOGStamp=None',
    'OPERLOGStamp=None',
    'ATTPHOTOStamp=None',
    'ErrorDelay=30',
    'Delay=10',
    'TransTimes=00:00;12:00',
    'TransInterval=1',
    'TransFlag=1000000000',
    'Realtime=1',
    'Encrypt=0',
    'TimeZone=5.5',
  ].join('\n');
}
