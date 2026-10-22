import React, { useRef, useState } from 'react';
import { Calendar, Download, Copy, Check, Sparkles } from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { RagCardsContainer } from '../../types';
import { notify } from '../../utils/toastHelper';

interface RagEventCardsProps {
  cardsData: RagCardsContainer;
}

export const RagEventCards: React.FC<RagEventCardsProps> = ({ cardsData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { dateTitle, subtitle, cards = [] } = cardsData;

  const handleDownloadImage = async () => {
    if (!containerRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `ficha-${dateTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      notify.success('Tarjeta Descargada', 'Se ha guardado la ficha en tu galería.');
    } catch (e) {
      console.error('Error al descargar ficha:', e);
      notify.error('Error', 'No se pudo generar la imagen para descargar.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyWhatsApp = async () => {
    if (!containerRef.current) return;
    try {
      // Intentar copiar como imagen primero al portapapeles
      const blob = await toBlob(containerRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      if (blob && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
        notify.success('Copiado como Imagen', '¡Pégala (Ctrl+V) directamente en tu chat de WhatsApp!');
        return;
      }
    } catch {
      // Fallback a texto enriquecido para WhatsApp
    }

    // Fallback: Copiar formato de texto estructurado para WhatsApp
    let waText = `📅 *${dateTitle}*\n_${subtitle || `${cards.length} evento(s)`}_\n──────────────────\n`;
    cards.forEach((card, idx) => {
      waText += `\n📍 *${card.localName.toUpperCase()}* ⏰ _${card.timeString}_\n`;
      waText += `🎉 *${card.title}*\n`;
      if (card.proteina) waText += `🍖 Proteína: *${card.proteina}*\n`;
      if (card.salsa) waText += `🥣 Salsa: *${card.salsa}*\n`;
      if (card.carbohidrato) waText += `🍚 Carbohidrato: *${card.carbohidrato}*\n`;
      if (card.guarnicion) waText += `🥗 Guarnición: *${card.guarnicion}*\n`;
      if (card.ensalada) waText += `🥬 Ensalada: *${card.ensalada}*\n`;
      if (card.servilletas && card.servilletas.length > 0) {
        waText += `🧻 Servilletas: *${card.servilletas.join(' / ')}*\n`;
      }
      if (card.platosServidos || card.platosConfirmados || card.platosContratados) {
        waText += `🍽️ Platos: Ctr: ${card.platosContratados || 0} | Conf: ${card.platosConfirmados || 0} | Serv: ${card.platosServidos || 0}\n`;
      }
      if (card.notes) waText += `📝 Notas: _${card.notes}_\n`;
      if (idx < cards.length - 1) waText += `──────────────────\n`;
    });

    try {
      await navigator.clipboard.writeText(waText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      notify.success('Copiado para WhatsApp', 'Resumen copiado con emojis y negritas listo para pegar.');
    } catch {
      notify.error('Error', 'No se pudo copiar.');
    }
  };

  return (
    <div className="my-2.5 w-full select-none">
      {/* Contenedor descargable como imagen */}
      <div 
        ref={containerRef}
        className="w-full bg-[#fdfcf9] dark:bg-[#1a1921] rounded-2xl p-4 sm:p-5 border border-amber-100/90 dark:border-gray-800 shadow-sm transition-all"
      >
        {/* Cabecera Estilo Calendario */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-gray-100 tracking-tight leading-snug">
                {dateTitle}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {subtitle || `${cards.length} evento(s) programado(s)`}
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            Ficha de Cocina
          </span>
        </div>

        {/* Listado de Tarjetas de Eventos */}
        <div className="space-y-3">
          {cards.map((card, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-[#14141d] rounded-2xl p-4 border border-gray-100 dark:border-gray-800/80 shadow-xs space-y-2.5"
            >
              {/* Header de la Tarjeta (Local + Hora) */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  {card.localName}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {card.timeString}
                </span>
              </div>

              {/* Título del Evento */}
              <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 leading-snug">
                {card.title}
              </h5>

              {/* Filas del Menú con bordes limpios */}
              <div className="pt-1 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                {card.proteina && (
                  <div className="py-1.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 font-medium">Proteína</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-right">{card.proteina}</span>
                  </div>
                )}
                {card.salsa && (
                  <div className="py-1.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 font-medium">Salsa</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-right">{card.salsa}</span>
                  </div>
                )}
                {card.carbohidrato && (
                  <div className="py-1.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 font-medium">Carbohidrato</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-right">{card.carbohidrato}</span>
                  </div>
                )}
                {card.guarnicion && (
                  <div className="py-1.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 font-medium">Guarnición</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-right">{card.guarnicion}</span>
                  </div>
                )}
                {card.ensalada && (
                  <div className="py-1.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 font-medium">Ensalada</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-right">{card.ensalada}</span>
                  </div>
                )}
                {card.servilletas && card.servilletas.length > 0 && (
                  <div className="py-1.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 font-medium">Servilletas</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-right flex items-center gap-1.5 flex-wrap justify-end">
                      {card.servilletas.map((s, sIdx) => {
                        const parts = s.split('|');
                        const name = parts[0].trim();
                        const color = parts[1]?.trim();
                        return (
                          <span key={sIdx} className="inline-flex items-center gap-1">
                            {color && <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: color }} />}
                            <span>{name}</span>
                            {sIdx < card.servilletas!.length - 1 && <span className="text-gray-400 font-normal">/</span>}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Conteo de Platos */}
              {Boolean(
                (card.platosContratados && String(card.platosContratados) !== '0') ||
                (card.platosConfirmados && String(card.platosConfirmados) !== '0') ||
                (card.platosServidos && String(card.platosServidos) !== '0')
              ) && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap gap-1.5 text-[10px]">
                  {Boolean(card.platosContratados && String(card.platosContratados) !== '0') && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/50 dark:border-blue-800/50">
                      Contratados: {card.platosContratados}
                    </span>
                  )}
                  {Boolean(card.platosConfirmados && String(card.platosConfirmados) !== '0') && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200/50 dark:border-amber-800/50">
                      Confirmados: {card.platosConfirmados}
                    </span>
                  )}
                  {Boolean(card.platosServidos && String(card.platosServidos) !== '0') && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/50 dark:border-emerald-800/50">
                      Servidos: {card.platosServidos}
                    </span>
                  )}
                </div>
              )}

              {/* Notas */}
              {card.notes && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                  {card.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Botones de Acción (Descargar PNG y Copiar para WhatsApp) */}
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleCopyWhatsApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
        >
          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{isCopied ? '¡Copiado!' : 'Copiar WhatsApp'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isDownloading ? 'Generando...' : 'Descargar Imagen'}</span>
        </button>
      </div>
    </div>
  );
};
