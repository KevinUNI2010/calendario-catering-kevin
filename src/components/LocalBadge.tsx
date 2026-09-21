import React from 'react';
import { CalendarEvent, GOOGLE_CALENDAR_COLORS } from '../types';
import { formatTimeHM } from '../utils/dateUtils';
import { Store, Clock, MapPin, AlertCircle } from 'lucide-react';

interface LocalBadgeProps {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent, event: CalendarEvent) => void;
  compact?: boolean;
}

export const LocalBadge: React.FC<LocalBadgeProps> = ({ event, onClick, compact = false }) => {
  const colorDef = GOOGLE_CALENDAR_COLORS.find((c) => c.id === event.colorId) || GOOGLE_CALENDAR_COLORS[0];



  if (compact) {
    return (
      <button
        id={`local-badge-${event.id}`}
        type="button"
        onClick={(e) => onClick(e, event)}
        className="w-full text-left group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border cursor-pointer select-none"
        style={{
          backgroundColor: colorDef.bg,
          color: colorDef.text,
          borderColor: colorDef.border,
        }}
        title={`${event.localName} - ${event.title}`}
      >
        <span className="font-semibold truncate tracking-tight flex items-center gap-1">
          {event.localName}
        </span>
      </button>
    );
  }

  return (
    <button
      id={`local-badge-${event.id}`}
      type="button"
      onClick={(e) => onClick(e, event)}
      className="w-full text-left group flex flex-col gap-1 p-2 rounded-lg text-xs font-medium transition-all shadow-xs hover:shadow-md hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 dark:hover:ring-offset-gray-900 border cursor-pointer select-none"
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

    </button>
  );
};
