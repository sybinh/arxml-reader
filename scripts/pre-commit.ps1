#!/usr/bin/env powershell

<#
.SYNOPSIS
    Pre-commit hook for ARXML Reader extension

.DESCRIPTION
    Runs tests and quality checks before allowing commits
#>

Write-Host "🔍 Running pre-commit checks..." -ForegroundColor Cyan

# Compile TypeScript
Write-Host "`n📦 Compiling TypeScript..."
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript compilation failed!" -ForegroundColor Red
    exit 1
}

# Run regression tests
Write-Host "`n🧪 Running regression tests..."
npm run test:regression
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Regression tests failed!" -ForegroundColor Red
    exit 1
}

# Run linting
Write-Host "`n🔍 Running ESLint..."
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Linting failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All pre-commit checks passed!" -ForegroundColor Green
exit 0
