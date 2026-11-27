#!/usr/bin/env bash
# Stop the superadmin backend gateway and frontend dev server.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGS="$ROOT/logs"

for name in frontend backend; do
  pidfile="$LOGS/$name.pid"
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    kill "$(cat "$pidfile")" && echo "$name stopped (pid $(cat "$pidfile"))"
  else
    echo "$name not running"
  fi
  rm -f "$pidfile"
done
