# VORTEX - Update .env.local with new DATABASE_URL
# Usage: .\scripts\update-env.ps1

$envFile = ".env.local"
$newDatabaseUrl = "postgresql://neondb_owner:npg_sFaE2f3HvliO@ep-frosty-voice-ahdpv8xe-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

if (Test-Path $envFile) {
    # Read current content
    $content = Get-Content $envFile -Raw
    
    # Replace DATABASE_URL if exists, otherwise append
    if ($content -match "DATABASE_URL=") {
        $content = $content -replace "DATABASE_URL=.*", "DATABASE_URL=$newDatabaseUrl"
        Write-Host "✅ Updated DATABASE_URL in .env.local" -ForegroundColor Green
    } else {
        $content += "`nDATABASE_URL=$newDatabaseUrl`n"
        Write-Host "✅ Added DATABASE_URL to .env.local" -ForegroundColor Green
    }
    
    # Write back
    Set-Content -Path $envFile -Value $content -NoNewline
} else {
    # Create new file
    "DATABASE_URL=$newDatabaseUrl" | Out-File -FilePath $envFile -Encoding utf8
    Write-Host "✅ Created .env.local with DATABASE_URL" -ForegroundColor Green
}

Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart backend: cd apps/api && bun run dev" -ForegroundColor Yellow
Write-Host "2. Test health: curl http://localhost:3001/api/health" -ForegroundColor Yellow
