param(
  [string]$Sender = "bio.pelayo@gmail.com",
  [string]$Recipients = "bio.pelayo@gmail.com,afrafele@hotmail.com"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$privateDirectory = Join-Path $projectRoot ".local"
$configPath = Join-Path $privateDirectory "email.private.json"

Write-Host "Configuración privada de Radar Fondos Asturias"
Write-Host "Remitente: $Sender"
Write-Host "Destinatarios: $Recipients"
$securePassword = Read-Host "Pega la contraseña de aplicación de Google (no la contraseña normal)" -AsSecureString

New-Item -ItemType Directory -Path $privateDirectory -Force | Out-Null
[pscustomobject]@{
  gmail_address = $Sender
  alert_email = $Recipients
  encrypted_password = ConvertFrom-SecureString $securePassword
} | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8

Write-Host "Configuración cifrada guardada solo para tu usuario de Windows."
