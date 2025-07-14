# TraceChain Startup Script

Write-Host "🚀 Starting TraceChain Backend Server..." -ForegroundColor Green

# Navigate to backend directory
Set-Location backend

# Start the server
node server-mongodb.js
