import React, { useState } from 'react';
import { CalendarEvent, Local } from '../types';
import { getEventColor } from '../utils/colorUtils';
import { formatTimeHM } from '../utils/dateUtils';
import { parsePlateFormula } from '../utils/plateMath';
import { EvidenceLightboxModal } from './EvidenceLightboxModal';
import {
  Store, 
  Clock, 
  X, 
  Edit3, 
  Trash2, 
  Utensils,
  FileText,
  Eye
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

  const startDate = new Date(event.startDate);
  const dateFormatted = startDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeFormatted = `${formatTimeHM(event.startDate)} - ${formatTimeHM(event.endDate)}`;

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
        {/* Header matching HonorDayDetailsModal cards */}
        <div className="p-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <span 
              className="px-3.5 py-1 text-[13px] font-bold rounded-full tracking-wide uppercase inline-flex items-center" 
              style={{ backgroundColor: `${colorDef.bg}20`, color: colorDef.bg }}
            >
              {event.localName.toUpperCase()}
              {local?.code && <span className="ml-1.5 opacity-70 text-[11px]">({local.code})</span>}
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                {dateFormatted} · {timeFormatted}
              </span>
              <button
                id="close-summary-btn"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Event Title */}
          {event.title && (
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base leading-snug mt-3">
              {event.title}
            </h3>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-1 text-gray-800 dark:text-gray-200">
          {event.dish && (
            <div className="flex flex-col">
              {event.dish.proteina && (
                <div className="py-2.5 border-t first:border-t-0 border-gray-100 dark:border-gray-800">
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

              {/* Footer de la tarjeta: Servilleta + Control de Platos */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm gap-2 flex-wrap">
                <div className="min-w-0">
                  {event.dish.servilleta ? (() => {
                    const [servName, servColor] = event.dish.servilleta.split('|');
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 text-sm">Servilleta:</span>
                        {servColor && (
                          <span 
                            className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10 shrink-0" 
                            style={{ backgroundColor: servColor }} 
                          />
                        )}
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{servName}</span>
                      </div>
                    );
                  })() : <span />}
                </div>

                <div>
                  {(() => {
                    const contratadosFormula = event.dish.platosContratadosFormula;
                    const contratadosNum = event.dish.platosContratados ||
                      (contratadosFormula ? parsePlateFormula(contratadosFormula).total : (event.dish.cantidadPlatos || 0));

                    const displayPactado = contratadosFormula || (contratadosNum > 0 ? String(contratadosNum) : '');

                    const cocinaNum = (event.dish.platosConfirmados !== undefined && event.dish.platosConfirmados > 0)
                      ? event.dish.platosConfirmados
                      : contratadosNum;

                    const servidosNum = (event.dish.platosServidos !== undefined && event.dish.platosServidos > 0)
                      ? event.dish.platosServidos
                      : cocinaNum;

                    const hasPlates = Boolean(displayPactado || cocinaNum > 0 || servidosNum > 0);

                    if (hasPlates) {
                      return (
                        <div className="flex flex-col items-end gap-1 text-[11px] shrink-0">
                          <span className="min-w-[105px] text-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 whitespace-nowrap" title="Platos contratados / fórmula">
                            Pactado: {displayPactado || contratadosNum}
                          </span>
                          <span className="min-w-[105px] text-center px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800 whitespace-nowrap" title="Ajuste para cocina">
                            Cocina: {cocinaNum}
                          </span>
                          <span className="min-w-[105px] text-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 whitespace-nowrap" title="Platos servidos en sala">
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

          {/* Si no hay plato definido, mostrar notas o descripción */}
          {!event.dish && (event.description || event.notes) && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {event.description || event.notes}
            </div>
          )}
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
          eventTitle={event.title || event.localName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
