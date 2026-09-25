$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$results = @()

function Ok($name, $cond, $detail = '') {
  $script:results += [pscustomobject]@{ Test = $name; Pass = [bool]$cond; Detail = "$detail" }
}

function J($res) {
  try { return $res.Content | ConvertFrom-Json } catch { return $null }
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

# ═══ 1. LOGROS (Paso 6: servidor evalúa desde PostgreSQL, cliente no confiable) ═══
$r = $null
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
    nombre = 'E2E Logros'; email = "e2e_logros_$stamp@gmail.com"; password = 'secret123'
  } | ConvertTo-Json) -UseBasicParsing -SessionVariable s1
  Ok 'logros: register' ($r.StatusCode -eq 201) $r.StatusCode
} catch { Ok 'logros: register' $false $_.Exception.Message }

$r = Invoke-WebRequest -Uri "$base/api/logros" -WebSession $s1 -UseBasicParsing
$logros = J $r
Ok 'logros: catalogo 150' (($logros.logros | Measure-Object).Count -eq 150) (($logros.logros | Measure-Object).Count)

# 1) Sin desbloqueos antes de tiempo: usuario sin partidas → todo en 0
$pendientes0 = @($logros.logros | Where-Object { [int]$_.progreso -ne 0 -or $_.completado -eq $true })
Ok 'logros: sin progreso inicial' ($pendientes0.Count -eq 0) "dirty=$($pendientes0.Count)"
Ok 'logros: sin nuevos inicial' (@($logros.nuevos).Count -eq 0) "nuevos=$(@($logros.nuevos).Count)"

# 2) Contrato de sync: {action:'sync'} → estado evaluado + nuevos
$r = Invoke-WebRequest -Uri "$base/api/logros" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
  action = 'sync'
} | ConvertTo-Json) -UseBasicParsing
$sync0 = J $r
Ok 'logros: sync contrato' ($r.StatusCode -eq 200 -and $sync0.ok -and (@($sync0.logros).Count -eq 150) -and ($null -ne $sync0.nuevos)) "code=$($r.StatusCode) n=$(@($sync0.logros).Count)"
Ok 'logros: sync sin desbloqueos' (@($sync0.nuevos).Count -eq 0) "nuevos=$(@($sync0.nuevos).Count)"

# 3) Spoof: el progreso del cliente se IGNORA por completo
$r = Invoke-WebRequest -Uri "$base/api/logros" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
  items = @(
    @{ code = 'ach_001'; progress = 3; completed = $false },
    @{ code = 'ach_002'; progress = 1; completed = $true },
    @{ code = 'ach_150'; progress = 999; completed = $true }
  )
} | ConvertTo-Json -Depth 5) -UseBasicParsing
Ok 'logros: spoof 200' ($r.StatusCode -eq 200) $r.StatusCode
$r = Invoke-WebRequest -Uri "$base/api/logros" -WebSession $s1 -UseBasicParsing
$logros2 = J $r
$a1 = $logros2.logros | Where-Object { $_.code -eq 'ach_001' }
$a2 = $logros2.logros | Where-Object { $_.code -eq 'ach_002' }
$a150 = $logros2.logros | Where-Object { $_.code -eq 'ach_150' }
Ok 'logros: cliente no confiable' ([int]$a1.progreso -eq 0 -and $a1.completado -eq $false -and [int]$a2.progreso -eq 0 -and $a2.completado -eq $false -and [int]$a150.progreso -eq 0 -and $a150.completado -eq $false) "a1=$($a1.progreso) a2=$($a2.completado) a150=$($a150.progreso)"
Ok 'logros: a150 sin meta falsa' ([int]$a150.progreso -eq 0 -and $a150.desbloqueado_en -eq $null) "p=$($a150.progreso) unlocked=$($a150.desbloqueado_en)"

# 4) Invitado: catálogo en cero (sin eval) y sync bloqueado
$r = Invoke-WebRequest -Uri "$base/api/auth/guest" -Method Post -ContentType 'application/json' -Body (@{ nombre = 'GuestLogros1' } | ConvertTo-Json) -UseBasicParsing -SessionVariable sgl
Ok 'logros: guest create' ($r.StatusCode -eq 201) $r.StatusCode
$r = Invoke-WebRequest -Uri "$base/api/logros" -WebSession $sgl -UseBasicParsing
$logrosG = J $r
$dirtyG = @($logrosG.logros | Where-Object { [int]$_.progreso -ne 0 -or $_.completado -eq $true })
Ok 'logros: guest progreso 0' (($logrosG.logros | Measure-Object).Count -eq 150 -and $dirtyG.Count -eq 0) "dirty=$($dirtyG.Count)"
$guest403 = $false; $guest403code = 0
try {
  $r = Invoke-WebRequest -Uri "$base/api/logros" -Method Post -ContentType 'application/json' -WebSession $sgl -Body (@{ action = 'sync' } | ConvertTo-Json) -UseBasicParsing
  $guest403code = $r.StatusCode
} catch {
  $guest403code = [int]$_.Exception.Response.StatusCode
}
Ok 'logros: guest sync 403' ($guest403code -eq 403) "code=$guest403code"

# ═══ 2. PRACTICA guest/registrado ═══
$r = Invoke-WebRequest -Uri "$base/api/auth/guest" -Method Post -ContentType 'application/json' -Body (@{ nombre = 'GuestPrac' } | ConvertTo-Json) -UseBasicParsing -SessionVariable sg
Ok 'practica: guest create' ($r.StatusCode -eq 201) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/practicas" -Method Post -ContentType 'application/json' -WebSession $sg -Body (@{
  action = 'create'
  title = "Prac E2E $stamp"
  description = 'e2e'
  topic = 'valores'
  mode = 'decisiones'
  questions = @(
    @{ question = 'P1?'; optionA = 'Si'; optionB = 'No'; correctAnswer = 'A' }
  )
} | ConvertTo-Json -Depth 6) -UseBasicParsing
Ok 'practica: guest create 201' ($r.StatusCode -eq 201) $r.StatusCode
$prac = J $r
$pracId = $prac.id

$r = Invoke-WebRequest -Uri "$base/api/estrellas" -WebSession $sg -UseBasicParsing
$st = J $r
Ok 'practica: guest estrellas 0' ([int]$st.estrellas -eq 0) "stars=$($st.estrellas)"

$r = Invoke-WebRequest -Uri "$base/api/practicas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
  action = 'create'
  title = "Prac Reg $stamp"
  description = 'e2e'
  topic = 'valores'
  mode = 'decisiones'
  questions = @(
    @{ question = 'QA?'; optionA = 'A'; optionB = 'B'; correctAnswer = 'A' }
  )
} | ConvertTo-Json -Depth 6) -UseBasicParsing
Ok 'practica: registrada create' ($r.StatusCode -eq 201) $r.StatusCode
$pracR = J $r
$pracRId = $pracR.id

$r = Invoke-WebRequest -Uri "$base/api/practicas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
  action = 'publish'; practice_id = $pracRId
} | ConvertTo-Json) -UseBasicParsing
Ok 'practica: publish' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/practicas?scope=public" -UseBasicParsing
$pubs = J $r
$found = $pubs.practicas | Where-Object { $_.id -eq $pracRId }
Ok 'practica: public visible' ($null -ne $found) "found=$($null -ne $found)"

$r = Invoke-WebRequest -Uri "$base/api/practicas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
  action = 'submit'
  practice_id = $pracRId
  correct = 1
  total = 1
} | ConvertTo-Json) -UseBasicParsing
Ok 'practica: submit' ($r.StatusCode -eq 201 -or $r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/estrellas" -WebSession $s1 -UseBasicParsing
$st2 = J $r
Ok 'practica: registrada estrellas 0 tras play' ([int]$st2.estrellas -eq 0) "stars=$($st2.estrellas)"

# La práctica no es partida en sala: no cuenta para logros
$r = Invoke-WebRequest -Uri "$base/api/logros" -WebSession $s1 -UseBasicParsing
$logrosPrac = J $r
$dirtyPrac = @($logrosPrac.logros | Where-Object { [int]$_.progreso -ne 0 -or $_.completado -eq $true })
Ok 'logros: practica no cuenta' ($dirtyPrac.Count -eq 0) "dirty=$($dirtyPrac.Count)"

# ═══ 3. ESTRELLAS SOLO SALA (panel teacher + student play) ═══
$r = Invoke-WebRequest -Uri "$base/api/panel/auth/login" -Method Post -ContentType 'application/json' -Body (@{
  email = 'ana.garcia@gmail.com'; password = 'demo123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable stch
Ok 'sala: panel login' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -WebSession $stch -UseBasicParsing
$cursos = J $r
$curso = $cursos.cursos | Select-Object -First 1
Ok 'sala: cursos list' ($null -ne $curso) $(if ($curso) { $curso.id } else { 'none' })

$salaId = $null
$codigo = $null
$questionId = $null

if ($curso) {
  # Ensure at least one question exists for answer FK
  $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; cursoId = $curso.id; enunciado = "Preg E2E $stamp"; opciones = @('Si', 'No'); respuestaCorrecta = 'Si'
  } | ConvertTo-Json -Depth 5) -UseBasicParsing
  Ok 'sala: seed pregunta' ($r.StatusCode -eq 201) $r.StatusCode
  $np = J $r
  if ($np.pregunta) { $questionId = $np.pregunta.id }

  # Student cannot create rooms (role gate)
  try {
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'create'; name = "Sala Stud $stamp"; mode = 'decisiones'
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'sala: student create 403' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'sala: student create 403' ($code -eq 403) "code=$code"
  }

  # Teacher creates room (host) → student joins, teacher start/finish
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; name = "Sala E2E $stamp"; mode = $curso.gameModeId; course_id = $curso.id
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: teacher create' ($r.StatusCode -eq 201) $r.StatusCode
  $sala = J $r
  $salaId = $sala.sala.id
  $codigo = $sala.sala.code

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'join'; code = $codigo
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: student join' ($r.StatusCode -eq 200 -or $r.StatusCode -eq 201) $r.StatusCode

  try {
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'start'; room_id = $salaId
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'sala: student start 403' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'sala: student start 403' ($code -eq 403) "code=$code"
  }

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'start'; room_id = $salaId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: teacher start' ($r.StatusCode -eq 200) $r.StatusCode

  # Paso 4: respuestas reales vía /api/partida (acción antigua de /api/salas eliminada)
  try {
    $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaId" -WebSession $s1 -UseBasicParsing
    $part = J $r
    $qSeed = @($part.preguntas) | Where-Object { $_.id -eq $questionId } | Select-Object -First 1
    Ok 'sala: partida get' ($r.StatusCode -eq 200 -and $null -ne $qSeed) $r.StatusCode
    $optSi = @($qSeed.options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
    if ($optSi) {
      $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
        action = 'answer'; room_id = $salaId; question_id = $qSeed.id; option_id = $optSi.id
      } | ConvertTo-Json) -UseBasicParsing
      $ans = J $r
      Ok 'sala: answer' ($r.StatusCode -eq 200 -and $ans.correct -eq $true -and [int]$ans.points_delta -eq 10 -and [int]$ans.score -eq 10) "code=$($r.StatusCode) score=$($ans.score) delta=$($ans.points_delta)"
    } else {
      Ok 'sala: answer' $false 'no Si option'
    }
  } catch {
    Ok 'sala: answer' $false $_.Exception.Message
  }

  try {
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'finish'; room_id = $salaId
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'sala: student finish 403' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'sala: student finish 403' ($code -eq 403) "code=$code"
  }

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'finish'; room_id = $salaId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: teacher finish' ($r.StatusCode -eq 200) $r.StatusCode

  Start-Sleep -Milliseconds 300
  $r = Invoke-WebRequest -Uri "$base/api/estrellas" -WebSession $s1 -UseBasicParsing
  $st3 = J $r
  Ok 'estrellas: sala > 0' ([int]$st3.estrellas -gt 0) "stars=$($st3.estrellas)"

  # Closed room rejects joins
  try {
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'join'; code = $codigo
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'sala: join finished 400' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'sala: join finished 400' ($code -eq 400) "code=$code"
  }

  # Panel poll real (no simulation)
  $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'poll'; id = $salaId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: panel poll' ($r.StatusCode -eq 200) $r.StatusCode
}

# ═══ 4. PANEL CRUD + AUDIT ═══
$r = Invoke-WebRequest -Uri "$base/api/panel/inicio" -WebSession $stch -UseBasicParsing
$ini = J $r
Ok 'panel: inicio stats' ($null -ne $ini.estadisticas) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -WebSession $stch -UseBasicParsing
$pgs = J $r
Ok 'panel: preguntas list' ($null -ne $pgs.preguntas) (($pgs.preguntas | Measure-Object).Count)

if ($curso) {
  $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; cursoId = $curso.id; enunciado = "Del E2E $stamp"; opciones = @('X', 'Y'); respuestaCorrecta = 'X'
  } | ConvertTo-Json -Depth 5) -UseBasicParsing
  Ok 'panel: pregunta create' ($r.StatusCode -eq 201) $r.StatusCode
  $np2 = J $r
  if ($np2.pregunta -and $np2.pregunta.id) {
    $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'delete'; id = $np2.pregunta.id
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'panel: pregunta delete' ($r.StatusCode -eq 200) $r.StatusCode
  }

  # Panel create room (teacher-owned) for lobby/monitoreo poll path
  $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; cursoId = $curso.id; juegoId = $curso.gameModeId; nombre = "Panel Sala $stamp"
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'panel: sala create' ($r.StatusCode -eq 201) $r.StatusCode
  $ps = J $r
  if ($ps.sala) {
    $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'start'; id = $ps.sala.id
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'panel: sala start' ($r.StatusCode -eq 200) $r.StatusCode
    $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'poll'; id = $ps.sala.id
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'panel: sala poll en_curso' ($r.StatusCode -eq 200) $r.StatusCode
    $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'finish'; id = $ps.sala.id
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'panel: sala finish' ($r.StatusCode -eq 200) $r.StatusCode
  }
}

# ═══ 5. ADMIN DOCENTES + AUDIT + AUTHZ ═══
$r = Invoke-WebRequest -Uri "$base/api/panel/auth/login" -Method Post -ContentType 'application/json' -Body (@{
  email = 'roberto.admin@gmail.com'; password = 'admin123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable sadm
Ok 'admin: login' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/panel/docentes" -WebSession $sadm -UseBasicParsing
$docs = J $r
Ok 'admin: docentes list' (($docs.docentes | Measure-Object).Count -gt 0) (($docs.docentes | Measure-Object).Count)

$r = Invoke-WebRequest -Uri "$base/api/panel/docentes" -Method Post -ContentType 'application/json' -WebSession $sadm -Body (@{
  action = 'create'; nombre = 'E2E Doc'; correo = "e2edoc_$stamp@gmail.com"; contrasena = 'secret123'; institucion = 'E2E'; rol = 'docente'
} | ConvertTo-Json) -UseBasicParsing
Ok 'admin: docente create' ($r.StatusCode -eq 201) $r.StatusCode
$nd = J $r
if ($nd.id) {
  $r = Invoke-WebRequest -Uri "$base/api/panel/docentes" -Method Post -ContentType 'application/json' -WebSession $sadm -Body (@{
    action = 'delete'; id = $nd.id
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'admin: docente delete' ($r.StatusCode -eq 200) $r.StatusCode
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/usuarios" -WebSession $s1 -UseBasicParsing
  Ok 'seguridad: student 403 usuarios' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'seguridad: student 403 usuarios' ($code -eq 403) "code=$code"
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/docentes" -WebSession $s1 -UseBasicParsing
  Ok 'seguridad: student 403 docentes' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'seguridad: student 403 docentes' ($code -eq 403) "code=$code"
}

# ═══ 6. MIGRATE GUEST (guest_id server-side) ═══
$r = Invoke-WebRequest -Uri "$base/api/auth/guest" -Method Post -ContentType 'application/json' -Body (@{ nombre = 'GuestMig' } | ConvertTo-Json) -UseBasicParsing -SessionVariable sg2
$g = J $r
$guestId = $g.user.id
Ok 'migrate: guest' ($r.StatusCode -eq 201 -and $guestId) $guestId

$r = Invoke-WebRequest -Uri "$base/api/estrellas" -Method Post -ContentType 'application/json' -WebSession $sadm -Body (@{
  user_id = $guestId; delta = 7; reason = 'e2e'
} | ConvertTo-Json) -UseBasicParsing
Ok 'migrate: admin give guest stars' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'MigUser'; email = "e2e_mig_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable s2
Ok 'migrate: register' ($r.StatusCode -eq 201) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/auth/migrate" -Method Post -ContentType 'application/json' -WebSession $s2 -Body (@{
  guest_id = $guestId
} | ConvertTo-Json) -UseBasicParsing
$mig = J $r
Ok 'migrate: guest_id merge' ($r.StatusCode -eq 200 -and $mig.ok) "migrated=$($mig.migrated_stars)"
Ok 'migrate: stars preserved >0' ([int]$mig.migrated_stars -eq 7) "migrated_stars=$($mig.migrated_stars)"

$r = Invoke-WebRequest -Uri "$base/api/estrellas" -WebSession $s2 -UseBasicParsing
$st4 = J $r
Ok 'migrate: new user has stars' ([int]$st4.estrellas -ge 7) "stars=$($st4.estrellas)"

Invoke-WebRequest -Uri "$base/api/auth/logout" -Method Post -WebSession $s2 -UseBasicParsing | Out-Null
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $s2 -UseBasicParsing
  Ok 'auth: logout clears session' ($r.StatusCode -eq 200 -and (J $r).user -eq $null) "still=$($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: logout clears session' ($code -eq 401) "code=$code"
}

# ═══ 7. WAITING ROOM (API real: join → jugadores → start → estado) ═══
$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'WaitHost'; email = "e2e_wait_host_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable swh
Ok 'waiting: host register' ($r.StatusCode -eq 201) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'WaitPlayer'; email = "e2e_wait_p_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable swp
Ok 'waiting: player register' ($r.StatusCode -eq 201) $r.StatusCode

# Teacher is the room host; students join by code
$r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
  action = 'create'; name = "Sala Wait $stamp"; mode = 'decisiones'; max_players = 3
} | ConvertTo-Json) -UseBasicParsing
Ok 'waiting: teacher create' ($r.StatusCode -eq 201) $r.StatusCode
$wSala = J $r
$wCode = $wSala.sala.code
$wId = $wSala.sala.id
Ok 'waiting: max_players stored' ([int]$wSala.sala.max_players -eq 3) "max=$($wSala.sala.max_players)"

$r = Invoke-WebRequest -Uri "$base/api/salas?code=$([uri]::EscapeDataString($wCode))" -WebSession $swp -UseBasicParsing
Ok 'waiting: player GET join by code' ($r.StatusCode -eq 200) $r.StatusCode
$wSnap = J $r
$wParts = @($wSnap.participantes)
Ok 'waiting: 2 jugadores tras join' ($wParts.Count -eq 2) "count=$($wParts.Count)"
$wNames = @($wParts | ForEach-Object { $_.display_name })
Ok 'waiting: nombres reales (no mock)' (($wNames -contains 'WaitPlayer') -and (($wNames | Where-Object { $_ -match 'Ana|Garc' }).Count -ge 1)) ($wNames -join ',')
Ok 'waiting: estrellas en participantes' (($wParts | Where-Object { $null -ne $_.stars }) -ne $null) (($wParts | Select-Object -First 1).stars)
Ok 'waiting: sala status waiting' ($wSnap.sala.status -eq 'waiting') $wSnap.sala.status
Ok 'waiting: docente/curso present' (($null -ne $wSnap.sala.docente) -and ($null -ne $wSnap.sala.curso)) "docente=$($wSnap.sala.docente)"

$r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swh -Body (@{
  action = 'join'; code = $wCode
} | ConvertTo-Json) -UseBasicParsing
Ok 'waiting: second player join' ($r.StatusCode -eq 200) $r.StatusCode
$r = Invoke-WebRequest -Uri "$base/api/salas?code=$([uri]::EscapeDataString($wCode))&join=0" -WebSession $swp -UseBasicParsing
Ok 'waiting: 3 jugadores (max full)' ((@((J $r).participantes).Count) -eq 3) "count=$(@((J $r).participantes).Count)"

$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'WaitExtra'; email = "e2e_wait_x_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable swx
Ok 'waiting: extra register' ($r.StatusCode -eq 201) $r.StatusCode
try {
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swx -Body (@{
    action = 'join'; code = $wCode
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'waiting: max_players full 400' ($false) "unexpected $($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'waiting: max_players full 400' ($code -eq 400) "code=$code"
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/salas?code=NOEXISTE$stamp" -WebSession $swp -UseBasicParsing
  Ok 'waiting: codigo inexistente 404' ($false) "unexpected $($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'waiting: codigo inexistente 404' ($code -eq 404) "code=$code"
}

$r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swp -Body (@{
  action = 'leave'; room_id = $wId
} | ConvertTo-Json) -UseBasicParsing
Ok 'waiting: leave' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/salas?code=$([uri]::EscapeDataString($wCode))&join=0" -WebSession $swx -UseBasicParsing
Ok 'waiting: 2 jugadores tras leave' ((@((J $r).participantes).Count) -eq 2) "count=$(@((J $r).participantes).Count)"

$r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swp -Body (@{
  action = 'join'; code = $wCode
} | ConvertTo-Json) -UseBasicParsing
Ok 'waiting: player rejoin' ($r.StatusCode -eq 200) $r.StatusCode
$r = Invoke-WebRequest -Uri "$base/api/salas?code=$([uri]::EscapeDataString($wCode))&join=0" -WebSession $swx -UseBasicParsing
Ok 'waiting: 3 jugadores tras rejoin' ((@((J $r).participantes).Count) -eq 3) "count=$(@((J $r).participantes).Count)"

try {
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swp -Body (@{
    action = 'start'; room_id = $wId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'waiting: student start 403' ($false) "unexpected $($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'waiting: student start 403' ($code -eq 403) "code=$code"
}

$r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
  action = 'start'; room_id = $wId
} | ConvertTo-Json) -UseBasicParsing
Ok 'waiting: start by teacher host' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/salas?code=$([uri]::EscapeDataString($wCode))&join=0" -WebSession $swp -UseBasicParsing
$wStarted = J $r
Ok 'waiting: status in_progress tras start' ($wStarted.sala.status -eq 'in_progress') $wStarted.sala.status

try {
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swx -Body (@{
    action = 'join'; code = $wCode
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'waiting: join in_progress 400' ($false) "unexpected $($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'waiting: join in_progress 400' ($code -eq 400) "code=$code"
}

# ═══ 3b. ROOM SECURITY + PERSISTENCE (roles, ownership, codes, PG) ═══
if (-not $stch2) {
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/auth/login" -Method Post -ContentType 'application/json' -Body (@{
      email = 'carlos.lopez@gmail.com'; password = 'demo123'
    } | ConvertTo-Json) -UseBasicParsing -SessionVariable stch2
    Ok 'sala: stch2 login' ($r.StatusCode -eq 200) $r.StatusCode
  } catch {
    Ok 'sala: stch2 login' $false $_.Exception.Message
  }
}
if ($stch2 -and $curso) {
  # Foreign teacher cannot manage room
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch2 -Body (@{
      action = 'start'; id = $wId
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'sala: foreign start 404' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'sala: foreign start 404' ($code -eq 404) "code=$code"
  }
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch2 -Body (@{
      action = 'poll'; id = $wId
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'sala: foreign panel poll 404' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'sala: foreign panel poll 404' ($code -eq 404) "code=$code"
  }

  # Student cannot poll foreign room by id
  try {
    $r = Invoke-WebRequest -Uri "$base/api/salas?id=$wId&join=0" -WebSession $s1 -UseBasicParsing
    Ok 'sala: student foreign id 403' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'sala: student foreign id 403' ($code -eq 403) "code=$code"
  }

  # Unique codes across two teacher rooms
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; name = "CodeA $stamp"; mode = 'decisiones'; course_id = $curso.id
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: code A create' ($r.StatusCode -eq 201) $r.StatusCode
  $codeA = (J $r).sala.code
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; name = "CodeB $stamp"; mode = 'decisiones'; course_id = $curso.id
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: code B create' ($r.StatusCode -eq 201) $r.StatusCode
  $codeB = (J $r).sala.code
  Ok 'sala: codes unique' ($codeA -and $codeB -and ($codeA -ne $codeB)) "a=$codeA b=$codeB"

  # Invalid max_players
  try {
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'create'; name = "BadMax $stamp"; mode = 'decisiones'; max_players = 0
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'sala: invalid max_players 400' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'sala: invalid max_players 400' ($code -eq 400) "code=$code"
  }

  # Double start rejected
  if ($wId) {
    try {
      $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
        action = 'start'; room_id = $wId
      } | ConvertTo-Json) -UseBasicParsing
      Ok 'sala: double start 409' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'sala: double start 409' ($code -eq 409) "code=$code"
    }
  }

  # PostgreSQL persistence (not mocks)
  $psqlExe = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
  if ((Test-Path $psqlExe) -and $wId) {
    $env:PGPASSWORD = 'casimiro123'
    $pgR = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT status FROM rooms WHERE id = '$wId'" 2>$null)
    Ok 'sala: PG status in_progress' ("$pgR".Trim() -eq 'in_progress') "status=$pgR"
    $pgP = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM room_participants WHERE room_id = '$wId' AND left_at IS NULL" 2>$null)
    Ok 'sala: PG participants' ([int]"$pgP".Trim() -ge 2) "n=$pgP"
    $pgC = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(DISTINCT code) FROM rooms WHERE code IN ('$codeA','$codeB')" 2>$null)
    Ok 'sala: PG distinct codes' ([int]"$pgC".Trim() -eq 2) "n=$pgC"
  } else {
    Ok 'sala: PG status in_progress' $false 'psql or wId missing'
    Ok 'sala: PG participants' $false 'psql or wId missing'
    Ok 'sala: PG distinct codes' $false 'psql or wId missing'
  }
} else {
  Ok 'sala: foreign start 404' $false 'stch2/curso missing'
  Ok 'sala: foreign panel poll 404' $false 'stch2/curso missing'
  Ok 'sala: student foreign id 403' $false 'stch2/curso missing'
  Ok 'sala: code A create' $false 'stch2/curso missing'
  Ok 'sala: code B create' $false 'stch2/curso missing'
  Ok 'sala: codes unique' $false 'stch2/curso missing'
  Ok 'sala: invalid max_players 400' $false 'stch2/curso missing'
  Ok 'sala: double start 409' $false 'stch2/curso missing'
  Ok 'sala: PG status in_progress' $false 'stch2/curso missing'
  Ok 'sala: PG participants' $false 'stch2/curso missing'
  Ok 'sala: PG distinct codes' $false 'stch2/curso missing'
}

# ═══ 7c. PARTIDA + GAMEPLAY REAL (Paso 4: servidores de verdad, no cliente) ═══
$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'PartJ'; email = "e2e_part_j_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing
$r = Invoke-WebRequest -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{
  email = "e2e_part_j_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable s2
Ok 'partida: jugador2 login' ($r.StatusCode -eq 200) $r.StatusCode

$cursoP = $null
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; nombre = "Curso Partida $stamp"; gameModeId = 'decisiones'; estado = 'activo'
  } | ConvertTo-Json) -UseBasicParsing
  $nc = J $r
  $cursoP = if ($nc.curso) { $nc.curso } elseif ($nc.id) { $nc } else { $null }
  Ok 'partida: curso create' ($r.StatusCode -eq 201 -and $null -ne $cursoP.id) $r.StatusCode
} catch {
  Ok 'partida: curso create' $false $_.Exception.Message
}

$okQ = 0
if ($cursoP) {
  1..4 | ForEach-Object {
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
        action = 'create'; cursoId = $cursoP.id; enunciado = "PregP$_ $stamp"; opciones = @('Si', 'No'); respuestaCorrecta = 'Si'
      } | ConvertTo-Json -Depth 5) -UseBasicParsing
      if ($r.StatusCode -eq 201) { $okQ++ }
    } catch { }
  }
}
Ok 'partida: seed 4 preguntas' ($okQ -eq 4) "n=$okQ"

$psqlExe = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$env:PGPASSWORD = 'casimiro123'
$failCurso = 'curso create missing'

$salaA = $null
if ($cursoP) {
  # ── Sala A (decisiones): flujo completo multi-jugador ──
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; name = "PartA $stamp"; mode = 'decisiones'; course_id = $cursoP.id
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'partida: sala A create' ($r.StatusCode -eq 201) $r.StatusCode
  $salaA = (J $r).sala.id
  $codigoA = (J $r).sala.code

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'join'; code = $codigoA
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'partida: join s1' ($r.StatusCode -eq 200 -or $r.StatusCode -eq 201) $r.StatusCode

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s2 -Body (@{
    action = 'join'; code = $codigoA
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'partida: join s2' ($r.StatusCode -eq 200 -or $r.StatusCode -eq 201) $r.StatusCode

  try {
    $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaA" -WebSession $s1 -UseBasicParsing
    Ok 'partida: get pre-start 409' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'partida: get pre-start 409' ($code -eq 409) "code=$code"
  }

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'start'; room_id = $salaA
  } | ConvertTo-Json) -UseBasicParsing
  $startA = J $r
  Ok 'partida: start crea match' ($r.StatusCode -eq 200 -and $null -ne $startA.partida.id) "code=$($r.StatusCode)"

  $partA = $null
  try {
    $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaA" -WebSession $s1 -UseBasicParsing
    $partA = J $r
    $q1 = @($partA.preguntas)[0]
    $q2 = @($partA.preguntas)[1]
    $q3 = @($partA.preguntas)[2]
    $q4 = @($partA.preguntas)[3]
    $sinReveal = ($null -eq $q1.is_correct) -and ($null -eq $q1.correct_index) -and ($null -eq $q1.respuestaCorrecta)
    Ok 'partida: estado sin is_correct' ($r.StatusCode -eq 200 -and @($partA.preguntas).Count -eq 4 -and $sinReveal) "n=$(@($partA.preguntas).Count)"
    Ok 'partida: yo score inicial 0' ([int]$partA.yo.score -eq 0) "score=$($partA.yo.score)"
  } catch {
    Ok 'partida: estado sin is_correct' $false $_.Exception.Message
  }

  $optA1 = @(@($partA.preguntas)[0].options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
  $optB1 = @(@($partA.preguntas)[0].options) | Where-Object { $_.text -eq 'No' } | Select-Object -First 1
  $optA2 = @(@($partA.preguntas)[1].options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
  $optB2 = @(@($partA.preguntas)[1].options) | Where-Object { $_.text -eq 'No' } | Select-Object -First 1
  $optA3 = @(@($partA.preguntas)[2].options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
  $optA4 = @(@($partA.preguntas)[3].options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1

  if ($partA -and $optA1 -and $optB1 -and $optA2 -and $optA3 -and $optA4) {
    # 1) Correcta → +10
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'answer'; room_id = $salaA; question_id = $q1.id; option_id = $optA1.id
    } | ConvertTo-Json) -UseBasicParsing
    $ans = J $r
    Ok 'partida: correcto +10' ($ans.correct -eq $true -and [int]$ans.points_delta -eq 10 -and [int]$ans.score -eq 10) "score=$($ans.score) delta=$($ans.points_delta)"

    # 2) Duplicada → 409 idempotente
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
        action = 'answer'; room_id = $salaA; question_id = $q1.id; option_id = $optA1.id
      } | ConvertTo-Json) -UseBasicParsing
      Ok 'partida: duplicada 409' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'partida: duplicada 409' ($code -eq 409) "code=$code"
    }

    # 3) Incorrecta → -5
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'answer'; room_id = $salaA; question_id = $q2.id; option_id = $optB2.id
    } | ConvertTo-Json) -UseBasicParsing
    $ans = J $r
    Ok 'partida: incorrecto -5' ($ans.correct -eq $false -and [int]$ans.points_delta -eq -5 -and [int]$ans.score -eq 5) "score=$($ans.score) delta=$($ans.points_delta)"

    # 4) Spoof (points/correct_index/user_id del cliente) ignorado por el servidor
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'answer'; room_id = $salaA; question_id = $q3.id; option_id = $optA3.id; points = 999; correct_index = 1; score = 9999; user_id = '00000000-0000-0000-0000-000000000001'
    } | ConvertTo-Json) -UseBasicParsing
    $ans = J $r
    Ok 'partida: spoof points ignorado' ($ans.correct -eq $true -and [int]$ans.points_delta -eq 10 -and [int]$ans.score -eq 15) "score=$($ans.score) delta=$($ans.points_delta)"

    # 5) Pregunta de otro curso → 400
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
        action = 'answer'; room_id = $salaA; question_id = '11111111-2222-3333-4444-555555555555'; option_id = $optA1.id
      } | ConvertTo-Json) -UseBasicParsing
      Ok 'partida: pregunta ajena 400' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'partida: pregunta ajena 400' ($code -eq 400) "code=$code"
    }

    # 6) Timeout del cliente → registrada como incorrecta
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'answer'; room_id = $salaA; question_id = $q4.id; timed_out = $true; response_time_ms = 30000
    } | ConvertTo-Json) -UseBasicParsing
    $ans = J $r
    Ok 'partida: timeout registra' ($r.StatusCode -eq 200 -and $ans.correct -eq $false -and $ans.timed_out -eq $true -and [int]$ans.points_delta -eq -5 -and [int]$ans.score -eq 10) "score=$($ans.score) delta=$($ans.points_delta)"

    # 7) Jugador 2 (multi-jugador, score independiente)
    $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaA" -WebSession $s2 -UseBasicParsing
    $partS2 = J $r
    $s2q1 = @($partS2.preguntas)[0]
    $s2opt = @($s2q1.options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s2 -Body (@{
      action = 'answer'; room_id = $salaA; question_id = $s2q1.id; option_id = $s2opt.id
    } | ConvertTo-Json) -UseBasicParsing
    $ans = J $r
    Ok 'partida: jugador2 score propio' ([int]$ans.score -eq 10 -and $ans.correct -eq $true) "score=$($ans.score)"

    # 8) No participante → 403
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaA" -WebSession $stch2 -UseBasicParsing
      Ok 'partida: foraneo 403' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'partida: foraneo 403' ($code -eq 403) "code=$code"
    }

    # 9) Persistencia PG (matches, match_participants, participant_answers, score)
    if (Test-Path $psqlExe) {
      $pgM = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM matches WHERE room_id = '$salaA' AND status = 'in_progress'" 2>$null)
      Ok 'partida: PG 1 match activo' ([int]"$pgM".Trim() -eq 1) "n=$pgM"
      $pgP = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM match_participants mp JOIN matches m ON m.id = mp.match_id WHERE m.room_id = '$salaA'" 2>$null)
      Ok 'partida: PG 2 participantes' ([int]"$pgP".Trim() -ge 2) "n=$pgP"
      $pgA = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM participant_answers pa JOIN match_participants mp ON mp.id = pa.participant_id JOIN matches m ON m.id = mp.match_id WHERE m.room_id = '$salaA'" 2>$null)
      Ok 'partida: PG 5 respuestas' ([int]"$pgA".Trim() -eq 5) "n=$pgA"
      $pgS = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT mp.score FROM match_participants mp JOIN matches m ON m.id = mp.match_id JOIN users u ON u.id = mp.user_id WHERE m.room_id = '$salaA' AND u.email = 'e2e_logros_$stamp@gmail.com'" 2>$null)
      Ok 'partida: PG score s1 = 10' ([int]"$pgS".Trim() -eq 10) "score=$pgS"
      $pgX = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM participant_answers pa JOIN match_participants mp ON mp.id = pa.participant_id JOIN matches m ON m.id = mp.match_id WHERE m.room_id = '$salaA' AND pa.stars_delta <> 0" 2>$null)
      Ok 'partida: PG stars_delta 0' ([int]"$pgX".Trim() -eq 0) "n=$pgX"
    } else {
      Ok 'partida: PG 1 match activo' $false 'psql missing'
      Ok 'partida: PG 2 participantes' $false 'psql missing'
      Ok 'partida: PG 5 respuestas' $false 'psql missing'
      Ok 'partida: PG score s1 = 10' $false 'psql missing'
      Ok 'partida: PG stars_delta 0' $false 'psql missing'
    }

    # 10) Finalizar sala → respuestas posteriores rechazadas
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'finish'; room_id = $salaA
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'partida: teacher finish A' ($r.StatusCode -eq 200) $r.StatusCode
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s2 -Body (@{
        action = 'answer'; room_id = $salaA; question_id = $s2q1.id; option_id = $s2opt.id
      } | ConvertTo-Json) -UseBasicParsing
      Ok 'partida: answer tras finish 409' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'partida: answer tras finish 409' ($code -eq 409) "code=$code"
    }
  } else {
    Ok 'partida: correcto +10' $false 'preguntas/opciones missing'
    Ok 'partida: duplicada 409' $false 'preguntas/opciones missing'
    Ok 'partida: incorrecto -5' $false 'preguntas/opciones missing'
    Ok 'partida: spoof points ignorado' $false 'preguntas/opciones missing'
    Ok 'partida: pregunta ajena 400' $false 'preguntas/opciones missing'
    Ok 'partida: timeout registra' $false 'preguntas/opciones missing'
    Ok 'partida: jugador2 score propio' $false 'preguntas/opciones missing'
    Ok 'partida: foraneo 403' $false 'preguntas/opciones missing'
    Ok 'partida: PG 1 match activo' $false 'preguntas missing'
    Ok 'partida: PG 2 participantes' $false 'preguntas missing'
    Ok 'partida: PG 5 respuestas' $false 'preguntas missing'
    Ok 'partida: PG score s1 = 10' $false 'preguntas missing'
    Ok 'partida: PG stars_delta 0' $false 'preguntas missing'
    Ok 'partida: teacher finish A' $false 'preguntas missing'
    Ok 'partida: answer tras finish 409' $false 'preguntas missing'
  }

  # ── Sala B (lava): +15/-5 y ticks en servidor ──
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; name = "PartB $stamp"; mode = 'lava'; course_id = $cursoP.id
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'partida: sala B create' ($r.StatusCode -eq 201) $r.StatusCode
  $salaB = (J $r).sala.id
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'join'; code = ((J $r).sala.code)
  } | ConvertTo-Json) -UseBasicParsing
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'start'; room_id = $salaB
  } | ConvertTo-Json) -UseBasicParsing
  $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaB" -WebSession $s1 -UseBasicParsing
  $partB = J $r
  Ok 'partida: modo lava' ($partB.partida.modo -eq 'lava') "$($partB.partida.modo)"
  $bq1 = @($partB.preguntas)[0]; $bq2 = @($partB.preguntas)[1]
  $bSi = @($bq1.options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
  $bNo = @($bq2.options) | Where-Object { $_.text -eq 'No' } | Select-Object -First 1
  $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'answer'; room_id = $salaB; question_id = $bq1.id; option_id = $bSi.id
  } | ConvertTo-Json) -UseBasicParsing
  $ans = J $r
  Ok 'partida: lava correcto +15' ($ans.correct -eq $true -and [int]$ans.points_delta -eq 15 -and [int]$ans.score -eq 15 -and [int]$ans.state.ticks -eq 3) "score=$($ans.score) ticks=$($ans.state.ticks)"
  $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'answer'; room_id = $salaB; question_id = $bq2.id; option_id = $bNo.id
  } | ConvertTo-Json) -UseBasicParsing
  $ans = J $r
  Ok 'partida: lava incorrecto -5' ($ans.correct -eq $false -and [int]$ans.points_delta -eq -5 -and [int]$ans.score -eq 10 -and [int]$ans.state.ticks -eq 2) "score=$($ans.score) ticks=$($ans.state.ticks)"

  # ── Sala C (tierras): +20 / incorrecta 0 + eliminación ──
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; name = "PartC $stamp"; mode = 'tierras'; course_id = $cursoP.id
  } | ConvertTo-Json) -UseBasicParsing
  $salaC = (J $r).sala.id
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'join'; code = ((J $r).sala.code)
  } | ConvertTo-Json) -UseBasicParsing
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'start'; room_id = $salaC
  } | ConvertTo-Json) -UseBasicParsing
  $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaC" -WebSession $s1 -UseBasicParsing
  $partC = J $r
  Ok 'partida: modo tierras' ($partC.partida.modo -eq 'tierras') "$($partC.partida.modo)"
  $cq1 = @($partC.preguntas)[0]; $cq2 = @($partC.preguntas)[1]; $cq3 = @($partC.preguntas)[2]
  $cSi1 = @($cq1.options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
  $cNo2 = @($cq2.options) | Where-Object { $_.text -eq 'No' } | Select-Object -First 1
  $cSi3 = @($cq3.options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
  $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'answer'; room_id = $salaC; question_id = $cq1.id; option_id = $cSi1.id
  } | ConvertTo-Json) -UseBasicParsing
  $ans = J $r
  Ok 'partida: tierras correcto +20' ($ans.correct -eq $true -and [int]$ans.points_delta -eq 20 -and [int]$ans.score -eq 20) "score=$($ans.score)"
  $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'answer'; room_id = $salaC; question_id = $cq2.id; option_id = $cNo2.id
  } | ConvertTo-Json) -UseBasicParsing
  $ans = J $r
  Ok 'partida: tierras incorrecta 0 + eliminado' ($ans.correct -eq $false -and [int]$ans.points_delta -eq 0 -and [int]$ans.score -eq 20 -and $ans.eliminated -eq $true) "score=$($ans.score) elim=$($ans.eliminated)"
  try {
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'answer'; room_id = $salaC; question_id = $cq3.id; option_id = $cSi3.id
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'partida: tierras eliminado 409' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'partida: tierras eliminado 409' ($code -eq 409) "code=$code"
  }

  # ── Sala D (abismos): +20 y plataformas en servidor (inicio 0 → correcta 1 → incorrecta 0 = eliminado) ──
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; name = "PartD $stamp"; mode = 'abismos'; course_id = $cursoP.id
  } | ConvertTo-Json) -UseBasicParsing
  $salaD = (J $r).sala.id
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'join'; code = ((J $r).sala.code)
  } | ConvertTo-Json) -UseBasicParsing
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'start'; room_id = $salaD
  } | ConvertTo-Json) -UseBasicParsing
  $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaD" -WebSession $s1 -UseBasicParsing
  $partD = J $r
  Ok 'partida: modo abismos' ($partD.partida.modo -eq 'abismos') "$($partD.partida.modo)"
  $dq1 = @($partD.preguntas)[0]; $dq2 = @($partD.preguntas)[1]; $dq3 = @($partD.preguntas)[2]
  $dSi1 = @($dq1.options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
  $dNo2 = @($dq2.options) | Where-Object { $_.text -eq 'No' } | Select-Object -First 1
  $dSi3 = @($dq3.options) | Where-Object { $_.text -eq 'Si' } | Select-Object -First 1
  $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'answer'; room_id = $salaD; question_id = $dq1.id; option_id = $dSi1.id
  } | ConvertTo-Json) -UseBasicParsing
  $ans = J $r
  Ok 'partida: abismos correcto +20 platforms 1' ($ans.correct -eq $true -and [int]$ans.points_delta -eq 20 -and [int]$ans.state.platforms -eq 1) "score=$($ans.score) plat=$($ans.state.platforms)"
  $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'answer'; room_id = $salaD; question_id = $dq2.id; option_id = $dNo2.id
  } | ConvertTo-Json) -UseBasicParsing
  $ans = J $r
  Ok 'partida: abismos incorrecta platforms 0' ($ans.correct -eq $false -and [int]$ans.state.platforms -eq 0 -and $ans.eliminated -eq $true) "plat=$($ans.state.platforms) elim=$($ans.eliminated)"
  try {
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'answer'; room_id = $salaD; question_id = $dq3.id; option_id = $dSi3.id
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'partida: abismos eliminado 409' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'partida: abismos eliminado 409' ($code -eq 409) "code=$code"
  }

  # ── Fallos de dominio ──
  try {
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'answer'; room_id = '00000000-0000-0000-0000-000000000009'; question_id = '00000000-0000-0000-0000-000000000008'; timed_out = $true
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'partida: sala inexistente 404' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'partida: sala inexistente 404' ($code -eq 404) "code=$code"
  }
  try {
    $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'answer'; room_id = $salaB; question_id = $bq1.id
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'partida: sin option_id 400' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'partida: sin option_id 400' ($code -eq 400) "code=$code"
  }
} else {
  Ok 'partida: sala A create' $false $failCurso
  Ok 'partida: join s1' $false $failCurso
  Ok 'partida: join s2' $false $failCurso
  Ok 'partida: get pre-start 409' $false $failCurso
  Ok 'partida: start crea match' $false $failCurso
  Ok 'partida: estado sin is_correct' $false $failCurso
  Ok 'partida: yo score inicial 0' $false $failCurso
  Ok 'partida: sala B create' $false $failCurso
  Ok 'partida: modo lava' $false $failCurso
  Ok 'partida: sala C create' $false $failCurso
  Ok 'partida: modo tierras' $false $failCurso
  Ok 'partida: sala D create' $false $failCurso
  Ok 'partida: modo abismos' $false $failCurso
    Ok 'partida: sala inexistente 404' $false $failCurso
    Ok 'partida: sin option_id 400' $false $failCurso
  }

  # ═══ 7d. RESULTADOS REALES (Paso 5: servidor + vistas PG, sin mocks) ═══
  if ($salaA -and $salaB -and $cursoP) {
    # 1-7) Finalización persistida en PG + cross-check de score/correctas
    if (Test-Path $psqlExe) {
      $pgR = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT status FROM rooms WHERE id = '$salaA'" 2>$null)
      Ok 'resultados: PG sala finished' ("$pgR".Trim() -eq 'finished') "status=$pgR"
      $pgM = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM matches WHERE room_id = '$salaA' AND status <> 'finished'" 2>$null)
      Ok 'resultados: PG matches finished' ([int]"$pgM".Trim() -eq 0) "n=$pgM"
      $pgP = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM match_participants mp JOIN matches m ON m.id = mp.match_id WHERE m.room_id = '$salaA' AND mp.status = 'playing'" 2>$null)
      Ok 'resultados: PG sin playing' ([int]"$pgP".Trim() -eq 0) "n=$pgP"
      $pgE = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM match_participants mp JOIN matches m ON m.id = mp.match_id WHERE m.room_id = '$salaA' AND mp.status = 'finished'" 2>$null)
      Ok 'resultados: PG todos finished' ([int]"$pgE".Trim() -ge 2) "n=$pgE"
      $pgA = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM audit_events WHERE entity_type = 'room' AND entity_id = '$salaA' AND action = 'finished'" 2>$null)
      Ok 'resultados: PG auditoria finish' ([int]"$pgA".Trim() -ge 1) "n=$pgA"
      $pgS = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT mp.score FROM match_participants mp JOIN matches m ON m.id = mp.match_id JOIN users u ON u.id = mp.user_id WHERE m.room_id = '$salaA' AND u.email = 'e2e_logros_$stamp@gmail.com'" 2>$null)
      Ok 'resultados: PG score s1 10' ([int]"$pgS".Trim() -eq 10) "score=$pgS"
      $pgC = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT s.correct FROM v_match_participant_stats s JOIN match_participants mp ON mp.id = s.participant_id JOIN matches m ON m.id = mp.match_id JOIN users u ON u.id = mp.user_id WHERE m.room_id = '$salaA' AND u.email = 'e2e_logros_$stamp@gmail.com'" 2>$null)
      Ok 'resultados: PG correctas s1 2' ([int]"$pgC".Trim() -eq 2) "correct=$pgC"
    } else {
      Ok 'resultados: PG sala finished' $false 'psql missing'
      Ok 'resultados: PG matches finished' $false 'psql missing'
      Ok 'resultados: PG sin playing' $false 'psql missing'
      Ok 'resultados: PG todos finished' $false 'psql missing'
      Ok 'resultados: PG auditoria finish' $false 'psql missing'
      Ok 'resultados: PG score s1 10' $false 'psql missing'
      Ok 'resultados: PG correctas s1 2' $false 'psql missing'
    }

    # 8) Segunda finalización → 409 (ya finalizada)
    try {
      $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
        action = 'finish'; room_id = $salaA
      } | ConvertTo-Json) -UseBasicParsing
      Ok 'resultados: finish repetido 409' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'resultados: finish repetido 409' ($code -eq 409) "code=$code"
    }

    # 9-16) Endpoint estudiante: s1 (2 correctas, 2 incorrectas, 1 timeout, score 10, %50)
    $resS1 = $null
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida/resultados?room_id=$salaA" -WebSession $s1 -UseBasicParsing
      $resS1 = J $r
      Ok 'resultados: s1 200' ($r.StatusCode -eq 200 -and $resS1.ok -eq $true) $r.StatusCode
    } catch {
      Ok 'resultados: s1 200' $false $_.Exception.Message
    }
    if ($resS1) {
      Ok 'resultados: s1 conteos' ([int]$resS1.yo.correctas -eq 2 -and [int]$resS1.yo.incorrectas -eq 2 -and [int]$resS1.yo.timeouts -eq 1 -and [int]$resS1.yo.score -eq 10 -and [int]$resS1.yo.sin_responder -eq 0) "c=$($resS1.yo.correctas) i=$($resS1.yo.incorrectas) t=$($resS1.yo.timeouts) s=$($resS1.yo.score) sr=$($resS1.yo.sin_responder)"
      Ok 'resultados: s1 porcentaje 50' ([int]$resS1.yo.porcentaje -eq 50) "pct=$($resS1.yo.porcentaje)"
      Ok 'resultados: s1 posicion 1' ([int]$resS1.yo.posicion -eq 1 -and [int]$resS1.yo.total_jugadores -ge 2) "pos=$($resS1.yo.posicion) n=$($resS1.yo.total_jugadores)"
      Ok 'resultados: s1 respuestas 4' (@($resS1.respuestas).Count -eq 4) "n=$(@($resS1.respuestas).Count)"
      Ok 'resultados: s1 timeout real' (@(@($resS1.respuestas) | Where-Object { $_.timed_out -eq $true }).Count -eq 1) "n=$(@(@($resS1.respuestas) | Where-Object { $_.timed_out -eq $true }).Count)"
      Ok 'resultados: s1 partida finalizada' ($resS1.partida.status -eq 'finished' -and [int]$resS1.partida.total_preguntas -eq 4) "status=$($resS1.partida.status) n=$($resS1.partida.total_preguntas)"
      Ok 'resultados: ranking empate pos 1' (@($resS1.ranking).Count -ge 2 -and @(@($resS1.ranking) | Where-Object { [int]$_.posicion -eq 1 -and [int]$_.score -eq 10 }).Count -eq 2) "n=$(@($resS1.ranking).Count)"
    } else {
      Ok 'resultados: s1 conteos' $false 's1 fetch missing'
      Ok 'resultados: s1 porcentaje 50' $false 's1 fetch missing'
      Ok 'resultados: s1 posicion 1' $false 's1 fetch missing'
      Ok 'resultados: s1 respuestas 4' $false 's1 fetch missing'
      Ok 'resultados: s1 timeout real' $false 's1 fetch missing'
      Ok 'resultados: s1 partida finalizada' $false 's1 fetch missing'
      Ok 'resultados: ranking empate pos 1' $false 's1 fetch missing'
    }

    # 17-19) Endpoint estudiante: s2 (1 correcta, sin_responder 3, %25, score 10, pos 1 por empate)
    $resS2 = $null
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida/resultados?room_id=$salaA" -WebSession $s2 -UseBasicParsing
      $resS2 = J $r
      Ok 'resultados: s2 200' ($r.StatusCode -eq 200 -and $resS2.ok -eq $true) $r.StatusCode
    } catch {
      Ok 'resultados: s2 200' $false $_.Exception.Message
    }
    if ($resS2) {
      Ok 'resultados: s2 conteos' ([int]$resS2.yo.correctas -eq 1 -and [int]$resS2.yo.incorrectas -eq 0 -and [int]$resS2.yo.score -eq 10 -and [int]$resS2.yo.sin_responder -eq 3) "c=$($resS2.yo.correctas) s=$($resS2.yo.score) sr=$($resS2.yo.sin_responder)"
      Ok 'resultados: s2 porcentaje 25' ([int]$resS2.yo.porcentaje -eq 25) "pct=$($resS2.yo.porcentaje)"
      Ok 'resultados: s2 posicion 1' ([int]$resS2.yo.posicion -eq 1) "pos=$($resS2.yo.posicion)"
    } else {
      Ok 'resultados: s2 conteos' $false 's2 fetch missing'
      Ok 'resultados: s2 porcentaje 25' $false 's2 fetch missing'
      Ok 'resultados: s2 posicion 1' $false 's2 fetch missing'
    }

    # 20) user_id distinto al de la sesión → 403
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida/resultados?room_id=$salaA&user_id=00000000-0000-0000-0000-000000000077" -WebSession $s1 -UseBasicParsing
      Ok 'resultados: user_id ajeno 403' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'resultados: user_id ajeno 403' ($code -eq 403) "code=$code"
    }

    # 21) No participante (docente ajeno) → 403
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida/resultados?room_id=$salaA" -WebSession $stch2 -UseBasicParsing
      Ok 'resultados: docente ajeno 403' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'resultados: docente ajeno 403' ($code -eq 403) "code=$code"
    }

    # 22) Sin sesión → 401
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida/resultados?room_id=$salaA" -UseBasicParsing
      Ok 'resultados: sin sesion 401' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'resultados: sin sesion 401' ($code -eq 401) "code=$code"
    }

    # 23) Sin room_id → 400
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida/resultados" -WebSession $s1 -UseBasicParsing
      Ok 'resultados: sin room_id 400' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'resultados: sin room_id 400' ($code -eq 400) "code=$code"
    }

    # 24) Sala inexistente → 404
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida/resultados?room_id=00000000-0000-0000-0000-000000000009" -WebSession $s1 -UseBasicParsing
      Ok 'resultados: sala inexistente 404' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'resultados: sala inexistente 404' ($code -eq 404) "code=$code"
    }

    # 25) Recarga: misma respuesta (idempotente, fuente PG)
    $resR = $null
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida/resultados?room_id=$salaA" -WebSession $s1 -UseBasicParsing
      $resR = J $r
    } catch { }
    Ok 'resultados: recarga idempotente' ($null -ne $resR -and [int]$resR.yo.score -eq 10 -and [int]$resR.yo.posicion -eq 1 -and [int]$resR.yo.correctas -eq 2) "s=$($resR.yo.score) pos=$($resR.yo.posicion)"

    # 26-27) Panel action=results (docente dueño)
    $resP = $null
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
        action = 'results'; id = $salaA
      } | ConvertTo-Json) -UseBasicParsing
      $resP = J $r
      Ok 'resultados: panel resumen owner 200' ($r.StatusCode -eq 200 -and $resP.ok -eq $true -and $null -ne $resP.resultados) $r.StatusCode
    } catch {
      Ok 'resultados: panel resumen owner 200' $false $_.Exception.Message
    }
    if ($resP -and $resP.resultados) {
      $sum = $resP.resultados.resumen
      Ok 'resultados: panel resumen server' ([int]$sum.participantes -ge 2 -and [int]$sum.promedio_puntos -gt 0 -and [int]$sum.porcentaje_aciertos -eq 60 -and [int]$sum.timeouts -eq 1 -and [int]$sum.total_respuestas -eq 5 -and [int]$sum.total_preguntas -eq 4) "part=$($sum.participantes) prom=$($sum.promedio_puntos) pct=$($sum.porcentaje_aciertos) t=$($sum.timeouts) resp=$($sum.total_respuestas) preg=$($sum.total_preguntas)"
      Ok 'resultados: panel completados 2' ([int]$sum.completados -ge 2 -and [int]$sum.eliminados -eq 0) "c=$($sum.completados) e=$($sum.eliminados)"
      Ok 'resultados: panel participantes %' (@($resP.resultados.participantes).Count -ge 2 -and @(@($resP.resultados.participantes) | Where-Object { [int]$_.porcentaje -eq 50 -and [int]$_.timeouts -eq 1 }).Count -eq 1) "n=$(@($resP.resultados.participantes).Count)"
    } else {
      Ok 'resultados: panel resumen server' $false 'resultados missing'
      Ok 'resultados: panel completados 2' $false 'resultados missing'
      Ok 'resultados: panel participantes %' $false 'resultados missing'
    }

    # 28) Otro docente no ve resultados ajenos → 404
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch2 -Body (@{
        action = 'results'; id = $salaA
      } | ConvertTo-Json) -UseBasicParsing
      Ok 'resultados: panel foreign 404' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'resultados: panel foreign 404' ($code -eq 404) "code=$code"
    }

    # 29) Estudiante no accede a panel → 403 (gate de rol)
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $s2 -Body (@{
        action = 'results'; id = $salaA
      } | ConvertTo-Json) -UseBasicParsing
      Ok 'resultados: panel student 403' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'resultados: panel student 403' ($code -eq 403) "code=$code"
    }

    # 30-32) GET panel: totalPreguntas real, participantes finalizados, match finished
    $gA = $null
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/salas?id=$salaA" -WebSession $stch -UseBasicParsing
      $gA = (J $r).sala
    } catch { }
    Ok 'resultados: panel GET totalPreguntas 4' ($null -ne $gA -and [int]$gA.totalPreguntas -eq 4) "n=$($gA.totalPreguntas)"
    Ok 'resultados: panel GET 2 finalizados' ($null -ne $gA -and @(@($gA.participantes) | Where-Object { $_.estado -eq 'finalizado' }).Count -ge 2) "n=$(@($gA.participantes).Count)"
    Ok 'resultados: panel GET match finished' ($null -ne $gA -and $gA.matchStatus -eq 'finished' -and $gA.estado -eq 'finalizada') "match=$($gA.matchStatus) estado=$($gA.estado)"

    # 33) Sala lava: distanciaLava real desde replay de respuestas (2 → +1 → −1 = 2)
    $gB = $null
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/salas?id=$salaB" -WebSession $stch -UseBasicParsing
      $gB = (J $r).sala
    } catch { }
    $distB = if ($gB -and @($gB.participantes).Count -gt 0) { [int]@($gB.participantes)[0].distanciaLava } else { -1 }
    Ok 'resultados: lava distanciaLava 2' ($distB -eq 2) "dist=$distB"

    # 34-36) Sala sin partida: estudiante 409 / panel resultados null / totalPreguntas fallback
    $salaE = $null
    try {
      $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
        action = 'create'; name = "PartE $stamp"; mode = 'decisiones'; course_id = $cursoP.id
      } | ConvertTo-Json) -UseBasicParsing
      $salaE = (J $r).sala.id
      $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
        action = 'join'; code = ((J $r).sala.code)
      } | ConvertTo-Json) -UseBasicParsing
    } catch { }
    if ($salaE) {
      try {
        $r = Invoke-WebRequest -Uri "$base/api/partida/resultados?room_id=$salaE" -WebSession $s1 -UseBasicParsing
        Ok 'resultados: salaE sin partida 409' ($false) "unexpected $($r.StatusCode)"
      } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Ok 'resultados: salaE sin partida 409' ($code -eq 409) "code=$code"
      }
      $resE = $null
      try {
        $r = Invoke-WebRequest -Uri "$base/api/panel/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
          action = 'results'; id = $salaE
        } | ConvertTo-Json) -UseBasicParsing
        $resE = J $r
      } catch { }
      Ok 'resultados: panel sin partida null' ($null -ne $resE -and $resE.ok -eq $true -and $null -eq $resE.resultados) "ok=$($resE.ok) res=$($null -ne $resE.resultados)"
      $gE = $null
      try {
        $r = Invoke-WebRequest -Uri "$base/api/panel/salas?id=$salaE" -WebSession $stch -UseBasicParsing
        $gE = (J $r).sala
      } catch { }
      Ok 'resultados: salaE totalPreguntas 4' ($null -ne $gE -and [int]$gE.totalPreguntas -eq 4) "n=$($gE.totalPreguntas)"
    } else {
      Ok 'resultados: salaE sin partida 409' $false 'salaE create missing'
      Ok 'resultados: panel sin partida null' $false 'salaE create missing'
      Ok 'resultados: salaE totalPreguntas 4' $false 'salaE create missing'
    }

    # 37-40) Fuente única: sin mocks/aleatoriedad en UI de resultados y redirects post-juego
    $mockHits = 0
    foreach ($f in @(
        "$PSScriptRoot\..\src\games\decision-road\ui\ResultsScreen.tsx",
        "$PSScriptRoot\..\src\games\decision-road\ui\Leaderboard.tsx",
        "$PSScriptRoot\..\src\app\api\panel\salas\route.ts"
      )) {
      if (-not (Test-Path $f)) { $mockHits++; continue }
      $mockHits += @(@(Select-String -Path $f -Pattern 'MOCK_CLASSMATES|MOCK_PLAYER_NAMES|Math\.random')).Count
    }
    Ok 'resultados: sin mocks en UI/panel' ($mockHits -eq 0) "hits=$mockHits"
    Ok 'resultados: pantalla /resultados existe' (Test-Path "$PSScriptRoot\..\src\app\resultados\page.tsx")
    $canvasOk = 0
    foreach ($f in @('LavaCanvas.tsx', 'TierrasCanvas.tsx', 'AbismosCanvas.tsx')) {
      $p = "$PSScriptRoot\..\src\engine\renderer\$f"
      if ((Test-Path $p) -and (Select-String -Path $p -Pattern 'postGameRoute' -Quiet)) { $canvasOk++ }
    }
    Ok 'resultados: redirects postGameRoute' ($canvasOk -eq 3) "n=$canvasOk"
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/salas?id=$salaA" -WebSession $s2 -UseBasicParsing
      Ok 'resultados: panel GET student 403' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'resultados: panel GET student 403' ($code -eq 403) "code=$code"
    }
  } else {
    Ok 'resultados: PG sala finished' $false $failCurso
    Ok 'resultados: PG matches finished' $false $failCurso
    Ok 'resultados: PG sin playing' $false $failCurso
    Ok 'resultados: PG todos finished' $false $failCurso
    Ok 'resultados: PG auditoria finish' $false $failCurso
    Ok 'resultados: PG score s1 10' $false $failCurso
    Ok 'resultados: PG correctas s1 2' $false $failCurso
    Ok 'resultados: finish repetido 409' $false $failCurso
    Ok 'resultados: s1 200' $false $failCurso
    Ok 'resultados: s1 conteos' $false $failCurso
    Ok 'resultados: s1 porcentaje 50' $false $failCurso
    Ok 'resultados: s1 posicion 1' $false $failCurso
    Ok 'resultados: s1 respuestas 4' $false $failCurso
    Ok 'resultados: s1 timeout real' $false $failCurso
    Ok 'resultados: s1 partida finalizada' $false $failCurso
    Ok 'resultados: ranking empate pos 1' $false $failCurso
    Ok 'resultados: s2 200' $false $failCurso
    Ok 'resultados: s2 conteos' $false $failCurso
    Ok 'resultados: s2 porcentaje 25' $false $failCurso
    Ok 'resultados: s2 posicion 1' $false $failCurso
    Ok 'resultados: user_id ajeno 403' $false $failCurso
    Ok 'resultados: docente ajeno 403' $false $failCurso
    Ok 'resultados: sin sesion 401' $false $failCurso
    Ok 'resultados: sin room_id 400' $false $failCurso
    Ok 'resultados: sala inexistente 404' $false $failCurso
    Ok 'resultados: recarga idempotente' $false $failCurso
    Ok 'resultados: panel resumen owner 200' $false $failCurso
    Ok 'resultados: panel resumen server' $false $failCurso
    Ok 'resultados: panel completados 2' $false $failCurso
    Ok 'resultados: panel participantes %' $false $failCurso
    Ok 'resultados: panel foreign 404' $false $failCurso
    Ok 'resultados: panel student 403' $false $failCurso
    Ok 'resultados: panel GET totalPreguntas 4' $false $failCurso
    Ok 'resultados: panel GET 2 finalizados' $false $failCurso
    Ok 'resultados: panel GET match finished' $false $failCurso
    Ok 'resultados: lava distanciaLava 2' $false $failCurso
    Ok 'resultados: salaE sin partida 409' $false $failCurso
    Ok 'resultados: panel sin partida null' $false $failCurso
    Ok 'resultados: salaE totalPreguntas 4' $false $failCurso
    Ok 'resultados: sin mocks en UI/panel' $false $failCurso
    Ok 'resultados: pantalla /resultados existe' $false $failCurso
    Ok 'resultados: redirects postGameRoute' $false $failCurso
    Ok 'resultados: panel GET student 403' $false $failCurso
  }

# ═══ 8. RANKING REAL (orden por estrellas + liga + sin datos privados) ═══
$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'RankA'; email = "e2e_rank_a_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable sra
Ok 'ranking: user A' ($r.StatusCode -eq 201) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'RankB'; email = "e2e_rank_b_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable srb
Ok 'ranking: user B' ($r.StatusCode -eq 201) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'RankC'; email = "e2e_rank_c_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable src
Ok 'ranking: user C' ($r.StatusCode -eq 201) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $sra -UseBasicParsing
$uidA = (J $r).user.id
$r = Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $srb -UseBasicParsing
$uidB = (J $r).user.id
$r = Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $src -UseBasicParsing
$uidC = (J $r).user.id

$r = Invoke-WebRequest -Uri "$base/api/estrellas" -Method Post -ContentType 'application/json' -WebSession $sadm -Body (@{
  user_id = $uidA; delta = 100; reason = 'e2e ranking'
} | ConvertTo-Json) -UseBasicParsing
Ok 'ranking: stars A=100' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/estrellas" -Method Post -ContentType 'application/json' -WebSession $sadm -Body (@{
  user_id = $uidB; delta = 25; reason = 'e2e ranking'
} | ConvertTo-Json) -UseBasicParsing
Ok 'ranking: stars B=25' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/estrellas" -Method Post -ContentType 'application/json' -WebSession $sadm -Body (@{
  user_id = $uidC; delta = 250; reason = 'e2e ranking'
} | ConvertTo-Json) -UseBasicParsing
Ok 'ranking: stars C=250' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/ranking?limit=100" -WebSession $sra -UseBasicParsing
Ok 'ranking: GET 200' ($r.StatusCode -eq 200) $r.StatusCode
$rank = J $r
$entries = @($rank.ranking)
Ok 'ranking: tiene entradas' ($entries.Count -gt 0) $entries.Count

$eA = $entries | Where-Object { $_.id -eq $uidA } | Select-Object -First 1
$eB = $entries | Where-Object { $_.id -eq $uidB } | Select-Object -First 1
$eC = $entries | Where-Object { $_.id -eq $uidC } | Select-Object -First 1
Ok 'ranking: A encontrado' ($null -ne $eA)
Ok 'ranking: B encontrado' ($null -ne $eB)
Ok 'ranking: C encontrado' ($null -ne $eC)
Ok 'ranking: estrellas A=100' ([int]$eA.estrellas -eq 100) $eA.estrellas
Ok 'ranking: estrellas B=25' ([int]$eB.estrellas -eq 25) $eB.estrellas
Ok 'ranking: estrellas C=250' ([int]$eC.estrellas -eq 250) $eC.estrellas
Ok 'ranking: orden C > A > B' ([int]$eC.posicion -lt [int]$eA.posicion) "C=$($eC.posicion) A=$($eA.posicion)"
Ok 'ranking: orden A > B' ([int]$eA.posicion -lt [int]$eB.posicion) "A=$($eA.posicion) B=$($eB.posicion)"
Ok 'ranking: liga C=Cuarzo III' ($eC.liga -eq 'Cuarzo III') $eC.liga
Ok 'ranking: liga A=Cuarzo II' ($eA.liga -eq 'Cuarzo II') $eA.liga
Ok 'ranking: liga B=Cuarzo I' ($eB.liga -eq 'Cuarzo I') $eB.liga
Ok 'ranking: nivel numerico' ([int]$eC.nivel -eq 3) $eC.nivel
$privKeys = @('email','password','password_hash','token','role','is_guest') | Where-Object {
  $k = $_; ($entries | Where-Object { $_.PSObject.Properties.Name -contains $k }).Count -gt 0
}
Ok 'ranking: sin campos privados' (($privKeys | Measure-Object).Count -eq 0) ($privKeys -join ',')

try {
  $r = Invoke-WebRequest -Uri "$base/api/ranking" -UseBasicParsing
  Ok 'ranking: 401 sin sesion' ($r.StatusCode -eq 401) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'ranking: 401 sin sesion' ($code -eq 401) "code=$code"
}

# ═══ 9. AUTH COMPLETO (registro, login, sesión, roles, invitado, migrate) ═══
# student login after earlier register
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email = "e2e_logros_$stamp@gmail.com"; password = 'secret123'
  } | ConvertTo-Json) -UseBasicParsing -SessionVariable sauth
  $au = J $r
  Ok 'auth: student login' ($r.StatusCode -eq 200 -and $au.user.role -eq 'student') "role=$($au.user.role)"
} catch {
  Ok 'auth: student login' $false $_.Exception.Message
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email = "e2e_logros_$stamp@gmail.com"; password = 'wrongpass'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: login wrong password 401' ($r.StatusCode -eq 401) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: login wrong password 401' ($code -eq 401) "code=$code"
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
    nombre = 'BadEmail'; email = 'not-an-email'; password = 'secret123'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: register invalid email 400' ($r.StatusCode -eq 400) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: register invalid email 400' ($code -eq 400) "code=$code"
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
    nombre = 'ShortPwd'; email = "e2e_short_$stamp@gmail.com"; password = '123'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: register short password 400' ($r.StatusCode -eq 400) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: register short password 400' ($code -eq 400) "code=$code"
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
    nombre = 'Dup'; email = "e2e_logros_$stamp@gmail.com"; password = 'secret123'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: register duplicate 409' ($r.StatusCode -eq 409) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: register duplicate 409' ($code -eq 409) "code=$code"
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $sauth -UseBasicParsing
  $me = J $r
  Ok 'auth: session me' ($r.StatusCode -eq 200 -and $me.user.id) $me.user.id
} catch {
  Ok 'auth: session me' $false $_.Exception.Message
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/me" -UseBasicParsing
  Ok 'auth: me 401 sin sesion' ($r.StatusCode -eq 401) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: me 401 sin sesion' ($code -eq 401) "code=$code"
}

# panel register cannot self-promote to admin
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/auth/register" -Method Post -ContentType 'application/json' -Body (@{
    nombre = 'FakeAdmin'; email = "e2e_fakeadmin_$stamp@gmail.com"; password = 'secret123'; role = 'admin'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: panel register admin 403' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: panel register admin 403' ($code -eq 403) "code=$code"
}

# panel register without role creates teacher
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/auth/register" -Method Post -ContentType 'application/json' -Body (@{
    nombre = 'NewTeacher'; email = "e2e_newteacher_$stamp@gmail.com"; password = 'secret123'; institution = 'E2E'
  } | ConvertTo-Json) -UseBasicParsing -SessionVariable stchreg
  $nt = J $r
  Ok 'auth: panel register teacher 201' ($r.StatusCode -eq 201 -and $nt.user.role -eq 'teacher') "role=$($nt.user.role)"
} catch {
  Ok 'auth: panel register teacher 201' $false $_.Exception.Message
}

# student cannot access panel login
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email = "e2e_logros_$stamp@gmail.com"; password = 'secret123'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: panel login student 401' ($r.StatusCode -eq 401) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: panel login student 401' ($code -eq 401) "code=$code"
}

# POST /api/usuarios requires staff
try {
  $r = Invoke-WebRequest -Uri "$base/api/usuarios" -Method Post -ContentType 'application/json' -Body (@{
    nombre = 'X'; apellido = 'Y'; correo = "e2e_us_$stamp@gmail.com"; password = 'secret123'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: usuarios POST sin sesion 403' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: usuarios POST sin sesion 403' ($code -eq 403) "code=$code"
}

# ai/generate requires staff
try {
  $r = Invoke-WebRequest -Uri "$base/api/ai/generate" -Method Post -ContentType 'application/json' -Body (@{
    prompt = 'hola'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: ai generate sin sesion 403' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: ai generate sin sesion 403' ($code -eq 403) "code=$code"
}

# migrate: body.stars must be ignored (server is source of truth)
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/migrate" -Method Post -ContentType 'application/json' -WebSession $sauth -Body (@{
    stars = 999999
  } | ConvertTo-Json) -UseBasicParsing
  $mg = J $r
  Ok 'auth: migrate body.stars ignored' ($r.StatusCode -eq 200 -and [int]$mg.migrated_stars -eq 0) "migrated=$($mg.migrated_stars)"
} catch {
  Ok 'auth: migrate body.stars ignored' $false $_.Exception.Message
}

$r4 = Invoke-WebRequest -Uri "$base/api/estrellas" -WebSession $sauth -UseBasicParsing
$st5 = J $r4
Ok 'auth: stars unchanged after body.stars' ([int]$st5.estrellas -lt 999999) "stars=$($st5.estrellas)"

# migrate: invalid guest_id
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/migrate" -Method Post -ContentType 'application/json' -WebSession $sauth -Body (@{
    guest_id = 'not-a-uuid'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: migrate invalid guest_id 400' ($r.StatusCode -eq 400) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: migrate invalid guest_id 400' ($code -eq 400) "code=$code"
}

# migrate: without session
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/migrate" -Method Post -ContentType 'application/json' -Body (@{
    guest_id = $guestId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: migrate sin sesion 401' ($r.StatusCode -eq 401) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: migrate sin sesion 401' ($code -eq 401) "code=$code"
}

# guest cannot call panel endpoints
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/inicio" -WebSession $sg -UseBasicParsing
  Ok 'auth: guest 403 panel inicio' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: guest 403 panel inicio' ($code -eq 403) "code=$code"
}

# profile: student can PATCH own profile only (no user_id override)
try {
  $r = Invoke-WebRequest -Uri "$base/api/estudiante/perfil" -Method Patch -ContentType 'application/json' -WebSession $sauth -Body (@{
    nombre = 'E2E Logros Renombrado'; user_id = '00000000-0000-0000-0000-000000000001'
  } | ConvertTo-Json) -UseBasicParsing
  $pf = J $r
  Ok 'auth: perfil PATCH propio' ($r.StatusCode -eq 200 -and $pf.usuario.nombre -eq 'E2E Logros Renombrado') $pf.usuario.nombre
} catch {
  Ok 'auth: perfil PATCH propio' $false $_.Exception.Message
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/estudiante/perfil" -Method Patch -ContentType 'application/json' -Body (@{
    nombre = 'Hacker'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: perfil PATCH sin sesion 401' ($r.StatusCode -eq 401) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: perfil PATCH sin sesion 401' ($code -eq 401) "code=$code"
}

# profile validation: empty name
try {
  $r = Invoke-WebRequest -Uri "$base/api/estudiante/perfil" -Method Patch -ContentType 'application/json' -WebSession $sauth -Body (@{
    nombre = ''
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: perfil nombre vacio 400' ($r.StatusCode -eq 400) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: perfil nombre vacio 400' ($code -eq 400) "code=$code"
}

# student cannot create admin via estrellas or docentes (already covered) + cannot list panel docentes without session
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/docentes" -UseBasicParsing
  Ok 'auth: docentes sin sesion 403' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: docentes sin sesion 403' ($code -eq 403) "code=$code"
}

# student cannot adjust stars
try {
  $r = Invoke-WebRequest -Uri "$base/api/estrellas" -Method Post -ContentType 'application/json' -WebSession $sauth -Body (@{
    user_id = $guestId; delta = 100; reason = 'cheat'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'auth: estrellas POST student 403' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: estrellas POST student 403' ($code -eq 403) "code=$code"
}

# logout then me
Invoke-WebRequest -Uri "$base/api/auth/logout" -Method Post -WebSession $sauth -UseBasicParsing | Out-Null
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $sauth -UseBasicParsing
  Ok 'auth: logout then me' (($r.StatusCode -eq 200 -and (J $r).user -eq $null) -or $r.StatusCode -eq 401) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'auth: logout then me' ($code -eq 401) "code=$code"
}

# ═══ 10. ADMIN ESTUDIANTES (listar, buscar, editar, eliminar, 403, integridad) ═══
# create disposable students for manage tests
$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'E2E StudEdit'; email = "e2e_stud_edit_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable sse
Ok 'estud: register edit target' ($r.StatusCode -eq 201) $r.StatusCode
$studEditId = (J $r).user.id

$r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
  nombre = 'E2E StudDel'; email = "e2e_stud_del_$stamp@gmail.com"; password = 'secret123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable ssd
Ok 'estud: register delete target' ($r.StatusCode -eq 201) $r.StatusCode
$studDelId = (J $r).user.id

# ensure admin session (login again if needed)
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/auth/me" -WebSession $sadm -UseBasicParsing
  if ((J $r).user.role -ne 'admin') { throw 'not admin' }
} catch {
  $r = Invoke-WebRequest -Uri "$base/api/panel/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email = 'roberto.admin@gmail.com'; password = 'admin123'
  } | ConvertTo-Json) -UseBasicParsing -SessionVariable sadm
}

# list students
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes" -WebSession $sadm -UseBasicParsing
  $es = J $r
  Ok 'estud: admin list' ($r.StatusCode -eq 200 -and (@($es.estudiantes).Count -gt 0)) "count=$(@($es.estudiantes).Count)"
} catch {
  Ok 'estud: admin list' $false $_.Exception.Message
}

# search by name/email
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes?q=E2E%20StudEdit" -WebSession $sadm -UseBasicParsing
  $eq = J $r
  $foundEdit = @($eq.estudiantes | Where-Object { $_.id -eq $studEditId }).Count -gt 0
  Ok 'estud: search by name' ($r.StatusCode -eq 200 -and $foundEdit) "found=$foundEdit"
} catch {
  Ok 'estud: search by name' $false $_.Exception.Message
}

try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes?q=e2e_stud_del_$stamp" -WebSession $sadm -UseBasicParsing
  $eq = J $r
  $foundDel = @($eq.estudiantes | Where-Object { $_.id -eq $studDelId }).Count -gt 0
  Ok 'estud: search by email' ($r.StatusCode -eq 200 -and $foundDel) "found=$foundDel"
} catch {
  Ok 'estud: search by email' $false $_.Exception.Message
}

# edit student
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes" -Method Post -ContentType 'application/json' -WebSession $sadm -Body (@{
    action = 'update'; id = $studEditId; nombre = 'E2E StudEdit Renamed'; correo = "e2e_stud_edit2_$stamp@gmail.com"; estado = 'activo'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'estud: admin edit' ($r.StatusCode -eq 200) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'estud: admin edit' ($code -eq 200) "code=$code"
}

# verify edit persisted
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes?q=E2E%20StudEdit%20Renamed" -WebSession $sadm -UseBasicParsing
  $ev = J $r
  $renamed = @($ev.estudiantes | Where-Object { $_.id -eq $studEditId -and $_.nombre -eq 'E2E StudEdit Renamed' }).Count -gt 0
  Ok 'estud: edit persisted' $renamed "renamed=$renamed"
} catch {
  Ok 'estud: edit persisted' $false $_.Exception.Message
}

# non-admin (student) gets 403
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes" -WebSession $s1 -UseBasicParsing
  Ok 'estud: student 403' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'estud: student 403' ($code -eq 403) "code=$code"
}

# no session gets 403
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes" -UseBasicParsing
  Ok 'estud: sin sesion 403' ($r.StatusCode -eq 403) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'estud: sin sesion 403' ($code -eq 403) "code=$code"
}

# delete test student
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes" -Method Post -ContentType 'application/json' -WebSession $sadm -Body (@{
    action = 'delete'; id = $studDelId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'estud: admin delete' ($r.StatusCode -eq 200) $r.StatusCode
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'estud: admin delete' ($code -eq 200) "code=$code"
}

# deleted student no longer in list
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes?q=e2e_stud_del_$stamp" -WebSession $sadm -UseBasicParsing
  $eg = J $r
  $gone = @($eg.estudiantes | Where-Object { $_.id -eq $studDelId }).Count -eq 0
  Ok 'estud: deleted not listed' $gone "gone=$gone"
} catch {
  Ok 'estud: deleted not listed' $false $_.Exception.Message
}

# deleted student cannot login (soft delete + integrity)
try {
  $r = Invoke-WebRequest -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email = "e2e_stud_del_$stamp@gmail.com"; password = 'secret123'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'estud: deleted login 401' ($false) "unexpected $($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'estud: deleted login 401' ($code -eq 401) "code=$code"
}

# integrity: list still works after delete (no orphan/FK break)
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes" -WebSession $sadm -UseBasicParsing
  $ei = J $r
  Ok 'estud: integrity after delete' ($r.StatusCode -eq 200 -and (@($ei.estudiantes).Count -gt 0)) "count=$(@($ei.estudiantes).Count)"
} catch {
  Ok 'estud: integrity after delete' $false $_.Exception.Message
}

# admin cannot delete self
try {
  $adminId = ((Invoke-WebRequest -Uri "$base/api/panel/auth/me" -WebSession $sadm -UseBasicParsing | J).user.id)
  $r = Invoke-WebRequest -Uri "$base/api/panel/estudiantes" -Method Post -ContentType 'application/json' -WebSession $sadm -Body (@{
    action = 'delete'; id = $adminId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'estud: no self-delete 400' ($false) "unexpected $($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'estud: no self-delete 400' ($code -eq 400 -or $code -eq 404) "code=$code"
}

# ═══ 11. CURSOS Y PREGUNTAS (Paso 2) ═══
$r = Invoke-WebRequest -Uri "$base/api/panel/auth/login" -Method Post -ContentType 'application/json' -Body (@{
  email = 'carlos.lopez@gmail.com'; password = 'demo123'
} | ConvertTo-Json) -UseBasicParsing -SessionVariable stch2
Ok 'cursos: segundo docente login' ($r.StatusCode -eq 200) $r.StatusCode

# create course
$r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
  action = 'create'; nombre = "Curso E2E $stamp"; descripcion = 'Creado por E2E'; gameModeId = 'lava'; estado = 'activo'
} | ConvertTo-Json) -UseBasicParsing
Ok 'cursos: create' ($r.StatusCode -eq 201) $r.StatusCode
$nc = J $r
$cursoE2E = if ($nc.curso) { $nc.curso.id } else { $null }

# invalid mode rejected
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; nombre = "Bad $stamp"; gameModeId = 'modoinvalido'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'cursos: invalid mode 400' ($false) "unexpected $($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'cursos: invalid mode 400' ($code -eq 400) "code=$code"
}

# duplicate name in same mode → 409
try {
  $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; nombre = "Curso E2E $stamp"; gameModeId = 'lava'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'cursos: duplicate name 409' ($false) "unexpected $($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'cursos: duplicate name 409' ($code -eq 409) "code=$code"
}

if ($cursoE2E) {
  # list includes new course
  $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -WebSession $stch -UseBasicParsing
  $clist = J $r
  $found = @($clist.cursos | Where-Object { $_.id -eq $cursoE2E }).Count -eq 1
  Ok 'cursos: list contains' $found "found=$found"

  # exists check true/false
  $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'exists'; nombre = "Curso E2E $stamp"; gameModeId = 'lava'
  } | ConvertTo-Json) -UseBasicParsing
  $ex = J $r
  Ok 'cursos: exists true' ($ex.existe -eq $true) "$($ex.existe)"

  $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'exists'; nombre = "NoExiste $stamp"; gameModeId = 'lava'
  } | ConvertTo-Json) -UseBasicParsing
  $ex2 = J $r
  Ok 'cursos: exists false' ($ex2.existe -eq $false) "$($ex2.existe)"

  # update course (incl. gameModeId)
  $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'update'; id = $cursoE2E; descripcion = 'Editado E2E'; gameModeId = 'decisiones'
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'cursos: update' ($r.StatusCode -eq 200) $r.StatusCode
  $up = J $r
  Ok 'cursos: update mode applied' ($up.curso.gameModeId -eq 'decisiones') "$($up.curso.gameModeId)"
  # restore lava for later room tests not needed (room tests already ran)

  # student 403
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -WebSession $s1 -UseBasicParsing
    Ok 'cursos: student 403 list' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'cursos: student 403 list' ($code -eq 403) "code=$code"
  }
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'create'; nombre = "Stud $stamp"
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'cursos: student 403 create' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'cursos: student 403 create' ($code -eq 403) "code=$code"
  }

  # second teacher cannot update/delete foreign course
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch2 -Body (@{
      action = 'update'; id = $cursoE2E; nombre = 'Hacked'
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'cursos: other teacher update 404' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'cursos: other teacher update 404' ($code -eq 404) "code=$code"
  }
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch2 -Body (@{
      action = 'delete'; id = $cursoE2E
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'cursos: other teacher delete 404' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'cursos: other teacher delete 404' ($code -eq 404) "code=$code"
  }
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch2 -Body (@{
      action = 'copy'; id = $cursoE2E
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'cursos: other teacher copy 404' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'cursos: other teacher copy 404' ($code -eq 404) "code=$code"
  }

  # create A/B question
  $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'create'; cursoId = $cursoE2E; enunciado = "¿Es A/B $stamp?"; opciones = @('Si es', 'No es'); respuestaCorrecta = 'Si es'; estado = 'activa'
  } | ConvertTo-Json -Depth 5) -UseBasicParsing
  Ok 'preguntas: create' ($r.StatusCode -eq 201) $r.StatusCode
  $npE2E = J $r
  $pregE2E = if ($npE2E.pregunta) { $npE2E.pregunta.id } else { $null }
  Ok 'preguntas: create shape' ($npE2E.pregunta.enunciado -and $npE2E.pregunta.opciones.Count -eq 2) "$($npE2E.pregunta.opciones -join '|')"

  # 3 options rejected (A/B only)
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'create'; cursoId = $cursoE2E; enunciado = "3opt $stamp"; opciones = @('A', 'B', 'C'); respuestaCorrecta = 'A'
    } | ConvertTo-Json -Depth 5) -UseBasicParsing
    Ok 'preguntas: reject 3 options 400' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'preguntas: reject 3 options 400' ($code -eq 400) "code=$code"
  }

  # A = B rejected
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'create'; cursoId = $cursoE2E; enunciado = "Igual $stamp"; opciones = @('X', 'X'); respuestaCorrecta = 'X'
    } | ConvertTo-Json -Depth 5) -UseBasicParsing
    Ok 'preguntas: reject A=B 400' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'preguntas: reject A=B 400' ($code -eq 400) "code=$code"
  }

  # respuesta not in options rejected
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'create'; cursoId = $cursoE2E; enunciado = "NoMatch $stamp"; opciones = @('A', 'B'); respuestaCorrecta = 'Z'
    } | ConvertTo-Json -Depth 5) -UseBasicParsing
    Ok 'preguntas: reject bad answer 400' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'preguntas: reject bad answer 400' ($code -eq 400) "code=$code"
  }

  # student 403 preguntas
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas?curso_id=$cursoE2E" -WebSession $s1 -UseBasicParsing
    Ok 'preguntas: student 403' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'preguntas: student 403' ($code -eq 403) "code=$code"
  }

  # other teacher cannot read questions of foreign course
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas?curso_id=$cursoE2E" -WebSession $stch2 -UseBasicParsing
    Ok 'preguntas: other teacher read 404' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'preguntas: other teacher read 404' ($code -eq 404) "code=$code"
  }

  if ($pregE2E) {
    # update question
    $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'update'; id = $pregE2E; enunciado = "Editada $stamp"; opciones = @('Opción A', 'Opción B'); respuestaCorrecta = 'Opción B'
    } | ConvertTo-Json -Depth 5) -UseBasicParsing
    Ok 'preguntas: update' ($r.StatusCode -eq 200) $r.StatusCode
    $upq = J $r
    Ok 'preguntas: update answer' ($upq.pregunta.respuestaCorrecta -eq 'Opción B') "$($upq.pregunta.respuestaCorrecta)"

    # other teacher cannot update/delete
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch2 -Body (@{
        action = 'update'; id = $pregE2E; enunciado = 'Hack'
      } | ConvertTo-Json) -UseBasicParsing
      Ok 'preguntas: other teacher update 404' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'preguntas: other teacher update 404' ($code -eq 404) "code=$code"
    }
    try {
      $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas" -Method Post -ContentType 'application/json' -WebSession $stch2 -Body (@{
        action = 'delete'; id = $pregE2E
      } | ConvertTo-Json) -UseBasicParsing
      Ok 'preguntas: other teacher delete 404' ($false) "unexpected $($r.StatusCode)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Ok 'preguntas: other teacher delete 404' ($code -eq 404) "code=$code"
    }

    # list by curso includes question
    $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas?curso_id=$cursoE2E" -WebSession $stch -UseBasicParsing
    $plist = J $r
    $pfound = @($plist.preguntas | Where-Object { $_.id -eq $pregE2E }).Count -eq 1
    Ok 'preguntas: list by curso' $pfound "found=$pfound"
  }

  # copy own course → Pregunta shape
  $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'copy'; id = $cursoE2E
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'cursos: copy own' ($r.StatusCode -eq 200) $r.StatusCode
  $cp = J $r
  $firstQ = @($cp.preguntas) | Select-Object -First 1
  $shapeOk = $null -ne $firstQ -and $null -ne $firstQ.enunciado -and ($firstQ.opciones -is [array]) -and (@($firstQ.opciones).Count -eq 2) -and ($null -ne $firstQ.respuestaCorrecta)
  Ok 'cursos: copy shape Pregunta' $shapeOk "q=$($firstQ.enunciado)"

  # paste as new course
  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'paste'
      curso = $cp.curso
      preguntas = $cp.preguntas
      gameModeId = 'lava'
      nombrePersonalizado = "Copia E2E $stamp"
    } | ConvertTo-Json -Depth 8) -UseBasicParsing
    Ok 'cursos: paste' ($r.StatusCode -eq 201) $r.StatusCode
    $ps2 = J $r
  } catch {
    Ok 'cursos: paste' $false $_.Exception.Message
    $ps2 = $null
  }
  $cursoCopia = if ($ps2 -and $ps2.curso) { $ps2.curso.id } else { $null }

  if ($cursoCopia) {
    $r = Invoke-WebRequest -Uri "$base/api/panel/preguntas?curso_id=$cursoCopia" -WebSession $stch -UseBasicParsing
    $pco = J $r
    Ok 'cursos: paste questions' (@($pco.preguntas).Count -ge 1) "n=$(@($pco.preguntas).Count)"
    $firstC = @($pco.preguntas) | Select-Object -First 1
    Ok 'cursos: paste option strings' ($firstC.opciones[0] -is [string] -and $firstC.opciones[0].Length -gt 0) "$($firstC.opciones[0])"
  }

  # PostgreSQL integrity (not mocks)
  $psqlExe = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
  if (Test-Path $psqlExe) {
    $env:PGPASSWORD = 'casimiro123'
    $pgN = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM courses WHERE id = '$cursoE2E' AND deleted_at IS NULL" 2>$null)
    Ok 'cursos: PG row exists' ("$pgN".Trim() -eq '1') "n=$pgN"
    $pgQ = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM question_options o JOIN questions q ON q.id = o.question_id WHERE q.course_id = '$cursoE2E' AND q.deleted_at IS NULL AND o.is_correct" 2>$null)
    Ok 'cursos: PG has correct options' ([int]"$pgQ".Trim() -ge 1) "n=$pgQ"
    $pgMode = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT gm.code FROM courses c JOIN game_modes gm ON gm.id = c.game_mode_id WHERE c.id = '$cursoE2E'" 2>$null)
    Ok 'cursos: PG mode code' ("$pgMode".Trim() -eq 'decisiones') "mode=$pgMode"
  } else {
    Ok 'cursos: PG row exists' $false 'psql not found'
  }

  # delete paste copy + original (soft-delete cascades questions)
  if ($cursoCopia) {
    $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'delete'; id = $cursoCopia
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'cursos: delete copy' ($r.StatusCode -eq 200) $r.StatusCode
  }
  $r = Invoke-WebRequest -Uri "$base/api/panel/cursos" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
    action = 'delete'; id = $cursoE2E
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'cursos: delete' ($r.StatusCode -eq 200) $r.StatusCode

  try {
    $r = Invoke-WebRequest -Uri "$base/api/panel/cursos?id=$cursoE2E" -WebSession $stch -UseBasicParsing
    Ok 'cursos: deleted not found' ($false) "unexpected $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Ok 'cursos: deleted not found' ($code -eq 404) "code=$code"
  }

  if (Test-Path $psqlExe) {
    $pgDel = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM questions WHERE course_id = '$cursoE2E' AND deleted_at IS NOT NULL" 2>$null)
    Ok 'cursos: PG questions soft-deleted' ([int]"$pgDel".Trim() -ge 1) "n=$pgDel"
  }
} else {
  Ok 'cursos: list contains' $false 'no curso id'
  Ok 'preguntas: create' $false 'no curso'
}

# ═══ 12. LOGROS PARTIDA REAL (Paso 6: desbloqueo server-side + invitado) ═══
if ($curso) {
  # Opción correcta por pregunta (fuente: PostgreSQL, no el cliente)
  $correctMap = @{}
  if (Test-Path $psqlExe) {
    $mapRows = & $psqlExe -U postgres -d eduplay_db -t -A -F '|' -c "SELECT q.id, qo.id FROM questions q JOIN question_options qo ON qo.question_id = q.id AND qo.is_correct WHERE q.course_id = '$($curso.id)' AND q.status = 'active' AND q.deleted_at IS NULL" 2>$null
    foreach ($line in @($mapRows)) {
      if ($line) {
        $mp = "$line".Split('|')
        if ($mp.Count -eq 2) { $correctMap[$mp[0].Trim()] = $mp[1].Trim() }
      }
    }
  }
  Ok 'logros: mapa correctas' ($correctMap.Count -ge 1) "n=$($correctMap.Count)"

  # Sala controlada: s1 responde TODAS correctamente → run completada
  $r = $null; $salaL = $null; $codeL = $null
  try {
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'create'; name = "Sala Logros $stamp"; mode = 'decisiones'; course_id = $curso.id
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'logros: sala create' ($r.StatusCode -eq 201) $r.StatusCode
    $salaL = (J $r).sala.id
    $codeL = (J $r).sala.code
  } catch { Ok 'logros: sala create' $false $_.Exception.Message }

  if ($salaL) {
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'join'; code = $codeL
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'logros: s1 join' ($r.StatusCode -eq 200 -or $r.StatusCode -eq 201) $r.StatusCode

    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'start'; room_id = $salaL
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'logros: start' ($r.StatusCode -eq 200) $r.StatusCode

    $qs = @()
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaL" -WebSession $s1 -UseBasicParsing
      $partL = J $r
      $qs = @($partL.preguntas)
      Ok 'logros: preguntas cargadas' ($qs.Count -ge 1 -and $qs.Count -eq [int]$partL.partida.question_count) "qs=$($qs.Count) qc=$($partL.partida.question_count)"
    } catch { Ok 'logros: preguntas cargadas' $false $_.Exception.Message }

    $answeredAll = $qs.Count -ge 1
    foreach ($q in $qs) {
      $optId = $correctMap[[string]$q.id]
      if (-not $optId) { $optId = @($q.options)[0].id }
      try {
        $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
          action = 'answer'; room_id = $salaL; question_id = $q.id; option_id = $optId; response_time_ms = 150
        } | ConvertTo-Json) -UseBasicParsing
        $ans = J $r
        if ($r.StatusCode -ne 200 -or $ans.correct -ne $true) { $answeredAll = $false }
      } catch { $answeredAll = $false }
    }
    Ok 'logros: todas correctas' $answeredAll "n=$($qs.Count)"

    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'finish'; room_id = $salaL
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'logros: finish' ($r.StatusCode -eq 200) $r.StatusCode
    Start-Sleep -Milliseconds 300

    # 1ª sync real: el servidor evalúa PostgreSQL → desbloquea + notifica
    $r = Invoke-WebRequest -Uri "$base/api/logros" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'sync'
    } | ConvertTo-Json) -UseBasicParsing
    $syncL = J $r
    Ok 'logros: sync 200' ($r.StatusCode -eq 200 -and $syncL.ok -eq $true) $r.StatusCode
    $sA1 = @($syncL.logros | Where-Object { $_.code -eq 'ach_001' }) | Select-Object -First 1
    $sA2 = @($syncL.logros | Where-Object { $_.code -eq 'ach_002' }) | Select-Object -First 1
    $sA3 = @($syncL.logros | Where-Object { $_.code -eq 'ach_003' }) | Select-Object -First 1
    Ok 'logros: ach_001 desbloqueado' ($null -ne $sA1 -and $sA1.completado -eq $true -and [int]$sA1.progreso -ge 1 -and $sA1.desbloqueado_en) "p=$($sA1.progreso) done=$($sA1.completado)"
    Ok 'logros: ach_002 desbloqueado' ($null -ne $sA2 -and $sA2.completado -eq $true -and [int]$sA2.progreso -ge 1) "p=$($sA2.progreso)"
    $nuevosL = @($syncL.nuevos)
    Ok 'logros: notifica nuevos' (($nuevosL -contains 'ach_001') -and ($nuevosL -contains 'ach_002')) ($nuevosL -join ',')

    # 2ª sync: idempotente (sin cambios → sin writes → sin nuevos)
    $r = Invoke-WebRequest -Uri "$base/api/logros" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'sync'
    } | ConvertTo-Json) -UseBasicParsing
    $syncL2 = J $r
    $sA1b = @($syncL2.logros | Where-Object { $_.code -eq 'ach_001' }) | Select-Object -First 1
    Ok 'logros: sync idempotente' (@($syncL2.nuevos).Count -eq 0 -and [int]$sA1b.progreso -eq [int]$sA1.progreso) "nuevos=$(@($syncL2.nuevos).Count) p=$($sA1b.progreso)"

    # PostgreSQL: progreso real, sin duplicados, unlocked_at
    if (Test-Path $psqlExe) {
      $pgN = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM achievement_progress ap JOIN users u ON u.id = ap.user_id WHERE u.email = 'e2e_logros_$stamp@gmail.com'" 2>$null)
      Ok 'logros: PG progreso > 0' ([int]"$pgN".Trim() -ge 1) "n=$pgN"
      $pgD = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM (SELECT ap.achievement_id FROM achievement_progress ap JOIN users u ON u.id = ap.user_id WHERE u.email = 'e2e_logros_$stamp@gmail.com' GROUP BY ap.achievement_id HAVING count(*) > 1) d" 2>$null)
      Ok 'logros: PG sin duplicados' ([int]"$pgD".Trim() -eq 0) "dups=$pgD"
      $pgU = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM achievement_progress ap JOIN users u ON u.id = ap.user_id JOIN achievements a ON a.id = ap.achievement_id WHERE u.email = 'e2e_logros_$stamp@gmail.com' AND a.code = 'ach_001' AND ap.completed AND ap.unlocked_at IS NOT NULL" 2>$null)
      Ok 'logros: PG unlocked_at' ([int]"$pgU".Trim() -eq 1) "n=$pgU"
      # progreso = min(datos reales, meta): mismas condiciones que el motor
      $pgCorrect = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT COALESCE(SUM(pa.is_correct::int),0) FROM participant_answers pa JOIN match_participants mp ON mp.id = pa.participant_id JOIN matches m ON m.id = mp.match_id JOIN game_modes gm ON gm.id = m.game_mode_id JOIN users u ON u.id = mp.user_id WHERE u.email = 'e2e_logros_$stamp@gmail.com' AND gm.code = 'decisiones' AND m.status <> 'cancelled'" 2>$null)
      $expect3 = [Math]::Min([int]"$pgCorrect".Trim(), 10)
      Ok 'logros: progreso refleja datos PG' ([int]$sA3.progreso -eq $expect3) "correct=$pgCorrect a3=$($sA3.progreso) expect=$expect3"
      # Usuario ajeno: el body (user_id spoofeado) se ignora por completo
      $r = Invoke-WebRequest -Uri "$base/api/logros" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
        action = 'sync'
        user_id = '00000000-0000-0000-0000-000000000001'
        items = @(@{ code = 'ach_001'; progress = 999; completed = $true })
      } | ConvertTo-Json -Depth 5) -UseBasicParsing
      $hostile = J $r
      $hA1 = @($hostile.logros | Where-Object { $_.code -eq 'ach_001' }) | Select-Object -First 1
      Ok 'logros: user_id spoofeado ignorado' ($r.StatusCode -eq 200 -and $hA1.completado -eq $true -and [int]$hA1.progreso -le 1) "p=$($hA1.progreso) done=$($hA1.completado)"
      $pgForeign = (& $psqlExe -U postgres -d eduplay_db -t -A -c "SELECT count(*) FROM achievement_progress ap JOIN users u ON u.id = ap.user_id WHERE u.email = 'e2e_mig_$stamp@gmail.com'" 2>$null)
      Ok 'logros: sin filas de usuarios ajenos' ([int]"$pgForeign".Trim() -eq 0) "n=$pgForeign"
    } else {
      Ok 'logros: PG progreso > 0' $false 'psql missing'
      Ok 'logros: PG sin duplicados' $false 'psql missing'
      Ok 'logros: PG unlocked_at' $false 'psql missing'
      Ok 'logros: progreso refleja datos PG' $false 'psql missing'
      Ok 'logros: user_id spoofeado ignorado' $false 'psql missing'
      Ok 'logros: sin filas de usuarios ajenos' $false 'psql missing'
    }

    # Invitado: juega sin acumular progreso visible…
    $r = Invoke-WebRequest -Uri "$base/api/auth/guest" -Method Post -ContentType 'application/json' -Body (@{ nombre = 'GuestLogros2' } | ConvertTo-Json) -UseBasicParsing -SessionVariable sgB
    $guestB = (J $r).user.id
    Ok 'logros: guest2 create' ($r.StatusCode -eq 201 -and $guestB) "$guestB"

    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'create'; name = "Sala Logros G $stamp"; mode = 'decisiones'; course_id = $curso.id
    } | ConvertTo-Json) -UseBasicParsing
    $salaG = (J $r).sala.id
    $codeG = (J $r).sala.code
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $sgB -Body (@{
      action = 'join'; code = $codeG
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'logros: guest2 join' ($r.StatusCode -eq 200 -or $r.StatusCode -eq 201) $r.StatusCode
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'start'; room_id = $salaG
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'logros: guest2 start' ($r.StatusCode -eq 200) $r.StatusCode

    $guestAnswered = $true
    try {
      $r = Invoke-WebRequest -Uri "$base/api/partida?room_id=$salaG" -WebSession $sgB -UseBasicParsing
      $qsG = @((J $r).preguntas)
      foreach ($q in $qsG) {
        $optId = $correctMap[[string]$q.id]
        if (-not $optId) { $optId = @($q.options)[0].id }
        $r = Invoke-WebRequest -Uri "$base/api/partida" -Method Post -ContentType 'application/json' -WebSession $sgB -Body (@{
          action = 'answer'; room_id = $salaG; question_id = $q.id; option_id = $optId; response_time_ms = 150
        } | ConvertTo-Json) -UseBasicParsing
        if ($r.StatusCode -ne 200) { $guestAnswered = $false }
      }
      Ok 'logros: guest2 completa' ($guestAnswered -and $qsG.Count -ge 1) "n=$($qsG.Count)"
    } catch { Ok 'logros: guest2 completa' $false $_.Exception.Message }

    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $stch -Body (@{
      action = 'finish'; room_id = $salaG
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'logros: guest2 finish' ($r.StatusCode -eq 200) $r.StatusCode
    Start-Sleep -Milliseconds 300

    # …aunque tenga partidas reales en PG (los invitados no acumulan)
    $r = Invoke-WebRequest -Uri "$base/api/logros" -WebSession $sgB -UseBasicParsing
    $logrosB = J $r
    $dirtyB = @($logrosB.logros | Where-Object { [int]$_.progreso -ne 0 -or $_.completado -eq $true })
    Ok 'logros: invitado no acumula' (($logrosB.logros | Measure-Object).Count -eq 150 -and $dirtyB.Count -eq 0) "dirty=$($dirtyB.Count)"

    # Registrar cuenta y migrar: el progreso del invitado se conserva (PG, no localStorage)
    $r = $null
    try {
      $r = Invoke-WebRequest -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{
        nombre = 'MigLogros'; email = "e2e_miglog_$stamp@gmail.com"; password = 'secret123'
      } | ConvertTo-Json) -UseBasicParsing -SessionVariable smig
      Ok 'logros: mig register' ($r.StatusCode -eq 201) $r.StatusCode
    } catch { Ok 'logros: mig register' $false $_.Exception.Message }

    if ($smig) {
      $r = Invoke-WebRequest -Uri "$base/api/auth/migrate" -Method Post -ContentType 'application/json' -WebSession $smig -Body (@{
        guest_id = $guestB
      } | ConvertTo-Json) -UseBasicParsing
      $migL = J $r
      Ok 'logros: migrate evalua datos' ($r.StatusCode -eq 200 -and $migL.ok -eq $true -and [int]$migL.migrated_achievements -ge 2) "migrated_ach=$($migL.migrated_achievements)"

      $r = Invoke-WebRequest -Uri "$base/api/logros" -WebSession $smig -UseBasicParsing
      $migLog = J $r
      $mA1 = @($migLog.logros | Where-Object { $_.code -eq 'ach_001' }) | Select-Object -First 1
      $mA2 = @($migLog.logros | Where-Object { $_.code -eq 'ach_002' }) | Select-Object -First 1
      Ok 'logros: progreso invitado conservado' ($mA1.completado -eq $true -and $mA2.completado -eq $true -and [int]$mA1.progreso -ge 1 -and [int]$mA2.progreso -ge 1) "a1=$($mA1.progreso) a2=$($mA2.progreso)"

      # tras migrar, la sesión de invitado queda revocada (cuenta fusionada)
      try {
        $r = Invoke-WebRequest -Uri "$base/api/logros" -Method Post -ContentType 'application/json' -WebSession $sgB -Body (@{ action = 'sync' } | ConvertTo-Json) -UseBasicParsing
        Ok 'logros: guest sesion revocada tras migrate' $false "unexpected $($r.StatusCode)"
      } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Ok 'logros: guest sesion revocada tras migrate' ($code -eq 401) "code=$code"
      }
    } else {
      Ok 'logros: migrate evalua datos' $false 'register missing'
      Ok 'logros: progreso invitado conservado' $false 'register missing'
      Ok 'logros: guest sesion revocada tras migrate' $false 'register missing'
    }

    # Checks estáticos: sin localStorage ni stats manipulables en el store
    $storeSrc = Get-Content -Raw -Path (Join-Path $PSScriptRoot '..\src\stores\achievement.store.ts')
    $regSrc = Get-Content -Raw -Path (Join-Path $PSScriptRoot '..\src\ui\screens\access\RegisterScreen.tsx')
    $achSrc = Get-Content -Raw -Path (Join-Path $PSScriptRoot '..\src\ui\screens\achievements\AchievementsScreen.tsx')
    Ok 'logros: store sin localStorage' ($storeSrc -and $storeSrc -notmatch 'localStorage\.(get|set|remove)Item') "len=$($storeSrc.Length)"
    Ok 'logros: store sin stats manipulables' ($storeSrc -and $storeSrc -notmatch 'eduplay_achievement_stats' -and $storeSrc -notmatch 'Math\.random')
    Ok 'logros: registro sin payload logros' ($regSrc -and $regSrc -notmatch 'achievements')
    Ok 'logros: UI filtros intactos' ($achSrc -and $achSrc -match "filter === 'unlocked'" -and $achSrc -match "filter === 'locked'")
  } else {
    Ok 'logros: sala create' $false 'sala missing'
    Ok 'logros: ach_001 desbloqueado' $false 'sala missing'
    Ok 'logros: ach_002 desbloqueado' $false 'sala missing'
    Ok 'logros: notifica nuevos' $false 'sala missing'
    Ok 'logros: sync idempotente' $false 'sala missing'
    Ok 'logros: invitado no acumula' $false 'sala missing'
    Ok 'logros: progreso invitado conservado' $false 'sala missing'
  }
} else {
  Ok 'logros: sala create' $false 'no curso'
  Ok 'logros: ach_001 desbloqueado' $false 'no curso'
  Ok 'logros: ach_002 desbloqueado' $false 'no curso'
  Ok 'logros: notifica nuevos' $false 'no curso'
  Ok 'logros: sync idempotente' $false 'no curso'
  Ok 'logros: invitado no acumula' $false 'no curso'
  Ok 'logros: progreso invitado conservado' $false 'no curso'
}

# ═══ RESULTS ═══
Write-Host "`n=== E2E RESULTS ==="
$results | Format-Table -AutoSize -Wrap
$pass = @($results | Where-Object Pass).Count
$fail = @($results | Where-Object { -not $_.Pass }).Count
Write-Host "PASS=$pass FAIL=$fail TOTAL=$($results.Count)"
$results | ConvertTo-Json -Depth 3 | Set-Content -Path "$env:TEMP\e2e_results.json" -Encoding UTF8
if ($fail -gt 0) { exit 1 } else { exit 0 }
