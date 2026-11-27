#!/usr/bin/env bash
# Stop the superadmin backend gateway and frontend dev server.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGS="$ROOT/logs"

for name in frontend backend; do
  pidfile="$LOGS/$name.pid"
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    kill "$(cat "$pidfile")" 2>/dev/null && echo "$name stopped (pid $(cat "$pidfile"))"
  else
    echo "$name not running (pidfile)"
  fi
  rm -f "$pidfile"
done

# Safety net: free the fixed ports in case a wrapper/pid drift left a child behind.
for port in 5273 8010; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null && echo "killed leftover process on :$port"
  fi
done
