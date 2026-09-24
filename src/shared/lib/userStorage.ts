'use client';

import type { StoredUser } from '@/shared/types/practice';

const USER_KEY = 'eduplay_user';

export function getCurrentUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getUserId(): number | null {
  const user = getCurrentUser();
  return user?.id_usuario ?? null;
}

export function isRegisteredUser(): boolean {
  const user = getCurrentUser();
  return user !== null && user.modo === 'registrado';
}

/**
 * Returns a localStorage key scoped to the current user.
 * Falls back to a global key if no user is logged in.
 *
 * Example: userKey('eduplay_stars') => 'eduplay_stars_u42' (if userId=42)
 *          userKey('eduplay_stars') => 'eduplay_stars'     (if guest)
 */
export function userKey(base: string): string {
  const userId = getUserId();
  if (userId === null) return base;
  return `${base}_u${userId}`;
}

/**
 * Read JSON from a user-scoped localStorage key.
 */
export function readUserJson<T>(base: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(userKey(base));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write JSON to a user-scoped localStorage key.
 */
export function writeUserJson<T>(base: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(userKey(base), JSON.stringify(value));
  } catch { /* quota exceeded — ignore */ }
}

/**
 * Remove a user-scoped localStorage key.
 */
export function removeUserKey(base: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(userKey(base));
  } catch { /* ignore */ }
}
