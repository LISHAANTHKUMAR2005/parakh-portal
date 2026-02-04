@echo off
echo Starting Parakh Portal...

echo Starting Backend...
start "Parakh Backend" cmd /k "cd parakh-backend && mvn spring-boot:run"

echo Starting Frontend...
start "Parakh Frontend" cmd /k "cd parakh-frontend && npm run dev"

echo Done! Access the app at http://localhost:5173
