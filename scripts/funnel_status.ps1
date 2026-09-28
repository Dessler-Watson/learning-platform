# funnel_status.ps1 - Estado de Tailscale + Funnel + EduPlay (local y publico).
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'eduplay_detect.ps1')

Write-Host '=== Tailscale ==='
$ts = Get-TailscaleExe
if (-not $ts) {
    Write-Host 'No instalado. winget install --id Tailscale.Tailscale --exact'
    exit 1
}
$st = Invoke-Tailscale -Exe $ts -Arguments @('status') -TimeoutSec 20
if ($st.Output -match 'Logged out') {
    Write-Host 'Sesion: NO iniciada'
    if ($st.Output -match '(https://login\.tailscale\.com/\S+)') { Write-Host "Login:  $($Matches[1])" }
    exit 1
}
if ($st.Output -match '^(\S+)\s+(\S+)\s+(\S+)') {
    Write-Host "Nodo:   $($Matches[1])  ($($Matches[3]))"
}
$dns = Invoke-Tailscale -Exe $ts -Arguments @('dns', 'status') -TimeoutSec 20
if ($dns.Output -match 'suffix\s*=\s*([\w.-]+)') { Write-Host "DNS:    MagicDNS activo (sufijo $($Matches[1]))" }
else { Write-Host 'DNS:    MagicDNS no detectado' }

Write-Host ''
Write-Host '=== Funnel ==='
$fs = Invoke-Tailscale -Exe $ts -Arguments @('funnel', 'status') -TimeoutSec 20
$port = Get-EduplayPort
$publicUrl = $null
if ($fs.Output -match 'No serve config') {
    Write-Host 'Estado: APAGADO (activar: scripts\funnel_up.ps1)'
} else {
    $m = [regex]::Match($fs.Output, 'https://[A-Za-z0-9._-]+\.ts\.net[^ \r\n"]*')
    if ($m.Success) { $publicUrl = $m.Value }
    Write-Host 'Estado: ACTIVO (background)'
    if ($publicUrl) { Write-Host "URL:    $publicUrl" }
    if ($fs.Output -match 'http://127\.0\.0\.1:(\d+)') { Write-Host "Proxy:  127.0.0.1:$($Matches[1])" }
}

Write-Host ''
Write-Host '=== EduPlay local ==='
$up = Test-EduplayUp -Port $port
Write-Host "Puerto $port : $(if ($up) { 'ESCUCHANDO' } else { 'APAGADO' })"
if ($up) {
    $s = Get-EduplayHttpStatus -Port $port -Path '/'
    Write-Host "HTTP local   : $s"
    $s2 = Get-EduplayHttpStatus -Port $port -Path '/api/auth/me'
    Write-Host "API local    : $s2 (200/401 = OK)"
}

if ($publicUrl) {
    Write-Host ''
    Write-Host '=== Acceso publico ==='
    try {
        $r = Invoke-WebRequest -Uri $publicUrl -UseBasicParsing -TimeoutSec 20
        Write-Host "HTTP publico : $($r.StatusCode)"
        $ra = Invoke-WebRequest -Uri ($publicUrl.TrimEnd('/') + '/api/auth/me') -UseBasicParsing -TimeoutSec 20
        Write-Host "API publica  : $($ra.StatusCode)"
    } catch {
        if ($_.Exception.Response) { Write-Host "HTTP publico : $([int]$_.Exception.Response.StatusCode)" }
        else { Write-Host "HTTP publico : sin respuesta ($($_.Exception.Message))" }
    }
    if (-not $up) { Write-Host 'AVISO: Funnel activo pero EduPlay apagado -> 502 hasta encenderlo.' }
}
exit 0
