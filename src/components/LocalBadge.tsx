import React from 'react';
import { CalendarEvent, GOOGLE_CALENDAR_COLORS } from '../types';
import { getEventColor } from '../utils/colorUtils';
import { formatTimeHM } from '../utils/dateUtils';
import { Store, Clock, MapPin, AlertCircle } from 'lucide-react';

interface LocalBadgeProps {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent, event: CalendarEvent) => void;
  compact?: boolean;
}

export const LocalBadge: React.FC<LocalBadgeProps> = ({ event, onClick, compact = false }) => {
  const colorDef = getEventColor(event.colorId);
  const isPostponed = event.status === 'postponed';
  const isCancelled = event.status === 'cancelled';

  if (compact) {
    return (
      <button
        id={`local-badge-${event.id}`}
        type="button"
        onClick={(e) => onClick(e, event)}
        className={`w-full text-left group flex items-center justify-between gap-1 p-[2px] md:px-2 md:py-1 rounded-md text-[10px] md:text-xs font-medium transition-all shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border cursor-pointer select-none ${
          isPostponed ? 'ring-1 ring-amber-400 opacity-90' : isCancelled ? 'ring-1 ring-rose-400 opacity-70 line-through' : ''
        }`}
        style={{
          backgroundColor: colorDef.bg,
          color: colorDef.text,
          borderColor: isPostponed ? '#f59e0b' : isCancelled ? '#ef4444' : colorDef.border,
        }}
        title={`${event.localName} - ${event.title}${isPostponed ? ' (Postergado)' : isCancelled ? ' (Cancelado)' : ''}`}
      >
        <span className="font-semibold truncate tracking-tight flex items-center gap-1 min-w-0">
          {isPostponed && <span className="font-black text-amber-200 shrink-0">✕</span>}
          {isCancelled && <span className="font-black text-rose-200 shrink-0">✕</span>}
          <span className="truncate">{event.localName}</span>
        </span>
        {isPostponed && (
          <span className="text-[8px] md:text-[9px] font-black uppercase bg-amber-500 text-white px-1 py-0.2 rounded shrink-0">
            Post.
          </span>
        )}
        {isCancelled && (
          <span className="text-[8px] md:text-[9px] font-black uppercase bg-rose-600 text-white px-1 py-0.2 rounded shrink-0">
            Canc.
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      id={`local-badge-${event.id}`}
      type="button"
      onClick={(e) => onClick(e, event)}
      className={`w-full text-left group flex flex-col gap-1 p-2 rounded-lg text-xs font-medium transition-all shadow-xs hover:shadow-md hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 dark:hover:ring-offset-gray-900 border cursor-pointer select-none ${
        isPostponed ? 'ring-2 ring-amber-400' : isCancelled ? 'ring-2 ring-rose-400 line-through opacity-80' : ''
      }`}
      style={{
        backgroundColor: colorDef.bg,
        color: colorDef.text,
        borderColor: isPostponed ? '#f59e0b' : isCancelled ? '#ef4444' : colorDef.border,
      }}
    >
      <div className="flex items-center justify-between gap-1 w-full">
        <div className="flex items-center gap-1.5 font-bold truncate">
          {isPostponed && <span className="font-black text-amber-200">✕</span>}
          {isCancelled && <span className="font-black text-rose-200">✕</span>}
          <span className="truncate">{event.localName}</span>
        </div>
        {isPostponed && (
          <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-2xs">
            POSTERGADO
          </span>
        )}
        {isCancelled && (
          <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-2xs">
            CANCELADO
          </span>
        )}
      </div>
    </button>
  );
};
