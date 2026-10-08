// ETAPA 2 — Grupo 2: preguntas con reloj. SECCIÓN A: modificador 'contrarreloj'.
//  A0) Sala Caos ["contrarreloj"] (modo decisiones fijado): start → match.modifiers correcto.
//  A1) GET /api/partida inserta el ancla de arranque (position -1) para el participante.
//  A2) POST action='question_started' → claimed:true y fila position 0 en la BD (reloj del servidor).
//  A3) Primer reclamo gana: repetir claim no mueve started_at (ON CONFLICT DO NOTHING).
//  A4) Respuesta honesta dentro de plazo → aceptada (+10, timed_out=false) con position 0.
//  A5) Claim q1 + responder a los 12 s (payload timed_out:false de cliente) → el SERVIDOR
//      fuerza timeout: correct=false, points_delta=-5, timed_out=true (autoridad del servidor).
//  A6) Sin claim, respuesta inmediata tras la previa (ancla+tope+ventana) → aceptada (+10).
//  A7) Sin claim, respuesta a los ~19.5 s de la previa (> tope 8 s + ventana 10 s) → timeout forzado.
//  A8) Claim TARDÍO recortado: claim a los 10 s de la previa queda en min(now, prev+8 s);
//      responder a los ~19.5 s → timeout forzado (sin el recorte el plazo sería ~20 s y se aceptaría).
//  A9) claim con question_id ajeno → 400.
//  A10) Sala Caos SIN contrarreloj ["doble_puntos"]: claim → claimed:false, sin filas de reloj,
//       y responder a los 12 s de la previa se ACEPTA (el efecto es solo con el ID en modifiers).
//  A11) NAVEGADOR: contador [data-chaos-countdown] visible con 1..10 al mostrarse la pregunta,
//       sin interactuar se apaga a los 10 s y la BD registra timed_out con la penalización del modo.
// SECCIÓN B: modificador 'pregunta_fugaz' (el ENUNCIADO se oculta a los 5 s;
// las respuestas siguen visibles y NO hay timeout de respuesta — spec).
//  B0) Sala Caos ["pregunta_fugaz"] (modo lava) → start → match.modifiers correcto.
//  B1) GET: modificadores + ≥4 preguntas y SIN filas de reloj (fugaz no usa el reloj del servidor).
//  B2) claim → claimed:false (sin ventana de respuesta).
//  B3) Respuesta a los 2.5 s → aceptada (+15, timed_out=false).
//  B4) Sin claim, respuesta a los 6.5 s (> 5 s): se ACEPTA (spec: puede seguir respondiendo).
//  B5) Sin claim, respuesta rápida → aceptada.
//  B6) Sin claim, respuesta a los ~13.5 s: se ACEPTA (fugaz NO fuerza timeout).
//  B7) BD s1: filas 0..3 exactas (4 aciertos, 0 timeouts).
//  B8-B17) NAVEGADOR (lava): prompt visible; SIN contador de ventana; enunciado [data-chaos-hidden]
//        a los ~5 s; las OPCIONES siguen visibles; sin fila automática; click tras ocultar →
//        respuesta ACEPTADA; al pasar a la pregunta siguiente el enunciado se vuelve a mostrar
//        completo y se oculta de nuevo a los ~5 s (reinicio del timer); sin pageerrors.
// SECCIÓN C: modificador 'memoria' (oculta enunciado+opciones a los 5 s; SIN ventana de respuesta).
//  C0) Sala Caos ["memoria"] (modo abismos) → start → match.modifiers correcto.
//  C1) GET: modificadores correctos y SIN filas de reloj (memoria no usa el reloj del servidor).
//  C2) claim → claimed:false (no hay ventana de respuesta).
//  C3) Respuesta a los 7 s (> 5 s) → se ACEPTA (+20, timed_out=false): memoria NO es un límite de tiempo.
//  C4-C9) NAVEGADOR: enunciado visible → a los ~5 s [data-chaos-hidden] en enunciado y opciones
//        (opacity 0, texto aún en el DOM); sin click no hay fila automática en la BD;
//        click en una tarjeta OCULTA a los ~7 s → respuesta ACEPTADA (timed_out=false); sin pageerrors.
// SECCIÓN D: modificador 'tiempo_compartido' (presupuesto global de 240 s).
//  D0) Sala Caos ["tiempo_compartido"] → start → match.modifiers correcto.
//  D1) GET /api/partida → partida.tiempo.restar_ms ∈ [150, 240] s.
//  D2) Respuesta rápida dentro de presupuesto → aceptada (+10, timed_out=false).
//  D3) NAVEGADOR: [data-chaos-global-timer] visible (mm:ss ∈ [150, 240] s).
//  D4) NAVEGADOR: el presupuesto DECRECE entre dos muestras (~2.5 s).
//  D5) Backdate started_at a 241 s → lectura GET /api/salas → sala.status='finished' (autoridad servidor).
//  D6) BD: el match quedó finalizado (status=finished, finished_at no nulo).
//  D7) GET /api/partida/resultados sigue respondiendo 200 tras el auto-fin.
//  D8) NAVEGADOR: el timer desaparece (room:finished → setChaosClock(null)).
//  D9) NAVEGADOR: sin pageerrors.
// SECCIÓN E: modificador 'pregunta_sorpresa' (efecto adicional DETERMINISTA por
// pregunta, sha256(matchId:questionId), pool solo de efectos compatibles).
//  E0) Sala Caos ["pregunta_sorpresa"] (modo lava) → start → match.modifiers correcto.
//  E1) GET: ≥5 preguntas TODAS con campo sorpresa; efectos ∈ pool ∪ {null};
//       ≥1 efecto no-normal y ≥2 efectos distintos (distribución no degenerada).
//  E2) Dos GET del mismo jugador + GET del2º jugador → mismos efectos por pregunta.
//  E3) Cada efecto = sha256(matchId:questionId) mod5 RECOMPUTADO aquí (misma fórmula).
//  E4) BD: matches.modifiers intacto (["pregunta_sorpresa"]) tras los GET.
//  E5) Sala sin el modificador (N): las preguntas NO llevan el campo sorpresa.
//  E6) Reutiliza los efectos existentes: sin efecto mezcladas → orden natural
//       (sort_order,id) intacto; con efecto mezcladas → orden = sha256 del
//       algoritmo existente; mismo orden para ambos jugadores. Fallback: si la
//       tirada de E no incluye 'respuestas_mezcladas' se crea una2ª sala (F).
//  E7) NAVEGADOR (lava): comportamiento según el efecto de q0 (fugaz → oculta
//       enunciado ~5 s y opciones visibles; memoria → oculta ambos; numeradas →
//       etiquetas [1]/[2]; mezcladas/normal → todo visible sin etiquetas
//       numeradas); sin contador de ventana; sin pageerrors.
//  E8) Spoof (sorpresa/modifiers/points_delta en el POST answer) IGNORADO:
//       delta +15 autoritativo, modifiers intactos en BD y score=15.
//  E9) claim → claimed:false y SIN filas de reloj (sorpresa no abre ventana).
// SECCIÓN F: interacciones obligatorias (Grupo 2 × modificadores existentes).
//  F0) 12 salas con combinaciones: contrarreloj×(ritmo_expres|doble_puntos|
//       barajado), fugaz×(mezcladas|numeradas), memoria×(mezcladas|numeradas),
//       sorpresa×(barajado|mezcladas), tiempo×(barajado|doble) y los 5 nuevos
//       a la vez; generación en paralelo con poll conjunto.
//  F01) contrarreloj+ritmo_expres: ancla -1 en GET y claim → claimed:true.
//  F02) contrarreloj+doble_puntos: acierto en ventana +20 (x2) y a los 12 s
//       timeout forzado -5 (el fallo NO se duplica).
//  F03) contrarreloj+barajado: orden servido = sha256(match:question) sobre
//       sort_order; ancla y claim operativos sobre las preguntas barajadas.
//  F04) fugaz+mezcladas: claim → claimed:false; TODAS las opciones en orden
//       sha256(match:question:option); acierto rápido +10.
//  F05) fugaz+numeradas (lava): claim → false; acierto a los 6.5 s aceptado;
//       NAVEGADOR: enunciado [data-chaos-hidden] ~5 s, opciones visibles con
//       etiquetas [1]/[2], sin contador de ventana, sin pageerrors.
//  F06) memoria+mezcladas: claim → false; opciones en orden sha; acierto +10.
//  F07) memoria+numeradas: claim → false; acierto a los 6.5 s SE ACEPTA
//       (memoria sigue sin ser límite de tiempo con numeradas).
//  F08) sorpresa+barajado: orden de preguntas = sha256 y efectos sorpresa
//       recomputados por pregunta (sha256(match:question) mod 5).
//  F09) sorpresa+mezcladas: efectos recomputados + TODAS las opciones en orden
//       sha (el baseOn global prevalece); claim → claimed:false.
//  F10) tiempo_compartido+barajado: restar_ms ∈ [150,240] s y orden barajado.
//  F11) tiempo_compartido+doble_puntos: restar_ms presente y acierto +20.
//  F12) los 5 nuevos a la vez: ancla -1 + claim true (contrarreloj gana la
//       ventana), efectos sorpresa recomputados, restar_ms presente y acierto
//       en ventana +10 (scoring intacto, sin doble).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { createHash } = require('crypto');
const puppeteer = require('puppeteer');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'http://localhost:3000';
const EXEC = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9ñáéíóúü]/g, '');

const GAMES = {
  decisiones: { correct: 10, wrong: -5, xp: 15 },
  lava: { correct: 15, wrong: -5, xp: 15 },
  tierras: { correct: 20, wrong: 0, xp: 20 },
  abismos: { correct: 20, wrong: -5, xp: 20 },
};
const PATHS = { decisiones: '/camino-decisiones', lava: '/lava-conocimiento', tierras: '/tierras-hundidas', abismos: '/entre-abismos' };
// Pool de 'pregunta_sorpresa' (misma fórmula que el servidor: sha256 mod 5).
const SORPRESA_POOL_E = ['respuestas_mezcladas', 'opciones_numeradas', 'pregunta_fugaz', 'memoria'];
const surpriseExpect = (matchId, qid) => {
  const h = createHash('sha256').update(`${matchId}:${qid}`).digest('hex');
  const b = parseInt(h.slice(0, 8), 16) % (SORPRESA_POOL_E.length + 1);
  return b === SORPRESA_POOL_E.length ? null : SORPRESA_POOL_E[b];
};
const sha = (s) => createHash('sha256').update(s).digest('hex');

const ok = [], fail = [];
const check = (name, cond, detail) => {
  (cond ? ok : fail).push(name + (detail ? ` [${detail}]` : ''));
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${detail ? ' ' + detail : ''}`);
};

function psql(q) {
  const f = path.join(os.tmpdir(), 'tq_' + Date.now() + '.sql');
  fs.writeFileSync(f, q, 'utf8');
  try {
    return execSync(`"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe" -U postgres -d eduplay_db -w -t -A -f "${f}"`, {
      env: { ...process.env, PGPASSWORD: 'casimiro123' }, encoding: 'utf8',
    }).trim();
  } finally { try { fs.unlinkSync(f); } catch {} }
}

// ---------------------------------------------------------------------------
// Infra: el servidor de desarrollo debe estar operativo ANTES de la suite.
// Si muere durante la suite, safeFetch convierte el 'TypeError: fetch failed'
// en un error diagnosticable (nunca en PASS) sin reintentos infinitos.
// ---------------------------------------------------------------------------
async function waitForServer(timeoutMs = 90000) {
  const t0 = Date.now();
  let last = 'sin intentos';
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/`, { redirect: 'manual' });
      if (res.status < 500) return Date.now() - t0;
      last = `HTTP ${res.status}`;
    } catch (e) { last = String((e && e.message) || e); }
    await sleep(500);
  }
  throw new Error(`servidor no disponible en ${BASE} tras ${timeoutMs}ms (último: ${last})`);
}

async function safeFetch(url, init, label) {
  try {
    return await fetch(url, init);
  } catch (e) {
    const detail = String((e && e.message) || e);
    let status = null;
    let alive = false;
    try {
      const r = await fetch(`${BASE}/`, { redirect: 'manual' });
      status = r.status;
      alive = r.status < 500;
    } catch {}
    const err = alive
      ? new Error(`fetch falló en ${label} pero ${BASE} sigue respondiendo (HTTP ${status}): ${detail}`)
      : new Error(`SERVIDOR CAÍDO en ${BASE} durante la suite (petición ${label}, sonda ${status == null ? 'sin respuesta' : 'HTTP ' + status}): ${detail}`);
    err.connection = true;
    throw err;
  }
}

async function registerAndLoginStudent(name, email, password) {
  try {
    await safeFetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: name, email, password }),
    }, 'auth/register');
  } catch (e) { if (e && e.connection) throw e; } // 409 (ya registrado) es esperado
  const res = await safeFetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }, 'auth/login');
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login student ${email}: ${res.status} ${JSON.stringify(j)}`);
  return { cookie: (res.headers.get('set-cookie') || '').split(';')[0], uid: j?.user?.id ?? j?.id };
}

async function loginPanel(email, password) {
  const res = await safeFetch(`${BASE}/api/panel/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }, 'panel/auth/login');
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.user) throw new Error(`login panel ${email}: ${res.status}`);
  return { cookie: (res.headers.get('set-cookie') || '').split(';')[0], user: j.user };
}

async function api(cookie, p, body, method) {
  const res = await safeFetch(`${BASE}${p}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  }, p);
  let j = null;
  try { j = await res.json(); } catch {}
  return { status: res.status, j };
}

function matchRow(roomId) {
  const t = psql(
    `SELECT m.id, m.question_count, m.modifiers::text, r.course_id, coalesce(gm.code, '') ` +
    `FROM matches m JOIN rooms r ON r.id = m.room_id ` +
    `LEFT JOIN game_modes gm ON gm.id = r.game_mode_id ` +
    `WHERE m.room_id='${roomId}' AND m.status='in_progress' ORDER BY m.created_at DESC LIMIT 1;`
  );
  if (!t) return null;
  const [id, qc, mods, cid, gc] = t.split('|');
  let parsed = null;
  try { parsed = JSON.parse(mods); } catch {}
  return { id, question_count: Number(qc), modifiers: parsed, course_id: cid, mode: gc };
}

function participantRow(matchId, userId) {
  const t = psql(
    `SELECT score, xp, stars_earned, status FROM match_participants ` +
    `WHERE match_id='${matchId}' AND user_id='${userId}';`
  );
  if (!t) return null;
  const [score, xp, stars, status] = t.split('|');
  return { score: Number(score), xp: Number(xp), stars: Number(stars), status };
}

/** Filas del reloj de preguntas: position:epoch(started_at) (incluye -1 = boot). */
function clockRows(matchId, userId) {
  const out = psql(
    `SELECT pqc.question_position || ':' || round(extract(epoch FROM pqc.started_at)::numeric, 3)::text ` +
    `FROM participant_question_clocks pqc ` +
    `JOIN match_participants mp ON mp.id = pqc.participant_id ` +
    `WHERE mp.match_id='${matchId}' AND mp.user_id='${userId}' ORDER BY pqc.question_position;`
  );
  return out ? out.split('\n').map((s) => s.trim()).filter(Boolean) : [];
}

/** Detalle de respuestas: position:timed_out:is_correct:points_delta. */
function answerDetail(matchId, userId) {
  const out = psql(
    `SELECT pa.question_position || ':' || pa.timed_out || ':' || coalesce(pa.is_correct::text, 'null') || ':' || pa.points_delta ` +
    `FROM participant_answers pa JOIN match_participants mp ON mp.id = pa.participant_id ` +
    `WHERE mp.match_id='${matchId}' AND mp.user_id='${userId}' ORDER BY pa.question_position ASC;`
  );
  return out ? out.split('\n').map((s) => s.trim()).filter(Boolean) : [];
}

async function answer(cookie, roomId, q, extra) {
  return api(cookie, '/api/partida', {
    action: 'answer', room_id: roomId, question_id: q.id,
    option_id: q.correct_option_id, response_time_ms: 1000, ...(extra || {}),
  });
}

async function claim(cookie, roomId, questionId) {
  return api(cookie, '/api/partida', { action: 'question_started', room_id: roomId, question_id: questionId });
}

async function waitGeneration(s1, roomId) {
  for (let i = 0; i < 110; i++) {
    const st = await api(s1.cookie, '/api/caos', { action: 'status', room_id: roomId });
    const g = st.j?.caos?.generation_status ?? '';
    if (g === 'ready') return 'ready';
    if (g === 'failed') return 'failed';
    await sleep(3000);
  }
  return 'timeout';
}

// ---------------- navegador ----------------
async function openGame(browser, cookie, gamePath, roomId) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const [cName, ...cRest] = cookie.split('=');
  await page.setCookie({ name: cName, value: cRest.join('='), domain: 'localhost', path: '/' });
  await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(() => { sessionStorage.setItem('eduplay_app_session', '1'); });
  await page.goto(`${BASE}${gamePath}?sala=${encodeURIComponent(roomId)}`, { waitUntil: 'load', timeout: 60000 });
  return { ctx, page };
}

async function waitPrompt(page, prompt, tries = 120) {
  const np = norm(prompt);
  if (!np) return false;
  for (let i = 0; i < tries; i++) {
    const t = await page.evaluate(() => document.body.innerText || '').catch(() => '');
    if (norm(t).includes(np)) return true;
    await sleep(300);
  }
  return false;
}

async function readCountdown(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-chaos-countdown]');
    if (!el) return null;
    const m = /(\d+)/.exec(el.textContent || '');
    return m ? Number(m[1]) : null;
  }).catch(() => null);
}

async function waitAnswerRow(matchId, userId, tries = 24) {
  for (let i = 0; i < tries; i++) {
    const d = answerDetail(matchId, userId);
    if (d.length >= 1) return d;
    await sleep(500);
  }
  return answerDetail(matchId, userId);
}

// ---------------- main ----------------
async function main() {
  const stamp = Date.now();
  const upMs = await waitForServer();
  console.log(`INFO - servidor listo en ${upMs}ms`);
  const t = await loginPanel('ana.garcia@gmail.com', 'demo123');
  const s1 = await registerAndLoginStudent(`Tq Uno ${stamp}`, `tq1_${stamp}@gmail.com`, 'secret123');
  const s2 = await registerAndLoginStudent(`Tq Dos ${stamp}`, `tq2_${stamp}@gmail.com`, 'secret123');
  check('setup: 2 estudiantes + docente logueados', !!(s1.uid && s2.uid && t.cookie), `u1=${s1.uid}`);

  const spp = {};
  for (const line of psql(`SELECT code || '=' || stars_per_correct FROM game_modes;`).split('\n')) {
    const [code, v] = line.trim().split('=');
    if (code) spp[code] = Number(v);
  }
  check('stars_per_correct leídos de game_modes', Object.keys(spp).length >= 4, JSON.stringify(spp));

  // ---------- salas: A) contrarreloj, B) pregunta_fugaz, N) sin reloj ----------
  const rooms = [
    { key: 'A', game: 'decisiones', mods: ['contrarreloj'] },
    { key: 'B', game: 'lava', mods: ['pregunta_fugaz'] },
    { key: 'C', game: 'abismos', mods: ['memoria'] },
    { key: 'D', game: 'decisiones', mods: ['tiempo_compartido'] },
    { key: 'E', game: 'lava', mods: ['pregunta_sorpresa'] },
    { key: 'N', game: 'decisiones', mods: ['doble_puntos'] },
  ];
  for (const r of rooms) {
    const cr = await api(s1.cookie, '/api/caos', { action: 'create', difficulty: 'medio' });
    if (cr.status !== 201 || !cr.j?.sala?.id) {
      check(`create Caos ${r.key}`, false, `status=${cr.status} err=${cr.j?.error}`);
      continue;
    }
    r.id = cr.j.sala.id;
    r.code = cr.j.sala.code;
    psql(`UPDATE chaos_rooms SET game_code='${r.game}', modifiers='${JSON.stringify(r.mods)}'::jsonb WHERE room_id='${r.id}';`);
    psql(`UPDATE rooms SET game_mode_id=(SELECT id FROM game_modes WHERE code='${r.game}') WHERE id='${r.id}';`);
    await sleep(350);
  }
  let suiteError = null;
  try {
  const creadas = rooms.filter((r) => r.id);
  check('A0a) 6 salas Caos creadas', creadas.length === 6, `n=${creadas.length}`);
  for (const r of creadas) {
    const g = await waitGeneration(s1, r.id);
    check(`gen ${r.key}: generación ready`, g === 'ready', g);
  }

  const R = rooms.find((r) => r.key === 'A');
  const N = rooms.find((r) => r.key === 'N');
  if (!R?.id) { throw new Error('sin sala contrarreloj'); }

  await api(s2.cookie, '/api/salas', { action: 'join', code: R.code });
  const stA = await api(s1.cookie, '/api/caos', { action: 'start', room_id: R.id });
  const mA = matchRow(R.id);
  check('A0b) start y match.modifiers=["contrarreloj"] (modo decisiones)',
    stA.status === 200 && !!mA && JSON.stringify(mA.modifiers) === '["contrarreloj"]' && mA.mode === 'decisiones',
    mA ? `mods=${JSON.stringify(mA.modifiers)} mode=${mA.mode}` : `start=${stA.status}`);
  check('A0c) ≥5 preguntas servidas', (mA?.question_count ?? 0) >= 5, `qc=${mA?.question_count}`);

  const gpA = await api(s1.cookie, `/api/partida?room_id=${R.id}`);
  const preguntas = gpA.j?.preguntas || [];
  check('A1a) GET servido con modificadores', JSON.stringify(gpA.j?.partida?.modificadores) === '["contrarreloj"]',
    JSON.stringify(gpA.j?.partida?.modificadores));
  check('A1b) ≥5 preguntas', preguntas.length >= 5, `n=${preguntas.length}`);
  const clocks1 = clockRows(mA.id, s1.uid);
  check('A1c) BD: ancla de arranque (position -1) insertada en el GET', clocks1.some((x) => x.startsWith('-1:')),
    clocks1.join(','));

  // A2) claim inicial q0
  const c0 = await claim(s1.cookie, R.id, preguntas[0].id);
  check('A2) claim q0 → claimed:true', c0.status === 200 && c0.j?.ok === true && c0.j?.claimed === true,
    `status=${c0.status} j=${JSON.stringify(c0.j)}`);
  let cRow = clockRows(mA.id, s1.uid).find((x) => x.startsWith('0:'));
  check('A2b) BD: fila position 0 estampada por el servidor', !!cRow, clockRows(mA.id, s1.uid).join(','));

  // A3) primer reclamo gana
  await sleep(1200);
  const c0b = await claim(s1.cookie, R.id, preguntas[0].id);
  const cRow2 = clockRows(mA.id, s1.uid).find((x) => x.startsWith('0:'));
  check('A3) claim repetido NO mueve started_at (first-wins)',
    c0b.status === 200 && c0b.j?.claimed === true && !!cRow && cRow === cRow2,
    `antes=${cRow} despues=${cRow2}`);

  // A4) respuesta honesta dentro de plazo
  const r0 = await answer(s1.cookie, R.id, preguntas[0]);
  check('A4) q0 dentro de plazo: aceptada +10, timed_out=false, position 0',
    r0.status === 200 && r0.j?.correct === true && r0.j?.points_delta === 10 && r0.j?.timed_out === false && r0.j?.question_position === 0,
    `delta=${r0.j?.points_delta} to=${r0.j?.timed_out} pos=${r0.j?.question_position}`);

  // A5) claim q1 y responder a los 12 s (payload del cliente dice timed_out:false)
  await claim(s1.cookie, R.id, preguntas[1].id);
  await sleep(12000);
  const r1 = await answer(s1.cookie, R.id, preguntas[1], { timed_out: false, junk: { fake: 1 } });
  check('A5) q1 tarde (12 s>10 s): el SERVIDOR fuerza timeout (payload timed_out:false ignorado)',
    r1.status === 200 && r1.j?.correct === false && r1.j?.points_delta === -5 && r1.j?.timed_out === true && r1.j?.score === 5,
    `delta=${r1.j?.points_delta} score=${r1.j?.score} to=${r1.j?.timed_out}`);
  const det1 = answerDetail(mA.id, s1.uid);
  check('A5b) BD q1: timed_out=true, is_correct=false, points_delta=-5', det1[1] === '1:true:false:-5', det1.join(','));

  // A6) sin claim: respuesta inmediata tras la previa → aceptada (ancla previa + 18 s)
  const r2 = await answer(s1.cookie, R.id, preguntas[2]);
  check('A6) q2 sin claim y respuesta rápida: aceptada +10',
    r2.status === 200 && r2.j?.correct === true && r2.j?.points_delta === 10 && r2.j?.timed_out === false,
    `delta=${r2.j?.points_delta} to=${r2.j?.timed_out}`);

  // A7) sin claim: respuesta a los ~19.5 s de la previa (límite previo+tope8+ventana10=18 s)
  await sleep(19500);
  const r3 = await answer(s1.cookie, R.id, preguntas[3]);
  check('A7) q3 sin claim a los ~19.5 s (> 18 s): timeout forzado',
    r3.status === 200 && r3.j?.correct === false && r3.j?.points_delta === -5 && r3.j?.timed_out === true,
    `delta=${r3.j?.points_delta} to=${r3.j?.timed_out}`);

  // A8) claim tardío recortado: claim a los 10 s queda en min(now, prev+8 s); responder a los ~19.5 s
  await sleep(10000);
  await claim(s1.cookie, R.id, preguntas[4].id);
  await sleep(9600);
  const r4 = await answer(s1.cookie, R.id, preguntas[4]);
  check('A8) q4 con claim tardío RECORTADO: a los ~19.5 s → timeout (sin recorte sería ~20 s y pasaría)',
    r4.status === 200 && r4.j?.correct === false && r4.j?.points_delta === -5 && r4.j?.timed_out === true,
    `delta=${r4.j?.points_delta} to=${r4.j?.timed_out}`);

  // A9) claim con question_id ajeno
  const cBad = await claim(s1.cookie, R.id, '11111111-1111-4111-8111-111111111111');
  check('A9) claim con question_id ajeno → 400', cBad.status === 400, `status=${cBad.status}`);

  const detA = answerDetail(mA.id, s1.uid);
  const expA = ['0:false:true:10', '1:true:false:-5', '2:false:true:10', '3:true:false:-5', '4:true:false:-5'];
  check('A9b) BD s1: filas 0..4 exactas (2 aciertos + 3 timeouts)',
    JSON.stringify(detA.slice(0, 5)) === JSON.stringify(expA), detA.join(','));
  const prA = participantRow(mA.id, s1.uid);
  check('A9c) BD s1: score final 5 (20 aciertos − 15 timeouts)', !!prA && prA.score === 5 && prA.status === 'playing',
    prA ? `score=${prA.score} status=${prA.status}` : 'sin participante');

  // A10) sala SIN contrarreloj: claim no-op y respuestas lentas aceptadas
  if (N?.id) {
    await api(s2.cookie, '/api/salas', { action: 'join', code: N.code });
    const stN = await api(s1.cookie, '/api/caos', { action: 'start', room_id: N.id });
    const mN = matchRow(N.id);
    check('A10a) start sala N: match.modifiers=["doble_puntos"]',
      stN.status === 200 && !!mN && JSON.stringify(mN.modifiers) === '["doble_puntos"]',
      mN ? JSON.stringify(mN.modifiers) : `start=${stN.status}`);
    const gpN = await api(s1.cookie, `/api/partida?room_id=${N.id}`);
    const pregN = gpN.j?.preguntas || [];
    const cN = await claim(s1.cookie, N.id, pregN[0]?.id ?? '');
    check('A10b) sin contrarreloj: claim → claimed:false', cN.status === 200 && cN.j?.claimed === false,
      `status=${cN.status} j=${JSON.stringify(cN.j)}`);
    const nClocks = mN ? clockRows(mN.id, s1.uid) : [];
    check('A10c) BD: sin filas de reloj en sala N', nClocks.length === 0, nClocks.join(','));
    const n0 = await answer(s1.cookie, N.id, pregN[0]);
    await sleep(12000);
    const n1 = await answer(s1.cookie, N.id, pregN[1]);
    check('A10d) sin contrarreloj: respuesta a los 12 s se ACEPTA (doble_puntos intacto: +20)',
      n0.j?.correct === true && n1.status === 200 && n1.j?.correct === true && n1.j?.points_delta === 20 && n1.j?.timed_out === false,
      `n1 delta=${n1.j?.points_delta} to=${n1.j?.timed_out}`);
  }

  // A11) navegador: contador 10 s y auto-timeout sin interacción
  const browser = await puppeteer.launch({
    executablePath: EXEC, headless: true,
    args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  let ctx = null;
  try {
    const opened = await openGame(browser, s2.cookie, PATHS[R.game], R.id);
    ctx = opened.ctx;
    const page = opened.page;
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

    const seen = await waitPrompt(page, preguntas[0]?.prompt || '');
    check('A11a) navegador: prompt0 visible', seen, seen ? '' : 'timeout 36s');

    let cd = null;
    for (let i = 0; i < 20 && cd == null; i++) { cd = await readCountdown(page); if (cd == null) await sleep(300); }
    check('A11b) navegador: [data-chaos-countdown] visible con 1..10',
      cd != null && cd >= 1 && cd <= 10, `cd=${cd}`);

    // Sin interacción: el reloj local apaga a los 10 s y el POST timed_out llega al servidor.
    let cdGone = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      const v = await readCountdown(page);
      if (v == null) { cdGone = true; break; }
      await sleep(400);
    }
    check('A11c) navegador: el contador desaparece (fase de feedback tras 10 s)', cdGone, `elapsed=${Date.now() - t0}ms`);

    const det2 = await waitAnswerRow(mA.id, s2.uid);
    check('A11d) BD navegador s2: position 0 timed_out=true con penalización del modo (-5)',
      det2[0] === '0:true:false:-5', det2.join(','));
    if (errors.length) console.log(`INFO A11 pageErrors=${JSON.stringify(errors.slice(0, 3))}`);
    check('A11e) navegador sin pageerrors', errors.length === 0, errors.slice(0, 2).join(' | '));
    if (fail.some((f) => f.startsWith('A11'))) {
      await page.screenshot({ path: path.join(os.tmpdir(), 'tqfail_a11.png') }).catch(() => {});
    }
    await ctx.close();
    ctx = null;
  } catch (e) {
    check('A11: ejecución sin excepción', false, String(e).slice(0, 200));
    if (ctx) await ctx.close().catch(() => {});
  } finally {
    await browser.close();
  }

  // ---------- SECCIÓN B) 'pregunta_fugaz' (enunciado oculto a los 5 s; sin timeout) ----------
  const B = rooms.find((r) => r.key === 'B');
  if (!B?.id) throw new Error('sin sala pregunta_fugaz');
  await api(s2.cookie, '/api/salas', { action: 'join', code: B.code });
  const stB = await api(s1.cookie, '/api/caos', { action: 'start', room_id: B.id });
  const mB = matchRow(B.id);
  check('B0) start y match.modifiers=["pregunta_fugaz"]',
    stB.status === 200 && !!mB && JSON.stringify(mB.modifiers) === '["pregunta_fugaz"]',
    mB ? `mods=${JSON.stringify(mB.modifiers)} qc=${mB.question_count}` : `start=${stB.status}`);
  const gpB = await api(s1.cookie, `/api/partida?room_id=${B.id}`);
  const pregB = gpB.j?.preguntas || [];
  const clocksB = mB ? clockRows(mB.id, s1.uid) : [];
  check('B1) GET con modificadores + ≥4 preguntas + SIN filas de reloj (fugaz no es ventana)',
    JSON.stringify(gpB.j?.partida?.modificadores) === '["pregunta_fugaz"]' &&
    pregB.length >= 4 && clocksB.length === 0,
    `mods=${JSON.stringify(gpB.j?.partida?.modificadores)} n=${pregB.length} clocks=[${clocksB.join(',')}]`);

  const b0 = await claim(s1.cookie, B.id, pregB[0].id);
  check('B2) claim → claimed:false (fugaz NO abre ventana de respuesta)',
    b0.status === 200 && b0.j?.claimed === false, `status=${b0.status} j=${JSON.stringify(b0.j)}`);

  await sleep(2500);
  const br0 = await answer(s1.cookie, B.id, pregB[0]);
  check('B3) q0 a los 2.5 s: aceptada +15, timed_out=false',
    br0.status === 200 && br0.j?.correct === true && br0.j?.points_delta === 15 && br0.j?.timed_out === false,
    `delta=${br0.j?.points_delta} to=${br0.j?.timed_out}`);

  await sleep(6500);
  const br1 = await answer(s1.cookie, B.id, pregB[1]);
  check('B4) q1 respuesta tardía (~6.5 s tras la anterior): SE ACEPTA (spec: sin timeout)',
    br1.status === 200 && br1.j?.correct === true && br1.j?.points_delta === 15 && br1.j?.timed_out === false,
    `delta=${br1.j?.points_delta} to=${br1.j?.timed_out}`);

  const br2 = await answer(s1.cookie, B.id, pregB[2]);
  check('B5) q2 sin claim y respuesta rápida: aceptada +15',
    br2.status === 200 && br2.j?.correct === true && br2.j?.points_delta === 15 && br2.j?.timed_out === false,
    `delta=${br2.j?.points_delta} to=${br2.j?.timed_out}`);

  await sleep(13500);
  const br3 = await answer(s1.cookie, B.id, pregB[3]);
  check('B6) q3 sin claim a los ~13.5 s: SE ACEPTA (fugaz NO fuerza timeout)',
    br3.status === 200 && br3.j?.correct === true && br3.j?.points_delta === 15 && br3.j?.timed_out === false,
    `delta=${br3.j?.points_delta} to=${br3.j?.timed_out}`);

  const detB = answerDetail(mB.id, s1.uid);
  const expB = ['0:false:true:15', '1:false:true:15', '2:false:true:15', '3:false:true:15'];
  check('B7) BD s1: filas 0..3 exactas (4 aciertos, 0 timeouts)',
    JSON.stringify(detB.slice(0, 4)) === JSON.stringify(expB), detB.join(','));

  // B8-B18) navegador: ocultado a los 5 s sin perder la capacidad de responder
  const browserB = await puppeteer.launch({
    executablePath: EXEC, headless: true,
    args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  let ctxB = null;
  try {
    const opened = await openGame(browserB, s2.cookie, PATHS[B.game], B.id);
    ctxB = opened.ctx;
    const page = opened.page;
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

    const seen = await waitPrompt(page, pregB[0]?.prompt || '');
    check('B8) navegador: prompt0 visible', seen, seen ? '' : 'timeout 36s');

    let hiddenAt = -1;
    const tb0 = Date.now();
    while (Date.now() - tb0 < 9000) {
      const n = await page.evaluate(() => document.querySelectorAll('[data-chaos-hidden]').length).catch(() => -1);
      if (n >= 1) { hiddenAt = Date.now() - tb0; break; }
      await sleep(250);
    }
    check('B9) navegador: el enunciado queda [data-chaos-hidden] a los ~5 s',
      hiddenAt >= 2500 && hiddenAt <= 8000, `hiddenAt=${hiddenAt}ms`);

    let cd = null;
    for (let i = 0; i < 6 && cd == null; i++) { cd = await readCountdown(page); if (cd == null) await sleep(250); }
    check('B10) navegador: SIN contador de ventana (fugaz no es un timeout)', cd == null, `cd=${cd}`);

    const optsB = await page.evaluate(() => {
      const c = document.querySelector('[data-chaos-options]');
      if (!c) return { present: false };
      return { present: true, hidden: c.hasAttribute('data-chaos-hidden'), opacity: getComputedStyle(c).opacity };
    }).catch(() => ({ present: false }));
    check('B11) navegador: las OPCIONES siguen visibles tras ocultar el enunciado',
      optsB.present && !optsB.hidden && optsB.opacity !== '0', JSON.stringify(optsB));

    const preClick = answerDetail(mB.id, s2.uid);
    check('B12) BD navegador s2: sin fila automática (no hay auto-submit al ocultarse)',
      preClick.length === 0, preClick.join(','));

    const clickTxt = (pregB[0]?.options || []).find((o) => o.id === pregB[0]?.correct_option_id)?.text || '';
    const clickRes = await page.evaluate((txt) => {
      const np = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9ñáéíóúü]/g, '');
      const t = np(txt);
      const wrap = document.querySelector('[data-chaos-options]');
      const btns = Array.from((wrap || document).querySelectorAll('button')).filter((b) => !b.disabled && b.offsetParent !== null);
      const target = t ? btns.find((b) => np(b.innerText).includes(t)) : null;
      if (!target) return null;
      target.click();
      return target.innerText.slice(0, 40).replace(/\n/g, ' ');
    }, clickTxt).catch(() => null);
    check('B13) click en opción tras ocultar el enunciado', !!clickRes, String(clickRes));
    const detB2 = await waitAnswerRow(mB.id, s2.uid, 30);
    check('B14) BD navegador s2: respuesta tras ocultar ACEPTADA (timed_out=false)',
      detB2.length > 0 && (detB2[0] === '0:false:true:15' || detB2[0] === '0:false:false:-5'),
      detB2.join(','));

    const seen1 = await waitPrompt(page, pregB[1]?.prompt || '');
    check('B15) navegador: la pregunta siguiente vuelve a mostrarse completa', seen1, seen1 ? '' : 'timeout 36s');
    const probe1 = () => page.evaluate((np) => {
      const n = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9ñáéíóúü]/g, '');
      const t = n(np);
      const els = Array.from(document.querySelectorAll('p'));
      const el = els.find((e) => n(e.innerText).includes(t));
      return el ? el.hasAttribute('data-chaos-hidden') : null;
    }, pregB[1]?.prompt || '').catch(() => null);
    const fresh1 = await probe1();
    check('B16) navegador: el enunciado de la pregunta siguiente NO está oculto al mostrarse',
      fresh1 === false, `hidden=${fresh1}`);
    let hidden1At = -1;
    const tb1 = Date.now();
    while (Date.now() - tb1 < 9000) {
      if ((await probe1()) === true) { hidden1At = Date.now() - tb1; break; }
      await sleep(250);
    }
    check('B17) navegador: el enunciado se oculta de nuevo a los ~5 s (timer reiniciado)',
      hidden1At >= 0 && hidden1At <= 8500, `hidden1At=${hidden1At}ms`);
    check('B18) navegador sin pageerrors', errors.length === 0, errors.slice(0, 2).join(' | '));
    if (fail.some((f) => f.startsWith('B'))) {
      await page.screenshot({ path: path.join(os.tmpdir(), 'tqfail_b.png') }).catch(() => {});
    }
    await ctxB.close();
    ctxB = null;
  } catch (e) {
    check('B: navegador sin excepción', false, String(e).slice(0, 200));
    if (ctxB) await ctxB.close().catch(() => {});
  } finally {
    await browserB.close();
  }

  // ---------- SECCIÓN C) 'memoria' (ocultado a los 5 s, sin ventana de respuesta) ----------
  const C = rooms.find((r) => r.key === 'C');
  if (!C?.id) throw new Error('sin sala memoria');
  await api(s2.cookie, '/api/salas', { action: 'join', code: C.code });
  const stC = await api(s1.cookie, '/api/caos', { action: 'start', room_id: C.id });
  const mC = matchRow(C.id);
  check('C0) start y match.modifiers=["memoria"] (modo abismos)',
    stC.status === 200 && !!mC && JSON.stringify(mC.modifiers) === '["memoria"]' && mC.mode === 'abismos',
    mC ? `mods=${JSON.stringify(mC.modifiers)} mode=${mC.mode} qc=${mC.question_count}` : `start=${stC.status}`);
  const gpC = await api(s1.cookie, `/api/partida?room_id=${C.id}`);
  const pregC = gpC.j?.preguntas || [];
  const clocksC = mC ? clockRows(mC.id, s1.uid) : [];
  check('C1) GET con modificadores y SIN filas de reloj (memoria no usa el reloj del servidor)',
    JSON.stringify(gpC.j?.partida?.modificadores) === '["memoria"]' &&
    pregC.length >= 4 && clocksC.length === 0,
    `mods=${JSON.stringify(gpC.j?.partida?.modificadores)} n=${pregC.length} clocks=[${clocksC.join(',')}]`);

  const cc0 = await claim(s1.cookie, C.id, pregC[0].id);
  check('C2) claim → claimed:false (sin ventana de respuesta)',
    cc0.status === 200 && cc0.j?.claimed === false, `status=${cc0.status} j=${JSON.stringify(cc0.j)}`);

  await sleep(7000);
  const cr0 = await answer(s1.cookie, C.id, pregC[0]);
  check('C3) respuesta a los 7 s (> 5 s): se ACEPTA +20, timed_out=false (memoria NO limita el tiempo)',
    cr0.status === 200 && cr0.j?.correct === true && cr0.j?.points_delta === 20 && cr0.j?.timed_out === false,
    `delta=${cr0.j?.points_delta} to=${cr0.j?.timed_out}`);

  // C4-C9) navegador: ocultado a los 5 s + click en tarjeta oculta aceptado
  const browserC = await puppeteer.launch({
    executablePath: EXEC, headless: true,
    args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  let ctxC = null;
  try {
    const opened = await openGame(browserC, s2.cookie, PATHS[C.game], C.id);
    ctxC = opened.ctx;
    const page = opened.page;
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

    const seen = await waitPrompt(page, pregC[0]?.prompt || '');
    check('C4) navegador: enunciado visible al inicio', seen, seen ? '' : 'timeout 36s');

    const countHidden = () => page.evaluate(() => document.querySelectorAll('[data-chaos-hidden]').length).catch(() => -1);
    const early = await countHidden();
    check('C5) navegador: nada oculto antes de los 5 s', early === 0, `hidden=${early}`);

    let hiddenAt = -1;
    const tc0 = Date.now();
    while (Date.now() - tc0 < 9000) {
      const n = await countHidden();
      if (n >= 2) { hiddenAt = Date.now() - tc0; break; }
      await sleep(250);
    }
    check('C6) navegador: a los ~5 s el enunciado y las OPCIONES quedan [data-chaos-hidden]',
      hiddenAt >= 3500 && hiddenAt <= 7500, `hiddenAt=${hiddenAt}ms`);

    const vis = await page.evaluate(() => {
      const el = document.querySelector('[data-chaos-hidden]');
      const opts = document.querySelector('[data-chaos-options]');
      return {
        pOpacity: el ? getComputedStyle(el).opacity : null,
        oOpacity: opts ? getComputedStyle(opts).opacity : null,
        text: (document.body.innerText || '').replace(/\s+/g, ' '),
      };
    }).catch(() => ({ pOpacity: null, oOpacity: null, text: '' }));
    check('C7) navegador: opacity 0 pero el texto sigue en el DOM',
      vis.pOpacity === '0' && vis.oOpacity === '0' && norm(vis.text).includes(norm(pregC[0]?.prompt || 'zzz')),
      `p=${vis.pOpacity} o=${vis.oOpacity}`);

    // Sin interacción: memoria NO genera fila automática en la BD.
    await sleep(2500);
    const detIdle = answerDetail(mC.id, s2.uid);
    check('C8) BD navegador s2: sin fila automática (no hay auto-timeout en memoria)',
      detIdle.length === 0, detIdle.join(','));

    // Click en la tarjeta B (oculta): la respuesta se acepta (opacity no deshabilita).
    const clicked = await page.evaluate(() => {
      const opts = document.querySelector('[data-chaos-options]');
      const btn = opts ? opts.querySelectorAll('button')[1] : null;
      if (!btn) return false;
      btn.click();
      return true;
    }).catch(() => false);
    check('C8b) click en tarjeta oculta dispatch', clicked, `clicked=${clicked}`);
    const detC2 = await waitAnswerRow(mC.id, s2.uid, 30);
    check('C9) BD navegador s2: respuesta a los ~7 s ACEPTADA (timed_out=false)',
      detC2[0] === '0:false:true:20' || detC2[0] === '0:false:false:0' || (detC2[0] || '').startsWith('0:false:'),
      detC2.join(','));
    check('C10) navegador sin pageerrors', errors.length === 0, errors.slice(0, 2).join(' | '));
    if (fail.some((f) => f.startsWith('C'))) {
      await page.screenshot({ path: path.join(os.tmpdir(), 'tqfail_c.png') }).catch(() => {});
    }
    await ctxC.close();
    ctxC = null;
  } catch (e) {
    check('C: navegador sin excepción', false, String(e).slice(0, 200));
    if (ctxC) await ctxC.close().catch(() => {});
  } finally {
    await browserC.close();
  }

  // ---------- SECCIÓN D) 'tiempo_compartido' (presupuesto global de 240 s) ----------
  const D = rooms.find((r) => r.key === 'D');
  if (!D?.id) throw new Error('sin sala tiempo_compartido');
  await api(s2.cookie, '/api/salas', { action: 'join', code: D.code });
  const stD = await api(s1.cookie, '/api/caos', { action: 'start', room_id: D.id });
  const mD = matchRow(D.id);
  check('D0) start y match.modifiers=["tiempo_compartido"]',
    stD.status === 200 && !!mD && JSON.stringify(mD.modifiers) === '["tiempo_compartido"]',
    mD ? `mods=${JSON.stringify(mD.modifiers)}` : `start=${stD.status}`);

  const gpD = await api(s1.cookie, `/api/partida?room_id=${D.id}`);
  const pregD = gpD.j?.preguntas || [];
  const restarD = gpD.j?.partida?.tiempo?.restar_ms;
  check('D1) GET /api/partida con partida.tiempo.restar_ms ∈ [150,240] s',
    typeof restarD === 'number' && restarD >= 150000 && restarD <= 240000 && pregD.length >= 4,
    `restar_ms=${restarD} n=${pregD.length}`);

  const crD = await answer(s1.cookie, D.id, pregD[0]);
  check('D2) respuesta dentro del presupuesto: aceptada +10, timed_out=false',
    crD.status === 200 && crD.j?.points_delta === 10 && crD.j?.timed_out === false,
    `status=${crD.status} delta=${crD.j?.points_delta} to=${crD.j?.timed_out}`);

  // D3-D9) navegador: timer visible, decreciente, auto-fin del servidor y desaparición
  const browserD = await puppeteer.launch({
    executablePath: EXEC, headless: true,
    args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  let ctxD = null;
  try {
    const opened = await openGame(browserD, s2.cookie, PATHS[D.game], D.id);
    ctxD = opened.ctx;
    const page = opened.page;
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

    const readTimer = () => page.evaluate(() => {
      const el = document.querySelector('[data-chaos-global-timer]');
      if (!el) return null;
      const m = /(\d+):(\d{2})/.exec(el.textContent || '');
      return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    }).catch(() => null);

    let t1 = null;
    const td0 = Date.now();
    while (Date.now() - td0 < 25000) {
      t1 = await readTimer();
      if (typeof t1 === 'number') break;
      await sleep(400);
    }
    check('D3) navegador: [data-chaos-global-timer] visible con mm:ss ∈ [150,240] s',
      typeof t1 === 'number' && t1 >= 150 && t1 <= 240, `t1=${t1}`);

    await sleep(2500);
    const t2 = await readTimer();
    check('D4) navegador: el presupuesto global DECRECE entre muestras',
      typeof t1 === 'number' && typeof t2 === 'number' && t2 < t1 && t1 - t2 >= 1,
      `t1=${t1} t2=${t2}`);

    // Backdate 241 s → la lectura de sala dispara expireTimedSharedRoom (autoridad servidor).
    psql(`UPDATE matches SET started_at = now() - interval '241 seconds' WHERE id='${mD.id}';`);
    const salaD = await api(s1.cookie, `/api/salas?id=${D.id}&join=0`);
    check('D5) servidor: backdate 241 s + lectura GET /api/salas → sala.status="finished"',
      salaD.status === 200 && salaD.j?.sala?.status === 'finished',
      `status=${salaD.status} sala=${salaD.j?.sala?.status}`);

    const mD2 = (psql(`SELECT status || '|' || coalesce(finished_at::text, '') FROM matches WHERE room_id='${D.id}' ORDER BY created_at DESC LIMIT 1;`) || '').trim();
    check('D6) BD: match finalizado (status=finished, finished_at no nulo)',
      mD2.startsWith('finished|') && mD2.length > 'finished|'.length, mD2);

    const resD = await api(s1.cookie, `/api/partida/resultados?room_id=${D.id}`);
    check('D7) GET /api/partida/resultados 200 tras el auto-fin',
      resD.status === 200 && !!resD.j?.partida, `status=${resD.status}`);

    let gone = false;
    const tg0 = Date.now();
    while (Date.now() - tg0 < 15000) {
      if ((await readTimer()) == null) { gone = true; break; }
      await sleep(400);
    }
    check('D8) navegador: timer desaparece tras la finalización del servidor', gone, `gone=${gone}`);
    check('D9) navegador sin pageerrors', errors.length === 0, errors.slice(0, 2).join(' | '));
    if (fail.some((f) => f.startsWith('D'))) {
      await page.screenshot({ path: path.join(os.tmpdir(), 'tqfail_d.png') }).catch(() => {});
    }
    await ctxD.close();
    ctxD = null;
  } catch (e) {
    check('D: navegador sin excepción', false, String(e).slice(0, 200));
    if (ctxD) await ctxD.close().catch(() => {});
  } finally {
    await browserD.close();
  }

  // ---------- SECCIÓN E) 'pregunta_sorpresa' (efecto determinista por pregunta) ----------
  const E = rooms.find((r) => r.key === 'E');
  if (!E?.id) throw new Error('sin sala pregunta_sorpresa');
  await api(s2.cookie, '/api/salas', { action: 'join', code: E.code });
  const stE = await api(s1.cookie, '/api/caos', { action: 'start', room_id: E.id });
  const mE = matchRow(E.id);
  check('E0) start y match.modifiers=["pregunta_sorpresa"]',
    stE.status === 200 && !!mE && JSON.stringify(mE.modifiers) === '["pregunta_sorpresa"]',
    mE ? `mods=${JSON.stringify(mE.modifiers)} qc=${mE.question_count}` : `start=${stE.status}`);
  if (!mE) throw new Error('sin match sorpresa');

  const gpE1 = await api(s1.cookie, `/api/partida?room_id=${E.id}`);
  const pregE1 = gpE1.j?.preguntas || [];
  check('E1) GET: ≥5 preguntas TODAS con el campo sorpresa presente',
    pregE1.length >= 5 && pregE1.every((q) => Object.prototype.hasOwnProperty.call(q, 'sorpresa')),
    `n=${pregE1.length}`);
  const effE = pregE1.map((q) => (q.sorpresa === undefined ? '__AUSENTE__' : q.sorpresa));
  check('E1b) efectos ∈ pool ∪ {null}',
    effE.every((e) => e === null || SORPRESA_POOL_E.includes(e)),
    effE.map((e) => (e === null ? 'null' : e)).join(','));
  const nonNullE = effE.filter((e) => e !== null && e !== '__AUSENTE__');
  check('E1c) ≥1 pregunta con efecto no-normal', nonNullE.length >= 1, `n=${nonNullE.length}`);
  check('E1d) ≥2 efectos distintos (distribución no degenerada)',
    new Set(effE).size >= 2, `k=${new Set(effE).size}`);

  const sigOf = (qs) => [...qs].sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((q) => `${q.id}=${q.sorpresa === undefined ? '?' : q.sorpresa}`).join('|');
  const gpE2 = await api(s1.cookie, `/api/partida?room_id=${E.id}`);
  const gpE3 = await api(s2.cookie, `/api/partida?room_id=${E.id}`);
  const pregE3 = gpE3.j?.preguntas || [];
  check('E2a) efectos idénticos en dos GET consecutivos (mismo jugador)',
    sigOf(pregE1) === sigOf(gpE2.j?.preguntas || []), `n=${pregE1.length}`);
  check('E2b) efectos idénticos para el2º jugador',
    pregE3.length === pregE1.length && sigOf(pregE1) === sigOf(pregE3), `n=${pregE3.length}`);

  const badE = pregE1.filter((q) => (q.sorpresa === undefined ? null : q.sorpresa) !== surpriseExpect(mE.id, q.id));
  check('E3) cada efecto = sha256(matchId:questionId) mod5 (misma fórmula recomputada aquí)',
    badE.length === 0,
    badE.slice(0, 2).map((q) => `${q.id}:${q.sorpresa}!=${surpriseExpect(mE.id, q.id)}`).join(','));

  const mE4 = matchRow(E.id);
  check('E4) BD: matches.modifiers intacto tras los GET',
    !!mE4 && JSON.stringify(mE4.modifiers) === '["pregunta_sorpresa"]', JSON.stringify(mE4?.modifiers));

  const gpN2 = await api(s1.cookie, `/api/partida?room_id=${N.id}`);
  const pregN2 = gpN2.j?.preguntas || [];
  check('E5) sala sin el modificador: preguntas SIN campo sorpresa',
    pregN2.length >= 4 && pregN2.every((q) => !Object.prototype.hasOwnProperty.call(q, 'sorpresa')) &&
    JSON.stringify(gpN2.j?.partida?.modificadores) === '["doble_puntos"]',
    `n=${pregN2.length} mods=${JSON.stringify(gpN2.j?.partida?.modificadores)}`);

  // E6) Reutiliza los efectos existentes: preguntas con efecto 'respuestas_mezcladas'
  // usan el MISMO algoritmo sha256; el resto conserva su orden natural. Si la tirada
  // de E no incluye mezcladas (raro), se crea una2ª sala F →2ª tirada independiente.
  let mezMatchId = mE.id;
  let mezRoom = E;
  let mezPreg = pregE1;
  let hasMez = mezPreg.some((q) => q.sorpresa === 'respuestas_mezcladas');
  if (!hasMez) {
    const crF = await api(s1.cookie, '/api/caos', { action: 'create', difficulty: 'medio' });
    check('E6f) fallback: sala F creada para una2ª tirada', crF.status === 201 && !!crF.j?.sala?.id, `status=${crF.status}`);
    if (crF.status === 201 && crF.j?.sala?.id) {
      const F = { key: 'F', game: 'lava', mods: ['pregunta_sorpresa'], id: crF.j.sala.id, code: crF.j.sala.code };
      rooms.push(F);
      psql(`UPDATE chaos_rooms SET game_code='lava', modifiers='${JSON.stringify(F.mods)}'::jsonb WHERE room_id='${F.id}';`);
      psql(`UPDATE rooms SET game_mode_id=(SELECT id FROM game_modes WHERE code='lava') WHERE id='${F.id}';`);
      await sleep(350);
      const gf = await waitGeneration(s1, F.id);
      check('E6f2) generación de la sala F ready', gf === 'ready', gf);
      if (gf === 'ready') {
        await api(s2.cookie, '/api/salas', { action: 'join', code: F.code });
        const stF = await api(s1.cookie, '/api/caos', { action: 'start', room_id: F.id });
        const mF = matchRow(F.id);
        const gpF1 = await api(s1.cookie, `/api/partida?room_id=${F.id}`);
        const pregF = gpF1.j?.preguntas || [];
        const gpF2 = await api(s1.cookie, `/api/partida?room_id=${F.id}`);
        if (stF.status === 200 && mF && pregF.length && sigOf(pregF) === sigOf(gpF2.j?.preguntas || [])) {
          mezMatchId = mF.id;
          mezRoom = F;
          mezPreg = pregF;
          hasMez = mezPreg.some((q) => q.sorpresa === 'respuestas_mezcladas');
        }
      }
    }
  }
  check('E6b0) ≥1 pregunta con efecto respuestas_mezcladas (sala E o fallback F)',
    hasMez, `room=${mezRoom.key} n=${mezPreg.length}`);

  const idsList = mezPreg.map((q) => `'${q.id}'`).join(',');
  const natMap = new Map();
  if (idsList) {
    const natOut = psql(
      `SELECT q.id || '=' || string_agg(o.id::text, ',' ORDER BY o.sort_order ASC, o.id ASC) ` +
      `FROM questions q JOIN question_options o ON o.question_id = q.id ` +
      `WHERE q.id IN (${idsList}) GROUP BY q.id;`
    );
    for (const raw of natOut.split('\n')) {
      const line = raw.trim(); // psql en Windows: finales \r\n
      const i = line.indexOf('=');
      if (i > 0) natMap.set(line.slice(0, i).trim(), line.slice(i + 1).split(',').map((s) => s.trim()));
    }
  }
  const naturalBad = mezPreg.filter((q) => q.sorpresa !== 'respuestas_mezcladas' &&
    JSON.stringify((q.options || []).map((o) => o.id)) !== JSON.stringify(natMap.get(q.id) || []));
  check('E6a) preguntas SIN efecto mezcladas conservan el orden natural (sort_order,id)',
    natMap.size === mezPreg.length && naturalBad.length === 0,
    `nat=${natMap.size}/${mezPreg.length} bad=${naturalBad.length}`);

  const mezList = mezPreg.filter((q) => q.sorpresa === 'respuestas_mezcladas');
  const mezBad = mezList.filter((q) => {
    const ids = (q.options || []).map((o) => o.id);
    const sorted = [...ids].sort((a, b) => {
      const ka = sha(`${mezMatchId}:${q.id}:${a}`);
      const kb = sha(`${mezMatchId}:${q.id}:${b}`);
      return ka !== kb ? (ka < kb ? -1 : 1) : a < b ? -1 : 1;
    });
    return JSON.stringify(ids) !== JSON.stringify(sorted);
  });
  check('E6b) preguntas con efecto mezcladas: orden = sha256(match:question:option)',
    mezBad.length === 0, `k=${mezList.length} bad=${mezBad.length}`);

  const gpMez2 = await api(s2.cookie, `/api/partida?room_id=${mezRoom.id}`);
  const pregMez2 = gpMez2.j?.preguntas || [];
  const ordSig = (qs) => [...qs].sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((q) => `${q.id}:${(q.options || []).map((o) => o.id).join(',')}`).join('|');
  check('E6c) orden de opciones idéntico para ambos jugadores',
    mezPreg.length === pregMez2.length && ordSig(mezPreg) === ordSig(pregMez2),
    `n=${mezPreg.length}/${pregMez2.length}`);

  // E7) navegador (lava): comportamiento según el efecto DETERMINISTA de q0
  const browserE = await puppeteer.launch({
    executablePath: EXEC, headless: true,
    args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  let ctxE = null;
  try {
    const e0 = pregE1[0]?.sorpresa === undefined ? null : pregE1[0]?.sorpresa;
    const openedE = await openGame(browserE, s1.cookie, PATHS[E.game], E.id);
    ctxE = openedE.ctx;
    const page = openedE.page;
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

    const seenE = await waitPrompt(page, pregE1[0]?.prompt || '');
    check(`E7a) navegador: prompt0 visible (efecto=${e0 ?? 'null'})`, seenE, seenE ? '' : 'timeout 36s');

    const countHiddenE = () => page.evaluate(() => document.querySelectorAll('[data-chaos-hidden]').length).catch(() => -1);
    const hidesE = e0 === 'pregunta_fugaz' || e0 === 'memoria';
    if (hidesE) {
      let hidE = -1;
      const te0 = Date.now();
      while (Date.now() - te0 < 9000) {
        if ((await countHiddenE()) >= 1) { hidE = Date.now() - te0; break; }
        await sleep(250);
      }
      check(`E7b) navegador: enunciado [data-chaos-hidden] a los ~5 s (efecto=${e0})`,
        hidE >= 2500 && hidE <= 8000, `hiddenAt=${hidE}ms`);
      await sleep(500);
      const optsE = await page.evaluate(() => {
        const c = document.querySelector('[data-chaos-options]');
        if (!c) return { present: false };
        return { present: true, hidden: c.hasAttribute('data-chaos-hidden'), opacity: getComputedStyle(c).opacity };
      }).catch(() => ({ present: false }));
      if (e0 === 'memoria') {
        check('E7c) navegador: memoria → las opciones quedan OCULTAS', optsE.present && (optsE.hidden || optsE.opacity === '0'), JSON.stringify(optsE));
      } else {
        check('E7c) navegador: pregunta_fugaz → las opciones SIGUEN VISIBLES',
          optsE.present && !optsE.hidden && optsE.opacity !== '0', JSON.stringify(optsE));
      }
    } else {
      await sleep(6500);
      const nE = await countHiddenE();
      check(`E7b) navegador: sin ocultado a los 6.5 s (efecto=${e0 ?? 'null'})`, nE === 0, `n=${nE}`);
    }

    const bodyHasE = (txt) => page.evaluate((t) => (document.body.innerText || '').includes(t), txt).catch(() => false);
    const numLabelsE = (await bodyHasE('[1]')) && (await bodyHasE('[2]'));
    check('E7d) navegador: etiquetas [1]/[2] SOLO con efecto opciones_numeradas',
      (e0 === 'opciones_numeradas') === numLabelsE, `e0=${e0 ?? 'null'} num=${numLabelsE}`);

    let cdE = null;
    for (let i = 0; i < 6 && cdE == null; i++) { cdE = await readCountdown(page); if (cdE == null) await sleep(250); }
    check('E7e) navegador: SIN contador (sorpresa no abre ventana de respuesta)', cdE == null, `cd=${cdE}`);
    check('E7f) navegador sin pageerrors', errors.length === 0, errors.slice(0, 2).join(' | '));
    if (fail.some((f) => f.startsWith('E7'))) {
      await page.screenshot({ path: path.join(os.tmpdir(), 'tqfail_e.png') }).catch(() => {});
    }
    await ctxE.close();
    ctxE = null;
  } catch (e) {
    check('E: navegador sin excepción', false, String(e).slice(0, 200));
    if (ctxE) await ctxE.close().catch(() => {});
  } finally {
    await browserE.close();
  }

  // E8) spoof: campos que el cliente NO debe controlar
  const spoofE = await api(s2.cookie, '/api/partida', {
    action: 'answer', room_id: E.id, question_id: pregE1[0].id,
    option_id: pregE1[0].correct_option_id, response_time_ms: 500,
    timed_out: false, sorpresa: 'respuestas_mezcladas', modifiers: ['doble_puntos'], points_delta: 999,
  });
  check('E8a) spoof (sorpresa/modifiers/points_delta en el POST) IGNORADO: +15 autoritativo',
    spoofE.status === 200 && spoofE.j?.correct === true && spoofE.j?.points_delta === 15,
    `status=${spoofE.status} delta=${spoofE.j?.points_delta}`);
  const mE8 = matchRow(E.id);
  check('E8b) BD: matches.modifiers intacto tras el spoof',
    !!mE8 && JSON.stringify(mE8.modifiers) === '["pregunta_sorpresa"]', JSON.stringify(mE8?.modifiers));
  const pE8 = mE8 ? participantRow(mE8.id, s2.uid) : null;
  check('E8c) BD: score del participante = 15 (sin doble_puntos)',
    !!pE8 && pE8.score === 15, `score=${pE8?.score}`);

  // E9) sorpresa NO abre ventana de respuesta en el servidor
  const cE9 = await claim(s1.cookie, E.id, pregE1[0].id);
  const clocksE9a = mE ? clockRows(mE.id, s1.uid) : ['x'];
  const clocksE9b = mE ? clockRows(mE.id, s2.uid) : ['x'];
  check('E9) claim → claimed:false y SIN filas de reloj (sorpresa no es ventana)',
    cE9.status === 200 && cE9.j?.claimed === false && clocksE9a.length === 0 && clocksE9b.length === 0,
    `status=${cE9.status} claimed=${cE9.j?.claimed} clocks=[${[...clocksE9a, ...clocksE9b].join(',')}]`);

  if (fail.some((f) => f.startsWith('E'))) {
    console.log('INFO - fallos sección E: ' + fail.filter((f) => f.startsWith('E')).join(' | '));
  }

  // ---------- SECCIÓN F) interacciones obligatorias (Grupo 2 × existentes) ----------
  const FCOMBOS = [
    { key: 'F01', game: 'decisiones', mods: ['contrarreloj', 'ritmo_expres'] },
    { key: 'F02', game: 'decisiones', mods: ['contrarreloj', 'doble_puntos'] },
    { key: 'F03', game: 'decisiones', mods: ['contrarreloj', 'barajado'] },
    { key: 'F04', game: 'decisiones', mods: ['pregunta_fugaz', 'respuestas_mezcladas'] },
    { key: 'F05', game: 'lava', mods: ['pregunta_fugaz', 'opciones_numeradas'] },
    { key: 'F06', game: 'decisiones', mods: ['memoria', 'respuestas_mezcladas'] },
    { key: 'F07', game: 'decisiones', mods: ['memoria', 'opciones_numeradas'] },
    { key: 'F08', game: 'decisiones', mods: ['pregunta_sorpresa', 'barajado'] },
    { key: 'F09', game: 'decisiones', mods: ['pregunta_sorpresa', 'respuestas_mezcladas'] },
    { key: 'F10', game: 'decisiones', mods: ['tiempo_compartido', 'barajado'] },
    { key: 'F11', game: 'decisiones', mods: ['tiempo_compartido', 'doble_puntos'] },
    { key: 'F12', game: 'decisiones', mods: ['contrarreloj', 'pregunta_fugaz', 'memoria', 'tiempo_compartido', 'pregunta_sorpresa'] },
  ];
  for (const fc of FCOMBOS) {
    const cr = await api(s1.cookie, '/api/caos', { action: 'create', difficulty: 'facil' });
    if (cr.status === 201 && cr.j?.sala?.id) {
      fc.id = cr.j.sala.id;
      fc.code = cr.j.sala.code;
      psql(`UPDATE chaos_rooms SET game_code='${fc.game}', modifiers='${JSON.stringify(fc.mods)}'::jsonb WHERE room_id='${fc.id}';`);
      psql(`UPDATE rooms SET game_mode_id=(SELECT id FROM game_modes WHERE code='${fc.game}') WHERE id='${fc.id}';`);
      rooms.push({ key: fc.key, game: fc.game, mods: fc.mods, id: fc.id, code: fc.code });
      await sleep(300);
    } else {
      check(`F0) create ${fc.key}`, false, `status=${cr.status} err=${cr.j?.error}`);
    }
  }
  const fCreated = FCOMBOS.filter((r) => r.id);
  check('F0a) 12 salas de interacción creadas', fCreated.length === 12, `n=${fCreated.length}`);

  let fPend = fCreated.map((r) => r.id);
  const fFailIds = [];
  for (let round = 0; round < 240 && fPend.length > 0; round++) {
    const doneIds = [];
    for (const id of fPend) {
      const st = await api(s1.cookie, '/api/caos', { action: 'status', room_id: id });
      const g = st.j?.caos?.generation_status ?? '';
      if (g === 'ready') doneIds.push(id);
      else if (g === 'failed') { doneIds.push(id); fFailIds.push(id); }
    }
    fPend = fPend.filter((id) => !doneIds.includes(id));
    if (fPend.length > 0) await sleep(3000);
  }
  check('F0b) las 12 generaciones terminan ready (poll paralelo)',
    fPend.length === 0 && fFailIds.length === 0, `pend=${fPend.length} fail=${fFailIds.length}`);

  const baseOrderF = (courseId, limit) => {
    const out = psql(
      `SELECT id FROM questions WHERE course_id='${courseId}' AND status='active' AND deleted_at IS NULL ` +
      `ORDER BY sort_order ASC, created_at ASC, id ASC LIMIT ${Number(limit) || 1};`
    );
    return out ? out.split('\n').map((s) => s.trim()).filter(Boolean) : [];
  };
  const barajoF = (baseIds, matchId) => [...baseIds].sort((a, b) => {
    const ka = sha(`${matchId}:${a}`), kb = sha(`${matchId}:${b}`);
    return ka !== kb ? (ka < kb ? -1 : 1) : a < b ? -1 : 1;
  });
  const mezOptsF = (matchId, q) => {
    const ids = (q.options || []).map((o) => o.id);
    return [...ids].sort((a, b) => {
      const ka = sha(`${matchId}:${q.id}:${a}`), kb = sha(`${matchId}:${q.id}:${b}`);
      return ka !== kb ? (ka < kb ? -1 : 1) : a < b ? -1 : 1;
    });
  };
  const bodyHasF = (page, txt) =>
    page.evaluate((t) => (document.body.innerText || '').includes(t), txt).catch(() => false);
  const sorpresaBadF = (m, preg) =>
    preg.filter((q) => q.sorpresa === undefined || q.sorpresa !== surpriseExpect(m.id, q.id));

  const fSetup = async (fc) => {
    await api(s2.cookie, '/api/salas', { action: 'join', code: fc.code });
    const st = await api(s1.cookie, '/api/caos', { action: 'start', room_id: fc.id });
    const m = matchRow(fc.id);
    check(`${fc.key}a) start + match.modifiers exacto`, st.status === 200 && !!m &&
      JSON.stringify(m.modifiers) === JSON.stringify(fc.mods),
      m ? `mods=${JSON.stringify(m.modifiers)}` : `start=${st.status}`);
    const gp = await api(s1.cookie, `/api/partida?room_id=${fc.id}`);
    return { st, m, gp, preg: gp.j?.preguntas || [] };
  };
  const noRoom = (key, m, n) => check(`${key}) sin match/preguntas`, false, `m=${!!m} n=${n}`);

  // F01) contrarreloj + ritmo_expres (ritmo es solo visual; la ventana manda)
  const F01 = FCOMBOS.find((r) => r.key === 'F01');
  if (F01?.id) {
    const { m, preg } = await fSetup(F01);
    if (m && preg.length) {
      const anchor1 = clockRows(m.id, s1.uid);
      const c1 = await claim(s1.cookie, F01.id, preg[0].id);
      check('F01b) contrarreloj+ritmo_expres: ancla -1 en GET y claim → claimed:true',
        anchor1.some((x) => x.startsWith('-1:')) && c1.status === 200 && c1.j?.claimed === true,
        `clocks=[${anchor1.join(',')}] claimed=${c1.j?.claimed}`);
    } else noRoom('F01b', m, preg.length);
  }

  // F02) contrarreloj + doble_puntos (x2 en acierto; el fallo por timeout NO duplica)
  const F02 = FCOMBOS.find((r) => r.key === 'F02');
  if (F02?.id) {
    const { m, preg } = await fSetup(F02);
    if (m && preg.length >= 2) {
      await claim(s1.cookie, F02.id, preg[0].id);
      const r0f2 = await answer(s1.cookie, F02.id, preg[0]);
      check('F02b) contrarreloj+doble_puntos: acierto en ventana → +20 (x2)',
        r0f2.status === 200 && r0f2.j?.correct === true && r0f2.j?.points_delta === 20 && r0f2.j?.timed_out === false,
        `delta=${r0f2.j?.points_delta} to=${r0f2.j?.timed_out}`);
      await claim(s1.cookie, F02.id, preg[1].id);
      await sleep(12000);
      const r1f2 = await answer(s1.cookie, F02.id, preg[1], { timed_out: false });
      check('F02c) a los 12 s el servidor fuerza timeout -5 (fallo NO duplicado)',
        r1f2.status === 200 && r1f2.j?.correct === false && r1f2.j?.points_delta === -5 && r1f2.j?.timed_out === true,
        `delta=${r1f2.j?.points_delta} to=${r1f2.j?.timed_out}`);
    } else noRoom('F02b', m, preg.length);
  }

  // F03) contrarreloj + barajado (orden barajado + ventana operativa)
  const F03 = FCOMBOS.find((r) => r.key === 'F03');
  if (F03?.id) {
    const { m, preg } = await fSetup(F03);
    if (m && preg.length) {
      const exp3 = barajoF(baseOrderF(m.course_id, m.question_count), m.id);
      check('F03b) contrarreloj+barajado: orden servido = sha256(match:question)',
        JSON.stringify(preg.map((q) => q.id)) === JSON.stringify(exp3),
        `n=${preg.length}/${exp3.length}`);
      const anchor3 = clockRows(m.id, s1.uid);
      const c3 = await claim(s1.cookie, F03.id, preg[0].id);
      check('F03c) ancla -1 + claim operativos sobre preguntas barajadas',
        anchor3.some((x) => x.startsWith('-1:')) && c3.status === 200 && c3.j?.claimed === true,
        `clocks=[${anchor3.join(',')}] claimed=${c3.j?.claimed}`);
    } else noRoom('F03b', m, preg.length);
  }

  // F04) pregunta_fugaz + respuestas_mezcladas (sin ventana + opciones barajadas)
  const F04 = FCOMBOS.find((r) => r.key === 'F04');
  if (F04?.id) {
    const { m, preg } = await fSetup(F04);
    if (m && preg.length) {
      const c4 = await claim(s1.cookie, F04.id, preg[0].id);
      check('F04b) fugaz+mezcladas: claim → claimed:false',
        c4.status === 200 && c4.j?.claimed === false, `claimed=${c4.j?.claimed}`);
      const bad4 = preg.filter((q) =>
        JSON.stringify((q.options || []).map((o) => o.id)) !== JSON.stringify(mezOptsF(m.id, q)));
      check('F04c) TODAS las opciones en orden sha256 (mezcladas activo con fugaz)',
        bad4.length === 0, `bad=${bad4.length}/${preg.length}`);
      const r4f4 = await answer(s1.cookie, F04.id, preg[0]);
      check('F04d) acierto rápido → +10 (fugaz no altera el scoring)',
        r4f4.status === 200 && r4f4.j?.correct === true && r4f4.j?.points_delta === 10,
        `delta=${r4f4.j?.points_delta}`);
    } else noRoom('F04b', m, preg.length);
  }

  // F05) pregunta_fugaz + opciones_numeradas (lava; navegador con s2)
  const F05 = FCOMBOS.find((r) => r.key === 'F05');
  if (F05?.id) {
    const { m, preg } = await fSetup(F05);
    if (m && preg.length >= 2) {
      const c5 = await claim(s1.cookie, F05.id, preg[0].id);
      check('F05b) fugaz+numeradas: claim → claimed:false',
        c5.status === 200 && c5.j?.claimed === false, `claimed=${c5.j?.claimed}`);
      await sleep(6500);
      const r5 = await answer(s1.cookie, F05.id, preg[0]);
      check('F05c) acierto a los 6.5 s: SE ACEPTA +15 (fugaz sin timeout con numeradas)',
        r5.status === 200 && r5.j?.correct === true && r5.j?.points_delta === 15 && r5.j?.timed_out === false,
        `delta=${r5.j?.points_delta} to=${r5.j?.timed_out}`);

      const browserF = await puppeteer.launch({
        executablePath: EXEC, headless: true,
        args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
      });
      let ctxF = null;
      try {
        const openedF = await openGame(browserF, s2.cookie, PATHS[F05.game], F05.id);
        ctxF = openedF.ctx;
        const page = openedF.page;
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

        const seenF = await waitPrompt(page, preg[0]?.prompt || '');
        check('F05d) navegador: prompt0 visible', seenF, seenF ? '' : 'timeout 36s');

        let hiddenAt = -1;
        const tf0 = Date.now();
        while (Date.now() - tf0 < 9000) {
          const n = await page.evaluate(() => document.querySelectorAll('[data-chaos-hidden]').length).catch(() => -1);
          if (n >= 1) { hiddenAt = Date.now() - tf0; break; }
          await sleep(250);
        }
        check('F05e) navegador: enunciado [data-chaos-hidden] a los ~5 s (fugaz activo)',
          hiddenAt >= 2500 && hiddenAt <= 8000, `hiddenAt=${hiddenAt}ms`);

        const optsF = await page.evaluate(() => {
          const c = document.querySelector('[data-chaos-options]');
          if (!c) return { present: false };
          return { present: true, hidden: c.hasAttribute('data-chaos-hidden'), opacity: getComputedStyle(c).opacity };
        }).catch(() => ({ present: false }));
        const lbl1 = await bodyHasF(page, '[1]');
        const lbl2 = await bodyHasF(page, '[2]');
        check('F05f) navegador: opciones visibles CON etiquetas [1]/[2] (numeradas activo)',
          optsF.present && !optsF.hidden && optsF.opacity !== '0' && lbl1 && lbl2,
          `${JSON.stringify(optsF)} lbl1=${lbl1} lbl2=${lbl2}`);

        let cdF = null;
        for (let i = 0; i < 6 && cdF == null; i++) { cdF = await readCountdown(page); if (cdF == null) await sleep(250); }
        check('F05g) navegador: SIN contador de ventana', cdF == null, `cd=${cdF}`);
        check('F05h) navegador sin pageerrors', errors.length === 0, errors.slice(0, 2).join(' | '));
        if (fail.some((f) => f.startsWith('F'))) {
          await page.screenshot({ path: path.join(os.tmpdir(), 'tqfail_f.png') }).catch(() => {});
        }
        await ctxF.close();
        ctxF = null;
      } catch (e) {
        check('F: navegador sin excepción', false, String(e).slice(0, 200));
        if (ctxF) await ctxF.close().catch(() => {});
      } finally {
        await browserF.close();
      }
    } else noRoom('F05b', m, preg.length);
  }

  // F06) memoria + respuestas_mezcladas (sin ventana + opciones barajadas)
  const F06 = FCOMBOS.find((r) => r.key === 'F06');
  if (F06?.id) {
    const { m, preg } = await fSetup(F06);
    if (m && preg.length) {
      const c6 = await claim(s1.cookie, F06.id, preg[0].id);
      check('F06b) memoria+mezcladas: claim → claimed:false',
        c6.status === 200 && c6.j?.claimed === false, `claimed=${c6.j?.claimed}`);
      const bad6 = preg.filter((q) =>
        JSON.stringify((q.options || []).map((o) => o.id)) !== JSON.stringify(mezOptsF(m.id, q)));
      check('F06c) TODAS las opciones en orden sha256 (mezcladas activo con memoria)',
        bad6.length === 0, `bad=${bad6.length}/${preg.length}`);
      const r6 = await answer(s1.cookie, F06.id, preg[0]);
      check('F06d) acierto → +10 (memoria no es límite de tiempo)',
        r6.status === 200 && r6.j?.correct === true && r6.j?.points_delta === 10,
        `delta=${r6.j?.points_delta}`);
    } else noRoom('F06b', m, preg.length);
  }

  // F07) memoria + opciones_numeradas (respuesta tras los 5 s aceptada)
  const F07 = FCOMBOS.find((r) => r.key === 'F07');
  if (F07?.id) {
    const { m, preg } = await fSetup(F07);
    if (m && preg.length) {
      const c7 = await claim(s1.cookie, F07.id, preg[0].id);
      check('F07b) memoria+numeradas: claim → claimed:false',
        c7.status === 200 && c7.j?.claimed === false, `claimed=${c7.j?.claimed}`);
      await sleep(6500);
      const r7 = await answer(s1.cookie, F07.id, preg[0]);
      check('F07c) acierto a los 6.5 s: SE ACEPTA +10 (memoria sin timeout con numeradas)',
        r7.status === 200 && r7.j?.correct === true && r7.j?.points_delta === 10 && r7.j?.timed_out === false,
        `delta=${r7.j?.points_delta} to=${r7.j?.timed_out}`);
    } else noRoom('F07b', m, preg.length);
  }

  // F08) pregunta_sorpresa + barajado (ambos efectos deterministas a la vez)
  const F08 = FCOMBOS.find((r) => r.key === 'F08');
  if (F08?.id) {
    const { m, preg } = await fSetup(F08);
    if (m && preg.length) {
      const exp8 = barajoF(baseOrderF(m.course_id, m.question_count), m.id);
      check('F08b) sorpresa+barajado: orden de preguntas = sha256(match:question)',
        JSON.stringify(preg.map((q) => q.id)) === JSON.stringify(exp8),
        `n=${preg.length}/${exp8.length}`);
      const bad8 = sorpresaBadF(m, preg);
      check('F08c) efectos sorpresa recomputados por pregunta (sha256 mod 5)',
        bad8.length === 0, `bad=${bad8.length}/${preg.length}`);
    } else noRoom('F08b', m, preg.length);
  }

  // F09) pregunta_sorpresa + respuestas_mezcladas (baseOn global prevalece)
  const F09 = FCOMBOS.find((r) => r.key === 'F09');
  if (F09?.id) {
    const { m, preg } = await fSetup(F09);
    if (m && preg.length) {
      const bad9 = preg.filter((q) =>
        JSON.stringify((q.options || []).map((o) => o.id)) !== JSON.stringify(mezOptsF(m.id, q)));
      check('F09b) sorpresa+mezcladas: TODAS las opciones en orden sha (baseOn prevalece)',
        bad9.length === 0, `bad=${bad9.length}/${preg.length}`);
      const badS9 = sorpresaBadF(m, preg);
      check('F09c) efectos sorpresa recomputados por pregunta',
        badS9.length === 0, `bad=${badS9.length}/${preg.length}`);
      const c9 = await claim(s1.cookie, F09.id, preg[0].id);
      check('F09d) claim → claimed:false (sorpresa+mezcladas sin ventana)',
        c9.status === 200 && c9.j?.claimed === false, `claimed=${c9.j?.claimed}`);
    } else noRoom('F09b', m, preg.length);
  }

  // F10) tiempo_compartido + barajado (presupuesto global + preguntas barajadas)
  const F10 = FCOMBOS.find((r) => r.key === 'F10');
  if (F10?.id) {
    const { m, gp, preg } = await fSetup(F10);
    const restar10 = gp.j?.partida?.tiempo?.restar_ms;
    check('F10b) tiempo+barajado: restar_ms ∈ [150,240] s',
      typeof restar10 === 'number' && restar10 >= 150000 && restar10 <= 240000,
      `restar_ms=${restar10}`);
    if (m && preg.length) {
      const exp10 = barajoF(baseOrderF(m.course_id, m.question_count), m.id);
      check('F10c) orden de preguntas = sha256 (barajado activo con tiempo)',
        JSON.stringify(preg.map((q) => q.id)) === JSON.stringify(exp10),
        `n=${preg.length}/${exp10.length}`);
    } else noRoom('F10c', m, preg.length);
  }

  // F11) tiempo_compartido + doble_puntos (presupuesto + scoring x2)
  const F11 = FCOMBOS.find((r) => r.key === 'F11');
  if (F11?.id) {
    const { m, gp, preg } = await fSetup(F11);
    const restar11 = gp.j?.partida?.tiempo?.restar_ms;
    check('F11b) tiempo+doble: restar_ms ∈ [150,240] s',
      typeof restar11 === 'number' && restar11 >= 150000 && restar11 <= 240000,
      `restar_ms=${restar11}`);
    if (m && preg.length) {
      const r11 = await answer(s1.cookie, F11.id, preg[0]);
      check('F11c) acierto → +20 (doble activo con el presupuesto global)',
        r11.status === 200 && r11.j?.correct === true && r11.j?.points_delta === 20 && r11.j?.timed_out === false,
        `delta=${r11.j?.points_delta} to=${r11.j?.timed_out}`);
    } else noRoom('F11c', m, preg.length);
  }

  // F12) los 5 nuevos a la vez (contrarreloj gana la ventana; resto coexiste)
  const F12 = FCOMBOS.find((r) => r.key === 'F12');
  if (F12?.id) {
    const { m, gp, preg } = await fSetup(F12);
    if (m && preg.length >= 2) {
      const anchor12 = clockRows(m.id, s1.uid);
      const c12 = await claim(s1.cookie, F12.id, preg[0].id);
      check('F12b) los5: ancla -1 + claim → claimed:true (contrarreloj gana la ventana)',
        anchor12.some((x) => x.startsWith('-1:')) && c12.status === 200 && c12.j?.claimed === true,
        `clocks=[${anchor12.join(',')}] claimed=${c12.j?.claimed}`);
      const bad12 = sorpresaBadF(m, preg);
      check('F12c) los5: efectos sorpresa recomputados por pregunta',
        bad12.length === 0, `bad=${bad12.length}/${preg.length}`);
      const restar12 = gp.j?.partida?.tiempo?.restar_ms;
      check('F12d) los5: restar_ms ∈ [150,240] s',
        typeof restar12 === 'number' && restar12 >= 150000 && restar12 <= 240000,
        `restar_ms=${restar12}`);
      const r12 = await answer(s1.cookie, F12.id, preg[0]);
      check('F12e) los5: acierto en ventana → +10 (scoring intacto, sin doble)',
        r12.status === 200 && r12.j?.correct === true && r12.j?.points_delta === 10 && r12.j?.timed_out === false,
        `delta=${r12.j?.points_delta} to=${r12.j?.timed_out}`);
    } else noRoom('F12b', m, preg.length);
  }

  if (fail.some((f) => f.startsWith('F'))) {
    console.log('INFO - fallos sección F: ' + fail.filter((f) => f.startsWith('F')).join(' | '));
  }
  } catch (suiteErr) {
    suiteError = suiteErr;
    check('suite sin excepci\u00f3n', false, String(suiteErr).slice(0, 300));
  }

  // ---------- limpieza best-effort ----------
  try {
    const ids = rooms.filter((r) => r.id).map((r) => `'${r.id}'`);
    const allRooms = ids.join(',');
    const courseIds = ids.length ? psql(`SELECT string_agg(quote_literal(course_id::text), ',') FROM rooms WHERE id IN (${ids.join(',')});`) : '';
    psql(
      `DO $$ DECLARE u record; BEGIN ` +
      (allRooms ? `DELETE FROM participant_answers WHERE participant_id IN (SELECT id FROM match_participants WHERE match_id IN (SELECT id FROM matches WHERE room_id IN (${allRooms}))); ` : '') +
      (allRooms ? `DELETE FROM match_participants WHERE match_id IN (SELECT id FROM matches WHERE room_id IN (${allRooms})); ` : '') +
      (allRooms ? `DELETE FROM matches WHERE room_id IN (${allRooms}); ` : '') +
      (allRooms ? `DELETE FROM room_participants WHERE room_id IN (${allRooms}); ` : '') +
      (ids.length ? `DELETE FROM chaos_rooms WHERE room_id IN (${ids.join(',')}); ` : '') +
      (allRooms ? `DELETE FROM rooms WHERE id IN (${allRooms}); ` : '') +
      (courseIds ? `DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE course_id IN (${courseIds})); ` : '') +
      (courseIds ? `DELETE FROM questions WHERE course_id IN (${courseIds}); ` : '') +
      (courseIds ? `DELETE FROM courses WHERE id IN (${courseIds}); ` : '') +
      `FOR u IN SELECT id FROM users WHERE email IN ('tq1_${stamp}@gmail.com','tq2_${stamp}@gmail.com') LOOP ` +
      `DELETE FROM user_sessions WHERE user_id=u.id; DELETE FROM player_league_progress WHERE user_id=u.id; ` +
      `DELETE FROM league_transactions WHERE user_id=u.id; DELETE FROM achievement_progress WHERE user_id=u.id; ` +
      `DELETE FROM course_enrollments WHERE student_id=u.id; DELETE FROM room_participants WHERE user_id=u.id; ` +
      `DELETE FROM match_participants WHERE user_id=u.id; DELETE FROM practice_plays WHERE user_id=u.id; ` +
      `DELETE FROM audit_events WHERE actor_id=u.id; DELETE FROM solo_plays WHERE user_id=u.id; ` +
      `DELETE FROM users WHERE id=u.id; END LOOP; END $$;`
    );
    console.log('INFO - limpieza ejecutada');
  } catch (e) {
    console.log('INFO - limpieza omitida: ' + String(e).slice(0, 200));
  }

  const resUsers = Number(psql(`SELECT count(*) FROM users WHERE email LIKE '%_${stamp}@gmail.com';`) || '0');
  const resCaos = Number(psql(`SELECT count(*) FROM chaos_rooms;`) || '0');
  const resRoomsModo = Number(psql(`SELECT count(*) FROM rooms WHERE name='Modo Caos';`) || '0');
  const resClocks = Number(psql(`SELECT count(*) FROM participant_question_clocks;`) || '0');
  check('residuo: usuarios tq* del test = 0', resUsers === 0, `n=${resUsers}`);
  check('residuo: chaos_rooms global = 0', resCaos === 0, `n=${resCaos}`);
  check('residuo: salas "Modo Caos" = 0', resRoomsModo === 0, `n=${resRoomsModo}`);
  check('residuo: participant_question_clocks global = 0', resClocks === 0, `n=${resClocks}`);

  console.log(`\nVERIFY_CAOS_TIME_QUESTIONS: ${fail.length === 0 ? 'PASS' : 'FAIL'} (${ok.length}/${ok.length + fail.length})`);
  if (fail.length) { console.log('FAILED:'); fail.forEach((f) => console.log('  - ' + f)); }
  process.exit(fail.length === 0 ? 0 : 1);
}
main().catch((e) => { console.error('ERROR', e); process.exit(1); });
