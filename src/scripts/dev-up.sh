#!/usr/bin/env zsh
set -euo pipefail

# Run from repo root regardless of where the script is invoked from
DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$DIR"

echo "Starting development compose (docker-compose.dev.yml)..."
docker compose -f docker-compose.dev.yml up -d --build

echo "Waiting for services to become healthy..."
./scripts/healthcheck.sh

echo "Dev environment started. Use 'make logs' to follow logs or 'make dev-down' to stop."
