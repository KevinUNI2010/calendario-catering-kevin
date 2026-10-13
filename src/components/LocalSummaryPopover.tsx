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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="local-summary-dialog"
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Color Accent Bar & Header */}
        <div 
          className="p-5 text-white flex items-start justify-between relative transition-colors"
          style={{ backgroundColor: colorDef.bg }}
        >
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase opacity-90">
              <Store className="w-4 h-4" />
              <span>{event.localName}</span>
              {local?.code && <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px]">{local.code}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs opacity-95">
              <Clock className="w-3.5 h-3.5" />
              <span className="capitalize">
                {new Date(event.startDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · {formatTimeHM(event.startDate)} - {formatTimeHM(event.endDate)}
              </span>
            </div>
          </div>
          <button
            id="close-summary-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/20 transition text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-gray-800 dark:text-gray-200">
          


          {/* Description / Notes if any */}
          {event.description && (
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium block mb-1">Descripción del Evento</span>
              <p className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Dish / Menu if any */}
          {event.dish && Object.values(event.dish).some(val => val) && (
            <div className="text-xs bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400 font-bold tracking-wide block mb-2.5 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-orange-500" />
                MENÚ SELECCIONADO
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-[11.5px] leading-relaxed">
                {event.dish.proteina && (
                  <div><span className="font-semibold text-gray-500 dark:text-gray-400">Proteína:</span> <span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.proteina}</span></div>
                )}
                {event.dish.salsa && (
                  <div><span className="font-semibold text-gray-500 dark:text-gray-400">Salsa:</span> <span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.salsa}</span></div>
                )}
                {event.dish.carbohidrato && (
                  <div><span className="font-semibold text-gray-500 dark:text-gray-400">Carbohidrato:</span> <span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.carbohidrato}</span></div>
                )}
                {event.dish.guarnicion && (
                  <div><span className="font-semibold text-gray-500 dark:text-gray-400">Guarnición:</span> <span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.guarnicion}</span></div>
                )}
                {event.dish.ensalada && (
                  <div><span className="font-semibold text-gray-500 dark:text-gray-400">Ensalada:</span> <span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.ensalada}</span></div>
                )}
                {event.dish.servilleta && (
                  <div><span className="font-semibold text-gray-500 dark:text-gray-400">Servilleta:</span> <span className="font-medium text-gray-800 dark:text-gray-200">{event.dish.servilleta.split('|')[0]}</span></div>
                )}
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
                      <div className="pt-0.5">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">Control de Platos:</span>
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                            Pactado: {displayPactado || contratadosNum}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold border border-orange-200 dark:border-orange-800">
                            Cocina: {cocinaNum}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                            Servidos: {servidosNum}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div>
                      <span className="font-semibold text-gray-500 dark:text-gray-400">Control de Platos:</span>{' '}
                      <span className="text-[13px] text-orange-500 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md ml-1">Por confirmar</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Evidencia / Foto del Cuaderno Físico */}
          {evidencePhoto && (
            <div className="text-xs bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 font-bold tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                  EVIDENCIA DEL CUADERNO
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ampliar
                </button>
              </div>
              <div 
                onClick={() => setLightboxOpen(true)}
                className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 cursor-pointer h-36 flex items-center justify-center"
              >
                <img 
                  src={evidencePhoto} 
                  alt="Evidencia del cuaderno" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white">
                  <Eye className="w-4 h-4 drop-shadow" />
                  <span className="text-xs font-semibold drop-shadow">Ver foto completa</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
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
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edición Completa
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
