import React, { useState } from 'react';
import { X, Share2, Mail, Copy, Check, Shield, Users } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string, role: string) => Promise<void>;
  collaborators: { email: string; role: string }[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  onShare,
  collaborators,
}) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSubmitting(true);
    await onShare(email.trim(), role);
    setIsSubmitting(false);
    setSuccessMsg(`Invitación y acceso enviados a ${email}`);
    setEmail('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Compartir Calendario de Locales
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-400">
            Invita a gerentes de local, supervisores y baristas para sincronizar turnos y eventos en tiempo real.
          </p>

          {/* Add email form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="font-semibold text-gray-700 dark:text-gray-300 block">
              Invitar por correo electrónico:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gerente.local@empresa.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="editor">Puede editar</option>
                <option value="viewer">Solo ver</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando invitación...' : 'Enviar invitación con permisos'}
            </button>
          </form>

          {successMsg && (
            <p className="text-emerald-600 dark:text-emerald-400 text-center font-medium bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
              ✓ {successMsg}
            </p>
          )}

          {/* Collaborators list */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Personas con acceso ({collaborators.length})
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {collaborators.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs">
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{c.email}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                    {c.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Copy link */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
            <div className="text-[11px] text-gray-500 truncate">
              Cualquiera con el enlace puede ver los locales asignados
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-xs shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '¡Copiado!' : 'Copiar enlace'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
