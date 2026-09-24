/**
 * Seeds demo panel users (admin + teachers) with hashed passwords.
 * Idempotent: skips emails that already exist.
 * Run: node scripts/seed_demo_users.mjs
 */
import { createHash, randomBytes, scrypt as scryptCb } from 'crypto';
import { promisify } from 'util';
import pg from 'pg';

const scrypt = promisify(scryptCb);
const N = 16384, R = 8, P = 1, KEYLEN = 64, MAXMEM = 64 * 1024 * 1024;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

const USERS = [
  { role: 'admin', nombre: 'Roberto', apellido: 'Admin', email: 'roberto.admin@gmail.com', password: 'admin123', institution: 'Universidad Nacional' },
  { role: 'admin', nombre: 'María', apellido: 'Directora', email: 'maria.directora@gmail.com', password: 'admin123', institution: 'Instituto Tecnológico' },
  { role: 'teacher', nombre: 'Ana', apellido: 'García', email: 'ana.garcia@gmail.com', password: 'demo123', institution: 'Universidad Nacional' },
  { role: 'teacher', nombre: 'Carlos', apellido: 'López', email: 'carlos.lopez@gmail.com', password: 'demo123', institution: 'Instituto Tecnológico' },
  { role: 'teacher', nombre: 'María', apellido: 'Fernández', email: 'maria.fernandez@gmail.com', password: 'demo123', institution: 'Colegio San José' },
  { role: 'teacher', nombre: 'Juan', apellido: 'Martínez', email: 'juan.martinez@gmail.com', password: 'demo123', institution: 'Colegio San José' },
  { role: 'teacher', nombre: 'Laura', apellido: 'Rodríguez', email: 'laura.rodriguez@gmail.com', password: 'demo123', institution: 'Universidad Central' },
  { role: 'teacher', nombre: 'Pedro', apellido: 'Sánchez', email: 'pedro.sanchez@gmail.com', password: 'demo123', institution: 'Instituto Norte' },
  { role: 'teacher', nombre: 'Sofía', apellido: 'Moreno', email: 'sofia.moreno@gmail.com', password: 'demo123', institution: 'Universidad Nacional' },
  { role: 'teacher', nombre: 'Diego', apellido: 'Herrera', email: 'diego.herrera@gmail.com', password: 'demo123', institution: 'Instituto Tecnológico' },
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL no definido. Exporta la variable o usa .env.local.');
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  let created = 0;
  let skipped = 0;

  for (const u of USERS) {
    const existing = await client.query(
      `SELECT id FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL`,
      [u.email]
    );
    if (existing.rows.length > 0) {
      skipped++;
      continue;
    }

    const roleRow = await client.query(`SELECT id FROM roles WHERE code = $1`, [u.role]);
    if (roleRow.rows.length === 0) {
      console.error(`Role missing: ${u.role}`);
      continue;
    }

    let instId = null;
    if (u.institution) {
      let inst = await client.query(
        `SELECT id FROM institutions WHERE lower(name) = lower($1) AND deleted_at IS NULL`,
        [u.institution]
      );
      if (inst.rows.length === 0) {
        inst = await client.query(
          `INSERT INTO institutions (name) VALUES ($1) RETURNING id`,
          [u.institution]
        );
      }
      instId = inst.rows[0].id;
    }

    const passwordHash = await hashPassword(u.password);
    await client.query(
      `INSERT INTO users (role_id, institution_id, nombre, apellido, email, password_hash, is_guest, status)
       VALUES ($1, $2, $3, $4, lower($5), $6, false, 'active')`,
      [roleRow.rows[0].id, instId, u.nombre, u.apellido, u.email, passwordHash]
    );
    created++;
    console.log(`+ ${u.role}: ${u.email}`);
  }

  console.log(`Done. created=${created} skipped=${skipped}`);
} finally {
  await client.end();
}
