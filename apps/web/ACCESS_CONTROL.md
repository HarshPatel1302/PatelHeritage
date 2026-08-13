# Patel Heritage — Access Control System

Two ways in through the gate, one place for the guard to watch both.

```
A. REGISTERED CARD HOLDER              B. VISITOR WITHOUT A CARD
   (newspaper, milk, house help,          (guest, delivery, service)
    cleaner, driver, staff, vendor)
            │                                      │
    taps card on RS9N                    uses the gate tablet
            │                                      │
    device pushes the punch              name + purpose, then
                                         Wing → Flat
            │                                      │
    identify → validate → log            photo captured in 3s
            │                                      │
    ┌───────┴────────┐                    resident's phone rings
  ACTIVE?         NOT ACTIVE                       │
    │                │                    ┌────────┴────────┐
AUTHORIZED       REJECTED                ALLOW            DENY
    │                │                    │                │
    └────────┬───────┘                 APPROVED         DENIED
             │                                 no answer → EXPIRED
   shown on the guard console                  (never an approval)
             │
   guard lets the person in by hand
```

**No physical gate automation.** A card tap identifies, validates, logs and
displays. Opening the gate remains the guard's decision. The architecture can
drive a relay later — it would read `PunchResult.AUTHORIZED` — but nothing
depends on that today.

---

## SYSTEM STATUS

### ✓ Completed and verified locally

| Area | State |
| --- | --- |
| Database schema, migrations, idempotent seed | Verified on a clean database, seeded twice |
| RS9N ADMS ingestion (`/iclock/cdata`, `getrequest`, `devicecmd`) | Plain-text `OK`, correct content type |
| Raw device record preservation | Every payload stored before parsing, parsed or not |
| Punch classification | `AUTHORIZED` / `UNKNOWN_CARD` / `INACTIVE_CARD` / `EXPIRED_CARD` / `NOT_YET_VALID` / `OUTSIDE_HOURS` / `PARSE_ERROR` |
| Deduplication of device retries | Fingerprinted; a genuine later tap is still recorded |
| Card holder management | Create, search, edit, disable, re-enable, punch history |
| Card enrollment by tapping | Detects an unknown tap, never auto-registers |
| Guard console | Live card events + visitor queue, ~1.5s refresh |
| Device diagnostics | Raw payload viewer, parser output, device liveness |
| Kiosk visitor flow | Welcome → name + purpose → Wing → Flat → 3s photo → ring |
| Owner app (`/owner`) | Separate installable app: approvals + history only |
| Flat credentials | Every flat signs in as `<flat>` / `<number>` (A302 / 302) |
| Resident approval | Full-screen ring, photo, allow/deny, countdown |
| Visitor state machine | Invalid transitions refused at the database |
| Photo storage | JPEG, authenticated retrieval, 30-day auto-purge |
| Audit log | Every card and visitor decision, no credentials |
| Demo mode | Works locally, refuses to boot in production |

### △ Requires the physical RS9N to confirm

| Item | Why |
| --- | --- |
| ATTLOG field order | Our parser handles several layouts, but the unit's real one is unconfirmed |
| Real device serial number | Placeholders `RS9N-FRONT-001` / `RS9N-BACK-001` are seeded |
| Card identifier format | Whether the reader reports `0000012345` or `12345` |
| Device retry timing | Our dedup is timing-independent, but worth observing |
| Network configuration | Server address/port entered on the device keypad |

### ○ Deferred until production

Password and access hardening — see **PRODUCTION AUTH TODO** at the end.

---

## LOCAL DEVELOPMENT

### Prerequisites

PostgreSQL 16 and Node 20+.

```bash
# If Postgres is not running (brew services is broken on some machines):
pg_ctl -D /opt/homebrew/var/postgresql@16 start
createdb patel_heritage
```

### Setup

```bash
cd apps/web
cp .env.example .env          # fill in DATABASE_URL and SESSION_SECRET
npm install
npm run db:migrate            # create the schema
npm run db:seed               # flats, residents, 2 devices, 4 test cards
npm run dev                   # http://localhost:5000
```

The seed is idempotent — run it as often as you like.

### DEMO MODE

Set in `.env`:

```
DEMO_MODE="true"
```

This unlocks `/dev/control-panel` and `/api/dev/login-as`, which signs in as any
seeded account **without a password** so the whole system can be demonstrated
while production auth work is still deferred.

Three conditions gate it, and all three must hold:

1. `DEMO_MODE=true` is set explicitly
2. `NODE_ENV` is not `production`
3. `VERCEL_ENV` is not `production`

If `DEMO_MODE=true` reaches a production runtime, `instrumentation.ts` **refuses
to start the server** rather than quietly serving a password-free application.
Outside demo mode the dev routes return **404**, not 403 — production does not
admit they exist.

Verified:

```
DEMO_MODE=true  NODE_ENV=production  → server refuses to boot
DEMO_MODE unset NODE_ENV=production  → /dev/* 404, /kiosk 200, /api/punches 401
```

---

## TEST ACCOUNTS AND CARDS

**Residents: the flat number is the username, and the same number without the
wing letter is the password.**

| Login | Password | Role |
| --- | --- | --- |
| `A302` | `302` | Resident of A302 |
| `F1302` | `1302` | Resident of F1302 |
| any of the 236 flats | its number without the wing letter | Resident |
| `SECURITY` | `security123` | Security guard |
| `CHAIRMAN` | `chairman123` | Committee (B301 also has its own resident login) |

Every one of the 236 flats has a login. Where a flat carries both a committee
role and a family — B301 holds the chairman and an unrelated household — the
resident keeps the flat username and the role account falls back to its title.

> These are three- and four-digit passwords. The login route's lockout (5
> attempts, then 15 minutes) is what keeps them viable; they are on the
> production rotation list below.

| Card number | Person | Category | State |
| --- | --- | --- | --- |
| `0000000001` | Ramesh Kumar | Newspaper | Active |
| `0000000002` | Sunita Devi | House Help | Active, 06:00–20:00 only |
| `0000000003` | Mahesh Patil | Milk | **Disabled** |
| `0000000004` | Anil Sharma | Regular Delivery | **Expired** |

---

## RS9N SIMULATOR

Exercises the real ingestion endpoint — not a mock.

```bash
npm run simulate:rs9n                          # one punch, default card
npm run simulate:rs9n -- --card 0000000002     # a specific card
npm run simulate:rs9n -- --unknown             # a card nobody registered
npm run simulate:rs9n -- --malformed           # unreadable record
npm run simulate:rs9n -- --retry               # send twice, check dedup
npm run simulate:rs9n -- --burst 5             # five punches
npm run simulate:rs9n -- --out                 # exit rather than entry
npm run simulate:rs9n -- --at "2026-08-10 07:42:15"
npm run simulate:rs9n -- --serial RS9N-BACK-001
npm run simulate:rs9n -- --scenario all        # every case in sequence
```

---

## ADDING A CARD HOLDER

**By tapping (preferred — cannot mistype the number):**

1. Open `/admin/cards` as security or committee.
2. Click **Enroll by tapping**.
3. Ask the person to tap their new card on the reader.
4. The detected number appears; click **Assign this card**.
5. Fill in name and category, save.

Unknown cards are *never* registered automatically — someone must confirm.

**By hand:** click **Add card** and type the number exactly as printed,
including leading zeroes.

---

## TESTING A CARD TAP

```bash
npm run simulate:rs9n -- --card 0000000001    # expect AUTHORIZED, Ramesh Kumar
npm run simulate:rs9n -- --card 0000000003    # expect CARD DISABLED
npm run simulate:rs9n -- --unknown            # expect UNKNOWN CARD
```

Watch `/gate`. The banner updates within about 1.5 seconds.

---

## USING THE GUARD CONSOLE

`/gate` (also reachable at `/guard`). Two sections:

- **Last card tap** — a large banner: `AUTHORIZED` in green with the person's
  name and category, or `UNKNOWN CARD` / `CARD DISABLED` / `CARD EXPIRED` /
  `UNREADABLE CARD DATA` in red or amber. Card numbers are masked to the last
  four digits, because the console sits where others can see it.
- **Visitors waiting** — photo, flat, time, and Allow/Deny. The guard may
  override when a resident does not answer; every override is attributed.

Ordering is by **when the server received** the punch, not the timestamp the
device reported — a reader with a wrong clock would otherwise pin a future-dated
tap to the top forever.

---

## THE TWO APPS

The system is two surfaces over one database, which is what lets them talk to
each other with no integration work:

| Surface | URL | Who uses it | What it does |
| --- | --- | --- | --- |
| **Gate kiosk** | `/kiosk` | Visitors, at the gate | Ask to come in |
| **Owner app** | `/owner` | Residents, on their phone | Allow or deny, and see history |

The owner app has its own manifest, its own home-screen icon (a doorbell rather
than the society tower) and its own name, "PH Approvals". Installing it from
`/owner` gives a resident an app that does one thing: answer the door. It has no
society navigation, no directory, no committee tools.

---

## TESTING A VISITOR CALL

**On the gate screen** — open `/kiosk`:

1. Touch the screen (Welcome to Patel Heritage).
2. Type a name, then choose **Visitor** or **Delivery**.
3. Choose a wing — A to F.
4. Choose a flat from the list. There is no floor step: visitors know the flat
   number, not which floor it is on, so flats are listed grouped by floor.
5. Allow the camera. The countdown runs 3 → 2 → 1 and captures a JPEG.
6. The screen shows "Ringing flat …" with a countdown.

**On the resident's phone** — open `/owner` in a second browser or profile:

1. Sign in with the flat number and its password (e.g. `A302` / `302`).
2. The request takes over the screen: photo, name, purpose, countdown, and two
   large buttons.
3. **Allow** or **Deny** — the kiosk updates within about 1.5 seconds.
4. Tap the history icon to see every visitor, grouped by day, with totals for
   allowed, denied and missed.

No camera? The request still goes through, flagged so the guard is told.

## CONNECTING THE REAL RS9N

1. **On the device:** Menu → Comm → Cloud Server / ADMS

   | Setting | Value |
   | --- | --- |
   | Server Address | your domain or LAN IP, no `https://` |
   | Server Port | `443` for HTTPS, `80` for HTTP |
   | Enable Domain Name | Yes, if using a hostname |
   | Enable Proxy | No |

2. **Find the serial:** Menu → System → Device Info (also printed on the back).

3. **Register it** at `/admin/devices`, or:

   ```sql
   UPDATE "Device" SET "serialNumber" = 'THE-REAL-SERIAL'
   WHERE "serialNumber" = 'RS9N-FRONT-001';
   ```

   Unregistered serials are refused with 403 — this step is required.

4. **Tap a test card**, then open `/admin/devices` and read the raw record:

   ```
   PARSED    0000012345 ⇥ 2026-08-10 07:42:15 ⇥ 0 ⇥ 3 ⇥ 0
   card: 0000012345      time: 10/08/2026, 07:42:15
   ```

5. **If the parse looks wrong**, only `parseAttlog` in `lib/adms.ts` needs
   changing. The raw bytes are already stored, so nothing is lost and the log
   can be re-read afterwards.

The parser already tolerates tab, comma and space separators, and finds the
timestamp wherever it sits in the row — so a different field order is likely to
work without any change at all.

---

## PROTOCOL NOTES

| Endpoint | Purpose |
| --- | --- |
| `GET /iclock/cdata` | Handshake — server replies with device config |
| `GET /iclock/getrequest` | Command poll — `OK`, or a queued command |
| `POST /iclock/cdata` | Punch records (`table=ATTLOG`) |
| `POST /iclock/devicecmd` | Command acknowledgements |

The body must be exactly `OK` — not `{"status":"OK"}` — or the device retries
forever. This is asserted in the test suite.

Revoking a card queues `DATA DELETE USERINFO` to every reader, because the
device keeps its own copy; disabling it only in our database would leave the
card working at the gate.

---

## BUSINESS RULES, AND WHERE THEY LIVE

| Rule | Enforced in |
| --- | --- |
| 1. Kiosk shows flat numbers, never resident names | `app/api/visitor-requests/[id]/route.ts` |
| 2. Timeout never equals approval | `lib/visitor-requests.ts` |
| 3. Unknown cards are logged and shown | `lib/punch-processing.ts` |
| 4. Disabled cards never authorise | `classifyPunch` |
| 5. Every device record preserved | `DeviceRawRecord`, written before parsing |
| 6. A card belongs to one person | `AccessCard.personName`, unique `cardNumber` |
| 7. Card number is a string | `normalizeCardNumber`, never parsed as a number |
| 8. Retries do not duplicate | `punchFingerprint` |
| 9. No approval after expiry | `canTransition` |
| 10. No gate automation | Nothing writes to any relay |
| 11. Auth hardening postponed, not removed | Sessions/roles/bcrypt all intact |
| 12. Fingerprint/PIN not required | Card path only |

---

## TESTING

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm test               # 34 unit tests (parser, cards, dedup, state machine)
npm run test:e2e       # 76 end-to-end checks against a running server
npm run test:all       # typecheck + unit + e2e
```

The e2e suite drives the real HTTP API as the kiosk, the resident's phone, the
guard console and the card reader do — the card tests post to the same
`/iclock/cdata` endpoint the hardware will use. It resets its own test data, so
it can be run repeatedly.

---

## ENVIRONMENT VARIABLES

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `SESSION_SECRET` | yes | Signs session and kiosk cookies. Min 32 chars |
| `DEMO_MODE` | dev only | Unlocks dev routes. Refuses to boot in production |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | for push | Web Push identity |
| `VAPID_SUBJECT` | for push | `mailto:` contact for push services |
| `REQUEST_TIMEOUT_SECONDS` | no (60) | How long a flat has to answer |
| `PHOTO_RETENTION_DAYS` | no (30) | How long visitor photos are kept |
| `PHOTO_STORAGE_DIR` | no | Local photo directory in development |
| `BLOB_READ_WRITE_TOKEN` | production | Switches photo storage to Vercel Blob |
| `CRON_SECRET` | production | Protects `/api/cron/sweep` |

---

## KNOWN LIMITS

**Ringing when the app is closed.** The honest boundary:

| Situation | What happens |
| --- | --- |
| App open on screen | Looping doorbell, vibration, photo. Works everywhere |
| App closed, Android | Push notification with sound; Android may throttle repeats |
| App closed, **iPhone** | Notification only — **no ringtone, no call screen** |

iOS gives web apps no way to ring like a call, and delivers push only to an
*installed* PWA (Add to Home Screen, iOS 16.4+). A native app using PushKit and
CallKit can do it, and would reuse this backend unchanged — it would register a
device token and answer the same decision endpoint.

**Offline.** The kiosk needs the server; if society internet drops it says so
rather than pretending. The card reader buffers punches locally and pushes them
when connectivity returns, and the fingerprint absorbs the replay, so card entry
is unaffected.

**Realtime.** Polling, not WebSockets — the guard console refreshes every 1.5s
and the kiosk every 1.5s while waiting. This is deliberate: it needs no extra
infrastructure, survives reconnects for free, and is well within what one
society's traffic requires.

---

## PRODUCTION AUTH TODO

Deliberately deferred from this milestone. None of it is removed — sessions,
roles, bcrypt hashing and kiosk pairing all work today.

- [ ] **Enforce first-login password reset.** Every seeded account has
      `mustChangePassword = true`, but no screen blocks on it yet.
- [ ] **Invalidate the legacy passwords.** Residents still have the old shared
      `123`.
- [ ] **Remove `lib/legacy-users.ts` after seeding.** It still contains the old
      plaintext passwords. It is imported only by `prisma/seed.ts` and never
      reaches the browser, but it is in git history — treat those credentials as
      compromised and rotate them.
- [ ] **Rotate `SESSION_SECRET`** and generate production VAPID keys.
- [ ] **Set `CRON_SECRET`** so only the scheduler can trigger the photo purge.
- [ ] **Final RBAC review** — role checks are enforced server-side on every
      route today, but the matrix deserves a deliberate pass.
- [ ] **Production kiosk pairing** — currently any committee or security account
      can pair a gate screen; consider a dedicated enrollment token.
- [ ] **Remove `DEMO_MODE`** from any deployed environment (the server refuses
      to start otherwise, so this is enforced rather than remembered).
