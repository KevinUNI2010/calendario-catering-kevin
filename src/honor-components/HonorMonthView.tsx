import React from 'react';
import { CalendarEvent, Local } from '../types';
import { getMonthDays, isSameDay, isToday, DAY_NAMES_SHORT } from '../utils/dateUtils';
import { getEventColor } from '../utils/colorUtils';
import { Plus, Utensils } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: React.MouseEvent, event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
  onShowDaySummary?: (date: Date, events: CalendarEvent[]) => void;
  role?: string;
  locales?: Local[];
}

export const HonorMonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventOnDate,
  onShowDaySummary,
  role,
  locales = [],
}) => {
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa] dark:bg-[#0c0c0c] select-none overflow-hidden p-2 sm:p-4 gap-2">
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 mb-2">
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
      <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-2 sm:gap-3">
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
                if (onShowDaySummary) {
                  onShowDaySummary(day, dayEvents);
                }
              }}
              className={`min-h-[65px] sm:min-h-[100px] p-2 sm:p-3 flex flex-col group relative rounded-2xl transition-all duration-300 cursor-pointer ${
                isCurrMonth 
                  ? 'bg-white dark:bg-[#1a1a1a] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:scale-[1.01] dark:shadow-none' 
                  : 'bg-transparent text-gray-400 dark:text-gray-600 opacity-60'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-medium w-7 h-7 rounded-full inline-flex items-center justify-center transition-all ${
                      today
                        ? 'bg-[#2b6de3] text-white shadow-md'
                        : isCurrMonth
                        ? 'text-gray-800 dark:text-gray-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Quick Add icon visible on hover */}
                {role !== 'viewer' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateEventOnDate(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#2b6de3] transition-all transform hover:scale-110"
                    title="Añadir evento en este día"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Event Badges */}
              <div className="flex-1 mt-1 overflow-y-auto scrollbar-none min-h-[40px] grid grid-cols-2 gap-1 content-start pr-1">
                {dayEvents.map((event) => {
                  const color = getEventColor(event.colorId);
                  const initial = event.localName ? event.localName.charAt(0).toUpperCase() : 'E';
                  return (
                    <div 
                      key={event.id} 
                      className="w-full h-5 sm:h-6 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm"
                      style={{ backgroundColor: color.bg, color: color.text || '#fff' }}
                      title={event.localName}
                    >
                      {initial}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {locales.length > 0 && (
        <div className="mt-2 py-2 px-4 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap gap-4 items-center justify-center border border-gray-100 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leyenda:</span>
          {locales.map(local => {
            const color = getEventColor(local.colorId);
            return (
              <div key={local.id} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.bg }} />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{local.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
