import React from 'react';
import { CalendarEvent, GOOGLE_CALENDAR_COLORS } from '../types';
import { getEventColor } from '../utils/colorUtils';
import { DAY_NAMES_FULL, MONTH_NAMES_ES, formatTimeHM, isToday } from '../utils/dateUtils';
import { Store, Clock, MapPin, Edit3, Trash2, Mail, Users } from 'lucide-react';

interface AgendaViewProps {
  events: CalendarEvent[];
  onSelectEvent: (e: React.MouseEvent, event: CalendarEvent) => void;
  onOpenFullEdit: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  role?: string;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  onSelectEvent,
  onOpenFullEdit,
  onDeleteEvent,
  role,
}) => {
  // Sort events chronologically
  const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Group by date (YYYY-MM-DD)
  const grouped: Record<string, CalendarEvent[]> = {};
  sorted.forEach((event) => {
    const key = event.startDate.substring(0, 10);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(event);
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Agenda Completa de Locales
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Vista cronológica de actividades, recordatorios y turnos asignados por sucursal
          </p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-medium">No hay eventos ni turnos programados.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateStr, dayEvents]) => {
            const dateObj = new Date(dateStr + 'T12:00:00');
            const today = isToday(dateObj);

            return (
              <div key={dateStr} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-3 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xs py-2 z-10 border-b border-gray-100 dark:border-gray-800">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      today
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {today ? 'Hoy · ' : ''}{DAY_NAMES_FULL[dateObj.getDay()]}, {dateObj.getDate()} de {MONTH_NAMES_ES[dateObj.getMonth()]}
                  </span>
                  <div className="h-px bg-gray-200 dark:border-gray-800 flex-1" />
                </div>

                {/* Event Cards */}
                <div className="grid grid-cols-1 gap-2.5">
                  {dayEvents.map((event) => {
                    const colorDef = getEventColor(event.colorId);

                    return (
                      <div
                        key={event.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:shadow-md transition-all gap-3 group"
                      >
                        {/* Left Info with Color Tag */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span
                            className="w-3.5 h-12 rounded-full shrink-0"
                            style={{ backgroundColor: colorDef.bg }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {/* Clickable Local Button as per prompt */}
                              <button
                                type="button"
                                onClick={(e) => onSelectEvent(e, event)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-xs hover:opacity-90 transition cursor-pointer"
                                style={{ backgroundColor: colorDef.bg }}
                                title="Ver resumen detallado del local"
                              >
                                <Store className="w-3 h-3" />
                                {event.localName}
                              </button>

                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {formatTimeHM(event.startDate)} - {formatTimeHM(event.endDate)}
                              </span>
                            </div>

                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-1.5 truncate">
                              {event.title}
                            </h3>

                            {event.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Quick Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={(e) => onSelectEvent(e, event)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition cursor-pointer"
                          >
                            Resumen Rápido
                          </button>
                          {role !== 'viewer' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenFullEdit(event)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title="Editar evento completo"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar evento "${event.title}"?`)) {
                                    onDeleteEvent(event.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                title="Eliminar evento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
