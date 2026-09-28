# funnel_down.ps1 - Apaga Tailscale Funnel (EduPlay local queda intacto).
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'eduplay_detect.ps1')

$ts = Get-TailscaleExe
if (-not $ts) {
    Write-Host 'Tailscale no esta instalado; nada que apagar.'
    exit 0
}

$cur = Invoke-Tailscale -Exe $ts -Arguments @('funnel', 'status') -TimeoutSec 20
if ($cur.Output -match 'No serve config') {
    Write-Host 'Funnel ya estaba apagado.'
    exit 0
}

Write-Host 'Apagando Funnel...'
$r = Invoke-Tailscale -Exe $ts -Arguments @('funnel', 'reset') -TimeoutSec 30
if ($r.TimedOut) {
    $r = Invoke-Tailscale -Exe $ts -Arguments @('funnel', 'reset') -TimeoutSec 30 -StdIn 'y'
}

Start-Sleep -Seconds 1
$check = Invoke-Tailscale -Exe $ts -Arguments @('funnel', 'status') -TimeoutSec 20
if ($check.Output -match 'No serve config') {
    Write-Host 'Funnel apagado. La URL publica deja de responder hasta funnel_up.ps1'
    Write-Host '(la URL es la misma al volver a encender).'
    exit 0
}
Write-Host 'ERROR: la configuracion persiste. Salida:'
Write-Host $r.Output
Write-Host $check.Output
exit 1
