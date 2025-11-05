# fix-angular-imports.ps1
# Script para solucionar problemas de imports de Angular en Windows

Write-Host "🔧 Solucionando problemas de imports de Angular..." -ForegroundColor Cyan

# Navegar al directorio del Frontend
Set-Location Frontend

Write-Host "📦 Paso 1: Limpiando caché y node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}
if (Test-Path ".angular") {
    Remove-Item -Recurse -Force .angular
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
}

Write-Host "🧹 Paso 2: Limpiando caché de npm..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "📥 Paso 3: Reinstalando dependencias..." -ForegroundColor Yellow
npm install

Write-Host "🔍 Paso 4: Verificando versiones de Angular..." -ForegroundColor Yellow
npm list @angular/core @angular/common @angular/router @angular/forms

Write-Host "🏗️  Paso 5: Reconstruyendo el proyecto..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Proceso completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Si aún tienes errores, ejecuta:" -ForegroundColor Cyan
Write-Host "  ng version"
Write-Host "  npm audit fix"