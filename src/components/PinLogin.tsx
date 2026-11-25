import React, { useState, useRef, useEffect } from 'react';
import { Lock, AlertCircle, ShieldAlert } from 'lucide-react';
import { UserSession } from '../types';
import {
  applyServerLockout,
  clearPinGuardState,
  PIN_MAX_ATTEMPTS,
  readPinGuardState,
  recordPinFailureLocally,
} from '../utils/pinSession';

interface PinLoginProps {
  onLogin: (session: UserSession) => void;
}

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0) {
    return `${mins}:${String(secs).padStart(2, '0')} min`;
  }
  return `${secs}s`;
}

export const PinLogin: React.FC<PinLoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialGuard = readPinGuardState();
  const [failedAttempts, setFailedAttempts] = useState(initialGuard.failedAttempts);
  const [lockoutSeconds, setLockoutSeconds] = useState(() =>
    initialGuard.lockoutUntil > Date.now()
      ? Math.ceil((initialGuard.lockoutUntil - Date.now()) / 1000)
      : 0
  );

  // Sincronizar posible bloqueo de servidor (por IP) incluso si limpiaron localStorage
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    fetch('/api/pin-auth', { method: 'GET' })
      .then((res) => (res.ok ? res.json() : null))
      .then((status) => {
        if (status?.lockedOut && status.lockoutSeconds > 0) {
          applyServerLockout(status.lockoutSeconds);
          setLockoutSeconds(status.lockoutSeconds);
          setFailedAttempts(0);
        } else if (typeof status?.remainingAttempts === 'number') {
          const serverFailures = Math.max(0, PIN_MAX_ATTEMPTS - status.remainingAttempts);
          setFailedAttempts((prev) => Math.max(prev, serverFailures));
        }
      })
      .catch(() => {});
  }, []);

  // Cuenta regresiva persistente ante bloqueo por fuerza bruta
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      const guard = readPinGuardState();
      if (guard.lockoutUntil > Date.now()) {
        setLockoutSeconds(Math.ceil((guard.lockoutUntil - Date.now()) / 1000));
      } else {
        setLockoutSeconds(0);
        setFailedAttempts(guard.failedAttempts);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const processLogin = async (currentPin: string) => {
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/pin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', pin: currentPin.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.ok && data?.token && data?.session) {
        clearPinGuardState();
        setFailedAttempts(0);
        setLockoutSeconds(0);

        import('../lib/supabase').then(({ logLoginAttempt }) => {
          logLoginAttempt({
            client_id: data.session.id,
            client_name: data.session.name,
            role: data.session.role || 'dueño',
            method: 'pin',
            status: 'success',
          });
        }).catch(() => {});

        onLogin({
          id: data.session.id,
          role: data.session.role || 'dueño',
          allowedLocales: data.session.allowedLocales || [],
          name: data.session.name,
          lastActive: data.session.lastActive,
          sessionToken: data.token,
        });
        setIsLoading(false);
        return;
      }

      // Manejo de bloqueo por fuerza bruta desde el servidor (HTTP 429) o desde el dispositivo
      if (response.status === 429 || data?.lockedOut) {
        const secs = data?.lockoutSeconds || 600;
        applyServerLockout(secs);
        setLockoutSeconds(secs);
        setFailedAttempts(0);

        import('../lib/supabase').then(({ logLoginAttempt }) => {
          logLoginAttempt({
            client_name: 'PIN Bloqueado (5 intentos)',
            role: 'invitado',
            method: 'pin',
            status: 'failed',
            failure_reason: 'Bloqueo temporal tras múltiples intentos fallidos',
          });
        }).catch(() => {});
      } else if (response.status >= 500) {
        setErrorMessage('Error temporal del servidor. Inténtalo nuevamente.');
      } else {
        // Error de PIN (401 / 400): registrar intento sin guardar el código digitado en logs
        import('../lib/supabase').then(({ logLoginAttempt }) => {
          logLoginAttempt({
            client_name: 'PIN No Reconocido',
            role: 'invitado',
            method: 'pin',
            status: 'failed',
            failure_reason: 'PIN incorrecto',
          });
        }).catch(() => {});

        const localFail = recordPinFailureLocally();
        if (localFail.lockedNow) {
          setLockoutSeconds(localFail.lockoutSeconds);
          setFailedAttempts(0);
        } else {
          const remaining =
            typeof data?.remainingAttempts === 'number'
              ? Math.min(data.remainingAttempts, PIN_MAX_ATTEMPTS - localFail.state.failedAttempts)
              : PIN_MAX_ATTEMPTS - localFail.state.failedAttempts;
          const safeFailures = PIN_MAX_ATTEMPTS - Math.max(0, remaining);
          setFailedAttempts(safeFailures);
          setErrorMessage(
            remaining <= 2
              ? `PIN incorrecto. Te quedan ${remaining} intento${remaining === 1 ? '' : 's'} antes del bloqueo.`
              : 'PIN incorrecto. Inténtalo de nuevo.'
          );
        }
      }

      setPin('');
    } catch {
      setErrorMessage(
        typeof navigator !== 'undefined' && !navigator.onLine
          ? 'Sin conexión a internet. Conéctate para validar tu PIN.'
          : 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
      );
      setPin('');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4 && lockoutSeconds <= 0) {
      processLogin(pin);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800 flex flex-col items-center">
        
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative ${
          lockoutSeconds > 0
            ? 'bg-amber-100 dark:bg-amber-900/30'
            : 'bg-blue-100 dark:bg-blue-900/30'
        }`}>
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin absolute" />
          ) : lockoutSeconds > 0 ? (
            <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          ) : (
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Acceso de Clientes
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
          Por favor, introduce tu código de seguridad para ver tus locales.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              disabled={isLoading || lockoutSeconds > 0}
              onChange={(e) => {
                if (lockoutSeconds > 0) return;
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                setErrorMessage(null);
                if (val.length === 4) {
                  processLogin(val);
                }
              }}
              placeholder="••••"
              maxLength={4}
              className={`w-full text-center text-3xl tracking-[1em] font-mono py-4 rounded-xl border-2 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-all outline-hidden ${
                lockoutSeconds > 0
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 opacity-60'
                  : errorMessage 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-200 dark:border-gray-800 focus:border-blue-500'
              } disabled:opacity-50`}
              autoFocus
            />
          </div>

          {lockoutSeconds > 0 ? (
            <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold text-center animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Demasiados intentos. Acceso bloqueado por {formatCountdown(lockoutSeconds)}.</span>
            </div>
          ) : errorMessage ? (
            <div className="flex items-center justify-center gap-1.5 text-red-500 text-xs font-semibold text-center animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : failedAttempts > 0 ? (
            <div className="flex items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs text-center">
              <span>Intentos restantes: {Math.max(0, PIN_MAX_ATTEMPTS - failedAttempts)}</span>
            </div>
          ) : null}
        </form>
        
      </div>
    </div>
  );
};
