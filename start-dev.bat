@echo off
echo Starting Expense Management System...
echo.

REM Check if .env exists
if not exist "server\.env" (
    echo Creating .env file...
    copy "server\env.example" "server\.env"
    echo Please update server\.env with your MongoDB URI and JWT secret
    echo.
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server && npm install && cd ..
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client && npm install && cd ..
)

echo Starting development servers...
npm run dev
