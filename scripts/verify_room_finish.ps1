# Verifica la finalización de sala desde el backend y su efecto en los jugadores:
# 4 modos, 2 jugadores, bloqueo de respuestas, doble finalización y resultados.
$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$results = @()

function Ok($name, $cond, $detail = '') {
  $script:results += [pscustomobject]@{ Test = $name; Pass = [bool]$cond; Detail = "$detail" }
}
function J($res) { try { return $res.Content | ConvertFrom-Json } catch { return $null } }
function Answer($session, $roomId, $qId, $optId) {
  try {
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $session -Body (@{
      action = 'answer'; room_id = $roomId; question_id = $qId; option_id = $optId
    } | ConvertTo-Json) -UseBasicParsing
    return @{ code = 200; body = (J $r) }
  } catch {
    return @{ code = $_.Exception.Response.StatusCode.value__; body = $null }
  }
}
function Finish($session, $roomId) {
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $session -Body (@{
      action = 'finish'; id = $roomId
    } | ConvertTo-Json) -UseBasicParsing
    return @{ code = $r.StatusCode; body = (J $r) }
  } catch {
    return @{ code = $_.Exception.Response.StatusCode.value__; body = $null }
  }
}

# Docente demo + curso con preguntas (semilla con prefijo 'Preg E2E' para que
# la limpieza del e2e_pg.ps1 la recoja).
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email = 'ana.garcia@gmail.com'; password = 'demo123'
  } | ConvertTo-Json) -UseBasicParsing -SessionVariable stch
  Ok 'finish: teacher login' ($r.StatusCode -eq 200) $r.StatusCode
} catch { Ok 'finish: teacher login' $false $_.Exception.Message }

$cursos = J (Invoke-WebRequest -Uri "$base/api/panel/cursos" -WebSession $stch -UseBasicParsing)
$curso = $cursos.cursos | Select-Object -First 1
Ok 'finish: curso' ($null -ne $curso) $(if ($curso) { $curso.id } else { 'none' })

if ($curso) {
  foreach ($n in 1, 2) {
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
        action = 'create'; cursoId = $curso.id; enunciado = "Preg E2E FIN$n $stamp"; opciones = @('Si', 'No'); respuestaCorrecta = 'Si'
      } | ConvertTo-Json -Depth 5) -UseBasicParsing
      Ok "finish: seed pregunta $n" ($r.StatusCode -eq 201) $r.StatusCode
    } catch { Ok "finish: seed pregunta $n" $false $_.Exception.Message }
  }

  $modes = @('decisiones', 'lava', 'tierras', 'abismos')
  foreach ($mode in $modes) {
    # Dos jugadores nuevos por modo (aislamiento total entre modos).
    $sessions = @()
    foreach ($who in 'A', 'B') {
      try {
        $r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
          nombre = "Fin$mode$who $stamp"; email = "fin_${mode}_${who}_$stamp@gmail.com"; password = 'secret123'
        } | ConvertTo-Json) -UseBasicParsing -SessionVariable sess
        $sessions += $sess
        Ok "[$mode] register $who" ($r.StatusCode -eq 201) $r.StatusCode
      } catch { Ok "[$mode] register $who" $false $_.Exception.Message; $sessions += $null }
    }
    if ($sessions[0] -eq $null -or $sessions[1] -eq $null) { continue }

    # Sala + join (2 jugadores) + start.
    try {
      $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
        action = 'create'; name = "FinRoom $mode $stamp"; mode = $mode; course_id = $curso.id
      } | ConvertTo-Json) -UseBasicParsing
      $salaId = (J $r).sala.id
      $codigo = (J $r).sala.code
      Ok "[$mode] sala create" ($r.StatusCode -eq 201 -and $null -ne $salaId) "code=$codigo"
    } catch { Ok "[$mode] sala create" $false $_.Exception.Message; continue }

    foreach ($sess in $sessions) {
      $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $sess -Body (@{
        action = 'join'; code = $codigo
      } | ConvertTo-Json) -UseBasicParsing
      Ok "[$mode] join" ($r.StatusCode -eq 200 -or $r.StatusCode -eq 201) $r.StatusCode
    }
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'start'; room_id = $salaId
    } | ConvertTo-Json) -UseBasicParsing
    Ok "[$mode] start" ($r.StatusCode -eq 200) $r.StatusCode

    # Boot de partida: preguntas + correct_option_id.
    $part = J (Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaId" -WebSession $sessions[0] -UseBasicParsing)
    $qs = @($part.preguntas)
    Ok "[$mode] boot preguntas" ($qs.Count -ge 2) "n=$($qs.Count)"
    if ($qs.Count -lt 2) { continue }

    $q1 = $qs[0]; $q2 = $qs[1]

    # Los 2 jugadores responden la pregunta 1 correctamente (estado previo).
    foreach ($i in 0, 1) {
      $a = Answer $sessions[$i] $salaId $q1.id $q1.correct_option_id
      Ok "[$mode] pre-finish answer p$($i + 1)" ($a.code -eq 200 -and $a.body.correct -eq $true) "code=$($a.code) correct=$($a.body.correct) score=$($a.body.score)"
    }

    # 1) El docente finaliza la sala.
    $f1 = Finish $stch $salaId
    Ok "[$mode] teacher finish" ($f1.code -eq 200 -and $f1.body.ok -eq $true) "code=$($f1.code)"

    # 2) Los jugadores detectan la sala finalizada.
    foreach ($i in 0, 1) {
      $g = J (Invoke-WebRequest -Uri "$base/api/salas?id=$salaId&join=0" -WebSession $sessions[$i] -UseBasicParsing)
      Ok "[$mode] jugador p$($i + 1) ve finished" ($g.sala.status -eq 'finished') "$($g.sala.status)"
      $st = J (Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaId" -WebSession $sessions[$i] -UseBasicParsing)
      Ok "[$mode] GET partida p$($i + 1) sigue 200" ($st.partida.status -eq 'finished') "$($st.partida.status)"
    }

    # 3) Los jugadores dejan de poder responder (backend autoritativo).
    foreach ($i in 0, 1) {
      $a = Answer $sessions[$i] $salaId $q2.id $q2.correct_option_id
      Ok "[$mode] post-finish answer p$($i + 1) 409" ($a.code -eq 409) "code=$($a.code)"
    }

    # 4) Finalizar dos veces no rompe nada (409, sin eventos duplicados).
    $f2 = Finish $stch $salaId
    Ok "[$mode] doble finish 409" ($f2.code -eq 409) "code=$($f2.code)"
    $g = J (Invoke-WebRequest -Uri "$base/api/salas?id=$salaId&join=0" -WebSession $sessions[0] -UseBasicParsing)
    Ok "[$mode] estado sigue finished" ($g.sala.status -eq 'finished') "$($g.sala.status)"

    # 5) Resultados = estado al momento de finalizar (la respuesta 1 cuenta).
    foreach ($i in 0, 1) {
      $res = J (Invoke-WebRequest -Uri "$base/api/partida/resultados?room_id=$salaId" -WebSession $sessions[$i] -UseBasicParsing)
      Ok "[$mode] resultados p$($i + 1)" ($res.partida.status -eq 'finished' -and [int]$res.yo.correctas -ge 1 -and [int]$res.yo.score -gt 0 -and [int]$res.yo.sin_responder -ge 1) "status=$($res.partida.status) correctas=$($res.yo.correctas) score=$($res.yo.score) sin=$($res.yo.sin_responder)"
    }
  }
}

$pass = @($results | Where-Object { $_.Pass }).Count
$fail = @($results | Where-Object { -not $_.Pass }).Count
$results | ForEach-Object { "{0} {1} {2}" -f ($(if ($_.Pass) { 'PASS' } else { 'FAIL' })), $_.Test, $_.Detail }
""
"PASS=$pass FAIL=$fail TOTAL=$($results.Count)"
if ($fail -eq 0) { exit 0 } else { exit 1 }
