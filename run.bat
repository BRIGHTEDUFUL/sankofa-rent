@echo off
setlocal enabledelayedexpansion
title Sankofa Rent — Setup ^& Run
color 0A

echo.
echo  ============================================
echo   Sankofa Rent — One-Click Setup ^& Run
echo  ============================================
echo.

:: ── 1. Check Node.js ──────────────────────────
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js is not installed.
    echo.
    echo  Please install Node.js 22 or later from:
    echo    https://nodejs.org/
    echo.
    echo  Then double-click this file again.
    echo.
    pause
    exit /b 1
)

echo  [OK] Node.js found:
node -v
echo.

:: ── 2. Navigate to project folder ─────────────
cd /d "%~dp0"
echo  [OK] Working directory: %cd%
echo.

:: ── 3. Create .env.local if missing ───────────
if not exist ".env.local" (
    echo  [SETUP] Creating .env.local with credentials ...
    (
        echo CONVEX_DEPLOYMENT=dev:adorable-pig-437
        echo CONVEX_DEPLOY_KEY=dev:adorable-pig-437^|eyJ2MiI6IjBlN2YxYTFiNjk4NzRjMDk5ODEzOTlmNzViMzFhMDJlIn0=
        echo VITE_CONVEX_URL=https://adorable-pig-437.convex.cloud
        echo VITE_CONVEX_SITE_URL=https://adorable-pig-437.convex.site
    ) > ".env.local"
    echo  [OK] .env.local created successfully
) else (
    echo  [OK] .env.local already exists
)
echo.

:: ── 4. Install dependencies ───────────────────
if not exist "node_modules" (
    echo  [SETUP] Installing dependencies (npm install) ...
    echo  This may take 1-2 minutes on first run. Please wait...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Dependencies installed successfully
) else (
    echo  [OK] node_modules found — skipping install
    echo       (Delete node_modules and re-run to force a fresh install)
)
echo.

:: ── 5. Run tests to verify ────────────────────
echo  [CHECK] Verifying setup with unit tests ...
call npm test -- --run
if %errorlevel% neq 0 (
    color 0E
    echo.
    echo  [WARNING] Some tests failed, but starting app anyway...
    echo.
) else (
    echo  [OK] All 20 tests passed
)
echo.

:: ── 6. Start Convex backend sync ──────────────
echo  [START] Launching Convex backend sync in a separate window ...
start "Convex Backend — Sankofa Rent" cmd /k "cd /d "%~dp0" && title Convex Backend — Sankofa Rent && color 0B && echo [Convex Sync Running...] && npx convex dev"

:: Wait 3 seconds for Convex to initialize
timeout /t 3 /nobreak >nul

:: ── 7. Auto-open browser in 4 seconds ─────────
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"

:: ── 8. Start the frontend dev server ──────────
echo  [START] Launching Vite dev server ...
echo.
echo  ======================================================
echo   Sankofa Rent is starting at: http://localhost:3000
echo   Your browser will open automatically in a few seconds!
echo  ======================================================
echo.
echo  Two windows are running:
echo    1. This window  = Vite Frontend Server
echo    2. Other window = Convex Backend Sync
echo.
echo  Press Ctrl+C here to stop the frontend server.
echo  Close the Convex window to stop the backend.
echo.

call npm run dev
