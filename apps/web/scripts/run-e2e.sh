#!/usr/bin/env bash
# Runs the end-to-end suite against a purpose-started server with demo mode OFF.
#
# The suite's job is to prove the production security model holds — that an
# unauthenticated caller is refused, that a resident cannot answer another
# flat's door, and so on. Demo mode signs everyone in automatically, so testing
# against your everyday dev server would silently gut those checks. This starts
# a separate, demo-free server on its own port, tests it, and shuts it down.
set -uo pipefail

PORT="${E2E_PORT:-5055}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$(mktemp)"

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  # Next spawns a child that outlives the parent, so clear the port too.
  lsof -ti:"$PORT" 2>/dev/null | xargs kill -9 2>/dev/null
  rm -f "$LOG"
}
trap cleanup EXIT

if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "Port $PORT is busy. Set E2E_PORT to something else."
  exit 1
fi

echo "Starting a demo-free server on port $PORT…"
cd "$DIR"
# Its own build directory: sharing .next with the dev server you are using
# corrupts both route manifests and makes routes vanish at random.
DEMO_MODE="" NEXT_DIST_DIR=".next-e2e" npx next dev -p "$PORT" > "$LOG" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 90); do
  grep -qE "Ready in" "$LOG" && break
  if grep -qE "Failed to|Error:" "$LOG"; then
    echo "Server failed to start:"
    tail -20 "$LOG"
    exit 1
  fi
  sleep 1
done

if ! grep -qE "Ready in" "$LOG"; then
  echo "Server did not become ready in time:"
  tail -20 "$LOG"
  exit 1
fi

# First request compiles the route tree; do it before the timed assertions.
curl -s -o /dev/null "http://localhost:$PORT/api/auth/me"
echo

bash "$DIR/scripts/e2e-check.sh" "http://localhost:$PORT"
