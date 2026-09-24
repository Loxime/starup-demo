#!/usr/bin/env sh

set -eu

PORT="${PORT:-4173}"

LOG_FILE="${
  TMPDIR:-/tmp
}/starup-demo-http.log"

python3 \
  -m http.server "$PORT" \
  --directory site \
  >"$LOG_FILE" 2>&1 &

SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" \
    >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

attempt=0

until curl \
  -fsS \
  "http://127.0.0.1:$PORT/" \
  >/dev/null
do
  attempt=$((attempt + 1))

  if [ "$attempt" -ge 20 ]; then
    cat "$LOG_FILE"
    exit 1
  fi

  sleep 0.25
done

for path in \
  "/" \
  "/app.js" \
  "/core.js" \
  "/styles.css" \
  "/assets/starup-icon.png"
do
  echo "Checking $path"

  curl \
    -fsS \
    "http://127.0.0.1:$PORT$path" \
    >/dev/null
done

echo "StarUp demo smoke test passed."
