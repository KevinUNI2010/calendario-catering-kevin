import React from 'react';
import { CalendarEvent } from '../types';
import { getWeekDays, isSameDay, isToday, DAY_NAMES_SHORT, formatTimeHM } from '../utils/dateUtils';
import { LocalBadge } from './LocalBadge';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: React.MouseEvent, event: CalendarEvent) => void;
  onCreateEventOnDateHour: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 to 23:00

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventOnDateHour,
}) => {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 select-none overflow-x-auto overflow-y-hidden">
      <div className="min-w-[650px] md:min-w-0 flex flex-col h-full">
        {/* Week Day Headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 sticky top-0 z-20">
        <div className="py-3 text-center text-xs font-semibold text-gray-400 border-r border-gray-200 dark:border-gray-800">
          GMT-5
        </div>
        {weekDays.map((day, idx) => {
          const today = isToday(day);
          return (
            <div
              key={idx}
              className="py-2.5 px-2 text-center border-r border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-1"
            >
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {DAY_NAMES_SHORT[day.getDay()]}
              </span>
              <span
                className={`text-base font-bold w-8 h-8 rounded-full flex items-center justify-center ${
                  today
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hourly Grid Scrollable Area */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative divide-x divide-gray-200 dark:divide-gray-800">
          
          {/* Time gutter */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {HOURS.map((hour) => (
              <div key={hour} className="h-16 pr-2 text-right text-[11px] font-mono text-gray-400 relative -top-2">
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 7 Columns for Days */}
          {weekDays.map((day, dIdx) => {
            const dayEvents = events.filter((e) => {
              const start = new Date(e.startDate);
              return isSameDay(start, day);
            });

            return (
              <div key={dIdx} className="relative divide-y divide-gray-100 dark:divide-gray-800/60">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => onCreateEventOnDateHour(day, hour)}
                    className="h-16 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition cursor-pointer relative group"
                  />
                ))}

                {/* Event overlay items */}
                <div className="absolute inset-0 pointer-events-none p-1 flex flex-col gap-1.5 overflow-hidden">
                  {dayEvents.map((event) => {
                    const start = new Date(event.startDate);
                    const end = new Date(event.endDate);
                    const startHour = start.getHours() + start.getMinutes() / 60;
                    const endHour = end.getHours() + end.getMinutes() / 60;
                    
                    // calculate top offset from 7am
                    const topPercent = Math.max(0, ((startHour - 7) / 17) * 100);
                    const durationHours = Math.max(0.75, endHour - startHour);
                    const heightPercent = Math.min(100 - topPercent, (durationHours / 17) * 100);

                    return (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 pointer-events-auto z-10"
                        style={{
                          top: `${topPercent}%`,
                          minHeight: '44px',
                          maxHeight: `${Math.max(48, heightPercent * 10)}px`,
                        }}
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
            );
          })}

        </div>
      </div>
    </div>
  </div>
);
};
