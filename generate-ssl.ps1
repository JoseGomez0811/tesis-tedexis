# generate-ssl.ps1 - Script para generar certificados SSL autofirmados

$ErrorActionPreference = "Stop"

Write-Host "🔐 Generando certificados SSL autofirmados..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si el directorio existe
$sslDir = ".\nginx\ssl"
if (-not (Test-Path $sslDir)) {
    Write-Host "📁 Creando directorio nginx/ssl..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
}

# Verificar si OpenSSL está disponible
$opensslAvailable = $false
try {
    $opensslVersion = openssl version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $opensslAvailable = $true
        Write-Host "✅ OpenSSL encontrado: $opensslVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  OpenSSL no encontrado en PATH" -ForegroundColor Yellow
}

# Si OpenSSL no está disponible, usar Docker
if (-not $opensslAvailable) {
    Write-Host "🐳 Usando Docker para generar certificados..." -ForegroundColor Yellow
    
    # Verificar si Docker está corriendo
    try {
        docker info > $null 2>&1
    } catch {
        Write-Host "❌ Docker no está corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
        exit 1
    }
    
    # Generar certificado usando Docker (imagen con OpenSSL)
    Write-Host "📝 Generando certificado y clave privada..." -ForegroundColor Yellow
    
    docker run --rm -v "${PWD}/nginx/ssl:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
        -keyout /certs/key.pem `
        -out /certs/cert.pem `
        -subj "/C=ES/ST=Madrid/L=Madrid/O=TEDEXIS/OU=Development/CN=localhost" `
        -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Certificados generados exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error generando certificados" -ForegroundColor Red
        exit 1
    }
} else {
    # Usar OpenSSL local
    Write-Host "📝 Generando certificado y clave privada..." -ForegroundColor Yellow
    
    Set-Location $sslDir
    
    # Generar clave privada
    openssl genrsa -out key.pem 2048
    
    # Generar certificado autofirmado
    openssl req -new -x509 -key key.pem -out cert.pem -days 365 `
        -subj "/C=ES/ST=Madrid/L=Madrid/O=TEDEXIS/OU=Development/CN=localhost" `
        -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1"
    
    Set-Location ../..
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Certificados generados exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error generando certificados" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Archivos generados:" -ForegroundColor Cyan
Write-Host "  - nginx/ssl/cert.pem (certificado)" -ForegroundColor White
Write-Host "  - nginx/ssl/key.pem (clave privada)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Estos son certificados autofirmados para desarrollo." -ForegroundColor Yellow
Write-Host "   Tu navegador mostrará una advertencia de seguridad." -ForegroundColor Yellow
Write-Host "   Acepta la excepción para continuar en desarrollo." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Accede a tu aplicación con: https://localhost" -ForegroundColor Green
Write-Host "   (NO uses http://localhost:443)" -ForegroundColor Yellow
Write-Host ""











