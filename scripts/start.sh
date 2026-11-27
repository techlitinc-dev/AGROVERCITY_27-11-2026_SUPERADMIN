#!/usr/bin/env bash
# Start the superadmin backend gateway (:8010) and frontend dev server (:5273)
# detached via nohup — they keep running after this script and the terminal exit.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGS="$ROOT/logs"
mkdir -p "$LOGS"

start() {
  local name="$1" dir="$2"
  shift 2
  local pidfile="$LOGS/$name.pid"
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "$name already running (pid $(cat "$pidfile"))"
    return 0
  fi
  rm -f "$pidfile"
  # The subshell execs nohup, so $! is the final server process — a reliable pid.
  ( cd "$dir" && exec nohup "$@" > "$LOGS/$name.log" 2>&1 ) &
  echo $! > "$pidfile"
  disown 2>/dev/null || true
  echo "$name started (pid $(cat "$pidfile")) — log: logs/$name.log"
}

# Backend stays on localhost — internal API only. The web app is served
# publicly by a single gateway instance on :5272 (production build + API,
# same origin), running continuously via nohup.
start backend "$ROOT/backend" "$ROOT/backend/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8010 --app-dir "$ROOT/backend"
start public5272 "$ROOT/backend" "$ROOT/backend/.venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 5272 --app-dir "$ROOT/backend"
# Continuous frontend builder: rebuilds dist/ whenever web app sources change.
start builder "$ROOT/superadmin" npm run build:watch

echo
echo "Web app:    http://<host>:5272/    (production build + API — the only public port)"
echo "Backend:    http://localhost:8010  (internal API, localhost only)"
