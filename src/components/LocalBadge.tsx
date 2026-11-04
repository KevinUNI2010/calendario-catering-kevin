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
  const stateColor = isPostponed ? '#f59e0b' : isCancelled ? '#ef4444' : null;

  if (compact) {
    return (
      <button
        id={`local-badge-${event.id}`}
        type="button"
        onClick={(e) => onClick(e, event)}
        className="relative w-full text-left group flex items-center p-[2px] md:px-2 md:py-1 rounded-md text-[10px] md:text-xs font-medium transition-all shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border cursor-pointer select-none overflow-hidden"
        style={{
          backgroundColor: colorDef.bg,
          color: colorDef.text,
          borderColor: colorDef.border,
        }}
        title={`${event.localName} - ${event.title}${isPostponed ? ' (Postergado)' : isCancelled ? ' (Cancelado)' : ''}`}
      >
        <span className="font-semibold truncate tracking-tight flex items-center gap-1 min-w-0">
          <span className="truncate">{event.localName}</span>
        </span>

        {(isPostponed || isCancelled) && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 overflow-hidden select-none">
            <svg className="w-full h-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="4" y1="8" x2="96" y2="92" stroke={stateColor!} strokeWidth="6" strokeLinecap="round" />
              <line x1="96" y1="8" x2="4" y2="92" stroke={stateColor!} strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      id={`local-badge-${event.id}`}
      type="button"
      onClick={(e) => onClick(e, event)}
      className="relative w-full text-left group flex flex-col gap-1 p-2 rounded-lg text-xs font-medium transition-all shadow-xs hover:shadow-md hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 dark:hover:ring-offset-gray-900 border cursor-pointer select-none overflow-hidden"
      style={{
        backgroundColor: colorDef.bg,
        color: colorDef.text,
        borderColor: colorDef.border,
      }}
    >
      <div className="flex items-center justify-between gap-1 w-full">
        <div className="flex items-center gap-1.5 font-bold truncate">
          <span className="truncate">{event.localName}</span>
        </div>
      </div>

      {(isPostponed || isCancelled) && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 overflow-hidden select-none">
          <svg className="w-full h-full drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="4" y1="8" x2="96" y2="92" stroke={stateColor!} strokeWidth="5" strokeLinecap="round" />
            <line x1="96" y1="8" x2="4" y2="92" stroke={stateColor!} strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </button>
  );
};
