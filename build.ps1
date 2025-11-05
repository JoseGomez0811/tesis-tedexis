# build.ps1 - Script completo para rebuild del proyecto

param(
    [switch]$Clean = $false,
    [switch]$NoBuild = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 TEDEXIS - Script de Build" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si Docker está corriendo
function Test-DockerRunning {
    try {
        docker info > $null 2>&1
        return $true
    } catch {
        return $false
    }
}

# Verificar Docker
if (-not (Test-DockerRunning)) {
    Write-Host "❌ Docker no está corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker está corriendo" -ForegroundColor Green
Write-Host ""

# Limpiar si se solicitó
if ($Clean) {
    Write-Host "🧹 Limpiando contenedores y volúmenes..." -ForegroundColor Yellow
    docker-compose down -v
    
    Write-Host "🧹 Limpiando Frontend..." -ForegroundColor Yellow
    Set-Location Frontend
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force .angular -ErrorAction SilentlyContinue
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
    Set-Location ..
    
    Write-Host "✅ Limpieza completada" -ForegroundColor Green
    Write-Host ""
}

# Build local del Frontend (opcional pero recomendado)
if (-not $NoBuild) {
    Write-Host "📦 Instalando dependencias del Frontend..." -ForegroundColor Yellow
    Set-Location Frontend
    
    if (-not (Test-Path "node_modules")) {
        npm ci --legacy-peer-deps
    }
    
    Write-Host "🏗️  Compilando Angular..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error compilando Angular" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Write-Host "✅ Frontend compilado exitosamente" -ForegroundColor Green
    Set-Location ..
    Write-Host ""
}

# Build de Docker
Write-Host "🐳 Construyendo imágenes de Docker..." -ForegroundColor Yellow
docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en build de Docker" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Imágenes construidas exitosamente" -ForegroundColor Green
Write-Host ""

# Iniciar servicios
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error iniciando servicios" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ ¡Servicios iniciados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Estado de los servicios:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🌐 URLs de acceso:" -ForegroundColor Cyan
Write-Host "  Frontend: https://localhost" -ForegroundColor White
Write-Host "  Backend:  https://localhost/api" -ForegroundColor White
Write-Host ""
Write-Host "📝 Ver logs con: docker-compose logs -f [servicio]" -ForegroundColor Gray
Write-Host "🛑 Detener con: docker-compose down" -ForegroundColor Gray
Write-Host ""

# Esperar a que los servicios estén listos
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar health de servicios
Write-Host ""
Write-Host "🏥 Health check de servicios:" -ForegroundColor Cyan
docker-compose ps --format json | ConvertFrom-Json | ForEach-Object {
    $status = $_.State
    $name = $_.Service
    $color = if ($status -eq "running") { "Green" } else { "Red" }
    Write-Host "  $name`: $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "🎉 ¡Build completado!" -ForegroundColor Green