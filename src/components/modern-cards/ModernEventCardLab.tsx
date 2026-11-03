import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarEvent, Local, GOOGLE_CALENDAR_COLORS } from '../../types';
import { getCachedEvents, getCachedLocales } from '../../utils/offlineStorage';
import { ModernEventCard } from './ModernEventCard';
import { EvidenceLightboxModal } from '../EvidenceLightboxModal';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Layers,
  Palette,
  Sun,
  Moon,
  Info,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

// Datos de demostración multi-local para apreciar la adaptación de color dinámico
const SAMPLE_DEMO_LOCALES: Local[] = [
  { id: 'loc-cristales', name: 'CRISTALES', colorId: 'peacock' }, // #039be5 (Azul celeste como la foto)
  { id: 'loc-villa', name: 'VILLA SANTIAGO', colorId: 'amethyst' }, // #7986cb o color propio
  { id: 'loc-aryes', name: 'ARYES', colorId: '#256a4a' }, // Verde bosque asignado a Aryes
  { id: 'loc-gladiolos', name: 'GLADIOLOS', colorId: 'tangerine' }, // #f4511e Mandarina
  { id: 'loc-estelar', name: 'ESTELAR', colorId: 'blueberry' }, // #3f51b5 Arándano
];

const SAMPLE_DEMO_EVENTS: CalendarEvent[] = [
  {
    id: 'demo-1',
    title: 'POLLO MEXICANA',
    description: 'Rrrrrr',
    startDate: '2026-10-03T04:00:00',
    endDate: '2026-10-03T12:00:00',
    allDay: false,
    colorId: 'peacock',
    localId: 'loc-cristales',
    localName: 'CRISTALES',
    status: 'confirmed',
    attendees: [],
    reminders: [],
    createdBy: 'admin',
    updatedAt: new Date().toISOString(),
    dish: {
      proteina: 'POLLO MEXICANA',
      salsa: 'Salsa de Ostión',
      carbohidrato: 'Arroz a la Jardinera',
      guarnicion: 'Piña Almíbar',
      ensalada: 'Ensalada Precocida',
      servilleta: 'lila|#9333ea',
      servilletas: ['lila|#9333ea'],
      cantidadPlatos: 900,
      platosContratados: 900,
      platosContratadosFormula: '900',
      platosConfirmados: undefined,
      platosServidos: undefined,
    },
  },
  {
    id: 'demo-2',
    title: 'POLLO ENROLLADO',
    description: 'Evento en VILLA SANTIAGO - Mesa principal cerca al estrado.',
    startDate: '2026-10-03T04:00:00',
    endDate: '2026-10-03T12:00:00',
    allDay: false,
    colorId: 'amethyst',
    localId: 'loc-villa',
    localName: 'VILLA SANTIAGO',
    status: 'confirmed',
    attendees: [],
    reminders: [],
    createdBy: 'admin',
    updatedAt: new Date().toISOString(),
    dish: {
      proteina: 'POLLO ENROLLADO',
      salsa: 'Salsa de Maracuya',
      carbohidrato: 'Arroz Turco',
      guarnicion: 'Piña Glaseada',
      ensalada: 'Ensalada Precocida',
      servilleta: 'Azul noche|#1e3a8a',
      servilletas: ['Azul noche|#1e3a8a'],
      cantidadPlatos: 135,
      platosContratados: 135,
      platosContratadosFormula: '45x3',
      platosConfirmados: undefined,
      platosServidos: undefined,
    },
  },
  {
    id: 'demo-3',
    title: 'POLLO MEXICANA',
    description: 'Rujh - Atención especial a la mesa de honor.',
    startDate: '2026-10-03T04:00:00',
    endDate: '2026-10-03T12:00:00',
    allDay: false,
    colorId: '#256a4a',
    localId: 'loc-aryes',
    localName: 'ARYES',
    status: 'confirmed',
    attendees: [],
    reminders: [],
    createdBy: 'admin',
    updatedAt: new Date().toISOString(),
    dish: {
      proteina: 'POLLO MEXICANA',
      salsa: 'Salsa de Maracuya',
      carbohidrato: 'Arroz Turco',
      guarnicion: 'Piña Almíbar',
      ensalada: 'Ensalada Fresca',
      servilleta: 'Amarillo|#eab308',
      servilletas: ['Amarillo|#eab308'],
      cantidadPlatos: 469,
      platosContratados: 469,
      platosContratadosFormula: '67x7',
      platosConfirmados: 469,
      platosServidos: 469,
    },
  },
  {
    id: 'demo-4',
    title: 'LOMO FINO EN SALSA',
    description: 'Evento corporativo de gala.',
    startDate: '2026-10-03T05:00:00',
    endDate: '2026-10-03T13:00:00',
    allDay: false,
    colorId: 'tangerine',
    localId: 'loc-gladiolos',
    localName: 'GLADIOLOS',
    status: 'confirmed',
    attendees: [],
    reminders: [],
    createdBy: 'admin',
    updatedAt: new Date().toISOString(),
    dish: {
      proteina: 'LOMO FINO EN SALSA',
      salsa: 'Salsa de Champiñones',
      carbohidrato: 'Arroz Árabe',
      guarnicion: 'Papas Rústicas',
      ensalada: 'Ensalada Fresca',
      servilleta: '',
      servilletas: [],
      cantidadPlatos: 120,
      platosContratados: 120,
      platosContratadosFormula: '30x4',
      platosConfirmados: undefined,
      platosServidos: undefined,
    },
  },
  {
    id: 'demo-5',
    title: 'ASADO TRADICIONAL',
    description: '',
    startDate: '2026-10-03T06:00:00',
    endDate: '2026-10-03T14:00:00',
    allDay: false,
    colorId: 'blueberry',
    localId: 'loc-estelar',
    localName: 'ESTELAR',
    status: 'confirmed',
    attendees: [],
    reminders: [],
    createdBy: 'admin',
    updatedAt: new Date().toISOString(),
    dish: {
      proteina: 'ASADO TRADICIONAL',
      salsa: 'Salsa Bechamel',
      carbohidrato: 'Arroz con Choclo',
      guarnicion: 'Piña Almíbar',
      ensalada: 'Ensalada Rusa',
      servilleta: 'Dorado|#d97706',
      servilletas: ['Dorado|#d97706'],
      cantidadPlatos: 405,
      platosContratados: 405,
      platosContratadosFormula: '45x9',
      platosConfirmados: 405,
      platosServidos: undefined,
    },
  },
];

export const ModernEventCardLab: React.FC = () => {
  const navigate = useNavigate();

  // 1. Estado de fuente de datos: Demo vs Calendario Real
  const [sourceMode, setSourceMode] = useState<'demo' | 'real'>('demo');
  const [filterLocal, setFilterLocal] = useState<string>('all');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') ||
      localStorage.getItem('calendario_dark_theme') === 'true';
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Selector interactivo para probar colores en vivo sobre el local seleccionado
  const [customColorOverride, setCustomColorOverride] = useState<Record<string, string>>({});

  // Cargar locales y eventos reales de la caché / app
  const cachedLocales = useMemo(() => getCachedLocales() || [], []);
  const cachedEvents = useMemo(() => getCachedEvents() || [], []);

  // Alternar tema oscuro/claro para pruebas
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('calendario_dark_theme', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('calendario_dark_theme', 'false');
    }
  };

  // Eventos a mostrar según el modo
  const activeEvents = useMemo(() => {
    const base = sourceMode === 'demo' ? SAMPLE_DEMO_EVENTS : (cachedEvents.length > 0 ? cachedEvents : SAMPLE_DEMO_EVENTS);
    
    // Aplicar overrides de color interactivo si existen
    const withColorOverrides = base.map(ev => {
      if (customColorOverride[ev.localName]) {
        return { ...ev, colorId: customColorOverride[ev.localName] };
      }
      return ev;
    });

    if (filterLocal === 'all') return withColorOverrides;
    return withColorOverrides.filter(ev => ev.localName.toUpperCase() === filterLocal.toUpperCase());
  }, [sourceMode, cachedEvents, filterLocal, customColorOverride]);

  // Lista única de locales para los filtros
  const availableLocalNames = useMemo(() => {
    const names = new Set<string>();
    SAMPLE_DEMO_LOCALES.forEach(l => names.add(l.name.toUpperCase()));
    cachedLocales.forEach(l => names.add(l.name.toUpperCase()));
    return Array.from(names);
  }, [cachedLocales]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#0e121a] text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
      {/* 
        ========================================================================
        TOP NAVIGATION / LAB HEADER BAR
        ========================================================================
      */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#151923]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Calendario</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-slate-900 dark:text-white">
                Laboratorio de Cards <span className="text-xs font-semibold px-2 py-0.5 ml-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Opción C</span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Cada local toma dinámicamente su color asignado (Villa Santiago, Cristales, Aryes, Gladiolos, Estelar)
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de control: Modo Oscuro y Toggle Demo/Real */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* 
        ========================================================================
        PANEL DE CONTROL INTERACTIVO
        ========================================================================
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-4">
        {/* Banner explicativo */}
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-950 dark:text-blue-200 space-y-1">
            <p className="font-bold text-sm">
              ✨ Nuevo Diseño Inspirado en la Referencia (Multi-Color Dinámico)
            </p>
            <p className="leading-relaxed text-blue-900/80 dark:text-blue-300/80">
              Observa cómo <strong>CRISTALES</strong> toma su color celeste/azul de la foto, mientras que <strong>VILLA SANTIAGO</strong>, <strong>ARYES</strong> (verde bosque), <strong>GLADIOLOS</strong> (mandarina) y <strong>ESTELAR</strong> (arándano) toman sus respectivos colores en las <strong>formas de fondo</strong>, el <strong>badge de local</strong>, la <strong>barra de acento</strong>, las <strong>burbujas de platos</strong> y el <strong>N.º de platos</strong>. Además, la <strong>servilleta 3D</strong> adopta el color real (lila, amarillo, azul noche, etc.).
            </p>
          </div>
        </div>

        {/* Barra de Filtros y Selector de Fuente */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#161a23] border border-slate-200 dark:border-slate-800 shadow-2xs mb-8">
          {/* Selector de Fuente: Demo Multi-Local vs Eventos Reales */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modo:</span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
              <button
                onClick={() => setSourceMode('demo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  sourceMode === 'demo'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Muestra Multi-Local</span>
              </button>
              <button
                onClick={() => setSourceMode('real')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  sourceMode === 'real'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Eventos Reales ({cachedEvents.length})</span>
              </button>
            </div>
          </div>

          {/* Filtro por Local */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrar Local:</span>
            <button
              onClick={() => setFilterLocal('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterLocal === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todos los Locales
            </button>
            {availableLocalNames.map(name => (
              <button
                key={name}
                onClick={() => setFilterLocal(name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterLocal === name
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Probador interactivo de color rápido */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" /> Probar Color para Villa:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { name: 'Peacock (Azul)', color: '#039be5' },
                { name: 'Amatista (Morado)', color: '#7986cb' },
                { name: 'Flamenco (Coral)', color: '#e67c73' },
                { name: 'Salvia (Verde)', color: '#33b679' },
                { name: 'Plátano (Amarillo)', color: '#f6bf26' },
                { name: 'Mandarina (Naranja)', color: '#f4511e' },
              ].map(opt => (
                <button
                  key={opt.color}
                  onClick={() => {
                    setCustomColorOverride(prev => ({
                      ...prev,
                      'VILLA SANTIAGO': opt.color,
                    }));
                  }}
                  title={`Asignar ${opt.name} a VILLA SANTIAGO`}
                  className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-xs hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: opt.color }}
                />
              ))}
              {customColorOverride['VILLA SANTIAGO'] && (
                <button
                  onClick={() => {
                    setCustomColorOverride(prev => {
                      const copy = { ...prev };
                      delete copy['VILLA SANTIAGO'];
                      return copy;
                    });
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 underline cursor-pointer"
                >
                  Restablecer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 
          ========================================================================
          GRILLA DE CARDS MODERNOS
          ========================================================================
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {activeEvents.map(event => (
            <ModernEventCard
              key={event.id}
              event={event}
              onOpenPhotoLightbox={(url) => setSelectedPhoto(url)}
            />
          ))}
        </div>

        {activeEvents.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-[#161a23] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-md mx-auto">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No hay eventos en esta selección
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Cambia el filtro de local o selecciona el modo "Muestra Multi-Local" para ver la galería completa.
            </p>
            <button
              onClick={() => {
                setSourceMode('demo');
                setFilterLocal('all');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Cargar Muestra Multi-Local
            </button>
          </div>
        )}
      </div>

      {/* Lightbox para evidencia fotográfica */}
      {selectedPhoto && (
        <EvidenceLightboxModal
          photoUrl={selectedPhoto}
          title="Evidencia de Cuaderno"
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
};
