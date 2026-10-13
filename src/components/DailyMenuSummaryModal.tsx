import { useEscapeKey } from '../hooks/useEscapeKey';
import React, { useMemo, useRef, useState } from 'react';
import { X, Utensils, Calendar, Copy } from 'lucide-react';
import { toBlob } from 'html-to-image';
import { notify } from '../utils/toastHelper';
import { CalendarEvent } from '../types';
import { getEventColor } from '../utils/colorUtils';
import { formatDateShort } from '../utils/dateUtils';
import { getEffectivePlateCount } from '../utils/plateMath';

interface DailyMenuSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  endDate?: Date | null;
  events: CalendarEvent[];
  subtitle?: string;
  role?: string;
}

export const DailyMenuSummaryModal: React.FC<DailyMenuSummaryModalProps> = ({
  isOpen,
  onClose,
  date,
  endDate,
  events,
  subtitle,
  role,
}) => {
  useEscapeKey(onClose, isOpen);

  const printRef = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  if (!isOpen || !date) return null;

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
      if (dish.servilleta) {
        const servName = dish.servilleta.split('|')[0];
        totals['Servilletas'][servName] = (totals['Servilletas'][servName] || 0) + platos;
      }
    });

    const localesList = Array.from(localesAtendidosMap.entries()).map(([name, colorId]) => ({
      name,
      colorDef: getEventColor(colorId)
    }));

    return { totals, totalPlates, totalEventsWithFood, localesList };
  }, [events]);

  const localSparklines = useMemo(() => {
    const data: Record<string, {
      localName: string,
      color: string,
      totalPlates: number,
      history: { date: string, plates: number }[]
    }> = {};

    const getLocalDateKey = (d: Date | string) => {
      if (typeof d === 'string') {
        const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
      }
      const dt = typeof d === 'string' ? new Date(d) : d;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    events.forEach(e => {
      if (!e.localName) return;
      const dish = e.dish;
      if (!dish) return;
      const plates = getEffectivePlateCount(dish);
      if (plates === 0) return;

      const localId = e.localId || e.localName;
      if (!data[localId]) {
        data[localId] = {
          localName: e.localName,
          color: getEventColor(e.colorId).bg,
          totalPlates: 0,
          history: []
        };
      }
      data[localId].totalPlates += plates;
      
      const dStr = getLocalDateKey(e.startDate);
      const existing = data[localId].history.find(h => h.date === dStr);
      if (existing) {
        existing.plates += plates;
      } else {
        data[localId].history.push({ date: dStr, plates });
      }
    });

    if (events.length === 0) return [];

    let rangeStart: Date;
    let rangeEnd: Date;

    if (date && endDate) {
      rangeStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    } else if (events.length > 0) {
      const dates = events.map(e => {
        const key = getLocalDateKey(e.startDate);
        const [y, m, d] = key.split('-').map(Number);
        return new Date(y, m - 1, d).getTime();
      });
      rangeStart = new Date(Math.min(...dates));
      rangeEnd = new Date(Math.max(...dates));
    } else {
      const baseDate = date || new Date();
      rangeStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
      rangeEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    }

    const allDates: string[] = [];
    let curr = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    const finalEnd = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());

    while (curr <= finalEnd) {
      allDates.push(getLocalDateKey(curr));
      curr.setDate(curr.getDate() + 1);
    }
    const sortedDates = allDates;

    const formattedDates = sortedDates.map(d => {
      const [, , day] = d.split('-');
      return parseInt(day, 10).toString();
    });

    return Object.values(data).map(loc => {
      const fullHistory = sortedDates.map(d => {
        const existing = loc.history.find(h => h.date === d);
        return existing ? existing.plates : 0;
      });

      const maxVal = Math.max(...fullHistory, 1);

      return {
        ...loc,
        fullHistory,
        maxVal,
        formattedDates
      };
    }).sort((a, b) => b.totalPlates - a.totalPlates);
  }, [events, date, endDate]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
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

              {/* Local Histograms */}
              {localSparklines.length > 0 && (
                <div className="pt-6 space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-2">
                    Producción por Local
                  </h3>
                  <div 
                    className="flex flex-col gap-6"
                    onClick={() => setActiveTooltip(null)}
                  >
                    {localSparklines.map((loc, idx) => (
                      <div key={idx} className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide" style={{ color: loc.color }}>
                            {loc.localName}
                          </span>
                          <span className="text-sm font-extrabold text-gray-700 dark:text-gray-300">
                            {loc.totalPlates} <span className="text-[10px] font-medium text-gray-500">platos totales</span>
                          </span>
                        </div>
                        <div className="w-full overflow-x-auto scrollbar-thin mt-2 pb-2">
                          <div className="flex items-end justify-between h-[140px] pt-8 min-w-[500px] relative px-2">
                            {/* Baseline */}
                            <div className="absolute bottom-6 left-0 right-0 h-px bg-gray-200 dark:bg-gray-700" />
                            
                            {loc.fullHistory.map((val, i) => {
                              const showLabel = val > 0 || i === 0 || i === loc.fullHistory.length - 1 || i % 5 === 0;
                              const heightPercent = loc.maxVal > 0 ? (val / loc.maxVal) * 100 : 0;
                              
                              const tooltipId = `${idx}-${i}`;
                              const isTooltipActive = activeTooltip === tooltipId;

                              return (
                                <div 
                                  key={i} 
                                  className="flex flex-col justify-end items-center h-full group flex-1 relative z-10 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTooltip(isTooltipActive ? null : tooltipId);
                                  }}
                                  onMouseEnter={() => setActiveTooltip(tooltipId)}
                                  onMouseLeave={() => setActiveTooltip(null)}
                                >
                                  {/* Value tooltip on hover/click */}
                                  {val > 0 && (
                                    <div 
                                      className={`absolute top-0 bg-gray-800 dark:bg-gray-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap shadow-sm transition-opacity z-50 ${isTooltipActive ? 'opacity-100' : 'opacity-0'}`}
                                    >
                                      {val}
                                    </div>
                                  )}
                                  
                                  {/* Bar wrapper */}
                                  <div className="w-full flex justify-center h-[calc(100%-1.5rem)] items-end">
                                    {val > 0 && (
                                      <div 
                                        className={`w-full max-w-[14px] rounded-t-sm transition-all duration-300 shadow-sm ${isTooltipActive ? 'brightness-110 scale-y-105' : ''}`}
                                        style={{ 
                                          height: `${Math.max(5, heightPercent)}%`, // At least 5% height if > 0
                                          backgroundColor: loc.color,
                                          transformOrigin: 'bottom'
                                        }}
                                      />
                                    )}
                                  </div>
                                  
                                  {/* Label */}
                                  <div className="h-6 mt-1 flex items-center justify-center">
                                    {showLabel ? (
                                      <span className={`text-[10px] ${val > 0 ? 'font-bold text-gray-700 dark:text-gray-300' : 'font-medium text-gray-400'}`}>
                                        {loc.formattedDates[i]}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex ${role === 'admin' ? 'justify-between' : 'justify-end'} items-center`}>
          {role === 'admin' && (
            <button
              onClick={handleCopyImage}
              disabled={summary.totalPlates === 0 || isCopying}
              className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="w-4 h-4" />
              {isCopying ? 'Copiando...' : 'Copiar Imagen para WhatsApp'}
            </button>
          )}
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
