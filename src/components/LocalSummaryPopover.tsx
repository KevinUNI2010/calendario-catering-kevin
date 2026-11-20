import React, { useState, useEffect } from 'react';
import { CalendarEvent, Local } from '../types';
import { getEventColor, getTextStrokeColor } from '../utils/colorUtils';
import { parsePlateFormula } from '../utils/plateMath';
import { getSelectedServilletas } from '../utils/servilletaUtils';
import { formatEventTime, parseEventDate } from '../utils/dateUtils';
import { fetchSupabaseEventEvidence } from '../lib/supabase';
import { saveSingleEventPhotoToIDB, getEventEvidenceFromIDB } from '../utils/offlineStorage';
import { EvidenceLightboxModal } from './EvidenceLightboxModal';
import {
  SalsaIcon,
  CarbohidratoIcon,
  GuarnicionIcon,
  EnsaladaIcon,
} from './modern-cards/ModernIcons';
import {
  Calendar,
  Clock,
  X, 
  Edit3, 
  Trash2, 
  FileText,
  Ban
} from 'lucide-react';

interface LocalSummaryPopoverProps {
  event: CalendarEvent;
  local?: Local;
  onClose: () => void;
  onQuickUpdate: (updates: Partial<CalendarEvent>) => void;
  onOpenFullEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  role?: string;
}

export const LocalSummaryPopover: React.FC<LocalSummaryPopoverProps> = ({
  event,
  local,
  onClose,
  onOpenFullEdit,
  onDelete,
  role,
}) => {
  const colorDef = getEventColor(event.colorId);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [evidencePhoto, setEvidencePhoto] = useState<string | undefined>(
    () => event.dish?.evidencePhoto || event.evidencePhoto
  );
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);

  useEffect(() => {
    if (!evidencePhoto && (event.hasEvidencePhoto || event.dish?.evidencePhoto || event.evidencePhoto)) {
      getEventEvidenceFromIDB(event.id).then((idbPhoto) => {
        if (idbPhoto) {
          setEvidencePhoto(idbPhoto);
          return;
        }
        setIsLoadingPhoto(true);
        fetchSupabaseEventEvidence(event.id).then((photo) => {
          if (photo) {
            setEvidencePhoto(photo);
            saveSingleEventPhotoToIDB(event.id, photo);
          }
          setIsLoadingPhoto(false);
        }).catch(() => setIsLoadingPhoto(false));
      });
    }
  }, [event.id, evidencePhoto, event.hasEvidencePhoto]);

  const isTimePending = Boolean(event.isTimePending || event.dish?.isTimePending);
  const isDatePending = Boolean(event.isDatePending || event.dish?.isDatePending);
  const isPostponed = event.status === 'postponed';
  const isCancelled = event.status === 'cancelled';
  const startDate = parseEventDate(event.startDate);
  const dateFormatted = startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  // Solo hora de inicio, sin hora final como fue solicitado
  const timeFormatted = formatEventTime(event.startDate);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        id="local-summary-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header - idéntico a lo señalado en la cabecera del modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-[#c04514] dark:text-orange-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white capitalize leading-tight">
                {dateFormatted}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                  1 evento programado
                </span>
                {isPostponed && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    Postergado
                  </span>
                )}
                {isCancelled && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                    Cancelado
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            id="close-summary-btn"
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Tarjeta individual con estilo idéntico a Eventos del Día */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-[#fcfaf8] dark:bg-[#0c0c0c]">
          <div className={`relative bg-white dark:bg-[#1a1a1a] rounded-3xl p-5 shadow-sm border overflow-hidden ${
            isPostponed
              ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/10'
              : isCancelled
              ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/40 bg-rose-50/10'
              : 'border-gray-100 dark:border-gray-800'
          }`}>
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
                fill={colorDef.bg}
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
                fill={colorDef.bg}
                fillOpacity="0.09"
              />
            </svg>

            <div className="flex flex-col h-full relative z-10">
              {/* Header Event Card: Local pill a la izquierda y SOLO hora de inicio a la derecha */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span 
                    className="px-3.5 sm:px-4 py-1 text-[13px] sm:text-[15px] font-black rounded-full tracking-wide uppercase inline-flex items-center shadow-2xs transition-all duration-300" 
                    style={{ 
                      backgroundColor: `${colorDef.bg}18`, 
                      color: colorDef.bg,
                      border: `1px solid ${colorDef.bg}35`,
                      WebkitTextStroke: `1px ${getTextStrokeColor(colorDef.bg)}`,
                      paintOrder: 'stroke fill',
                    }}
                  >
                    {event.localName.toUpperCase()}
                    {local?.code && <span className="ml-1.5 opacity-80 text-[11px] sm:text-xs">({local.code})</span>}
                  </span>
                  {isPostponed && (
                    <span className="px-3 py-1 text-xs font-black rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-xs border border-amber-600 animate-pulse">
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                      <span>EVENTO POSTERGADO</span>
                    </span>
                  )}
                  {isCancelled && (
                    <span className="px-3 py-1 text-xs font-black rounded-full bg-rose-600 text-white flex items-center gap-1 shadow-xs border border-rose-700">
                      <Ban className="w-3.5 h-3.5" />
                      <span>EVENTO CANCELADO</span>
                    </span>
                  )}
                  {isDatePending && (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                      Fecha por confirmar
                    </span>
                  )}
                </div>
              
              {isTimePending ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Por confirmar
                </span>
              ) : (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {timeFormatted}
                </span>
              )}
            </div>

            {/* Event Title */}
            <h3 className="font-normal text-gray-700 dark:text-gray-300 text-sm leading-snug mb-3 min-h-[20px]">
              {event.title || <span className="text-transparent select-none">&nbsp;</span>}
            </h3>

            {/* Menu details */}
            {event.dish && (
              <div className="flex-1 flex flex-col mt-2">
                {event.dish.proteina ? (
                  <div className={`my-1.5 py-2.5 px-3 rounded-xl border-2 shadow-xs text-center ${
                    isPostponed
                      ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/40'
                      : isCancelled
                      ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/40'
                      : 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                  }`}>
                    <span className={`font-black text-sm tracking-wide uppercase ${
                      isPostponed
                        ? 'text-amber-900 dark:text-amber-100'
                        : isCancelled
                        ? 'line-through text-rose-900 dark:text-rose-100'
                        : 'text-blue-900 dark:text-blue-100'
                    }`}>
                      {event.dish.proteina}
                    </span>
                    {isPostponed && (
                      <span className="ml-2 text-xs font-black text-amber-700 dark:text-amber-300">
                        (POSTERGADO)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="my-1.5 py-2.5 px-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center min-h-[46px] flex items-center justify-center">
                    <span className="text-xs text-gray-400 italic">Sin proteína</span>
                  </div>
                )}

                {/* Salsa */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[44px] flex items-center gap-2.5">
                  <div
                    className="w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
                    style={{
                      backgroundColor: `${colorDef.bg}18`,
                      border: `1px solid ${colorDef.bg}30`,
                      color: colorDef.bg,
                    }}
                  >
                    <SalsaIcon size={15} color={colorDef.bg} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {event.dish.salsa ? (
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate block">{event.dish.salsa}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-xs">Sin salsa</span>
                    )}
                  </div>
                </div>

                {/* Carbohidrato */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[44px] flex items-center gap-2.5">
                  <div
                    className="w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
                    style={{
                      backgroundColor: `${colorDef.bg}18`,
                      border: `1px solid ${colorDef.bg}30`,
                      color: colorDef.bg,
                    }}
                  >
                    <CarbohidratoIcon size={15} color={colorDef.bg} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {event.dish.carbohidrato ? (
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate block">{event.dish.carbohidrato}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-xs">Sin carbohidrato</span>
                    )}
                  </div>
                </div>

                {/* Guarnición */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[44px] flex items-center gap-2.5">
                  <div
                    className="w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
                    style={{
                      backgroundColor: `${colorDef.bg}18`,
                      border: `1px solid ${colorDef.bg}30`,
                      color: colorDef.bg,
                    }}
                  >
                    <GuarnicionIcon size={15} color={colorDef.bg} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {event.dish.guarnicion ? (
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate block">{event.dish.guarnicion}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-xs">Sin guarnición</span>
                    )}
                  </div>
                </div>

                {/* Ensalada */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[44px] flex items-center gap-2.5">
                  <div
                    className="w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
                    style={{
                      backgroundColor: `${colorDef.bg}18`,
                      border: `1px solid ${colorDef.bg}30`,
                      color: colorDef.bg,
                    }}
                  >
                    <EnsaladaIcon size={15} color={colorDef.bg} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {event.dish.ensalada ? (
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate block">{event.dish.ensalada}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-xs">Sin ensalada</span>
                    )}
                  </div>
                </div>

                {/* Descripción / Notas: Espacio reservado para 3 líneas exactas para alineación homogénea */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[72px] h-[72px] flex items-start text-xs sm:text-sm overflow-hidden">
                  {(event.description || event.notes) ? (
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line line-clamp-3 leading-snug w-full">
                      {event.description || event.notes}
                    </p>
                  ) : (
                    <span className="text-transparent select-none">&nbsp;</span>
                  )}
                </div>

                {/* Footer Event Card: Servilleta + Control de Platos */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-end text-sm gap-2 flex-wrap">
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
                                {s.color && (
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10 shrink-0" 
                                    style={{ backgroundColor: s.color }} 
                                  />
                                )}
                                <span>{s.name}</span>
                                {idx < servList.length - 1 && <span className="text-gray-400 font-normal">/</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
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

                      // Estado de Pedidos (Cocina): solo si fue completado por el administrador
                      const hasPedidos = event.dish.platosConfirmados !== undefined && event.dish.platosConfirmados > 0;
                      const pedidosNum = hasPedidos ? event.dish.platosConfirmados : undefined;

                      // Estado de Servidos (Sala): solo si fue completado por el administrador
                      const hasServidos = event.dish.platosServidos !== undefined && event.dish.platosServidos > 0;
                      const servidosNum = hasServidos ? event.dish.platosServidos : undefined;

                      // Si no hay ningún dato de platos registrado, no mostrar la sección
                      if (!hasDegustacion && !hasPedidos && !hasServidos) return null;

                      return (
                        <div className="flex flex-col items-end gap-1 text-[11px] shrink-0">
                          {/* Título de sección: N.º DE PLATOS */}
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase pr-1 select-none">
                            N.º DE PLATOS
                          </span>

                          {/* Degustación: solo si está rellenado */}
                          {hasDegustacion && (
                            <span 
                              className="w-full text-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 whitespace-nowrap" 
                              title="Platos degustación pactados"
                            >
                              Degustación: {displayDegustacion || contratadosNum}
                            </span>
                          )}

                          {/* Pedidos: solo si fue rellenado por el administrador */}
                          {hasPedidos && (
                            <span 
                              className="w-full text-center px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 whitespace-nowrap" 
                              title="Platos pedidos para cocina"
                            >
                              Pedidos: {pedidosNum}
                            </span>
                          )}

                          {/* Servidos: solo si fue rellenado por el administrador */}
                          {hasServidos && (
                            <span 
                              className="w-full text-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 whitespace-nowrap" 
                              title="Platos servidos en sala"
                            >
                              Servidos: {servidosNum}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Botón ver evidencia cuaderno si existe */}
                {(evidencePhoto || event.hasEvidencePhoto) && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={isLoadingPhoto}
                      onClick={() => {
                        if (evidencePhoto) {
                          setLightboxOpen(true);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold transition cursor-pointer disabled:opacity-60"
                    >
                      {evidencePhoto ? (
                        <img src={evidencePhoto} alt="Cuaderno" className="w-6 h-6 rounded object-cover shadow-xs border border-blue-200 dark:border-blue-700" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                        </div>
                      )}
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isLoadingPhoto ? 'Cargando evidencia...' : 'Ver evidencia'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {!event.dish && (event.description || event.notes) && (
              <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {event.description || event.notes}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          {role === 'admin' ? (
            <button
              type="button"
              id="delete-event-btn"
              onClick={() => {
                if (confirm(`¿Eliminar evento en ${event.localName}?`)) {
                  onDelete(event.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition cursor-pointer"
            >
              Cerrar
            </button>
            {role === 'admin' && (
              <button
                type="button"
                id="open-full-edit-btn"
                onClick={() => {
                  const eventWithPhoto = evidencePhoto ? {
                    ...event,
                    evidencePhoto,
                    dish: event.dish ? { ...event.dish, evidencePhoto } : undefined,
                    hasEvidencePhoto: true,
                  } : event;
                  onOpenFullEdit(eventWithPhoto);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edición Completa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox para inspeccionar la evidencia */}
      {evidencePhoto && (
        <EvidenceLightboxModal
          isOpen={lightboxOpen}
          imageSrc={evidencePhoto}
          localName={event.localName}
          eventDate={event.startDate}
          eventTitle={event.title || event.localName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
