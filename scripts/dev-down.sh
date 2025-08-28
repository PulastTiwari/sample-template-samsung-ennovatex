#!/usr/bin/env zsh
set -euo pipefail

DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$DIR"

echo "Stopping development compose..."
docker compose -f docker-compose.dev.yml down --remove-orphans

echo "Containers stopped."
