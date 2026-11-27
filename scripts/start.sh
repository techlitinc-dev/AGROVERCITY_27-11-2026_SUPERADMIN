#!/usr/bin/env bash
# Start the superadmin backend gateway (:8010) and frontend dev server (:5173)
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
  ( cd "$dir" && nohup "$@" > "$LOGS/$name.log" 2>&1 & echo $! > "$pidfile" )
  echo "$name started (pid $(cat "$pidfile")) — log: logs/$name.log"
}

start backend "$ROOT/backend" "$ROOT/backend/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8010 --app-dir "$ROOT/backend"
start frontend "$ROOT/superadmin" npm run dev

echo
echo "Backend:   http://localhost:8010   (API + serves the production build)"
echo "Frontend:  http://localhost:5173   (dev server, hot reload — use this while developing)"
