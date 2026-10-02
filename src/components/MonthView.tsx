import React from 'react';
import { CalendarEvent } from '../types';
import { getMonthDays, isSameDay, isToday, DAY_NAMES_SHORT } from '../utils/dateUtils';
import { LocalBadge } from './LocalBadge';
import { Plus, Utensils } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 select-none overflow-hidden">
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50">
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
      <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-gray-200 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
        {days.map((day, idx) => {
          const isCurrMonth = day.getMonth() === currentMonth;
          const dayEvents = events.filter((e) => {
            const start = new Date(e.startDate);
            return isSameDay(start, day);
          });
          const today = isToday(day);
          
          // Calculate total plates for this day
          const totalPlates = dayEvents.reduce((sum, e) => sum + (e.dish?.cantidadPlatos || 0), 0);

          return (
            <div
              key={idx}
              onClick={() => {
                if (role !== 'viewer') {
                  onCreateEventOnDate(day);
                }
              }}
              className={`min-h-[65px] sm:min-h-[100px] p-1 sm:p-1.5 flex flex-col group relative transition-colors ${
                role !== 'viewer' ? 'cursor-pointer' : ''
              } ${
                isCurrMonth 
                  ? 'bg-white dark:bg-gray-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20' 
                  : 'bg-gray-50/50 dark:bg-gray-900/40 text-gray-400 dark:text-gray-600'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center justify-center ${
                      today
                        ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300 dark:ring-blue-900'
                        : isCurrMonth
                        ? 'text-gray-700 dark:text-gray-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  
                  {/* Total Plates Badge */}
                  {totalPlates > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onShowDaySummary) onShowDaySummary(day, dayEvents);
                      }}
                      className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/40 dark:hover:bg-orange-900/60 dark:text-orange-400 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800 transition cursor-pointer"
                      title="Ver resumen de producción"
                    >
                      <Utensils className="w-2.5 h-2.5" />
                      {totalPlates}
                    </button>
                  )}
                </div>

                {/* Quick Add icon visible on hover */}
                {role !== 'viewer' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateEventOnDate(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    title="Añadir evento en este día"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
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
