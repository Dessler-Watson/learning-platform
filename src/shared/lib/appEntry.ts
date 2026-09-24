const APP_SESSION_KEY = 'eduplay_app_session';

/**
 * Marca que la app navegó intencionalmente a una zona protegida
 * (login, registro, botón de rol con sesión vigente, etc.).
 */
export function grantAppEntry(): void {
  try {
    sessionStorage.setItem(APP_SESSION_KEY, '1');
  } catch {}
}

/** Limpia la marca de sesión de la app (al cerrar sesión). */
export function clearAppEntry(): void {
  try {
    sessionStorage.removeItem(APP_SESSION_KEY);
  } catch {}
}

export function hasAppEntry(): boolean {
  try {
    return sessionStorage.getItem(APP_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Detecta si el documento fue cargado "en frío" por el usuario
 * (nueva pestaña, URL escrita a mano, restauración de sesión, enlace externo)
 * y no por una navegación interna de la propia app.
 */
export function isColdAppEntry(): boolean {
  if (typeof window === 'undefined') return false;
  const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const nav = entries[0];
  // Recargas y back/forward del propio usuario dentro de la app se permiten
  if (nav && nav.type !== 'navigate') return false;
  // Navegación iniciada desde otra página del mismo origen (login, registro, etc.)
  if (document.referrer && document.referrer.startsWith(window.location.origin)) return false;
  return true;
}

/**
 * Las páginas protegidas (/inicio, /panel/*) deben rebotar a la pantalla
 * de bienvenida ("/") cuando el usuario llega en frío sin haber pasado
 * antes por la app en esta pestaña.
 */
export function shouldBounceToWelcome(): boolean {
  if (hasAppEntry()) return false;
  return isColdAppEntry();
}
