// Genera las sentencias INSERT de achievements para db/seed.sql
// a partir de src/shared/lib/achievements-data.ts (fuente única del front).
const fs = require('fs');
const path = require('path');

const root = 'C:/Users/dessl/OneDrive/Desktop/EDUPLAY unified/learning-platform';
const src = fs.readFileSync(path.join(root, 'src/shared/lib/achievements-data.ts'), 'utf8');

const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']*)',\s*description:\s*'([^']*)',\s*mode:\s*'([^']*)',\s*icon:\s*'([^']*)',\s*difficulty:\s*'([^']*)',\s*goal:\s*(\d+),\s*statKey:\s*'([^']+)'\s*\}/g;

const esc = (s) => s.replace(/'/g, "''");
const rows = [];
let m;
let count = 0;
while ((m = re.exec(src)) !== null) {
  const [, id, name, desc, mode, icon, difficulty, goal, statKey] = m;
  rows.push(
    `  ('${esc(id)}', '${esc(name)}', '${esc(desc)}', '${esc(mode)}', '${esc(difficulty)}', '${esc(icon)}', ${goal}, '${esc(statKey)}')`
  );
  count++;
}
if (count !== 150) {
  console.error(`ERROR: se esperaban 150 logros, se extrajeron ${count}`);
  process.exit(1);
}
const sql =
  'INSERT INTO achievements (code, name, description, game_mode_id, difficulty, icon, goal, stat_key)\n' +
  'SELECT v.code, v.name, v.description, gm.id, v.difficulty::achievement_difficulty, v.icon, v.goal, v.stat_key\n' +
  'FROM (VALUES\n' +
  rows.join(',\n') +
  "\n) AS v(code, name, description, mode, difficulty, icon, goal, stat_key)\n" +
  'JOIN game_modes gm ON gm.code = v.mode\n' +
  'ON CONFLICT (code) DO NOTHING;\n';
fs.writeFileSync(path.join(root, 'db/seed_achievements.sql'), sql, 'utf8');
console.log(`OK: ${count} logros escritos en db/seed_achievements.sql`);
