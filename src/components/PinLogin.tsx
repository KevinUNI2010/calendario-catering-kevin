import React, { useState, useRef } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';

interface PinLoginProps {
  onLogin: (session: UserSession) => void;
}

export const PinLogin: React.FC<PinLoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Timer countdown for brute-force lockout
  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const processLogin = async (currentPin: string) => {
    if (lockoutSeconds > 0) return;

    setError(false);
    setIsLoading(true);

    try {
      const { isSupabaseConfigured, fetchSupabaseClientByPin } = await import('../lib/supabase');
      
      if (isSupabaseConfigured()) {
        const client = await fetchSupabaseClientByPin(currentPin);
        if (client) {
          setFailedAttempts(0);
          onLogin({
            id: client.id,
            role: client.role || 'dueño',
            allowedLocales: client.allowed_locales || [],
            name: client.name,
            pin: currentPin.trim(),
          });
          setIsLoading(false);
          return;
        }
      } else if ((import.meta as any).env?.DEV) {
        // Fallback mock validation ONLY in local dev environment without Supabase
        if (currentPin === '1111') {
          setFailedAttempts(0);
          onLogin({ id: 'mock-1', role: 'viewer', allowedLocales: ['loc-1', 'loc-2'], name: 'Pepe (Dev)', pin: '1111' });
          setIsLoading(false);
          return;
        } else if (currentPin === '2222') {
          setFailedAttempts(0);
          onLogin({ id: 'mock-2', role: 'viewer', allowedLocales: ['loc-4'], name: 'José (Dev)', pin: '2222' });
          setIsLoading(false);
          return;
        }
      }
      
      // Incrementar intentos fallidos y bloquear temporalmente si se superan 5 intentos
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 5) {
        setLockoutSeconds(30);
        setFailedAttempts(0);
      }

      setError(true);
      setPin('');
    } catch (err) {
      setError(true);
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
    if (pin.length === 4) {
      processLogin(pin);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800 flex flex-col items-center">
        
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 relative">
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin absolute" />
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
                setError(false);
                if (val.length === 4) {
                  processLogin(val);
                }
              }}
              placeholder="••••"
              maxLength={4}
              className={`w-full text-center text-3xl tracking-[1em] font-mono py-4 rounded-xl border-2 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-all outline-hidden ${
                lockoutSeconds > 0
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 opacity-60'
                  : error 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-200 dark:border-gray-800 focus:border-blue-500'
              } disabled:opacity-50`}
              autoFocus
            />
          </div>

          {lockoutSeconds > 0 ? (
            <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Demasiados intentos. Espera {lockoutSeconds}s por seguridad.</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-1.5 text-red-500 text-xs font-semibold animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>PIN incorrecto. Inténtalo de nuevo.</span>
            </div>
          ) : null}
        </form>
        
      </div>
    </div>
  );
};
