import React, { useState } from 'react';
import { CalendarEvent, Local } from '../types';
import { getEventColor } from '../utils/colorUtils';
import { parsePlateFormula } from '../utils/plateMath';
import { getSelectedServilletas } from '../utils/servilletaUtils';
import { formatEventTime, parseEventDate } from '../utils/dateUtils';
import { EvidenceLightboxModal } from './EvidenceLightboxModal';
import {
  Calendar,
  Clock,
  X, 
  Edit3, 
  Trash2, 
  FileText
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
  const evidencePhoto = event.dish?.evidencePhoto || event.evidencePhoto;

  const isTimePending = Boolean(event.isTimePending || event.dish?.isTimePending);
  const isDatePending = Boolean(event.isDatePending || event.dish?.isDatePending);
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
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                1 evento programado
              </span>
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
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            {/* Header Event Card: Local pill a la izquierda y SOLO hora de inicio a la derecha */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span 
                  className="px-3.5 py-1 text-[13px] font-bold rounded-full tracking-wide uppercase inline-flex items-center" 
                  style={{ backgroundColor: `${colorDef.bg}20`, color: colorDef.bg }}
                >
                  {event.localName.toUpperCase()}
                  {local?.code && <span className="ml-1.5 opacity-70 text-[11px]">({local.code})</span>}
                </span>
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
                  <div className="my-1.5 py-2.5 px-3 rounded-xl border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs text-center">
                    <span className="font-black text-sm text-blue-900 dark:text-blue-100 tracking-wide uppercase">
                      {event.dish.proteina}
                    </span>
                  </div>
                ) : (
                  <div className="my-1.5 py-2.5 px-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center min-h-[46px] flex items-center justify-center">
                    <span className="text-xs text-gray-400 italic">Sin proteína</span>
                  </div>
                )}

                {/* Salsa */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[41px] flex items-center">
                  {event.dish.salsa ? (
                    <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{event.dish.salsa}</span>
                  ) : (
                    <span className="text-transparent select-none">&nbsp;</span>
                  )}
                </div>

                {/* Carbohidrato */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[41px] flex items-center">
                  {event.dish.carbohidrato ? (
                    <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{event.dish.carbohidrato}</span>
                  ) : (
                    <span className="text-transparent select-none">&nbsp;</span>
                  )}
                </div>

                {/* Guarnición */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[41px] flex items-center">
                  {event.dish.guarnicion ? (
                    <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{event.dish.guarnicion}</span>
                  ) : (
                    <span className="text-transparent select-none">&nbsp;</span>
                  )}
                </div>

                {/* Ensalada */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[41px] flex items-center">
                  {event.dish.ensalada ? (
                    <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{event.dish.ensalada}</span>
                  ) : (
                    <span className="text-transparent select-none">&nbsp;</span>
                  )}
                </div>

                {/* Descripción / Notas: Deja el espacio reservado si no existe para mantener perfecta alineación */}
                <div className="py-2.5 border-t border-gray-100 dark:border-gray-800 min-h-[41px] flex items-center text-sm">
                  {(event.description || event.notes) ? (
                    <span className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {event.description || event.notes}
                    </span>
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
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">Servilleta:</span>
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                              Por confirmar
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-gray-400">{servList.length > 1 ? 'Servilletas:' : 'Servilleta:'}</span>
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

                      // Estado de Pedidos (Cocina): si no se ingresó, queda pendiente con recuadro
                      const hasPedidos = event.dish.platosConfirmados !== undefined && event.dish.platosConfirmados > 0;
                      const pedidosNum = hasPedidos ? event.dish.platosConfirmados : undefined;

                      // Estado de Servidos (Sala): si no se ingresó, queda pendiente con recuadro
                      const hasServidos = event.dish.platosServidos !== undefined && event.dish.platosServidos > 0;
                      const servidosNum = hasServidos ? event.dish.platosServidos : undefined;

                      return (
                        <div className="flex flex-col items-end gap-1 text-[11px] shrink-0">
                          {/* Título de sección: N.º DE PLATOS */}
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase pr-1 select-none">
                            N.º DE PLATOS
                          </span>

                          {/* Degustación */}
                          {hasDegustacion ? (
                            <span 
                              className="w-full text-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 whitespace-nowrap" 
                              title="Platos degustación pactados"
                            >
                              Degustación: {displayDegustacion || contratadosNum}
                            </span>
                          ) : (
                            <span 
                              className="w-full px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2 whitespace-nowrap" 
                              title="Degustación pendiente de registrar"
                            >
                              <span>Degustación:</span>
                              <span className="inline-block w-8 h-3.5 rounded border border-blue-400/90 dark:border-blue-400 bg-white dark:bg-gray-900 shadow-2xs"></span>
                            </span>
                          )}

                          {/* Pedidos: muestra cantidad confirmada o recuadro para completar después */}
                          {hasPedidos ? (
                            <span 
                              className="w-full text-center px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 whitespace-nowrap" 
                              title="Platos pedidos para cocina"
                            >
                              Pedidos: {pedidosNum}
                            </span>
                          ) : (
                            <span 
                              className="w-full px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 flex items-center justify-between gap-2 whitespace-nowrap" 
                              title="Pedidos pendientes de confirmar (completar después)"
                            >
                              <span>Pedidos:</span>
                              <span className="inline-block w-8 h-3.5 rounded border border-orange-400/90 dark:border-orange-400 bg-white dark:bg-gray-900 shadow-2xs"></span>
                            </span>
                          )}

                          {/* Servidos: muestra cantidad servida o recuadro para completar después */}
                          {hasServidos ? (
                            <span 
                              className="w-full text-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 whitespace-nowrap" 
                              title="Platos servidos en sala"
                            >
                              Servidos: {servidosNum}
                            </span>
                          ) : (
                            <span 
                              className="w-full px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2 whitespace-nowrap" 
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
                </div>

                {/* Botón ver evidencia cuaderno si existe */}
                {evidencePhoto && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold transition cursor-pointer"
                    >
                      <img src={evidencePhoto} alt="Cuaderno" className="w-6 h-6 rounded object-cover shadow-xs border border-blue-200 dark:border-blue-700" />
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver Evidencia Cuaderno</span>
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
                  onOpenFullEdit(event);
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
