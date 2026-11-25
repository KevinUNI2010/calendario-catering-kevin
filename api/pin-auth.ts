import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const PIN_INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos
export const PIN_LOCKOUT_MS = 10 * 60 * 1000; // 10 minutos de bloqueo tras 5 intentos fallidos
export const PIN_MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const ALLOWED_PIN_ROLES = new Set(['viewer', 'dueño', 'cocinero', 'mozo']);

export interface PinSessionPayload {
  id: string;
  name: string;
  role: 'viewer' | 'dueño' | 'cocinero' | 'mozo';
  allowedLocales: string[];
  iat: number;
  lastActive: number;
  exp: number;
}

interface IpAttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

// Estado en memoria por instancia para mitigar fuerza bruta directa al endpoint
const attemptsByIp = new Map<string, IpAttemptRecord>();
const DEV_EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningKey(): Buffer {
  const baseSecret =
    process.env.PIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GEMINI_API_KEY;

  if (!baseSecret) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error('Falta clave secreta de firma en el servidor.');
    }
    return crypto.createHash('sha256').update(`dev-pin:${DEV_EPHEMERAL_SECRET}`).digest();
  }

  // Separación de dominio criptográfico para no usar la clave cruda de terceros
  return crypto.createHash('sha256').update(`catering-kevin-pin-session-v1:${baseSecret}`).digest();
}

export function signPinSessionToken(payload: PinSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningKey())
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

export interface PinTokenVerifyResult {
  valid: boolean;
  payload?: PinSessionPayload;
  reason?: 'invalid_format' | 'invalid_signature' | 'inactivity_expired' | 'invalid_role';
}

export function verifyPinSessionToken(
  token: string,
  now = Date.now()
): PinTokenVerifyResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'invalid_format' };
  }

  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, reason: 'invalid_format' };
  }

  const [data, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSigningKey())
    .update(data)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false, reason: 'invalid_signature' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'invalid_format' };
  }

  if (!parsed || typeof parsed !== 'object' || !ALLOWED_PIN_ROLES.has(parsed.role)) {
    return { valid: false, reason: 'invalid_role' };
  }

  const lastActive = Number(parsed.lastActive);
  const exp = Number(parsed.exp);
  if (!Number.isFinite(lastActive) || !Number.isFinite(exp)) {
    return { valid: false, reason: 'invalid_format' };
  }

  if (now > exp || now - lastActive > PIN_INACTIVITY_MS) {
    return { valid: false, reason: 'inactivity_expired' };
  }

  return {
    valid: true,
    payload: {
      id: String(parsed.id || ''),
      name: String(parsed.name || ''),
      role: parsed.role,
      allowedLocales: Array.isArray(parsed.allowedLocales) ? parsed.allowedLocales.map(String) : [],
      iat: Number(parsed.iat) || now,
      lastActive,
      exp,
    },
  };
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function pruneExpiredIpRecords(now: number) {
  if (attemptsByIp.size < 2000) return;
  for (const [ip, rec] of attemptsByIp.entries()) {
    if (rec.lockedUntil <= now && now - rec.firstAttemptAt > ATTEMPT_WINDOW_MS) {
      attemptsByIp.delete(ip);
    }
  }
}

function getIpLockStatus(ip: string, now = Date.now()): { lockedOut: boolean; lockoutSeconds: number; remainingAttempts: number } {
  const rec = attemptsByIp.get(ip);
  if (!rec) {
    return { lockedOut: false, lockoutSeconds: 0, remainingAttempts: PIN_MAX_ATTEMPTS };
  }
  if (rec.lockedUntil > now) {
    return {
      lockedOut: true,
      lockoutSeconds: Math.ceil((rec.lockedUntil - now) / 1000),
      remainingAttempts: 0,
    };
  }
  if (now - rec.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    attemptsByIp.delete(ip);
    return { lockedOut: false, lockoutSeconds: 0, remainingAttempts: PIN_MAX_ATTEMPTS };
  }
  return {
    lockedOut: false,
    lockoutSeconds: 0,
    remainingAttempts: Math.max(0, PIN_MAX_ATTEMPTS - rec.count),
  };
}

function recordIpFailure(ip: string, now = Date.now()): { lockedOut: boolean; lockoutSeconds: number; remainingAttempts: number } {
  pruneExpiredIpRecords(now);
  const existing = attemptsByIp.get(ip);
  let nextCount = 1;
  let firstAttemptAt = now;

  if (existing && now - existing.firstAttemptAt <= ATTEMPT_WINDOW_MS && existing.lockedUntil <= now) {
    nextCount = existing.count + 1;
    firstAttemptAt = existing.firstAttemptAt;
  }

  if (nextCount >= PIN_MAX_ATTEMPTS) {
    const lockedUntil = now + PIN_LOCKOUT_MS;
    attemptsByIp.set(ip, { count: 0, firstAttemptAt: now, lockedUntil });
    return {
      lockedOut: true,
      lockoutSeconds: Math.ceil(PIN_LOCKOUT_MS / 1000),
      remainingAttempts: 0,
    };
  }

  attemptsByIp.set(ip, { count: nextCount, firstAttemptAt, lockedUntil: 0 });
  return {
    lockedOut: false,
    lockoutSeconds: 0,
    remainingAttempts: PIN_MAX_ATTEMPTS - nextCount,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIp = getClientIp(req);
  const now = Date.now();

  if (req.method === 'GET') {
    const status = getIpLockStatus(clientIp, now);
    return res.status(200).json(status);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const action = body?.action || 'login';

    if (action === 'verify') {
      const token = body?.token;
      const check = verifyPinSessionToken(token, now);
      if (!check.valid) {
        return res.status(401).json({
          ok: false,
          valid: false,
          reason: check.reason,
          error:
            check.reason === 'inactivity_expired'
              ? 'Tu sesión expiró tras 30 días de inactividad. Ingresa tu PIN nuevamente.'
              : 'Sesión inválida o manipulada. Ingresa tu PIN nuevamente.',
        });
      }

      // Renovar ventana de 30 días de inactividad con firma fresca
      const refreshedPayload: PinSessionPayload = {
        ...check.payload,
        lastActive: now,
        exp: now + PIN_INACTIVITY_MS,
      };
      const refreshedToken = signPinSessionToken(refreshedPayload);

      return res.status(200).json({
        ok: true,
        valid: true,
        token: refreshedToken,
        session: {
          id: refreshedPayload.id,
          name: refreshedPayload.name,
          role: refreshedPayload.role,
          allowedLocales: refreshedPayload.allowedLocales,
          lastActive: refreshedPayload.lastActive,
        },
      });
    }

    if (action === 'login') {
      const lockStatus = getIpLockStatus(clientIp, now);
      if (lockStatus.lockedOut) {
        return res.status(429).json({
          ok: false,
          lockedOut: true,
          lockoutSeconds: lockStatus.lockoutSeconds,
          remainingAttempts: 0,
          error: `Demasiados intentos fallidos. Espera ${Math.ceil(lockStatus.lockoutSeconds / 60)} minutos.`,
        });
      }

      const rawPin = typeof body?.pin === 'string' ? body.pin.trim() : '';
      if (rawPin.length < 4 || rawPin.length > 12) {
        const failure = recordIpFailure(clientIp, now);
        return res.status(failure.lockedOut ? 429 : 400).json({
          ok: false,
          ...failure,
          error: 'Formato de PIN inválido.',
        });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      const isSupabaseReady = Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http') && !supabaseUrl.includes('xyzcompany'));

      let verifiedClient: { id: string; name: string; role: string; allowed_locales?: string[] } | null = null;

      if (isSupabaseReady && supabaseUrl && supabaseKey) {
        const sb = createClient(supabaseUrl, supabaseKey);
        const { data: rpcData, error: rpcError } = await sb.rpc('verify_client_pin', { p_pin: rawPin });
        if (!rpcError && rpcData) {
          verifiedClient = rpcData;
        }
      } else if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
        // Fallback mock SOLO en desarrollo local sin Supabase
        if (rawPin === '1111') {
          verifiedClient = { id: 'mock-1', role: 'viewer', allowed_locales: ['loc-1', 'loc-2'], name: 'Pepe (Dev)' };
        } else if (rawPin === '2222') {
          verifiedClient = { id: 'mock-2', role: 'viewer', allowed_locales: ['loc-4'], name: 'José (Dev)' };
        }
      }

      if (!verifiedClient || !ALLOWED_PIN_ROLES.has(verifiedClient.role || 'dueño')) {
        const failure = recordIpFailure(clientIp, now);
        return res.status(failure.lockedOut ? 429 : 401).json({
          ok: false,
          ...failure,
          error: failure.lockedOut
            ? 'Demasiados intentos fallidos. Acceso bloqueado temporalmente por seguridad.'
            : 'PIN incorrecto.',
        });
      }

      // Éxito: limpiar intentos fallidos de esta IP y emitir token firmado
      attemptsByIp.delete(clientIp);

      const safeRole = verifiedClient.role as PinSessionPayload['role'];
      const payload: PinSessionPayload = {
        id: verifiedClient.id,
        name: verifiedClient.name,
        role: ALLOWED_PIN_ROLES.has(safeRole) ? safeRole : 'dueño',
        allowedLocales: Array.isArray(verifiedClient.allowed_locales) ? verifiedClient.allowed_locales : [],
        iat: now,
        lastActive: now,
        exp: now + PIN_INACTIVITY_MS,
      };
      const token = signPinSessionToken(payload);

      return res.status(200).json({
        ok: true,
        token,
        session: {
          id: payload.id,
          name: payload.name,
          role: payload.role,
          allowedLocales: payload.allowedLocales,
          lastActive: payload.lastActive,
        },
      });
    }

    return res.status(400).json({ error: 'Acción no válida.' });
  } catch (err: any) {
    console.error('Error en /api/pin-auth:', err);
    return res.status(500).json({ ok: false, error: 'Error interno verificando credenciales.' });
  }
}
