#!/usr/bin/env zsh
set -euo pipefail

# Simple healthcheck script for local dev compose
# Usage: ./scripts/healthcheck.sh [retries] [delay_seconds]

RETRIES=${1:-15}
DELAY=${2:-2}

BACKEND_URL="http://localhost:8000/status"
FRONTEND_URL="http://localhost:3000/"

check_url() {
  url=$1
  if curl -fSs --max-time 3 "$url" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

for i in $(seq 1 $RETRIES); do
  ok=true
  if ! check_url "$BACKEND_URL"; then ok=false; fi
  if ! check_url "$FRONTEND_URL"; then ok=false; fi

  if $ok; then
    echo "All services are healthy"
    exit 0
  fi

  echo "Waiting for services... ($i/$RETRIES)"
  sleep $DELAY
done

echo "Healthcheck timed out after $RETRIES attempts" >&2
exit 2
