import React, { useMemo, useRef, useState } from 'react';
import { X, Utensils, Calendar, Copy } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { notify } from '../utils/toastHelper';
import { CalendarEvent } from '../types';
import { getEventColor } from '../utils/colorUtils';
import { formatDateShort } from '../utils/dateUtils';

interface DailyMenuSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
  subtitle?: string;
}

export const DailyMenuSummaryModal: React.FC<DailyMenuSummaryModalProps> = ({
  isOpen,
  onClose,
  date,
  events,
  subtitle,
}) => {
  if (!isOpen || !date) return null;

  const printRef = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyImage = async () => {
    if (!printRef.current) return;
    try {
      setIsCopying(true);
      // Small delay to ensure styles are applied
      await new Promise(r => setTimeout(r, 100));
      
      const blob = await toBlob(printRef.current, { 
        backgroundColor: '#ffffff', // Force white background for the PNG
        pixelRatio: 2, // High resolution
        style: {
          padding: '24px',
          margin: '0',
          borderRadius: '0',
        }
      });
      
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        notify.success('Copiado con Éxito', 'Imagen copiada al portapapeles. Pégala (Ctrl+V) en tu chat de WhatsApp.', {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error al copiar imagen:', error);
      notify.error('Error', 'Hubo un error al copiar la imagen. Intenta de nuevo.');
    } finally {
      setIsCopying(false);
    }
  };

  // Calculate totals
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          
          {/* Print Wrapper: Natively full height */}
          <div ref={printRef} className="bg-white dark:bg-gray-900 flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-orange-50/50 dark:bg-orange-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Resumen de Producción
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {subtitle || (date ? `Para el ${formatDateShort(date)}` : '')}
                  </p>
                </div>
              </div>
              
              {/* Hide close button in screenshot using a trick: it's not strictly necessary, 
                  but we'll just let it be or use a specific class if needed. 
                  Actually, html-to-image might capture it, but it's fine. */}
              <button
                onClick={onClose}
                data-html2canvas-ignore="true" // Usually works for some libs, but we'll leave it
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">

          {summary.totalPlates === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <Utensils className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay platos programados para este día.</p>
            </div>
          ) : (
            <>
              {/* Grand Total Highlight */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800/50">
                  <span className="block text-xs font-bold text-orange-800/60 dark:text-orange-300/60 uppercase tracking-wider mb-1">Total a Cocinar</span>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-extrabold text-orange-600 dark:text-orange-400 leading-none">
                      {summary.totalPlates}
                    </span>
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">platos</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
                  <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Eventos Atendidos</span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-gray-700 dark:text-gray-200 leading-none">
                        {summary.totalEventsWithFood}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                        {summary.totalEventsWithFood === 1 ? 'evento' : 'eventos'}
                      </span>
                    </div>
                    {summary.localesList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {summary.localesList.map((loc, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] font-bold rounded-md shadow-xs border"
                            style={{ 
                              backgroundColor: loc.colorDef.bg, 
                              color: loc.colorDef.text,
                              borderColor: loc.colorDef.border
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 pt-4">
                {Object.entries(summary.totals).map(([category, items]) => {
                  const keys = Object.keys(items);
                  if (keys.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1.5 flex justify-between">
                        {category}
                      </h4>
                      <ul className="space-y-2">
                        {keys.sort((a, b) => items[b] - items[a]).map(item => (
                          <li key={item} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/30 px-3 py-2 rounded-lg text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{item}</span>
                            <span className="font-bold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded text-gray-900 dark:text-gray-100 shadow-xs">
                              {items[item]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex justify-between items-center">
          <button
            onClick={handleCopyImage}
            disabled={summary.totalPlates === 0 || isCopying}
            className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            {isCopying ? 'Copiando...' : 'Copiar Imagen para WhatsApp'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
