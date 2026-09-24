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

# ═══ 1. LOGROS BATCH ═══
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

$r = Invoke-WebRequest -Uri "$base/api/logros" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
  items = @(
    @{ code = 'ach_001'; progress = 3; completed = $false },
    @{ code = 'ach_002'; progress = 1; completed = $true }
  )
} | ConvertTo-Json -Depth 5) -UseBasicParsing
Ok 'logros: batch upsert' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/logros" -WebSession $s1 -UseBasicParsing
$logros2 = J $r
$a1 = $logros2.logros | Where-Object { $_.code -eq 'ach_001' }
$a2 = $logros2.logros | Where-Object { $_.code -eq 'ach_002' }
Ok 'logros: progress persist' ($a1.progreso -eq 3) "ach_001=$($a1.progreso)"
Ok 'logros: completed persist' (($a2.completado -eq $true) -and $a2.desbloqueado_en) "completed=$($a2.completado)"

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

  # Student creates room (host) → can start/answer/finish for stars
  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'create'; name = "Sala E2E $stamp"; mode = $curso.gameModeId; course_id = $curso.id
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: student create' ($r.StatusCode -eq 201) $r.StatusCode
  $sala = J $r
  $salaId = $sala.sala.id
  $codigo = $sala.sala.code

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'join'; code = $codigo
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: self join' ($r.StatusCode -eq 200 -or $r.StatusCode -eq 201) $r.StatusCode

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'start'; room_id = $salaId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: start' ($r.StatusCode -eq 200) $r.StatusCode

  if ($questionId) {
    $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
      action = 'answer'; room_id = $salaId; question_id = $questionId; selected_index = 0; correct_index = 0; points = 10
    } | ConvertTo-Json) -UseBasicParsing
    Ok 'sala: answer' ($r.StatusCode -eq 200) $r.StatusCode
  } else {
    Ok 'sala: answer' $false 'no question id'
  }

  $r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $s1 -Body (@{
    action = 'finish'; room_id = $salaId
  } | ConvertTo-Json) -UseBasicParsing
  Ok 'sala: finish' ($r.StatusCode -eq 200) $r.StatusCode

  Start-Sleep -Milliseconds 300
  $r = Invoke-WebRequest -Uri "$base/api/estrellas" -WebSession $s1 -UseBasicParsing
  $st3 = J $r
  Ok 'estrellas: sala > 0' ([int]$st3.estrellas -gt 0) "stars=$($st3.estrellas)"

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

$r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swh -Body (@{
  action = 'create'; name = "Sala Wait $stamp"; mode = 'decisiones'; max_players = 3
} | ConvertTo-Json) -UseBasicParsing
Ok 'waiting: create' ($r.StatusCode -eq 201) $r.StatusCode
$wSala = J $r
$wCode = $wSala.sala.code
$wId = $wSala.sala.id

$r = Invoke-WebRequest -Uri "$base/api/salas?code=$([uri]::EscapeDataString($wCode))" -WebSession $swp -UseBasicParsing
Ok 'waiting: player GET join by code' ($r.StatusCode -eq 200) $r.StatusCode
$wSnap = J $r
$wParts = @($wSnap.participantes)
Ok 'waiting: 2 jugadores tras join' ($wParts.Count -eq 2) "count=$($wParts.Count)"
$wNames = @($wParts | ForEach-Object { $_.display_name })
Ok 'waiting: nombres reales (no mock)' (($wNames -contains 'WaitHost') -and ($wNames -contains 'WaitPlayer')) ($wNames -join ',')
Ok 'waiting: estrellas en participantes' (($wParts | Where-Object { $null -ne $_.stars }) -ne $null) (($wParts | Select-Object -First 1).stars)
Ok 'waiting: sala status waiting' ($wSnap.sala.status -eq 'waiting') $wSnap.sala.status
Ok 'waiting: docente/curso present' (($null -ne $wSnap.sala.docente) -and ($null -ne $wSnap.sala.curso)) "docente=$($wSnap.sala.docente)"

try {
  $r = Invoke-WebRequest -Uri "$base/api/salas?code=NOEXISTE$stamp" -WebSession $swp -UseBasicParsing
  Ok 'waiting: codigo inexistente 404' ($false) "unexpected $($r.StatusCode)"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok 'waiting: codigo inexistente 404' ($code -eq 404) "code=$code"
}

$r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swh -Body (@{
  action = 'leave'; room_id = $wId
} | ConvertTo-Json) -UseBasicParsing
Ok 'waiting: leave' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/salas?code=$([uri]::EscapeDataString($wCode))" -WebSession $swp -UseBasicParsing
$wAfterLeave = J $r
Ok 'waiting: 1 jugador tras leave' ((@($wAfterLeave.participantes).Count) -eq 1) "count=$(@($wAfterLeave.participantes).Count)"

$r = Invoke-WebRequest -Uri "$base/api/salas?code=$([uri]::EscapeDataString($wCode))" -WebSession $swh -UseBasicParsing
Ok 'waiting: host rejoin after leave' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swp -Body (@{
  action = 'join'; code = $wCode
} | ConvertTo-Json) -UseBasicParsing
Ok 'waiting: player rejoin' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/salas" -Method Post -ContentType 'application/json' -WebSession $swh -Body (@{
  action = 'start'; room_id = $wId
} | ConvertTo-Json) -UseBasicParsing
Ok 'waiting: start by host' ($r.StatusCode -eq 200) $r.StatusCode

$r = Invoke-WebRequest -Uri "$base/api/salas?code=$([uri]::EscapeDataString($wCode))" -WebSession $swp -UseBasicParsing
$wStarted = J $r
Ok 'waiting: status in_progress tras start' ($wStarted.sala.status -eq 'in_progress') $wStarted.sala.status

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

# ═══ RESULTS ═══
Write-Host "`n=== E2E RESULTS ==="
$results | Format-Table -AutoSize -Wrap
$pass = @($results | Where-Object Pass).Count
$fail = @($results | Where-Object { -not $_.Pass }).Count
Write-Host "PASS=$pass FAIL=$fail TOTAL=$($results.Count)"
$results | ConvertTo-Json -Depth 3 | Set-Content -Path "$env:TEMP\e2e_results.json" -Encoding UTF8
if ($fail -gt 0) { exit 1 } else { exit 0 }
