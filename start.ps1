# PowerShell Runner for CampusPrint
# Runs backend server and frontend client

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting CampusPrint (NIT Srinagar Campus Zone) " -ForegroundColor Yellow
Write-Host " Synthetic Data Prototype - All records fictional " -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

$serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start" -PassThru
$clientProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev" -PassThru

Write-Host "Backend launched on PID $($serverProcess.Id) (http://localhost:5000)" -ForegroundColor Green
Write-Host "Frontend launched on PID $($clientProcess.Id) (http://localhost:3000)" -ForegroundColor Green
Write-Host "Press Ctrl+C or close windows to exit." -ForegroundColor Cyan
