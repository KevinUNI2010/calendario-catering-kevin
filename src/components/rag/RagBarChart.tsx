import React, { useRef, useState } from 'react';
import { RagChartData } from '../../types';
import { Download, Copy, Check, BarChart2 } from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { notify } from '../../utils/toastHelper';

interface RagBarChartProps {
  chart: RagChartData;
}

export const RagBarChart: React.FC<RagBarChartProps> = ({ chart }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const data = chart.data || [];
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // Default active tooltip on the highest bar if none is hovered
  const activeIndex = hoveredIdx !== null ? hoveredIdx : data.reduce((maxI, d, i, arr) => d.value > arr[maxI].value ? i : maxI, 0);

  const handleDownloadImage = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${chart.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      notify.success('Gráfica Descargada', 'Se ha guardado la imagen en tu dispositivo.');
    } catch (e) {
      console.error('Error al descargar gráfica:', e);
      notify.error('Error', 'No se pudo generar la imagen para descargar.');
    }
  };

  const handleCopyImage = async () => {
    if (!chartRef.current) return;
    setIsCopying(true);
    try {
      const blob = await toBlob(chartRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
        notify.success('Copiado para WhatsApp', 'Imagen copiada al portapapeles. Pégala (Ctrl+V) en tu chat.');
      }
    } catch (e) {
      console.error('Error al copiar gráfica:', e);
      notify.error('Error', 'No se pudo copiar la imagen al portapapeles.');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-3xl bg-white dark:bg-[#1a1a24] border border-gray-100 dark:border-gray-800 shadow-sm transition-all">
      {/* Contenedor capturable para exportar */}
      <div ref={chartRef} className="p-4 sm:p-5 bg-white dark:bg-[#1a1a24]">
        {/* Encabezado del gráfico */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {chart.title}
              </h4>
              {chart.subtitle && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                  {chart.subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Botones de descarga y copia */}
          <div className="flex items-center gap-1.5" data-html2canvas-ignore="true">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isCopying}
              title="Copiar imagen para WhatsApp"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition cursor-pointer"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-indigo-500" />}
              <span className="hidden sm:inline">{isCopied ? 'Copiado' : 'WhatsApp'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadImage}
              title="Descargar imagen PNG"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
          </div>
        </div>

        {/* Zona de Barras Neumórficas Estilo Good Morning David */}
        <div className="relative pt-8 pb-2">
          {/* Tooltip Flotante sobre la barra activa */}
          {activeIndex !== null && data[activeIndex] && (
            <div 
              className="absolute top-0 transition-all duration-300 pointer-events-none z-10 -translate-x-1/2"
              style={{
                left: `${((activeIndex + 0.5) / data.length) * 100}%`,
              }}
            >
              <div className="relative px-2.5 py-1 rounded-xl bg-white dark:bg-[#252538] text-gray-900 dark:text-white shadow-lg border border-gray-100 dark:border-gray-700 text-[11px] font-extrabold whitespace-nowrap flex flex-col items-center">
                <span>{data[activeIndex].value} {chart.unit || 'platos'}</span>
                {data[activeIndex].secondaryLabel && (
                  <span className="text-[9px] font-medium text-gray-400">
                    {data[activeIndex].secondaryLabel}
                  </span>
                )}
                {/* Flechita hacia abajo */}
                <div className="w-2 h-2 bg-white dark:bg-[#252538] border-r border-b border-gray-100 dark:border-gray-700 rotate-45 -mb-1 mt-0.5" />
              </div>
            </div>
          )}

          {/* Grilla de Barras */}
          <div className="flex items-end justify-around gap-2 sm:gap-4 h-36 px-2">
            {data.map((item, idx) => {
              const heightPercent = Math.max(12, Math.round((item.value / maxValue) * 100));
              const isActive = activeIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="flex-1 max-w-[48px] h-full flex flex-col items-center justify-end cursor-pointer group"
                >
                  {/* Barra con puntas redondeadas y gradiente violeta/índigo */}
                  <div className="w-full relative flex items-end justify-center h-full">
                    <div
                      className={`w-full rounded-2xl transition-all duration-300 shadow-sm ${
                        isActive
                          ? 'bg-gradient-to-t from-[#4f46e5] to-[#7c3aed] scale-105 opacity-100 shadow-indigo-500/25'
                          : 'bg-gradient-to-t from-[#6366f1]/70 to-[#a855f7]/60 group-hover:from-[#4f46e5] group-hover:to-[#7c3aed] opacity-85 group-hover:opacity-100'
                      }`}
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: '16px',
                      }}
                    />
                  </div>

                  {/* Etiqueta X debajo de la barra */}
                  <div className="mt-2 text-center w-full truncate">
                    <span className={`text-[10px] sm:text-xs font-bold transition-colors ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
