import React from 'react';
import { CalendarEvent } from '../types';
import { isSameDay, isToday, DAY_NAMES_FULL, formatTimeHM } from '../utils/dateUtils';
import { LocalBadge } from './LocalBadge';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: React.MouseEvent, event: CalendarEvent) => void;
  onCreateEventOnHour: (hour: number) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 to 23:00

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventOnHour,
}) => {
  const dayEvents = events.filter((e) => {
    const start = new Date(e.startDate);
    return isSameDay(start, currentDate);
  });

  const today = isToday(currentDate);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 select-none overflow-hidden">
      {/* Day Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`text-2xl font-bold w-12 h-12 rounded-2xl flex items-center justify-center ${
              today
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
            }`}
          >
            {currentDate.getDate()}
          </span>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
              {DAY_NAMES_FULL[currentDate.getDay()]}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {dayEvents.length} eventos y turnos de locales programados para hoy
            </p>
          </div>
        </div>
      </div>

      {/* Hourly Schedule */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="grid grid-cols-[80px_1fr] relative divide-x divide-gray-200 dark:divide-gray-800">
          
          {/* Time gutter */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {HOURS.map((hour) => (
              <div key={hour} className="h-20 pr-3 text-right text-xs font-mono text-gray-400 relative -top-2.5">
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Events Area */}
          <div className="relative divide-y divide-gray-100 dark:divide-gray-800/60">
            {HOURS.map((hour) => (
              <div
                key={hour}
                onClick={() => onCreateEventOnHour(hour)}
                className="h-20 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition cursor-pointer"
              />
            ))}

            {/* Render events over slots */}
            <div className="absolute inset-0 p-3 pointer-events-none space-y-2">
              {dayEvents.map((event) => {
                const start = new Date(event.startDate);
                const end = new Date(event.endDate);
                const startHour = start.getHours() + start.getMinutes() / 60;
                const endHour = end.getHours() + end.getMinutes() / 60;
                
                const topPercent = Math.max(0, ((startHour - 7) / 17) * 100);
                const durationHours = Math.max(0.75, endHour - startHour);

                return (
                  <div
                    key={event.id}
                    className="pointer-events-auto max-w-2xl my-1"
                  >
                    <LocalBadge
                      event={event}
                      onClick={onSelectEvent}
                      compact={false}
                    />
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
