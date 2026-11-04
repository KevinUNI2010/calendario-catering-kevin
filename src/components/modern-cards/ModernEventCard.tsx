import React from 'react';
import { CalendarEvent, Local } from '../../types';
import { getEventColor } from '../../utils/colorUtils';
import { parsePlateFormula } from '../../utils/plateMath';
import { getSelectedServilletas } from '../../utils/servilletaUtils';
import {
  SalsaIcon,
  CarbohidratoIcon,
  GuarnicionIcon,
  EnsaladaIcon,
  RolledNapkinIcon,
} from './ModernIcons';
import { Clock, MessageSquare, ShoppingCart, CheckCircle2, Camera } from 'lucide-react';

interface ModernEventCardProps {
  event: CalendarEvent;
  local?: Local;
  onOpenPhotoLightbox?: (url: string) => void;
  className?: string;
  showActions?: boolean;
  onEdit?: (event: CalendarEvent) => void;
}

// Mapeo amigable de colores conocidos para servilletas si no traen hex
const NAPKIN_COLOR_FALLBACKS: Record<string, string> = {
  lila: '#9333ea',
  morado: '#7e22ce',
  amarillo: '#eab308',
  dorado: '#d97706',
  azul: '#2563eb',
  'azul noche': '#1e3a8a',
  rojo: '#ef4444',
  verde: '#10b981',
  'verde esmeralda': '#059669',
  rosa: '#ec4899',
  'rosa bebe': '#f472b6',
  blanco: '#e2e8f0',
  negro: '#1e293b',
  vino: '#881337',
  naranja: '#f97316',
  turquesa: '#06b6d4',
  beige: '#d4b996',
  champagne: '#f7e7ce',
};

export const ModernEventCard: React.FC<ModernEventCardProps> = ({
  event,
  local,
  onOpenPhotoLightbox,
  className = '',
}) => {
  // 1. Obtener color dinámico asignado al local
  const colorDef = getEventColor(event.colorId || local?.colorId || '#039be5');
  const localColor = colorDef.bg; // Hex primario del local (ej: #039be5 para Villa, #33b679 para Cristales, #256a4a para Aryes)

  // 2. Extraer fecha / hora de inicio
  const isTimePending = Boolean(event.isTimePending || event.dish?.isTimePending);
  const isDatePending = Boolean(event.isDatePending || event.dish?.isDatePending);
  const startDate = new Date(event.startDate);
  const timeFormatted = startDate.toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // 3. Servilletas y sus colores reales
  const servList = getSelectedServilletas(event.dish);
  const firstNapkin = servList[0];
  const napkinColor = firstNapkin?.color || 
    (firstNapkin?.name ? NAPKIN_COLOR_FALLBACKS[firstNapkin.name.toLowerCase().trim()] : undefined) ||
    '#9333ea';

  // 4. Conteo y fórmulas de platos
  const contratadosFormula = event.dish?.platosContratadosFormula;
  const parsedContr = contratadosFormula ? parsePlateFormula(contratadosFormula) : null;
  const contratadosNum = event.dish?.platosContratados ||
    (parsedContr?.isValid ? parsedContr.total : (event.dish?.cantidadPlatos || 0));

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
  const hasPedidos = event.dish?.platosConfirmados !== undefined && event.dish.platosConfirmados > 0;
  const pedidosNum = hasPedidos ? event.dish?.platosConfirmados : undefined;
  const hasServidos = event.dish?.platosServidos !== undefined && event.dish.platosServidos > 0;
  const servidosNum = hasServidos ? event.dish?.platosServidos : undefined;

  const evidencePhoto = event.dish?.evidencePhoto || event.evidencePhoto;

  return (
    <div
      className={`relative w-full max-w-[390px] bg-white dark:bg-[#161a23] rounded-[32px] p-6 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.12)] ${className}`}
    >
      {/* 
        ========================================================================
        FORMAS ORGÁNICAS / BLOBS DE FONDO (DINÁMICAS CON EL COLOR DEL LOCAL)
        ========================================================================
      */}
      {/* Blob superior izquierdo */}
      <svg
        aria-hidden="true"
        className="absolute -top-10 -left-10 w-44 h-44 pointer-events-none transition-colors duration-300"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M45.7,-78.3C58.9,-71.1,69.1,-58.5,76.5,-44.6C83.9,-30.7,88.5,-15.3,87.7,-0.5C86.8,14.4,80.5,28.8,72.4,41.9C64.3,55,54.4,66.8,41.9,74.5C29.4,82.2,14.7,85.8,-0.1,86C-14.9,86.2,-29.8,83,-43.3,75.7C-56.8,68.4,-68.9,57,-76.7,43.2C-84.5,29.4,-88,14.7,-86.6,0.8C-85.2,-13.1,-78.9,-26.2,-70.7,-38.7C-62.5,-51.2,-52.4,-63.1,-39.8,-70.6C-27.2,-78.1,-13.6,-81.2,0.8,-82.6C15.2,-84,32.5,-85.5,45.7,-78.3Z"
          transform="translate(100 100)"
          fill={localColor}
          fillOpacity="0.12"
        />
      </svg>

      {/* Blob derecho medio/inferior */}
      <svg
        aria-hidden="true"
        className="absolute top-28 -right-16 w-52 h-52 pointer-events-none transition-colors duration-300"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M42.7,-72.8C55.2,-66.4,65.2,-54.6,72.8,-41.3C80.4,-28,85.6,-14,84.9,-0.4C84.2,13.2,77.6,26.4,69.5,38.6C61.4,50.8,51.8,62,39.8,69.7C27.8,77.4,13.9,81.6,-0.5,82.4C-14.9,83.3,-29.8,80.8,-42.6,73.5C-55.4,66.2,-66.1,54.1,-73.4,40.5C-80.7,26.9,-84.6,13.5,-83.4,0.7C-82.2,-12.1,-75.9,-24.2,-67.7,-34.9C-59.5,-45.6,-49.4,-54.9,-37.9,-61.8C-26.4,-68.7,-13.2,-73.2,0.7,-74.4C14.6,-75.6,30.2,-79.2,42.7,-72.8Z"
          transform="translate(100 100)"
          fill={localColor}
          fillOpacity="0.09"
        />
      </svg>

      {/* CONTENIDO SUPERIOR: Cabecera, Título y Platos */}
      <div className="relative z-10">
        {/* CABECERA: Badge del Local + Hora de Inicio */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Badge del local con su color dinámico y opcional fecha por confirmar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase inline-flex items-center gap-1.5 shadow-2xs transition-all duration-300"
              style={{
                backgroundColor: `${localColor}18`,
                color: localColor,
                border: `1px solid ${localColor}35`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: localColor }}
              />
              {event.localName.toUpperCase()}
            </span>

            {isDatePending && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                Fecha por confirmar
              </span>
            )}
          </div>

          {/* Hora de inicio o Badge Por confirmar */}
          {isTimePending ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              <span>Por confirmar</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-sm tracking-tight">
              <Clock className="w-4 h-4 opacity-80" style={{ color: localColor }} strokeWidth={2.5} />
              <span>{timeFormatted}</span>
            </div>
          )}
        </div>

        {/* Subtítulo del evento como se tenía */}
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 truncate">
          {event.title ? (event.title.toLowerCase().includes('evento') ? event.title : `Evento: ${event.title}`) : `Evento en ${event.localName}`}
        </p>

        {/* TÍTULO PRINCIPAL: Proteína en tipografía grande y destacada */}
        <div className="min-h-[64px] flex flex-col justify-center">
          <h2 className="text-[28px] font-black text-slate-900 dark:text-white leading-[1.08] tracking-tight uppercase">
            {event.dish?.proteina || event.title || 'SIN PROTEÍNA'}
          </h2>
          {/* Barra de acento con el color del local */}
          <div
            className="h-[5px] w-14 rounded-full mt-2 transition-all duration-300"
            style={{ backgroundColor: localColor }}
          />
        </div>

        {/* LISTADO DE LOS 4 PLATOS CON LETRAS GRANDES (20px) Y DIVISORES */}
        <div className="mt-4 space-y-1">
          {/* 1. Salsa */}
          <div className="flex items-center gap-3.5 py-2 border-b border-slate-100 dark:border-slate-800/60 min-h-[50px]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
              style={{
                backgroundColor: `${localColor}15`,
                border: `1px solid ${localColor}25`,
                color: localColor,
              }}
            >
              <SalsaIcon size={26} color={localColor} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[19px] sm:text-[20px] font-semibold text-slate-800 dark:text-slate-100 leading-snug tracking-tight truncate">
                {event.dish?.salsa || <span className="text-slate-400 font-normal italic text-sm">Sin salsa</span>}
              </p>
            </div>
          </div>

          {/* 2. Carbohidrato */}
          <div className="flex items-center gap-3.5 py-2 border-b border-slate-100 dark:border-slate-800/60 min-h-[50px]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
              style={{
                backgroundColor: `${localColor}15`,
                border: `1px solid ${localColor}25`,
                color: localColor,
              }}
            >
              <CarbohidratoIcon size={26} color={localColor} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[19px] sm:text-[20px] font-semibold text-slate-800 dark:text-slate-100 leading-snug tracking-tight truncate">
                {event.dish?.carbohidrato || <span className="text-slate-400 font-normal italic text-sm">Sin carbohidrato</span>}
              </p>
            </div>
          </div>

          {/* 3. Guarnición */}
          <div className="flex items-center gap-3.5 py-2 border-b border-slate-100 dark:border-slate-800/60 min-h-[50px]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
              style={{
                backgroundColor: `${localColor}15`,
                border: `1px solid ${localColor}25`,
                color: localColor,
              }}
            >
              <GuarnicionIcon size={26} color={localColor} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[19px] sm:text-[20px] font-semibold text-slate-800 dark:text-slate-100 leading-snug tracking-tight truncate">
                {event.dish?.guarnicion || <span className="text-slate-400 font-normal italic text-sm">Sin guarnición</span>}
              </p>
            </div>
          </div>

          {/* 4. Ensalada */}
          <div className="flex items-center gap-3.5 py-2 border-b border-slate-100 dark:border-slate-800/60 min-h-[50px]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors duration-300"
              style={{
                backgroundColor: `${localColor}15`,
                border: `1px solid ${localColor}25`,
                color: localColor,
              }}
            >
              <EnsaladaIcon size={26} color={localColor} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[19px] sm:text-[20px] font-semibold text-slate-800 dark:text-slate-100 leading-snug tracking-tight truncate">
                {event.dish?.ensalada || <span className="text-slate-400 font-normal italic text-sm">Sin ensalada</span>}
              </p>
            </div>
          </div>
        </div>

        {/* NOTA / DESCRIPCIÓN: Con espacio reservado homogéneo */}
        <div className="mt-3.5 pt-2 min-h-[38px] flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
          {event.description || event.notes ? (
            <>
              <MessageSquare className="w-4 h-4 shrink-0 text-slate-500 opacity-80" />
              <p className="line-clamp-2 leading-relaxed italic">
                {event.description || event.notes}
              </p>
            </>
          ) : (
            <span className="text-transparent select-none">&nbsp;</span>
          )}
        </div>
      </div>

      {/* 
        ========================================================================
        FOOTER: SERVILLETA 3D (IZQUIERDA) + N.º DE PLATOS (DERECHA)
        ========================================================================
      */}
      <div className="relative z-10 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between gap-3">
        {/* LADO IZQUIERDO: Servilleta con ícono 3D según su color real */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {servList.length === 0 ? (
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-400">Servilleta:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 shadow-2xs">
                  Por confirmar
                </span>
                {/* Recuadro para escribir a mano más amplio como se solicitó */}
                <div className="w-14 h-6 rounded-md border-2 border-amber-400 bg-white dark:bg-slate-900 shadow-2xs" title="Espacio para escribir a mano" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Ícono 3D enrollado con el color real de la servilleta */}
              <div className="shrink-0 drop-shadow-xs">
                <RolledNapkinIcon color={napkinColor} size={38} />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                  {servList.length > 1 ? 'Servilletas:' : 'Servilleta:'}
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {servList.map((s, idx) => (
                    <span
                      key={idx}
                      className="font-black text-sm text-slate-900 dark:text-white capitalize truncate"
                    >
                      {s.name}
                      {idx < servList.length - 1 && <span className="text-slate-400 font-normal"> / </span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LADO DERECHO: N.º DE PLATOS (Degustación / Pedidos / Servidos) */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
          {/* Título de sección con punto de acento del local */}
          <div className="flex items-center gap-1 pb-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: localColor }}
            />
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-wider uppercase select-none">
              N.º DE PLATOS
            </span>
          </div>

          {/* Degustación */}
          <div className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800">
            Degustación: {displayDegustacion || contratadosNum}
          </div>

          {/* Pedidos */}
          <div className="px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold text-xs border border-orange-200 dark:border-orange-800 flex items-center gap-2">
            <span>Pedidos:</span>
            {hasPedidos ? (
              <span className="font-black">{pedidosNum}</span>
            ) : (
              <span className="inline-block w-8 h-3.5 rounded border border-orange-400 bg-white dark:bg-slate-900 shadow-2xs" />
            )}
          </div>

          {/* Servidos */}
          <div className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
            <span>Servidos:</span>
            {hasServidos ? (
              <span className="font-black">{servidosNum}</span>
            ) : (
              <span className="inline-block w-8 h-3.5 rounded border border-emerald-400 bg-white dark:bg-slate-900 shadow-2xs" />
            )}
          </div>
        </div>
      </div>

      {/* Evidencia Cuaderno si existe */}
      {evidencePhoto && (
        <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => onOpenPhotoLightbox?.(evidencePhoto)}
            className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-blue-500" />
            <span>Ver Evidencia Cuaderno</span>
          </button>
        </div>
      )}
    </div>
  );
};
