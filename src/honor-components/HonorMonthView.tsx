import React from 'react';
import { CalendarEvent, Local } from '../types';
import { getMonthDays, isSameDay, isToday, DAY_NAMES_SHORT } from '../utils/dateUtils';
import { getEventColor } from '../utils/colorUtils';
import { Plus } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-[#f7f8fa] dark:bg-[#0c0c0c] select-none overflow-y-auto p-1.5 sm:p-4 gap-2">
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 mb-1 sticky top-0 z-10 shrink-0 bg-[#f7f8fa] dark:bg-[#0c0c0c] py-1">
        {DAY_NAMES_SHORT.map((day, idx) => (
          <div
            key={day}
            className={`py-1 sm:py-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
              idx === 0 || idx === 6 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-1 sm:gap-3 pb-20 sm:pb-0">
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
              className={`min-h-[65px] sm:min-h-[100px] p-0.5 sm:p-1 flex flex-col group relative rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer ${
                isCurrMonth 
                  ? 'bg-white dark:bg-[#1a1a1a] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:scale-[1.01] dark:shadow-none' 
                  : 'bg-gray-200/50 dark:bg-gray-800/40 text-gray-400 dark:text-gray-600 opacity-80'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-start gap-0.5 sm:gap-1 mb-0.5 sm:mb-1 w-full min-w-0">
                <span
                  className={`text-[11px] sm:text-xs font-bold shrink-0 ${
                    today
                      ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#2b6de3] text-white shadow-xs inline-flex items-center justify-center'
                      : isCurrMonth
                      ? 'text-gray-800 dark:text-gray-200 pl-0.5 pr-0.5'
                      : 'text-gray-400 dark:text-gray-600 pl-0.5 pr-0.5'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Event Badges */}
              <div className="flex-1 mt-1 overflow-y-auto scrollbar-none min-h-[40px] flex flex-col gap-1">
                {dayEvents.map((event) => {
                  const color = getEventColor(event.colorId);
                  return (
                    <div 
                      key={event.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (role !== 'admin') {
                          if (onShowDaySummary) {
                            onShowDaySummary(day, dayEvents);
                          }
                        } else {
                          onSelectEvent(e, event);
                        }
                      }}
                      className="w-full rounded py-[3px] px-0.5 text-[8px] sm:text-[10px] leading-none font-bold shadow-sm whitespace-nowrap overflow-hidden text-clip cursor-pointer hover:opacity-90 active:scale-[0.98] transition-transform"
                      style={{ backgroundColor: color.bg, color: color.text || '#fff' }}
                      title={event.localName}
                    >
                      {event.localName || 'Evento'}
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
