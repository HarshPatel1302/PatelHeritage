/**
 * Realtime RS9N simulator.
 *
 * Pretends to be the gate reader so the whole card pipeline can be exercised
 * before the hardware is mounted: handshake, command poll, and ATTLOG pushes in
 * the tab-separated shape the firmware is documented to use.
 *
 * Usage:
 *   npm run simulate:rs9n                            one IN punch, default card
 *   npm run simulate:rs9n -- --card 0000000002       a specific card
 *   npm run simulate:rs9n -- --out                   exit punch
 *   npm run simulate:rs9n -- --burst 5               five punches one second apart
 *   npm run simulate:rs9n -- --unknown               a card nobody has registered
 *   npm run simulate:rs9n -- --malformed             a record the parser cannot read
 *   npm run simulate:rs9n -- --retry                 send the same batch twice (dedup check)
 *   npm run simulate:rs9n -- --serial RS9N-BACK-001  a different reader
 *   npm run simulate:rs9n -- --at "2026-08-10 07:42:15"   a specific timestamp
 *   npm run simulate:rs9n -- --scenario all          every case above in sequence
 *
 *   BASE_URL=https://your-host npm run simulate:rs9n
 */
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5001';

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const SERIAL = arg('serial', process.env.DEVICE_SERIAL ?? 'RS9N-FRONT-001')!;

/** Device local time: "YYYY-MM-DD HH:MM:SS", no timezone marker. */
function deviceTime(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
  );
}

const c = {
  ok: (s: string) => `\x1b[32m${s}\x1b[0m`,
  bad: (s: string) => `\x1b[31m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

async function handshake(): Promise<boolean> {
  const res = await fetch(
    `${BASE_URL}/iclock/cdata?SN=${SERIAL}&options=all&pushver=2.4.1&language=69`,
  );
  const text = await res.text();
  if (!res.ok) {
    console.log(`${c.bad('handshake failed')} ${res.status}: ${text.trim()}`);
    return false;
  }
  console.log(`${c.ok('handshake OK')} ${c.dim(`(${text.split('\n').length} config lines)`)}`);
  return true;
}

async function poll() {
  const res = await fetch(`${BASE_URL}/iclock/getrequest?SN=${SERIAL}`);
  const text = (await res.text()).trim();
  console.log(`${c.ok('getrequest')} ${res.status} → ${text}`);
  return text;
}

async function pushLines(lines: string[], label: string): Promise<boolean> {
  const body = lines.join('\n') + '\n';
  const res = await fetch(
    `${BASE_URL}/iclock/cdata?SN=${SERIAL}&table=ATTLOG&Stamp=${Date.now()}`,
    { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body },
  );
  const text = (await res.text()).trim();
  const good = res.status === 200 && text === 'OK';

  console.log(
    `${good ? c.ok('ATTLOG OK') : c.bad('ATTLOG FAIL')} ${label} ${c.dim(`(${lines.length} record(s), replied "${text}")`)}`,
  );
  if (!good) {
    console.log(
      c.bad('  the device would retry these records forever: the body must be exactly "OK"'),
    );
  }
  return good;
}

function attlogLine(card: string, at: Date, status: number, verify = 3): string {
  return [card, deviceTime(at), String(status), String(verify), '0', '0', '0'].join('\t');
}

async function main() {
  const scenario = arg('scenario');
  console.log(c.bold(`Simulating ${SERIAL} against ${BASE_URL}\n`));

  if (!(await handshake())) {
    console.log(
      c.bad('\nRegister this serial first, or pass --serial with a registered one.\n') +
        'Seeded serials: RS9N-FRONT-001, RS9N-BACK-001',
    );
    process.exit(1);
  }
  await poll();
  console.log();

  if (scenario === 'all') {
    const now = new Date();
    console.log(c.bold('Scenario: every case in sequence\n'));

    await pushLines([attlogLine('0000000001', now, 0)], 'active card (expect AUTHORIZED)');
    await pushLines([attlogLine('0000000003', now, 0)], 'disabled card (expect INACTIVE_CARD)');
    await pushLines([attlogLine('0000000004', now, 0)], 'expired card (expect EXPIRED_CARD)');
    await pushLines([attlogLine('9999999999', now, 0)], 'unknown card (expect UNKNOWN_CARD)');
    await pushLines(['garbage ~~ not an attlog record'], 'malformed (expect PARSE_ERROR, still saved)');

    const dupLine = attlogLine('0000000002', now, 0);
    await pushLines([dupLine], 'house-help card, first send');
    await pushLines([dupLine], 'identical retry (expect dedupe, no new event)');

    const later = new Date(now.getTime() + 60_000);
    await pushLines([attlogLine('0000000002', later, 1)], 'same card a minute later (expect a NEW event)');

    console.log(`\n${c.bold('Check /gate and /admin/devices to see these.')}`);
    return;
  }

  if (flag('malformed')) {
    await pushLines(
      ['THIS-IS-NOT-AN-ATTLOG-RECORD ~~ garbage from an unknown firmware'],
      'malformed record',
    );
    console.log(c.dim('\nExpect PARSE_ERROR on /gate and a FAILED raw record on /admin/devices.'));
    return;
  }

  const card = flag('unknown') ? '9999999999' : arg('card', '0000000001')!;
  const status = flag('out') ? 1 : 0;
  const burst = Math.max(1, Number(arg('burst', '1')));
  const baseTime = arg('at') ? new Date(arg('at')!.replace(' ', 'T')) : new Date();

  if (Number.isNaN(baseTime.getTime())) {
    console.log(c.bad('--at could not be parsed. Use "YYYY-MM-DD HH:MM:SS".'));
    process.exit(1);
  }

  const lines = Array.from({ length: burst }, (_, i) =>
    attlogLine(card, new Date(baseTime.getTime() + i * 1000), status),
  );
  lines.forEach((l) => console.log(c.dim(`  > ${l.replace(/\t/g, ' | ')}`)));
  console.log();

  await pushLines(lines, `card ${card}`);

  if (flag('retry')) {
    console.log(c.dim('\nResending the identical batch (device retry simulation)...'));
    await pushLines(lines, 'retry');
    console.log(c.dim('Duplicates should be absorbed — punch count must not change.'));
  }

  console.log(`\n${c.bold('Done.')} Open /gate to see the result, /admin/devices for the raw record.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
