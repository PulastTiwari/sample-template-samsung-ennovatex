#!/bin/bash
set -e

# Project root (script assumes it's run from project root)
ROOT_DIR="$(pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

echo "Root: $ROOT_DIR"

# --- Backend: Python venv, deps, start uvicorn ---
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "Creating Python venv..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

# shellcheck source=/dev/null
source "$BACKEND_DIR/.venv/bin/activate"

echo "Upgrading pip and installing backend deps..."
python -m pip install --upgrade pip
pip install "fastapi[all]" uvicorn

# Start backend with nohup
echo "Starting backend (uvicorn) in background..."
nohup uvicorn backend.orchestrator:app --reload --host 0.0.0.0 --port 8000 > "$ROOT_DIR/backend.log" 2>&1 &

# --- Frontend: npm install and start dev server ---
if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Frontend directory not found: $FRONTEND_DIR"
  echo "If you haven't created the Next.js app, run the create-next-app command first."
  exit 1
fi

cd "$FRONTEND_DIR"

if [ ! -f "package.json" ]; then
  echo "No package.json in frontend dir. Please run create-next-app or initialize the project."
  exit 1
fi

echo "Installing frontend dependencies (this may take a while)..."
npm install

# Ensure recharts is installed
npm install --no-audit --no-fund recharts || true

# Start frontend dev server in background
echo "Starting frontend (npm run dev) in background..."
nohup npm run dev > "$ROOT_DIR/frontend.log" 2>&1 &

echo "Startup complete. Backend: http://localhost:8000   Frontend: http://localhost:3000"
echo "Logs: $ROOT_DIR/backend.log and $ROOT_DIR/frontend.log"
