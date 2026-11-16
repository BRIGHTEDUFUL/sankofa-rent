#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo ""
echo "============================================"
echo " Sankofa Rent — One-Click Setup & Run"
echo "============================================"
echo ""

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed. Please install Node.js 22 or later from https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js found: $(node -v)"
echo ""

# 2. Create .env.local if missing
if [ ! -f ".env.local" ]; then
    echo "[SETUP] Creating .env.local with credentials ..."
    cat << 'EOF' > .env.local
CONVEX_DEPLOYMENT=dev:adorable-pig-437
CONVEX_DEPLOY_KEY=dev:adorable-pig-437|eyJ2MiI6IjBlN2YxYTFiNjk4NzRjMDk5ODEzOTlmNzViMzFhMDJlIn0=
VITE_CONVEX_URL=https://adorable-pig-437.convex.cloud
VITE_CONVEX_SITE_URL=https://adorable-pig-437.convex.site
EOF
    echo "[OK] .env.local created successfully"
else
    echo "[OK] .env.local already exists"
fi
echo ""

# 3. Install dependencies
if [ ! -d "node_modules" ]; then
    echo "[SETUP] Installing dependencies (npm install) ..."
    npm install
    echo "[OK] Dependencies installed successfully"
else
    echo "[OK] node_modules found"
fi
echo ""

# 4. Run tests
echo "[CHECK] Verifying setup with unit tests ..."
npm test -- --run
echo "[OK] All tests passed"
echo ""

# 5. Start Convex dev in background
echo "[START] Launching Convex backend sync in background ..."
npx convex dev &
CONVEX_PID=$!

# Trap Ctrl+C to clean up convex background process
cleanup() {
    echo ""
    echo "Stopping Convex backend..."
    kill $CONVEX_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

sleep 3

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
