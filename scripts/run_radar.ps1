param(
  [ValidateSet("morning", "afternoon")]
  [string]$Slot = "morning"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $projectRoot ".local\logs"
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$logPath = Join-Path $logDirectory ("radar-{0}-{1}.log" -f $Slot, (Get-Date -Format "yyyyMMdd-HHmmss"))

Start-Transcript -LiteralPath $logPath | Out-Null
try {
  Set-Location -LiteralPath $projectRoot

  & python (Join-Path $PSScriptRoot "collect.py")
  if ($LASTEXITCODE -ne 0) { throw "La recolección falló con código $LASTEXITCODE." }

  & npm run build
  if ($LASTEXITCODE -ne 0) { throw "La compilación falló con código $LASTEXITCODE." }

  & git diff --quiet -- public/data/opportunities.json src/data/opportunities.generated.json
  $datasetChanged = $LASTEXITCODE -ne 0
  if ($datasetChanged) {
    & git add -- public/data/opportunities.json src/data/opportunities.generated.json
    if ($LASTEXITCODE -ne 0) { throw "No se pudo preparar el dataset para Git." }

    & git commit -m "data: refresh opportunity radar"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo registrar el dataset actualizado." }

    & git push origin HEAD:main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo publicar el dataset en main." }

    & npx.cmd --no-install gh-pages -d dist -b gh-pages -m "data: publish refreshed radar"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo publicar la web en gh-pages." }

    & gh api --method POST repos/biopelayo/radar-fondos-asturias/pages/builds | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "No se pudo solicitar la reconstrucción de GitHub Pages." }
  }
  else {
    Write-Host "Dataset sin cambios; no se crea commit ni despliegue redundante."
  }

  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "send_digest_local.ps1") -Slot $Slot
  if ($LASTEXITCODE -ne 0) { throw "El aviso por correo falló con código $LASTEXITCODE." }

  Write-Host "Radar completado correctamente ($Slot). Log: $logPath"
}
catch {
  Write-Error $_
  exit 1
}
finally {
  Stop-Transcript | Out-Null
}
