@echo off
echo 🚀 Starting Valve Test Suite for Client Demo
echo.

echo 📋 Instructions:
echo 1. Make sure you have ngrok installed and configured
echo 2. This script will start the backend and frontend
echo 3. You'll need to manually start ngrok in separate terminals
echo.

echo 🔧 Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0 && npm run dev"

echo ⏳ Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo 🎨 Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ✅ Servers starting...
echo.
echo 📝 Next Steps:
echo 1. Wait for both servers to fully start
echo 2. Open 2 more terminals and run:
echo    - ngrok http 5000  (for backend)
echo    - ngrok http 5173  (for frontend)
echo 3. Update client/src/services/api.js with ngrok backend URL
echo 4. Share the frontend ngrok URL with your client
echo.
echo 🧪 Test Credentials:
echo    Operator: operator1 / operator123
echo    Admin: admin1 / admin123
echo.

pause
