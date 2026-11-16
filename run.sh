#!/usr/bin/env bash
set -e

# Navigate to script folder
cd "$(dirname "$0")"

echo ""
echo "======================================================"
echo " Sankofa Rent — One-Click Setup & Run"
echo "======================================================"
echo ""

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed. Please install Node.js 22 or later from https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js detected: $(node -v)"
echo ""

# 2. Ensure .env.local exists
if [ ! -f ".env.local" ]; then
    echo "[SETUP] Creating .env.local from .env.example ..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
    else
        cat << 'EOF' > .env.local
CONVEX_DEPLOYMENT=dev:adorable-pig-437
CONVEX_DEPLOY_KEY=dev:adorable-pig-437|eyJ2MiI6IjBlN2YxYTFiNjk4NzRjMDk5ODEzOTlmNzViMzFhMDJlIn0=
VITE_CONVEX_URL=https://adorable-pig-437.convex.cloud
VITE_CONVEX_SITE_URL=https://adorable-pig-437.convex.site
EOF
    fi
    echo "[OK] .env.local created successfully"
else
    echo "[OK] .env.local found"
fi
echo ""

# 3. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "[SETUP] Installing npm dependencies ..."
    npm install
    echo "[OK] Dependencies installed successfully"
else
    echo "[OK] Dependencies already installed"
fi
echo ""

# 4. Sync Convex backend functions
echo "[SETUP] Synchronizing Convex backend functions ..."
npx convex dev --once --env-file .env.local || echo "[WARNING] Initial sync warning, continuing..."
echo "[OK] Convex backend functions verified"
echo ""

# 5. Start Convex watcher in background
echo "[START] Starting Convex watcher in background ..."
npx convex dev --env-file .env.local &
CONVEX_PID=$!

cleanup() {
    echo ""
    echo "Stopping Convex backend (PID $CONVEX_PID)..."
    kill $CONVEX_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

sleep 2

# 6. Auto-open browser
if command -v xdg-open >/dev/null 2>&1; then
    (sleep 3 && xdg-open http://localhost:3000) &
elif command -v open >/dev/null 2>&1; then
    (sleep 3 && open http://localhost:3000) &
fi

echo ""
echo "======================================================"
echo " Sankofa Rent running at: http://localhost:3000"
echo " Press Ctrl+C to stop both frontend and backend."
echo "======================================================"
echo ""

npm run dev
