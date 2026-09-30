# eduplay_down.ps1 - Apaga el servidor EduPlay (Next.js) local.
param([int]$Port = 0)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'eduplay_detect.ps1')
$root = Get-EduplayRoot
if ($Port -le 0) { $Port = Get-EduplayPort }

$rootEscaped = [regex]::Escape($root)
$targets = @()

# 1) Procesos next/npm/cmd de ESTE proyecto.
$procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -in @('node.exe', 'cmd.exe') -and $_.CommandLine -and
    $_.CommandLine -match 'npm run dev|npm run start|next dev|next start' -and
    $_.CommandLine -match $rootEscaped
}
foreach ($p in $procs) { $targets += [int]$p.ProcessId }

# 2) El proceso que escucha el puerto detectado (si sigue vivo).
$conn = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) { $targets += [int]$conn.OwningProcess }

$targets = $targets | Sort-Object -Unique
if (-not $targets -or $targets.Count -eq 0) {
    Write-Host "EduPlay no esta corriendo (puerto $Port libre)."
    exit 0
}

foreach ($t in $targets) {
    Stop-Process -Id $t -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

if (Test-EduplayUp -Port $Port) {
    Write-Host "ERROR: el puerto $Port sigue ocupado. Revisa el proceso manualmente."
    exit 1
}
Write-Host "EduPlay apagado (puerto $Port liberado)."
exit 0
