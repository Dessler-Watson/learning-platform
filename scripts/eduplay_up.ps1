# eduplay_up.ps1 - Enciende EduPlay (Next.js) en background, sin terminal abierta.
# Detecta automaticamente el comando (package.json -> scripts.dev) y el puerto.
param([int]$Port = 0)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'eduplay_detect.ps1')
$root = Get-EduplayRoot

$running = Get-ListeningPortByPattern -Pattern (Get-EduplayNextPattern)
if ($running -gt 0) {
    Write-Host "EduPlay ya esta corriendo en el puerto $running (http://localhost:$running)"
    exit 0
}

$devCmd = Get-EduplayDevCommand
$portExplicit = $PSBoundParameters.ContainsKey('Port') -and $Port -gt 0
if (-not $portExplicit) { $Port = Get-EduplayPort }

$npmArgs = 'run dev'
if ($portExplicit) { $npmArgs += " -- -p $Port" }
Write-Host "Comando: npm $npmArgs  (script dev: $devCmd)"
Write-Host "Puerto:  $Port"

$log = Join-Path $root 'dev_server.log'
$err = Join-Path $root 'dev_server.err.log'
Start-Process -FilePath cmd.exe `
    -ArgumentList '/c', "npm $npmArgs > `"$log`" 2> `"$err`"" `
    -WorkingDirectory $root -WindowStyle Hidden | Out-Null

Write-Host 'Esperando que el servidor responda...'
$ok = $false
foreach ($i in 1..60) {
    Start-Sleep -Seconds 3
    $s = Get-EduplayHttpStatus -Port $Port -Path '/api/auth/me'
    if ($s -eq 200 -or $s -eq 401) { $ok = $true; break }
}

if ($ok) {
    Write-Host "EduPlay listo: http://localhost:$Port"
    Write-Host "Logs: dev_server.log / dev_server.err.log"
    Write-Host "Para apagar: powershell -ExecutionPolicy Bypass -File scripts\eduplay_down.ps1"
    exit 0
}
Write-Host "ERROR: el servidor no respondio en 180s. Revisa dev_server.err.log"
exit 1
