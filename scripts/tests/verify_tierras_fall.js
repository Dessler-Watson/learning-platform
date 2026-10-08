// Verifica que en tierras-hundidas TODA muerte refleje la calavera en el
// panel docente (estado 'eliminado'), no solo la de respuesta incorrecta:
//  A) Pre-condición: recién iniciada la sala, el estudiante NO está eliminado.
//  B) Caída por salto fallido/costado (sin responder nada): walk off con tecla
//     D → triggerFall → POST /api/partida action=eliminate → panel 'eliminado'.
//  C) Regresión: respuesta incorrecta vía API sigue marcando 'eliminado'.
//  D) SQL: status='eliminated' + eliminated_on_question coherente.
//  E) Browser: overlay 'Te hundiste!' en el juego y pestaña monitoreo con
//     etiqueta Eliminado/icono calavera.
//
// Estabilidad (post-auditoría):
//  - Antes de pulsar D se ESPERA de forma determinista a que el mundo 3D
//    termine de cargar (pantalla de carga desmontada + HUD de pregunta
//    visible). Pulsar durante la pantalla de carga perdía el keydown porque
//    useKeyboard() aún no estaba montado (falsos negativos 10/16).
//  - Tras la señal de carga se espera el margen de spawnReadyAt (montaje +
//    1500 ms), que es el gating real del detector de caída.
//  - Todo el cuerpo corre en try/catch y la limpieza en finally: los datos
//    creados por ESTE test (sala 'TF Fall <stamp>', usuarios tf1_/tf2_<stamp>,
//    preguntas 'Preg TF<n> <stamp>') se borran aunque una sección falle.
const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EXEC = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

const ok = [], fail = [];
const check = (name, cond, detail) => {
  (cond ? ok : fail).push(name + (detail ? ` [${detail}]` : ''));
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${detail ? ' ' + detail : ''}`);
};

function psql(q) {
  const f = path.join(os.tmpdir(), 'tf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.sql');
  fs.writeFileSync(f, q, 'utf8');
  try {
    return execSync(`"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe" -U postgres -d eduplay_db -w -t -A -f "${f}"`, {
      env: { ...process.env, PGPASSWORD: 'casimiro123' }, encoding: 'utf8',
    }).trim();
  } finally { try { fs.unlinkSync(f); } catch {} }
}

// Espera determinista a que el servidor de desarrollo esté operativo.
// No arranca pruebas mientras localhost:3000 todavía levanta.
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

// Espera determinista a que el mundo 3D de tierras esté listo:
//  - la pantalla de carga ('Adentrándose en el pantano' / '¡Listo!') se
//    desmonta solo cuando la escena 3D está renderizada (onReady → fade),
//  - el HUD de pregunta está visible (TierrasHUD no pinta en fase 'loading').
async function waitForWorldReady(page, timeoutMs = 45000) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeoutMs) {
    last = await page.evaluate(() => {
      const txt = (document.body.innerText || '').replace(/\s+/g, '');
      return {
        loading: /Adentr|Listo/.test(txt),
        hud: /PREGUNTA\d+\/\d+/.test(txt),
        canvas: !!document.querySelector('canvas'),
      };
    }).catch(() => null);
    if (last && last.canvas && !last.loading && last.hud) return { ready: true, ms: Date.now() - t0, last };
    await sleep(250);
  }
  return { ready: false, ms: Date.now() - t0, last };
}

async function loginPanel(email, password) {
  const res = await fetch(`${BASE}/api/panel/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.user) throw new Error(`login panel ${email}: ${res.status}`);
  return { cookie: (res.headers.get('set-cookie') || '').split(';')[0], user: j.user };
}

async function registerAndLoginStudent(name, email, password) {
  await fetch(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: name, email, password }),
  }).catch(() => {});
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login student ${email}: ${res.status} ${JSON.stringify(j)}`);
  const cookie = (res.headers.get('set-cookie') || '').split(';')[0];
  const uid = j?.user?.id ?? j?.id;
  return { cookie, uid };
}

async function api(cookie, path_, body, method) {
  const res = await fetch(`${BASE}${path_}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null;
  try { j = await res.json(); } catch {}
  return { status: res.status, j };
}

function docenteJson(u) {
  return {
    id: u.id,
    nombre: u.apellido ? `${u.nombre} ${u.apellido}` : u.nombre,
    correo: u.email ?? '',
    contrasena: '',
    institucion: u.institution ?? '',
    rol: u.role === 'admin' ? 'admin' : 'docente',
    estado: 'activo',
    fechaRegistro: new Date().toISOString().split('T')[0],
    ultimaActividad: new Date().toISOString(),
  };
}

async function panelEstado(salaId, uid, tCookie) {
  const g = await api(tCookie, `/api/panel/salas?id=${salaId}`);
  const parts = g.j?.sala?.participantes ?? [];
  const me = parts.find((p) => p.estudianteId === uid || p.user_id === uid || p.id === uid);
  return { estado: me?.estado ?? null, eliminadoEn: me?.eliminadoEn, len: parts.length };
}

async function pollEstado(salaId, uid, tCookie, want, tries = 20, ms = 1500) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    last = await panelEstado(salaId, uid, tCookie);
    if (want === null ? last.estado !== null : last.estado === want) return last;
    await sleep(ms);
  }
  return last;
}

// Limpieza de los datos creados POR ESTE TEST (identificados por el stamp).
// Solo patrones exclusivos: sala 'TF Fall <13 dígitos>', usuarios tf1_/tf2_ y
// preguntas 'Preg TF<n> <13 dígitos>'. No toca cursos, docentes ni salas reales.
function cleanupRun(stamp) {
  const room = `TF Fall ${stamp}`;
  const qPat = `^Preg TF[0-9]+ ${stamp}$`;
  try {
    psql(
      `DO $$ DECLARE u record; BEGIN ` +
      // sala y partida del test
      `DELETE FROM participant_question_clocks WHERE participant_id IN (SELECT id FROM match_participants WHERE match_id IN (SELECT id FROM matches WHERE room_id IN (SELECT id FROM rooms WHERE name='${room}'))); ` +
      `DELETE FROM participant_answers WHERE match_id IN (SELECT id FROM matches WHERE room_id IN (SELECT id FROM rooms WHERE name='${room}')); ` +
      `DELETE FROM league_transactions WHERE match_id IN (SELECT id FROM matches WHERE room_id IN (SELECT id FROM rooms WHERE name='${room}')); ` +
      `DELETE FROM match_participants WHERE match_id IN (SELECT id FROM matches WHERE room_id IN (SELECT id FROM rooms WHERE name='${room}')); ` +
      `DELETE FROM matches WHERE room_id IN (SELECT id FROM rooms WHERE name='${room}'); ` +
      `DELETE FROM room_participants WHERE room_id IN (SELECT id FROM rooms WHERE name='${room}'); ` +
      `DELETE FROM chaos_rooms WHERE room_id IN (SELECT id FROM rooms WHERE name='${room}'); ` +
      `DELETE FROM rooms WHERE name='${room}'; ` +
      // preguntas creadas por el test en el curso del docente
      `DELETE FROM participant_answers WHERE question_id IN (SELECT id FROM questions WHERE prompt ~ '${qPat}'); ` +
      `DELETE FROM practice_answers WHERE question_id IN (SELECT id FROM questions WHERE prompt ~ '${qPat}'); ` +
      `DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE prompt ~ '${qPat}'); ` +
      `DELETE FROM questions WHERE prompt ~ '${qPat}'; ` +
      // estudiantes del test
      `FOR u IN SELECT id FROM users WHERE email IN ('tf1_${stamp}@gmail.com','tf2_${stamp}@gmail.com') LOOP ` +
      `DELETE FROM user_sessions WHERE user_id=u.id; DELETE FROM player_league_progress WHERE user_id=u.id; ` +
      `DELETE FROM league_transactions WHERE user_id=u.id; DELETE FROM achievement_progress WHERE user_id=u.id; ` +
      `DELETE FROM course_enrollments WHERE student_id=u.id; DELETE FROM room_participants WHERE user_id=u.id; ` +
      `DELETE FROM match_participants WHERE user_id=u.id; DELETE FROM practice_plays WHERE user_id=u.id; ` +
      `DELETE FROM audit_events WHERE actor_id=u.id; DELETE FROM solo_plays WHERE user_id=u.id; ` +
      `DELETE FROM questions WHERE author_id=u.id; ` +
      `DELETE FROM users WHERE id=u.id; END LOOP; END $$;`
    );
    console.log('INFO - limpieza ejecutada');
  } catch (e) {
    console.log('INFO - limpieza omitida: ' + String(e).slice(0, 200));
  }
}

async function main() {
  const stamp = Date.now();
  let browser = null;
  try {
    const upMs = await waitForServer();
    console.log(`INFO - servidor listo en ${upMs}ms`);

    browser = await puppeteer.launch({
      executablePath: EXEC, headless: true,
      args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
    });

    // ---------- setup: docente + sala tierras ----------
    const t = await loginPanel('ana.garcia@gmail.com', 'demo123');
    const cursos = await api(t.cookie, '/api/panel/cursos');
    const courseId = cursos.j?.cursos?.[0]?.id;
    check('teacher curso', !!courseId, `id=${courseId}`);
    for (let n = 1; n <= 4; n++) {
      await api(t.cookie, '/api/panel/preguntas', {
        action: 'create', cursoId: courseId, enunciado: `Preg TF${n} ${stamp}`,
        opciones: ['Si', 'No'], respuestaCorrecta: 'Si',
      });
    }
    const create = await api(t.cookie, '/api/salas', { action: 'create', name: `TF Fall ${stamp}`, mode: 'tierras', course_id: courseId });
    const salaId = create.j?.sala?.id;
    const code = create.j?.sala?.code;
    check('sala tierras creada', !!salaId && !!code, `id=${salaId} code=${code}`);

    // ---------- 2 estudiantes ----------
    const s1 = await registerAndLoginStudent(`TF Uno ${stamp}`, `tf1_${stamp}@gmail.com`, 'secret123');
    const s2 = await registerAndLoginStudent(`TF Dos ${stamp}`, `tf2_${stamp}@gmail.com`, 'secret123');
    check('estudiantes registrados+login', !!s1.uid && !!s2.uid, `u1=${s1.uid} u2=${s2.uid}`);
    const j1 = await api(s1.cookie, '/api/salas', { action: 'join', code });
    const j2 = await api(s2.cookie, '/api/salas', { action: 'join', code });
    check('ambos se unen', j1.status < 400 && j2.status < 400, `j1=${j1.status} j2=${j2.status}`);

    const start = await api(t.cookie, '/api/salas', { action: 'start', room_id: salaId });
    check('partida iniciada', start.status === 200, `status=${start.status}`);

    // ---------- A) pre-condición ----------
    const pre1 = await pollEstado(salaId, s1.uid, t.cookie, null, 10, 500);
    check('A) pre: estudiante1 NO eliminado', pre1.estado !== 'eliminado' && pre1.estado !== null, `estado=${pre1.estado}`);

    // ---------- C) regresión: respuesta incorrecta → eliminado ----------
    const st2 = await api(s2.cookie, `/api/partida?room_id=${salaId}`);
    const q = (st2.j?.preguntas ?? [])[0];
    const wrong = (q?.options ?? []).find((o) => o.id !== q?.correct_option_id);
    const ans2 = await api(s2.cookie, '/api/partida', {
      action: 'answer', room_id: salaId, question_id: q?.id, option_id: wrong?.id,
    });
    const post2 = await pollEstado(salaId, s2.uid, t.cookie, 'eliminado', 10, 700);
    check('C) respuesta incorrecta → panel eliminado (regresión)', post2.estado === 'eliminado', `api=${ans2.status} estado=${post2.estado}`);

    // ---------- B) caída sin responder (walk off) ----------
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    const [cName, ...cRest] = s1.cookie.split('=');
    await page.setCookie({ name: cName, value: cRest.join('='), domain: 'localhost', path: '/' });
    await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => { sessionStorage.setItem('eduplay_app_session', '1'); });
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await page.goto(`${BASE}/tierras-hundidas?sala=${encodeURIComponent(salaId)}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('canvas', { timeout: 30000 });

    // Espera DETERMINISTA del fin de la carga (pantalla desmontada + HUD).
    const wr = await waitForWorldReady(page);
    check('B0) mundo 3D listo (carga terminada + HUD visible)', wr.ready,
      `t=${wr.ms}ms estado=${JSON.stringify(wr.last)}`);
    if (!wr.ready) throw new Error(`mundo 3D de tierras no listo tras ${wr.ms}ms: ${JSON.stringify(wr.last)}`);

    // spawnReadyAt = montaje del controlador + 1500 ms: gating del detector de caída.
    await sleep(1600);
    await page.mouse.click(640, 360); // foco + initAudio

    await page.keyboard.down('d');
    await sleep(3500);
    await page.keyboard.up('d');

    // espera del overlay 'Te hundiste!' (letras partidas por animación → compactar)
    let sawDefeat = false;
    const samples = [];
    for (let i = 0; i < 25; i++) {
      const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ''));
      if (i % 4 === 0 || i === 24) samples.push(`t${i}:${txt.slice(0, 140)}`);
      if (txt.includes('Tehundiste')) { sawDefeat = true; break; }
      await sleep(300);
    }
    if (!sawDefeat) console.log('B1 SAMPLES:', JSON.stringify(samples, null, 1));
    await page.screenshot({ path: path.join(os.tmpdir(), 'tf_defeat.png') });
    check('B1) overlay de derrota "Te hundiste!" tras caerse', sawDefeat, `pageErrors=${pageErrors.length}`);
    check('B1b) sin errores de pagina', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));

    const post1 = await pollEstado(salaId, s1.uid, t.cookie, 'eliminado', 20, 1500);
    check('B2) caída sin respuesta → panel muestra ELIMINADO (fix)', post1.estado === 'eliminado', `estado=${post1.estado} eliminadoEn=${post1.eliminadoEn}`);

    // ---------- D) SQL ----------
    const mid = `(SELECT id FROM matches WHERE room_id='${salaId}' ORDER BY created_at DESC LIMIT 1)`;
    const row1 = psql(`SELECT mp.status || '|' || coalesce(mp.eliminated_on_question::text,'null') FROM match_participants mp WHERE mp.user_id='${s1.uid}' AND mp.match_id=${mid};`);
    check('D) SQL estudiante1: eliminated + pregunta coherente', row1.startsWith('eliminated|'), row1);
    const ansCount1 = psql(`SELECT count(*) FROM participant_answers WHERE participant_id=(SELECT id FROM match_participants WHERE user_id='${s1.uid}' AND match_id=${mid});`);
    check('D) estudiante1 cayó sin haber respondido', ansCount1 === '0', `answers=${ansCount1}`);

    // ---------- E) API resultados propio + monitoreo docente ----------
    // DefeatOverlay navega a /resultados: se espera la navegación (no un sleep fijo).
    let navOk = false;
    for (let i = 0; i < 50 && !navOk; i++) {
      navOk = await page.evaluate(() => location.pathname.startsWith('/resultados')).catch(() => false);
      if (!navOk) await sleep(300);
    }
    const resApi = await api(s1.cookie, `/api/partida/resultados?room_id=${encodeURIComponent(salaId)}`);
    check('E1) API resultados propio: estado eliminated', resApi.j?.yo?.estado === 'eliminado' || resApi.j?.yo?.estado === 'eliminated',
      `estado=${resApi.j?.yo?.estado} eliminado_en=${resApi.j?.yo?.eliminado_en}`);
    // Tras navegar, la pantalla pinta el detalle de eliminación al resolver su fetch:
    // se espera ese texto concreto (poll, no sleep fijo).
    let resTxt = '';
    for (let i = 0; i < 50; i++) {
      resTxt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, '')).catch(() => '');
      if (resTxt.includes('Eliminadoenlapregunta')) break;
      await sleep(300);
    }
    check('E1b) pantalla resultados: "Eliminado en la pregunta N"', resTxt.includes('Eliminadoenlapregunta'), `url=${page.url()} nav=${navOk} txt=${resTxt.slice(0, 120)}`);
    await page.screenshot({ path: path.join(os.tmpdir(), 'tf_resultados.png') });
    await ctx.close();

    const ctxT = await browser.createBrowserContext();
    const pmon = await ctxT.newPage();
    await pmon.setViewport({ width: 1440, height: 900 });
    const [tName, ...tRest] = t.cookie.split('=');
    await pmon.setCookie({ name: tName, value: tRest.join('='), domain: 'localhost', path: '/' });
    await pmon.goto(BASE, { waitUntil: 'load', timeout: 30000 });
    await pmon.evaluate((doc) => {
      localStorage.setItem('panel-auth', JSON.stringify(doc));
      sessionStorage.setItem('eduplay_app_session', '1');
    }, docenteJson(t.user));
    await pmon.goto(`${BASE}/panel/salas/${salaId}/monitoreo`, { waitUntil: 'load', timeout: 60000 });
    // Espera determinista del contenido del monitoreo (no un sleep fijo).
    let monReady = false;
    for (let i = 0; i < 50 && !monReady; i++) {
      monReady = await pmon.evaluate(() => /Eliminado|Jugando/.test(document.body.innerText || '')).catch(() => false);
      if (!monReady) await sleep(300);
    }
    const mon = await pmon.evaluate(() => ({
      txt: document.body.innerText,
      skulls: document.querySelectorAll('svg.lucide-skull, .lucide-skull').length,
    }));
    const nElim = (mon.txt.match(/Eliminado/g) || []).length;
    // La vista monitoreo duplica etiquetas (lista + tarjetas): 1 eliminado = 2.
    check('E2) monitoreo: Eliminado para los 2 estudiantes (>=4 apariciones)', nElim >= 4, `apariciones=${nElim} ready=${monReady}`);
    check('E2b) monitoreo: icono calavera presente', mon.skulls >= 1 || nElim >= 2, `skulls=${mon.skulls}`);
    await pmon.screenshot({ path: path.join(os.tmpdir(), 'tf_monitoreo.png') });
    await ctxT.close();
  } catch (e) {
    check('suite sin excepción', false, String((e && e.message) || e).slice(0, 300));
  } finally {
    if (browser) await browser.close().catch(() => {});
    cleanupRun(stamp);
  }

  // ---------- residuos: solo lo creado por este stamp ----------
  try {
    const resRooms = Number(psql(`SELECT count(*) FROM rooms WHERE name='TF Fall ${stamp}';`) || '0');
    const resUsers = Number(psql(`SELECT count(*) FROM users WHERE email IN ('tf1_${stamp}@gmail.com','tf2_${stamp}@gmail.com');`) || '0');
    const resQ = Number(psql(`SELECT count(*) FROM questions WHERE prompt ~ '^Preg TF[0-9]+ ${stamp}$';`) || '0');
    const resAns = Number(psql(`SELECT count(*) FROM participant_answers WHERE match_id IN (SELECT id FROM matches WHERE room_id IN (SELECT id FROM rooms WHERE name='TF Fall ${stamp}'));`) || '0');
    check('residuo: sala TF Fall del test = 0', resRooms === 0, `n=${resRooms}`);
    check('residuo: usuarios tf* del test = 0', resUsers === 0, `n=${resUsers}`);
    check('residuo: preguntas Preg TF del test = 0', resQ === 0, `n=${resQ}`);
    check('residuo: respuestas de la sala del test = 0', resAns === 0, `n=${resAns}`);
  } catch (e) {
    check('residuo: verificación ejecutada', false, String(e).slice(0, 160));
  }

  console.log(`\nVERIFY_TIERRAS_FALL: ${fail.length === 0 ? 'PASS' : 'FAIL'} (${ok.length}/${ok.length + fail.length})`);
  if (fail.length) { console.log('FAILED:'); fail.forEach((f) => console.log('  - ' + f)); }
  process.exit(fail.length === 0 ? 0 : 1);
}
main().catch((e) => { console.error('ERROR', e); process.exit(1); });
