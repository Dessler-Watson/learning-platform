# Deteccion automatica de comando y puerto de EduPlay (dot-source desde otros scripts).
function Get-EduplayRoot { Split-Path -Parent $PSScriptRoot }

function Get-EduplayDevCommand {
    $pkgPath = Join-Path (Get-EduplayRoot) 'package.json'
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if ($pkg.scripts.dev) { return [string]$pkg.scripts.dev }
    return 'next dev'
}

function Get-EduplayNextPattern {
    # Cmdline del proceso que escucha (next dist bin) o su lanzador npm.
    return 'next[\\/]dist[\\/]bin[\\/]next|next dev'
}

function Get-ListeningPortByPattern {
    param([string]$Pattern)
    $procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        if ($p.CommandLine -and $p.CommandLine -match $Pattern) {
            $conn = Get-NetTCPConnection -State Listen -OwningProcess ([int]$p.ProcessId) -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($conn) { return [int]$conn.LocalPort }
        }
    }
    return 0
}

function Get-EduplayPort {
    # 1) Proceso next.dev en ejecucion -> su puerto real.
    $running = Get-ListeningPortByPattern -Pattern (Get-EduplayNextPattern)
    if ($running -gt 0) { return $running }
    # 2) Puerto explicito en el comando de package.json (-p / --port).
    $cmd = Get-EduplayDevCommand
    if ($cmd -match '(?:-p|--port)[= ](\d+)') { return [int]$Matches[1] }
    # 3) Variable de entorno PORT.
    if ($env:PORT) { return [int]$env:PORT }
    # 4) Default de Next.js.
    return 3000
}

function Test-EduplayUp {
    param([int]$Port)
    try {
        $c = New-Object Net.Sockets.TcpClient
        $c.Connect('127.0.0.1', $Port)
        $c.Close()
        return $true
    } catch { return $false }
}

function Get-EduplayHttpStatus {
    param([int]$Port, [string]$Path = '/')
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port$Path" -UseBasicParsing -TimeoutSec 10
        return [int]$r.StatusCode
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
        return 0
    }
}

function Get-TailscaleExe {
    $candidates = @()
    if ($env:ProgramFiles) { $candidates += (Join-Path $env:ProgramFiles 'Tailscale\tailscale.exe') }
    ${env:ProgramFiles(x86)} | ForEach-Object { if ($_) { $candidates += (Join-Path $_ 'Tailscale\tailscale.exe') } }
    foreach ($c in $candidates) { if ($c -and (Test-Path $c)) { return $c } }
    $cmd = Get-Command tailscale -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

# Ejecuta tailscale con watchdog: evita colgarse ante prompts interactivos.
# Retorna @{ Exit; Output; TimedOut }.
function Invoke-Tailscale {
    param(
        [string]$Exe,
        [string[]]$Arguments,
        [int]$TimeoutSec = 30,
        [string]$StdIn = $null
    )
    $outFile = [IO.Path]::GetTempFileName()
    $errFile = [IO.Path]::GetTempFileName()
    Remove-Item $outFile, $errFile -ErrorAction SilentlyContinue
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Exe
    # -ArgumentList crudo: unimos nosotros para evitar el parser de PowerShell.
    $psi.Arguments = ($Arguments | ForEach-Object {
        if ($_ -match '[ "]') { '"' + ($_ -replace '"', '\"') + '"' } else { $_ }
    }) -join ' '
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.RedirectStandardInput = $true
    $psi.CreateNoWindow = $true
    $p = [Diagnostics.Process]::Start($psi)
    if ($StdIn -ne $null) { $p.StandardInput.WriteLine($StdIn) }
    $p.StandardInput.Close()
    $stdout = $p.StandardOutput.ReadToEndAsync()
    $stderr = $p.StandardError.ReadToEndAsync()
    $timedOut = -not $p.WaitForExit($TimeoutSec * 1000)
    if ($timedOut) { try { $p.Kill() } catch {} }
    $text = ''
    try { $text = $stdout.Result } catch {}
    try { $text += $stderr.Result } catch {}
    $code = -1
    try { if (-not $timedOut) { $code = $p.ExitCode } } catch {}
    return @{ Exit = $code; Output = $text; TimedOut = $timedOut }
}
