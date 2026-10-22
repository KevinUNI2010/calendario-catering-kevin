import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';

interface RagFloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
  remainingQuota?: number;
  role?: string;
}

export const RagFloatingButton: React.FC<RagFloatingButtonProps> = ({
  isOpen,
  onClick,
  remainingQuota,
  role,
}) => {
  // If the chat modal is already open, hide or collapse the floating button
  if (isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none print:hidden">
      <button
        onClick={onClick}
        type="button"
        aria-label="Abrir asistente Kevin AI"
        className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white font-medium shadow-xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer"
      >
        {/* Glow halo on hover */}
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-40 blur transition duration-300" />

        {/* Icon with animated sparkles badge */}
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          {/* Active online green dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white" />
          </span>
        </div>

        {/* Label & Helper text */}
        <div className="text-left hidden xs:block sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white leading-none">
              Kevin AI
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-white/25 text-indigo-50 tracking-wider">
              RAG
            </span>
          </div>
          <p className="text-[10px] text-indigo-100 font-normal leading-tight mt-0.5">
            {role === 'admin' ? 'Consultas ilimitadas' : remainingQuota !== undefined ? `${remainingQuota}/10 consultas hoy` : 'Pregúntame lo que sea'}
          </p>
        </div>

        {/* Floating pill badge for mobile (shows when text is compact) */}
        <div className="block xs:hidden sm:hidden text-xs font-bold">
          Kevin AI
        </div>
      </button>
    </div>
  );
};
