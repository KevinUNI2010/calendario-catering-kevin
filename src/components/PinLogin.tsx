import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';

interface PinLoginProps {
  onLogin: (session: UserSession) => void;
}

export const PinLogin: React.FC<PinLoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);

    try {
      const { isSupabaseConfigured, fetchSupabaseClientByPin } = await import('../lib/supabase');
      
      if (isSupabaseConfigured()) {
        const client = await fetchSupabaseClientByPin(pin);
        if (client) {
          onLogin({ role: 'viewer', allowedLocales: client.allowed_locales || [], name: client.name });
          setIsLoading(false);
          return;
        }
      } else {
        // Fallback mock validation
        if (pin === '1111') {
          onLogin({ role: 'viewer', allowedLocales: ['loc-1', 'loc-2'], name: 'Pepe' });
          setIsLoading(false);
          return;
        } else if (pin === '2222') {
          onLogin({ role: 'viewer', allowedLocales: ['loc-4'], name: 'José' });
          setIsLoading(false);
          return;
        }
      }
      
      // Admin backdoor for testing
      if (pin === '9999') {
        onLogin({ role: 'admin', name: 'Admin Test' });
        setIsLoading(false);
        return;
      }

      setError(true);
      setPin('');
    } catch (err) {
      setError(true);
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800 flex flex-col items-center">
        
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              maxLength={4}
              className={`w-full text-center text-3xl tracking-[1em] font-mono py-4 rounded-xl border-2 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-all outline-hidden ${
                error 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-200 dark:border-gray-800 focus:border-blue-500'
              }`}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-red-500 text-xs font-semibold animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4" />
              <span>PIN incorrecto. Inténtalo de nuevo.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length < 4 || isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? 'Comprobando...' : 'Entrar'}
            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
        
      </div>
    </div>
  );
};
