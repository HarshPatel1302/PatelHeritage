/**
 * Unit tests for the logic that decides who gets in.
 *
 * These use node:test rather than adding a test framework — the functions under
 * test are pure, so a runner is all that is needed. Run: npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseAttlog, resolveDirection, splitLines } from '../lib/adms';
import {
  compactCardNumber,
  isValidCardNumber,
  maskCardNumber,
  normalizeCardNumber,
} from '../lib/cards';
import { classifyPunch, punchFingerprint } from '../lib/punch-processing';
import { canTransition } from '../lib/visitor-requests';

// Minimal stand-in for an AccessCard row; classifyPunch only reads these fields.
function card(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    cardNumber: '0000000001',
    cardNumberCompact: '1',
    personName: 'Ramesh Kumar',
    category: 'NEWSPAPER',
    isActive: true,
    validFrom: null,
    validUntil: null,
    allowedFromHour: null,
    allowedToHour: null,
    ...overrides,
  } as never;
}

describe('card number normalisation', () => {
  it('preserves leading zeroes (Rule 7)', () => {
    assert.equal(normalizeCardNumber('0000012345'), '0000012345');
    assert.notEqual(normalizeCardNumber('0000012345'), '12345');
  });

  it('strips separators and whitespace, and uppercases', () => {
    assert.equal(normalizeCardNumber('  0000-1234 '), '00001234');
    assert.equal(normalizeCardNumber('ab:cd_ef'), 'ABCDEF');
    assert.equal(normalizeCardNumber('12 34'), '1234');
  });

  it('produces a compact form for the padding-tolerant fallback', () => {
    assert.equal(compactCardNumber('0000012345'), '12345');
    assert.equal(compactCardNumber('12345'), '12345');
  });

  it('does not collapse an all-zero card to an empty string', () => {
    assert.equal(compactCardNumber('0000'), '0');
  });

  it('rejects unusable identifiers', () => {
    assert.equal(isValidCardNumber('0000012345'), true);
    assert.equal(isValidCardNumber(''), false);
    assert.equal(isValidCardNumber('   '), false);
    assert.equal(isValidCardNumber('card#1'), false);
    assert.equal(isValidCardNumber('x'.repeat(65)), false);
  });

  it('masks all but the last four digits for the shared guard screen', () => {
    assert.equal(maskCardNumber('0000001234'), '••••1234');
    assert.equal(maskCardNumber('12'), '12');
  });
});

describe('ATTLOG parsing', () => {
  const at = '2026-08-10 07:42:15';

  it('parses the documented tab-separated layout', () => {
    const [punch] = parseAttlog(`0000001234\t${at}\t0\t3\t0\t0\t0`);
    assert.ok(punch);
    assert.equal(punch.cardNumber, '0000001234');
    assert.equal(punch.punchedAt.getFullYear(), 2026);
    assert.equal(punch.punchedAt.getHours(), 7);
    assert.equal(punch.punchedAt.getMinutes(), 42);
    assert.equal(punch.statusCode, 0);
    assert.equal(punch.verifyMode, 3);
  });

  it('parses multiple records in one body', () => {
    const body = `0000001234\t${at}\t0\t3\n0000005678\t2026-08-10 07:43:00\t1\t3`;
    const punches = parseAttlog(body);
    assert.equal(punches.length, 2);
    assert.equal(punches[1]!.cardNumber, '0000005678');
  });

  it('survives a different field order, since the real RS9N layout is unconfirmed', () => {
    // Timestamp first, card second — the opposite of what we assume.
    const [punch] = parseAttlog(`${at}\t0000001234\t0`);
    assert.ok(punch);
    assert.equal(punch.cardNumber, '0000001234');
    assert.equal(punch.punchedAt.getHours(), 7);
  });

  it('accepts comma- and space-separated firmware variants', () => {
    const [comma] = parseAttlog(`0000001234,${at},0,3`);
    assert.equal(comma?.cardNumber, '0000001234');

    const [spaced] = parseAttlog(`0000001234  ${at}  0  3`);
    assert.equal(spaced?.cardNumber, '0000001234');
  });

  it('returns nothing for a record it cannot understand', () => {
    assert.equal(parseAttlog('garbage ~~ not an attlog record').length, 0);
    assert.equal(parseAttlog('').length, 0);
    assert.equal(parseAttlog('onlyonefield').length, 0);
  });

  it('ignores blank lines rather than treating them as records', () => {
    const punches = parseAttlog(`\n\n0000001234\t${at}\t0\t3\n\n`);
    assert.equal(punches.length, 1);
  });

  it('splitLines keeps every non-empty line for raw storage', () => {
    assert.deepEqual(splitLines('a\n\nb\r\nc\n'), ['a', 'b', 'c']);
  });
});

describe('punch fingerprint (deduplication)', () => {
  const base = {
    deviceSerial: 'RS9N-FRONT-001',
    cardNumber: '0000001234',
    punchedAt: new Date('2026-08-10T07:42:15Z'),
    rawLine: 'raw',
  };

  it('is stable, so a device retry collapses onto one event (Rule 8)', () => {
    assert.equal(punchFingerprint(base), punchFingerprint({ ...base }));
  });

  it('differs for a genuine second tap at another time', () => {
    const later = { ...base, punchedAt: new Date('2026-08-10T07:43:15Z') };
    assert.notEqual(punchFingerprint(base), punchFingerprint(later));
  });

  it('differs for two people tapping in the same second', () => {
    const other = { ...base, cardNumber: '0000009999' };
    assert.notEqual(punchFingerprint(base), punchFingerprint(other));
  });

  it('differs across readers', () => {
    const backGate = { ...base, deviceSerial: 'RS9N-BACK-001' };
    assert.notEqual(punchFingerprint(base), punchFingerprint(backGate));
  });

  it('falls back to the raw line when nothing could be parsed', () => {
    const unparsed = { deviceSerial: 'RS9N-FRONT-001', rawLine: 'garbage' };
    const same = { deviceSerial: 'RS9N-FRONT-001', rawLine: 'garbage' };
    const different = { deviceSerial: 'RS9N-FRONT-001', rawLine: 'other garbage' };

    assert.equal(punchFingerprint(unparsed), punchFingerprint(same));
    assert.notEqual(punchFingerprint(unparsed), punchFingerprint(different));
  });
});

describe('punch classification', () => {
  const noon = new Date('2026-08-10T12:00:00');

  it('authorises an active card', () => {
    assert.equal(classifyPunch(card(), noon), 'AUTHORIZED');
  });

  it('reports an unregistered card rather than staying silent (Rule 3)', () => {
    assert.equal(classifyPunch(null, noon), 'UNKNOWN_CARD');
  });

  it('never authorises a disabled card (Rule 4)', () => {
    assert.equal(classifyPunch(card({ isActive: false }), noon), 'INACTIVE_CARD');
  });

  it('rejects an expired card', () => {
    const expired = card({ validUntil: new Date('2020-01-01') });
    assert.equal(classifyPunch(expired, noon), 'EXPIRED_CARD');
  });

  it('rejects a card that is not valid yet', () => {
    const future = card({ validFrom: new Date('2030-01-01') });
    assert.equal(classifyPunch(future, noon), 'NOT_YET_VALID');
  });

  it('flags a punch outside the permitted hours', () => {
    const dayShift = card({ allowedFromHour: 6, allowedToHour: 10 });
    assert.equal(classifyPunch(dayShift, noon), 'OUTSIDE_HOURS');
    assert.equal(classifyPunch(dayShift, new Date('2026-08-10T07:00:00')), 'AUTHORIZED');
  });

  it('treats the closing hour as exclusive', () => {
    const shift = card({ allowedFromHour: 6, allowedToHour: 12 });
    assert.equal(classifyPunch(shift, noon), 'OUTSIDE_HOURS');
    assert.equal(classifyPunch(shift, new Date('2026-08-10T11:59:00')), 'AUTHORIZED');
  });

  it('prefers the disabled reason over the expiry reason', () => {
    const both = card({ isActive: false, validUntil: new Date('2020-01-01') });
    assert.equal(classifyPunch(both, noon), 'INACTIVE_CARD');
  });
});

describe('visitor request state machine', () => {
  it('allows every decision out of PENDING', () => {
    assert.equal(canTransition('PENDING', 'APPROVED'), true);
    assert.equal(canTransition('PENDING', 'DENIED'), true);
    assert.equal(canTransition('PENDING', 'EXPIRED'), true);
    assert.equal(canTransition('PENDING', 'CANCELLED'), true);
  });

  it('refuses to approve a request that timed out (Rule 9)', () => {
    assert.equal(canTransition('EXPIRED', 'APPROVED'), false);
  });

  it('refuses to reverse a decision', () => {
    assert.equal(canTransition('DENIED', 'APPROVED'), false);
    assert.equal(canTransition('APPROVED', 'DENIED'), false);
  });

  it('treats cancelled as final', () => {
    assert.equal(canTransition('CANCELLED', 'APPROVED'), false);
  });
});

describe('punch direction', () => {
  it('trusts a dedicated entry or exit reader above everything else', () => {
    assert.equal(resolveDirection('IN', 1, 'IN'), 'IN');
    assert.equal(resolveDirection('OUT', 0, 'OUT'), 'OUT');
  });

  it('uses the device status column on a bidirectional reader', () => {
    assert.equal(resolveDirection('UNKNOWN', 0, null), 'IN');
    assert.equal(resolveDirection('UNKNOWN', 1, null), 'OUT');
  });

  it('alternates from the previous punch when the status is absent', () => {
    assert.equal(resolveDirection('UNKNOWN', null, 'IN'), 'OUT');
    assert.equal(resolveDirection('UNKNOWN', null, 'OUT'), 'IN');
  });

  it('assumes entry for a card with no history', () => {
    assert.equal(resolveDirection('UNKNOWN', null, null), 'IN');
  });
});
