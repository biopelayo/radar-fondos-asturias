param(
  [ValidateSet("morning", "afternoon")]
  [string]$Slot = "morning"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $projectRoot ".local\email.private.json"

if (-not (Test-Path -LiteralPath $configPath)) {
  Write-Host "Correo local no configurado; ejecuta scripts/configure_email.ps1."
  exit 0
}

$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$securePassword = ConvertTo-SecureString $config.encrypted_password
$credential = [System.Net.NetworkCredential]::new("", $securePassword)

try {
  $env:GMAIL_ADDRESS = [string]$config.gmail_address
  $env:GMAIL_APP_PASSWORD = $credential.Password
  $env:ALERT_EMAIL = [string]$config.alert_email
  $env:RADAR_RUN_SLOT = $Slot
  python (Join-Path $PSScriptRoot "send_digest.py")
  exit $LASTEXITCODE
}
finally {
  Remove-Item Env:GMAIL_ADDRESS -ErrorAction SilentlyContinue
  Remove-Item Env:GMAIL_APP_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:ALERT_EMAIL -ErrorAction SilentlyContinue
  Remove-Item Env:RADAR_RUN_SLOT -ErrorAction SilentlyContinue
}
