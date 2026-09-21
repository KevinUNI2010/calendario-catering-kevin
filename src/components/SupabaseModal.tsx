import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copiedSql, setCopiedSql] = useState(false);
  const isConfigured = isSupabaseConfigured();

  const handleCopySql = () => {
    fetch('/supabase-schema.sql')
      .then((res) => res.text())
      .then((text) => {
        navigator.clipboard.writeText(text);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2500);
      })
      .catch(() => {
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2500);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                Conexión con Supabase + Vercel
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Base de datos PostgreSQL en la nube con WebSockets en tiempo real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                Estado de Supabase:
              </span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                isConfigured
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {isConfigured ? 'Conectado y Activo en Tiempo Real' : 'Modo Local (Listo para configurar)'}
              </span>
            </div>
          </div>
        </div>

        {/* Steps Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Con Supabase tu calendario puede publicarse en <strong>Vercel</strong> conservando 
            sincronización multiusuario instantánea sin depender de servidores dedicados.
          </p>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-1.5">
              <div className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span>1. Crear proyecto en Supabase</span>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline"
                >
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                Crea una cuenta gratuita en Supabase y crea un nuevo proyecto en tu región preferida.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-2">
              <div className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span>2. Ejecutar el script SQL</span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-[11px] font-semibold hover:bg-gray-50 cursor-pointer transition"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? '¡Copiado!' : 'Copiar supabase-schema.sql'}
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                Abre el <strong>SQL Editor</strong> en Supabase, pega el contenido del archivo <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">supabase-schema.sql</code> y pulsa <strong>Run</strong>. Creará las tablas de eventos, locales y habilitará Supabase Realtime automáticamente.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-1.5">
              <div className="font-bold text-gray-900 dark:text-white">
                3. Configurar variables en Vercel
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                En tu panel de Vercel (o en tu archivo <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[10px]">.env</code> local), agrega estas dos variables desde <strong>Project Settings &gt; API</strong> en Supabase:
              </p>
              <div className="bg-gray-900 text-gray-200 p-2.5 rounded-lg font-mono text-[11px] space-y-1">
                <div>VITE_SUPABASE_URL=https://tu-proyecto.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1">
              <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>4. Despliegue en Vercel con 1 clic</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-[11px]">
                El archivo <code className="px-1 py-0.5 rounded bg-white dark:bg-gray-800 font-mono text-[10px]">vercel.json</code> ya está generado en el proyecto. Al conectar tu repositorio a Vercel se publicará al instante.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
