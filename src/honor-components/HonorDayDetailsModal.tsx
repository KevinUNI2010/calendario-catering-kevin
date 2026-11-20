import React, { useMemo, useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { X, MapPin, Clock, Calendar, ChevronRight, Utensils, FileText, Plus, Sparkles, Ban, Camera } from 'lucide-react';
import { formatDateShort, formatEventTime, parseEventDate } from '../utils/dateUtils';
import { getEventColor } from '../utils/colorUtils';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { getEffectivePlateCount, parsePlateFormula } from '../utils/plateMath';
import { getSelectedServilletas } from '../utils/servilletaUtils';
import { fetchSupabaseEventEvidence } from '../lib/supabase';
import { saveSingleEventPhotoToIDB, getEventEvidenceFromIDB } from '../utils/offlineStorage';
import { EvidenceLightboxModal } from '../components/EvidenceLightboxModal';
import { ModernEventCard } from '../components/modern-cards/ModernEventCard';
import {
  SalsaIcon,
  CarbohidratoIcon,
  GuarnicionIcon,
  EnsaladaIcon,
} from '../components/modern-cards/ModernIcons';

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
  const [lightboxImage, setLightboxImage] = useState<{ src: string; localName?: string; eventDate?: string | Date; title?: string } | null>(null);
  
  // Persistencia de preferencias de vista en el dispositivo (localStorage)
  const [cardStyle, setCardStyle] = useState<'classic' | 'modern'>(() => {
    try {
      const saved = localStorage.getItem('calendario_day_card_style');
      if (saved === 'classic' || saved === 'modern') return saved;
    } catch {}
    return 'classic';
  });

  const [cardColumns, setCardColumns] = useState<1 | 2 | 3 | 4>(() => {
    try {
      const saved = localStorage.getItem('calendario_day_card_columns');
      if (saved === '1' || saved === '2' || saved === '3' || saved === '4') {
        return Number(saved) as 1 | 2 | 3 | 4;
      }
      const legacy = localStorage.getItem('calendario_day_card_layout');
      if (legacy === '4-col') return 4;
      if (legacy === '3-col') return 3;
      if (legacy === '2-col') return 2;
      if (legacy === '1-col') return 1;
    } catch {}
    return 1;
  });

  const handleCardStyleChange = (style: 'classic' | 'modern') => {
    setCardStyle(style);
    try {
      localStorage.setItem('calendario_day_card_style', style);
    } catch {}
  };

  const handleCardColumnsChange = (cols: 1 | 2 | 3 | 4) => {
    setCardColumns(cols);
    try {
      localStorage.setItem('calendario_day_card_columns', String(cols));
      localStorage.setItem('calendario_day_card_layout', `${cols}-col`);
    } catch {}
  };

  const [loadedPhotos, setLoadedPhotos] = useState<Record<string, string>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});

  // Carga 100% bajo demanda: solo descarga la foto cuando el usuario hace clic en "Ver evidencia"
  const handleOpenEvidence = async (event: CalendarEvent) => {
    // 1. Si ya está cargada en memoria, abrir al instante (0 ms)
    const inMemPhoto = event.dish?.evidencePhoto || event.evidencePhoto || loadedPhotos[event.id];
    if (inMemPhoto) {
      setLightboxImage({
        src: inMemPhoto,
        localName: event.localName,
        eventDate: event.startDate,
        title: event.title,
      });
      return;
    }

    if (!event.hasEvidencePhoto) return;

    setLoadingPhotos((prev) => ({ ...prev, [event.id]: true }));
    try {
      // 2. Si está en IndexedDB (disco del celular), leerla sin llamar a Supabase
      const idbPhoto = await getEventEvidenceFromIDB(event.id);
      if (idbPhoto) {
        setLoadedPhotos((prev) => ({ ...prev, [event.id]: idbPhoto }));
        setLightboxImage({
          src: idbPhoto,
          localName: event.localName,
          eventDate: event.startDate,
          title: event.title,
        });
        return;
      }

      // 3. Si no existe en el celular, descargar únicamente esta foto de Supabase (~40-150 KB)
      const photo = await fetchSupabaseEventEvidence(event.id);
      if (photo) {
        setLoadedPhotos((prev) => ({ ...prev, [event.id]: photo }));
        saveSingleEventPhotoToIDB(event.id, photo);
        setLightboxImage({
          src: photo,
          localName: event.localName,
          eventDate: event.startDate,
          title: event.title,
        });
      }
    } catch (err) {
      console.warn('Error loading evidence photo:', err);
    } finally {
      setLoadingPhotos((prev) => ({ ...prev, [event.id]: false }));
    }
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const getEventWithLoadedPhoto = (evt: CalendarEvent): CalendarEvent => {
    const photo = loadedPhotos[evt.id] || evt.evidencePhoto || evt.dish?.evidencePhoto;
    if (photo) {
      return {
        ...evt,
        evidencePhoto: photo,
        dish: evt.dish ? { ...evt.dish, evidencePhoto: photo } : undefined,
        hasEvidencePhoto: true,
      };
    }
    return evt;
  };

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
    const localesMap = new Map<string, {
      name: string;
      colorId: string;
      earliestTime: number;
      eventsList: { timeFormatted: string; timestamp: number }[];
    }>();

    const inactiveEventsCount = events.filter(e => e.status === 'postponed' || e.status === 'cancelled').length;

    events.forEach((event) => {
      // Ignorar eventos postergados o cancelados para la producción de cocina del día
      if (event.status === 'postponed' || event.status === 'cancelled') return;
      const dish = event.dish;
      const hasFood = dish && (dish.proteina || dish.salsa || dish.carbohidrato || dish.guarnicion || dish.ensalada || dish.servilleta);
      if (!dish || !hasFood) return;

      const platos = getEffectivePlateCount(dish);
      totalPlates += platos;
      totalEventsWithFood++;

      const localName = (event.localName || 'Sin Local').trim();
      const startDate = parseEventDate(event.startDate);
      const timestamp = isNaN(startDate.getTime()) ? 0 : startDate.getTime();
      const isTimePending = Boolean(event.isTimePending || event.dish?.isTimePending);
      const timeFormatted = isTimePending ? 'Por confirmar' : formatEventTime(event.startDate);

      if (!localesMap.has(localName)) {
        localesMap.set(localName, {
          name: localName,
          colorId: event.colorId || 'peacock',
          earliestTime: timestamp,
          eventsList: []
        });
      }

      const entry = localesMap.get(localName)!;
      if (timestamp < entry.earliestTime) {
        entry.earliestTime = timestamp;
      }
      entry.eventsList.push({ timeFormatted, timestamp });

      if (dish.proteina) totals['Proteínas'][dish.proteina] = (totals['Proteínas'][dish.proteina] || 0) + platos;
      if (dish.salsa) totals['Salsas'][dish.salsa] = (totals['Salsas'][dish.salsa] || 0) + platos;
      if (dish.carbohidrato) totals['Carbohidratos'][dish.carbohidrato] = (totals['Carbohidratos'][dish.carbohidrato] || 0) + platos;
      if (dish.guarnicion) totals['Guarniciones'][dish.guarnicion] = (totals['Guarniciones'][dish.guarnicion] || 0) + platos;
      if (dish.ensalada) totals['Ensaladas'][dish.ensalada] = (totals['Ensaladas'][dish.ensalada] || 0) + platos;
      
      const servList = getSelectedServilletas(dish);
      if (servList.length > 0) {
        servList.forEach(s => {
          totals['Servilletas'][s.name] = (totals['Servilletas'][s.name] || 0) + platos;
        });
      } else {
        totals['Servilletas']['Por confirmar'] = (totals['Servilletas']['Por confirmar'] || 0) + platos;
      }
    });

    const localesWithHours = Array.from(localesMap.values())
      .sort((a, b) => a.earliestTime - b.earliestTime || a.name.localeCompare(b.name))
      .map((loc) => {
        const sortedHours = loc.eventsList
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((e) => e.timeFormatted);

        // Agrupar horas repetidas: ej. si hay 2 eventos a las 4:00 a. m. -> "4:00 a. m. (x2)"
        const hourGroups: { time: string; count: number }[] = [];
        sortedHours.forEach((time) => {
          const last = hourGroups[hourGroups.length - 1];
          if (last && last.time === time) {
            last.count++;
          } else {
            hourGroups.push({ time, count: 1 });
          }
        });

        const hoursString = hourGroups
          .map((h) => (h.count > 1 ? `${h.time} (x${h.count})` : h.time))
          .join(', ');

        return {
          name: loc.name,
          colorDef: getEventColor(loc.colorId),
          earliestTime: loc.earliestTime,
          hoursString,
          eventsCount: loc.eventsList.length,
        };
      });

    return { totals, totalPlates, totalEventsWithFood, localesList: localesWithHours, localesWithHours, inactiveEventsCount };
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
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-[#fcfaf8] dark:bg-[#0c0c0c]">
          
          {/* Eventos del Día y Controles de Vista */}
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Eventos del Día</h3>
            
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Formato: elegir entre 1, 2, 3 o 4 por fila */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-[10px] sm:text-[11px] font-bold">
                <span className="px-1.5 text-gray-500 dark:text-gray-400 text-[9px] sm:text-[10px] select-none">
                  Fila:
                </span>
                {([1, 2, 3, 4] as const).map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() => handleCardColumnsChange(cols)}
                    className={`min-w-[24px] sm:min-w-[28px] px-1.5 sm:px-2 py-1 rounded-md transition cursor-pointer text-center font-bold ${
                      cardColumns === cols
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    title={`Ver ${cols} ${cols === 1 ? 'tarjeta' : 'tarjetas'} por fila`}
                  >
                    {cols}
                  </button>
                ))}
              </div>

              {/* Estilo: Clásico vs Moderno */}
              <div className="inline-flex p-0.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-[10px] sm:text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleCardStyleChange('classic')}
                  className={`px-2 sm:px-2.5 py-1 rounded-md transition cursor-pointer ${
                    cardStyle === 'classic'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Clásico
                </button>
                <button
                  type="button"
                  onClick={() => handleCardStyleChange('modern')}
                  className={`px-2 sm:px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    cardStyle === 'modern'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Moderno (Lab)</span>
                </button>
              </div>
            </div>
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
          ) : cardStyle === 'modern' ? (
            <div className={`grid ${
              cardColumns === 1 ? 'grid-cols-1 gap-3 sm:gap-4' :
              cardColumns === 2 ? 'grid-cols-2 gap-2 sm:gap-4' :
              cardColumns === 3 ? 'grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3.5' :
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5'
            } auto-rows-max w-full`}>
              {sortedEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => {
                    if (role === 'admin') {
                      onSelectEvent(getEventWithLoadedPhoto(event));
                      onClose();
                    }
                  }}
                  className={`w-full ${role === 'admin' ? 'cursor-pointer hover:shadow-md transition-shadow rounded-3xl' : ''}`}
                >
                  <ModernEventCard
                    event={loadedPhotos[event.id] ? { ...event, evidencePhoto: loadedPhotos[event.id] } : event}
                    className="w-full h-full"
                    onOpenPhotoLightbox={() => handleOpenEvidence(event)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid ${
              cardColumns === 1 ? 'grid-cols-1 gap-3 sm:gap-4' :
              cardColumns === 2 ? 'grid-cols-2 gap-2 sm:gap-4' :
              cardColumns === 3 ? 'grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3.5' :
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5'
            } auto-rows-max w-full`}>
              {sortedEvents.map(event => {
              const color = getEventColor(event.colorId);
              const timeString = formatEventTime(event.startDate);
              const isPostponed = event.status === 'postponed';
              const isCancelled = event.status === 'cancelled';

              return (
                <div 
                  key={event.id}
                  onClick={(e) => {
                    if (role === 'admin') {
                      onSelectEvent(getEventWithLoadedPhoto(event));
                      onClose();
                    }
                  }}
                  className={`relative bg-white dark:bg-[#1a1a1a] rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-sm border transition-all overflow-hidden ${
                    isPostponed
                      ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/10'
                      : isCancelled
                      ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/40 bg-rose-50/10'
                      : 'border-gray-100 dark:border-gray-800'
                  } ${role === 'admin' ? 'cursor-pointer hover:shadow-md' : ''}`}
                >
                  {/* Marca de agua 'X' diagonal para evento postergado / cancelado */}
                  {isPostponed && (
                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden select-none">
                      <svg
                        className="w-full h-full p-4 sm:p-6 text-amber-500/25 dark:text-amber-400/30"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line x1="8" y1="8" x2="92" y2="92" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                        <line x1="92" y1="8" x2="8" y2="92" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}

                  {isCancelled && (
                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden select-none">
                      <svg
                        className="w-full h-full p-4 sm:p-6 text-rose-500/25 dark:text-rose-400/30"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line x1="8" y1="8" x2="92" y2="92" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                        <line x1="92" y1="8" x2="8" y2="92" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}

                  {/* Formas orgánicas / Blobs de fondo dinámicas con el color del local */}
                  <svg
                    aria-hidden="true"
                    className="absolute -top-8 -left-8 sm:-top-10 sm:-left-10 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none transition-colors duration-300 z-0"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M45.7,-78.3C58.9,-71.1,69.1,-58.5,76.5,-44.6C83.9,-30.7,88.5,-15.3,87.7,-0.5C86.8,14.4,80.5,28.8,72.4,41.9C64.3,55,54.4,66.8,41.9,74.5C29.4,82.2,14.7,85.8,-0.1,86C-14.9,86.2,-29.8,83,-43.3,75.7C-56.8,68.4,-68.9,57,-76.7,43.2C-84.5,29.4,-88,14.7,-86.6,0.8C-85.2,-13.1,-78.9,-26.2,-70.7,-38.7C-62.5,-51.2,-52.4,-63.1,-39.8,-70.6C-27.2,-78.1,-13.6,-81.2,0.8,-82.6C15.2,-84,32.5,-85.5,45.7,-78.3Z"
                      transform="translate(100 100)"
                      fill={color.bg}
                      fillOpacity="0.12"
                    />
                  </svg>
                  <svg
                    aria-hidden="true"
                    className="absolute top-24 -right-12 sm:top-28 sm:-right-16 w-40 h-40 sm:w-52 sm:h-52 pointer-events-none transition-colors duration-300 z-0"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M42.7,-72.8C55.2,-66.4,65.2,-54.6,72.8,-41.3C80.4,-28,85.6,-14,84.9,-0.4C84.2,13.2,77.6,26.4,69.5,38.6C61.4,50.8,51.8,62,39.8,69.7C27.8,77.4,13.9,81.6,-0.5,82.4C-14.9,83.3,-29.8,80.8,-42.6,73.5C-55.4,66.2,-66.1,54.1,-73.4,40.5C-80.7,26.9,-84.6,13.5,-83.4,0.7C-82.2,-12.1,-75.9,-24.2,-67.7,-34.9C-59.5,-45.6,-49.4,-54.9,-37.9,-61.8C-26.4,-68.7,-13.2,-73.2,0.7,-74.4C14.6,-75.6,30.2,-79.2,42.7,-72.8Z"
                      transform="translate(100 100)"
                      fill={color.bg}
                      fillOpacity="0.09"
                    />
                  </svg>

                  <div className="flex flex-col h-full relative z-10">
                    {/* Header Event Card */}
                    <div className="flex items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        <span className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[11px] sm:text-[13px] font-bold rounded-full tracking-wide uppercase inline-flex items-center" style={{ backgroundColor: `${color.bg}20`, color: color.bg }}>
                          {event.localName.toUpperCase()}
                        </span>
                        {isPostponed && (
                          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-xs border border-amber-600 animate-pulse">
                            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                            <span>POSTERGADO</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black rounded-full bg-rose-600 text-white flex items-center gap-1 shadow-xs border border-rose-700">
                            <Ban className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>CANCELADO</span>
                          </span>
                        )}
                        {(event.isDatePending || event.dish?.isDatePending) && (
                          <span className="px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                            Fecha por confirmar
                          </span>
                        )}
                      </div>
                      {(event.isTimePending || event.dish?.isTimePending) ? (
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 shadow-2xs">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">Por confirmar</span>
                        </span>
                      ) : (
                        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">
                          {timeString}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-normal text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-snug mb-2 sm:mb-3 truncate min-h-[16px] sm:min-h-[20px]">
                      {event.title || <span className="text-transparent select-none">&nbsp;</span>}
                    </h3>

                    {/* Menu details */}
                    {event.dish && (
                      <div className="flex-1 flex flex-col mt-1 sm:mt-2">
                        {event.dish.proteina ? (
                          <div className={`my-1 sm:my-1.5 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl border-2 shadow-xs text-center ${
                            isPostponed
                              ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/40'
                              : isCancelled
                              ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/40'
                              : 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                          }`}>
                            <span className={`font-black text-xs sm:text-sm tracking-wide uppercase block truncate ${
                              isPostponed
                                ? 'text-amber-900 dark:text-amber-100'
                                : isCancelled
                                ? 'line-through text-rose-900 dark:text-rose-100'
                                : 'text-blue-900 dark:text-blue-100'
                            }`}>
                              {event.dish.proteina}
                            </span>
                            {isPostponed && (
                              <span className="ml-1.5 text-[10px] sm:text-xs font-black text-amber-700 dark:text-amber-300">
                                (POSTERGADO)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="my-1 sm:my-1.5 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center min-h-[36px] sm:min-h-[46px] flex items-center justify-center">
                            <span className="text-[10px] sm:text-xs text-gray-400 italic">Sin proteína</span>
                          </div>
                        )}

                        {/* Salsa */}
                        <div className="py-1.5 sm:py-2 border-t border-gray-100 dark:border-gray-800 min-h-[34px] sm:min-h-[42px] flex items-center gap-2 sm:gap-2.5">
                          <div
                            className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
                            style={{
                              backgroundColor: `${color.bg}18`,
                              border: `1px solid ${color.bg}30`,
                              color: color.bg,
                            }}
                          >
                            <SalsaIcon size={14} color={color.bg} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {event.dish.salsa ? (
                              <span className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm truncate block">{event.dish.salsa}</span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic text-[11px] sm:text-xs">Sin salsa</span>
                            )}
                          </div>
                        </div>

                        {/* Carbohidrato */}
                        <div className="py-1.5 sm:py-2 border-t border-gray-100 dark:border-gray-800 min-h-[34px] sm:min-h-[42px] flex items-center gap-2 sm:gap-2.5">
                          <div
                            className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
                            style={{
                              backgroundColor: `${color.bg}18`,
                              border: `1px solid ${color.bg}30`,
                              color: color.bg,
                            }}
                          >
                            <CarbohidratoIcon size={14} color={color.bg} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {event.dish.carbohidrato ? (
                              <span className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm truncate block">{event.dish.carbohidrato}</span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic text-[11px] sm:text-xs">Sin carbohidrato</span>
                            )}
                          </div>
                        </div>

                        {/* Guarnición */}
                        <div className="py-1.5 sm:py-2 border-t border-gray-100 dark:border-gray-800 min-h-[34px] sm:min-h-[42px] flex items-center gap-2 sm:gap-2.5">
                          <div
                            className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
                            style={{
                              backgroundColor: `${color.bg}18`,
                              border: `1px solid ${color.bg}30`,
                              color: color.bg,
                            }}
                          >
                            <GuarnicionIcon size={14} color={color.bg} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {event.dish.guarnicion ? (
                              <span className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm truncate block">{event.dish.guarnicion}</span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic text-[11px] sm:text-xs">Sin guarnición</span>
                            )}
                          </div>
                        </div>

                        {/* Ensalada */}
                        <div className="py-1.5 sm:py-2 border-t border-gray-100 dark:border-gray-800 min-h-[34px] sm:min-h-[42px] flex items-center gap-2 sm:gap-2.5">
                          <div
                            className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
                            style={{
                              backgroundColor: `${color.bg}18`,
                              border: `1px solid ${color.bg}30`,
                              color: color.bg,
                            }}
                          >
                            <EnsaladaIcon size={14} color={color.bg} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {event.dish.ensalada ? (
                              <span className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm truncate block">{event.dish.ensalada}</span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic text-[11px] sm:text-xs">Sin ensalada</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Descripción / Notas */}
                        <div className="py-1.5 sm:py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[44px] sm:min-h-[72px] h-[44px] sm:h-[72px] flex items-start text-[10.5px] sm:text-sm overflow-hidden">
                          {(event.description || event.notes) ? (
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line line-clamp-2 sm:line-clamp-3 leading-snug w-full">
                              {event.description || event.notes}
                            </p>
                          ) : (
                            <span className="text-transparent select-none">&nbsp;</span>
                          )}
                        </div>

                        {/* Footer Event Card */}
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-end text-xs sm:text-sm gap-2">
                          <div className="min-w-0 flex-1 pb-0.5">
                            {(() => {
                              const servList = getSelectedServilletas(event.dish);
                              if (servList.length === 0) {
                                return (
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="text-xs text-gray-400 dark:text-gray-500">Servilleta:</span>
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 whitespace-nowrap shadow-2xs">
                                      Por confirmar
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <div className="flex flex-col items-start gap-1">
                                  <span className="text-xs text-gray-400 dark:text-gray-500">{servList.length > 1 ? 'Servilletas:' : 'Servilleta:'}</span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {servList.map((s, idx) => (
                                      <span key={idx} className="inline-flex items-center gap-1 font-bold text-gray-800 dark:text-gray-200">
                                        {s.color && <span className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10 shrink-0" style={{ backgroundColor: s.color }} />}
                                        <span>{s.name}</span>
                                        {idx < servList.length - 1 && <span className="text-gray-400 font-normal">/</span>}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          {(() => {
                            const contratadosFormula = event.dish.platosContratadosFormula;
                            const parsedContr = contratadosFormula ? parsePlateFormula(contratadosFormula) : null;
                            const contratadosNum = event.dish.platosContratados ||
                              (parsedContr?.isValid ? parsedContr.total : (event.dish.cantidadPlatos || 0));

                            // Formato Degustación: con fórmula y total en minúscula (ej: "45x3 = 135" o "45x9 = 405")
                            let displayDegustacion = '';
                            if (contratadosFormula && parsedContr?.isValid) {
                              const cleanFormula = contratadosFormula.trim().toLowerCase();
                              if (cleanFormula.includes('=')) {
                                displayDegustacion = cleanFormula;
                              } else if (/[x*×·+]/.test(cleanFormula)) {
                                displayDegustacion = `${cleanFormula} = ${parsedContr.total}`;
                              } else {
                                displayDegustacion = cleanFormula;
                              }
                            } else if (contratadosNum > 0) {
                              displayDegustacion = String(contratadosNum);
                            }

                            const hasDegustacion = Boolean(displayDegustacion || contratadosNum > 0);

                            // Estado de Pedidos (Cocina): si no se ingresó, queda pendiente con recuadro
                            const hasPedidos = event.dish.platosConfirmados !== undefined && event.dish.platosConfirmados > 0;
                            const pedidosNum = hasPedidos ? event.dish.platosConfirmados : undefined;

                            // Estado de Servidos (Sala): si no se ingresó, queda pendiente con recuadro
                            const hasServidos = event.dish.platosServidos !== undefined && event.dish.platosServidos > 0;
                            const servidosNum = hasServidos ? event.dish.platosServidos : undefined;

                            return (
                              <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-1 text-[10.5px] sm:text-[11px] shrink-0">
                                {/* Título de sección: N.º DE PLATOS */}
                                <span className="text-[9.5px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase pr-1 select-none">
                                  N.º DE PLATOS
                                </span>

                                {/* Degustación */}
                                {hasDegustacion ? (
                                  <span 
                                    className="w-full sm:w-auto text-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 whitespace-nowrap text-[10.5px] sm:text-[11px]" 
                                    title="Platos degustación pactados"
                                  >
                                    Degustación: {displayDegustacion || contratadosNum}
                                  </span>
                                ) : (
                                  <span 
                                    className="w-full sm:w-auto px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2 whitespace-nowrap text-[10.5px] sm:text-[11px]" 
                                    title="Degustación pendiente de registrar"
                                  >
                                    <span>Degustación:</span>
                                    <span className="inline-block w-8 h-3.5 rounded border border-blue-400/90 dark:border-blue-400 bg-white dark:bg-gray-900 shadow-2xs"></span>
                                  </span>
                                )}

                                {/* Pedidos: muestra cantidad confirmada o recuadro para completar después */}
                                {hasPedidos ? (
                                  <span 
                                    className="w-full sm:w-auto text-center px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 whitespace-nowrap text-[10.5px] sm:text-[11px]" 
                                    title="Platos pedidos para cocina"
                                  >
                                    Pedidos: {pedidosNum}
                                  </span>
                                ) : (
                                  <span 
                                    className="w-full sm:w-auto px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 flex items-center justify-between gap-2 whitespace-nowrap text-[10.5px] sm:text-[11px]" 
                                    title="Pedidos pendientes de confirmar (completar después)"
                                  >
                                    <span>Pedidos:</span>
                                    <span className="inline-block w-8 h-3.5 rounded border border-orange-400/90 dark:border-orange-400 bg-white dark:bg-gray-900 shadow-2xs"></span>
                                  </span>
                                )}

                                {/* Servidos: muestra cantidad servida o recuadro para completar después */}
                                {hasServidos ? (
                                  <span 
                                    className="w-full sm:w-auto text-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 whitespace-nowrap text-[10.5px] sm:text-[11px]" 
                                    title="Platos servidos en sala"
                                  >
                                    Servidos: {servidosNum}
                                  </span>
                                ) : (
                                  <span 
                                    className="w-full sm:w-auto px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2 whitespace-nowrap text-[10.5px] sm:text-[11px]" 
                                    title="Servidos pendientes de registrar"
                                  >
                                    <span>Servidos:</span>
                                    <span className="inline-block w-8 h-3.5 rounded border border-emerald-400/90 dark:border-emerald-400 bg-white dark:bg-gray-900 shadow-2xs"></span>
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Botón ver evidencia cuaderno si existe */}
                        {(() => {
                          const eventPhoto = event.dish?.evidencePhoto || event.evidencePhoto || loadedPhotos[event.id];
                          const hasPhoto = Boolean(eventPhoto || event.hasEvidencePhoto);
                          const isPhotoLoading = Boolean(loadingPhotos[event.id]);

                          if (!hasPhoto) return null;

                          return (
                            <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                              <button
                                type="button"
                                disabled={isPhotoLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEvidence(event);
                                }}
                                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 pr-2.5 sm:pr-3 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10.5px] sm:text-xs font-medium transition cursor-pointer disabled:opacity-60"
                              >
                                {eventPhoto ? (
                                  <img 
                                    src={eventPhoto} 
                                    alt="Evidencia cuaderno" 
                                    className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg object-cover border border-blue-300 dark:border-blue-700"
                                  />
                                ) : (
                                  <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 animate-pulse" />
                                  </div>
                                )}
                                <span className="flex items-center gap-1 font-semibold text-[10.5px] sm:text-[11px]">
                                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                                  {isPhotoLoading ? 'Cargando evidencia...' : 'Ver evidencia'}
                                </span>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
          {/* Resumen de Producción (Solo visible para Admin y Cocineros; oculto para Dueños y Mozos) */}
          {(role === 'admin' || role === 'cocinero') && summary.totalPlates > 0 && (
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
                    {summary.localesWithHours.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {summary.localesWithHours.map((loc, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-xl border shadow-2xs transition-all hover:scale-[1.02]"
                            style={{ 
                              backgroundColor: `${loc.colorDef.bg}18`,
                              color: loc.colorDef.bg,
                              borderColor: `${loc.colorDef.bg}35`
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: loc.colorDef.bg }} />
                            <span>{loc.name.toUpperCase()}</span>
                            <span className="text-[10px] font-semibold opacity-90 border-l border-current/30 pl-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0 opacity-70" />
                              {loc.hoursString}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {summary.inactiveEventsCount > 0 && (
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 rounded-xl border border-amber-200/80 dark:border-amber-800/50 flex items-center gap-2 mt-3">
                  <X className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span>Se excluyeron {summary.inactiveEventsCount} evento(s) postergado(s) o cancelado(s) del cálculo de producción de cocina.</span>
                </div>
              )}
            </div>
          )}

          {/* Breakdown by Category (Solo visible para Admin y Cocineros; oculto para Dueños y Mozos) */}
          {(role === 'admin' || role === 'cocinero') && summary.totalPlates > 0 && (
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
          localName={lightboxImage.localName}
          eventDate={lightboxImage.eventDate}
          eventTitle={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
};
