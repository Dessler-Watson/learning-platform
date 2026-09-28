# funnel_up.ps1 - Activa Tailscale Funnel hacia el servidor Next.js local (background).
# Uso: powershell -ExecutionPolicy Bypass -File scripts\funnel_up.ps1 [-Port N] [-Force]
param([int]$Port = 0, [switch]$Force)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'eduplay_detect.ps1')

$ts = Get-TailscaleExe
if (-not $ts) {
    Write-Host 'Tailscale no esta instalado. Instalar con:'
    Write-Host '  winget install --id Tailscale.Tailscale --exact'
    exit 1
}

# 1) Login de Tailscale.
$st = Invoke-Tailscale -Exe $ts -Arguments @('status') -TimeoutSec 20
if ($st.Output -match 'Logged out') {
    if ($st.Output -match '(https://login\.tailscale\.com/\S+)') {
        $loginUrl = $Matches[1]
        Write-Host 'Tailscale no tiene sesion iniciada. Abriendo: ' -NoNewline
        Write-Host $loginUrl
        Start-Process $loginUrl
    } else {
        Write-Host 'Tailscale no tiene sesion iniciada. Ejecuta: tailscale login'
    }
    exit 1
}

# 2) Puerto de EduPlay (auto-deteccion).
$portExplicit = $PSBoundParameters.ContainsKey('Port') -and $Port -gt 0
if (-not $portExplicit) { $Port = Get-EduplayPort }

$appUp = Test-EduplayUp -Port $Port
if (-not $appUp) {
    Write-Host "AVISO: EduPlay no responde en el puerto $Port."
    Write-Host '       Enciendelo primero: scripts\eduplay_up.ps1'
    Write-Host '       (el Funnel quedara con error 502 hasta que enciendas).'
}

# 3) ¿Ya hay configuracion de serve/funnel?
$cur = Invoke-Tailscale -Exe $ts -Arguments @('funnel', 'status') -TimeoutSec 20
if ($cur.Output -notmatch 'No serve config') {
    $existing = [regex]::Match($cur.Output, 'https://[A-Za-z0-9._-]+\.ts\.net[^ \r\n"]*')
    if ($existing.Success -and -not $Force) {
        Write-Host "Funnel ya activo: $($existing.Value)"
        Write-Host "Proxy -> 127.0.0.1:$Port (config persistente; sigue funcionando tras reinicios)."
        exit 0
    }
    if ($Force) {
        Write-Host 'Force: limpiando configuracion previa...'
        Invoke-Tailscale -Exe $ts -Arguments @('funnel', 'reset') -TimeoutSec 30 | Out-Null
    }
}

# 4) Habilitar funnel en background hacia SOLO 127.0.0.1:$Port.
Write-Host "Activando Funnel -> http://127.0.0.1:$Port ..."
$r = Invoke-Tailscale -Exe $ts -Arguments @('funnel', '--bg', "$Port") -TimeoutSec 30
if ($r.TimedOut) {
    # Prompt interactivo: responder 'y' y reintentar.
    $r = Invoke-Tailscale -Exe $ts -Arguments @('funnel', '--bg', "$Port") -TimeoutSec 30 -StdIn 'y'
}

if ($r.Output -match 'Funnel is not enabled on your tailnet') {
    Write-Host 'El Funnel esta deshabilitado en el tailnet. Habilitarlo (paso manual en Tailscale):'
    if ($r.Output -match '(https://login\.tailscale\.com/\S+)') {
        $enableUrl = $Matches[1]
        Write-Host "  1. Abrir: $enableUrl"
        Write-Host '  2. Click en "Enable Funnel" y volver a ejecutar este script.'
        Start-Process $enableUrl
    } else {
        Write-Host '  Habilitar Funnel en la consola de Tailscale y reintentar.'
    }
    exit 1
}
if ($r.TimedOut) {
    Write-Host 'ERROR: tailscale funnel se colgo (prompt no resuelto).'
    exit 1
}
if ($r.Output -match 'invalid argument') {
    Write-Host 'ERROR de sintaxis de tailscale:'
    Write-Host $r.Output
    exit 1
}

# 5) Leer la config final y mostrar la URL publica.
Start-Sleep -Seconds 2
$fs = Invoke-Tailscale -Exe $ts -Arguments @('funnel', 'status') -TimeoutSec 20
$url = $null
$m = [regex]::Match($fs.Output, 'https://[A-Za-z0-9._-]+\.ts\.net[^ \r\n"]*')
if ($m.Success) { $url = $m.Value }

if (-not $url) {
    # Fallback: armar la URL desde el nombre del nodo + sufijo MagicDNS.
    $machine = $null
    $line = ($fs.Output -split "`n" | Where-Object { $_ -match '\s' } | Select-Object -First 1)
    if ($st.Output -match '^(\S+)\s+(\S+)') { $machine = $Matches[1] }
    $suffix = $null
    $dns = Invoke-Tailscale -Exe $ts -Arguments @('dns', 'status') -TimeoutSec 20
    if ($dns.Output -match 'suffix\s*=\s*(\S+)') { $suffix = $Matches[1] }
    if ($machine -and $suffix) { $url = "https://$machine.$suffix/" }
}

if ($url) {
    Write-Host ''
    Write-Host 'Funnel activo (background, no necesita terminal).'
    Write-Host "URL publica fija: $url"
    Write-Host "Proxy local:      127.0.0.1:$Port (solo Next.js; PostgreSQL no se expone)"
    Write-Host "Estado:           scripts\funnel_status.ps1"
    Write-Host "Apagar funnel:    scripts\funnel_down.ps1"
    exit 0
}

Write-Host 'Funnel ejecutado pero no se pudo leer la URL. Revisa: tailscale funnel status'
Write-Host $fs.Output
exit 1
