#!/usr/bin/env bash
# End-to-end check of the Patel Heritage access control system.
#
# Drives the real HTTP API exactly as the kiosk, the resident's phone, the guard
# console and the RS9N card reader do. Nothing is mocked: the card tests post to
# the same /iclock/cdata endpoint the physical device will use.
#
# Usage: bash scripts/e2e-check.sh [base-url]
set -uo pipefail

BASE="${1:-http://localhost:5001}"
JAR_RESIDENT="$(mktemp)"
JAR_GUARD="$(mktemp)"
JAR_KIOSK="$(mktemp)"
PASS=0
FAIL=0

ok()    { printf '  \033[32mPASS\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()   { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
skip()  { printf '  \033[33mSKIP\033[0m %s\n' "$1"; }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

HAS_PSQL=0
if [[ "$BASE" == *localhost* ]] && command -v psql >/dev/null; then HAS_PSQL=1; fi
psql_q() { psql -d patel_heritage -tAq -c "$1" 2>/dev/null | tr -d ' '; }

# A tiny but genuinely valid JPEG, so the photo path is exercised for real
# rather than skipped by the "no photo" branch.
JPEG_B64="/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=="
PHOTO="data:image/jpeg;base64,${JPEG_B64}"

DEVICE="RS9N-FRONT-001"
CARD_ACTIVE="0000000001"     # Ramesh Kumar, newspaper, active
CARD_DISABLED="0000000003"   # Mahesh Patil, disabled
CARD_EXPIRED="0000000004"    # Anil Sharma, expired
CARD_UNKNOWN="8888777766"

# The flat rate limiter is real and stateful. Cancelling a previous run's rows is
# not enough: the limiter also counts anything created in the last 10 minutes, so
# two runs close together would (correctly) trip it. Backdate the test flats'
# history out of that window instead of deleting it, which keeps the audit trail
# and avoids orphaning stored photos.
TEST_FLATS="'A201','C1402','E602','D802','B502'"
if [ "$HAS_PSQL" = "1" ]; then
  psql -d patel_heritage -q -c \
    "UPDATE \"VisitorRequest\"
     SET status = CASE WHEN status='PENDING' THEN 'CANCELLED'::\"RequestStatus\" ELSE status END,
         \"createdAt\" = \"createdAt\" - interval '2 hours'
     WHERE \"flatId\" IN ($TEST_FLATS)
       AND \"createdAt\" > (now() at time zone 'utc') - interval '30 minutes';" >/dev/null 2>&1
fi

now_stamp() { date '+%Y-%m-%d %H:%M:%S'; }

# Posts one ATTLOG line and echoes the reply body.
push_attlog() {
  curl -s -X POST "$BASE/iclock/cdata?SN=$1&table=ATTLOG&Stamp=$(date +%s)$RANDOM" \
    -H 'Content-Type: text/plain' --data-binary "$2"
}

########################################################################
# This suite validates the PRODUCTION security model — most of it asserts that
# an unauthenticated caller is refused. Demo mode signs callers in automatically,
# which would turn those assertions into noise, so refuse to run against it.
if curl -s "$BASE/api/auth/me" | grep -q '"demoMode":true'; then
  printf '\033[31mThis server has DEMO_MODE on.\033[0m\n\n'
  printf 'The suite checks that unauthenticated requests are refused, but demo mode\n'
  printf 'signs everyone in automatically, so those checks cannot mean anything here.\n\n'
  printf 'Run \033[1mnpm run test:e2e\033[0m instead — it starts a demo-free server for the test.\n'
  exit 1
fi

head_ "1. Application is up"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/kiosk")
[ "$code" = "200" ] && ok "GET /kiosk -> 200" || bad "GET /kiosk -> $code"

head_ "2. Unauthenticated access is refused"
for path in /api/visitor-requests/pending /api/residents /api/stats /api/cards /api/punches /api/devices; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")
  [ "$code" = "401" ] && ok "$path -> 401" || bad "$path -> $code (expected 401)"
done

head_ "3. Login"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' -d '{"username":"A201","password":"wrong-password"}')
[ "$code" = "401" ] && ok "wrong password -> 401" || bad "wrong password -> $code"

code=$(curl -s -c "$JAR_RESIDENT" -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' -d '{"username":"A201","password":"201"}')
[ "$code" = "200" ] && ok "resident A201 login -> 200" || bad "resident A201 login -> $code"
grep -q '#HttpOnly_' "$JAR_RESIDENT" && ok "session cookie is HttpOnly" || bad "cookie not HttpOnly"

code=$(curl -s -c "$JAR_GUARD" -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' -d '{"username":"SECURITY","password":"security123"}')
[ "$code" = "200" ] && ok "guard login -> 200" || bad "guard login -> $code"

########################################################################
# CARD FLOW
########################################################################
head_ "4. RS9N device handshake"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/iclock/cdata?SN=NOT-A-REAL-DEVICE&options=all")
[ "$code" = "403" ] && ok "unregistered device refused -> 403" || bad "unregistered device -> $code"

body=$(curl -s "$BASE/iclock/cdata?SN=$DEVICE&options=all&pushver=2.4.1")
printf '%s' "$body" | grep -q 'GET OPTION FROM' && ok "registered device gets its config" || bad "handshake: ${body:0:120}"

ctype=$(curl -s -o /dev/null -w '%{content_type}' "$BASE/iclock/cdata?SN=$DEVICE&options=all")
case "$ctype" in text/plain*) ok "handshake content-type is text/plain" ;; *) bad "content-type was '$ctype'" ;; esac

# Either nothing to do ("OK") or a well-formed queued command. Revoking a card
# earlier in this suite legitimately leaves commands waiting for the device.
body=$(curl -s "$BASE/iclock/getrequest?SN=$DEVICE")
case "$body" in
  OK|C:*) ok "getrequest replies OK or a queued command" ;;
  *)      bad "getrequest replied '$body'" ;;
esac

head_ "5. Card tap: registered ACTIVE card"
body=$(push_attlog "$DEVICE" "$CARD_ACTIVE	$(now_stamp)	0	3	0	0	0")
[ "$body" = "OK" ] && ok "ATTLOG answered with exactly OK" || bad "ATTLOG replied '$body' (device would retry forever)"

result=$(curl -s -b "$JAR_GUARD" "$BASE/api/punches?limit=1")
printf '%s' "$result" | grep -q '"result":"AUTHORIZED"' && ok "resolves to AUTHORIZED" || bad "got: ${result:0:200}"
printf '%s' "$result" | grep -q '"personName":"Ramesh Kumar"' && ok "identifies the person" || bad "person not resolved"
printf '%s' "$result" | grep -q '0001"' && ok "card number is masked on the console" || bad "masking: ${result:0:200}"
printf '%s' "$result" | grep -q "\"$CARD_ACTIVE\"" && bad "full card number leaked to console" || ok "full card number not exposed"

head_ "6. Card tap: UNKNOWN card is logged and shown (Rule 3)"
body=$(push_attlog "$DEVICE" "$CARD_UNKNOWN	$(now_stamp)	0	3	0	0	0")
[ "$body" = "OK" ] && ok "device acknowledged" || bad "replied '$body'"
result=$(curl -s -b "$JAR_GUARD" "$BASE/api/punches?limit=1")
printf '%s' "$result" | grep -q '"result":"UNKNOWN_CARD"' && ok "shows as UNKNOWN_CARD" || bad "got: ${result:0:200}"

head_ "7. Card tap: DISABLED card never authorises (Rule 4)"
push_attlog "$DEVICE" "$CARD_DISABLED	$(now_stamp)	0	3	0	0	0" >/dev/null
result=$(curl -s -b "$JAR_GUARD" "$BASE/api/punches?limit=1")
printf '%s' "$result" | grep -q '"result":"INACTIVE_CARD"' && ok "shows as INACTIVE_CARD" || bad "got: ${result:0:200}"
printf '%s' "$result" | grep -q '"personName":"Mahesh Patil"' && ok "still names the person" || bad "person missing"

head_ "8. Card tap: EXPIRED card"
push_attlog "$DEVICE" "$CARD_EXPIRED	$(now_stamp)	0	3	0	0	0" >/dev/null
result=$(curl -s -b "$JAR_GUARD" "$BASE/api/punches?limit=1")
printf '%s' "$result" | grep -q '"result":"EXPIRED_CARD"' && ok "shows as EXPIRED_CARD" || bad "got: ${result:0:200}"

head_ "9. Device retry is deduplicated (Rule 8)"
if [ "$HAS_PSQL" = "1" ]; then
  # Use a card number unique to this run rather than a random timestamp: the
  # fingerprint covers (device, card, time), so a fresh card guarantees the first
  # send is genuinely new no matter how recently the suite last ran.
  DUP_CARD="55$(date +%s)"
  DUP_STAMP="$(now_stamp)"
  before=$(psql_q "SELECT count(*) FROM \"PunchEvent\";")
  push_attlog "$DEVICE" "$DUP_CARD	$DUP_STAMP	0	3	0	0	0" >/dev/null
  mid=$(psql_q "SELECT count(*) FROM \"PunchEvent\";")
  push_attlog "$DEVICE" "$DUP_CARD	$DUP_STAMP	0	3	0	0	0" >/dev/null
  push_attlog "$DEVICE" "$DUP_CARD	$DUP_STAMP	0	3	0	0	0" >/dev/null
  after=$(psql_q "SELECT count(*) FROM \"PunchEvent\";")

  [ "$mid" -eq "$((before+1))" ] && ok "first send created one event" || bad "expected $((before+1)) events, got $mid"
  [ "$after" -eq "$mid" ] && ok "two identical retries created nothing new" || bad "retries added $((after-mid)) rows"

  # A genuine second tap at a different time must NOT be swallowed. Use a time
  # in the past, not the future — a future-dated punch would be indistinguishable
  # from a reader with a broken clock.
  LATER=$(date -v-1M '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d '-1 minute' '+%Y-%m-%d %H:%M:%S')
  push_attlog "$DEVICE" "$DUP_CARD	$LATER	0	3	0	0	0" >/dev/null
  final=$(psql_q "SELECT count(*) FROM \"PunchEvent\";")
  [ "$final" -eq "$((after+1))" ] && ok "a real second tap is still recorded" || bad "second tap not recorded"
else
  skip "deduplication counts need local psql"
fi

head_ "10. Malformed record is preserved, never dropped (Rule 5)"
GARBAGE="COMPLETE-GARBAGE~~unknown-firmware-$(date +%s)$RANDOM"
body=$(push_attlog "$DEVICE" "$GARBAGE")
[ "$body" = "OK" ] && ok "device still acknowledged (no retry storm)" || bad "replied '$body'"
result=$(curl -s -b "$JAR_GUARD" "$BASE/api/punches?limit=1")
printf '%s' "$result" | grep -q '"result":"PARSE_ERROR"' && ok "surfaced to the guard as PARSE_ERROR" || bad "got: ${result:0:200}"

diag=$(curl -s -b "$JAR_GUARD" "$BASE/api/devices?rawLimit=5&unparsed=1")
printf '%s' "$diag" | grep -q "$GARBAGE" && ok "raw line retained for inspection" || bad "raw line was lost"
printf '%s' "$diag" | grep -q '"parseStatus":"FAILED"' && ok "marked FAILED in diagnostics" || bad "parse status wrong"

head_ "11. Diagnostics expose what the device actually sent"
diag=$(curl -s -b "$JAR_GUARD" "$BASE/api/devices?rawLimit=5")
printf '%s' "$diag" | grep -q '"lastPunchAt"' && ok "device last-punch timestamp tracked" || bad "no lastPunchAt"
printf '%s' "$diag" | grep -q '"rawBody"' && ok "full request body retained" || bad "no rawBody"
printf '%s' "$diag" | grep -q '"parsedCardNumber"' && ok "parser output shown beside the raw line" || bad "no parsed fields"

code=$(curl -s -b "$JAR_RESIDENT" -o /dev/null -w '%{http_code}' "$BASE/api/devices")
[ "$code" = "403" ] && ok "residents cannot read diagnostics -> 403" || bad "resident diagnostics -> $code"

########################################################################
# CARD MANAGEMENT
########################################################################
head_ "12. Card holder management"
NEWCARD="0000$(date +%s | tail -c 7)"
resp=$(curl -s -b "$JAR_GUARD" -X POST "$BASE/api/cards" -H 'Content-Type: application/json' \
  -d "{\"cardNumber\":\"$NEWCARD\",\"personName\":\"Test Person\",\"category\":\"CLEANER\"}")
CARD_ID=$(printf '%s' "$resp" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
[ -n "$CARD_ID" ] && ok "card created" || bad "create failed: ${resp:0:160}"

code=$(curl -s -b "$JAR_GUARD" -o /dev/null -w '%{http_code}' -X POST "$BASE/api/cards" \
  -H 'Content-Type: application/json' \
  -d "{\"cardNumber\":\"$NEWCARD\",\"personName\":\"Someone Else\",\"category\":\"OTHER\"}")
[ "$code" = "409" ] && ok "duplicate card number refused -> 409" || bad "duplicate -> $code (expected 409)"

listing=$(curl -s -b "$JAR_GUARD" "$BASE/api/cards?q=Test%20Person")
printf '%s' "$listing" | grep -q "\"cardNumber\":\"$NEWCARD\"" && ok "leading zeroes preserved (Rule 7)" || bad "card number altered"

code=$(curl -s -b "$JAR_GUARD" -o /dev/null -w '%{http_code}' -X PATCH "$BASE/api/cards/$CARD_ID" \
  -H 'Content-Type: application/json' -d '{"personName":"Test Person Renamed"}')
[ "$code" = "200" ] && ok "card edited" || bad "edit -> $code"

code=$(curl -s -b "$JAR_GUARD" -o /dev/null -w '%{http_code}' -X PATCH "$BASE/api/cards/$CARD_ID" \
  -H 'Content-Type: application/json' -d '{"isActive":false}')
[ "$code" = "200" ] && ok "card disabled" || bad "disable -> $code"

push_attlog "$DEVICE" "$NEWCARD	$(now_stamp)	0	3	0	0	0" >/dev/null
result=$(curl -s -b "$JAR_GUARD" "$BASE/api/punches?limit=1")
printf '%s' "$result" | grep -q '"result":"INACTIVE_CARD"' && ok "disabling takes effect immediately" || bad "got: ${result:0:200}"

code=$(curl -s -b "$JAR_GUARD" -o /dev/null -w '%{http_code}' -X PATCH "$BASE/api/cards/$CARD_ID" \
  -H 'Content-Type: application/json' -d '{"isActive":true}')
[ "$code" = "200" ] && ok "card re-enabled" || bad "re-enable -> $code"

history=$(curl -s -b "$JAR_GUARD" "$BASE/api/cards/$CARD_ID")
printf '%s' "$history" | grep -q '"punches"' && ok "punch history available per card" || bad "no punch history"

code=$(curl -s -b "$JAR_RESIDENT" -o /dev/null -w '%{http_code}' -X POST "$BASE/api/cards" \
  -H 'Content-Type: application/json' -d '{"cardNumber":"7777","personName":"X","category":"OTHER"}')
[ "$code" = "403" ] && ok "residents cannot issue cards -> 403" || bad "resident card create -> $code"

head_ "13. Card enrollment detects an unknown tap without auto-registering"
SINCE=$(date -u '+%Y-%m-%dT%H:%M:%S.000Z')
sleep 1
ENROLL_CARD="7777$(date +%s | tail -c 6)"
push_attlog "$DEVICE" "$ENROLL_CARD	$(now_stamp)	0	3	0	0	0" >/dev/null
enroll=$(curl -s -b "$JAR_GUARD" "$BASE/api/cards/enroll?since=$SINCE")
printf '%s' "$enroll" | grep -q "$ENROLL_CARD" && ok "unknown card offered for assignment" || bad "not detected: ${enroll:0:200}"

if [ "$HAS_PSQL" = "1" ]; then
  registered=$(psql_q "SELECT count(*) FROM \"AccessCard\" WHERE \"cardNumber\"='$ENROLL_CARD';")
  [ "$registered" = "0" ] && ok "unknown card was NOT auto-registered" || bad "card auto-registered — must require confirmation"
fi

########################################################################
# VISITOR FLOW
########################################################################
head_ "14. Gate screen pairing"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/kiosk/pair" \
  -H 'Content-Type: application/json' -d '{"username":"A201","password":"201","gate":"FRONT"}')
[ "$code" = "403" ] && ok "ordinary resident cannot pair a gate screen" || bad "resident pairing -> $code"

code=$(curl -s -c "$JAR_KIOSK" -o /dev/null -w '%{http_code}' -X POST "$BASE/api/kiosk/pair" \
  -H 'Content-Type: application/json' -d '{"username":"SECURITY","password":"security123","gate":"FRONT"}')
[ "$code" = "200" ] && ok "security pairs the gate screen" || bad "pairing -> $code"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/visitor-requests" \
  -H 'Content-Type: application/json' -d '{"flatId":"B502","purpose":"GUEST"}')
[ "$code" = "403" ] && ok "unpaired device cannot ring flats -> 403" || bad "unpaired request -> $code"

head_ "15. Kiosk creates a visitor request with a photo"
resp=$(curl -s -b "$JAR_KIOSK" -X POST "$BASE/api/visitor-requests" -H 'Content-Type: application/json' \
  -d "{\"flatId\":\"A201\",\"purpose\":\"DELIVERY\",\"photoDataUrl\":\"$PHOTO\"}")
REQ_ID=$(printf '%s' "$resp" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
[ -n "$REQ_ID" ] && ok "request created" || bad "not created: $resp"
printf '%s' "$resp" | grep -q '"photoCaptured":true' && ok "photo stored as JPEG" || bad "photo not stored"

head_ "16. Resident sees it; the photo is protected"
count=$(curl -s -b "$JAR_RESIDENT" "$BASE/api/visitor-requests/pending" | grep -o '"id"' | wc -l | tr -d ' ')
[ "$count" -ge 1 ] && ok "A201 sees the pending request" || bad "A201 sees none"

code=$(curl -s -b "$JAR_RESIDENT" -o /dev/null -w '%{http_code}' "$BASE/api/photos/$REQ_ID")
[ "$code" = "200" ] && ok "resident can load the visitor photo" || bad "photo fetch -> $code"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/photos/$REQ_ID")
[ "$code" = "401" ] && ok "photo refused without a session" || bad "unauthenticated photo -> $code"

head_ "17. Kiosk status leaks no resident identity (Rule 1)"
status=$(curl -s "$BASE/api/visitor-requests/$REQ_ID")
printf '%s' "$status" | grep -q '"status":"PENDING"' && ok "status is PENDING" || bad "unexpected: $status"
printf '%s' "$status" | grep -qi 'name\|phone\|email' && bad "kiosk response leaks personal data" || ok "no resident identity in kiosk response"

head_ "18. Ringing the same flat repeatedly is rate limited"
curl -s -b "$JAR_KIOSK" -o /dev/null -X POST "$BASE/api/visitor-requests" \
  -H 'Content-Type: application/json' -d '{"flatId":"A201","purpose":"GUEST"}'
code=$(curl -s -b "$JAR_KIOSK" -o /dev/null -w '%{http_code}' -X POST "$BASE/api/visitor-requests" \
  -H 'Content-Type: application/json' -d '{"flatId":"A201","purpose":"GUEST"}')
[ "$code" = "429" ] && ok "third concurrent request -> 429" || bad "expected 429, got $code"

head_ "19. Approval, and the decision is final"
code=$(curl -s -b "$JAR_RESIDENT" -o /dev/null -w '%{http_code}' -X POST \
  "$BASE/api/visitor-requests/$REQ_ID/decision" -H 'Content-Type: application/json' \
  -d '{"decision":"APPROVE"}')
[ "$code" = "200" ] && ok "resident approves -> 200" || bad "approve -> $code"

code=$(curl -s -b "$JAR_RESIDENT" -o /dev/null -w '%{http_code}' -X POST \
  "$BASE/api/visitor-requests/$REQ_ID/decision" -H 'Content-Type: application/json' \
  -d '{"decision":"DENY"}')
[ "$code" = "409" ] && ok "a second decision is refused -> 409" || bad "double decision -> $code"

status=$(curl -s "$BASE/api/visitor-requests/$REQ_ID")
printf '%s' "$status" | grep -q '"status":"APPROVED"' && ok "kiosk sees APPROVED" || bad "kiosk sees: $status"

head_ "20. Denial"
resp=$(curl -s -b "$JAR_KIOSK" -X POST "$BASE/api/visitor-requests" -H 'Content-Type: application/json' \
  -d '{"flatId":"D802","purpose":"GUEST"}')
DENY_ID=$(printf '%s' "$resp" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
code=$(curl -s -b "$JAR_GUARD" -o /dev/null -w '%{http_code}' -X POST \
  "$BASE/api/visitor-requests/$DENY_ID/decision" -H 'Content-Type: application/json' \
  -d '{"decision":"DENY"}')
[ "$code" = "200" ] && ok "guard denies -> 200" || bad "deny -> $code"
status=$(curl -s "$BASE/api/visitor-requests/$DENY_ID")
printf '%s' "$status" | grep -q '"status":"DENIED"' && ok "state is DENIED" || bad "state: $status"

head_ "21. A resident cannot answer another flat's door"
resp=$(curl -s -b "$JAR_KIOSK" -X POST "$BASE/api/visitor-requests" -H 'Content-Type: application/json' \
  -d '{"flatId":"C1402","purpose":"GUEST"}')
OTHER_ID=$(printf '%s' "$resp" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
code=$(curl -s -b "$JAR_RESIDENT" -o /dev/null -w '%{http_code}' -X POST \
  "$BASE/api/visitor-requests/$OTHER_ID/decision" -H 'Content-Type: application/json' \
  -d '{"decision":"APPROVE"}')
[ "$code" = "403" ] && ok "A201 answering C1402 -> 403" || bad "cross-flat decision -> $code"

head_ "22. Timeout never means approval (Rule 2, Rule 9)"
if [ "$HAS_PSQL" = "1" ]; then
  resp=$(curl -s -b "$JAR_KIOSK" -X POST "$BASE/api/visitor-requests" -H 'Content-Type: application/json' \
    -d '{"flatId":"E602","purpose":"GUEST"}')
  EXP_ID=$(printf '%s' "$resp" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
  # Prisma stores UTC in a timezone-naive column, so compare in UTC.
  psql -d patel_heritage -q -c \
    "UPDATE \"VisitorRequest\" SET \"expiresAt\" = (now() at time zone 'utc') - interval '5 seconds'
     WHERE id='$EXP_ID';" >/dev/null 2>&1

  status=$(curl -s "$BASE/api/visitor-requests/$EXP_ID")
  printf '%s' "$status" | grep -q '"status":"EXPIRED"' && ok "unanswered request becomes EXPIRED" || bad "status: $status"
  printf '%s' "$status" | grep -q '"escalatedToGuard":true' && ok "escalated to the guard" || bad "not escalated"

  JAR_E="$(mktemp)"
  curl -s -c "$JAR_E" -o /dev/null -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d '{"username":"E602","password":"602"}'
  out=$(curl -s -b "$JAR_E" -X POST "$BASE/api/visitor-requests/$EXP_ID/decision" \
    -H 'Content-Type: application/json' -d '{"decision":"APPROVE"}')
  printf '%s' "$out" | grep -q 'timed out' && ok "late approval refused with a clear reason" || bad "late approval: $out"
  rm -f "$JAR_E"
else
  skip "expiry test needs local psql"
fi

head_ "23. Guard console data"
pending=$(curl -s -b "$JAR_GUARD" "$BASE/api/visitor-requests/pending")
printf '%s' "$pending" | grep -q '"requests"' && ok "guard sees the pending queue" || bad "no pending feed"
recent=$(curl -s -b "$JAR_GUARD" "$BASE/api/visitor-requests/recent?limit=5")
printf '%s' "$recent" | grep -q 'APPROVED\|DENIED\|EXPIRED' && ok "guard sees decided requests" || bad "no recent decisions"

head_ "24. Audit trail"
if [ "$HAS_PSQL" = "1" ]; then
  for action in visitor.approved visitor.denied card.created card.disabled auth.login; do
    n=$(psql_q "SELECT count(*) FROM \"AuditLog\" WHERE action='$action';")
    [ "${n:-0}" -ge 1 ] && ok "audited: $action" || bad "no audit row for $action"
  done
  leak=$(psql_q "SELECT count(*) FROM \"AuditLog\" WHERE meta::text ILIKE '%password%';")
  [ "${leak:-0}" = "0" ] && ok "no credentials written to the audit log" || bad "audit log contains password material"
else
  skip "audit checks need local psql"
fi

head_ "25. Housekeeping sweep"
body=$(curl -s "$BASE/api/cron/sweep")
printf '%s' "$body" | grep -q 'photosPurged' && ok "sweep runs" || bad "sweep: ${body:0:120}"

printf '\n\033[1mResult: %d passed, %d failed\033[0m\n' "$PASS" "$FAIL"
rm -f "$JAR_RESIDENT" "$JAR_GUARD" "$JAR_KIOSK"
[ "$FAIL" -eq 0 ]
