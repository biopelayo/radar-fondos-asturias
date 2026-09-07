$ErrorActionPreference = "Stop"
$runner = Join-Path $PSScriptRoot "run_radar.ps1"
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
  -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal `
  -UserId $currentUser `
  -LogonType Interactive `
  -RunLevel Limited

$definitions = @(
  @{ Name = "Radar Fondos Asturias - Manana"; Time = "09:00"; Slot = "morning" },
  @{ Name = "Radar Fondos Asturias - Tarde"; Time = "17:00"; Slot = "afternoon" }
)

foreach ($definition in $definitions) {
  $arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -Slot {1}' -f $runner, $definition.Slot
  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arguments
  $trigger = New-ScheduledTaskTrigger -Daily -At $definition.Time
  Register-ScheduledTask `
    -TaskName $definition.Name `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Actualiza, valida, publica y avisa desde Radar Fondos Asturias." `
    -Force | Out-Null
}

Get-ScheduledTask -TaskName "Radar Fondos Asturias*" |
  Select-Object TaskName, State |
  Format-Table -AutoSize
