import React, { useMemo } from 'react';
import { CalendarEvent } from '../types';
import { X, MapPin, Clock, Calendar, ChevronRight, Utensils } from 'lucide-react';
import { formatDateShort } from '../utils/dateUtils';
import { getEventColor } from '../utils/colorUtils';

interface HonorDayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  role?: string;
}

export const HonorDayDetailsModal: React.FC<HonorDayDetailsModalProps> = ({
  isOpen,
  onClose,
  date,
  events,
  onSelectEvent,
  role,
}) => {
  if (!isOpen || !date) return null;

  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Calculate totals for summary
  const summary = useMemo(() => {
    const totals: Record<string, Record<string, number>> = {
      Proteínas: {},
      Salsas: {},
      Carbohidratos: {},
      Guarniciones: {},
      Ensaladas: {},
      Servilletas: {},
    };

    let totalPlates = 0;
    let totalEventsWithFood = 0;
    const localesAtendidosMap = new Map<string, string>();

    events.forEach((event) => {
      const dish = event.dish;
      if (!dish || dish.cantidadPlatos <= 0) return;

      totalPlates += dish.cantidadPlatos;
      totalEventsWithFood++;
      if (event.localName) localesAtendidosMap.set(event.localName, event.colorId || 'peacock');

      if (dish.proteina) totals['Proteínas'][dish.proteina] = (totals['Proteínas'][dish.proteina] || 0) + dish.cantidadPlatos;
      if (dish.salsa) totals['Salsas'][dish.salsa] = (totals['Salsas'][dish.salsa] || 0) + dish.cantidadPlatos;
      if (dish.carbohidrato) totals['Carbohidratos'][dish.carbohidrato] = (totals['Carbohidratos'][dish.carbohidrato] || 0) + dish.cantidadPlatos;
      if (dish.guarnicion) totals['Guarniciones'][dish.guarnicion] = (totals['Guarniciones'][dish.guarnicion] || 0) + dish.cantidadPlatos;
      if (dish.ensalada) totals['Ensaladas'][dish.ensalada] = (totals['Ensaladas'][dish.ensalada] || 0) + dish.cantidadPlatos;
      if (dish.servilleta) totals['Servilletas'][dish.servilleta] = (totals['Servilletas'][dish.servilleta] || 0) + dish.cantidadPlatos;
    });

    const localesList = Array.from(localesAtendidosMap.entries()).map(([name, colorId]) => ({
      name,
      colorDef: getEventColor(colorId)
    }));

    return { totals, totalPlates, totalEventsWithFood, localesList };
  }, [events]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
      <div 
        className="w-full sm:w-11/12 sm:max-w-5xl bg-white dark:bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[85vh] overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e3e8f8] dark:bg-blue-900/30 flex items-center justify-center text-[#2b6de3] dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize leading-tight">
                {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {events.length} {events.length === 1 ? 'evento programado' : 'eventos programados'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-[#f7f8fa] dark:bg-[#0c0c0c]">
          {sortedEvents.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No hay eventos para este día.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 auto-rows-max">
              {sortedEvents.map(event => {
              const color = getEventColor(event.colorId);
              const startDate = new Date(event.startDate);
              const timeString = startDate.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });

              return (
                <div 
                  key={event.id}
                  onClick={(e) => {
                    // Si es admin, puede abrir el modal para editar, si no, solo ver (o no hacer nada).
                    // Para el diseño de Honor, permitimos click si el onSelectEvent está manejado
                    if (role !== 'viewer') {
                      onSelectEvent(event);
                      onClose();
                    }
                  }}
                  className={`relative overflow-hidden bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm transition-all ${role !== 'viewer' ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}`}
                  style={{ border: `1.5px solid ${color.bg}` }}
                >
                  <div className="p-2 sm:p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2 sm:mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1 truncate">{event.title}</h3>
                      
                      <div className="flex flex-col gap-0.5 sm:gap-1 mt-1 sm:mt-2">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 shrink-0" style={{ color: color.bg }} />
                          <span className="font-medium truncate" style={{ color: color.bg }}>{event.localName}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>{timeString}</span>
                        </div>
                      </div>
                    </div>
                    {role !== 'viewer' && (
                      <div className="hidden sm:flex w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center text-gray-400 shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Menu details */}
                  {event.dish && (
                    <div className="mt-2 pt-2 sm:mt-4 sm:pt-4 border-t border-gray-100 dark:border-gray-800 flex-1">
                      <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 sm:mb-2 flex items-center gap-1 sm:gap-1.5">
                         <span style={{ color: color.bg }}>🍽 Menú</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-y-1 text-sm">
                        {event.dish.proteina && (
                          <div className="truncate"><span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.proteina}</span></div>
                        )}
                        {event.dish.salsa && (
                          <div className="truncate"><span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.salsa}</span></div>
                        )}
                        {event.dish.carbohidrato && (
                          <div className="truncate"><span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.carbohidrato}</span></div>
                        )}
                        {event.dish.guarnicion && (
                          <div className="truncate"><span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.guarnicion}</span></div>
                        )}
                        {event.dish.ensalada && (
                          <div className="truncate"><span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.ensalada}</span></div>
                        )}
                        {event.dish.servilleta && (
                          <div className="truncate"><span className="text-gray-500">Servilleta:</span> <span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.servilleta}</span></div>
                        )}
                        {event.dish.cantidadPlatos > 0 && (
                          <div className="col-span-full mt-1 pt-1 border-t border-gray-50 dark:border-gray-800/50">
                            <span className="text-gray-500">N° Platos:</span> <span className="font-bold text-gray-900 dark:text-white">{event.dish.cantidadPlatos}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              );
              })}
            </div>
          )}

          {/* Resumen de Producción */}
          {summary.totalPlates > 0 && (
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
                  <Utensils className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Resumen de Producción
                </h3>
              </div>

              {/* Grand Total Highlight */}
              <div className="flex flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 p-3 sm:p-5 rounded-2xl border border-orange-200/50 dark:border-orange-800/50 shadow-sm overflow-hidden">
                  <span className="block text-[10px] sm:text-xs font-bold text-orange-800/60 dark:text-orange-300/60 uppercase tracking-wider mb-1 sm:mb-2 truncate">Total a Cocinar</span>
                  <div className="flex items-end gap-1.5 sm:gap-2">
                    <span className="text-3xl sm:text-5xl font-black text-orange-600 dark:text-orange-400 leading-none tracking-tight">
                      {summary.totalPlates}
                    </span>
                    <span className="text-xs sm:text-base font-semibold text-orange-800/80 dark:text-orange-300/80 mb-0.5 sm:mb-1">platos</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-white dark:bg-[#1a1a1a] p-3 sm:p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 flex flex-col justify-center overflow-hidden">
                  <span className="block text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 sm:mb-2 truncate">Eventos Atendidos</span>
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="flex items-end gap-1.5 sm:gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 leading-none">
                        {summary.totalEventsWithFood}
                      </span>
                      <span className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                        {summary.totalEventsWithFood === 1 ? 'evento' : 'eventos'}
                      </span>
                    </div>
                    {summary.localesList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {summary.localesList.map((loc, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold rounded-full shadow-sm"
                            style={{ 
                              backgroundColor: loc.colorDef.bg, 
                              color: loc.colorDef.text,
                            }}
                          >
                            {loc.name.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Breakdown by Category */}
              <div className="grid grid-cols-2 gap-x-3 sm:gap-x-8 gap-y-4 sm:gap-y-6">
                {Object.entries(summary.totals).map(([category, items]) => {
                  const keys = Object.keys(items);
                  if (keys.length === 0) return null;

                  return (
                    <div key={category} className="space-y-2 sm:space-y-3">
                      <h4 className="text-[10px] sm:text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-1 sm:pb-2">
                        {category}
                      </h4>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {keys.sort((a, b) => items[b] - items[a]).map(item => (
                          <li key={item} className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-gray-800 px-2 sm:px-4 py-1.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate pr-2 sm:pr-4" title={item}>{item}</span>
                            <span className="font-bold bg-gray-50 dark:bg-gray-800 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded sm:rounded-lg text-gray-900 dark:text-gray-100 min-w-[1.5rem] sm:min-w-[2.5rem] text-center border border-gray-100 dark:border-gray-700 text-[10px] sm:text-sm">
                              {items[item]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
