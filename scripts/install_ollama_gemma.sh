#!/usr/bin/env bash
set -euo pipefail

# Small helper to pull the gemma:2b model for Ollama and write a .env variable
# Usage: ./scripts/install_ollama_gemma.sh

echo "Checking for ollama on PATH..."
if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not found. Install via Homebrew or see https://ollama.com/docs"
  echo "Homebrew (recommended on macOS):"
  echo "  brew install ollama"
  exit 2
fi

MODEL="gemma:2b"

echo "Pulling model: $MODEL (this may take several minutes depending on your connection)..."
ollama pull "$MODEL"

# Write .env with OLLAMA_MODEL
ENVFILE=".env"
echo "OLLAMA_MODEL=$MODEL" > "$ENVFILE"
chmod 600 "$ENVFILE" || true

echo "Done. Wrote $ENVFILE with OLLAMA_MODEL=$MODEL"

echo "To start a local chat session (interactive):"
echo "  ollama run $MODEL"
echo "To run the small API example included in this repo:"
echo "  python3 scripts/ask_gemma.py"

exit 0
