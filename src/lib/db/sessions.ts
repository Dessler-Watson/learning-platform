import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { query, queryOne } from './client';

export const SESSION_COOKIE = 'eduplay_session';
/**
 * Cookie de vínculo invitado→cuenta: contiene el token de sesión del invitado
 * vigente en el momento de registrarse/iniciar sesión. /api/auth/migrate la
 * exige para demostrar la propiedad del guest_id (previene IDOR de fusión).
 */
export const GUEST_MERGE_COOKIE = 'eduplay_guest_merge';
const SESSION_TTL_DAYS = 30;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function constantTimeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export interface SessionUser {
  id: string;
  role: 'student' | 'teacher' | 'admin';
  email: string | null;
  nombre: string;
  apellido: string | null;
  is_guest: boolean;
  avatar_id: string | null;
  custom_avatar: string | null;
  status: string;
}

export async function createSession(userId: string, userAgent?: string | null, ip?: string | null): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO user_sessions (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4::inet, $5)`,
    [userId, hashToken(token), userAgent ?? null, ip ?? null, expiresAt.toISOString()]
  );
  return token;
}

export async function revokeSession(token: string): Promise<void> {
  await query(
    `UPDATE user_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashToken(token)]
  );
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await query(
    `UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

function isHttpsRequest(req?: Request): boolean {
  if (!req) return false;
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (proto) return proto === 'https';
  try {
    return new URL(req.url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function readCookie(req: Request | undefined, name: string): string | null {
  const cookieHeader = req?.headers.get('cookie');
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const [key, ...rest] = part.trim().split('=');
      if (key === name) {
        const value = rest.join('=');
        if (value) return decodeURIComponent(value);
      }
    }
  }
  return null;
}

function secureAttr(req?: Request): string {
  if (process.env.NODE_ENV === 'production') return '; Secure';
  return isHttpsRequest(req) ? '; Secure' : '';
}

export function setGuestMergeCookie(guestToken: string, req?: Request): string {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  return `${GUEST_MERGE_COOKIE}=${encodeURIComponent(guestToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureAttr(req)}`;
}

export function clearGuestMergeCookie(req?: Request): string {
  return `${GUEST_MERGE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureAttr(req)}`;
}

export async function getUserBySessionToken(token: string): Promise<SessionUser | null> {
  if (!token) return null;
  const row = await queryOne<SessionUser & { expires_at: Date; revoked_at: Date | null }>(
    `SELECT u.id, r.code AS role, u.email, u.nombre, u.apellido, u.is_guest,
            u.avatar_id, u.custom_avatar, u.status,
            s.expires_at, s.revoked_at
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL AND u.status = 'active'
     JOIN roles r ON r.id = u.role_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()`,
    [hashToken(token)]
  );
  if (!row) return null;
  await query(`UPDATE user_sessions SET last_seen_at = now() WHERE token_hash = $1`, [hashToken(token)]);
  return {
    id: row.id,
    role: row.role as SessionUser['role'],
    email: row.email,
    nombre: row.nombre,
    apellido: row.apellido,
    is_guest: row.is_guest,
    avatar_id: row.avatar_id,
    custom_avatar: row.custom_avatar,
    status: row.status,
  };
}

export function getSessionTokenFromRequest(req?: Request): string | null {
  const fromHeader = readCookie(req, SESSION_COOKIE);
  if (fromHeader) return fromHeader;
  // Next.js cookies() for server actions / route handlers without explicit req
  try {
    const store = cookies();
    return store.get(SESSION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;
  return getUserBySessionToken(token);
}

export function setSessionCookie(token: string, req?: Request): string {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureAttr(req)}`;
}

export function clearSessionCookie(req?: Request): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureAttr(req)}`;
}
