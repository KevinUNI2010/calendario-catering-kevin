import { UserSession } from '../types';

export const PIN_INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
export const PIN_TOKEN_REFRESH_INTERVAL_MS = 60 * 60 * 1000; // Renovar firma en servidor cada 1 hora de actividad
export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 10 * 60 * 1000; // 10 minutos

export const PIN_SESSION_KEY = 'calendario_session';
export const PIN_ACTIVITY_KEY = 'calendario_pin_last_activity';
export const PIN_GUARD_KEY = 'calendario_pin_guard';

const ALLOWED_PIN_ROLES = new Set(['viewer', 'dueño', 'cocinero', 'mozo']);

interface StoredSignedSession {
  token: string;
}

export interface PinGuardState {
  failedAttempts: number;
  lockoutUntil: number;
}

function decodeBase64UrlJson(segment: string): any | null {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Extrae el payload estructural de un token firmado sin confiar ciegamente en él
 * para autenticación online (usado para chequear formato/caducidad y soporte offline).
 */
export function parseSignedTokenPayload(token: string): (UserSession & { lastActive: number; exp: number }) | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1] || parts[1].length < 32) return null;

  const parsed = decodeBase64UrlJson(parts[0]);
  if (!parsed || typeof parsed !== 'object' || !ALLOWED_PIN_ROLES.has(parsed.role)) {
    return null;
  }

  const lastActive = Number(parsed.lastActive);
  const exp = Number(parsed.exp);
  if (!Number.isFinite(lastActive) || !Number.isFinite(exp)) {
    return null;
  }

  return {
    id: String(parsed.id || ''),
    name: String(parsed.name || ''),
    role: parsed.role,
    allowedLocales: Array.isArray(parsed.allowedLocales) ? parsed.allowedLocales.map(String) : [],
    lastActive,
    exp,
    sessionToken: token,
  };
}

export function getStoredSignedToken(): string | null {
  try {
    const raw = localStorage.getItem(PIN_SESSION_KEY);
    if (!raw) return null;
    const parsed: Partial<StoredSignedSession> = JSON.parse(raw);
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token.includes('.')) {
      // Rechazar cualquier sesión antigua sin firma o manipulada en localStorage
      localStorage.removeItem(PIN_SESSION_KEY);
      return null;
    }
    return parsed.token;
  } catch {
    localStorage.removeItem(PIN_SESSION_KEY);
    return null;
  }
}

export function saveSignedPinSession(token: string, now = Date.now()): void {
  try {
    localStorage.setItem(PIN_SESSION_KEY, JSON.stringify({ token }));
    localStorage.setItem(PIN_ACTIVITY_KEY, String(now));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearPinSession(): void {
  try {
    localStorage.removeItem(PIN_SESSION_KEY);
    localStorage.removeItem(PIN_ACTIVITY_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function touchLocalActivity(now = Date.now()): void {
  try {
    localStorage.setItem(PIN_ACTIVITY_KEY, String(now));
  } catch {
    // Ignore storage errors
  }
}

export function getLastLocalActivity(): number | null {
  try {
    const raw = localStorage.getItem(PIN_ACTIVITY_KEY);
    if (!raw) return null;
    const val = Number(raw);
    return Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

export function isLocalInactivityExpired(tokenPayload?: { lastActive: number; exp: number } | null, now = Date.now()): boolean {
  const localLast = getLastLocalActivity();
  if (localLast !== null && now - localLast > PIN_INACTIVITY_MS) {
    return true;
  }
  if (tokenPayload) {
    if (now > tokenPayload.exp || now - tokenPayload.lastActive > PIN_INACTIVITY_MS) {
      return true;
    }
  }
  return false;
}

export interface VerifySessionResult {
  valid: boolean;
  session?: UserSession;
  token?: string;
  offlineFallback?: boolean;
  reason?: 'missing' | 'invalid_signature' | 'inactivity_expired' | 'network_blocked';
}

/**
 * Valida la sesión PIN contra el servidor (/api/pin-auth) verificando firma HMAC y ventana de 30 días.
 * Si el dispositivo está realmente sin internet, permite continuidad offline si el token estructural no expiró.
 */
export async function verifyStoredPinSession(): Promise<VerifySessionResult> {
  const token = getStoredSignedToken();
  if (!token) {
    clearPinSession();
    return { valid: false, reason: 'missing' };
  }

  const localPayload = parseSignedTokenPayload(token);
  if (!localPayload) {
    clearPinSession();
    return { valid: false, reason: 'invalid_signature' };
  }

  if (isLocalInactivityExpired(localPayload)) {
    clearPinSession();
    return { valid: false, reason: 'inactivity_expired' };
  }

  try {
    const res = await fetch('/api/pin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.valid && data?.token && data?.session) {
        saveSignedPinSession(data.token);
        return {
          valid: true,
          token: data.token,
          session: {
            ...data.session,
            sessionToken: data.token,
          },
        };
      }
    }

    if (res.status === 401 || res.status === 403) {
      const errData = await res.json().catch(() => ({}));
      clearPinSession();
      return {
        valid: false,
        reason: errData?.reason === 'inactivity_expired' ? 'inactivity_expired' : 'invalid_signature',
      };
    }

    // Si el servidor devolvió 5xx o similar estando en línea, fallar cerrado por seguridad
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      return { valid: false, reason: 'network_blocked' };
    }
  } catch {
    // Error de red: permitir caché offline únicamente si realmente no hay conexión
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        valid: true,
        token,
        session: localPayload,
        offlineFallback: true,
      };
    }
    return { valid: false, reason: 'network_blocked' };
  }

  return { valid: false, reason: 'network_blocked' };
}

// ==========================================
// GUARDIA PERSISTENTE ANTI-FUERZA BRUTA (5 INTENTOS)
// ==========================================

export function readPinGuardState(now = Date.now()): PinGuardState {
  try {
    const raw = localStorage.getItem(PIN_GUARD_KEY);
    if (!raw) return { failedAttempts: 0, lockoutUntil: 0 };
    const parsed = JSON.parse(raw);
    const failedAttempts = Math.max(0, Math.min(PIN_MAX_ATTEMPTS, Number(parsed?.failedAttempts) || 0));
    const lockoutUntil = Number(parsed?.lockoutUntil) || 0;

    if (lockoutUntil > 0 && lockoutUntil <= now) {
      const clean = { failedAttempts: 0, lockoutUntil: 0 };
      localStorage.setItem(PIN_GUARD_KEY, JSON.stringify(clean));
      return clean;
    }

    return { failedAttempts, lockoutUntil };
  } catch {
    return { failedAttempts: 0, lockoutUntil: 0 };
  }
}

export function applyServerLockout(lockoutSeconds: number, now = Date.now()): PinGuardState {
  const safeSeconds = Math.max(1, Number(lockoutSeconds) || 0);
  const next: PinGuardState = {
    failedAttempts: 0,
    lockoutUntil: now + safeSeconds * 1000,
  };
  try {
    localStorage.setItem(PIN_GUARD_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function recordPinFailureLocally(now = Date.now()): { state: PinGuardState; lockedNow: boolean; lockoutSeconds: number } {
  const current = readPinGuardState(now);
  if (current.lockoutUntil > now) {
    return {
      state: current,
      lockedNow: true,
      lockoutSeconds: Math.ceil((current.lockoutUntil - now) / 1000),
    };
  }

  const nextFailures = current.failedAttempts + 1;
  if (nextFailures >= PIN_MAX_ATTEMPTS) {
    const lockoutUntil = now + PIN_LOCKOUT_MS;
    const nextState: PinGuardState = { failedAttempts: 0, lockoutUntil };
    try {
      localStorage.setItem(PIN_GUARD_KEY, JSON.stringify(nextState));
    } catch {}
    return {
      state: nextState,
      lockedNow: true,
      lockoutSeconds: Math.ceil(PIN_LOCKOUT_MS / 1000),
    };
  }

  const nextState: PinGuardState = { failedAttempts: nextFailures, lockoutUntil: 0 };
  try {
    localStorage.setItem(PIN_GUARD_KEY, JSON.stringify(nextState));
  } catch {}
  return { state: nextState, lockedNow: false, lockoutSeconds: 0 };
}

export function clearPinGuardState(): void {
  try {
    localStorage.removeItem(PIN_GUARD_KEY);
  } catch {}
}
