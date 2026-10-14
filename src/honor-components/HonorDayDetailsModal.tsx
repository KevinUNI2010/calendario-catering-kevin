import React, { useMemo, useState } from 'react';
import { CalendarEvent } from '../types';
import { X, MapPin, Clock, Calendar, ChevronRight, Utensils, FileText, Plus } from 'lucide-react';
import { formatDateShort } from '../utils/dateUtils';
import { getEventColor } from '../utils/colorUtils';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { getEffectivePlateCount, parsePlateFormula } from '../utils/plateMath';
import { getSelectedServilletas } from '../utils/servilletaUtils';
import { EvidenceLightboxModal } from '../components/EvidenceLightboxModal';

interface HonorDayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEvent?: (date: Date) => void;
  role?: string;
}

export const HonorDayDetailsModal: React.FC<HonorDayDetailsModalProps> = ({
  isOpen,
  onClose,
  date,
  events,
  onSelectEvent,
  onCreateEvent,
  role,
}) => {
  useEscapeKey(onClose, isOpen);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

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
      const hasFood = dish && (dish.proteina || dish.salsa || dish.carbohidrato || dish.guarnicion || dish.ensalada || dish.servilleta);
      if (!dish || !hasFood) return;

      const platos = getEffectivePlateCount(dish);
      totalPlates += platos;
      totalEventsWithFood++;
      if (event.localName) localesAtendidosMap.set(event.localName, event.colorId || 'peacock');

      if (dish.proteina) totals['Proteínas'][dish.proteina] = (totals['Proteínas'][dish.proteina] || 0) + platos;
      if (dish.salsa) totals['Salsas'][dish.salsa] = (totals['Salsas'][dish.salsa] || 0) + platos;
      if (dish.carbohidrato) totals['Carbohidratos'][dish.carbohidrato] = (totals['Carbohidratos'][dish.carbohidrato] || 0) + platos;
      if (dish.guarnicion) totals['Guarniciones'][dish.guarnicion] = (totals['Guarniciones'][dish.guarnicion] || 0) + platos;
      if (dish.ensalada) totals['Ensaladas'][dish.ensalada] = (totals['Ensaladas'][dish.ensalada] || 0) + platos;
      
      const servList = getSelectedServilletas(dish);
      servList.forEach(s => {
        totals['Servilletas'][s.name] = (totals['Servilletas'][s.name] || 0) + platos;
      });
    });

    const localesList = Array.from(localesAtendidosMap.entries()).map(([name, colorId]) => ({
      name,
      colorDef: getEventColor(colorId)
    }));

    return { totals, totalPlates, totalEventsWithFood, localesList };
  }, [events]);

  if (!isOpen || !date) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full sm:w-11/12 sm:max-w-5xl bg-white dark:bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[85vh] overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-[#c04514] dark:text-orange-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white capitalize leading-tight">
                {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                {events.length} {events.length === 1 ? 'evento programado' : 'eventos programados'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {role === 'admin' && onCreateEvent && (
              <button 
                type="button"
                onClick={() => {
                  onClose();
                  onCreateEvent(date);
                }} 
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition transform active:scale-95 cursor-pointer"
                title="Crear un nuevo evento en este día"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Evento</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#fcfaf8] dark:bg-[#0c0c0c]">
          
          {/* Eventos del Día */}
          <div className="mb-4">
             <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Eventos del Día</h3>
          </div>

          {sortedEvents.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No hay eventos para este día.</p>
              {role === 'admin' && onCreateEvent && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateEvent(date);
                  }}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primer Evento</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
              {sortedEvents.map(event => {
              const color = getEventColor(event.colorId);
              const startDate = new Date(event.startDate);
              const timeString = startDate.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });

              return (
                <div 
                  key={event.id}
                  onClick={(e) => {
                    if (role === 'admin') {
                      onSelectEvent(event);
                      onClose();
                    }
                  }}
                  className={`bg-white dark:bg-[#1a1a1a] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 transition-all ${role === 'admin' ? 'cursor-pointer hover:shadow-md' : ''}`}
                >
                  <div className="flex flex-col h-full">
                    {/* Header Event Card */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3.5 py-1 text-[13px] font-bold rounded-full tracking-wide" style={{ backgroundColor: `${color.bg}20`, color: color.bg }}>
                        {event.localName.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {timeString}
                      </span>
                    </div>
                    
                    <h3 className="font-normal text-gray-700 dark:text-gray-300 text-sm leading-snug mb-3 truncate">{event.title}</h3>

                    {/* Menu details */}
                    {event.dish && (
                      <div className="flex-1 flex flex-col mt-2">
                        {event.dish.proteina && (
                          <div className="py-2.5 border-t border-gray-100 dark:border-gray-800">
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{event.dish.proteina}</span>
                          </div>
                        )}
                        {event.dish.salsa && (
                          <div className="py-2.5 border-t border-gray-100 dark:border-gray-800">
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{event.dish.salsa}</span>
                          </div>
                        )}
                        {event.dish.carbohidrato && (
                          <div className="py-2.5 border-t border-gray-100 dark:border-gray-800">
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{event.dish.carbohidrato}</span>
                          </div>
                        )}
                        {event.dish.guarnicion && (
                          <div className="py-2.5 border-t border-gray-100 dark:border-gray-800">
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{event.dish.guarnicion}</span>
                          </div>
                        )}
                        {event.dish.ensalada && (
                          <div className="py-2.5 border-t border-gray-100 dark:border-gray-800">
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{event.dish.ensalada}</span>
                          </div>
                        )}
                        
                        {(event.description || event.notes) && (
                          <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {event.description || event.notes}
                          </div>
                        )}

                        {/* Footer Event Card */}
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm gap-2">
                          <div className="min-w-0 flex-1">
                            {(() => {
                              const servList = getSelectedServilletas(event.dish);
                              if (servList.length === 0) return <span></span>;
                              return (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-gray-400">{servList.length > 1 ? 'Servilletas:' : 'Servilleta:'}</span>
                                  {servList.map((s, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 font-bold text-gray-800 dark:text-gray-200">
                                      {s.color && <span className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10 shrink-0" style={{ backgroundColor: s.color }} />}
                                      <span>{s.name}</span>
                                      {idx < servList.length - 1 && <span className="text-gray-400 font-normal">/</span>}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                          {(() => {
                            const contratadosFormula = event.dish.platosContratadosFormula;
                            const contratadosNum = event.dish.platosContratados ||
                              (contratadosFormula ? parsePlateFormula(contratadosFormula).total : (event.dish.cantidadPlatos || 0));

                            const displayPactado = contratadosFormula || (contratadosNum > 0 ? String(contratadosNum) : '');

                            // Cocina toma platosConfirmados; si no hay, toma contratadosNum
                            const cocinaNum = (event.dish.platosConfirmados !== undefined && event.dish.platosConfirmados > 0)
                              ? event.dish.platosConfirmados
                              : contratadosNum;

                            // Servidos toma platosServidos; si no hay, toma cocinaNum
                            const servidosNum = (event.dish.platosServidos !== undefined && event.dish.platosServidos > 0)
                              ? event.dish.platosServidos
                              : cocinaNum;

                            const hasPlates = Boolean(displayPactado || cocinaNum > 0 || servidosNum > 0);

                            if (hasPlates) {
                              return (
                                <div className="flex flex-col items-end gap-1 text-[11px] shrink-0">
                                  <span className="min-w-[115px] text-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 whitespace-nowrap" title="Platos contratados / fórmula">
                                    Contratados: {displayPactado || contratadosNum}
                                  </span>
                                  <span className="min-w-[115px] text-center px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 whitespace-nowrap" title="Platos confirmados">
                                    Confirmados: {cocinaNum}
                                  </span>
                                  <span className="min-w-[115px] text-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 whitespace-nowrap" title="Platos servidos en sala">
                                    Servidos: {servidosNum}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] text-orange-500 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">Por confirmar</span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Botón ver evidencia cuaderno si existe */}
                        {(event.dish?.evidencePhoto || event.evidencePhoto) && (
                          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage({
                                  src: (event.dish?.evidencePhoto || event.evidencePhoto)!,
                                  title: `${event.title} - ${event.localName}`,
                                });
                              }}
                              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium transition cursor-pointer"
                            >
                              <img 
                                src={event.dish?.evidencePhoto || event.evidencePhoto} 
                                alt="Evidencia cuaderno" 
                                className="w-7 h-7 rounded-lg object-cover border border-blue-300 dark:border-blue-700"
                              />
                              <span className="flex items-center gap-1 font-semibold text-[11px]">
                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                                Ver Evidencia Cuaderno
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
          {/* Resumen de Producción */}
          {role !== 'mozo' && summary.totalPlates > 0 && (
            <div className="mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-2">
                <div className="flex-1 bg-[#c04514] dark:bg-orange-800 p-5 rounded-2xl shadow-md overflow-hidden text-white flex flex-col justify-center">
                  <span className="block text-[11px] sm:text-xs font-bold text-orange-200 uppercase tracking-wider mb-2">Total a Cocinar</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-black leading-none tracking-tight">
                      {summary.totalPlates}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-orange-200">platos</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center overflow-hidden">
                  <span className="block text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Eventos Atendidos</span>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 leading-none">
                        {summary.totalEventsWithFood}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {summary.totalEventsWithFood === 1 ? 'evento' : 'eventos'}
                      </span>
                    </div>
                    {summary.localesList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {summary.localesList.map((loc, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm"
                            style={{ 
                              backgroundColor: `${loc.colorDef.bg}20`,
                              color: loc.colorDef.bg,
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
            </div>
          )}

          {/* Breakdown by Category */}
          {role !== 'mozo' && summary.totalPlates > 0 && (
            <div className="mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="mb-4">
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Detalle de Producción</h3>
              </div>
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

      {/* Modal Lightbox a pantalla completa para inspeccionar firmas/apuntes */}
      {lightboxImage && (
        <EvidenceLightboxModal
          isOpen={Boolean(lightboxImage)}
          imageSrc={lightboxImage.src}
          eventTitle={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
};
