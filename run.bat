@echo off
setlocal
title Sankofa Rent — Setup ^& Run
color 0A

echo.
echo  ======================================================
echo   Sankofa Rent — One-Click Setup ^& Run
echo  ======================================================
echo.

:: ── 1. Navigate to script folder ──────────────
cd /d "%~dp0"
echo  [OK] Working directory: %cd%
echo.

:: ── 2. Check Node.js ──────────────────────────
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js is not found in your PATH.
    echo.
    echo  Please install Node.js 22 or later from:
    echo    https://nodejs.org/
    echo.
    echo  After installing Node.js, run this file again.
    echo.
    pause
    exit /b 1
)

echo  [OK] Node.js detected:
call node -v
echo.

:: ── 3. Ensure .env.local exists ───────────────
if not exist ".env.local" (
    echo  [SETUP] Creating .env.local from .env.example ...
    if exist ".env.example" (
        copy /y ".env.example" ".env.local" >nul
    ) else (
        (
            echo CONVEX_DEPLOYMENT=dev:adorable-pig-437
            echo CONVEX_DEPLOY_KEY=dev:adorable-pig-437^|eyJ2MiI6IjBlN2YxYTFiNjk4NzRjMDk5ODEzOTlmNzViMzFhMDJlIn0=
            echo VITE_CONVEX_URL=https://adorable-pig-437.convex.cloud
            echo VITE_CONVEX_SITE_URL=https://adorable-pig-437.convex.site
        ) > ".env.local"
    )
    echo  [OK] .env.local created successfully
) else (
    echo  [OK] .env.local found
)
echo.

:: ── 4. Install dependencies if needed ─────────
if not exist "node_modules\" (
    echo  [SETUP] Installing npm dependencies ...
    echo  This takes 1-2 minutes on first run. Please wait...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  [ERROR] npm install encountered an error.
        echo  Please check your internet connection and try again.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Dependencies installed successfully
) else (
    echo  [OK] Dependencies already installed
)
echo.

:: ── 5. Sync backend functions to Convex ───────
echo  [SETUP] Synchronizing Convex backend functions ...
call npx convex dev --once --env-file .env.local
if %errorlevel% neq 0 (
    color 0E
    echo  [WARNING] Initial Convex sync had an issue. Continuing anyway...
) else (
    echo  [OK] Convex backend functions verified and synced!
)
echo.

:: ── 6. Start Convex dev watcher in background ─
echo  [START] Starting Convex watcher in background window ...
start "Convex Backend — Sankofa Rent" cmd /k "title Convex Backend — Sankofa Rent && color 0B && npx convex dev --env-file .env.local"

:: Wait 2 seconds
ping 127.0.0.1 -n 3 >nul

:: ── 7. Auto-open browser in 3 seconds ─────────
start "" cmd /c "ping 127.0.0.1 -n 4 >nul && start http://localhost:3000"

:: ── 8. Start Vite frontend server ─────────────
echo.
echo  ======================================================
echo   Sankofa Rent is starting at: http://localhost:3000
echo   Your default browser will open automatically!
echo  ======================================================
echo.
echo   Press Ctrl+C in this window to stop the frontend.
echo   Close the "Convex Backend" window to stop the backend.
echo.

call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo  [INFO] Vite dev server has stopped.
)
pause
