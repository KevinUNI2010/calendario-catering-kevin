import React, { useState } from 'react';
import { EmailLog } from '../types';
import { X, Mail, Send, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface EmailOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailLogs: EmailLog[];
  onSendTestEmail: (recipient: string, subject: string, body: string) => Promise<void>;
}

export const EmailOutboxModal: React.FC<EmailOutboxModalProps> = ({
  isOpen,
  onClose,
  emailLogs,
  onSendTestEmail,
}) => {
  if (!isOpen) return null;

  const [testEmail, setTestEmail] = useState('kevin.zambrano.inteligencia@gmail.com');
  const [testSubject, setTestSubject] = useState('🔔 Recordatorio: Apertura y Operación de Local');
  const [testBody, setTestBody] = useState('Hola Kevin,\n\nEste es un recordatorio automático programado para la operación del local.\n\nEl sistema sincroniza automáticamente las alertas 15m, 30m, 1h antes del turno.');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    setIsSending(true);
    await onSendTestEmail(testEmail, testSubject, testBody);
    setIsSending(false);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Recordatorios Automáticos por Correo Electrónico
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Historial de notificaciones despachadas por el servidor y simulador de envío en tiempo real
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

        {/* Content Tabs / Split */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Dispatch Test Form */}
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-3">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Send className="w-3.5 h-3.5" />
              Probar Envío Inmediato de Recordatorio por Correo
            </h4>

            <form onSubmit={handleSend} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Correo Destinatario:
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Asunto del Correo:
                  </label>
                  <input
                    type="text"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Cuerpo del Recordatorio:
                </label>
                <textarea
                  rows={2}
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {sentSuccess ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> ¡Correo despachado y registrado con éxito!
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSending ? 'Enviando...' : 'Despachar Correo Ahora'}
                </button>
              </div>
            </form>
          </div>

          {/* Outbox Log Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Bandeja de Salida y Registro ({emailLogs.length})</span>
              <span className="text-[10px] text-gray-400 font-normal">Revisión automática cada 15 segundos</span>
            </h4>

            {emailLogs.length === 0 ? (
              <p className="p-4 text-center text-gray-400">No se han registrado correos aún.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{log.subject}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">
                        {new Date(log.sentAt).toLocaleTimeString('es-ES')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <span>Destinatario: <strong className="text-gray-700 dark:text-gray-300">{log.recipient}</strong></span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium text-[10px]">
                        {log.triggerType === 'automatic' ? 'Automático (Programado)' : 'Manual'}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900/60 p-2 rounded-lg border border-gray-100 dark:border-gray-800 whitespace-pre-wrap font-sans">
                      {log.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
