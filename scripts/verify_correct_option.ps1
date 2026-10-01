$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$results = @()

function Ok($name, $cond, $detail = '') {
  $script:results += [pscustomobject]@{ Test = $name; Pass = [bool]$cond; Detail = "$detail" }
}
function J($res) { try { return $res.Content | ConvertFrom-Json } catch { return $null } }

# 1) Estudiante nuevo
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
    nombre = "Co Student $stamp"; email = "co_student_$stamp@gmail.com"; password = 'secret123'
  } | ConvertTo-Json) -UseBasicParsing -SessionVariable s1
  Ok 'co: student register' ($r.StatusCode -eq 201) $r.StatusCode
} catch { Ok 'co: student register' $false $_.Exception.Message }

# 2) Docente (demo) + curso
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email = 'ana.garcia@gmail.com'; password = 'demo123'
  } | ConvertTo-Json) -UseBasicParsing -SessionVariable stch
  Ok 'co: teacher login' ($r.StatusCode -eq 200) $r.StatusCode
} catch { Ok 'co: teacher login' $false $_.Exception.Message }

$cursos = J (Invoke-WebRequest -Uri "$base/api/panel/cursos" -WebSession $stch -UseBasicParsing)
$curso = $cursos.cursos | Select-Object -First 1
Ok 'co: curso' ($null -ne $curso) $(if ($curso) { $curso.id } else { 'none' })

if ($curso) {
  # Semilla de pregunta (nombre con prefijo 'Preg E2E' para que la limpieza del e2e la recoja)
  $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; cursoId = $curso.id; enunciado = "Preg E2E CO $stamp"; opciones = @('Si', 'No'); respuestaCorrecta = 'Si'
  } | ConvertTo-Json -Depth 5) -UseBasicParsing
  Ok 'co: seed pregunta' ($r.StatusCode -eq 201) $r.StatusCode

  # 3) Sala + join + start
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; name = "Sala CO $stamp"; mode = $curso.gameModeId; course_id = $curso.id
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'co: sala create' ($r.StatusCode -eq 201) $r.StatusCode
  $salaId = (J $r).sala.id
  $codigo = (J $r).sala.code

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'join'; code = $codigo
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'co: join' ($r.StatusCode -eq 200 -or $r.StatusCode -eq 201) $r.StatusCode

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'start'; room_id = $salaId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'co: start' ($r.StatusCode -eq 200) $r.StatusCode

  # 4) GET boot: correct_option_id en cada pregunta
  $part = J (Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaId" -WebSession $s1 -UseBasicParsing)
  $qs = @($part.preguntas)
  Ok 'co: preguntas boot' ($qs.Count -ge 2) "n=$($qs.Count)"

  $missing = @($qs | Where-Object { -not $_.correct_option_id })
  Ok 'co: correct_option_id presente' ($qs.Count -gt 0 -and $missing.Count -eq 0) "missing=$($missing.Count)/$($qs.Count)"

  $notInOptions = @($qs | Where-Object {
    $cid = $_.correct_option_id
    -not (@($_.options) | Where-Object { $_.id -eq $cid })
  })
  Ok 'co: id pertenece a options' ($notInOptions.Count -eq 0) "bad=$($notInOptions.Count)"

  if ($qs.Count -ge 1 -and $missing.Count -eq 0) {
    # 5) Semántica: responder con correct_option_id -> correct=true
    $q1 = $qs[0]
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
        action = 'answer'; room_id = $salaId; question_id = $q1.id; option_id = $q1.correct_option_id
      } | ConvertTo-Json) -UseBasicParsing
      $ans = J $r
      Ok 'co: responder con correct_option_id -> true' ($ans.correct -eq $true) "correct=$($ans.correct)"
    } catch { Ok 'co: responder con correct_option_id -> true' $false $_.Exception.Message }
  }
  if ($qs.Count -ge 2 -and $missing.Count -eq 0) {
    # 6) Y con la opuesta -> correct=false
    $q2 = $qs[1]
    $op = @($q2.options) | Where-Object { $_.id -ne $q2.correct_option_id } | Select-Object -First 1
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
        action = 'answer'; room_id = $salaId; question_id = $q2.id; option_id = $op.id
      } | ConvertTo-Json) -UseBasicParsing
      $ans = J $r
      Ok 'co: responder con opuesta -> false' ($ans.correct -eq $false) "correct=$($ans.correct)"
    } catch { Ok 'co: responder con opuesta -> false' $false $_.Exception.Message }
  }
}

$pass = @($results | Where-Object { $_.Pass }).Count
$fail = @($results | Where-Object { -not $_.Pass }).Count
$results | ForEach-Object { "{0} {1} {2}" -f ($(if ($_.Pass) { 'PASS' } else { 'FAIL' })), $_.Test, $_.Detail }
""
"PASS=$pass FAIL=$fail TOTAL=$($results.Count)"
if ($fail -eq 0) { exit 0 } else { exit 1 }
