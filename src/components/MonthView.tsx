import React from 'react';
import { CalendarEvent } from '../types';
import { getMonthDays, isSameDay, isToday, DAY_NAMES_SHORT } from '../utils/dateUtils';
import { LocalBadge } from './LocalBadge';
import { Plus } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: React.MouseEvent, event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
  onShowDaySummary?: (date: Date, events: CalendarEvent[]) => void;
  role?: string;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventOnDate,
  onShowDaySummary,
  role,
}) => {
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 select-none overflow-y-auto">
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 sticky top-0 z-10 shrink-0">
        {DAY_NAMES_SHORT.map((day, idx) => (
          <div
            key={day}
            className={`py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
              idx === 0 || idx === 6 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-gray-200 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800 pb-20 sm:pb-0">
        {days.map((day, idx) => {
          const isCurrMonth = day.getMonth() === currentMonth;
          const dayEvents = events.filter((e) => {
            const start = new Date(e.startDate);
            return isSameDay(start, day);
          });
          const today = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => {
                if (onShowDaySummary) {
                  onShowDaySummary(day, dayEvents);
                }
              }}
              className={`min-h-[70px] sm:min-h-[100px] p-0.5 sm:p-1.5 flex flex-col group relative transition-colors ${
                role !== 'viewer' ? 'cursor-pointer' : ''
              } ${
                isCurrMonth 
                  ? 'bg-white dark:bg-gray-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20' 
                  : 'bg-gray-100/80 dark:bg-gray-950/60 text-gray-400 dark:text-gray-600'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-start gap-0.5 sm:gap-1 mb-0.5 sm:mb-1 w-full min-w-0">
                {/* Fecha pegada a la esquina superior izquierda */}
                <span
                  className={`text-[11px] sm:text-xs font-bold shrink-0 ${
                    today
                      ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white shadow-xs inline-flex items-center justify-center'
                      : isCurrMonth
                      ? 'text-gray-800 dark:text-gray-200 pl-0.5 pr-0.5'
                      : 'text-gray-400 dark:text-gray-600 pl-0.5 pr-0.5'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Event Badges (Boton de cada local) */}
              <div className="flex-1 overflow-y-auto scrollbar-thin min-h-[40px] pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {dayEvents.map((event) => (
                    <div key={event.id} onClick={(e) => e.stopPropagation()}>
                      <LocalBadge
                        event={event}
                        onClick={onSelectEvent}
                        compact={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
